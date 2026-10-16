"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import {
  Radar,
  X,
  TrendingUp,
  TrendingDown,
  Volume2,
  VolumeX,
  Cpu,
  Clock,
  GripVertical,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react"

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
  entryAt: number
  expiresAt: number
}

const POS_KEY = "polex_auto_trader_pos"
const CARD_W = 264
const CARD_W_MOBILE = 200
const SCAN_MS = 13000
const SCAN_STEPS = [
  "Conectando à rede neural",
  "Coletando candles do ativo",
  "Calculando RSI, MACD e médias",
  "Detectando padrões de preço",
  "Medindo força da tendência",
  "Confirmando sinal de entrada",
]
const RING_R = 52
const RING_C = 2 * Math.PI * RING_R

function computeCardW() {
  if (typeof window === "undefined") return CARD_W
  return window.innerWidth < 480 ? CARD_W_MOBILE : CARD_W
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

  const playTick = useCallback(() => beep(1200, 0, 0.05, "square", 0.025), [beep])

  const playStep = useCallback(() => {
    beep(760, 0, 0.06, "sine", 0.03)
    beep(1020, 0.07, 0.08, "sine", 0.025)
  }, [beep])

  return { playScan, playSignal, playTick, playStep }
}

function fmtClock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

export function KaykoWidget({ assetName, candles, stats }: KaykoWidgetProps) {
  const [open, setOpen] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [signal, setSignal] = useState<Signal | null>(null)
  const [muted, setMuted] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [cardW, setCardW] = useState<number>(CARD_W)
  const [scanStart, setScanStart] = useState(0)

  const { playScan, playSignal, playTick, playStep } = useKaykoSound(muted)
  const timeoutRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{
    startX: number
    startY: number
    originX: number
    originY: number
    moved: boolean
    pointerId: number
  } | null>(null)
  const lastTickRef = useRef<number>(-1)

  // Posição inicial: restaura do localStorage ou centraliza no topo.
  useEffect(() => {
    if (typeof window === "undefined") return
    const w = computeCardW()
    setCardW(w)
    const clamp = (p: { x: number; y: number }) => ({
      x: Math.min(Math.max(8, p.x), window.innerWidth - w - 8),
      y: Math.min(Math.max(8, p.y), window.innerHeight - 120),
    })
    try {
      const raw = localStorage.getItem(POS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
          setPos(clamp(parsed))
          return
        }
      }
    } catch {}
    setPos({ x: Math.max(8, (window.innerWidth - w) / 2), y: 76 })
  }, [])

  // Mantém dentro da tela ao redimensionar.
  useEffect(() => {
    const onResize = () => {
      const w = computeCardW()
      setCardW(w)
      setPos((p) => {
        if (!p) return p
        return {
          x: Math.min(Math.max(8, p.x), window.innerWidth - w - 8),
          y: Math.min(Math.max(8, p.y), window.innerHeight - 120),
        }
      })
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  // Sinal anterior deixa de valer quando o ativo muda.
  useEffect(() => {
    setSignal(null)
  }, [assetName])

  // Relógio: só liga quando há sinal ativo ou o painel está aberto.
  useEffect(() => {
    if (!signal && !open && !analyzing) return
    const id = window.setInterval(() => setNow(Date.now()), analyzing ? 100 : 250)
    return () => window.clearInterval(id)
  }, [signal, open, analyzing])

  const winRate = useMemo(() => {
    const total = stats.win + stats.loss
    if (total === 0) return 0
    return Math.round((stats.win / total) * 100)
  }, [stats.win, stats.loss])

  const runAnalysis = useCallback(() => {
    if (analyzing) return
    // Só permite nova análise quando a entrada atual já expirou.
    if (signal && Date.now() < signal.expiresAt) return
    setSignal(null)
    const start = Date.now()
    setScanStart(start)
    setNow(start)
    setAnalyzing(true)
    playScan()

    timeoutRef.current = window.setTimeout(() => {
      const closes = candles
        .slice(-14)
        .map((c) => c.close)
        .filter((n) => Number.isFinite(n))
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

      // Entrada agendada de 2:10 a 2:49 no futuro, dando tempo de entrar.
      const base = Date.now()
      const lead = 130000 + Math.floor(Math.random() * 40000) // 2:10 .. 2:49
      const entryAt = base + lead
      const expiresAt = entryAt + 60000

      setAnalyzing(false)
      setNow(Date.now())
      lastTickRef.current = -1
      setSignal({ direction, confidence, createdAt: base, entryAt, expiresAt })
      playSignal(direction)
    }, SCAN_MS)
  }, [analyzing, candles, playScan, playSignal, signal])

  // Contagem regressiva e beeps nos últimos 5s antes da entrada.
  const remaining = signal ? signal.entryAt - now : 0
  const secondsLeft = Math.ceil(remaining / 1000)
  const entryActive = !!signal && now >= signal.entryAt && now < signal.expiresAt
  const entryDone = !!signal && now >= signal.expiresAt
  // Enquanto existe um sinal que ainda não expirou, a nova análise fica bloqueada.
  const hasActiveSignal = !!signal && !entryDone

  const scanProgress = analyzing ? Math.min(1, Math.max(0, (now - scanStart) / SCAN_MS)) : 0
  const scanPct = Math.round(scanProgress * 100)
  const stepIndex = Math.min(SCAN_STEPS.length - 1, Math.floor(scanProgress * SCAN_STEPS.length))
  const scanSecondsLeft = Math.max(0, Math.ceil((SCAN_MS - (now - scanStart)) / 1000))
  const candlesRead = Math.round(scanProgress * 240)
  const lastStepRef = useRef(-1)

  useEffect(() => {
    if (!analyzing) {
      lastStepRef.current = -1
      return
    }
    if (stepIndex > 0 && stepIndex !== lastStepRef.current) playStep()
    lastStepRef.current = stepIndex
  }, [analyzing, stepIndex, playStep])

  useEffect(() => {
    if (!signal || muted) return
    if (secondsLeft > 0 && secondsLeft <= 5 && lastTickRef.current !== secondsLeft) {
      lastTickRef.current = secondsLeft
      playTick()
    }
  }, [signal, secondsLeft, muted, playTick])

  const profitLabel = `${stats.profit >= 0 ? "+" : "-"}R$ ${Math.abs(stats.profit).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

  // ----- Drag (press & arrasta) -----
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return
      if (!pos) return
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: pos.x,
        originY: pos.y,
        moved: false,
        pointerId: e.pointerId,
      }
      try {
        ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
      } catch {}
    },
    [pos],
  )

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const ds = dragRef.current
    if (!ds) return
    const dx = e.clientX - ds.startX
    const dy = e.clientY - ds.startY
    if (!ds.moved && Math.hypot(dx, dy) < 5) return
    ds.moved = true
    setDragging(true)
    const w = containerRef.current?.offsetWidth ?? cardW
    const h = containerRef.current?.offsetHeight ?? 200
    const nx = Math.min(Math.max(8, ds.originX + dx), window.innerWidth - w - 8)
    const ny = Math.min(Math.max(8, ds.originY + dy), window.innerHeight - h - 8)
    setPos({ x: nx, y: ny })
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const ds = dragRef.current
    dragRef.current = null
    setDragging(false)
    if (!ds) return
    try {
      ;(e.currentTarget as Element).releasePointerCapture(e.pointerId)
    } catch {}
    if (!ds.moved) {
      // toque simples = abre/fecha painel
      setOpen((v) => !v)
    } else {
      setPos((p) => {
        if (p) {
          try {
            localStorage.setItem(POS_KEY, JSON.stringify(p))
          } catch {}
        }
        return p
      })
    }
  }, [])

  if (!pos) return null

  const isCall = signal?.direction === "CALL"

  return (
    <>
      {/* Unidade flutuante arrastável */}
      <div
        ref={containerRef}
        className="fixed z-[60] flex flex-col items-center select-none"
        style={{ left: pos.x, top: pos.y, width: cardW, touchAction: "none" }}
      >
        {/* Mascote = alça de arraste + toque para abrir */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className={`group relative flex flex-col items-center ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
          role="button"
          tabIndex={0}
          aria-label="Auto Trader — toque para abrir, arraste para mover"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setOpen((v) => !v)
            }
          }}
        >
          <span className="absolute top-2 h-16 w-16 rounded-full bg-[#22c55e]/25 blur-2xl animate-pulse sm:h-24 sm:w-24" aria-hidden />
          <span className="rtm-radar absolute top-6 h-16 w-16 rounded-full border border-[#22c55e]/40 sm:top-9 sm:h-24 sm:w-24" aria-hidden />
          <span
            className="rtm-radar absolute top-6 h-16 w-16 rounded-full border border-[#22c55e]/30 sm:top-9 sm:h-24 sm:w-24"
            style={{ animationDelay: "0.9s" }}
            aria-hidden
          />
          <Image
            src="/auto-trader-mascot.png"
            alt="Auto Trader"
            width={112}
            height={112}
            draggable={false}
            className={`relative h-16 w-16 object-contain drop-shadow-[0_8px_28px_rgba(34,197,94,0.5)] transition-transform duration-300 sm:h-24 sm:w-24 ${
              dragging ? "scale-105" : "group-hover:-translate-y-1"
            } animate-[kaykoFloat_3.4s_ease-in-out_infinite]`}
            priority
          />
          {/* alça visual */}
          <span className="pointer-events-none absolute -right-1 top-1 flex items-center gap-0.5 rounded-full bg-black/40 px-1.5 py-1 text-white/50 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
            <GripVertical className="h-3 w-3" />
          </span>
          <span className="pointer-events-none absolute right-6 top-[74px] flex h-6 w-6 items-center justify-center rounded-full bg-[#22c55e] shadow-[0_0_12px_rgba(34,197,94,0.9)]">
            <span className="h-2 w-2 rounded-full bg-white" />
          </span>
        </div>

        {/* Card WIN / LOSS */}
        <div className="mt-1 w-full rounded-2xl border border-[#22c55e]/40 bg-[#0b0f16]/95 p-2 shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur sm:p-2.5">
          <div className="flex gap-1.5 sm:gap-2">
            <div className="flex flex-1 items-center gap-1.5 rounded-xl bg-[#0f2e1c] px-2 py-1.5 ring-1 ring-[#22c55e]/30 sm:gap-2 sm:px-3 sm:py-2">
              <span className="text-[10px] font-bold tracking-wide text-[#22c55e] sm:text-xs">WIN</span>
              <span className="ml-auto text-sm font-extrabold text-white tabular-nums sm:text-base">{stats.win}</span>
            </div>
            <div className="flex flex-1 items-center gap-1.5 rounded-xl bg-[#2e1414] px-2 py-1.5 ring-1 ring-[#ef4444]/30 sm:gap-2 sm:px-3 sm:py-2">
              <span className="text-[10px] font-bold tracking-wide text-[#ef4444] sm:text-xs">LOSS</span>
              <span className="ml-auto text-sm font-extrabold text-white tabular-nums sm:text-base">{stats.loss}</span>
            </div>
          </div>
          <div className="mt-1.5 flex items-center justify-between px-1 sm:mt-2">
            <span
              className={`text-base font-extrabold tabular-nums sm:text-lg ${stats.profit >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}
            >
              {profitLabel}
            </span>
            <span className="text-base font-extrabold text-white/80 tabular-nums sm:text-lg">{winRate}%</span>
          </div>

          {/* Faixa de sinal ativo com horário + cronômetro */}
          {signal && !entryDone && (
            <div
              className={`mt-2 rounded-xl border p-2.5 ${
                isCall ? "border-[#22c55e]/40 bg-[#0f2e1c]/70" : "border-[#ef4444]/40 bg-[#2e1414]/70"
              }`}
            >
              <div className="flex items-center gap-2">
                {isCall ? (
                  <TrendingUp className="h-4 w-4 text-[#22c55e]" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-[#ef4444]" />
                )}
                <span className={`text-sm font-extrabold ${isCall ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                  {isCall ? "COMPRAR" : "VENDER"}
                </span>
                <span className="ml-auto flex items-center gap-1 text-xs text-white/60">
          <Clock className="h-3.5 w-3.5" />
                {fmtTime(signal.entryAt)}
              </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wide text-white/45">
                  {entryActive ? "Entrada aberta" : "Entrar em"}
                </span>
                <span
                  className={`text-lg font-extrabold tabular-nums ${
                    entryActive
                      ? "animate-pulse text-[#22c55e]"
                      : secondsLeft <= 5
                        ? "text-[#22c55e]"
                        : "text-white"
                  }`}
                >
                  {entryActive ? "AGORA" : fmtClock(remaining)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Painel de análise (modal central) */}
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !analyzing && setOpen(false)}
            aria-hidden
          />
          <div className="kayko-pop relative w-full max-w-md overflow-hidden rounded-3xl p-px shadow-[0_0_60px_rgba(34,197,94,0.18),0_24px_80px_rgba(0,0,0,0.75)]">
            <span
              className="kayko-border pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[160%]"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0deg, #22c55e 50deg, transparent 110deg, transparent 180deg, #4ade80 230deg, transparent 290deg)",
              }}
              aria-hidden
            />
          <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-gradient-to-b from-[#111823] via-[#0b1017] to-[#070a0f]">
            <div
              className="kayko-grid pointer-events-none absolute inset-0 opacity-[0.09]"
              style={{
                backgroundImage:
                  "linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)",
                backgroundSize: "26px 26px",
                maskImage: "radial-gradient(ellipse at top, black 30%, transparent 85%)",
                WebkitMaskImage: "radial-gradient(ellipse at top, black 30%, transparent 85%)",
              }}
              aria-hidden
            />
            <span
              className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-[#22c55e]/20 blur-3xl"
              aria-hidden
            />

            {/* header */}
            <div className="relative flex items-center gap-3 border-b border-white/5 p-5">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                <span className="absolute h-16 w-16 rounded-full bg-[#22c55e]/25 blur-lg" aria-hidden />
                <span
                  className="kayko-spin absolute -inset-1 rounded-full border border-dashed border-[#22c55e]/40"
                  aria-hidden
                />
                <Image
                  src="/auto-trader-mascot.png"
                  alt="Auto Trader"
                  width={64}
                  height={64}
                  className="relative h-16 w-16 object-contain"
                />
              </div>
              <div className="min-w-0">
                <h3 className="text-2xl font-extrabold leading-none text-white">
                  AUTO <span className="text-[#22c55e]">TRADER</span>
                </h3>
                <div className="mt-2 flex items-center gap-2 text-sm text-white/60">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-60" />
                    <span className="relative h-2 w-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_#22c55e]" />
                  </span>
                  <span className="font-semibold text-[#22c55e]">{analyzing ? "Analisando" : "Online"}</span>
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
              <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3.5 backdrop-blur">
                <span className="text-sm font-medium uppercase tracking-wide text-white/50">Ativo em análise</span>
                <span className="text-lg font-extrabold text-white">{assetName}</span>
              </div>

              {analyzing && (
                <div
                  className="relative overflow-hidden rounded-2xl border border-[#22c55e]/25 bg-black/50 p-4 sm:p-5"
                  role="status"
                  aria-live="polite"
                >
                  <span
                    className="kayko-scanline pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-transparent via-[#22c55e]/10 to-transparent"
                    aria-hidden
                  />

                  <div className="relative flex items-center gap-4 sm:gap-5">
                    {/* Radar com anel de progresso */}
                    <div className="relative h-28 w-28 shrink-0">
                      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120" aria-hidden>
                        <circle cx="60" cy="60" r={RING_R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                        <circle
                          cx="60"
                          cy="60"
                          r={RING_R}
                          fill="none"
                          stroke="url(#kaykoRing)"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray={RING_C}
                          strokeDashoffset={RING_C * (1 - scanProgress)}
                          style={{ transition: "stroke-dashoffset 120ms linear", filter: "drop-shadow(0 0 6px #22c55e)" }}
                        />
                        <defs>
                          <linearGradient id="kaykoRing" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#4ade80" />
                            <stop offset="100%" stopColor="#16a34a" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-[10px] overflow-hidden rounded-full border border-[#22c55e]/30 bg-[#04120a]">
                        <span
                          className="kayko-spin absolute inset-0 rounded-full"
                          style={{
                            background: "conic-gradient(from 0deg, rgba(34,197,94,0.55), transparent 70deg, transparent)",
                            animationDuration: "1.8s",
                          }}
                          aria-hidden
                        />
                        <span className="absolute inset-[22%] rounded-full border border-[#22c55e]/20" aria-hidden />
                        <span className="absolute inset-[40%] rounded-full border border-[#22c55e]/20" aria-hidden />
                        <span className="absolute inset-x-0 top-1/2 h-px bg-[#22c55e]/15" aria-hidden />
                        <span className="absolute inset-y-0 left-1/2 w-px bg-[#22c55e]/15" aria-hidden />
                        {[
                          { t: "22%", l: "64%", d: "0s" },
                          { t: "62%", l: "26%", d: "0.6s" },
                          { t: "70%", l: "70%", d: "1.2s" },
                        ].map((b, i) => (
                          <span
                            key={i}
                            className="kayko-blip absolute h-1.5 w-1.5 rounded-full bg-[#4ade80] shadow-[0_0_8px_#4ade80]"
                            style={{ top: b.t, left: b.l, animationDelay: b.d }}
                            aria-hidden
                          />
                        ))}
                        <Image
                          src="/auto-trader-mascot.png"
                          alt=""
                          width={48}
                          height={48}
                          className="absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]"
                        />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#22c55e]">
                        <Sparkles className="h-3.5 w-3.5" />
                        IA procurando entrada
                      </p>
                      <p className="mt-1 text-4xl font-extrabold tabular-nums leading-none text-white">
                        {scanPct}
                        <span className="text-xl text-white/50">%</span>
                      </p>
                      <p className="mt-2 truncate text-sm text-white/70">
                        {SCAN_STEPS[stepIndex]}
                        <span className="kayko-caret ml-0.5 text-[#22c55e]">_</span>
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-white/45 tabular-nums">
                        <span>
                          Candles <span className="font-bold text-white/80">{candlesRead}</span>
                        </span>
                        <span>
                          Restam <span className="font-bold text-white/80">{scanSecondsLeft}s</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <ol className="relative mt-4 space-y-1.5">
                    {SCAN_STEPS.map((label, i) => {
                      const done = i < stepIndex
                      const current = i === stepIndex
                      return (
                        <li
                          key={label}
                          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors duration-300 ${
                            current ? "bg-[#22c55e]/10 text-white" : done ? "text-white/60" : "text-white/25"
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                              done ? "bg-[#22c55e] text-[#04120a]" : current ? "text-[#22c55e]" : "border border-white/15"
                            }`}
                          >
                            {done ? (
                              <Check className="h-3 w-3" strokeWidth={3} />
                            ) : current ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : null}
                          </span>
                          {label}
                        </li>
                      )
                    })}
                  </ol>

                  <div className="relative mt-4 flex h-8 items-end justify-between gap-[3px]" aria-hidden>
                    {Array.from({ length: 28 }).map((_, i) => (
                      <span
                        key={i}
                        className="flex-1 origin-bottom rounded-sm bg-gradient-to-t from-[#16a34a] to-[#4ade80]"
                        style={{
                          animation: "kaykoBar 1s ease-in-out infinite",
                          animationDelay: `${(i % 7) * 0.12}s`,
                          height: "100%",
                          opacity: i / 28 <= scanProgress ? 1 : 0.25,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {!analyzing && signal && (
                <div
                  className={`kayko-reveal relative overflow-hidden rounded-2xl border p-5 ${
                    isCall
                      ? "border-[#22c55e]/50 bg-gradient-to-b from-[#103a22] to-[#0a1f13] shadow-[0_0_40px_rgba(34,197,94,0.25)]"
                      : "border-[#ef4444]/50 bg-gradient-to-b from-[#3a1414] to-[#1f0a0a] shadow-[0_0_40px_rgba(239,68,68,0.25)]"
                  }`}
                >
                  <span
                    className="kayko-shimmer pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    aria-hidden
                  />
                  <div className="relative flex items-center justify-center gap-2">
                    {isCall ? (
                      <TrendingUp className="h-8 w-8 text-[#22c55e]" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-[#ef4444]" />
                    )}
                    <span className={`text-3xl font-extrabold ${isCall ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                      {isCall ? "COMPRAR" : "VENDER"}
                    </span>
                  </div>

                  {/* Horário + cronômetro */}
                  <div className="relative mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-black/30 p-3 text-center">
                      <p className="flex items-center justify-center gap-1 text-[11px] uppercase tracking-wide text-white/45">
                        <Clock className="h-3.5 w-3.5" /> Horário de entrada
                      </p>
                      <p className="mt-1 text-2xl font-extrabold tabular-nums text-white">{fmtTime(signal.entryAt)}</p>
                    </div>
                    <div className="rounded-xl bg-black/30 p-3 text-center">
                      <p className="text-[11px] uppercase tracking-wide text-white/45">
                        {entryDone ? "Encerrado" : entryActive ? "Entrada aberta" : "Faltam"}
                      </p>
                      <p
                        className={`mt-1 text-2xl font-extrabold tabular-nums ${
                          entryDone
                            ? "text-white/50"
                            : entryActive
                              ? "animate-pulse text-[#22c55e]"
                              : secondsLeft <= 5
                                ? "text-[#22c55e]"
                                : "text-white"
                        }`}
                      >
                        {entryDone ? "--:--" : entryActive ? "AGORA" : fmtClock(remaining)}
                      </p>
                    </div>
                  </div>

                  <div className="relative mt-3 flex items-center justify-center gap-2 rounded-full bg-black/30 px-3 py-1 text-sm">
                    <span className="text-white/60">Confiança</span>
                    <span className="font-bold text-white">{signal.confidence}%</span>
                    <span className="text-white/25">•</span>
                    <span className="text-white/60">Expira</span>
                    <span className="font-bold text-white">{fmtTime(signal.expiresAt)}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={runAnalysis}
                disabled={analyzing || hasActiveSignal}
                className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-[#22c55e] via-[#4ade80] to-[#16a34a] py-4 text-lg font-extrabold text-[#0a0d13] shadow-[0_0_30px_rgba(34,197,94,0.45)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {!analyzing && !hasActiveSignal && (
                  <span
                    className="kayko-shimmer pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    aria-hidden
                  />
                )}
                <Radar
                  className={`relative h-6 w-6 ${analyzing ? "animate-spin" : ""}`}
                  style={{ animationDuration: "1.6s" }}
                />
                {analyzing
                  ? `IA procurando entrada… ${scanPct}%`
                  : hasActiveSignal
                    ? entryActive
                      ? "Entrada em andamento…"
                      : `Aguarde a entrada (${fmtClock(remaining)})`
                    : signal
                      ? "Analisar novamente"
                      : "Analisar e gerar entrada"}
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
        </div>
      )}
    </>
  )
}
