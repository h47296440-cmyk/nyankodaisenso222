// Web Audio API High-Fidelity Music & Sound Synthesizer for Battle Cats Web Edition

export type BgmTrack =
  | 'title'
  | 'map'
  | 'battle_japan'
  | 'battle_future'
  | 'battle_cosmos'
  | 'battle_aku'
  | 'battle_volcano'
  | 'battle_real_legend'
  | 'battle_squirrel_panic'
  | 'boss_normal'
  | 'boss_bunbun'
  | 'boss_final'
  | 'boss_secret_god'
  | 'opening'
  | 'epilogue'
  | 'legend_battle'
  | 'crazed_boss'
  | 'ancient_power'
  | 'none';

type InstrumentType = 'brass' | 'accordion' | 'bass' | 'organ' | 'synth' | 'bell' | 'strings';
type DrumType = 'kick' | 'snare' | 'hihat' | 'cymbal' | 'timpani';

class SoundManager {
  private ctx: AudioContext | null = null;
  public soundEnabled: boolean = true;
  public bgmEnabled: boolean = true;
  public currentBgm: BgmTrack = 'none';
  private pendingBgm: BgmTrack = 'none';

  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Noise Buffer for realistic snares & hi-hats
  private noiseBuffer: AudioBuffer | null = null;

  // High-precision Web Audio clock scheduler
  private isPlayingBgm: boolean = false;
  private currentStep: number = 0;
  private nextNoteTime: number = 0;
  private schedulerTimerId: number | null = null;
  private tempoBpm: number = 136;

