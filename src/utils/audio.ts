// Web Audio API Sound & Music Synthesizer for Battle Cats Web Edition

export type BgmTrack = 'title' | 'map' | 'battle' | 'none';

class SoundManager {
  private ctx: AudioContext | null = null;
  public soundEnabled: boolean = true;
  public bgmEnabled: boolean = true;
  private currentBgm: BgmTrack = 'none';
  private bgmIntervalId: number | null = null;
  private bgmStep: number = 0;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  constructor() {
    // Auto-resume AudioContext on first user interaction anywhere in the window
    if (typeof window !== 'undefined') {
      const handleUserGesture = () => {
        this.initCtx();
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      };
      window.addEventListener('pointerdown', handleUserGesture, { passive: true });
      window.addEventListener('keydown', handleUserGesture, { passive: true });
      window.addEventListener('touchstart', handleUserGesture, { passive: true });
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // ==========================================
  // SFX (EFFECT SOUNDS)
  // ==========================================

  // Cat Spawn Meow / March Cry
  public playCatSpawn(pitchMultiplier: number = 1.0, rarity: string = 'normal') {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;

      if (rarity === 'uber_rare' || rarity === 'super_rare') {
        // Deep majestic summon sound
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(320, t + 0.15);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.35);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.42);
      } else {
        // Cute expressive cat meow sweep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const base = 420 * pitchMultiplier;
        osc.frequency.setValueAtTime(base, t);
        osc.frequency.linearRampToValueAtTime(base * 1.6, t + 0.08);
        osc.frequency.exponentialRampToValueAtTime(base * 1.1, t + 0.24);

        gain.gain.setValueAtTime(0.22, t);
        gain.gain.linearRampToValueAtTime(0.28, t + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.28);
      }
    } catch {}
  }

  // Attack Hit / Impact
  public playHit(isCrit: boolean = false, isAoe: boolean = false) {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      if (isCrit) {
        // Heavy Critical strike crunch
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(380, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.22);

        gain.gain.setValueAtTime(0.45, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.25);
      } else if (isAoe) {
        // Area blast explosion
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.18);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.22);
      } else {
        // Crisp punch / slap
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(260, t);
        osc.frequency.exponentialRampToValueAtTime(70, t + 0.07);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.09);
      }
    } catch {}
  }

  // Knockback "Boing" Recoil
  public playKnockback() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.linearRampToValueAtTime(520, t + 0.09);
      osc.frequency.linearRampToValueAtTime(120, t + 0.2);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.24);
    } catch {}
  }

  // Worker Cat Level Up Chime
  public playWorkerLevelUp() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.05);

        gain.gain.setValueAtTime(0.2, t + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(t + idx * 0.05);
        osc.stop(t + idx * 0.05 + 0.14);
      });
    } catch {}
  }

  // Cannon Blast Sound
  public playCannonBlast() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      // Laser Charge
      const oscCharge = this.ctx.createOscillator();
      const gainCharge = this.ctx.createGain();
      oscCharge.type = 'sine';
      oscCharge.frequency.setValueAtTime(220, t);
      oscCharge.frequency.exponentialRampToValueAtTime(1800, t + 0.35);

      gainCharge.gain.setValueAtTime(0.25, t);
      gainCharge.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
      oscCharge.connect(gainCharge);
      gainCharge.connect(this.sfxGain);
      oscCharge.start(t);
      oscCharge.stop(t + 0.36);

      // Huge Laser Shockwave
      const oscBlast = this.ctx.createOscillator();
      const gainBlast = this.ctx.createGain();
      oscBlast.type = 'sawtooth';
      oscBlast.frequency.setValueAtTime(500, t + 0.35);
      oscBlast.frequency.exponentialRampToValueAtTime(30, t + 1.2);

      gainBlast.gain.setValueAtTime(0.55, t + 0.35);
      gainBlast.gain.exponentialRampToValueAtTime(0.001, t + 1.25);
      oscBlast.connect(gainBlast);
      gainBlast.connect(this.sfxGain);
      oscBlast.start(t + 0.35);
      oscBlast.stop(t + 1.3);
    } catch {}
  }

  // Boss Warning Siren & Bass Drop
  public playBossAlert() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      // Siren wobble
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.linearRampToValueAtTime(880, t + 0.25);
      osc.frequency.linearRampToValueAtTime(440, t + 0.5);
      osc.frequency.linearRampToValueAtTime(880, t + 0.75);
      osc.frequency.linearRampToValueAtTime(440, t + 1.0);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 1.15);
    } catch {}
  }

  // Castle Under Attack Thud
  public playCastleDamage() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch {}
  }

  // Evolution Jingle
  public playEvolution() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);

        gain.gain.setValueAtTime(0.3, t + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.3);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.35);
      });
    } catch {}
  }

  // Victory Fanfare
  public playVictory() {
    if (!this.soundEnabled) return;
    this.stopBgm();
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const melody = [
        { f: 523.25, d: 0.14 }, // C5
        { f: 523.25, d: 0.14 }, // C5
        { f: 523.25, d: 0.14 }, // C5
        { f: 659.25, d: 0.32 }, // E5
        { f: 587.33, d: 0.18 }, // D5
        { f: 659.25, d: 0.18 }, // E5
        { f: 783.99, d: 0.45 }, // G5
        { f: 1046.5, d: 0.75 }, // C6
      ];
      let offset = 0;
      melody.forEach((note) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, t + offset);

        gain.gain.setValueAtTime(0.3, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + note.d);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(t + offset);
        osc.stop(t + offset + note.d + 0.05);

        offset += note.d * 0.88;
      });
    } catch {}
  }

  // Treasure Acquisition Fanfare
  public playTreasureJingle(quality: string = 'gold') {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const pitches =
        quality === 'gold'
          ? [523.25, 659.25, 783.99, 1046.5, 1318.51]
          : [440, 554.37, 659.25, 880];
      pitches.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.07);

        gain.gain.setValueAtTime(0.28, t + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(t + idx * 0.07);
        osc.stop(t + idx * 0.07 + 0.3);
      });
    } catch {}
  }

  // Defeat Theme
  public playDefeat() {
    if (!this.soundEnabled) return;
    this.stopBgm();
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const melody = [
        { f: 440, d: 0.28 },
        { f: 415.3, d: 0.28 },
        { f: 392, d: 0.28 },
        { f: 349.23, d: 0.75 },
      ];
      let offset = 0;
      melody.forEach((note) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note.f, t + offset);

        gain.gain.setValueAtTime(0.22, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + note.d);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(t + offset);
        osc.stop(t + offset + note.d + 0.05);

        offset += note.d * 0.95;
      });
    } catch {}
  }

  // UI Button Click
  public playClick() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(450, t + 0.04);

      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.06);
    } catch {}
  }

  // Gacha Fanfare
  public playGachaReveal(isUber: boolean = false) {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

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

        gain.gain.setValueAtTime(0.28, t + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.3);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.32);
      });
    } catch {}
  }

  // ==========================================
  // SYNTHESIZED BGM ENGINE (Title / Map / Battle)
  // ==========================================

  public switchBgm(track: BgmTrack) {
    if (this.currentBgm === track) return;
    this.stopBgm();
    this.currentBgm = track;
    if (this.bgmEnabled && track !== 'none') {
      this.startBgmLoop(track);
    }
  }

  public startBattleBgm() {
    this.switchBgm('battle');
  }

  public startTitleBgm() {
    this.switchBgm('title');
  }

  public startMapBgm() {
    this.switchBgm('map');
  }

  public stopBattleBgm() {
    this.stopBgm();
  }

  public stopBgm() {
    this.currentBgm = 'none';
    if (this.bgmIntervalId !== null) {
      window.clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
    this.bgmStep = 0;
  }

  private startBgmLoop(track: BgmTrack) {
    this.initCtx();
    if (!this.ctx || !this.musicGain) return;

    this.bgmStep = 0;
    const stepDurationMs = track === 'battle' ? 140 : 180; // Fast march for battle

    this.bgmIntervalId = window.setInterval(() => {
      if (!this.bgmEnabled || !this.ctx || !this.musicGain) return;
      this.renderBgmStep(track);
      this.bgmStep = (this.bgmStep + 1) % 32;
    }, stepDurationMs);
  }

  private renderBgmStep(track: BgmTrack) {
    if (!this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime;

    if (track === 'battle') {
      // 32-step battle march loop (C minor / major upbeat)
      const bassPattern = [
        130.81, 0, 130.81, 164.81, 196.0, 0, 130.81, 164.81,
        174.61, 0, 174.61, 220.0, 196.0, 0, 146.83, 196.0,
        130.81, 0, 130.81, 164.81, 196.0, 0, 130.81, 164.81,
        220.0, 0, 196.0, 174.61, 196.0, 220.0, 246.94, 261.63,
      ];

      const leadPattern = [
        261.63, 0, 329.63, 0, 392.0, 0, 523.25, 392.0,
        349.23, 0, 440.0, 0, 392.0, 329.63, 293.66, 0,
        261.63, 0, 329.63, 0, 392.0, 0, 523.25, 392.0,
        440.0, 523.25, 587.33, 523.25, 440.0, 392.0, 329.63, 293.66,
      ];

      const bassFreq = bassPattern[this.bgmStep % bassPattern.length];
      if (bassFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(bassFreq, t);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.13);
      }

      const leadFreq = leadPattern[this.bgmStep % leadPattern.length];
      if (leadFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(leadFreq, t);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.12);
      }

      // Snare / Hi-hat on every offbeat
      if (this.bgmStep % 2 === 1) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.04);
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.05);
      }
    } else if (track === 'title' || track === 'map') {
      // Cheerful relaxing march (F major / C major)
      const melody = [
        349.23, 0, 349.23, 392.0, 440.0, 0, 523.25, 0,
        440.0, 0, 392.0, 0, 349.23, 293.66, 329.63, 0,
        349.23, 0, 349.23, 392.0, 440.0, 0, 523.25, 587.33,
        523.25, 440.0, 392.0, 349.23, 392.0, 0, 349.23, 0,
      ];

      const bass = [
        174.61, 0, 174.61, 0, 220.0, 0, 261.63, 0,
        220.0, 0, 196.0, 0, 174.61, 0, 196.0, 0,
        174.61, 0, 174.61, 0, 220.0, 0, 261.63, 0,
        261.63, 0, 220.0, 0, 196.0, 0, 174.61, 0,
      ];

      const mFreq = melody[this.bgmStep % melody.length];
      if (mFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(mFreq, t);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.17);
      }

      const bFreq = bass[this.bgmStep % bass.length];
      if (bFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(bFreq, t);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.16);
      }
    }
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  public toggleBgm(): boolean {
    this.bgmEnabled = !this.bgmEnabled;
    if (!this.bgmEnabled) {
      this.stopBgm();
    } else {
      if (this.currentBgm !== 'none') {
        this.startBgmLoop(this.currentBgm);
      }
    }
    return this.bgmEnabled;
  }
}

export const audio = new SoundManager();
