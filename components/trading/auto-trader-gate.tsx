"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { X, Lock, Eye, EyeOff, Cpu, ShieldCheck, Wifi, Check } from "lucide-react"

const AI_PASSWORD = "autotradervip"

const PHASES = [
  { label: "Verificando credenciais", icon: ShieldCheck },
  { label: "Estabelecendo conexão segura", icon: Lock },
  { label: "Sincronizando com o servidor da IA", icon: Wifi },
  { label: "Carregando modelos de análise", icon: Cpu },
  { label: "Conexão estabelecida", icon: Check },
]

const CONNECT_MS = 4000

export function AutoTraderGate({
  onClose,
  onActivated,
}: {
  onClose: () => void
  onActivated: () => void
}) {
  const [step, setStep] = useState<"password" | "connecting">("password")
  const [pw, setPw] = useState("")
  const [show, setShow] = useState(false)
  const [error, setError] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (step === "password") inputRef.current?.focus()
  }, [step])

  const submit = () => {
    if (pw.trim().toLowerCase() === AI_PASSWORD) {
      setError(false)
      setStep("connecting")
    } else {
      setError(true)
      setPw("")
      inputRef.current?.focus()
    }
  }

  useEffect(() => {
    if (step !== "connecting") return
    const start = Date.now()
    const id = window.setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / CONNECT_MS) * 100)
      setProgress(p)
      if (p >= 100) window.clearInterval(id)
    }, 40)
    const done = window.setTimeout(() => onActivated(), CONNECT_MS + 350)
    return () => {
      window.clearInterval(id)
      window.clearTimeout(done)
    }
  }, [step, onActivated])

  const phaseIdx = Math.min(PHASES.length - 1, Math.floor((progress / 100) * PHASES.length))

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => step === "password" && onClose()}
        aria-hidden
      />

      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-[#22c55e]/30 bg-gradient-to-b from-[#141a24] to-[#0a0d13] shadow-[0_20px_80px_rgba(0,0,0,0.8)]">
        {/* grade de fundo */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              "linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
          aria-hidden
        />

        {step === "password" && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Mascote */}
        <div className="relative flex flex-col items-center px-6 pt-8">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <span className="absolute h-24 w-24 rounded-full bg-[#22c55e]/25 blur-2xl animate-pulse" aria-hidden />
            {step === "connecting" && (
              <>
                <span className="rtm-radar absolute h-28 w-28 rounded-full border border-[#22c55e]/50" aria-hidden />
                <span
                  className="rtm-radar absolute h-28 w-28 rounded-full border border-[#22c55e]/30"
                  style={{ animationDelay: "0.8s" }}
                  aria-hidden
                />
              </>
            )}
            <Image
              src="/auto-trader-mascot.png"
              alt="Auto Trader"
              width={112}
              height={112}
              priority
              className="relative h-24 w-24 object-contain drop-shadow-[0_8px_28px_rgba(34,197,94,0.5)] animate-[kaykoFloat_3.4s_ease-in-out_infinite]"
            />
          </div>
          <h3 className="mt-2 text-2xl font-extrabold leading-none text-white">
            AUTO <span className="text-[#22c55e]">TRADER</span>
          </h3>
        </div>

        {step === "password" ? (
          <div className="relative space-y-4 p-6">
            <p className="text-center text-sm text-white/60">
              Digite a senha de acesso para ativar a IA de análise.
            </p>

            <div>
              <div
                className={`flex items-center gap-2 rounded-2xl border bg-black/40 px-4 py-3.5 transition ${
                  error ? "border-[#ef4444]/60" : "border-[#22c55e]/30 focus-within:border-[#22c55e]/70"
                }`}
              >
                <Lock className={`h-5 w-5 ${error ? "text-[#ef4444]" : "text-[#22c55e]"}`} />
                <input
                  ref={inputRef}
                  type={show ? "text" : "password"}
                  value={pw}
                  onChange={(e) => {
                    setPw(e.target.value)
                    if (error) setError(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) submit()
                  }}
                  placeholder="Senha de acesso"
                  autoComplete="off"
                  className="flex-1 bg-transparent text-base font-semibold text-white placeholder:text-white/30 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="text-white/40 transition hover:text-white/70"
                  aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                >
                  {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {error && <p className="mt-2 text-center text-sm font-medium text-[#ef4444]">Senha incorreta. Tente novamente.</p>}
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={!pw.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#22c55e] via-[#4ade80] to-[#16a34a] py-4 text-lg font-extrabold text-[#0a0d13] shadow-[0_0_30px_rgba(34,197,94,0.45)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Lock className="h-5 w-5" />
              Desbloquear IA
            </button>
          </div>
        ) : (
          <div className="relative space-y-5 p-6">
            {/* fases */}
            <div className="space-y-2.5">
              {PHASES.map((phase, i) => {
                const Icon = phase.icon
                const active = i === phaseIdx
                const done = i < phaseIdx || progress >= 100
                return (
                  <div
                    key={phase.label}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-300 ${
                      done
                        ? "border-[#22c55e]/40 bg-[#0f2e1c]/60"
                        : active
                          ? "border-[#22c55e]/60 bg-[#0f2e1c]/40"
                          : "border-white/5 bg-white/5 opacity-40"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${
                        done ? "bg-[#22c55e] text-[#0a0d13]" : active ? "bg-[#22c55e]/20 text-[#22c55e]" : "bg-white/10 text-white/40"
                      }`}
                    >
                      {done ? <Check className="h-4 w-4" /> : <Icon className={`h-4 w-4 ${active ? "animate-pulse" : ""}`} />}
                    </span>
                    <span className={`text-sm font-medium ${done || active ? "text-white" : "text-white/50"}`}>
                      {phase.label}
                    </span>
                    {active && progress < 100 && (
                      <span className="ml-auto flex gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#22c55e]" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#22c55e]" style={{ animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#22c55e]" style={{ animationDelay: "300ms" }} />
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* barra de progresso */}
            <div>
              <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#16a34a] via-[#22c55e] to-[#4ade80] transition-[width] duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-white/50">{progress >= 100 ? "Pronto" : "Conectando…"}</span>
                <span className="font-bold text-[#22c55e] tabular-nums">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
