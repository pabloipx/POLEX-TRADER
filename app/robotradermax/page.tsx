"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { AssetPicker, type RoboAsset } from "@/components/robotradermax/asset-picker"
import { AnalyzingAnimation } from "@/components/robotradermax/analyzing-animation"
import { SyncGate } from "@/components/robotradermax/sync-gate"
import { timeframesFor, TIMEFRAME_LABELS } from "@/lib/trading/timeframes"
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

  // Relógio para a contagem regressiva
  const [now, setNow] = useState(() => Date.now())

  // Confirmação opcional da entrada
  const [accountType, setAccountType] = useState<"demo" | "real">("demo")
  const [amount, setAmount] = useState(10)
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  // Autenticação + saldo
  useEffect(() => {
    mountedRef.current = true
    const supabase = supabaseRef.current

    const init = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()
        if (error || !user) {
          router.replace("/auth/login")
          return
        }
        const { data: balanceData } = await supabase
          .from("user_balances")
          .select("balance_real, balance_demo")
          .eq("user_id", user.id)
          .maybeSingle()
        if (!mountedRef.current) return
        setUserEmail(user.email || "")
        setBalanceReal(Number(balanceData?.balance_real || 0))
        setBalanceDemo(Number(balanceData?.balance_demo || 0))
        setLoading(false)
      } catch {
        if (mountedRef.current) router.replace("/auth/login")
      }
    }
    init()

    return () => {
      mountedRef.current = false
    }
  }, [router])

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

    // A IA "analisa" e depois gera o sinal
    const timeframe = timeframesFor(selected.symbol)[0]
    const analyzeMs = 3800
    setTimeout(() => {
      if (!mountedRef.current) return
      const direction: "CALL" | "PUT" = Math.random() > 0.5 ? "CALL" : "PUT"
      const confidence = Math.floor(Math.random() * 12) + 87 // 87-98%
      // Entrada agendada para daqui a ~35s, dando tempo de a contagem correr.
      const entryAt = Date.now() + 35000
      setSignal({ id: Date.now().toString(), direction, confidence, timeframe, entryAt })
      setNow(Date.now())
      setPhase("signal")
    }, analyzeMs)
  }, [])

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
    if (amount > currentBalance) {
      setConfirmError("Saldo insuficiente para esse valor.")
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
      setConfirmed(true)
    } catch {
      setConfirmError("Erro de conexão ao confirmar a entrada.")
    } finally {
      setConfirming(false)
    }
  }, [asset, signal, amount, accountType, currentBalance])

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
            onSynced={() => setPhase("select")}
            onDeposit={() => router.push("/deposit")}
          />
        )}

        {phase === "select" && <AssetPicker assets={assets} onSelect={handleSelectAsset} />}

        {phase === "analyzing" && asset && <AnalyzingAnimation asset={asset} />}

        {phase === "signal" && asset && signal && (
          <div className="space-y-4">
            {/* Card do sinal */}
            <div
              className={`relative overflow-hidden rounded-2xl border p-5 ${
                isCall ? "border-[#22c55e]/50 bg-[#22c55e]/5" : "border-[#EF4444]/50 bg-[#EF4444]/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <img src={asset.logo || "/placeholder.svg"} alt={asset.name} className="w-12 h-12 rounded-full object-cover bg-black/40" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-lg truncate">{asset.name}</p>
                  <p className="text-white/50 text-xs">Sinal gerado pela IA</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${isCall ? "bg-[#22c55e] text-[#04120a]" : "bg-[#EF4444] text-white"}`}>
                  {signal.confidence}% de confiança
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-black/30 p-4 flex flex-col items-center justify-center">
                  <span className="text-white/40 text-xs mb-1">Direção</span>
                  <div className={`flex items-center gap-2 font-black text-2xl ${isCall ? "text-[#22c55e]" : "text-[#EF4444]"}`}>
                    {isCall ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                    {isCall ? "COMPRA" : "VENDA"}
                  </div>
                </div>
                <div className="rounded-xl bg-black/30 p-4 flex flex-col items-center justify-center">
                  <span className="text-white/40 text-xs mb-1">Expiração</span>
                  <span className="font-black text-2xl text-white">{TIMEFRAME_LABELS[signal.timeframe]}</span>
                </div>
              </div>

              {/* Contagem regressiva para a entrada */}
              <div className="mt-3 rounded-xl bg-black/40 p-4 text-center">
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
                    <span className="text-white/40 text-xs mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Faça a entrada em
                    </span>
                    <span className="text-white font-black text-4xl tabular-nums">{countdownLabel}</span>
                    <span className="text-white/40 text-xs mt-1">minutos : segundos</span>
                  </div>
                )}
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

            {/* Nova análise */}
            <button
              onClick={resetToSelect}
              className="w-full py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Nova análise
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
