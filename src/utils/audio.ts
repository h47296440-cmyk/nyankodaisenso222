// Web Audio API Sound & Music Synthesizer for Battle Cats Web Edition

export type BgmTrack = 'title' | 'map' | 'battle' | 'boss' | 'boss_final' | 'none';

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
        this.unlockAudio();
      };
      window.addEventListener('pointerdown', handleUserGesture, { passive: true });
      window.addEventListener('mousedown', handleUserGesture, { passive: true });
      window.addEventListener('keydown', handleUserGesture, { passive: true });
      window.addEventListener('touchstart', handleUserGesture, { passive: true });
      window.addEventListener('click', handleUserGesture, { passive: true });
    }
  }

  public unlockAudio() {
    this.initCtx();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private initCtx() {
    if (!this.ctx) {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
          this.masterGain.connect(this.ctx.destination);

          this.sfxGain = this.ctx.createGain();
          this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
          this.sfxGain.connect(this.masterGain);

          this.musicGain = this.ctx.createGain();
          this.musicGain.gain.setValueAtTime(0.42, this.ctx.currentTime);
          this.musicGain.connect(this.masterGain);
        }
      } catch (e) {
        console.warn('AudioContext init error:', e);
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
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;

      if (rarity === 'uber_rare' || rarity === 'super_rare') {
        // Deep majestic summon sound
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(340, t + 0.15);
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
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      if (isCrit) {
        // Heavy Critical strike crunch
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(380, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.18);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.22);
      } else if (isAoe) {
        // Boom AoE explosion
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.22);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.26);
      } else {
        // Standard punch smack
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.1);
      }
    } catch {}
  }

  // Knockback "Poc" sound
  public playKnockback() {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(480, t + 0.09);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.11);
    } catch {}
  }

  // Nyanko Cannon Charge
  public playCannonCharge() {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.linearRampToValueAtTime(800, t + 0.4);

      gain.gain.setValueAtTime(0.05, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.38);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.46);
    } catch {}
  }

  // Nyanko Cannon Fire (Laser Blast)
  public playCannonFire() {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      // Laser beam roar
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.4);

      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.48);
    } catch {}
  }

  // Worker Cat Level Up
  public playWorkerLevelUp() {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, t); // C5
      osc1.frequency.setValueAtTime(659.25, t + 0.08); // E5
      osc1.frequency.setValueAtTime(783.99, t + 0.16); // G5
      osc1.frequency.setValueAtTime(1046.5, t + 0.24); // C6

      osc2.frequency.setValueAtTime(261.63, t);
      osc2.frequency.setValueAtTime(523.25, t + 0.24);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.42);
      osc2.stop(t + 0.42);
    } catch {}
  }

  // Boss Shockwave / Roar on Spawn
  public playBossRoarShockwave() {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      // Heavy boom + sweeping roar
      const osc = this.ctx.createOscillator();
      const noiseGain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.7);

      noiseGain.gain.setValueAtTime(0.45, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

      osc.connect(noiseGain);
      noiseGain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.8);
    } catch {}
  }

  // Elizabeth / Wave Blast Attack (波動)
  public playWaveAttack() {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.linearRampToValueAtTime(330, t + 0.15);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.5);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.6);
    } catch {}
  }

  // Cannon Blast (laser beam blast sound)
  public playCannonBlast() {
    this.playCannonFire();
  }

  // Castle Damage impact
  public playCastleDamage() {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.35);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.4);
    } catch {}
  }

  // Treasure Jingle Fanfare
  public playTreasureJingle(quality: boolean | string = true) {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const isGold = quality === true || quality === 'gold';
      const notes = isGold
        ? [523.25, 659.25, 783.99, 1046.5, 1318.51]
        : [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.09);

        gain.gain.setValueAtTime(0.25, t + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.09 + 0.3);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(t + idx * 0.09);
        osc.stop(t + idx * 0.09 + 0.32);
      });
    } catch {}
  }

  // Boss Alert Roar / Siren
  public playBossAlert() {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      // Dramatic siren sweep
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.linearRampToValueAtTime(800, t + 0.15);
      osc.frequency.linearRampToValueAtTime(300, t + 0.3);
      osc.frequency.linearRampToValueAtTime(900, t + 0.45);
      osc.frequency.linearRampToValueAtTime(200, t + 0.6);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.72);
    } catch {}
  }

  // Victory Fanfare
  public playVictory() {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const melody = [
        { f: 523.25, d: 0.12 },
        { f: 659.25, d: 0.12 },
        { f: 783.99, d: 0.12 },
        { f: 1046.5, d: 0.22 },
        { f: 783.99, d: 0.12 },
        { f: 1046.5, d: 0.5 },
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

        offset += note.d * 0.95;
      });
    } catch {}
  }

  // Defeat Jingle
  public playDefeat() {
    if (!this.soundEnabled) return;
    this.unlockAudio();
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
    this.unlockAudio();
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
    this.unlockAudio();
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
  // SYNTHESIZED BGM ENGINE
  // ==========================================

  public switchBgm(track: BgmTrack) {
    if (this.currentBgm === track && this.bgmIntervalId !== null) return;
    this.stopBgm();
    this.currentBgm = track;
    if (this.bgmEnabled && track !== 'none') {
      this.startBgmLoop(track);
    }
  }

  public startBattleBgm() {
    this.switchBgm('battle');
  }

  public startBossBgm() {
    this.switchBgm('boss');
  }

  public startFinalBossBgm() {
    this.switchBgm('boss_final');
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
    this.unlockAudio();
    if (!this.ctx || !this.musicGain) return;

    this.bgmStep = 0;
    // Step timing:
    // Final Boss: very fast driving 110ms
    // Boss: 125ms
    // Battle: 135ms
    // Title/Map: 175ms
    const stepDurationMs =
      track === 'boss_final' ? 110 : track === 'boss' ? 125 : track === 'battle' ? 135 : 175;

    this.bgmIntervalId = window.setInterval(() => {
      if (!this.bgmEnabled || !this.ctx || !this.musicGain) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      this.renderBgmStep(track);
      this.bgmStep = (this.bgmStep + 1) % 64;
    }, stepDurationMs);
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number) {
    if (!this.ctx || !this.musicGain || freq <= 0) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.95);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + duration);
    } catch {}
  }

  private renderBgmStep(track: BgmTrack) {
    if (!this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime;

    // ----------------------------------------------------
    // 1. FINAL BOSS EPIC BGM (豪華ラスボス専用BGM: 神域の決戦)
    // ----------------------------------------------------
    if (track === 'boss_final') {
      // 64-step epic dramatic minor scale ostinato (C minor -> Ab -> Fm -> G / Bdim)
      const bass64 = [
        // Bars 1-2: Cm
        65.41, 130.81, 65.41, 130.81, 65.41, 130.81, 155.56, 130.81,
        65.41, 130.81, 65.41, 130.81, 196.0, 155.56, 130.81, 98.0,
        // Bars 3-4: Ab
        51.91, 103.83, 51.91, 103.83, 51.91, 103.83, 130.81, 103.83,
        51.91, 103.83, 51.91, 103.83, 155.56, 130.81, 103.83, 77.78,
        // Bars 5-6: Fm
        43.65, 87.31, 43.65, 87.31, 43.65, 87.31, 103.83, 87.31,
        43.65, 87.31, 43.65, 87.31, 130.81, 103.83, 87.31, 65.41,
        // Bars 7-8: G dominant / Climax build
        49.0, 98.0, 49.0, 98.0, 49.0, 98.0, 123.47, 98.0,
        146.83, 123.47, 98.0, 123.47, 196.0, 246.94, 293.66, 392.0,
      ];

      // Soaring Climax Lead (Violin/Synth lead)
      const lead64 = [
        // Phrase 1 (Cm)
        523.25, 0, 622.25, 0, 783.99, 0, 1046.5, 0,
        932.33, 783.99, 622.25, 783.99, 622.25, 523.25, 466.16, 0,
        // Phrase 2 (Ab)
        415.3, 0, 523.25, 0, 622.25, 0, 830.61, 0,
        783.99, 622.25, 523.25, 622.25, 783.99, 830.61, 932.33, 0,
        // Phrase 3 (Fm)
        349.23, 0, 415.3, 0, 523.25, 0, 698.46, 0,
        622.25, 523.25, 415.3, 523.25, 622.25, 523.25, 415.3, 0,
        // Phrase 4 (G7 Climax Run)
        392.0, 493.88, 587.33, 783.99, 987.77, 1174.66, 1046.5, 987.77,
        1046.5, 1174.66, 1318.51, 1396.91, 1567.98, 1396.91, 1174.66, 987.77,
      ];

      // Counter harmony choir / organ chord
      const padChords = [
        261.63, 261.63, 261.63, 261.63, 261.63, 261.63, 261.63, 261.63,
        261.63, 261.63, 261.63, 261.63, 261.63, 261.63, 261.63, 261.63,
        207.65, 207.65, 207.65, 207.65, 207.65, 207.65, 207.65, 207.65,
        207.65, 207.65, 207.65, 207.65, 207.65, 207.65, 207.65, 207.65,
        174.61, 174.61, 174.61, 174.61, 174.61, 174.61, 174.61, 174.61,
        174.61, 174.61, 174.61, 174.61, 174.61, 174.61, 174.61, 174.61,
        196.0, 196.0, 196.0, 196.0, 196.0, 196.0, 196.0, 196.0,
        246.94, 246.94, 246.94, 246.94, 293.66, 293.66, 392.0, 392.0,
      ];

      const bFreq = bass64[this.bgmStep % 64];
      if (bFreq > 0) {
        this.playTone(bFreq, 'sawtooth', 0.1, 0.22);
      }

      const lFreq = lead64[this.bgmStep % 64];
      if (lFreq > 0) {
        this.playTone(lFreq, 'square', 0.18, 0.16);
      }

      if (this.bgmStep % 4 === 0) {
        const pFreq = padChords[this.bgmStep % 64];
        if (pFreq > 0) {
          this.playTone(pFreq, 'triangle', 0.38, 0.18);
        }
      }

      // Fast Double-Kick & Snare Crash Percussion
      if (this.bgmStep % 2 === 0) {
        // Heavy Kick
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);
        gain.gain.setValueAtTime(0.24, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.1);
      } else {
        // High Hat / Snare
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.04);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.05);
      }
    }

    // ----------------------------------------------------
    // 2. BOSS BGM (大ボス戦BGM)
    // ----------------------------------------------------
    else if (track === 'boss') {
      const bassBoss = [
        110.0, 110.0, 130.81, 110.0, 146.83, 110.0, 130.81, 110.0,
        110.0, 110.0, 130.81, 110.0, 164.81, 146.83, 130.81, 110.0,
        98.0, 98.0, 110.0, 98.0, 130.81, 98.0, 110.0, 98.0,
        123.47, 130.81, 146.83, 164.81, 174.61, 164.81, 146.83, 130.81,
      ];

      const leadBoss = [
        440.0, 0, 523.25, 0, 587.33, 0, 659.25, 587.33,
        523.25, 440.0, 523.25, 587.33, 659.25, 0, 0, 0,
        392.0, 0, 440.0, 0, 523.25, 0, 587.33, 523.25,
        493.88, 523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 493.88,
      ];

      const bFreq = bassBoss[this.bgmStep % 32];
      if (bFreq > 0) {
        this.playTone(bFreq, 'sawtooth', 0.11, 0.2);
      }

      const lFreq = leadBoss[this.bgmStep % 32];
      if (lFreq > 0) {
        this.playTone(lFreq, 'square', 0.14, 0.15);
      }

      // Snare hit
      if (this.bgmStep % 2 === 1) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(900, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.04);
        gain.gain.setValueAtTime(0.07, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.05);
      }
    }

    // ----------------------------------------------------
    // 3. NORMAL BATTLE MARCH BGM (通常戦闘BGM)
    // ----------------------------------------------------
    else if (track === 'battle') {
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
        this.playTone(bassFreq, 'triangle', 0.12, 0.22);
      }

      const leadFreq = leadPattern[this.bgmStep % leadPattern.length];
      if (leadFreq > 0) {
        this.playTone(leadFreq, 'square', 0.11, 0.13);
      }

      // Snare / Hi-hat
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
    }

    // ----------------------------------------------------
    // 4. TITLE & MAP OVERWORLD BGM (マップ & タイトルBGM)
    // ----------------------------------------------------
    else if (track === 'title' || track === 'map') {
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
        this.playTone(mFreq, 'sine', 0.16, 0.19);
      }

      const bFreq = bass[this.bgmStep % bass.length];
      if (bFreq > 0) {
        this.playTone(bFreq, 'triangle', 0.15, 0.2);
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
