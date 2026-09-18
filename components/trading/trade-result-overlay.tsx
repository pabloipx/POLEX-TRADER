"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"

/**
 * Animacao de resultado da operacao no estilo Avalon.
 *
 * Um card central entra com um "pop" elastico sobre um brilho radial, mostra o badge do
 * resultado com aneis de energia se expandindo e o valor deslizando de baixo. No ganho sobem
 * moedas douradas; na perda o card da uma tremida curta. Perto do fim da exibicao o card sai
 * subindo, entao o desaparecimento nao e seco.
 *
 * O componente controla apenas a propria animacao de saida — quem monta/desmonta continua
 * sendo a pagina, que ja limpa o estado depois de `durationMs`.
 */

// Posicoes/tempos fixos (nao aleatorios) para as moedas, garantindo animacao identica
// em qualquer render e evitando divergencia entre servidor e cliente.
const COINS = [
  { left: "8%", delay: "0ms", duration: "1500ms", size: 14 },
  { left: "20%", delay: "180ms", duration: "1700ms", size: 10 },
  { left: "33%", delay: "80ms", duration: "1400ms", size: 12 },
  { left: "46%", delay: "320ms", duration: "1600ms", size: 16 },
  { left: "58%", delay: "120ms", duration: "1450ms", size: 11 },
  { left: "71%", delay: "260ms", duration: "1650ms", size: 13 },
  { left: "84%", delay: "40ms", duration: "1550ms", size: 10 },
  { left: "93%", delay: "400ms", duration: "1500ms", size: 12 },
]

// Confete de tela cheia no ganho. Posicoes/tempos fixos para animacao deterministica
// (sem divergencia servidor/cliente). --cfx/--cfy definem a trajetoria de cada particula.
const CONFETTI = [
  { left: "10%", color: "#22c55e", dx: "-40px", dy: "240px", rot: "540deg", delay: "0ms", dur: "1500ms", size: 10 },
  { left: "18%", color: "#fbbf24", dx: "30px", dy: "300px", rot: "-480deg", delay: "120ms", dur: "1700ms", size: 8 },
  { left: "27%", color: "#4ade80", dx: "-20px", dy: "260px", rot: "620deg", delay: "60ms", dur: "1400ms", size: 12 },
  { left: "36%", color: "#38bdf8", dx: "50px", dy: "320px", rot: "-540deg", delay: "220ms", dur: "1650ms", size: 9 },
  { left: "45%", color: "#22c55e", dx: "-60px", dy: "280px", rot: "500deg", delay: "40ms", dur: "1550ms", size: 11 },
  { left: "54%", color: "#fde047", dx: "40px", dy: "300px", rot: "-600deg", delay: "180ms", dur: "1600ms", size: 8 },
  { left: "63%", color: "#4ade80", dx: "-30px", dy: "250px", rot: "560deg", delay: "90ms", dur: "1450ms", size: 12 },
  { left: "72%", color: "#fbbf24", dx: "60px", dy: "310px", rot: "-500deg", delay: "260ms", dur: "1700ms", size: 9 },
  { left: "81%", color: "#22c55e", dx: "-50px", dy: "270px", rot: "580deg", delay: "20ms", dur: "1500ms", size: 10 },
  { left: "90%", color: "#38bdf8", dx: "20px", dy: "330px", rot: "-560deg", delay: "300ms", dur: "1600ms", size: 8 },
  { left: "5%", color: "#fde047", dx: "30px", dy: "290px", rot: "520deg", delay: "150ms", dur: "1650ms", size: 9 },
  { left: "96%", color: "#4ade80", dx: "-30px", dy: "260px", rot: "-520deg", delay: "80ms", dur: "1500ms", size: 11 },
]

