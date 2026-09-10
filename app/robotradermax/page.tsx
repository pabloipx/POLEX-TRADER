"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { AssetPicker, type RoboAsset, type RoboConfig } from "@/components/robotradermax/asset-picker"
import { AnalyzingAnimation } from "@/components/robotradermax/analyzing-animation"
import { SyncGate } from "@/components/robotradermax/sync-gate"
import { ExecutionOverlay } from "@/components/robotradermax/execution-overlay"
import { normalizeTimeframe, TIMEFRAME_LABELS } from "@/lib/trading/timeframes"
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Clock,
  RefreshCw,
  Wallet,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Activity,
  Cpu,
  Zap,
} from "lucide-react"

type Phase = "gate" | "select" | "analyzing" | "signal"

interface RoboSignal {
  id: string
  direction: "CALL" | "PUT"
  confidence: number
  timeframe: number
  entryAt: number
}

const FALLBACK_ASSETS: RoboAsset[] = [
  { symbol: "EURUSD_OTC", name: "EUR/USD (OTC)", category: "forex", payout: 96, logo: "/images/a1640800-8419-484d-9351.jpeg", market: "otc" },
  { symbol: "GBPUSD_OTC", name: "GBP/USD (OTC)", category: "forex", payout: 96, logo: "/images/5c13c1c5-2d6b-4006-b117.jpeg", market: "otc" },
  { symbol: "USDJPY_OTC", name: "USD/JPY (OTC)", category: "forex", payout: 96, logo: "/images/06fd67b4-821f-4dad-9daf.jpeg", market: "otc" },
  { symbol: "AUDUSD_OTC", name: "AUD/USD (OTC)", category: "forex", payout: 96, logo: "/images/82329959-774d-46ff-b731.jpeg", market: "otc" },
  { symbol: "BTCUSD_OTC", name: "BTC/USD (OTC)", category: "crypto", payout: 96, logo: "/images/a8ba8d63-a559-42c6-955c.jpeg", market: "otc" },
]

// Janela em que a entrada continua "válida" após o horário marcado (o usuário ainda pode confirmar).
const ENTRY_GRACE_MS = 20000

