// Trade sound effects using Web Audio API - no audio files needed
let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume()
    }
    return audioCtx
  } catch {
    return null
  }
}

// Desbloqueia/inicializa o AudioContext no primeiro gesto do usuario.
// Navegadores (especialmente mobile) so permitem criar/retomar audio dentro de um gesto.
// Chamar isso uma vez garante que o primeiro som de entrada toque de forma confiavel.
export function unlockAudio() {
  const ctx = getCtx()
  if (!ctx) return
  if (ctx.state === "suspended") ctx.resume()
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.3) {
  const ctx = getCtx()
  if (!ctx) return

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime)

  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}

// CALL/BUY sound - ascending double beep (positive feel)
export function playCallSound() {
  const ctx = getCtx()
  if (!ctx) return

  // First beep
  playTone(880, 0.12, "sine", 0.25)

  // Second higher beep after 100ms
  setTimeout(() => {
    playTone(1174, 0.15, "sine", 0.3)
  }, 100)
}

// PUT/SELL sound - descending double beep
export function playPutSound() {
  const ctx = getCtx()
  if (!ctx) return

  // First beep
  playTone(784, 0.12, "sine", 0.25)

  // Second lower beep after 100ms
  setTimeout(() => {
    playTone(587, 0.15, "sine", 0.3)
  }, 100)
}

// WIN sound - celebratory fanfare: ascending arpeggio + sparkle + final chord
export function playWinSound() {
  const ctx = getCtx()
  if (!ctx) return

  // Arpegio ascendente principal (mais brilhante)
  const notes = [523, 659, 784, 1047, 1319] // C5, E5, G5, C6, E6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, "triangle", 0.22), i * 75)
  })

  // Faisca aguda por cima para dar brilho
  setTimeout(() => playTone(2093, 0.12, "sine", 0.12), 120) // C7
  setTimeout(() => playTone(2637, 0.14, "sine", 0.1), 220) // E7

  // Acorde final sustentado (C maior) — sensacao de "vitoria"
  setTimeout(() => {
    playTone(523, 0.5, "sine", 0.16) // C5
    playTone(659, 0.5, "sine", 0.14) // E5
    playTone(784, 0.55, "sine", 0.14) // G5
    playTone(1047, 0.6, "sine", 0.12) // C6
  }, 420)
}

// LOSS sound - deep descending "red" with a soft buzz
export function playLossSound() {
  const ctx = getCtx()
  if (!ctx) return

  // Descida grave e clara
  playTone(392, 0.28, "triangle", 0.22) // G4
  setTimeout(() => playTone(311, 0.32, "triangle", 0.2), 130) // Eb4
  setTimeout(() => playTone(233, 0.5, "triangle", 0.18), 260) // Bb3

  // Zumbido grave sob a descida para reforcar o "red"
  setTimeout(() => playTone(110, 0.55, "sawtooth", 0.08), 260) // A2
}
