"use client"

import { useState } from "react"
import Image from "next/image"
import { Lock, Mail, Loader2, ShieldCheck, TrendingUp, AlertCircle, Eye, EyeOff, Wallet, LineChart } from "lucide-react"

interface SyncGateProps {
  defaultEmail?: string
  onSynced: () => void
  onDeposit: () => void
}

const formatCurrency = (value: number): string =>
  (typeof value === "number" && !isNaN(value) ? value : 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export function SyncGate({ defaultEmail = "", onSynced, onDeposit }: SyncGateProps) {
  const [email, setEmail] = useState(defaultEmail)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsDeposit, setNeedsDeposit] = useState<{ min: number; total: number } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setNeedsDeposit(null)

    if (!email.trim() || !password) {
      setError("Preencha o e-mail e a senha da corretora.")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/robotradermax/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await response.json()

      if (response.ok && data?.ok) {
        onSynced()
        return
      }

      if (data?.error === "deposit_required") {
        setNeedsDeposit({ min: Number(data.minDeposit) || 200, total: Number(data.totalDeposited) || 0 })
        setLoading(false)
        return
      }

      setError(data?.error || "Não foi possível sincronizar a conta.")
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      {/* Cabeçalho da IA */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-2xl bg-[#22c55e]/15 ring-2 ring-[#22c55e]/40 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-[#22c55e]" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#22c55e] border-2 border-[#0a0e13] flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          </span>
        </div>
        <h1 className="text-xl font-bold text-white">Sincronizar conta</h1>
        <p className="text-sm text-white/50 text-pretty mt-1.5 max-w-xs">
          Conecte sua conta da corretora para o Robo Trader Max analisar os ativos e enviar seus sinais de entrada.
        </p>
      </div>

      {needsDeposit ? (
        (() => {
          const pct = Math.min(100, Math.max(0, (needsDeposit.total / needsDeposit.min) * 100))
          const remaining = Math.max(0, needsDeposit.min - needsDeposit.total)
          return (
            <div className="relative overflow-hidden rounded-2xl border border-[#22c55e]/25 bg-gradient-to-b from-[#0f1a14] to-[#0a0e13] p-6 text-center">
              {/* Grid tecnológico de fundo */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage:
                    "linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)",
                  backgroundSize: "22px 22px",
                }}
              />
              {/* Brilho superior */}
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full bg-[#22c55e]/20 blur-3xl"
              />

              <div className="relative">
                {/* Selo de recurso bloqueado */}
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#22c55e]/30 bg-[#22c55e]/10 px-3 py-1 mb-5">
                  <Lock className="w-3 h-3 text-[#22c55e]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#22c55e]">
                    Recurso premium bloqueado
                  </span>
                </div>

                {/* Ícone: cadeado sobre gráfico */}
                <div className="relative mx-auto mb-5 w-20 h-20">
                  <div className="absolute inset-0 rounded-2xl bg-[#22c55e]/10 ring-1 ring-[#22c55e]/30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <LineChart className="w-10 h-10 text-[#22c55e]/40" />
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 w-9 h-9 rounded-xl bg-[#0a0e13] ring-1 ring-[#22c55e]/40 flex items-center justify-center">
                    <Lock className="w-4.5 h-4.5 text-[#22c55e]" />
                  </div>
                </div>

                <h2 className="text-white font-bold text-xl tracking-tight">Ative o Robo Trader Max</h2>
                <p className="text-white/55 text-sm mt-2 text-pretty max-w-xs mx-auto leading-relaxed">
                  Faça um depósito de pelo menos{" "}
                  <span className="text-[#22c55e] font-semibold">R$ {formatCurrency(needsDeposit.min)}</span> para
                  desbloquear os sinais de entrada da inteligência artificial.
                </p>

                {/* Painel de progresso */}
                <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="flex items-center gap-1.5 text-white/45 uppercase tracking-wider font-medium">
                      <Wallet className="w-3.5 h-3.5" /> Depositado
                    </span>
                    <span className="font-mono font-bold text-[#22c55e]">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="relative h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#16a34a] to-[#22c55e] transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                    <div
                      aria-hidden
                      className="absolute inset-y-0 w-8 bg-white/20 blur-md transition-all duration-700"
                      style={{ left: `calc(${pct}% - 2rem)` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between font-mono text-sm">
                    <span className="text-white font-semibold tabular-nums">
                      R$ {formatCurrency(needsDeposit.total)}
                    </span>
                    <span className="text-white/35 tabular-nums">
                      meta R$ {formatCurrency(needsDeposit.min)}
                    </span>
                  </div>
                  {remaining > 0 && (
                    <p className="mt-2 text-[11px] text-white/40">
                      Faltam <span className="text-white/70 font-semibold">R$ {formatCurrency(remaining)}</span> para
                      liberar
                    </p>
                  )}
                </div>

                <button
                  onClick={onDeposit}
                  className="group mt-5 w-full py-3.5 rounded-xl bg-[#22c55e] text-[#04120a] font-bold hover:brightness-110 transition flex items-center justify-center gap-2 shadow-[0_8px_24px_-8px_rgba(34,197,94,0.6)]"
                >
                  <Wallet className="w-5 h-5" />
                  Fazer depósito
                </button>
                <button
                  onClick={() => setNeedsDeposit(null)}
                  className="mt-2 w-full py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 text-sm font-semibold transition"
                >
                  Voltar
                </button>
              </div>
            </div>
          )
        })()
      ) : (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-[#0f1419] p-6">
          {/* E-mail */}
          <label className="block text-white/50 text-xs mb-1.5">E-mail da corretora</label>
          <div className="relative mb-4">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              className="w-full py-3 pl-10 pr-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#22c55e] transition"
            />
          </div>

          {/* Senha */}
          <label className="block text-white/50 text-xs mb-1.5">Senha da corretora</label>
          <div className="relative mb-4">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full py-3 pl-10 pr-11 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#22c55e] transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 p-3">
              <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
              <p className="text-[#EF4444] text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#22c55e] text-[#04120a] font-bold hover:brightness-110 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                Sincronizar e liberar IA
              </>
            )}
          </button>

          <p className="text-white/30 text-xs text-center mt-4 text-pretty">
            Suas credenciais são usadas apenas para confirmar a titularidade da conta. Não armazenamos sua senha.
          </p>
        </form>
      )}
    </div>
  )
}