const formatCurrency = (value: number): string =>
  (typeof value === "number" && !isNaN(value) ? value : 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export default function RoboTraderMaxPage() {
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const mountedRef = useRef(true)

  const [loading, setLoading] = useState(true)
  const [assets, setAssets] = useState<RoboAsset[]>(FALLBACK_ASSETS)
  const [balanceReal, setBalanceReal] = useState(0)
  const [balanceDemo, setBalanceDemo] = useState(0)

  const [phase, setPhase] = useState<Phase>("gate")
  const [userEmail, setUserEmail] = useState("")
  const [asset, setAsset] = useState<RoboAsset | null>(null)
  const [signal, setSignal] = useState<RoboSignal | null>(null)
  const [config, setConfig] = useState<RoboConfig>({ model: "openai", strategy: "smart", expiration: 60 })

  // Relógio para a contagem regressiva
  const [now, setNow] = useState(() => Date.now())

  // Confirmação opcional da entrada
  const [accountType, setAccountType] = useState<"demo" | "real">("demo")
  const [amount, setAmount] = useState(10)
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [executing, setExecuting] = useState(false)

  // Carrega usuário + saldo se houver sessão. Não redireciona: o próprio gate faz o login da corretora.
  const loadUserData = useCallback(async () => {
    const supabase = supabaseRef.current
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false
    const { data: balanceData } = await supabase
      .from("user_balances")
      .select("balance_real, balance_demo")
      .eq("user_id", user.id)
      .maybeSingle()
    if (!mountedRef.current) return true
    setUserEmail(user.email || "")
    setBalanceReal(Number(balanceData?.balance_real || 0))
    setBalanceDemo(Number(balanceData?.balance_demo || 0))
    return true
  }, [])

  // Autenticação + saldo
  useEffect(() => {
    mountedRef.current = true
    loadUserData().finally(() => {
      if (mountedRef.current) setLoading(false)
    })

    return () => {
      mountedRef.current = false
    }
  }, [loadUserData])

  // Carrega ativos habilitados pelo admin
  useEffect(() => {
    let cancelled = false
    fetch("/api/assets/enabled")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !Array.isArray(data?.assets) || data.assets.length === 0) return
        setAssets(data.assets)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // Tick de 1s apenas na fase de sinal (para a contagem regressiva)
  useEffect(() => {
    if (phase !== "signal") return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [phase])

  const currentBalance = accountType === "demo" ? balanceDemo : balanceReal

  const handleSelectAsset = useCallback((selected: RoboAsset) => {
    setAsset(selected)
    setSignal(null)
    setConfirmed(false)
    setConfirmError(null)
    setPhase("analyzing")

    // Expiração escolhida pelo usuário, ajustada para uma duração válida no símbolo.
    const timeframe = normalizeTimeframe(selected.symbol, config.expiration)

    const confidenceRange = { min: 85, span: 11 }

    const analyzeMs = 3800
    setTimeout(() => {
      if (!mountedRef.current) return
      const direction: "CALL" | "PUT" = Math.random() > 0.5 ? "CALL" : "PUT"
      const confidence = Math.floor(Math.random() * confidenceRange.span) + confidenceRange.min
      // Entrada agendada para daqui a ~35s, dando tempo de a contagem correr.
      const entryAt = Date.now() + 35000
      setSignal({ id: Date.now().toString(), direction, confidence, timeframe, entryAt })
      setNow(Date.now())
      setPhase("signal")
    }, analyzeMs)
  }, [config])

  const resetToSelect = useCallback(() => {
    setPhase("select")
    setAsset(null)
    setSignal(null)
    setConfirmed(false)
    setConfirmError(null)
  }, [])

  // Estado da janela de entrada
  const entryState = useMemo(() => {
    if (!signal) return { remainingMs: 0, live: false, expired: false }
    const remainingMs = signal.entryAt - now
    const live = remainingMs <= 0 && now <= signal.entryAt + ENTRY_GRACE_MS
    const expired = now > signal.entryAt + ENTRY_GRACE_MS
    return { remainingMs: Math.max(0, remainingMs), live, expired }
  }, [signal, now])

  const countdownLabel = useMemo(() => {
    const totalSec = Math.ceil(entryState.remainingMs / 1000)
    const mm = Math.floor(totalSec / 60)
    const ss = totalSec % 60
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
  }, [entryState.remainingMs])

  const handleConfirmEntry = useCallback(async () => {
    if (!asset || !signal) return
    setConfirmError(null)

    if (!Number.isFinite(amount) || amount < 1) {
      setConfirmError("Informe um valor de pelo menos R$ 1,00.")
      return
    }

    setConfirming(true)
    try {
      const response = await fetch("/api/trade/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: asset.symbol,
          direction: signal.direction,
          amount,
          timeframe: signal.timeframe,
          isDemo: accountType === "demo",
          idempotencyKey: crypto.randomUUID(),
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setConfirmError(data?.error || "Não foi possível confirmar a entrada.")
        setConfirming(false)
        return
      }
      const newBalance = Number(data.newBalance)
      if (accountType === "demo") setBalanceDemo(newBalance)
      else setBalanceReal(newBalance)
      setExecuting(true)
    } catch {
      setConfirmError("Erro de conexão ao confirmar a entrada.")
    } finally {
      setConfirming(false)
    }
  }, [asset, signal, amount, accountType])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0a0e13" }}>
        <Loader2 className="w-8 h-8 text-[#22c55e] animate-spin" />
      </div>
    )
  }

  const isCall = signal?.direction === "CALL"

  return (
    <main className="min-h-screen text-white" style={{ backgroundColor: "#0a0e13" }}>
      {/* Cabeçalho */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0a0e13]/90 backdrop-blur">
        <div className="mx-auto max-w-2xl flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.push("/trade")}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
            aria-label="Voltar para o trader"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>
          <Image src="/images/fidelity-logo.png" alt="Fidex Option" width={120} height={28} className="h-7 w-auto object-contain" />
          <div className="ml-auto flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-xs font-medium text-white/70">Robo Trader Max</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Banner de identidade da IA */}
        {phase !== "gate" && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-[#22c55e]/20 bg-gradient-to-br from-[#22c55e]/10 via-[#0f1419] to-[#0a0e13]">
          <div className="flex flex-col items-center gap-4 p-6 text-center">
            <Image
              src="/images/trader-max-logo.png"
              alt="Trader Max"
              width={280}
              height={130}
              priority
              className="h-20 w-auto object-contain drop-shadow-[0_0_25px_rgba(34,197,94,0.35)]"
            />
            <p className="max-w-md text-sm text-white/50 text-pretty">
              Inteligência artificial que analisa o ativo e envia o sinal de entrada para você operar na corretora.
            </p>
          </div>
        </div>
        )}

        {/* Conteúdo por fase */}
        {phase === "gate" && (
          <SyncGate
            defaultEmail={userEmail}
            onSynced={async () => {
              await loadUserData()
              setPhase("select")
            }}
            onDeposit={() => router.push("/deposit")}
          />
        )}

        {phase === "select" && (
          <AssetPicker assets={assets} config={config} onConfigChange={setConfig} onSelect={handleSelectAsset} />
        )}

        {phase === "analyzing" && asset && <AnalyzingAnimation asset={asset} />}

        {phase === "signal" && asset && signal && (
          <div className="space-y-4">
            {/* Card do sinal - HUD tecnológico */}
            <div
              className="rtm-border-pulse relative overflow-hidden rounded-2xl border bg-[#0b1016] p-5"
              style={
                {
                  borderColor: isCall ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)",
                  "--rtm-glow": isCall ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)",
                } as React.CSSProperties
              }
            >
              {/* Camadas tecnológicas de fundo */}
              <div className="pointer-events-none absolute inset-0 rtm-grid opacity-70" />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: isCall
                    ? "radial-gradient(circle at 50% 0%, rgba(34,197,94,0.14), transparent 60%)"
                    : "radial-gradient(circle at 50% 0%, rgba(239,68,68,0.14), transparent 60%)",
                }}
              />
              <div
                className="rtm-scan pointer-events-none absolute inset-x-0 top-0 h-16 opacity-40"
                style={{
                  background: isCall
                    ? "linear-gradient(to bottom, rgba(34,197,94,0.35), transparent)"
                    : "linear-gradient(to bottom, rgba(239,68,68,0.35), transparent)",
                }}
              />

              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={asset.logo || "/placeholder.svg"}
                      alt={asset.name}
                      className="w-12 h-12 rounded-full object-cover bg-black/40 ring-2"
                      style={{ boxShadow: isCall ? "0 0 18px -4px rgba(34,197,94,0.6)" : "0 0 18px -4px rgba(239,68,68,0.6)" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-lg truncate">{asset.name}</p>
                    <p className="text-white/50 text-xs flex items-center gap-1.5">
                      <Cpu className="w-3 h-3 text-[#22c55e]" />
                      Sinal gerado pela IA
                    </p>
                  </div>
                  <div
                    className={`rtm-badge-pulse px-3 py-1 rounded-full text-xs font-bold ${
                      isCall ? "bg-[#22c55e] text-[#04120a]" : "bg-[#EF4444] text-white"
                    }`}
                  >
                    {signal.confidence}% de confiança
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="relative overflow-hidden rounded-xl border border-white/5 bg-black/40 p-4 flex flex-col items-center justify-center">
                    <span className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Direção</span>
                    <div className={`flex items-center gap-2 font-black text-2xl ${isCall ? "text-[#22c55e]" : "text-[#EF4444]"}`}>
                      {isCall ? (
                        <TrendingUp className="rtm-arrow-up w-6 h-6" />
                      ) : (
                        <TrendingDown className="rtm-arrow-down w-6 h-6" />
                      )}
                      {isCall ? "COMPRA" : "VENDA"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-black/40 p-4 flex flex-col items-center justify-center">
                    <span className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Expiração</span>
                    <span className="font-black text-2xl text-white">{TIMEFRAME_LABELS[signal.timeframe]}</span>
                  </div>
                </div>

                {/* Contagem regressiva para a entrada */}
                <div className="mt-3 rounded-xl border border-white/5 bg-black/50 p-4 text-center">
                  {entryState.expired ? (
                    <p className="text-white/60 text-sm">Tempo da entrada expirou. Gere uma nova análise.</p>
                  ) : entryState.live ? (
                    <div className="flex flex-col items-center">
                      <span className="text-[#22c55e] text-xs font-semibold mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                        HORA DE ENTRAR AGORA
                      </span>
                      <span className="text-[#22c55e] font-black text-3xl tabular-nums">00:00</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-white/40 text-xs mb-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Faça a entrada em
                      </span>
                      <span
                        className="font-black text-4xl tabular-nums"
                        style={{
                          color: isCall ? "#22c55e" : "#ef4444",
                          textShadow: isCall ? "0 0 24px rgba(34,197,94,0.45)" : "0 0 24px rgba(239,68,68,0.45)",
                        }}
                      >
                        {countdownLabel}
                      </span>
                      <span className="text-white/40 text-[10px] uppercase tracking-widest mt-1">minutos : segundos</span>
                      {/* Barra de progresso com shimmer */}
                      <div className="mt-3 h-1 w-full max-w-[220px] overflow-hidden rounded-full bg-white/10">
                        <div
                          className="relative h-full w-full"
                          style={{ background: isCall ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)" }}
                        >
                          <div
                            className="rtm-shimmer absolute inset-y-0 w-1/3"
                            style={{
                              background: isCall
                                ? "linear-gradient(90deg, transparent, #22c55e, transparent)"
                                : "linear-gradient(90deg, transparent, #ef4444, transparent)",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Confirmação opcional com valor */}
            {!confirmed ? (
              <div className="rounded-2xl border border-white/10 bg-[#0f1419] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Confirmar entrada (opcional)</h3>
                  <div className="flex items-center gap-1.5 text-white/40 text-xs">
                    <Wallet className="w-3.5 h-3.5" />
                    R$ {formatCurrency(currentBalance)}
                  </div>
                </div>

                {/* Tipo de conta */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => setAccountType("demo")}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                      accountType === "demo" ? "bg-[#22c55e] text-[#04120a]" : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    Conta Demo
                  </button>
                  <button
                    onClick={() => setAccountType("real")}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                      accountType === "real" ? "bg-[#22c55e] text-[#04120a]" : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    Conta Real
                  </button>
                </div>

                {/* Valor */}
                <label className="block text-white/50 text-xs mb-1.5">Valor da entrada</label>
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => setAmount((v) => Math.max(1, Math.round((v - 5) * 100) / 100))}
                    className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xl font-bold transition"
                    aria-label="Diminuir valor"
                  >
                    −
                  </button>
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">R$</span>
                    <input
                      type="number"
                      min={1}
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full text-center py-2.5 pl-9 pr-3 bg-black/40 border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-[#22c55e] transition"
                    />
                  </div>
                  <button
                    onClick={() => setAmount((v) => Math.round((v + 5) * 100) / 100)}
                    className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xl font-bold transition"
                    aria-label="Aumentar valor"
                  >
                    +
                  </button>
                </div>

                {confirmError && <p className="text-[#EF4444] text-sm mb-3 text-center">{confirmError}</p>}

                <button
                  onClick={handleConfirmEntry}
                  disabled={confirming || entryState.expired}
                  className={`w-full py-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 ${
                    isCall ? "bg-[#22c55e] text-[#04120a] hover:brightness-110" : "bg-[#EF4444] text-white hover:brightness-110"
                  }`}
                >
                  {confirming ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    <>
                      Confirmar entrada de {isCall ? "COMPRA" : "VENDA"}
                    </>
                  )}
                </button>
                <p className="text-white/30 text-xs text-center mt-3 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Você também pode usar o sinal manualmente na tela do trader.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#22c55e]/40 bg-[#22c55e]/10 p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-[#22c55e] mx-auto mb-3" />
                <p className="text-white font-bold text-lg">Entrada confirmada!</p>
                <p className="text-white/60 text-sm mt-1">
                  Sua operação de {isCall ? "COMPRA" : "VENDA"} em {asset.name} foi aberta na conta {accountType === "demo" ? "demo" : "real"}.
                </p>
                <button
                  onClick={() => router.push("/trade")}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#22c55e] text-[#04120a] font-bold hover:brightness-110 transition"
                >
                  Acompanhar no trader
                </button>
              </div>
            )}

            {/* Nova análise — só aparece quando o tempo da entrada expira */}
            {entryState.expired && (
              <button
                onClick={resetToSelect}
                className="w-full py-3 rounded-xl border border-[#22c55e]/40 bg-[#22c55e]/10 hover:bg-[#22c55e]/20 text-[#22c55e] font-semibold transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Nova análise
              </button>
            )}
          </div>
        )}
      </div>

      {/* Animação de execução da entrada */}
      {executing && signal && asset && (
        <ExecutionOverlay
          direction={signal.direction}
          assetName={asset.name}
          amount={amount}
          accountLabel={accountType === "demo" ? "Demo" : "Real"}
          onDone={() => {
            setExecuting(false)
            setConfirmed(true)
          }}
        />
      )}
    </main>
  )
}