  constructor() {
    if (typeof window !== 'undefined') {
      const handleUserGesture = () => {
        this.unlockAudio();
      };
      ['pointerdown', 'mousedown', 'keydown', 'touchstart', 'click', 'scroll'].forEach((ev) => {
        window.addEventListener(ev, handleUserGesture, { passive: true });
      });

      // Handle visibility changes (resume audio when returning to active tab)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.unlockAudio();
          if (this.currentBgm !== 'none' && this.bgmEnabled && !this.isPlayingBgm) {
            this.switchBgm(this.currentBgm);
          }
        }
      });
    }
  }

  public unlockAudio() {
    this.initCtx();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    // Play 1-frame silent buffer synchronously to unlock audio playback on iOS/Safari/Chrome
    try {
      const buffer = this.ctx.createBuffer(1, 1, 22050);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);
      source.start(0);
    } catch {}
  }

  public playTestTone() {
    this.unlockAudio();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, t); // C5
      osc.frequency.setValueAtTime(659.25, t + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, t + 0.2); // G5
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    } catch {}
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
          this.masterGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
          this.masterGain.connect(this.ctx.destination);

          this.sfxGain = this.ctx.createGain();
          this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
          this.sfxGain.connect(this.masterGain);

          this.musicGain = this.ctx.createGain();
          this.musicGain.gain.setValueAtTime(0.55, this.ctx.currentTime);
          this.musicGain.connect(this.masterGain);

          // Generate 2 seconds of white noise for snare & cymbals
          const bufferSize = this.ctx.sampleRate * 2;
          this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const output = this.noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
          }
        }
      } catch (e) {
        console.warn('AudioContext init error:', e);
      }
    }
  }

  // =========================================================================
  // RICH MULTI-TIMBRAL INSTRUMENT SYNTHESIS
  // =========================================================================

  private playInstrumentNote(
    freq: number,
    instrument: InstrumentType,
    duration: number,
    volume: number,
    startTime: number
  ) {
    if (!this.ctx || !this.musicGain || freq <= 0 || !this.bgmEnabled) return;
    try {
      const t = startTime;

      if (instrument === 'brass') {
        // Dual detuned sawtooths with low-pass filter envelope (Trumpet / Horn)
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, t);
        osc1.detune.setValueAtTime(-6, t);

        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(freq, t);
        osc2.detune.setValueAtTime(6, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 1.5, t);
        filter.frequency.exponentialRampToValueAtTime(freq * 5.0, t + 0.05);
        filter.frequency.exponentialRampToValueAtTime(freq * 1.8, t + duration);
        filter.Q.setValueAtTime(3, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.exponentialRampToValueAtTime(volume * 0.45, t + 0.03);
        gain.gain.setValueAtTime(volume * 0.4, t + duration * 0.8);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + duration + 0.05);
        osc2.stop(t + duration + 0.05);
      } else if (instrument === 'accordion') {
        // Bright pulse wave with warm chorus (Iconic battle march sound)
        const osc = this.ctx.createOscillator();
        const sub = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t);

        sub.type = 'triangle';
        sub.frequency.setValueAtTime(freq * 0.5, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3200, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.exponentialRampToValueAtTime(volume * 0.35, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        osc.connect(filter);
        sub.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(t);
        sub.start(t);
        osc.stop(t + duration + 0.02);
        sub.stop(t + duration + 0.02);
      } else if (instrument === 'bass') {
        // Warm picked/tuba acoustic bass (triangle + sub-sine with resonant lowpass)
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, t);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 0.5, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 4.5, t);
        filter.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.12);
        filter.Q.setValueAtTime(2, t);

        gain.gain.setValueAtTime(volume * 0.6, t);
        gain.gain.exponentialRampToValueAtTime(volume * 0.3, t + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + duration + 0.05);
        osc2.stop(t + duration + 0.05);
      } else if (instrument === 'synth') {
        // Future synth lead with analog glide
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 3, t);
        filter.frequency.exponentialRampToValueAtTime(freq * 1.2, t + duration);
        filter.Q.setValueAtTime(4, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.exponentialRampToValueAtTime(volume * 0.3, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(t);
        osc.stop(t + duration + 0.05);
      } else if (instrument === 'organ' || instrument === 'strings') {
        // Multi-drawbar organ / choir pad
        [1, 2, 3].forEach((harmonic, idx) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq * harmonic, t);

          const hVol = (volume * 0.22) / (idx + 1);
          gain.gain.setValueAtTime(0.001, t);
          gain.gain.exponentialRampToValueAtTime(hVol, t + 0.05);
          gain.gain.setValueAtTime(hVol * 0.8, t + duration * 0.85);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

          osc.connect(gain);
          gain.connect(this.musicGain!);
          osc.start(t);
          osc.stop(t + duration + 0.05);
        });
      } else if (instrument === 'bell') {
        // Crystal celestial bell FM
        const osc = this.ctx.createOscillator();
        const mod = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        mod.type = 'sine';
        mod.frequency.setValueAtTime(freq * 2.76, t);
        modGain.gain.setValueAtTime(freq * 1.2, t);
        modGain.gain.exponentialRampToValueAtTime(0.1, t + duration);

        gain.gain.setValueAtTime(volume * 0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        mod.connect(modGain);
        modGain.connect(osc.frequency);
        osc.connect(gain);
        gain.connect(this.musicGain);

        mod.start(t);
        osc.start(t);
        mod.stop(t + duration + 0.05);
        osc.stop(t + duration + 0.05);
      }
    } catch {}
  }

  // =========================================================================
  // REALISTIC DRUMS & PERCUSSION
  // =========================================================================

  private playDrum(drum: DrumType, startTime: number, volume: number) {
    if (!this.ctx || !this.musicGain || !this.bgmEnabled) return;
    try {
      const t = startTime;

      if (drum === 'kick') {
        // Deep punchy bass drum with fast pitch drop
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(38, t + 0.07);

        gain.gain.setValueAtTime(volume * 0.65, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.13);
      } else if (drum === 'snare') {
        // Bandpassed noise burst + tonal snap body
        if (this.noiseBuffer) {
          const noise = this.ctx.createBufferSource();
          noise.buffer = this.noiseBuffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1200, t);
          filter.Q.setValueAtTime(1.5, t);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(volume * 0.45, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.musicGain);
          noise.start(t);
          noise.stop(t + 0.13);
        }

        // Snare body tone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(70, t + 0.05);
        gain.gain.setValueAtTime(volume * 0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.07);
      } else if (drum === 'hihat') {
        // Crisp hi-hat sizzle
        if (this.noiseBuffer) {
          const noise = this.ctx.createBufferSource();
          noise.buffer = this.noiseBuffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(7500, t);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(volume * 0.25, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.musicGain);
          noise.start(t);
          noise.stop(t + 0.05);
        }
      } else if (drum === 'cymbal') {
        // Shimmering crash cymbal
        if (this.noiseBuffer) {
          const noise = this.ctx.createBufferSource();
          noise.buffer = this.noiseBuffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(5000, t);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(volume * 0.4, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.musicGain);
          noise.start(t);
          noise.stop(t + 0.46);
        }
      } else if (drum === 'timpani') {
        // Resonant orchestral timpani roll
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.exponentialRampToValueAtTime(65, t + 0.18);

        gain.gain.setValueAtTime(volume * 0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.23);
      }
    } catch {}
  }

  // =========================================================================
  // HIGH-PRECISION WEB AUDIO SCHEDULER (ROCK-SOLID BPM TIMING)
  // =========================================================================

  public switchBgm(track: BgmTrack) {
    if (this.currentBgm === track && this.isPlayingBgm) return;
    this.stopBgm();
    this.currentBgm = track;
    if (this.bgmEnabled && track !== 'none') {
      this.initCtx();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      this.startMusicScheduler(track);
    }
  }

  public startBattleBgm(
    chapterIdentifier?: string | number,
    isBoss?: boolean,
    isFinal?: boolean,
    stageId?: string,
    bgType?: string
  ) {
    const chapStr = String(chapterIdentifier || '').toLowerCase();
    const stId = String(stageId || '').toLowerCase();
    const bgStr = String(bgType || '').toLowerCase();

    // 1. Squirrel Panic Stages
    if (stId.includes('squirrel') || stId.includes('panic') || bgStr.includes('squirrel')) {
      this.switchBgm('battle_squirrel_panic');
      return;
    }

    // 2. Aku Realm / Demon Stages
    if (chapStr.includes('aku') || stId.includes('aku') || bgStr.includes('aku')) {
      if (isFinal || isBoss) {
        this.switchBgm('boss_bunbun');
      } else {
        this.switchBgm('battle_aku');
      }
      return;
    }

    // 3. Volcano Stages
    if (bgStr.includes('volcano') || stId.includes('volcano')) {
      if (isFinal) {
        this.switchBgm('boss_final');
      } else if (isBoss) {
        this.switchBgm('boss_bunbun');
      } else {
        this.switchBgm('battle_volcano');
      }
      return;
    }

    // 4. Real Legend Story Stages
    if (chapStr.includes('real_legend') || stId.includes('real_legend')) {
      if (isFinal) {
        this.switchBgm('ancient_power');
      } else if (isBoss) {
        this.switchBgm('boss_bunbun');
      } else {
        this.switchBgm('battle_real_legend');
      }
      return;
    }

    // 5. Ancient Power / Final Legend
    if (stId === 'legend_21_2' || stId.includes('ancient_power') || chapStr.includes('legend_21')) {
      this.switchBgm('ancient_power');
      return;
    }

    if (chapStr.includes('crazed') || chapStr === 'crazed_event') {
      this.switchBgm('crazed_boss');
      return;
    }

    if (chapStr.includes('legend')) {
      if (isFinal) {
        this.switchBgm('boss_final');
      } else if (isBoss) {
        this.switchBgm('boss_bunbun');
      } else {
        this.switchBgm('legend_battle');
      }
      return;
    }

    if (isFinal) {
      this.switchBgm('boss_final');
    } else if (isBoss) {
      if (chapStr.includes('cosmos') || chapStr.includes('future') || (typeof chapterIdentifier === 'number' && chapterIdentifier >= 3)) {
        this.switchBgm('boss_bunbun');
      } else {
        this.switchBgm('boss_normal');
      }
    } else {
      if (chapStr.includes('cosmos') || (typeof chapterIdentifier === 'number' && chapterIdentifier >= 7)) {
        this.switchBgm('battle_cosmos');
      } else if (chapStr.includes('future') || (typeof chapterIdentifier === 'number' && chapterIdentifier >= 4)) {
        this.switchBgm('battle_future');
      } else {
        this.switchBgm('battle_japan');
      }
    }
  }

  public startBossBgm() {
    this.switchBgm('boss_normal');
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
    this.isPlayingBgm = false;
    this.currentBgm = 'none';
    if (this.schedulerTimerId !== null) {
      window.clearInterval(this.schedulerTimerId);
      this.schedulerTimerId = null;
    }
    this.currentStep = 0;
  }

  private startMusicScheduler(track: BgmTrack) {
    if (!this.ctx) return;

    if (this.schedulerTimerId !== null) {
      window.clearInterval(this.schedulerTimerId);
      this.schedulerTimerId = null;
    }

    this.isPlayingBgm = true;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    // Tempo mapping
    if (track === 'battle_squirrel_panic') this.tempoBpm = 182;
    else if (track === 'boss_secret_god') this.tempoBpm = 164;
    else if (track === 'crazed_boss') this.tempoBpm = 160;
    else if (track === 'ancient_power') this.tempoBpm = 156;
    else if (track === 'battle_volcano') this.tempoBpm = 154;
    else if (track === 'boss_final') this.tempoBpm = 152;
    else if (track === 'battle_real_legend') this.tempoBpm = 148;
    else if (track === 'boss_bunbun') this.tempoBpm = 148;
    else if (track === 'battle_aku') this.tempoBpm = 146;
    else if (track === 'legend_battle') this.tempoBpm = 144;
    else if (track === 'boss_normal') this.tempoBpm = 142;
    else if (track === 'battle_cosmos') this.tempoBpm = 138;
    else if (track === 'battle_future') this.tempoBpm = 134;
    else if (track === 'battle_japan') this.tempoBpm = 136;
    else if (track === 'opening') this.tempoBpm = 126;
    else if (track === 'epilogue') this.tempoBpm = 104;
    else this.tempoBpm = 120; // title / map

    const bpm = Math.max(60, this.tempoBpm || 120);
    // 16th note duration in seconds
    const secondsPer16th = (60 / bpm) / 4;

    // Schedule 120ms into future every 25ms
    this.schedulerTimerId = window.setInterval(() => {
      if (!this.isPlayingBgm || !this.ctx || !this.bgmEnabled) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
        return;
      }

      if (this.nextNoteTime < this.ctx.currentTime) {
        this.nextNoteTime = this.ctx.currentTime + 0.02;
      }

      let maxIterations = 8;
      while (this.nextNoteTime < this.ctx.currentTime + 0.12 && maxIterations-- > 0) {
        this.scheduleStep(track, this.currentStep, this.nextNoteTime, secondsPer16th);
        this.nextNoteTime += secondsPer16th;
        this.currentStep = (this.currentStep + 1) % 64; // 4-bar loop of 16ths
      }
    }, 25);
  }

  // Musical Note Frequencies
  private readonly NOTE = {
    C1: 32.70, Cs1: 34.65, D1: 36.71, Ds1: 38.89, E1: 41.20, F1: 43.65, Fs1: 46.25, G1: 49.00, Gs1: 51.91, A1: 55.00, As1: 58.27, Bb1: 58.27, B1: 61.74,
    C2: 65.41, Cs2: 69.30, D2: 73.42, Ds2: 77.78, E2: 82.41, F2: 87.31, Fs2: 92.50, G2: 98.0, Gs2: 103.83, A2: 110.0, As2: 116.54, Bb2: 116.54, B2: 123.47,
    C3: 130.81, Cs3: 138.59, D3: 146.83, Ds3: 155.56, E3: 164.81, F3: 174.61, Fs3: 185.0, G3: 196.0, Gs3: 207.65, A3: 220.0, As3: 233.08, Bb3: 233.08, B3: 246.94,
    C4: 261.63, Cs4: 277.18, D4: 293.66, Ds4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.0, Gs4: 415.3, A4: 440.0, As4: 466.16, Bb4: 466.16, B4: 493.88,
    C5: 523.25, Cs5: 554.37, D5: 587.33, Ds5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, Gs5: 830.61, A5: 880.0, As5: 932.33, Bb5: 932.33, B5: 987.77,
    C6: 1046.5, Cs6: 1108.73, D6: 1174.66, Ds6: 1244.51, E6: 1318.51, F6: 1396.91, Fs6: 1479.98, G6: 1567.98, Gs6: 1661.22, A6: 1760.0, As6: 1864.66, Bb6: 1864.66, B6: 1975.53,
    C7: 2093.0, Cs7: 2217.46, D7: 2349.32, Ds7: 2489.02, E7: 2637.02, F7: 2793.83, Fs7: 2959.96, G7: 3135.96, Gs7: 3322.44, A7: 3520.0, As7: 3729.31, Bb7: 3729.31, B7: 3951.07,
  };

  private scheduleStep(track: BgmTrack, step: number, time: number, stepSec: number) {
    const N = this.NOTE;
    const dur1 = stepSec * 0.9;
    const dur2 = stepSec * 1.8;
    const dur4 = stepSec * 3.6;

    // =========================================================================
    // 1. JAPAN BATTLE MARCH (日本編 戦闘テーマ - Iconic Battle Cats March)
    // =========================================================================
    if (track === 'battle_japan') {
      // 64-step melody (Trumpet / Accordion)
      const melody: number[] = [
        // Bar 1
        N.C5, 0, N.E5, 0, N.G5, 0, N.C6, N.G5,
        N.E5, 0, N.C5, 0, N.D5, N.E5, N.F5, 0,
        // Bar 2
        N.D5, 0, N.F5, 0, N.A5, 0, N.G5, N.F5,
        N.E5, 0, N.D5, 0, N.C5, 0, 0, 0,
        // Bar 3 (Fanfare rise)
        N.C5, N.C5, N.E5, N.E5, N.G5, N.G5, N.C6, 0,
        N.B5, 0, N.A5, 0, N.G5, N.F5, N.E5, 0,
        // Bar 4 (March climax)
        N.F5, 0, N.A5, 0, N.G5, N.F5, N.E5, N.D5,
        N.C5, 0, N.G4, 0, N.C5, 0, 0, 0,
      ];

      // Bouncy Tuba Walking Bass
      const bass: number[] = [
        // Bar 1
        N.C3, 0, N.G2, 0, N.C3, 0, N.G2, 0,
        N.C3, 0, N.E3, 0, N.G3, 0, N.G2, 0,
        // Bar 2
        N.D3, 0, N.G2, 0, N.D3, 0, N.G2, 0,
        N.G2, 0, N.B2, 0, N.C3, 0, N.G2, 0,
        // Bar 3
        N.C3, 0, N.E3, 0, N.G3, 0, N.E3, 0,
        N.F3, 0, N.C3, 0, N.G3, 0, N.G2, 0,
        // Bar 4
        N.F3, 0, N.D3, 0, N.G3, 0, N.G2, 0,
        N.C3, 0, N.G2, 0, N.C3, 0, N.G2, 0,
      ];

      const mNote = melody[step];
      if (mNote > 0) {
        this.playInstrumentNote(mNote, 'brass', dur2, 0.8, time);
        this.playInstrumentNote(mNote, 'accordion', dur1, 0.45, time);
      }

      const bNote = bass[step];
      if (bNote > 0) {
        this.playInstrumentNote(bNote, 'bass', dur1, 0.9, time);
      }

      // Marching Drum Cadence (Kick, Snare Rolls, Hi-Hats)
      if (step % 4 === 0) {
        this.playDrum('kick', time, 0.9);
      }
      if (step % 4 === 2) {
        this.playDrum('snare', time, 0.85);
      }
      if (step % 2 === 1) {
        this.playDrum('hihat', time, 0.4);
      }
      if (step === 0 || step === 32) {
        this.playDrum('cymbal', time, 0.7);
      }
    }

    // =========================================================================
    // 2. FUTURE CYBER BATTLE (未来編 サイバー戦闘テーマ)
    // =========================================================================
    else if (track === 'battle_future') {
      const bassFuture: number[] = [
        N.A2, N.A2, 0, N.A2, N.C3, 0, N.D3, 0,
        N.A2, N.A2, 0, N.A2, N.G3, 0, N.E3, 0,
        N.F2, N.F2, 0, N.F2, N.A2, 0, N.C3, 0,
        N.G2, N.G2, 0, N.G2, N.B2, 0, N.D3, 0,
        N.A2, N.A2, 0, N.A2, N.C3, 0, N.D3, 0,
        N.A2, N.A2, 0, N.A2, N.G3, 0, N.E3, 0,
        N.F2, N.F2, 0, N.F2, N.G2, 0, N.G2, 0,
        N.A2, 0, N.C3, 0, N.E3, 0, N.G3, 0,
      ];

      const leadFuture: number[] = [
        N.A4, 0, N.C5, 0, N.E5, 0, N.D5, N.C5,
        N.A4, 0, N.G4, 0, N.A4, 0, 0, 0,
        N.F4, 0, N.A4, 0, N.C5, 0, N.B4, 0,
        N.G4, 0, N.B4, 0, N.D5, 0, N.C5, N.B4,
        N.A4, 0, N.C5, 0, N.E5, 0, N.G5, 0,
        N.F5, 0, N.E5, 0, N.D5, 0, N.C5, 0,
        N.D5, 0, N.E5, 0, N.F5, 0, N.G5, 0,
        N.A5, 0, 0, 0, 0, 0, 0, 0,
      ];

      const bNote = bassFuture[step];
      if (bNote > 0) {
        this.playInstrumentNote(bNote, 'synth', dur1, 0.85, time);
      }

      const lNote = leadFuture[step];
      if (lNote > 0) {
        this.playInstrumentNote(lNote, 'brass', dur2, 0.75, time);
        this.playInstrumentNote(lNote, 'synth', dur2, 0.5, time);
      }

      // Cyber Kick & Snare
      if (step % 4 === 0 || step % 8 === 6) {
        this.playDrum('kick', time, 0.95);
      }
      if (step % 4 === 2) {
        this.playDrum('snare', time, 0.9);
      }
      this.playDrum('hihat', time, 0.35);
    }

    // =========================================================================
    // 3. COSMOS CELESTIAL BATTLE (宇宙編 コズミック戦闘テーマ)
    // =========================================================================
    else if (track === 'battle_cosmos') {
      const bellArp: number[] = [
        N.C5, N.E5, N.G5, N.C6, N.B5, N.G5, N.E5, N.D5,
        N.C5, N.E5, N.G5, N.C6, N.D6, N.B5, N.G5, N.E5,
        N.A4, N.C5, N.E5, N.A5, N.G5, N.E5, N.C5, N.B4,
        N.F4, N.A4, N.C5, N.F5, N.G4, N.B4, N.D5, N.G5,
        N.C5, N.E5, N.G5, N.C6, N.B5, N.G5, N.E5, N.D5,
        N.C5, N.E5, N.G5, N.C6, N.D6, N.B5, N.G5, N.E5,
        N.A4, N.C5, N.E5, N.A5, N.B4, N.D5, N.G5, N.B5,
        N.C5, N.G5, N.E5, N.C6, N.G5, N.E5, N.C5, 0,
      ];

      const bassCosmos: number[] = [
        N.C3, 0, 0, 0, N.G2, 0, 0, 0,
        N.C3, 0, 0, 0, N.E3, 0, N.G2, 0,
        N.A2, 0, 0, 0, N.E2, 0, 0, 0,
        N.F2, 0, 0, 0, N.G2, 0, 0, 0,
        N.C3, 0, 0, 0, N.G2, 0, 0, 0,
        N.C3, 0, 0, 0, N.E3, 0, N.G2, 0,
        N.A2, 0, 0, 0, N.G2, 0, 0, 0,
        N.C3, 0, 0, 0, N.C3, 0, 0, 0,
      ];

      const bArp = bellArp[step];
      if (bArp > 0) {
        this.playInstrumentNote(bArp, 'bell', dur1, 0.7, time);
      }

      const bNote = bassCosmos[step];
      if (bNote > 0) {
        this.playInstrumentNote(bNote, 'bass', dur4, 0.9, time);
        this.playInstrumentNote(bNote * 2, 'organ', dur4, 0.4, time);
      }

      // Driving space beat
      if (step % 4 === 0) this.playDrum('kick', time, 0.85);
      if (step % 4 === 2) this.playDrum('snare', time, 0.8);
      if (step % 2 === 0) this.playDrum('hihat', time, 0.3);
    }

    // =========================================================================
    // 4. NORMAL BOSS BATTLE (強敵・ボス出現テーマ - カオル君/赤羅我王)
    // =========================================================================
    else if (track === 'boss_normal') {
      const bossBass: number[] = [
        N.A2, N.A2, N.C3, N.A2, N.D3, N.A2, N.C3, N.A2,
        N.A2, N.A2, N.C3, N.A2, N.E3, N.D3, N.C3, N.A2,
        N.G2, N.G2, N.B2, N.G2, N.C3, N.G2, N.B2, N.G2,
        N.F2, N.F2, N.A2, N.F2, N.G2, N.G2, N.B2, N.G2,
        N.A2, N.A2, N.C3, N.A2, N.D3, N.A2, N.C3, N.A2,
        N.A2, N.A2, N.C3, N.A2, N.E3, N.D3, N.C3, N.A2,
        N.F2, 0, N.G2, 0, N.Gs2, 0, N.A2, 0,
        N.B2, 0, N.C3, 0, N.D3, 0, N.E3, 0,
      ];

      const bossLead: number[] = [
        N.A4, 0, N.C5, 0, N.D5, 0, N.E5, N.D5,
        N.C5, N.A4, N.C5, N.D5, N.E5, 0, 0, 0,
        N.G4, 0, N.B4, 0, N.C5, 0, N.D5, N.C5,
        N.B4, N.G4, N.B4, N.C5, N.D5, 0, 0, 0,
        N.A4, 0, N.C5, 0, N.D5, 0, N.E5, N.D5,
        N.C5, N.A4, N.C5, N.D5, N.E5, 0, 0, 0,
        N.F5, 0, N.E5, 0, N.Ds5, 0, N.D5, 0,
        N.C5, 0, N.B4, 0, N.A4, 0, 0, 0,
      ];

      const bNote = bossBass[step];
      if (bNote > 0) {
        this.playInstrumentNote(bNote, 'bass', dur1, 0.9, time);
      }

      const lNote = bossLead[step];
      if (lNote > 0) {
        this.playInstrumentNote(lNote, 'brass', dur2, 0.85, time);
      }

      // Fast War Drums & Timpani
      if (step % 2 === 0) this.playDrum('kick', time, 0.9);
      if (step % 4 === 2) this.playDrum('snare', time, 0.95);
      if (step % 8 === 0) this.playDrum('timpani', time, 0.85);
      this.playDrum('hihat', time, 0.35);
    }

    // =========================================================================
    // 5. BUNBUN BOSS BATTLE (激闘ボス・ぶんぶん先生テーマ)
    // =========================================================================
    else if (track === 'boss_bunbun') {
      const bunbunRiff: number[] = [
        N.E3, N.E3, N.G3, N.E3, N.A3, N.E3, N.As3, N.B3,
        N.E3, N.E3, N.G3, N.E3, N.D4, N.Cs4, N.C4, N.B3,
        N.E3, N.E3, N.G3, N.E3, N.A3, N.E3, N.As3, N.B3,
        N.C4, N.B3, N.A3, N.G3, N.Fs3, N.G3, N.A3, N.B3,
        N.E3, N.E3, N.G3, N.E3, N.A3, N.E3, N.As3, N.B3,
        N.E3, N.E3, N.G3, N.E3, N.D4, N.Cs4, N.C4, N.B3,
        N.C4, 0, N.D4, 0, N.Ds4, 0, N.E4, 0,
        N.G4, 0, N.A4, 0, N.As4, 0, N.B4, 0,
      ];

      const rNote = bunbunRiff[step];
      if (rNote > 0) {
        this.playInstrumentNote(rNote, 'synth', dur1, 0.85, time);
        this.playInstrumentNote(rNote * 2, 'brass', dur1, 0.7, time);
      }

      // Driving Double-Kick Metal Groove
      this.playDrum('kick', time, 0.95);
      if (step % 4 === 2) this.playDrum('snare', time, 1.0);
      if (step % 2 === 1) this.playDrum('hihat', time, 0.4);
      if (step % 16 === 0) this.playDrum('cymbal', time, 0.8);
    }

    // =========================================================================
    // 6. FINAL BOSS EPIC BGM (神域・宇宙創世神 ファイナルネコゴッド)
    // =========================================================================
    else if (track === 'boss_final') {
      // Gothic Cathedral Pipe Organ Chords (C minor -> Ab -> Fm -> G7)
      const chordCm = [N.C4, N.Ds4, N.G4, N.C5];
      const chordAb = [N.Gs3, N.C4, N.Ds4, N.Gs4];
      const chordFm = [N.F3, N.Gs3, N.C4, N.F4];
      const chordG7 = [N.G3, N.B3, N.D4, N.G4];

      if (step % 16 === 0) {
        const chord =
          step < 16 ? chordCm : step < 32 ? chordAb : step < 48 ? chordFm : chordG7;
        chord.forEach((note) => {
          this.playInstrumentNote(note, 'organ', dur4 * 3.5, 0.7, time);
          this.playInstrumentNote(note, 'brass', dur4 * 3.5, 0.5, time);
        });
        this.playDrum('cymbal', time, 0.9);
      }

      // Dramatic Lead Violin / Trumpet melody
      const finalLead: number[] = [
        N.C5, 0, N.Ds5, 0, N.G5, 0, N.C6, 0,
        N.As5, N.G5, N.Ds5, N.G5, N.Ds5, N.C5, N.As4, 0,
        N.Gs4, 0, N.C5, 0, N.Ds5, 0, N.Gs5, 0,
        N.G5, N.Ds5, N.C5, N.Ds5, N.G5, N.Gs5, N.As5, 0,
        N.F4, 0, N.Gs4, 0, N.C5, 0, N.F5, 0,
        N.Ds5, N.C5, N.Gs4, N.C5, N.Ds5, N.C5, N.Gs4, 0,
        N.G4, N.B4, N.D5, N.G5, N.B5, N.D6, N.C6, N.B5,
        N.C6, N.D6, N.E6, N.F6, N.G6, N.F6, N.D6, N.B5,
      ];

      const lNote = finalLead[step];
      if (lNote > 0) {
        this.playInstrumentNote(lNote, 'brass', dur2, 0.9, time);
      }

      // Fast Double Kick & Timpani
      if (step % 2 === 0) this.playDrum('kick', time, 0.95);
      if (step % 4 === 2) this.playDrum('snare', time, 0.95);
      if (step % 4 === 0) this.playDrum('timpani', time, 0.7);
    }

    // =========================================================================
    // 7. TITLE & MAP OVERWORLD BGM (メインメニュー & 日本マップ テーマ)
    // =========================================================================
    else if (track === 'title' || track === 'map') {
      const melodyMap: number[] = [
        N.F4, 0, N.F4, N.G4, N.A4, 0, N.C5, 0,
        N.A4, 0, N.G4, 0, N.F4, N.D4, N.E4, 0,
        N.F4, 0, N.F4, N.G4, N.A4, 0, N.C5, N.D5,
        N.C5, N.A4, N.G4, N.F4, N.G4, 0, N.F4, 0,
        N.A4, 0, N.C5, 0, N.D5, 0, N.F5, 0,
        N.D5, 0, N.C5, 0, N.A4, N.G4, N.F4, 0,
        N.G4, 0, N.A4, 0, N.C5, N.A4, N.G4, 0,
        N.F4, 0, N.C4, 0, N.F4, 0, 0, 0,
      ];

      const bassMap: number[] = [
        N.F3, 0, N.C3, 0, N.A2, 0, N.C3, 0,
        N.A2, 0, N.G2, 0, N.F2, 0, N.C3, 0,
        N.F3, 0, N.C3, 0, N.A2, 0, N.C3, 0,
        N.C3, 0, N.A2, 0, N.G2, 0, N.F2, 0,
        N.F3, 0, N.A2, 0, N.Bb2, 0, N.D3, 0,
        N.Bb2, 0, N.F3, 0, N.D3, 0, N.F2, 0,
        N.C3, 0, N.E3, 0, N.G3, 0, N.C3, 0,
        N.F3, 0, N.C3, 0, N.F2, 0, 0, 0,
      ];

      const mNote = melodyMap[step];
      if (mNote > 0) {
        this.playInstrumentNote(mNote, 'accordion', dur2, 0.7, time);
        this.playInstrumentNote(mNote, 'brass', dur2, 0.5, time);
      }

      const bNote = bassMap[step];
      if (bNote > 0) {
        this.playInstrumentNote(bNote, 'bass', dur1, 0.8, time);
      }

      // Gentle bouncy march percussion
      if (step % 4 === 0) this.playDrum('kick', time, 0.7);
      if (step % 4 === 2) this.playDrum('snare', time, 0.65);
      if (step % 2 === 1) this.playDrum('hihat', time, 0.25);
    }

    // =========================================================================
    // 9. OPENING PROLOGUE MARCH (壮大な巻物オープニング・序曲)
    // =========================================================================
    if (track === 'opening') {
      const melodyOpening: number[] = [
        // Bar 1 (Epic Horn Fanfare)
        N.C4, 0, N.G4, 0, N.C5, 0, N.E5, N.D5,
        N.C5, 0, N.G4, 0, N.E4, 0, N.G4, 0,
        // Bar 2
        N.F4, 0, N.A4, 0, N.C5, 0, N.B4, N.A4,
        N.G4, 0, N.F4, 0, N.E4, 0, 0, 0,
        // Bar 3 (Rising Call)
        N.G4, 0, N.C5, 0, N.E5, 0, N.G5, N.F5,
        N.E5, 0, N.D5, 0, N.C5, N.D5, N.E5, 0,
        // Bar 4 (Grand resolution)
        N.F5, 0, N.E5, 0, N.D5, 0, N.G4, 0,
        N.C5, 0, N.G4, 0, N.C5, 0, 0, 0,
      ];

      const bassOpening: number[] = [
        N.C3, 0, N.G2, 0, N.C3, 0, N.E3, 0,
        N.C3, 0, N.G2, 0, N.C3, 0, N.G2, 0,
        N.F2, 0, N.C3, 0, N.F2, 0, N.A2, 0,
        N.G2, 0, N.D3, 0, N.G2, 0, N.B2, 0,
        N.E2, 0, N.B2, 0, N.E3, 0, N.G2, 0,
        N.A2, 0, N.E3, 0, N.A2, 0, N.C3, 0,
        N.F2, 0, N.A2, 0, N.G2, 0, N.B2, 0,
        N.C3, 0, N.G2, 0, N.C3, 0, N.C2, 0,
      ];

      const mNote = melodyOpening[step];
      if (mNote > 0) {
        this.playInstrumentNote(mNote, 'brass', dur4, 0.85, time);
        this.playInstrumentNote(mNote, 'strings', dur4, 0.5, time);
      }

      const bNote = bassOpening[step];
      if (bNote > 0) {
        this.playInstrumentNote(bNote, 'bass', dur2, 0.85, time);
      }

      if (step % 8 === 0) this.playDrum('timpani', time, 0.85);
      if (step % 4 === 0) this.playDrum('kick', time, 0.65);
      if (step % 4 === 2) this.playDrum('snare', time, 0.6);
      if (step % 2 === 1) this.playDrum('hihat', time, 0.3);
    }

    // =========================================================================
    // 10. EPILOGUE TWILIGHT WALTZ (哀愁と感動の黄昏エピローグ)
    // =========================================================================
    if (track === 'epilogue') {
      const melodyEpilogue: number[] = [
        // Bar 1 (Warm nostalgic waltz)
        N.G4, 0, 0, N.C5, 0, 0, N.E5, 0,
        N.D5, 0, 0, N.C5, 0, 0, N.B4, 0,
        // Bar 2
        N.A4, 0, 0, N.C5, 0, 0, N.F5, 0,
        N.E5, 0, 0, N.D5, 0, 0, N.C5, 0,
        // Bar 3
        N.E5, 0, 0, N.G5, 0, 0, N.C6, 0,
        N.B5, 0, 0, N.A5, 0, 0, N.G5, 0,
        // Bar 4 (Sweet ending)
        N.F5, 0, 0, N.E5, 0, 0, N.D5, 0,
        N.C5, 0, 0, 0, 0, 0, 0, 0,
      ];

      const bassEpilogue: number[] = [
        N.C3, 0, 0, N.G3, 0, 0, N.E3, 0,
        N.A2, 0, 0, N.E3, 0, 0, N.C3, 0,
        N.F2, 0, 0, N.C3, 0, 0, N.A2, 0,
        N.G2, 0, 0, N.D3, 0, 0, N.B2, 0,
        N.C3, 0, 0, N.G3, 0, 0, N.E3, 0,
        N.F2, 0, 0, N.C3, 0, 0, N.A2, 0,
        N.G2, 0, 0, N.D3, 0, 0, N.G2, 0,
        N.C3, 0, 0, N.G2, 0, 0, N.C2, 0,
      ];

      const mNote = melodyEpilogue[step];
      if (mNote > 0) {
        this.playInstrumentNote(mNote, 'bell', dur4, 0.75, time);
        this.playInstrumentNote(mNote, 'accordion', dur4, 0.45, time);
        this.playInstrumentNote(mNote, 'strings', dur4, 0.55, time);
      }

      const bNote = bassEpilogue[step];
      if (bNote > 0) {
        this.playInstrumentNote(bNote, 'bass', dur2, 0.75, time);
      }

      if (step % 8 === 0) this.playDrum('kick', time, 0.5);
      if (step % 8 === 4) this.playDrum('hihat', time, 0.25);
    }

    // =========================================================================
    // 11. LEGEND STORY BATTLE (古代の冒険・レジェンドストーリー戦闘BGM)
    // =========================================================================
    if (track === 'legend_battle') {
      const melodyLegend: number[] = [
        // Bar 1 (Exotic fast adventure theme)
        N.D4, N.E4, N.F4, 0, N.A4, 0, N.D5, N.C5,
        N.A4, 0, N.F4, 0, N.G4, N.A4, N.Bb4, 0,
        // Bar 2
        N.A4, 0, N.F4, 0, N.D4, 0, N.F4, N.E4,
        N.D4, 0, N.C4, 0, N.D4, 0, 0, 0,
        // Bar 3 (Driving heroic phrase)
        N.D5, 0, N.D5, 0, N.C5, 0, N.A4, 0,
        N.Bb4, 0, N.A4, 0, N.G4, N.F4, N.E4, 0,
        // Bar 4
        N.F4, 0, N.G4, 0, N.A4, 0, N.C5, 0,
        N.D5, 0, N.A4, 0, N.D5, 0, 0, 0,
      ];

      const bassLegend: number[] = [
        N.D3, N.D3, N.A2, N.A2, N.D3, N.D3, N.F3, N.E3,
        N.D3, N.D3, N.A2, N.A2, N.G2, N.G2, N.Bb2, N.C3,
        N.D3, N.D3, N.A2, N.A2, N.D3, N.D3, N.C3, N.C3,
        N.Bb2, N.Bb2, N.A2, N.A2, N.D3, N.D3, N.D2, N.D2,
        N.Bb2, N.Bb2, N.F3, N.F3, N.C3, N.C3, N.G3, N.G3,
        N.G2, N.G2, N.D3, N.D3, N.A2, N.A2, N.E3, N.E3,
        N.Bb2, N.Bb2, N.C3, N.C3, N.D3, N.D3, N.F3, N.F3,
        N.D3, N.D3, N.A2, N.A2, N.D3, 0, 0, 0,
      ];

      const mNote = melodyLegend[step];
      if (mNote > 0) {
        this.playInstrumentNote(mNote, 'brass', dur2, 0.85, time);
        this.playInstrumentNote(mNote, 'synth', dur1, 0.5, time);
      }

      const bNote = bassLegend[step];
      if (bNote > 0) {
        this.playInstrumentNote(bNote, 'bass', dur1, 0.9, time);
      }

      if (step % 4 === 0) this.playDrum('kick', time, 0.85);
      if (step % 4 === 2) this.playDrum('snare', time, 0.8);
      if (step % 2 === 1) this.playDrum('hihat', time, 0.4);
      if (step === 30 || step === 62) this.playDrum('cymbal', time, 0.7);
    }

    // =========================================================================
    // 12. CRAZED BOSS CAT THEME (狂乱降臨ステージ - 絶望の高速激熱メタルBGM)
    // =========================================================================
    if (track === 'crazed_boss') {
      const melodyCrazed: number[] = [
        // Bar 1 (Aggressive distorted riff)
        N.E4, N.E4, N.G4, N.E4, N.Bb4, N.A4, N.G4, N.E4,
        N.D4, N.E4, N.G4, N.E4, N.Bb4, N.A4, N.G4, N.F4,
        // Bar 2 (Furious descent)
        N.E4, N.E4, N.G4, N.E4, N.C5, N.B4, N.Bb4, N.A4,
        N.G4, N.E4, N.D4, N.Ds4, N.E4, 0, 0, 0,
        // Bar 3 (Screaming octaves)
        N.E5, N.E5, N.G5, N.E5, N.Bb5, N.A5, N.G5, N.E5,
        N.D5, N.E5, N.G5, N.E5, N.C6, N.B5, N.Bb5, N.A5,
        // Bar 4 (Breakdown)
        N.G5, N.Fs5, N.F5, N.E5, N.Ds5, N.D5, N.Cs5, N.C5,
        N.B4, N.Bb4, N.A4, N.Gs4, N.G4, 0, N.E4, 0,
      ];

      const bassCrazed: number[] = [
        N.E2, N.E2, N.E2, N.E2, N.E2, N.E2, N.G2, N.A2,
        N.E2, N.E2, N.E2, N.E2, N.Bb2, N.A2, N.G2, N.F2,
        N.E2, N.E2, N.E2, N.E2, N.C3, N.B2, N.Bb2, N.A2,
        N.G2, N.E2, N.D2, N.Ds2, N.E2, N.E2, N.E2, N.E2,
        N.C3, N.C3, N.G2, N.G2, N.D3, N.D3, N.A2, N.A2,
        N.E2, N.E2, N.B2, N.B2, N.C3, N.C3, N.D3, N.D3,
        N.E2, N.E2, N.E2, N.E2, N.Bb2, N.Bb2, N.A2, N.A2,
        N.E2, N.E2, N.B2, N.B2, N.E3, 0, N.E2, 0,
      ];

      const mNote = melodyCrazed[step];
      if (mNote > 0) {
        this.playInstrumentNote(mNote, 'organ', dur1, 0.85, time);
        this.playInstrumentNote(mNote, 'synth', dur1, 0.75, time);
      }

      const bNote = bassCrazed[step];
      if (bNote > 0) {
        this.playInstrumentNote(bNote, 'bass', dur1, 0.95, time);
      }

      // Fast Double-Kick Rock Percussion
      if (step % 2 === 0) this.playDrum('kick', time, 0.95);
      if (step % 4 === 2) this.playDrum('snare', time, 0.9);
      this.playDrum('hihat', time, 0.35);
      if (step % 16 === 0) this.playDrum('cymbal', time, 0.85);
      if (step === 28 || step === 60) this.playDrum('timpani', time, 0.95);
    }

    // =========================================================================
    // 13. ANCIENT POWER (太古の力 - ビッグバン組曲・神話シンフォニー組曲)
    // =========================================================================
    if (track === 'ancient_power') {
      // Big Bang style symphonic progression: Dm -> Bb -> Gm -> A7 -> F -> C -> Bb -> Asus4 -> A
      const chords = [
        [N.D4, N.F4, N.A4, N.D5],     // Dm (0-15)
        [N.Bb3, N.D4, N.F4, N.Bb4],   // Bb (16-31)
        [N.G3, N.Bb3, N.D4, N.G4],    // Gm (32-47)
        [N.A3, N.Cs4, N.E4, N.A4],    // A7 (48-63)
      ];

      // Majestic pipe organ / brass sustained harmony
      if (step % 8 === 0) {
        const chordIdx = Math.floor(step / 16) % 4;
        const currentChord = chords[chordIdx];
        currentChord.forEach((note) => {
          this.playInstrumentNote(note, 'organ', dur4 * 2, 0.6, time);
          this.playInstrumentNote(note, 'strings', dur4 * 2, 0.5, time);
        });
      }

      // Heroic orchestral brass melody with celestial bells
      const melodyAncient: number[] = [
        // Section A (Grand Fanfare Theme)
        N.D5, 0, N.F5, 0, N.A5, 0, N.D6, 0,
        N.C6, N.A5, N.F5, N.A5, N.G5, N.F5, N.E5, 0,
        // Bar 2 (Bb Majesty)
        N.F5, 0, N.Bb5, 0, N.D6, 0, N.F6, 0,
        N.E6, N.D6, N.Bb5, N.D6, N.C6, N.Bb5, N.A5, 0,
        // Bar 3 (Gm Drama)
        N.Bb5, 0, N.D6, 0, N.G6, 0, N.F6, 0,
        N.E6, N.D6, N.Cs6, N.D6, N.E6, N.D6, N.Cs6, 0,
        // Bar 4 (A7 Climax)
        N.A5, N.Cs6, N.E6, N.G6, N.F6, N.E6, N.D6, N.Cs6,
        N.D6, 0, N.A5, 0, N.D5, 0, 0, 0,
      ];

      const bassAncient: number[] = [
        N.D2, N.D3, N.A2, N.D3, N.F2, N.D3, N.A2, N.D3,
        N.D2, N.D3, N.A2, N.D3, N.F2, N.D3, N.E2, N.C3,
        N.Bb2, N.Bb3, N.F2, N.Bb3, N.D2, N.Bb3, N.F2, N.Bb3,
        N.Bb2, N.Bb3, N.F2, N.Bb3, N.C3, N.C4, N.G2, N.C3,
        N.G2, N.G3, N.D3, N.G3, N.Bb2, N.G3, N.D3, N.G3,
        N.G2, N.G3, N.D3, N.G3, N.A2, N.A3, N.E3, N.A3,
        N.A2, N.A3, N.E3, N.A3, N.Cs3, N.A3, N.E3, N.A3,
        N.D2, N.D3, N.A2, N.D3, N.D2, 0, N.D3, 0,
      ];

      const mNote = melodyAncient[step];
      if (mNote > 0) {
        this.playInstrumentNote(mNote, 'brass', dur2, 0.9, time);
        this.playInstrumentNote(mNote, 'bell', dur1, 0.6, time);
        this.playInstrumentNote(mNote * 0.5, 'synth', dur2, 0.45, time);
      }

      const bNote = bassAncient[step];
      if (bNote > 0) {
        this.playInstrumentNote(bNote, 'bass', dur1, 0.95, time);
      }

      // Orchestral percussion with thunderous timpani rolls & crash cymbals
      if (step % 2 === 0) this.playDrum('kick', time, 0.95);
      if (step % 4 === 2) this.playDrum('snare', time, 0.9);
      if (step % 2 === 1) this.playDrum('hihat', time, 0.35);
      if (step % 16 === 0 || step === 48) this.playDrum('cymbal', time, 0.9);
      if (step % 8 === 0 || step === 14 || step === 30 || step === 46 || step === 62) {
        this.playDrum('timpani', time, 0.95);
      }
    }

    // =========================================================================
    // 14. AKU REALM BATTLE (魔界編 戦闘テーマ - Heavy Dark Aku Metal)
    // =========================================================================
    if (track === 'battle_aku') {
      const akuMelody: number[] = [
        N.C5, 0, N.Ds5, 0, N.Fs5, 0, N.G5, 0,
        N.Fs5, N.Ds5, N.C5, N.Ds5, N.C5, 0, N.B4, 0,
        N.C5, 0, N.Ds5, 0, N.Fs5, 0, N.G5, N.Gs5,
        N.G5, N.Fs5, N.Ds5, N.Fs5, N.Ds5, N.C5, N.Ds5, 0,
        N.G5, 0, N.Fs5, 0, N.F5, 0, N.E5, 0,
        N.Ds5, N.D5, N.C5, N.D5, N.Ds5, 0, N.D5, 0,
        N.C5, N.Ds5, N.Fs5, N.G5, N.C6, N.B5, N.Gs5, N.G5,
        N.Fs5, N.Ds5, N.D5, N.B4, N.C5, 0, 0, 0,
      ];

      const akuBass: number[] = [
        N.C2, N.C2, N.G2, N.C2, N.Fs2, N.C2, N.Ds2, N.C2,
        N.C2, N.C2, N.G2, N.C2, N.Fs2, N.C2, N.B1, N.C2,
        N.C2, N.C2, N.G2, N.C2, N.Fs2, N.C2, N.Ds2, N.C2,
        N.C2, N.C2, N.G2, N.C2, N.Gs2, N.G2, N.Fs2, N.Ds2,
        N.Ds2, N.Ds2, N.As2, N.Ds2, N.D2, N.D2, N.A2, N.D2,
        N.Cs2, N.Cs2, N.Gs2, N.Cs2, N.C2, N.C2, N.G2, N.C2,
        N.Gs1, N.Gs2, N.G1, N.G2, N.Fs1, N.Fs2, N.F1, N.F2,
        N.E1, N.E2, N.Ds1, N.Ds2, N.C2, 0, N.C3, 0,
      ];

      if (step % 8 === 0) {
        const chord = [N.C3, N.Ds3, N.Fs3, N.G3];
        chord.forEach((note) => {
          this.playInstrumentNote(note, 'organ', dur4 * 1.5, 0.5, time);
        });
      }

      const m = akuMelody[step];
      if (m > 0) {
        this.playInstrumentNote(m, 'synth', dur2, 0.85, time);
        this.playInstrumentNote(m * 0.5, 'brass', dur2, 0.6, time);
      }
      const b = akuBass[step];
      if (b > 0) {
        this.playInstrumentNote(b, 'bass', dur1, 0.95, time);
      }

      if (step % 2 === 0) this.playDrum('kick', time, 0.9);
      if (step % 4 === 2) this.playDrum('snare', time, 0.85);
      if (step % 2 === 1) this.playDrum('hihat', time, 0.4);
      if (step % 16 === 0) this.playDrum('cymbal', time, 0.8);
    }

    // =========================================================================
    // 15. VOLCANO BATTLE (灼熱火山 戦闘テーマ - Magma Inferno)
    // =========================================================================
    if (track === 'battle_volcano') {
      const volMelody: number[] = [
        N.E5, N.G5, N.A5, N.B5, N.D6, N.B5, N.A5, N.G5,
        N.E5, 0, N.G5, 0, N.E5, N.D5, N.E5, 0,
        N.E5, N.G5, N.A5, N.B5, N.D6, N.E6, N.D6, N.B5,
        N.D6, 0, N.B5, 0, N.A5, N.G5, N.A5, 0,
        N.B5, N.D6, N.E6, 0, N.G6, N.E6, N.D6, N.B5,
        N.A5, N.B5, N.D6, N.B5, N.A5, N.G5, N.E5, 0,
        N.G5, N.A5, N.B5, N.D6, N.E6, N.D6, N.B5, N.A5,
        N.G5, N.E5, N.D5, N.B4, N.E5, 0, 0, 0,
      ];

      const volBass: number[] = [
        N.E2, N.E3, N.B2, N.E3, N.G2, N.E3, N.B2, N.E3,
        N.E2, N.E3, N.B2, N.E3, N.D2, N.D3, N.A2, N.D3,
        N.E2, N.E3, N.B2, N.E3, N.G2, N.E3, N.B2, N.E3,
        N.C3, N.C4, N.G2, N.C3, N.D3, N.D4, N.A2, N.D3,
        N.E2, N.E3, N.B2, N.E3, N.G2, N.E3, N.B2, N.E3,
        N.C3, N.C4, N.G2, N.C3, N.D3, N.D4, N.A2, N.D3,
        N.A2, N.A3, N.E3, N.A3, N.B2, N.B3, N.Fs3, N.B3,
        N.E2, N.E3, N.B2, N.E3, N.E2, 0, N.E3, 0,
      ];

      const m = volMelody[step];
      if (m > 0) {
        this.playInstrumentNote(m, 'brass', dur1 * 1.4, 0.9, time);
        this.playInstrumentNote(m * 0.5, 'synth', dur1 * 1.4, 0.5, time);
      }
      const b = volBass[step];
      if (b > 0) {
        this.playInstrumentNote(b, 'bass', dur1, 0.9, time);
      }

      if (step % 2 === 0) this.playDrum('kick', time, 0.95);
      if (step % 4 === 2) this.playDrum('snare', time, 0.9);
      if (step % 2 === 1) this.playDrum('hihat', time, 0.4);
      if (step % 8 === 4) this.playDrum('timpani', time, 0.8);
      if (step % 16 === 0) this.playDrum('cymbal', time, 0.85);
    }

    // =========================================================================
    // 16. REAL LEGEND BATTLE (真レジェンド 戦闘テーマ - Primal Awakening)
    // =========================================================================
    if (track === 'battle_real_legend') {
      const realMelody: number[] = [
        N.A4, N.C5, N.D5, N.E5, N.G5, N.E5, N.D5, N.C5,
        N.D5, 0, N.E5, 0, N.A4, 0, 0, 0,
        N.A4, N.C5, N.D5, N.E5, N.G5, N.A5, N.G5, N.E5,
        N.G5, 0, N.E5, 0, N.D5, N.C5, N.D5, 0,
        N.E5, N.G5, N.A5, N.C6, N.B5, N.G5, N.A5, 0,
        N.E5, N.G5, N.A5, N.G5, N.E5, N.D5, N.C5, 0,
        N.D5, N.E5, N.G5, N.A5, N.C6, N.D6, N.C6, N.A5,
        N.G5, N.E5, N.D5, N.C5, N.A4, 0, 0, 0,
      ];

      const realBass: number[] = [
        N.A2, N.A2, N.E3, N.A2, N.G2, N.A2, N.E3, N.A2,
        N.D3, N.D3, N.A2, N.D3, N.A2, N.A2, N.E3, N.A2,
        N.A2, N.A2, N.E3, N.A2, N.G2, N.A2, N.E3, N.A2,
        N.C3, N.C3, N.G2, N.C3, N.D3, N.D3, N.A2, N.D3,
        N.A2, N.A2, N.E3, N.A2, N.G2, N.A2, N.E3, N.A2,
        N.F2, N.F2, N.C3, N.F2, N.G2, N.G2, N.D3, N.G2,
        N.D3, N.D3, N.A2, N.D3, N.E3, N.E3, N.B2, N.E3,
        N.A2, N.A2, N.E3, N.A2, N.A2, 0, N.A3, 0,
      ];

      if (step % 8 === 0) {
        const chords = [
          [N.A3, N.C4, N.E4],
          [N.G3, N.B3, N.D4],
          [N.F3, N.A3, N.C4],
          [N.E3, N.Gs3, N.B3]
        ];
        const c = chords[Math.floor(step / 16) % 4];
        c.forEach(n => this.playInstrumentNote(n, 'strings', dur4 * 1.5, 0.45, time));
      }

      const m = realMelody[step];
      if (m > 0) {
        this.playInstrumentNote(m, 'bell', dur2, 0.7, time);
        this.playInstrumentNote(m, 'brass', dur2, 0.8, time);
      }
      const b = realBass[step];
      if (b > 0) {
        this.playInstrumentNote(b, 'bass', dur1, 0.9, time);
      }

      if (step % 2 === 0) this.playDrum('kick', time, 0.9);
      if (step % 4 === 2) this.playDrum('snare', time, 0.85);
      if (step % 2 === 1) this.playDrum('hihat', time, 0.35);
      if (step % 8 === 0) this.playDrum('timpani', time, 0.8);
      if (step % 16 === 0) this.playDrum('cymbal', time, 0.8);
    }

    // =========================================================================
    // 17. SQUIRREL PANIC (リスパニック超速戦闘 - Hyper Fast Comical Chaos)
    // =========================================================================
    if (track === 'battle_squirrel_panic') {
      const sqMelody: number[] = [
        N.F5, N.A5, N.C6, N.A5, N.F5, N.G5, N.A5, N.G5,
        N.F5, N.D5, N.F5, N.D5, N.C5, N.D5, N.F5, 0,
        N.F5, N.A5, N.C6, N.D6, N.C6, N.A5, N.F5, N.G5,
        N.A5, N.C6, N.A5, N.G5, N.F5, 0, N.F5, 0,
        N.D6, N.D6, N.C6, N.A5, N.F5, N.G5, N.A5, N.F5,
        N.G5, N.G5, N.F5, N.D5, N.C5, N.D5, N.F5, N.G5,
        N.A5, N.A5, N.C6, N.D6, N.F6, N.D6, N.C6, N.A5,
        N.G5, N.A5, N.G5, N.E5, N.F5, 0, N.F5, 0,
      ];

      const sqBass: number[] = [
        N.F2, N.F3, N.C3, N.F3, N.F2, N.F3, N.C3, N.F3,
        N.D2, N.D3, N.A2, N.D3, N.Bb2, N.Bb3, N.F2, N.Bb3,
        N.F2, N.F3, N.C3, N.F3, N.F2, N.F3, N.C3, N.F3,
        N.G2, N.G3, N.D3, N.G3, N.C3, N.C4, N.G2, N.C3,
        N.Bb2, N.Bb3, N.F2, N.Bb3, N.F2, N.F3, N.C3, N.F3,
        N.G2, N.G3, N.D3, N.G3, N.C3, N.C4, N.G2, N.C3,
        N.D2, N.D3, N.A2, N.D3, N.Bb2, N.Bb3, N.F2, N.Bb3,
        N.C3, N.C4, N.G2, N.C3, N.F2, 0, N.F3, 0,
      ];

      const m = sqMelody[step];
      if (m > 0) {
        this.playInstrumentNote(m, 'synth', dur1, 0.95, time);
        this.playInstrumentNote(m * 0.5, 'accordion', dur1, 0.65, time);
      }
      const b = sqBass[step];
      if (b > 0) {
        this.playInstrumentNote(b, 'bass', dur1, 0.9, time);
      }

      // Ultra-rapid frantic rhythm
      this.playDrum('kick', time, (step % 2 === 0) ? 0.95 : 0.4);
      if (step % 2 === 1) this.playDrum('snare', time, 0.85);
      this.playDrum('hihat', time, 0.45);
      if (step % 8 === 0) this.playDrum('cymbal', time, 0.75);
    }

    // =========================================================================
    // 18. EXTREME SECRET BOSS: ANCIENT GOD ZERO (太古の力 裏ボス降臨 - God of Creation & Oblivion)
    // =========================================================================
    if (track === 'boss_secret_god') {
      const zeroMelody: number[] = [
        N.D5, N.F5, N.A5, N.D6, N.F6, N.E6, N.D6, N.Cs6,
        N.D6, 0, N.A5, 0, N.F5, N.G5, N.A5, 0,
        N.Bb5, N.D6, N.F6, N.G6, N.F6, N.E6, N.D6, N.C6,
        N.D6, 0, N.Bb5, 0, N.G5, N.A5, N.Bb5, 0,
        N.G5, N.Bb5, N.D6, N.F6, N.E6, N.D6, N.Cs6, N.B5,
        N.Cs6, 0, N.A5, 0, N.E5, N.F5, N.G5, 0,
        N.A5, N.Cs6, N.E6, N.G6, N.F6, N.E6, N.D6, N.Cs6,
        N.D6, N.F6, N.A6, N.D7, N.D6, 0, 0, 0,
      ];

      const zeroBass: number[] = [
        N.D2, N.D3, N.A2, N.D3, N.F2, N.D3, N.A2, N.D3,
        N.D2, N.D3, N.A2, N.D3, N.F2, N.D3, N.Cs3, N.A2,
        N.Bb2, N.Bb3, N.F2, N.Bb3, N.D2, N.Bb3, N.F2, N.Bb3,
        N.Bb2, N.Bb3, N.F2, N.Bb3, N.C3, N.C4, N.G2, N.C3,
        N.G2, N.G3, N.D3, N.G3, N.Bb2, N.G3, N.D3, N.G3,
        N.A2, N.A3, N.E3, N.A3, N.Cs3, N.A3, N.E3, N.A3,
        N.A2, N.A3, N.E3, N.A3, N.Cs3, N.A3, N.E3, N.A3,
        N.D2, N.D3, N.A2, N.D3, N.D2, 0, N.D3, 0,
      ];

      // Massive dark pipe organ layers
      if (step % 8 === 0) {
        const chords = [
          [N.D3, N.F3, N.A3, N.D4],
          [N.Bb2, N.D3, N.F3, N.Bb3],
          [N.G2, N.Bb2, N.D3, N.G3],
          [N.A2, N.Cs3, N.E3, N.A3],
        ];
        const c = chords[Math.floor(step / 16) % 4];
        c.forEach(n => {
          this.playInstrumentNote(n, 'organ', dur4 * 2, 0.7, time);
          this.playInstrumentNote(n, 'strings', dur4 * 2, 0.6, time);
        });
      }

      const m = zeroMelody[step];
      if (m > 0) {
        this.playInstrumentNote(m, 'brass', dur2, 0.95, time);
        this.playInstrumentNote(m, 'bell', dur1, 0.8, time);
        this.playInstrumentNote(m * 0.5, 'synth', dur2, 0.5, time);
      }
      const b = zeroBass[step];
      if (b > 0) {
        this.playInstrumentNote(b, 'bass', dur1, 1.0, time);
      }

      // Thunderous boss drums
      if (step % 2 === 0) this.playDrum('kick', time, 1.0);
      if (step % 4 === 2) this.playDrum('snare', time, 0.95);
      if (step % 2 === 1) this.playDrum('hihat', time, 0.4);
      if (step % 8 === 0 || step === 14 || step === 30 || step === 46 || step === 62) {
        this.playDrum('timpani', time, 1.0);
      }
      if (step % 16 === 0 || step === 48) {
        this.playDrum('cymbal', time, 1.0);
      }
    }
  }

  // =========================================================================
  // JINGLES & SPECIAL FANFARES
  // =========================================================================

  // Complete Victory Fanfare (完全勝利ファンファーレ)
  public playVictory() {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    this.stopBgm();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const notes = [
        { f: 523.25, d: 0.15, offset: 0 },
        { f: 523.25, d: 0.15, offset: 0.16 },
        { f: 523.25, d: 0.15, offset: 0.32 },
        { f: 659.25, d: 0.2, offset: 0.48 },
        { f: 783.99, d: 0.2, offset: 0.68 },
        { f: 1046.5, d: 0.6, offset: 0.88 },
        { f: 1318.51, d: 0.8, offset: 1.48 },
      ];

      notes.forEach((n) => {
        this.playInstrumentNote(n.f, 'brass', n.d, 0.95, t + n.offset);
        this.playInstrumentNote(n.f, 'accordion', n.d, 0.6, t + n.offset);
      });

      // Victory Drum roll
      this.playDrum('timpani', t, 0.9);
      this.playDrum('cymbal', t + 0.88, 1.0);
      this.playDrum('cymbal', t + 1.48, 1.0);
    } catch {}
  }

  // Defeat / Retreat Jingle (敗北・全滅)
  public playDefeat() {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    this.stopBgm();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const notes = [
        { f: 392.0, d: 0.25, offset: 0 },
        { f: 369.99, d: 0.25, offset: 0.28 },
        { f: 349.23, d: 0.25, offset: 0.56 },
        { f: 311.13, d: 0.65, offset: 0.84 },
      ];

      notes.forEach((n) => {
        this.playInstrumentNote(n.f, 'brass', n.d, 0.8, t + n.offset);
        this.playInstrumentNote(n.f * 0.5, 'bass', n.d, 0.7, t + n.offset);
      });
      this.playDrum('timpani', t + 0.84, 0.7);
    } catch {}
  }

  // =========================================================================
  // SFX (EFFECT SOUNDS)
  // =========================================================================

  public playCatSpawn(pitchMultiplier: number = 1.0, rarity: string = 'normal') {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      if (rarity === 'uber_rare' || rarity === 'super_rare') {
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
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const base = 420 * pitchMultiplier;
        osc.frequency.setValueAtTime(base, t);
        osc.frequency.exponentialRampToValueAtTime(base * 1.6, t + 0.08);
        osc.frequency.exponentialRampToValueAtTime(base * 1.1, t + 0.2);

        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.24);
      }
    } catch {}
  }

  public playHit(isCritical: boolean = false, isAoe: boolean = false) {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      if (isCritical) {
        // High explosive metallic critical slash
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.18);

        gain.gain.setValueAtTime(0.45, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.22);
      } else if (isAoe) {
        // Deep explosion impact
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.2);
      } else {
        // Standard punchy hit
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.1);
      }
    } catch {}
  }

  public playKnockback() {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, t);
      osc.frequency.exponentialRampToValueAtTime(160, t + 0.12);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.15);
    } catch {}
  }

  public playCannonCharge() {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.4);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.46);
    } catch {}
  }

  public playCannonFire() {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      // Giant cannon blast
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);

      gain.gain.setValueAtTime(0.65, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.45);

      this.playDrum('cymbal', t, 0.9);
    } catch {}
  }

  public playWaveAttack() {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.35);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.42);
    } catch {}
  }

  public playBossAppear() {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      // Shocking siren / alarm chord
      [220, 277.18, 329.63, 440].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.3);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(t);
        osc.stop(t + 0.65);
      });
      this.playDrum('timpani', t, 1.0);
    } catch {}
  }

  public playCastleDamage() {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.15);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch {}
  }

  public playWorkerUpgrade() {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const notes = [329.63, 440, 554.37, 659.25];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.04);

        gain.gain.setValueAtTime(0.2, t + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.1);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(t + idx * 0.04);
        osc.stop(t + idx * 0.04 + 0.12);
      });
    } catch {}
  }

  public playButtonClick() {
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

  public playClick() {
    this.playButtonClick();
  }

  public playWorkerLevelUp() {
    this.playWorkerUpgrade();
  }

  public playTreasure(quality: string = 'gold') {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const isGold = quality === 'gold';
      const notes = isGold
        ? [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98]
        : [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = isGold ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.07);

        gain.gain.setValueAtTime(0.25, t + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(t + idx * 0.07);
        osc.stop(t + idx * 0.07 + 0.38);
      });
    } catch {}
  }

  public playTreasureJingle(quality: string = 'gold') {
    this.playTreasure(quality);
  }

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

  public playBuzzer() {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.setValueAtTime(130, t + 0.08);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch {}
  }

  public playLevelUp() {
    this.playWorkerUpgrade();
  }

  public playVictoryFanfare() {
    this.playVictory();
  }

  public playDefeatSound() {
    this.playDefeat();
  }

  public playShieldBreak() {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      // High-pitched glass shattering & electric burst
      [1400, 2200, 3100, 950].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t + idx * 0.02);
        osc.frequency.exponentialRampToValueAtTime(100, t + idx * 0.02 + 0.15);

        gain.gain.setValueAtTime(0.3, t + idx * 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.02 + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(t + idx * 0.02);
        osc.stop(t + idx * 0.02 + 0.22);
      });
    } catch {}
  }

  public playSavageBlow() {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      // Massive heavy critical slash impact
      const osc = this.ctx.createOscillator();
      const oscSub = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.22);

      oscSub.type = 'sawtooth';
      oscSub.frequency.setValueAtTime(900, t);
      oscSub.frequency.exponentialRampToValueAtTime(120, t + 0.15);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      oscSub.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      oscSub.start(t);
      osc.stop(t + 0.26);
      oscSub.stop(t + 0.26);
    } catch {}
  }

  public playSurge() {
    if (!this.soundEnabled) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.linearRampToValueAtTime(360, t + 0.18);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.4);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.45);
    } catch {}
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
        this.switchBgm(this.currentBgm);
      }
    }
    return this.bgmEnabled;
  }
}

export const audio = new SoundManager();
