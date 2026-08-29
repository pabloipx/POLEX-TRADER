import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { AUTH_CODE_TTL_SECONDS, parseScopes, randomToken, sha256 } from "@/lib/oauth"

const consentSchema = z.object({
  client_id: z.string().min(8).max(128), redirect_uri: z.string().url().max(2048),
  state: z.string().min(8).max(512), scope: z.string().min(1).max(200),
  code_challenge: z.string().min(43).max(128), code_challenge_method: z.literal("S256"),
  decision: z.enum(["allow", "deny"]), max_trade_amount: z.coerce.number().positive().max(1000),
  allowed_symbols: z.string().max(1000).default(""),
})

function redirectWithError(uri: string, state: string, error: string) {
  const target = new URL(uri)
  target.searchParams.set("error", error)
  target.searchParams.set("state", state)
  return NextResponse.redirect(target)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 })

  const parsed = consentSchema.safeParse(Object.fromEntries((await request.formData()).entries()))
  if (!parsed.success) return NextResponse.json({ error: "Solicitação inválida." }, { status: 400 })
  const input = parsed.data
  const scopes = parseScopes(input.scope)
  if (!scopes) return NextResponse.json({ error: "Escopo inválido." }, { status: 400 })

  const admin = createAdminClient()
  const { data: client } = await admin.from("oauth_clients").select("redirect_uris,active").eq("client_id", input.client_id).maybeSingle()
  if (!client?.active || !client.redirect_uris.includes(input.redirect_uri)) {
    return NextResponse.json({ error: "Cliente OAuth inválido." }, { status: 400 })
  }
  if (input.decision === "deny") return redirectWithError(input.redirect_uri, input.state, "access_denied")

  const symbols = [...new Set(input.allowed_symbols.split(",").map((value) => value.trim().toUpperCase()).filter(Boolean))]
  const { error: consentError } = await admin.from("oauth_consents").upsert({
    user_id: user.id, client_id: input.client_id, scopes, max_trade_amount: input.max_trade_amount,
    daily_loss_limit: null, allowed_symbols: symbols, active: true, revoked_at: null,
  }, { onConflict: "user_id,client_id" })
  if (consentError) return NextResponse.json({ error: "Não foi possível registrar o consentimento." }, { status: 500 })

  const code = randomToken(48)
  const { error: codeError } = await admin.from("oauth_authorization_codes").insert({
    code_hash: sha256(code), client_id: input.client_id, user_id: user.id, redirect_uri: input.redirect_uri,
    scopes, code_challenge: input.code_challenge, expires_at: new Date(Date.now() + AUTH_CODE_TTL_SECONDS * 1000).toISOString(),
  })
  if (codeError) return NextResponse.json({ error: "Não foi possível emitir a autorização." }, { status: 500 })

  const target = new URL(input.redirect_uri)
  target.searchParams.set("code", code)
  target.searchParams.set("state", input.state)
  return NextResponse.redirect(target)
}
