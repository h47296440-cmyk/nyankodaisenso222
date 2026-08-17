import React from 'react';
import { CatDefinition, PlayerProfile } from '../../types';
import { CAT_DEFINITIONS } from '../../data/units';
import { Zap, Volume2, VolumeX, FastForward, Play, Pause, ShieldAlert, Sparkles, Bot } from 'lucide-react';

interface BattleHudProps {
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
}

export const BattleHud: React.FC<BattleHudProps> = ({
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
}) => {
  const canUpgradeWorker = workerLevel < maxWorkerLevel && money >= workerUpgradeCost;
  const isCannonReady = cannonProgress >= 100 && !isCannonFiring;

  return (
    <div className="flex flex-col justify-between h-full pointer-events-none z-30">
      {/* Top Status Header */}
      <div className="w-full bg-stone-900/90 backdrop-blur-md border-b border-stone-700/80 px-2 sm:px-4 py-1.5 flex items-center justify-between pointer-events-auto text-white shadow-md">
        {/* Money Display (働きネコ所持金) */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-yellow-100 flex items-center justify-center font-black text-stone-900 text-sm shadow-md">
            ¥
          </div>
          <div className="flex flex-col">
            <div className="text-xs text-stone-400 font-bold leading-none">所持金</div>
            <div className="text-base sm:text-lg font-black tracking-tight text-yellow-300 drop-shadow">
              {Math.floor(money).toLocaleString()}{' '}
              <span className="text-xs font-normal text-stone-400">/ {maxMoney.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Action Toggles: Speed, Auto (ニャンピューター), Sound, Pause */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Auto Battle */}
          <button
            id="btn-auto-battle"
            onClick={onToggleAutoBattle}
            className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1 border transition-all ${
              isAutoBattle
                ? 'bg-amber-500 text-stone-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse'
                : 'bg-stone-800 text-stone-300 border-stone-600 hover:bg-stone-700'
            }`}
            title="ニャンピューター (自動生産)"
          >
            <Bot size={14} />
            <span className="hidden sm:inline">オート</span>
          </button>

          {/* Speed Toggle */}
          <button
            id="btn-toggle-speed"
            onClick={onToggleSpeed}
            className="px-2.5 py-1 rounded-lg text-xs font-black bg-stone-800 hover:bg-stone-700 text-cyan-400 border border-cyan-500/40 flex items-center gap-1 shadow"
          >
            <FastForward size={14} />
            <span>x{gameSpeed}</span>
          </button>

          {/* Sound Toggle */}
          <button
            id="btn-toggle-sound"
            onClick={onToggleSound}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-600 shadow"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="text-stone-500" />}
          </button>

          {/* Pause */}
          <button
            id="btn-toggle-pause"
            onClick={onTogglePause}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-600 shadow"
          >
            {isPaused ? <Play size={16} className="text-emerald-400" /> : <Pause size={16} />}
          </button>

          {/* Retreat */}
          <button
            id="btn-retreat"
            onClick={onRetreat}
            className="px-2 py-1 rounded-lg text-xs font-bold bg-rose-900/70 hover:bg-rose-800 text-rose-200 border border-rose-700"
          >
            撤退
          </button>
        </div>
      </div>

      {/* Bottom Deck & Deployment Controls Bar */}
      <div className="w-full bg-stone-900/95 backdrop-blur-lg border-t-2 border-stone-700 px-1 sm:px-3 py-2 pointer-events-auto flex items-stretch gap-1.5 sm:gap-2 shadow-2xl">
        {/* Left Side: Worker Cat Level Up Button (働きネコレベルアップ) */}
        <button
          id="btn-upgrade-worker"
          disabled={workerLevel >= maxWorkerLevel || money < workerUpgradeCost}
          onClick={onUpgradeWorker}
          className={`flex-shrink-0 w-20 sm:w-24 rounded-xl border-2 flex flex-col items-center justify-center p-1 sm:p-2 text-center transition-all ${
            workerLevel >= maxWorkerLevel
              ? 'bg-stone-800 border-stone-700 text-stone-500 opacity-60'
              : canUpgradeWorker
              ? 'bg-gradient-to-b from-amber-500 to-amber-700 border-amber-300 text-white shadow-lg animate-pulse active:scale-95'
              : 'bg-stone-800 border-stone-700 text-stone-400 opacity-75'
          }`}
        >
          <div className="text-[10px] font-black text-amber-200 uppercase tracking-tighter">働きネコ</div>
          <div className="text-xs sm:text-sm font-black leading-tight">
            Lv.{workerLevel} {workerLevel >= maxWorkerLevel ? 'MAX' : `▶ ${workerLevel + 1}`}
          </div>
          {workerLevel < maxWorkerLevel && (
            <div className="text-[10px] sm:text-xs font-black text-yellow-300 mt-0.5">
              ¥{workerUpgradeCost}
            </div>
          )}
        </button>

        {/* Center: Cat Deployment Deck (10 slots organized in 2 rows of 5) */}
        <div className="flex-1 grid grid-cols-5 grid-rows-2 gap-1 sm:gap-1.5 min-w-0">
          {deckCats.map((slot) => {
            const form = slot.def.forms[slot.activeFormIndex];
            const canAfford = money >= slot.cost;
            const isOnCooldown = slot.cooldownRemaining > 0;
            const canSpawn = canAfford && !isOnCooldown;
            const cooldownPercent = (slot.cooldownRemaining / slot.maxCooldown) * 100;

            return (
              <button
                key={slot.def.id}
                id={`btn-spawn-${slot.def.id}`}
                disabled={!canSpawn}
                onClick={() => onSpawnCat(slot.def.id)}
                className={`relative rounded-lg border-2 overflow-hidden flex flex-col justify-between p-1 select-none transition-all active:scale-95 ${
                  canSpawn
                    ? 'bg-stone-800 hover:bg-stone-700 border-amber-400/80 shadow-md cursor-pointer'
                    : 'bg-stone-900 border-stone-700/60 opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Attack Type Badge: Single (単体) vs Area (範囲) */}
                <div className="flex items-center justify-between w-full leading-none">
                  <span
                    className={`text-[8px] sm:text-[9px] font-black px-1 py-0.5 rounded tracking-tighter ${
                      form.attackType === 'area'
                        ? 'bg-rose-600 text-white'
                        : 'bg-sky-700 text-sky-100'
                    }`}
                  >
                    {form.attackType === 'area' ? '範囲' : '単体'}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-black text-yellow-300 drop-shadow">
                    ¥{slot.cost}
                  </span>
                </div>

                {/* Cat Name */}
                <div className="text-[10px] sm:text-xs font-black truncate text-stone-100 my-0.5">
                  {form.name}
                </div>

                {/* Cooldown Dark Overlay */}
                {isOnCooldown && (
                  <div
                    className="absolute inset-0 bg-black/75 flex items-center justify-center font-mono font-black text-amber-300 text-xs sm:text-sm z-10"
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

        {/* Right Side: Cat Cannon (にゃんこ砲) Fire Button */}
        <button
          id="btn-fire-cannon"
          disabled={!isCannonReady}
          onClick={onFireCannon}
          className={`flex-shrink-0 w-20 sm:w-24 rounded-xl border-2 flex flex-col items-center justify-center p-1 sm:p-2 text-center transition-all ${
            isCannonReady
              ? 'bg-gradient-to-b from-sky-400 to-blue-700 border-sky-200 text-white shadow-[0_0_15px_rgba(56,189,248,0.7)] animate-bounce active:scale-95'
              : 'bg-stone-800 border-stone-700 text-stone-400 opacity-75'
          }`}
        >
          <Zap size={18} className={isCannonReady ? 'text-yellow-300 animate-pulse' : 'text-stone-500'} />
          <div className="text-[10px] font-black uppercase tracking-tighter mt-0.5">にゃんこ砲</div>
          <div className="text-[10px] sm:text-xs font-black text-sky-300">
            {isCannonReady ? '発射可能！' : `${Math.floor(cannonProgress)}%`}
          </div>
        </button>
      </div>
    </div>
  );
};
