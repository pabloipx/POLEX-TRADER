"use client"

import { useEffect, useRef, useState } from "react"
import { Cpu, ShieldCheck, Wifi, Sparkles, Check, Activity, Volume2, VolumeX } from "lucide-react"
import { MODEL_META, type AiModel, type RoboAsset } from "./asset-picker"

interface ConnectingAnimationProps {
  asset: RoboAsset
  model: AiModel
  modelLabel: string
}

const STAGES = [
  { label: "Estabelecendo conexão segura", icon: Wifi },
  { label: "Autenticando com o agente", icon: ShieldCheck },
  { label: "Carregando núcleo de análise", icon: Cpu },
  { label: "Pronto para operar", icon: Sparkles },
]

/* Efeitos sonoros sci-fi via Web Audio (sem assets externos) */
function useSciFiSound(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null)

  const getCtx = () => {
    if (typeof window === "undefined") return null
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AC) ctxRef.current = new AC()
    }
    if (ctxRef.current?.state === "suspended") ctxRef.current.resume().catch(() => {})
    return ctxRef.current
  }

  const beep = (freq: number, duration: number, type: OscillatorType = "sine", gain = 0.05) => {
    if (!enabled) return
    const ctx = getCtx()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
    osc.connect(g).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  }

  const sweep = (from: number, to: number, duration: number, gain = 0.06) => {
    if (!enabled) return
    const ctx = getCtx()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = "sawtooth"
    osc.frequency.setValueAtTime(from, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + duration)
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
    osc.connect(g).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  }

  return { beep, sweep }
}

export function ConnectingAnimation({ asset, model, modelLabel }: ConnectingAnimationProps) {
  const [stage, setStage] = useState(0)
  const [muted, setMuted] = useState(false)
  const meta = MODEL_META[model]
  const accent = meta.accent
  const { beep, sweep } = useSciFiSound(!muted)

  useEffect(() => {
    // som de boot ao iniciar a conexão
    sweep(180, 720, 0.5)
    // ~4s total: 4 etapas a cada ~950ms
    const id = setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1))
    }, 950)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // som por etapa
  useEffect(() => {
    if (stage === 0) return
    if (stage >= STAGES.length - 1) {
      // acorde de "conexão estabelecida"
      beep(660, 0.12, "sine", 0.05)
      setTimeout(() => beep(880, 0.14, "sine", 0.05), 90)
      setTimeout(() => beep(1180, 0.22, "triangle", 0.05), 200)
    } else {
      beep(440 + stage * 120, 0.09, "square", 0.035)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  return (
    <div className="relative flex flex-col items-center overflow-hidden py-8 text-center">
      {/* grade tecnológica de fundo */}
      <span
        className="rtm-grid pointer-events-none absolute inset-0 opacity-40"
        style={{ maskImage: "radial-gradient(circle at center, black, transparent 75%)" }}
      />

      {/* botão de som */}
      <button
        onClick={() => setMuted((m) => !m)}
        className="absolute right-1 top-1 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/50 transition hover:text-white/80"
        aria-label={muted ? "Ativar som" : "Silenciar som"}
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>

      {/* Núcleo com avatar do agente e anéis de radar */}
      <div className="relative mb-8 flex h-40 w-40 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full border animate-ping"
          style={{ borderColor: `${accent}33` }}
        />
        <span
          className="absolute inset-4 rounded-full border animate-ping"
          style={{ borderColor: `${accent}40`, animationDelay: "0.4s" }}
        />
        <span
          className="absolute inset-8 rounded-full border animate-ping"
          style={{ borderColor: `${accent}4d`, animationDelay: "0.8s" }}
        />
        {/* anel giratório */}
        <div
          className="absolute inset-6 rounded-full border-2 animate-spin"
          style={{ borderColor: `${accent}22`, borderTopColor: accent, animationDuration: "1.4s" }}
        />
        {/* avatar do agente */}
        <div
          className="relative h-24 w-24 overflow-hidden rounded-full border-2"
          style={{ borderColor: `${accent}66`, boxShadow: `0 0 34px ${accent}55` }}
        >
          <img src={meta.image || "/placeholder.svg"} alt={`Agente ${modelLabel}`} className="h-full w-full object-cover" />
          {/* varredura sobre o avatar */}
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-1/3 animate-[rtmScan_1.6s_linear_infinite]"
            style={{ background: `linear-gradient(180deg, ${accent}55, transparent)` }}
          />
        </div>
      </div>

      <p className="relative text-xs font-semibold uppercase tracking-widest" style={{ color: accent }}>
        Conectando com o agente
      </p>
      <p className="relative mt-1 text-2xl font-bold text-white text-balance">{modelLabel}</p>
      <p className="relative mt-1 flex items-center justify-center gap-1.5 text-xs text-white/40">
        <Activity className="h-3.5 w-3.5" style={{ color: accent }} />
        Preparando análise de <span className="text-white/70">{asset.name}</span>
      </p>

      {/* Etapas */}
      <div className="relative mt-7 w-full max-w-sm space-y-2">
        {STAGES.map((s, i) => {
          const Icon = s.icon
          const done = i < stage
          const active = i === stage
          return (
            <div
              key={s.label}
              style={active ? { borderColor: `${accent}80`, background: `${accent}14` } : undefined}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                active ? "" : done ? "border-white/5 bg-white/[0.02]" : "border-white/5 bg-transparent opacity-40"
              }`}
            >
              <Icon
                className="h-4 w-4 shrink-0"
                style={{ color: done || active ? accent : "rgba(255,255,255,0.4)" }}
              />
              <span className={`text-left text-sm ${done || active ? "text-white" : "text-white/50"}`}>{s.label}</span>
              {active && (
                <span
                  className="ml-auto h-2 w-2 rounded-full animate-pulse"
                  style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
                />
              )}
              {done && <Check className="ml-auto h-4 w-4" style={{ color: accent }} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
