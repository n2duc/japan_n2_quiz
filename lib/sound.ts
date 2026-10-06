// Web Audio API sound synthesizer for immediate, reliable sound effects
class SoundEffects {
  private ctx: AudioContext | null = null
  private soundEnabled: boolean = true

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("n2_quiz_sound")
      this.soundEnabled = saved !== null ? saved === "true" : true
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume()
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled
  }

  public toggle(): boolean {
    this.soundEnabled = !this.soundEnabled
    if (typeof window !== "undefined") {
      localStorage.setItem("n2_quiz_sound", String(this.soundEnabled))
    }
    return this.soundEnabled
  }

  public playCorrect() {
    if (!this.soundEnabled) return
    try {
      this.initCtx()
      if (!this.ctx) return
      const now = this.ctx.currentTime

      // Pleasant ascending chime (E5 -> B5)
      const osc1 = this.ctx.createOscillator()
      const osc2 = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc1.type = "sine"
      osc2.type = "sine"

      osc1.frequency.setValueAtTime(659.25, now) // E5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12) // A5

      osc2.frequency.setValueAtTime(987.77, now + 0.08) // B5
      osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.22) // E6

      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(this.ctx.destination)

      osc1.start(now)
      osc1.stop(now + 0.4)
      osc2.start(now + 0.08)
      osc2.stop(now + 0.4)
    } catch {
      // Audio context might be restricted before interaction
    }
  }

  public playIncorrect() {
    if (!this.soundEnabled) return
    try {
      this.initCtx()
      if (!this.ctx) return
      const now = this.ctx.currentTime

      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = "triangle"
      osc.frequency.setValueAtTime(260, now)
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.25)

      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.3)
    } catch {
      // Ignore audio failure
    }
  }

  public speakJapanese(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return
    try {
      window.speechSynthesis.cancel()
      // Clean blank markers or stars for natural speech
      const cleanText = text
        .replace(/（\s*.*?）/g, "なになに")
        .replace(/___\s*___\s*★\s*___/g, "なになに")
        .replace(/★/g, "")
        .replace(/_{2,}/g, "なになに")

      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.lang = "ja-JP"
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    } catch {
      // Ignore speech failure
    }
  }
}

export const sounds = new SoundEffects()
