// Web Audio API sound generator for Battle Cats Web Edition

class SoundManager {
  private ctx: AudioContext | null = null;
  public soundEnabled: boolean = true;
  public bgmEnabled: boolean = true;
  private bgmOscillators: OscillatorNode[] = [];
  private bgmGain: GainNode | null = null;
  private isBgmPlaying: boolean = false;
  private bgmLoopTimeout: number | null = null;

  constructor() {
    // Lazy init on first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Meow / Cat spawn sound
  public playCatSpawn(pitchMultiplier: number = 1.0) {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      // cute meow sweep: 400Hz -> 650Hz -> 480Hz
      osc.frequency.setValueAtTime(380 * pitchMultiplier, t);
      osc.frequency.linearRampToValueAtTime(620 * pitchMultiplier, t + 0.08);
      osc.frequency.exponentialRampToValueAtTime(420 * pitchMultiplier, t + 0.22);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.26);
    } catch {
      // AudioContext error guard
    }
  }

  // Attack hit impact sound
  public playHit(isCrit: boolean = false, isAoe: boolean = false) {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      if (isCrit || isAoe) {
        // Heavy punch / explosion sound
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(isCrit ? 300 : 180, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.18);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
      } else {
        // Light punch / slap
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.07);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.09);
      }
    } catch {}
  }

  // Knockback sound
  public playKnockback() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.linearRampToValueAtTime(450, t + 0.12);
      osc.frequency.linearRampToValueAtTime(100, t + 0.22);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    } catch {}
  }

  // Worker Cat Level up sound
  public playWorkerLevelUp() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.05);

        gain.gain.setValueAtTime(0.15, t + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(t + idx * 0.05);
        osc.stop(t + idx * 0.05 + 0.12);
      });
    } catch {}
  }

  // Cat Cannon Laser Charge & Blast
  public playCannonBlast() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      // Rising charging tone
      const oscCharge = this.ctx.createOscillator();
      const gainCharge = this.ctx.createGain();
      oscCharge.type = 'sine';
      oscCharge.frequency.setValueAtTime(200, t);
      oscCharge.frequency.exponentialRampToValueAtTime(1600, t + 0.35);

      gainCharge.gain.setValueAtTime(0.2, t);
      gainCharge.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
      oscCharge.connect(gainCharge);
      gainCharge.connect(this.ctx.destination);
      oscCharge.start(t);
      oscCharge.stop(t + 0.36);

      // Huge laser explosion
      const oscBlast = this.ctx.createOscillator();
      const gainBlast = this.ctx.createGain();
      oscBlast.type = 'sawtooth';
      oscBlast.frequency.setValueAtTime(450, t + 0.35);
      oscBlast.frequency.exponentialRampToValueAtTime(30, t + 1.1);

      gainBlast.gain.setValueAtTime(0.5, t + 0.35);
      gainBlast.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      oscBlast.connect(gainBlast);
      gainBlast.connect(this.ctx.destination);
      oscBlast.start(t + 0.35);
      oscBlast.stop(t + 1.2);
    } catch {}
  }

  // Button Click / UI Beep
  public playClick() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(500, t + 0.04);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.06);
    } catch {}
  }

  // Gacha Gold / Uber Rare Fanfare
  public playGachaReveal(isUber: boolean = false) {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const notes = isUber
        ? [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98]
        : [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = isUber ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);

        gain.gain.setValueAtTime(0.25, t + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.32);
      });
    } catch {}
  }

  // Victory Fanfare
  public playVictory() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const melody = [
        { f: 523.25, d: 0.15 }, // C5
        { f: 523.25, d: 0.15 }, // C5
        { f: 523.25, d: 0.15 }, // C5
        { f: 659.25, d: 0.35 }, // E5
        { f: 587.33, d: 0.2 },  // D5
        { f: 659.25, d: 0.2 },  // E5
        { f: 783.99, d: 0.5 },  // G5
        { f: 1046.5, d: 0.8 },  // C6
      ];
      let offset = 0;
      melody.forEach((note) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, t + offset);

        gain.gain.setValueAtTime(0.25, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + note.d);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(t + offset);
        osc.stop(t + offset + note.d + 0.05);

        offset += note.d * 0.9;
      });
    } catch {}
  }

  // Defeat sound
  public playDefeat() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const melody = [
        { f: 440, d: 0.3 },
        { f: 415.3, d: 0.3 },
        { f: 392, d: 0.3 },
        { f: 349.23, d: 0.8 },
      ];
      let offset = 0;
      melody.forEach((note) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note.f, t + offset);

        gain.gain.setValueAtTime(0.2, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + note.d);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(t + offset);
        osc.stop(t + offset + note.d + 0.05);

        offset += note.d;
      });
    } catch {}
  }

  // Retro rhythmic Battle Cats march BGM
  public startBattleBgm() {
    if (!this.bgmEnabled || this.isBgmPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    this.isBgmPlaying = true;
    this.playBgmPattern();
  }

  private playBgmPattern() {
    if (!this.isBgmPlaying || !this.bgmEnabled || !this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const tempo = 138;
      const beat = 60 / tempo; // ~0.435s

      // Funky energetic bassline and march lead
      const bassNotes = [130.81, 130.81, 164.81, 196.0, 130.81, 130.81, 174.61, 196.0]; // C3, C3, E3, G3, C3, C3, F3, G3
      const melodyNotes = [
        261.63, 293.66, 329.63, 392.0, 329.63, 293.66, 261.63, 196.0,
        261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 261.63
      ];

      bassNotes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * beat);
        gain.gain.setValueAtTime(0.07, t + idx * beat);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * beat + beat * 0.85);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(t + idx * beat);
        osc.stop(t + idx * beat + beat);
      });

      melodyNotes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t + idx * (beat * 0.5));
        gain.gain.setValueAtTime(0.04, t + idx * (beat * 0.5));
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * (beat * 0.5) + beat * 0.4);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(t + idx * (beat * 0.5));
        osc.stop(t + idx * (beat * 0.5) + beat * 0.5);
      });

      const patternDurationMs = bassNotes.length * beat * 1000;
      this.bgmLoopTimeout = window.setTimeout(() => {
        if (this.isBgmPlaying) {
          this.playBgmPattern();
        }
      }, patternDurationMs);
    } catch {
      this.isBgmPlaying = false;
    }
  }

  public stopBattleBgm() {
    this.isBgmPlaying = false;
    if (this.bgmLoopTimeout) {
      clearTimeout(this.bgmLoopTimeout);
      this.bgmLoopTimeout = null;
    }
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  public toggleBgm(): boolean {
    this.bgmEnabled = !this.bgmEnabled;
    if (!this.bgmEnabled) {
      this.stopBattleBgm();
    }
    return this.bgmEnabled;
  }
}

export const audio = new SoundManager();