export function TradeResultOverlay({
  type,
  amount,
  durationMs = 3000,
}: {
  type: "win" | "loss"
  amount: number
  durationMs?: number
}) {
  const [leaving, setLeaving] = useState(false)
  const isWin = type === "win"

  // Dispara a animacao de saida um pouco antes de a pagina remover o componente,
  // para o card sair subindo em vez de simplesmente desaparecer.
  useEffect(() => {
    const exitAt = Math.max(durationMs - 460, 0)
    const timer = setTimeout(() => setLeaving(true), exitAt)
    return () => clearTimeout(timer)
  }, [durationMs])

  const accent = isWin ? "#22c55e" : "#ef4444"
  const formatted = amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">
        {isWin ? `Operação vencedora, lucro de R$ ${formatted}` : `Operação perdida, prejuízo de R$ ${formatted}`}
      </span>

      {/* Flash de tela cheia no impacto do resultado */}
      <div
        aria-hidden="true"
        className="animate-result-flash absolute inset-0"
        style={{
          background: isWin
            ? `radial-gradient(circle at 50% 45%, ${accent}55 0%, ${accent}18 40%, transparent 70%)`
            : `radial-gradient(circle at 50% 50%, ${accent}4d 0%, ${accent}14 42%, transparent 72%)`,
        }}
      />

      {/* Perda: pulso vermelho nas bordas da tela */}
      {!isWin && (
        <div
          aria-hidden="true"
          className="animate-result-vignette absolute inset-0"
          style={{ boxShadow: `inset 0 0 160px 40px ${accent}66` }}
        />
      )}

      {/* Ganho: explosao de confete em tela cheia */}
      {isWin && (
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-0">
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              className="animate-result-confetti absolute top-0 block rounded-[2px]"
              style={
                {
                  left: c.left,
                  width: c.size,
                  height: c.size * 0.6,
                  background: c.color,
                  boxShadow: `0 0 8px ${c.color}aa`,
                  "--cfx": c.dx,
                  "--cfy": c.dy,
                  "--cfr": c.rot,
                  "--cfd": c.dur,
                  "--cfdelay": c.delay,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      <div className={leaving ? "animate-result-out" : "animate-result-pop-in"}>
        <div className={isWin ? "" : "animate-result-shake"}>
          <div className="relative">
            {/* Brilho radial pulsando atras do card */}
            <div
              aria-hidden="true"
              className="animate-result-glow absolute -inset-16 rounded-full blur-3xl"
              style={{
                background: `radial-gradient(circle, ${accent}55 0%, ${accent}18 45%, transparent 72%)`,
              }}
            />

            {/* Card do resultado */}
            <div
              className="relative flex min-w-[264px] flex-col items-center gap-4 rounded-3xl border px-8 py-7 backdrop-blur-xl sm:min-w-[300px]"
              style={{
                background: "linear-gradient(165deg, rgba(18,24,38,0.96) 0%, rgba(11,15,20,0.97) 100%)",
                borderColor: `${accent}66`,
                boxShadow: `0 0 0 1px ${accent}22, 0 18px 60px -12px ${accent}70, 0 8px 24px rgba(0,0,0,0.6)`,
              }}
            >
              {/* Badge com aneis de energia se expandindo */}
              <div className="relative flex h-16 w-16 items-center justify-center">
                <span
                  aria-hidden="true"
                  className="animate-result-ring absolute inset-0 rounded-full border-2"
                  style={{ borderColor: `${accent}88` }}
                />
                <span
                  aria-hidden="true"
                  className="animate-result-ring absolute inset-0 rounded-full border-2"
                  style={{ borderColor: `${accent}55`, animationDelay: "700ms" }}
                />
                <span
                  className="animate-result-badge relative flex h-16 w-16 items-center justify-center rounded-full"
                  style={{
                    background: `linear-gradient(145deg, ${accent} 0%, ${isWin ? "#15803d" : "#b91c1c"} 100%)`,
                    boxShadow: `0 8px 24px -4px ${accent}aa`,
                  }}
                >
                  {isWin ? (
                    <TrendingUp className="h-8 w-8 text-white" strokeWidth={2.5} />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-white" strokeWidth={2.5} />
                  )}
                </span>
              </div>

              {/* Valor e rotulo */}
              <div className="animate-result-amount flex flex-col items-center gap-1">
                <p
                  className="text-4xl font-extrabold tabular-nums tracking-tight sm:text-5xl"
                  style={{ color: accent, textShadow: `0 0 28px ${accent}80` }}
                >
                  {isWin ? "+" : "-"}R$ {formatted}
                </p>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
                  {isWin ? "Operação vencedora" : "Operação perdida"}
                </p>
              </div>

              {/* Linha de destaque na base do card */}
              <div
                aria-hidden="true"
                className="absolute inset-x-8 bottom-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
              />
            </div>

            {/* Moedas subindo na frente do card — apenas no ganho */}
            {isWin && (
              <div aria-hidden="true" className="absolute -inset-x-10 bottom-2 z-10 h-px">
                {COINS.map((coin, i) => (
                  <span
                    key={i}
                    className="animate-result-coin absolute bottom-0 block rounded-full"
                    style={{
                      left: coin.left,
                      width: coin.size,
                      height: coin.size,
                      animationDelay: coin.delay,
                      animationDuration: coin.duration,
                      background: "linear-gradient(150deg, #fef3c7 0%, #fbbf24 45%, #d97706 100%)",
                      boxShadow:
                        "inset 0 0 0 1.5px rgba(255,255,255,0.6), 0 0 12px rgba(251,191,36,0.9), 0 2px 6px rgba(0,0,0,0.4)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
