import React, { useState, useEffect } from 'react';
import { CatDefinition } from '../../types';
import { Volume2, VolumeX, FastForward, Play, Pause, Bot, Maximize2, Minimize2, LogOut, Gamepad2, Sparkles } from 'lucide-react';
import { UnitSpriteRenderer } from './UnitSpriteRenderer';

interface BattleHudProps {
  stageName: string;
  money: number;
  maxMoney: number;
  workerLevel: number;
  maxWorkerLevel: number;
  workerUpgradeCost: number;
  onUpgradeWorker: () => void;
  cannonProgress: number; // 0 to 100
  onFireCannon: () => void;
  isCannonFiring: boolean;
  deckCats: {
    def: CatDefinition;
    activeFormIndex: number;
    cooldownRemaining: number;
    maxCooldown: number;
    cost: number;
  }[];
  onSpawnCat: (catId: string) => void;
  gameSpeed: number;
  onToggleSpeed: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
  isAutoBattle: boolean;
  onToggleAutoBattle: () => void;
  onRetreat: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onTestSound?: () => void;
  gamepadConnected?: boolean;
  controllerName?: string;
  selectedSlotIndex?: number;
  score?: number;
  isScoreAttack?: boolean;
  children?: React.ReactNode;
}

export const BattleHud: React.FC<BattleHudProps> = ({
  stageName,
  money,
  maxMoney,
  workerLevel,
  maxWorkerLevel,
  workerUpgradeCost,
  onUpgradeWorker,
  cannonProgress,
  onFireCannon,
  isCannonFiring,
  deckCats,
  onSpawnCat,
  gameSpeed,
  onToggleSpeed,
  isPaused,
  onTogglePause,
  isAutoBattle,
  onToggleAutoBattle,
  onRetreat,
  soundEnabled,
  onToggleSound,
  onTestSound,
  gamepadConnected = false,
  controllerName = '',
  selectedSlotIndex = 0,
  score = 0,
  isScoreAttack = false,
  children,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle error:', err);
    }
  };

  const canUpgradeWorker = workerLevel < maxWorkerLevel && money >= workerUpgradeCost;
  const isCannonReady = cannonProgress >= 100 && !isCannonFiring;

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col bg-stone-950 overflow-hidden select-none font-['M_PLUS_Rounded_1c'] z-50">
      {/* Top Header Bar */}
      <div className="w-full flex-shrink-0 bg-stone-950/90 backdrop-blur-md px-2 sm:px-4 md:px-6 pt-[max(0.35rem,env(safe-area-inset-top,0px))] pb-1.5 sm:pb-2 flex items-center justify-between gap-2 z-30 pointer-events-auto border-b border-stone-800/80">
        {/* Top-Left: Circular Yellow Pause Button + Stage Name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink">
          {/* Pause Button (Switch + / Esc) */}
          <button
            id="btn-toggle-pause"
            onClick={onTogglePause}
            className="relative flex-shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-yellow-400 hover:bg-yellow-300 active:scale-90 border-[3px] border-black flex items-center justify-center shadow-lg transition-transform"
            title={isPaused ? '再開 (+)' : '一時停止 (+)'}
          >
            {isPaused ? (
              <Play size={18} className="text-black fill-black ml-0.5" />
            ) : (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-4 sm:h-4.5 bg-black rounded-sm" />
                <div className="w-1.5 h-4 sm:h-4.5 bg-black rounded-sm" />
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 bg-stone-900 text-yellow-300 border border-yellow-400 text-[8px] sm:text-[9px] font-black rounded-full px-1">
              +
            </span>
          </button>

          {/* Stage Name with Black Stroke Typography and truncation */}
          <div className="min-w-0 max-w-[150px] sm:max-w-[260px] md:max-w-[380px] lg:max-w-[500px]">
            <span
              className="block truncate text-base sm:text-xl md:text-2xl lg:text-3xl font-black tracking-wide text-yellow-400 drop-shadow select-none"
              style={{
                textShadow:
                  '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 3px 6px rgba(0,0,0,0.9)',
              }}
            >
              {stageName || 'ステージ'}
            </span>
          </div>

          {/* Gamepad / Controller Connection Badge */}
          {gamepadConnected && (
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/80 rounded-full text-emerald-300 text-[11px] font-black shadow-md animate-pulse whitespace-nowrap">
              <Gamepad2 size={15} />
              <span>Switchコントローラー</span>
            </div>
          )}

          {/* Score Attack Live Score Badge */}
          {isScoreAttack && (
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 border-2 border-yellow-300 rounded-full text-stone-950 font-black shadow-[0_0_12px_rgba(234,179,8,0.7)] animate-pulse whitespace-nowrap">
              <span className="text-[10px] sm:text-xs tracking-tight uppercase bg-black/80 text-yellow-300 px-1.5 py-0.5 rounded-full font-mono">
                SCORE
              </span>
              <span className="text-xs sm:text-base font-mono tracking-wider text-black">
                {score.toLocaleString()} <span className="text-[10px] sm:text-xs">pt</span>
              </span>
            </div>
          )}
        </div>

        {/* Top Center-Right Utility Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0">
          {/* Audio Test / Sound Resume Button */}
          {onTestSound && (
            <button
              id="btn-test-sound"
              onClick={onTestSound}
              className="p-1 sm:px-2 sm:py-1 rounded-lg text-xs font-black bg-stone-800 hover:bg-stone-700 active:scale-95 text-yellow-300 border border-yellow-500/50 flex items-center gap-1 shadow-md"
              title="BGM・効果音テスト / 音声ロック解除"
            >
              <Sparkles size={13} />
              <span className="hidden md:inline text-[11px]">音声テスト</span>
            </button>
          )}

          {/* Auto Battle (ニャンピューター - Switch Y) */}
          <button
            id="btn-auto-battle"
            onClick={onToggleAutoBattle}
            className={`relative p-1 sm:px-2.5 sm:py-1 rounded-lg text-xs font-black flex items-center gap-1 border transition-all shadow-md ${
              isAutoBattle
                ? 'bg-amber-500 text-stone-950 border-yellow-200 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse'
                : 'bg-stone-800 text-stone-300 border-stone-600 hover:bg-stone-700'
            }`}
            title="ニャンピューター (Yボタン)"
          >
            <Bot size={13} />
            <span className="hidden md:inline text-[11px]">オート</span>
            <span className="text-[9px] font-mono bg-black/40 text-yellow-300 px-1 rounded">Y</span>
          </button>

          {/* Speed Toggle (x1 / x2 / x3 - Switch -) */}
          <button
            id="btn-toggle-speed"
            onClick={onToggleSpeed}
            className="relative px-1.5 sm:px-2.5 py-1 rounded-lg text-xs font-black bg-stone-800 hover:bg-stone-700 text-cyan-300 border border-cyan-500/50 flex items-center gap-0.5 sm:gap-1 shadow-md"
            title="ゲーム速度切り替え (-ボタン)"
          >
            <FastForward size={13} />
            <span className="text-xs">x{gameSpeed}</span>
            <span className="text-[9px] font-mono bg-black/40 text-cyan-200 px-1 rounded hidden sm:inline">-</span>
          </button>

          {/* Sound Toggle */}
          <button
            id="btn-toggle-sound"
            onClick={onToggleSound}
            className="p-1 sm:p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-600 shadow-md"
            title="サウンドON/OFF"
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} className="text-stone-500" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            id="btn-toggle-fullscreen"
            onClick={toggleFullscreen}
            className="p-1 sm:p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-600 shadow-md"
            title="フルスクリーン切り替え"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          {/* Retreat Button */}
          <button
            id="btn-retreat"
            onClick={onRetreat}
            className="p-1 sm:px-2.5 sm:py-1 rounded-lg text-xs font-black bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-600 flex items-center gap-1 shadow-md"
            title="撤退する"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline text-[11px]">撤退</span>
          </button>
        </div>

        {/* Top-Right: Money Display */}
        <div className="flex items-center flex-shrink-0">
          <div className="bg-black/80 px-2 sm:px-3 py-0.5 sm:py-1 rounded-xl border border-yellow-500/60 shadow-inner">
            <span
              className="text-base sm:text-xl md:text-2xl lg:text-3xl font-black font-mono tracking-tight text-yellow-400 select-none drop-shadow whitespace-nowrap"
              style={{
                textShadow:
                  '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000',
              }}
            >
              {Math.floor(money)}/{maxMoney}円
            </span>
          </div>
        </div>
      </div>

      {/* Main Battlefield Stage Area (Fills entire screen) */}
      <div className="relative flex-1 w-full min-h-0 overflow-hidden bg-stone-950">
        {children}
      </div>

      {/* Bottom Dock / Deployment Panel Container */}
      <div className="w-full flex-shrink-0 relative z-30 bg-[#1c1917] border-t-2 border-stone-900 shadow-2xl">
        {/* Sawtooth Ground Chevron Texture */}
        <div className="absolute -top-3 left-0 right-0 h-3 overflow-hidden pointer-events-none flex">
          {Array.from({ length: 80 }).map((_, i) => (
            <div
              key={i}
              className="w-4 h-3 bg-[#1c1917] rotate-45 transform origin-top-left flex-shrink-0 -mr-2"
              style={{ borderTop: '2px solid #78350f' }}
            />
          ))}
        </div>

        {/* Controls Bar: Worker Cat on Left, 10 Cat Slots in Center, Cannon on Right */}
        <div className="w-full px-2 sm:px-4 pt-2 pb-[calc(max(0.35rem,env(safe-area-inset-bottom,0px))+4px)] flex items-stretch gap-1.5 sm:gap-3">
          {/* Bottom-Left: Worker Cat (働きネコ - Switch B) */}
          <button
            id="btn-upgrade-worker"
            disabled={workerLevel >= maxWorkerLevel || money < workerUpgradeCost}
            onClick={onUpgradeWorker}
            className={`relative flex-shrink-0 w-20 sm:w-28 rounded-xl border-[3px] flex flex-col items-center justify-between p-1 select-none transition-all active:scale-95 ${
              workerLevel >= maxWorkerLevel
                ? 'bg-stone-900 border-stone-700 text-stone-500 opacity-60'
                : canUpgradeWorker
                ? 'bg-gradient-to-b from-amber-500 to-amber-700 border-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.7)] animate-pulse'
                : 'bg-stone-900 border-red-800/80 text-stone-300 opacity-80'
            }`}
          >
            {/* Switch B Button Badge */}
            <div className="absolute -top-2 -left-2 bg-red-600 border border-white text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg z-20">
              B
            </div>

            {/* Level Tag Box */}
            <div className="w-full bg-red-600 border border-black rounded px-1 py-0.5 text-center">
              <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-tighter">
                LEVEL {workerLevel >= maxWorkerLevel ? 'MAX' : workerLevel}
              </span>
            </div>

            {/* Roaring Cat Icon */}
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-yellow-400 border-2 border-black flex items-center justify-center my-0.5 shadow">
              <svg viewBox="0 0 40 40" className="w-7 h-7 sm:w-8 sm:h-8">
                <polygon points="8,14 12,4 18,12" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />
                <polygon points="22,12 28,4 32,14" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />
                <circle cx="20" cy="22" r="14" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />
                <circle cx="15" cy="18" r="2" fill="#000000" />
                <circle cx="25" cy="18" r="2" fill="#000000" />
                <path d="M 16 23 Q 20 30 24 23 Z" fill="#ef4444" stroke="#000000" strokeWidth="2" />
              </svg>
            </div>

            {/* Upgrade Cost */}
            {workerLevel < maxWorkerLevel ? (
              <span
                className="text-xs sm:text-sm font-black font-mono text-yellow-300 leading-tight drop-shadow"
                style={{
                  textShadow: '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000',
                }}
              >
                {workerUpgradeCost}円
              </span>
            ) : (
              <span className="text-[10px] font-black text-amber-200">MAX</span>
            )}
          </button>

          {/* Center: Cat Deployment Deck (10 slots in 2 rows of 5) */}
          <div className="flex-1 grid grid-cols-5 grid-rows-2 gap-1 sm:gap-2 min-w-0">
            {deckCats.map((slot, index) => {
              if (!slot || !slot.def) return null;
              const form = slot.def.forms?.[slot.activeFormIndex] || slot.def.forms?.[0];
              if (!form) return null;
              const canAfford = money >= slot.cost;
              const isOnCooldown = slot.cooldownRemaining > 0;
              const canSpawn = canAfford && !isOnCooldown;
              const cooldownPercent = (slot.cooldownRemaining / slot.maxCooldown) * 100;
              const isSelected = selectedSlotIndex === index;

              return (
                <button
                  key={slot.def.id}
                  id={`btn-spawn-${slot.def.id}`}
                  disabled={!canSpawn}
                  onClick={() => onSpawnCat(slot.def.id)}
                  className={`relative rounded-xl border-[2.5px] sm:border-[3px] overflow-hidden flex flex-col justify-between p-0.5 sm:p-1 select-none transition-all active:scale-95 h-12 sm:h-16 ${
                    isSelected
                      ? 'border-yellow-400 ring-4 ring-yellow-400/80 shadow-[0_0_16px_rgba(250,204,21,0.9)] z-20 scale-[1.03]'
                      : 'border-black'
                  } ${
                    canSpawn
                      ? 'bg-white hover:bg-yellow-50 cursor-pointer shadow-md'
                      : canAfford
                      ? 'bg-stone-200 opacity-90 cursor-not-allowed'
                      : 'bg-stone-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  {/* Selected Switch Cursor Indicator */}
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 bg-yellow-400 border-2 border-black text-black font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg z-30 animate-bounce">
                      A
                    </div>
                  )}

                  {/* Slot Number Tag */}
                  <div className="absolute top-0.5 right-1 z-10 opacity-75">
                    <span className="text-[8px] font-mono font-bold text-stone-500">{index + 1}</span>
                  </div>

                  {/* Cat Sprite Thumbnail */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none scale-75 sm:scale-90">
                    <UnitSpriteRenderer
                      spriteType={form.spriteType}
                      isCat={true}
                      state="walk"
                      animTimer={0}
                      scale={0.8}
                    />
                  </div>

                  {/* Top: Attack Type (単体 / 範囲) Tag */}
                  <div className="w-full flex items-center justify-start z-10">
                    <span
                      className={`text-[7px] sm:text-[9px] font-black px-1 py-0.2 rounded border border-black text-white ${
                        form.attackType === 'area' ? 'bg-rose-600' : 'bg-sky-600'
                      }`}
                    >
                      {form.attackType === 'area' ? '範囲' : '単体'}
                    </span>
                  </div>

                  {/* Bottom: Price in bold yellow with black outline */}
                  <div className="w-full flex items-center justify-end z-10">
                    <span
                      className="text-[9px] sm:text-xs font-black font-mono text-yellow-300 drop-shadow"
                      style={{
                        textShadow:
                          '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000',
                      }}
                    >
                      {slot.cost}円
                    </span>
                  </div>

                  {/* Cooldown Dark Mask */}
                  {isOnCooldown && (
                    <div
                      className="absolute inset-0 bg-black/75 flex items-center justify-center font-mono font-black text-yellow-300 text-[10px] sm:text-xs z-20"
                      style={{
                        clipPath: `inset(0 0 ${100 - cooldownPercent}% 0)`,
                      }}
                    >
                      {slot.cooldownRemaining.toFixed(1)}s
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom-Right: Cat Cannon (にゃんこ砲 - Switch X) */}
          <button
            id="btn-fire-cannon"
            disabled={!isCannonReady}
            onClick={onFireCannon}
            className={`relative flex-shrink-0 w-20 sm:w-28 rounded-xl border-[3px] flex flex-col items-center justify-between p-1 select-none transition-all active:scale-95 ${
              isCannonReady
                ? 'bg-gradient-to-b from-sky-400 to-blue-700 border-sky-200 text-white shadow-[0_0_15px_rgba(56,189,248,0.8)] animate-bounce active:scale-90'
                : 'bg-stone-900 border-stone-700 text-stone-400 opacity-75'
            }`}
          >
            {/* Switch X Button Badge */}
            <div className="absolute -top-2 -right-2 bg-blue-600 border border-white text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg z-20">
              X
            </div>

            {/* Cannon Title Tag */}
            <div
              className={`w-full rounded px-1 py-0.5 text-center ${
                isCannonReady ? 'bg-sky-500 border border-white animate-pulse' : 'bg-stone-800 border border-stone-700'
              }`}
            >
              <span className="text-[9px] sm:text-xs font-black uppercase tracking-tighter text-white">
                にゃんこ砲
              </span>
            </div>

            {/* Circular Cannon Head Dial */}
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-800 border-2 border-black flex items-center justify-center my-0.5 shadow">
              {/* Radial Progress Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="40%"
                  fill="transparent"
                  stroke="#38bdf8"
                  strokeWidth="3.5"
                  strokeDasharray="100"
                  strokeDashoffset={`${100 - cannonProgress}`}
                />
              </svg>
              <span className="text-[10px] sm:text-xs font-black text-white font-mono z-10">
                {isCannonReady ? 'OK' : `${Math.floor(cannonProgress)}%`}
              </span>
            </div>

            {/* Ready / Charging Status */}
            {isCannonReady ? (
              <span
                className="text-[10px] sm:text-xs font-black text-yellow-300 animate-pulse tracking-tight"
                style={{
                  textShadow:
                    '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000',
                }}
              >
                発射OK!!
              </span>
            ) : (
              <span className="text-[9px] sm:text-[10px] font-bold text-stone-400">充填中...</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

