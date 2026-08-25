import React, { useEffect } from 'react';
import { UnitSpriteRenderer } from '../battle/UnitSpriteRenderer';
import { Play, Sparkles, Volume2, VolumeX, RotateCcw, Wrench } from 'lucide-react';
import { audio } from '../../utils/audio';

interface TitleScreenProps {
  onStartGame: () => void;
  onResetData: () => void;
  onOpenUpdateHistory: () => void;
  onOpenDevMode: () => void;
  isLegendCleared?: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onResetData,
  onOpenUpdateHistory,
  onOpenDevMode,
  isLegendCleared = false,
}) => {
  const [soundEnabled, setSoundEnabled] = React.useState(true);

  const toggleSound = () => {
    audio.toggleSound();
    setSoundEnabled(!soundEnabled);
  };

  const handleReset = () => {
    if (window.confirm('本当にセーブデータをリセットして初期状態に戻しますか？')) {
      onResetData();
    }
  };

  return (
    <div
      className={`relative w-full h-full min-h-0 flex flex-col items-center justify-between px-3 sm:px-6 pt-[max(0.5rem,env(safe-area-inset-top,0px))] pb-[calc(max(0.4rem,env(safe-area-inset-bottom,0px))+2px)] select-none overflow-hidden font-['M_PLUS_Rounded_1c'] transition-colors duration-1000 ${
        isLegendCleared
          ? 'bg-gradient-to-b from-orange-600 via-rose-500 via-amber-400 to-amber-200'
          : 'bg-gradient-to-b from-sky-400 via-sky-200 to-amber-100'
      }`}
    >
      {/* Sun & Sunset Glow & Clouds */}
      {isLegendCleared ? (
        <>
          {/* Sunset Sun */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-b from-yellow-200 via-orange-400 to-red-500 rounded-full blur-2xl opacity-60 pointer-events-none animate-pulse" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-gradient-to-b from-yellow-100 to-amber-300 rounded-full blur-md opacity-90 pointer-events-none" />
          {/* Sunset Clouds */}
          <div className="absolute top-12 right-12 w-64 h-16 bg-purple-900/30 rounded-full blur-md pointer-events-none" />
          <div className="absolute top-24 left-10 w-72 h-16 bg-rose-900/30 rounded-full blur-md pointer-events-none" />
          <div className="absolute top-40 right-1/4 w-80 h-14 bg-amber-900/25 rounded-full blur-md pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute top-8 left-12 w-28 h-28 bg-yellow-300 rounded-full blur-xl opacity-80 pointer-events-none" />
          <div className="absolute top-16 right-16 w-56 h-20 bg-white/80 rounded-full blur-sm pointer-events-none" />
          <div className="absolute top-28 left-1/4 w-40 h-16 bg-white/70 rounded-full blur-sm pointer-events-none" />
        </>
      )}

      {/* Top Bar */}
      <div className="w-full flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <button
            id="btn-title-update-history"
            onClick={() => {
              audio.playClick();
              onOpenUpdateHistory();
            }}
            className="text-xs sm:text-sm font-black text-amber-950 bg-amber-200 hover:bg-amber-300 px-3 py-1.5 rounded-full border-2 border-amber-400 shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>Ver 1.5</span>
            <span className="text-[10px] text-amber-800 font-bold ml-0.5">アップデート履歴</span>
          </button>

          <button
            id="btn-title-dev-mode"
            onClick={() => {
              audio.playClick();
              onOpenDevMode();
            }}
            className="text-xs sm:text-sm font-black text-stone-900 bg-amber-400 hover:bg-amber-300 px-3 py-1.5 rounded-full border-2 border-amber-600 shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <Wrench size={14} className="text-stone-900" />
            <span>開発者モード</span>
          </button>
        </div>

        <button
          id="btn-title-toggle-sound"
          onClick={toggleSound}
          className="p-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-white border border-stone-700 shadow"
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} className="text-stone-500" />}
        </button>
      </div>

      {/* Main Logo */}
      <div className="flex flex-col items-center text-center z-10 my-auto">
        <div className="text-sm sm:text-base font-black text-red-600 bg-yellow-300 border-2 border-red-500 px-4 py-1 rounded-full shadow mb-2 uppercase tracking-widest animate-bounce">
          スマホ・PC対応 横スクロールタワーディフェンス
        </div>

        <h1 className="text-5xl sm:text-7xl font-black text-stone-950 tracking-wider font-['Yuji_Boku'] drop-shadow-[0_4px_8px_rgba(255,255,255,0.9)] scale-y-110">
          にゃんこ大戦争
        </h1>
        <div className="text-xl sm:text-2xl font-black text-amber-900 tracking-widest mt-1">
          - WEB EDITION -
        </div>

        <p className="text-xs sm:text-sm text-stone-800 font-bold mt-3 max-w-md">
          キモかわにゃんこ軍団を出撃させて、日本・未来・宇宙の全ステージを侵略制覇するにゃ！
        </p>

        {/* Start Game Button */}
        <button
          id="btn-start-game"
          onClick={() => {
            audio.playClick();
            onStartGame();
          }}
          className="mt-8 py-4 px-12 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black text-lg sm:text-xl border-4 border-yellow-200 shadow-[0_10px_30px_rgba(245,158,11,0.6)] flex items-center gap-3 active:scale-95 transition-all animate-pulse"
        >
          <Play size={24} fill="currentColor" />
          <span>ゲームスタート！</span>
        </button>
      </div>

      {/* Marching Cats at the bottom */}
      <div className="relative w-full z-10">
        <div className="flex justify-around items-end mb-2">
          <div className="animate-bounce">
            <UnitSpriteRenderer spriteType="cat_basic" isCat={true} state="walk" animTimer={1} scale={1.2} />
          </div>
          <div className="animate-pulse">
            <UnitSpriteRenderer spriteType="cat_tank" isCat={true} state="walk" animTimer={2} scale={1.2} />
          </div>
          <div className="animate-bounce">
            <UnitSpriteRenderer spriteType="cat_axe" isCat={true} state="walk" animTimer={3} scale={1.2} />
          </div>
          <div className="animate-pulse">
            <UnitSpriteRenderer spriteType="cat_lizard" isCat={true} state="walk" animTimer={4} scale={1.2} />
          </div>
          <div className="animate-bounce">
            <UnitSpriteRenderer spriteType="cat_titan" isCat={true} state="walk" animTimer={5} scale={1.2} />
          </div>
        </div>

        {/* Ground Hill */}
        <div className="h-12 bg-gradient-to-t from-emerald-800 to-emerald-600 rounded-t-3xl border-t-4 border-emerald-900 shadow-inner flex items-center justify-between px-6 text-[11px] text-emerald-200">
          <span>© PONOS Corp. Inspired Fan-made Web Game</span>
          <button
            id="btn-reset-data"
            onClick={handleReset}
            className="flex items-center gap-1 text-emerald-300 hover:text-white underline"
          >
            <RotateCcw size={12} />
            <span>データ初期化</span>
          </button>
        </div>
      </div>
    </div>
  );
};
