class ExecutiveSoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public warmup() {
    this.ensureContext();
  }

  /**
   * Clique mecânico de alta relojoaria quando cada card cruza o ponteiro central.
   * @param progress 0 (início rápido) -> 1 (parada final)
   */
  public playReelTick(progress: number) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;

      // Oscilador curto com decaimento exponencial rápido (som tátil e seco de luxo)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Conforme desacelera, o clique fica ligeiramente mais encorpado e nítido
      const baseFreq = 980 - progress * 260;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.028);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(1.8, now);

      const peakGain = 0.045 + progress * 0.04;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peakGain, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.036);
    } catch {}
  }

  /**
   * Acorde sutil quando o tempo mínimo da VSL destrava o sistema de alocação.
   */
  public playUnlockChime() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.065;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(0.045, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.6);
      });
    } catch {}
  }

  /**
   * Acorde executivo profundo e solene ao cravar o Gerente do usuário.
   */
  public playRevealChord() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Acorde Dmaj9/F# suave e cinematográfico
      const chord = [
        { freq: 146.83, type: 'sine' as OscillatorType, vol: 0.08, dur: 1.5 },
        { freq: 293.66, type: 'triangle' as OscillatorType, vol: 0.05, dur: 1.4 },
        { freq: 369.99, type: 'sine' as OscillatorType, vol: 0.05, dur: 1.4 },
        { freq: 440.0, type: 'sine' as OscillatorType, vol: 0.05, dur: 1.5 },
        { freq: 659.25, type: 'sine' as OscillatorType, vol: 0.045, dur: 1.7 },
        { freq: 880.0, type: 'sine' as OscillatorType, vol: 0.03, dur: 1.8 },
      ];

      chord.forEach(({ freq, type, vol, dur }, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + idx * 0.035;

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + dur + 0.05);
      });
    } catch {}
  }
}

export const executiveAudio = new ExecutiveSoundEngine();
