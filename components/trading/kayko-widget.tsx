"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Radar, X, TrendingUp, TrendingDown, Volume2, VolumeX, Cpu } from "lucide-react"

type Candle = { open: number; close: number; high: number; low: number }

interface KaykoStats {
  win: number
  loss: number
  profit: number
}

interface KaykoWidgetProps {
  assetName: string
  candles: Candle[]
  stats: KaykoStats
}

type Signal = {
  direction: "CALL" | "PUT"
  confidence: number
  createdAt: number
}

// Som sci-fi leve gerado via Web Audio (sem arquivos externos).
function useKaykoSound(muted: boolean) {
  const ctxRef = useRef<AudioContext | null>(null)

  const getCtx = useCallback(() => {
    if (typeof window === "undefined") return null
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as any).webkitAudioContext
      if (AC) ctxRef.current = new AC()
    }
    const ctx = ctxRef.current
    if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {})
    return ctx
  }, [])

  const beep = useCallback(
    (freq: number, when: number, dur: number, type: OscillatorType = "sine", gain = 0.05) => {
      if (muted) return
      const ctx = getCtx()
      if (!ctx) return
      const t = ctx.currentTime + when
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, t)
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(gain, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      osc.connect(g)
      g.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + dur + 0.02)
    },
    [getCtx, muted],
  )

  const playScan = useCallback(() => {
    if (muted) return
    const ctx = getCtx()
    if (!ctx) return
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = "sawtooth"
    osc.frequency.setValueAtTime(180, t)
    osc.frequency.exponentialRampToValueAtTime(920, t + 1.4)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.03, t + 0.1)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6)
    osc.connect(g)
    g.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 1.7)
    // pulsos de "processamento"
    for (let i = 0; i < 4; i++) beep(520 + i * 60, 0.4 + i * 0.35, 0.08, "square", 0.03)
  }, [beep, getCtx, muted])

  const playSignal = useCallback(
    (direction: "CALL" | "PUT") => {
      if (direction === "CALL") {
        beep(660, 0, 0.12, "triangle", 0.06)
        beep(880, 0.12, 0.18, "triangle", 0.06)
      } else {
        beep(440, 0, 0.12, "triangle", 0.06)
        beep(300, 0.12, 0.18, "triangle", 0.06)
      }
    },
    [beep],
  )

  return { playScan, playSignal }
}

