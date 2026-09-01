import { mkdir, writeFile } from "node:fs/promises"
import { randomBytes, randomUUID } from "node:crypto"
import process from "node:process"
import { createClient } from "@supabase/supabase-js"
import { Metrics, measured } from "./metrics.mjs"

const mode = process.argv[2] ?? "full"
const target = (process.env.RESILIENCE_TARGET_URL ?? "http://localhost:3000").replace(/\/$/, "")
const maxUsers = Math.min(Number(process.env.RESILIENCE_MAX_USERS ?? 50), 50)
const runId = `res-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}-${randomBytes(3).toString("hex")}`
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const chaosKey = process.env.ADMIN_SESSION_SECRET

if (!url || !anonKey || !serviceKey) throw new Error("Variáveis Supabase ausentes.")
if (/vercel\.app|https:\/\//i.test(target) && process.env.RESILIENCE_ALLOW_REMOTE !== "true") {
  throw new Error("Alvo remoto bloqueado. Use local ou defina RESILIENCE_ALLOW_REMOTE=true conscientemente.")
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
const users = []
const metrics = new Metrics()
const checks = []
const note = (name, ok, details = {}) => checks.push({ name, ok, ...details })

async function provision(count = Math.min(5, maxUsers)) {
  for (let index = 0; index < count; index++) {
    const email = `${runId}-${index}@resilience.invalid`
    const password = `${randomBytes(18).toString("base64url")}aA1!`
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { resilience_run_id: runId } })
    if (error) throw error
    const userId = data.user.id
    await admin.from("profiles").upsert({ id: userId, email, full_name: `Resilience ${runId}` })
    const { error: balanceError } = await admin.from("user_balances").upsert({ user_id: userId, balance_demo: 10_000, balance_real: 0, balance: 0, currency: "BRL" }, { onConflict: "user_id" })
    if (balanceError) throw balanceError
    const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const { error: loginError } = await client.auth.signInWithPassword({ email, password })
    if (loginError) throw loginError
    users.push({ userId, client })
  }
}

async function publicProbe() {
  return fetch(`${target}/api/health`, { signal: AbortSignal.timeout(5_000) })
}

async function loadPhase(concurrency) {
  await Promise.all(Array.from({ length: concurrency }, async (_, index) => {
    const account = users[index % users.length]
    await measured(metrics, "public-price", publicProbe)
    await measured(metrics, "demo-balance", () => account.client.from("user_balances").select("balance_demo,balance_real").eq("user_id", account.userId).single())
  }))
}

async function loadTest() {
  for (const concurrency of [1, 10, 25, maxUsers].filter((value, index, values) => value <= maxUsers && values.indexOf(value) === index)) {
    await loadPhase(concurrency)
  }
  const summary = metrics.summary()
  note("taxa de sucesso >= 99%", summary.successRate >= 0.99, { actual: summary.successRate })
  note("p95 <= 2s", summary.latencyMs.p95 <= 2_000, { actualMs: summary.latencyMs.p95 })
  note("nenhum 5xx", !Object.keys(summary.statuses).some((status) => status.startsWith("5")), { statuses: summary.statuses })
}

async function atomicTest() {
  const { data: asset, error: assetError } = await admin.from("otc_symbols").select("symbol,base_price").eq("is_active", true).limit(1).single()
  if (assetError || !asset) throw assetError ?? new Error("Nenhum ativo OTC ativo.")
  const account = users[0]
  const key = randomUUID()
  const args = { p_symbol: asset.symbol, p_direction: "CALL", p_amount: 10, p_timeframe: 60, p_entry_price: Number(asset.base_price), p_is_demo: true, p_idempotency_key: key }
  const before = await admin.from("user_balances").select("balance_demo").eq("user_id", account.userId).single()
  const [first, replay] = await Promise.all([account.client.rpc("open_trade_atomic", args), account.client.rpc("open_trade_atomic", args)])
  const after = await admin.from("user_balances").select("balance_demo").eq("user_id", account.userId).single()
  const trades = await admin.from("trades").select("id,result,amount").eq("user_id", account.userId)
  const delta = Number(before.data?.balance_demo) - Number(after.data?.balance_demo)
  note("RPC de abertura disponível", !first.error && !replay.error, { errors: [first.error?.message, replay.error?.message].filter(Boolean) })
  note("uma operação por chave idempotente", trades.data?.length === 1, { rows: trades.data?.length ?? 0 })
  note("um único débito", Math.abs(delta - 10) < 0.001, { delta })
  note("saldo demo não negativo", Number(after.data?.balance_demo) >= 0, { balance: after.data?.balance_demo })
}

async function setFault(name, faultMode) {
  if (!chaosKey) throw new Error("ADMIN_SESSION_SECRET ausente para controlar falhas.")
  return fetch(`${target}/api/test/faults`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-resilience-key": chaosKey },
    body: JSON.stringify(name ? { name, mode: faultMode } : { reset: true }),
    signal: AbortSignal.timeout(5_000),
  })
}

async function faultTest() {
  const started = Date.now()
  const enabled = await setFault("quote", "error")
  note("injeção de falha protegida e habilitada", enabled.ok, { status: enabled.status })
  await setFault(null, null)
  let recovered = false
  for (let attempt = 0; attempt < 10; attempt++) {
    const response = await publicProbe().catch(() => null)
    if (response?.ok) { recovered = true; break }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  note("recuperação automática", recovered, { recoveryMs: Date.now() - started })
}

async function cleanup() {
  await setFault(null, null).catch(() => undefined)
  for (const user of users) await admin.auth.admin.deleteUser(user.userId).catch(() => undefined)
  const remaining = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("full_name", `Resilience ${runId}`)
  note("limpeza total", remaining.count === 0, { remaining: remaining.count })
}

async function main() {
  try {
    await provision()
    if (["load", "full"].includes(mode)) await loadTest()
    if (["recovery", "full"].includes(mode)) await atomicTest()
    if (["faults", "full"].includes(mode)) await faultTest()
  } catch (error) {
    note("execução sem falha fatal", false, { error: error instanceof Error ? error.message : "Erro desconhecido" })
  } finally {
    await cleanup()
    const report = { runId, mode, target, generatedAt: new Date().toISOString(), configuration: { maxUsers }, metrics: metrics.summary(), checks, passed: checks.every((check) => check.ok) }
    await mkdir("artifacts/resilience", { recursive: true })
    const path = `artifacts/resilience/${runId}.json`
    await writeFile(path, JSON.stringify(report, null, 2))
    console.log(JSON.stringify({ report: path, passed: report.passed, metrics: report.metrics, checks }, null, 2))
    if (!report.passed) process.exitCode = 1
  }
}

await main()