export function KaykoWidget({ assetName, candles, stats }: KaykoWidgetProps) {
  const [open, setOpen] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [signal, setSignal] = useState<Signal | null>(null)
  const [muted, setMuted] = useState(false)
  const { playScan, playSignal } = useKaykoSound(muted)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  // Quando o ativo muda, o sinal anterior deixa de valer.
  useEffect(() => {
    setSignal(null)
  }, [assetName])

  const winRate = useMemo(() => {
    const total = stats.win + stats.loss
    if (total === 0) return 0
    return Math.round((stats.win / total) * 100)
  }, [stats.win, stats.loss])

  const runAnalysis = useCallback(() => {
    if (analyzing) return
    setSignal(null)
    setAnalyzing(true)
    playScan()

    timeoutRef.current = window.setTimeout(() => {
      // Direcao a partir do momentum das ultimas velas do ativo conectado.
      const closes = candles.slice(-14).map((c) => c.close).filter((n) => Number.isFinite(n))
      let direction: "CALL" | "PUT" = "CALL"
      if (closes.length >= 3) {
        const sma = closes.reduce((a, b) => a + b, 0) / closes.length
        const last = closes[closes.length - 1]
        const prev = closes[Math.max(0, closes.length - 4)]
        const momentum = last - prev
        direction = last >= sma || momentum >= 0 ? "CALL" : "PUT"
      } else {
        direction = Math.random() > 0.5 ? "CALL" : "PUT"
      }
      const confidence = Math.round(72 + Math.random() * 22)
      setAnalyzing(false)
      setSignal({ direction, confidence, createdAt: Date.now() })
      playSignal(direction)
    }, 3200)
  }, [analyzing, candles, playScan, playSignal])

  const profitLabel = `${stats.profit >= 0 ? "+" : "-"}R$ ${Math.abs(stats.profit).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

  return (
    <div className="pointer-events-none fixed left-1/2 top-20 z-[60] flex -translate-x-1/2 flex-col items-center select-none">
      {/* Mascote flutuante */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto group relative flex flex-col items-center focus:outline-none"
        aria-label="Abrir Robô Kayko"
      >
        {/* halo */}
        <span className="absolute top-2 h-28 w-28 rounded-full bg-[#f97316]/25 blur-2xl animate-pulse" aria-hidden />
        {/* aneis de radar */}
        <span className="rtm-radar absolute top-10 h-24 w-24 rounded-full border border-[#f97316]/40" aria-hidden />
        <span
          className="rtm-radar absolute top-10 h-24 w-24 rounded-full border border-[#f97316]/30"
          style={{ animationDelay: "0.9s" }}
          aria-hidden
        />
        <Image
          src="/trade/kayko-robot.png"
          alt="Robô Kayko"
          width={128}
          height={128}
          className="relative h-28 w-28 object-contain drop-shadow-[0_8px_28px_rgba(249,115,22,0.45)] transition-transform duration-300 group-hover:-translate-y-1 animate-[kaykoFloat_3.4s_ease-in-out_infinite]"
          priority
        />
        {/* botao indicador */}
        <span className="pointer-events-none absolute right-5 top-[86px] flex h-6 w-6 items-center justify-center rounded-full bg-[#f97316] shadow-[0_0_12px_rgba(249,115,22,0.9)]">
          <span className="h-2 w-2 rounded-full bg-white" />
        </span>
      </button>

      {/* Card de WIN / LOSS */}
      <div className="pointer-events-auto mt-1 w-[260px] rounded-2xl border border-[#f97316]/40 bg-[#0b0f16]/95 p-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur">
        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-[#0f2e1c] px-3 py-2 ring-1 ring-[#22c55e]/30">
            <span className="text-xs font-bold tracking-wide text-[#22c55e]">WIN</span>
            <span className="ml-auto text-base font-extrabold text-white tabular-nums">{stats.win}</span>
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-[#2e1414] px-3 py-2 ring-1 ring-[#ef4444]/30">
            <span className="text-xs font-bold tracking-wide text-[#ef4444]">LOSS</span>
            <span className="ml-auto text-base font-extrabold text-white tabular-nums">{stats.loss}</span>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between px-1">
          <span className={`text-lg font-extrabold tabular-nums ${stats.profit >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
            {profitLabel}
          </span>
          <span className="text-lg font-extrabold text-white/80 tabular-nums">{winRate}%</span>
        </div>
      </div>

      {/* Painel de analise */}
      {open && (
        <div className="pointer-events-auto fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !analyzing && setOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#f97316]/30 bg-gradient-to-b from-[#141a24] to-[#0a0d13] shadow-[0_20px_80px_rgba(0,0,0,0.7)]">
            {/* grade tecnologica */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  "linear-gradient(#f97316 1px, transparent 1px), linear-gradient(90deg, #f97316 1px, transparent 1px)",
                backgroundSize: "26px 26px",
              }}
              aria-hidden
            />

            {/* header */}
            <div className="relative flex items-center gap-3 border-b border-white/5 p-5">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                <span className="absolute h-16 w-16 rounded-full bg-[#f97316]/25 blur-lg" aria-hidden />
                <Image
                  src="/trade/kayko-robot.png"
                  alt="Robô Kayko"
                  width={64}
                  height={64}
                  className="relative h-16 w-16 object-contain"
                />
              </div>
              <div className="min-w-0">
                <h3 className="text-2xl font-extrabold leading-none text-white">
                  ROBÔ <span className="text-[#f97316]">KAYKO</span>
                </h3>
                <div className="mt-2 flex items-center gap-2 text-sm text-white/60">
                  <span className="h-2 w-2 rounded-full bg-[#f97316] shadow-[0_0_8px_#f97316]" />
                  <span className="font-semibold text-[#f97316]">Online</span>
                  <span className="text-white/25">•</span>
                  <Cpu className="h-4 w-4" />
                  <span>IA de análise</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !analyzing && setOpen(false)}
                className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                disabled={analyzing}
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* corpo */}
            <div className="relative space-y-4 p-5">
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3.5">
                <span className="text-sm font-medium uppercase tracking-wide text-white/50">Ativo em análise</span>
                <span className="text-lg font-extrabold text-white">{assetName}</span>
              </div>

              {/* Animacao de analise */}
              {analyzing && (
                <div className="overflow-hidden rounded-2xl border border-[#f97316]/30 bg-black/40 p-5">
                  <div className="flex items-center gap-3">
                    <Radar className="h-5 w-5 animate-spin text-[#f97316]" style={{ animationDuration: "1.6s" }} />
                    <span className="text-sm font-semibold text-white">Analisando mercado…</span>
                    <span className="ml-auto text-xs text-white/40">{assetName}</span>
                  </div>
                  {/* barras de espectro */}
                  <div className="mt-4 flex h-16 items-end justify-between gap-1">
                    {Array.from({ length: 22 }).map((_, i) => (
                      <span
                        key={i}
                        className="flex-1 rounded-sm bg-gradient-to-t from-[#f97316] to-[#22d3ee]"
                        style={{
                          animation: "kaykoBar 0.9s ease-in-out infinite",
                          animationDelay: `${i * 0.06}s`,
                          height: "100%",
                        }}
                      />
                    ))}
                  </div>
                  {/* linha de varredura */}
                  <div className="relative mt-4 h-1 overflow-hidden rounded-full bg-white/10">
                    <span
                      className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-[#f97316] to-transparent"
                      style={{ animation: "kaykoScan 1.2s linear infinite" }}
                    />
                  </div>
                </div>
              )}

              {/* Resultado do sinal */}
              {!analyzing && signal && (
                <div
                  className={`rounded-2xl border p-5 text-center ${
                    signal.direction === "CALL"
                      ? "border-[#22c55e]/40 bg-[#0f2e1c]"
                      : "border-[#ef4444]/40 bg-[#2e1414]"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Sinal gerado</p>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    {signal.direction === "CALL" ? (
                      <TrendingUp className="h-8 w-8 text-[#22c55e]" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-[#ef4444]" />
                    )}
                    <span
                      className={`text-3xl font-extrabold ${
                        signal.direction === "CALL" ? "text-[#22c55e]" : "text-[#ef4444]"
                      }`}
                    >
                      {signal.direction === "CALL" ? "COMPRAR" : "VENDER"}
                    </span>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1 text-sm">
                    <span className="text-white/60">Confiança</span>
                    <span className="font-bold text-white">{signal.confidence}%</span>
                  </div>
                </div>
              )}

              {/* Botao analisar */}
              <button
                type="button"
                onClick={runAnalysis}
                disabled={analyzing}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#f97316] via-[#fb923c] to-[#22d3ee] py-4 text-lg font-extrabold text-[#0a0d13] shadow-[0_0_30px_rgba(249,115,22,0.45)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Radar className={`h-6 w-6 ${analyzing ? "animate-spin" : ""}`} style={{ animationDuration: "1.6s" }} />
                {analyzing ? "Analisando…" : signal ? "Analisar novamente" : "Analisar e gerar entrada"}
              </button>

              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-xs text-white/40">
                  <Cpu className="h-3.5 w-3.5" />
                  Análise do ativo aberto na tela em tempo real
                </p>
                <button
                  type="button"
                  onClick={() => setMuted((m) => !m)}
                  className="flex items-center gap-1 text-xs text-white/40 transition hover:text-white/70"
                  aria-label={muted ? "Ativar som" : "Silenciar"}
                >
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
