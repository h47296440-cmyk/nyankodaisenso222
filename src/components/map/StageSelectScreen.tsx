import React, { useState, useRef, useEffect } from 'react';
import {
  ChapterDefinition,
  StageDefinition,
  PlayerProfile,
  TreasureQuality,
  BattleActiveItems,
} from '../../types';
import { CHAPTERS, TREASURES } from '../../data/stages';
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Zap,
  ArrowLeft,
  Settings,
  Layers,
  Sparkles,
  Lock,
  Wrench,
} from 'lucide-react';
import { audio } from '../../utils/audio';
import { JapanMapCanvas } from './JapanMapCanvas';

interface StageSelectScreenProps {
  profile: PlayerProfile;
  onSelectStage: (stage: StageDefinition, activeItems: BattleActiveItems) => void;
  onOpenUpgrade: () => void;
  onOpenGacha: () => void;
  onOpenTreasures: () => void;
  onOpenEncyclopedia: () => void;
  onOpenUpdateHistory: () => void;
  onOpenDevMode: () => void;
  onOpenStorySelect: () => void;
  onBackToTitle: () => void;
}

export const StageSelectScreen: React.FC<StageSelectScreenProps> = ({
  profile,
  onSelectStage,
  onOpenUpgrade,
  onOpenGacha,
  onOpenTreasures,
  onOpenEncyclopedia,
  onOpenUpdateHistory,
  onOpenDevMode,
  onOpenStorySelect,
  onBackToTitle,
}) => {
  const [selectedChapterId, setSelectedChapterId] = useState<'japan' | 'future' | 'cosmos'>('japan');
  const currentChapter = CHAPTERS.find((c) => c.id === selectedChapterId) || CHAPTERS[0];

  const isInfiniteEnergy = !!profile.devMode?.infiniteEnergy;
  const isInfiniteXp = !!profile.devMode?.infiniteXp;
  const isInfiniteCatFood = !!profile.devMode?.infiniteCatFood;

  // Stage selection state
  const [selectedStageId, setSelectedStageId] = useState<string>(
    currentChapter.stages[0]?.id || 'japan_1'
  );

  // Active Battle Items toggles
  const [activeItems, setActiveItems] = useState<BattleActiveItems>({
    speedUp: false,
    treasureRadar: false,
    richCat: false,
    catCpu: false,
    catJobs: false,
    sniper: false,
  });

  const mapScrollRef = useRef<HTMLDivElement>(null);

  // Sync selected stage when chapter changes
  useEffect(() => {
    setSelectedStageId(currentChapter.stages[0]?.id || 'japan_1');
  }, [selectedChapterId]);

  // Current selected stage index
  const currentIndex = currentChapter.stages.findIndex((s) => s.id === selectedStageId);
  const currentStage = currentChapter.stages[currentIndex] || currentChapter.stages[0];

  // Auto scroll map towards selected stage
  useEffect(() => {
    if (mapScrollRef.current && currentStage) {
      const posX = ((currentStage.mapX ?? 10) / 100) * 1400 + 80;
      const posY = ((currentStage.mapY ?? 50) / 100) * 700 + 70;
      const containerWidth = mapScrollRef.current.clientWidth;
      const containerHeight = mapScrollRef.current.clientHeight;

      mapScrollRef.current.scrollTo({
        left: Math.max(0, posX - containerWidth / 2),
        top: Math.max(0, posY - containerHeight / 2),
        behavior: 'smooth',
      });
    }
  }, [selectedStageId]);

  // Chapter unlock checks
  const isFutureUnlocked = !!profile.clearedStages['japan_12'] || !!profile.clearedStages['japan_6'];
  const isCosmosUnlocked = !!profile.clearedStages['future_3'];

  // Toggle item selection
  const handleToggleItem = (key: keyof BattleActiveItems, count: number) => {
    audio.playClick();
    if (count <= 0 && !activeItems[key]) {
      alert('このアイテムの所持数が0個です！');
      return;
    }
    setActiveItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Launch Battle
  const handleDeploy = () => {
    audio.playClick();
    if (!isInfiniteEnergy && profile.energy < currentStage.energyCost) {
      alert('統率力（エナジー）が足りないにゃ！時間が経つと回復するにゃ。');
      return;
    }
    onSelectStage(currentStage, activeItems);
  };

  // Navigate prev / next stage
  const handlePrevStage = () => {
    if (currentIndex > 0) {
      audio.playClick();
      setSelectedStageId(currentChapter.stages[currentIndex - 1].id);
    }
  };

  const handleNextStage = () => {
    if (currentIndex < currentChapter.stages.length - 1) {
      audio.playClick();
      setSelectedStageId(currentChapter.stages[currentIndex + 1].id);
    }
  };

  // Treasure status helper
  const getTreasureStatus = (stageId: string) => {
    return profile.treasures[stageId] || 'none';
  };

  const currentTreasureStatus = getTreasureStatus(currentStage.id);
  const isCurrentCleared = !!profile.clearedStages[currentStage.id];
  const clearCount = isCurrentCleared ? 2 : 0; // standard display count

  return (
    <div className="relative w-full h-full flex flex-col bg-stone-950 text-white select-none font-['M_PLUS_Rounded_1c'] overflow-hidden">
      {/* 1. TOP BAR: TITLE, CHAPTER TABS & RESOURCES */}
      <div className="z-30 bg-stone-900/95 border-b border-stone-800 px-3 sm:px-5 py-2 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-to-title"
            onClick={() => {
              audio.playClick();
              onBackToTitle();
            }}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 active:scale-95"
            title="タイトルへ戻る"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Chapter Selector Tabs */}
          <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800">
            {CHAPTERS.map((ch) => {
              const isLocked =
                (ch.id === 'future' && !isFutureUnlocked) ||
                (ch.id === 'cosmos' && !isCosmosUnlocked);
              const isSelected = selectedChapterId === ch.id;

              return (
                <button
                  key={ch.id}
                  id={`tab-chapter-${ch.id}`}
                  disabled={isLocked}
                  onClick={() => {
                    audio.playClick();
                    setSelectedChapterId(ch.id);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-md'
                      : isLocked
                      ? 'text-stone-600 opacity-50 cursor-not-allowed'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {isLocked && <Lock size={10} />}
                  <span>{ch.name}</span>
                </button>
              );
            })}
          </div>

          {/* Story Theater Button */}
          <button
            id="btn-map-story-theater"
            onClick={() => {
              audio.playClick();
              onOpenStorySelect();
            }}
            className="text-[10px] sm:text-xs font-black text-white bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 px-2.5 py-1 rounded-lg shadow border border-purple-400 flex items-center gap-1 active:scale-95 transition-all"
            title="各章のオープニング・エンディング"
          >
            <span>📜</span>
            <span className="hidden sm:inline">ストーリー</span>
            <span className="sm:hidden">物語</span>
          </button>

          <button
            id="btn-map-update-history"
            onClick={() => {
              audio.playClick();
              onOpenUpdateHistory();
            }}
            className="hidden sm:inline-block text-[10px] font-black text-amber-950 bg-amber-300 hover:bg-amber-200 px-2 py-0.5 rounded-full shadow border border-amber-400 active:scale-95"
          >
            v1.4 履歴
          </button>

          {/* Dev Mode Button in Map Header */}
          <button
            id="btn-map-dev-mode"
            onClick={() => {
              audio.playClick();
              onOpenDevMode();
            }}
            className="text-[10px] font-black text-stone-900 bg-amber-400 hover:bg-amber-300 px-2.5 py-0.5 rounded-full shadow border border-amber-600 flex items-center gap-1 active:scale-95 transition-all"
            title="開発者モード"
          >
            <Wrench size={11} className="text-stone-900" />
            <span>開発者</span>
          </button>
        </div>

        {/* Resources: XP, Cat Food, Energy */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-black">
          {/* Energy */}
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border ${
            isInfiniteEnergy
              ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.4)] animate-pulse'
              : 'bg-stone-800/90 border-cyan-500/50 text-cyan-300'
          }`}>
            <Zap size={14} className="text-cyan-400" />
            <span>
              {isInfiniteEnergy ? (
                <span>∞ (MAX)</span>
              ) : (
                <>
                  {profile.energy} <span className="text-[10px] text-stone-400">/ {profile.maxEnergy}</span>
                </>
              )}
            </span>
          </div>

          {/* XP */}
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border ${
            isInfiniteXp
              ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse'
              : 'bg-stone-800/90 border-emerald-500/50 text-emerald-300'
          }`}>
            <span className="text-[10px] text-emerald-400">XP</span>
            <span>{isInfiniteXp ? '∞ (MAX)' : profile.xp.toLocaleString()}</span>
          </div>

          {/* Cat Food */}
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border ${
            isInfiniteCatFood
              ? 'bg-amber-950/90 border-amber-400 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.4)] animate-pulse'
              : 'bg-stone-800/90 border-amber-500/50 text-amber-300'
          }`}>
            <span className="text-[10px] text-amber-400">缶</span>
            <span>{isInfiniteCatFood ? '∞ (MAX)' : profile.catFood}</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN MAP VIEWPORT (Full Screen Map with Stage Overlay) */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* The Japan / World / Space Map Canvas */}
        <JapanMapCanvas
          chapter={currentChapter}
          stages={currentChapter.stages}
          selectedStageId={selectedStageId}
          clearedStages={profile.clearedStages}
          onSelectStage={(st) => {
            audio.playClick();
            setSelectedStageId(st.id);
          }}
          containerRef={mapScrollRef}
        />

        {/* 3. TOP STAGE BANNER CAROUSEL (Replica of Battle Cats UI Banner) */}
        <div className="absolute top-2 left-0 right-0 z-20 flex items-center justify-center pointer-events-none px-2">
          <div className="flex items-center gap-2 max-w-4xl w-full justify-center">
            {/* Prev Stage Preview Banner */}
            {currentIndex > 0 && (
              <div
                onClick={handlePrevStage}
                className="hidden md:flex pointer-events-auto cursor-pointer flex-col bg-white/95 border-4 border-black text-black px-4 py-1.5 rounded-lg shadow-lg opacity-75 hover:opacity-100 transition-transform active:scale-95 min-w-[140px]"
              >
                <div className="flex items-center justify-between text-[11px] font-black">
                  <span className="text-red-600">
                    {profile.clearedStages[currentChapter.stages[currentIndex - 1].id] ? 'CLEAR!' : ''}
                  </span>
                </div>
                <div className="text-sm font-black truncate">
                  {currentChapter.stages[currentIndex - 1].name}
                </div>
                <div className="text-[10px] font-bold text-stone-600">
                  統率力 -{currentChapter.stages[currentIndex - 1].energyCost}
                </div>
              </div>
            )}

            {/* Prev Button */}
            <button
              id="btn-prev-stage"
              disabled={currentIndex <= 0}
              onClick={handlePrevStage}
              className={`pointer-events-auto p-2 rounded-full border-2 border-black shadow-lg transition-transform active:scale-90 ${
                currentIndex > 0
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-stone-700 text-stone-500 opacity-40 cursor-not-allowed'
              }`}
            >
              <ChevronLeft size={22} strokeWidth={3} />
            </button>

            {/* CURRENT SELECTED STAGE BANNER (Prominent Large White Board) */}
            <div className="pointer-events-auto relative bg-white border-[5px] border-black text-black px-6 sm:px-10 py-2 sm:py-3 rounded-xl shadow-2xl flex flex-col items-center min-w-[260px] sm:min-w-[340px]">
              {/* CLEAR! Stamp on Top Left */}
              {isCurrentCleared && (
                <div className="absolute -top-3.5 -left-3 bg-red-600 text-white font-black text-xs px-2.5 py-0.5 rounded border-2 border-black shadow rotate-[-8deg] tracking-wider animate-pulse">
                  CLEAR!
                </div>
              )}

              {/* Treasure Stamp on Top Right */}
              <div className="absolute -top-3.5 -right-3">
                {currentTreasureStatus === 'gold' ? (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 border-2 border-black shadow-md flex items-center justify-center font-black text-stone-950 text-xs ring-2 ring-yellow-300 animate-bounce">
                    宝
                  </div>
                ) : currentTreasureStatus === 'silver' ? (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 via-stone-300 to-slate-400 border-2 border-black shadow-md flex items-center justify-center font-black text-stone-900 text-xs">
                    宝
                  </div>
                ) : currentTreasureStatus === 'bronze' ? (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 border-2 border-black shadow-md flex items-center justify-center font-black text-amber-100 text-xs">
                    宝
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-stone-300 border-2 border-stone-600 shadow flex items-center justify-center font-bold text-stone-500 text-xs">
                    宝
                  </div>
                )}
              </div>

              {/* Main Stage Name (Extremely Bold) */}
              <h2 className="text-xl sm:text-3xl font-black text-black tracking-wide drop-shadow-sm">
                {currentStage.name}
              </h2>

              {/* Bottom Info: Energy Cost & Clear Count */}
              <div className="flex items-center justify-between w-full mt-1 pt-1 border-t-2 border-stone-300 text-xs sm:text-sm font-black">
                <div className="flex items-center gap-1 text-stone-800">
                  <span>統率力</span>
                  <span className="text-red-600 font-extrabold text-sm sm:text-base">
                    -{currentStage.energyCost}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-stone-800">
                  <span>クリア</span>
                  <span className="font-extrabold text-sm sm:text-base">
                    {clearCount}回
                  </span>
                </div>
              </div>

              {/* Treasure Festival Bubble Speech Tag */}
              {currentStage.treasureFestival && (
                <div className="absolute -bottom-4 right-2 bg-emerald-600 text-yellow-200 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full border-2 border-black shadow flex items-center gap-1">
                  <span>お宝出現率</span>
                  <span className="text-white font-extrabold underline">超UP!!</span>
                </div>
              )}
            </div>

            {/* Next Button */}
            <button
              id="btn-next-stage"
              disabled={currentIndex >= currentChapter.stages.length - 1}
              onClick={handleNextStage}
              className={`pointer-events-auto p-2 rounded-full border-2 border-black shadow-lg transition-transform active:scale-90 ${
                currentIndex < currentChapter.stages.length - 1
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-stone-700 text-stone-500 opacity-40 cursor-not-allowed'
              }`}
            >
              <ChevronRight size={22} strokeWidth={3} />
            </button>

            {/* Next Stage Preview Banner */}
            {currentIndex < currentChapter.stages.length - 1 && (
              <div
                onClick={handleNextStage}
                className="hidden md:flex pointer-events-auto cursor-pointer flex-col bg-white/95 border-4 border-black text-black px-4 py-1.5 rounded-lg shadow-lg opacity-75 hover:opacity-100 transition-transform active:scale-95 min-w-[140px]"
              >
                <div className="flex items-center justify-between text-[11px] font-black">
                  <span className="text-red-600">
                    {profile.clearedStages[currentChapter.stages[currentIndex + 1].id] ? 'CLEAR!' : ''}
                  </span>
                </div>
                <div className="text-sm font-black truncate">
                  {currentChapter.stages[currentIndex + 1].name}
                </div>
                <div className="text-[10px] font-bold text-stone-600">
                  統率力 -{currentChapter.stages[currentIndex + 1].energyCost}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. RIGHT-BOTTOM DEPLOY & ENERGY PANEL */}
        <div className="absolute right-3 sm:right-6 bottom-20 sm:bottom-24 z-30 flex flex-col items-end gap-1.5 pointer-events-auto">
          {/* Energy Display Box (Official Battle Cats Style) */}
          <div className="relative bg-gradient-to-b from-amber-400 to-amber-500 border-4 border-black px-4 py-1 rounded-xl shadow-xl flex items-center gap-3">
            <span className="text-sm sm:text-base font-black text-black tracking-wider">
              統率力
            </span>
            <div className="bg-black text-lime-400 font-mono font-black text-base sm:text-xl px-3 py-0.5 rounded border-2 border-stone-800 min-w-[80px] text-right">
              {isInfiniteEnergy ? '9999' : profile.energy}
            </div>
            {/* Small timer tag */}
            <div className="absolute -top-2.5 -right-2 bg-orange-600 text-white font-mono text-[10px] font-black px-1.5 py-0.2 rounded border border-black shadow">
              {isInfiniteEnergy ? 'MAX' : '03'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Deck / Slot Button */}
            <button
              id="btn-quick-deck"
              onClick={() => {
                audio.playClick();
                onOpenUpgrade();
              }}
              className="bg-stone-900 hover:bg-stone-800 text-white border-4 border-black px-3 py-2 rounded-xl shadow-xl flex flex-col items-center justify-center font-black active:scale-95 transition-transform"
            >
              <span className="text-[9px] text-amber-400">スロット 1</span>
              <span className="text-xs sm:text-sm">編成</span>
            </button>

            {/* GIANT GOLDEN "いざ出陣!!" BUTTON */}
            <button
              id="btn-deploy-main"
              onClick={handleDeploy}
              className="relative px-8 sm:px-12 py-2.5 sm:py-3.5 rounded-2xl bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500 hover:from-yellow-200 hover:to-amber-400 text-black font-black text-xl sm:text-3xl border-4 border-black shadow-[0_8px_0_#92400e,0_12px_20px_rgba(0,0,0,0.6)] active:translate-y-2 active:shadow-[0_2px_0_#92400e] transition-all flex items-center justify-center gap-2 group"
            >
              <span className="tracking-wider drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                いざ出陣!!
              </span>
            </button>
          </div>
        </div>

        {/* 5. BOTTOM BATTLE ITEMS TOGGLE BAR (6 Major Battle Items) */}
        <div className="absolute left-2 sm:left-6 bottom-20 sm:bottom-24 z-30 flex items-center gap-2 sm:gap-3 bg-stone-900/90 backdrop-blur-md p-2 rounded-2xl border-2 border-stone-700 shadow-2xl pointer-events-auto overflow-x-auto max-w-[calc(100vw-220px)] sm:max-w-none">
          {/* 1. SPEED UP */}
          <button
            id="item-toggle-speedup"
            onClick={() => handleToggleItem('speedUp', profile.items?.speedUp || 0)}
            className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl border-2 transition-all min-w-[52px] sm:min-w-[62px] active:scale-95 ${
              activeItems.speedUp
                ? 'bg-amber-500/30 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                : 'bg-stone-800 border-stone-700 hover:bg-stone-700'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-stone-900 border border-stone-600 flex items-center justify-center text-[10px] font-black text-amber-300">
              ⚡2x
            </div>
            <span className="text-[9px] font-bold text-stone-300 mt-0.5">SPEED</span>
            <span className="text-[10px] font-black text-amber-400">
              x{profile.items?.speedUp || 0}
            </span>
          </button>

          {/* 2. TREASURE RADAR */}
          <button
            id="item-toggle-radar"
            onClick={() => handleToggleItem('treasureRadar', profile.items?.treasureRadar || 0)}
            className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl border-2 transition-all min-w-[52px] sm:min-w-[62px] active:scale-95 ${
              activeItems.treasureRadar
                ? 'bg-amber-500/30 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                : 'bg-stone-800 border-stone-700 hover:bg-stone-700'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-stone-900 border border-stone-600 flex items-center justify-center text-[10px] font-black text-yellow-400">
              GET
            </div>
            <span className="text-[9px] font-bold text-stone-300 mt-0.5">レーダー</span>
            <span className="text-[10px] font-black text-yellow-400">
              x{profile.items?.treasureRadar || 0}
            </span>
          </button>

          {/* 3. RICH CAT (ネコボン) */}
          <button
            id="item-toggle-richcat"
            onClick={() => handleToggleItem('richCat', profile.items?.richCat || 0)}
            className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl border-2 transition-all min-w-[52px] sm:min-w-[62px] active:scale-95 ${
              activeItems.richCat
                ? 'bg-amber-500/30 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                : 'bg-stone-800 border-stone-700 hover:bg-stone-700'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-stone-900 border border-stone-600 flex items-center justify-center text-[10px] font-black text-emerald-400">
              MAX
            </div>
            <span className="text-[9px] font-bold text-stone-300 mt-0.5">ネコボン</span>
            <span className="text-[10px] font-black text-emerald-400">
              x{profile.items?.richCat || 0}
            </span>
          </button>

          {/* 4. CAT CPU (ニャンピューター) */}
          <button
            id="item-toggle-catcpu"
            onClick={() => handleToggleItem('catCpu', profile.items?.catCpu || 0)}
            className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl border-2 transition-all min-w-[52px] sm:min-w-[62px] active:scale-95 ${
              activeItems.catCpu
                ? 'bg-amber-500/30 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                : 'bg-stone-800 border-stone-700 hover:bg-stone-700'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-stone-900 border border-stone-600 flex items-center justify-center text-[10px] font-black text-cyan-400">
              CPU
            </div>
            <span className="text-[9px] font-bold text-stone-300 mt-0.5">ニャンピ</span>
            <span className="text-[10px] font-black text-cyan-400">
              x{profile.items?.catCpu || 0}
            </span>
          </button>

          {/* 5. CAT JOBS (おかめはちもく: XP 1.5x) */}
          <button
            id="item-toggle-catjobs"
            onClick={() => handleToggleItem('catJobs', profile.items?.catJobs || 0)}
            className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl border-2 transition-all min-w-[52px] sm:min-w-[62px] active:scale-95 ${
              activeItems.catJobs
                ? 'bg-amber-500/30 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                : 'bg-stone-800 border-stone-700 hover:bg-stone-700'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-stone-900 border border-stone-600 flex items-center justify-center text-[10px] font-black text-purple-400">
              XP UP
            </div>
            <span className="text-[9px] font-bold text-stone-300 mt-0.5">おかめ</span>
            <span className="text-[10px] font-black text-purple-400">
              x{profile.items?.catJobs || 0}
            </span>
          </button>

          {/* 6. SNIPER (スニャイパー) */}
          <button
            id="item-toggle-sniper"
            onClick={() => handleToggleItem('sniper', profile.items?.sniper || 0)}
            className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl border-2 transition-all min-w-[52px] sm:min-w-[62px] active:scale-95 ${
              activeItems.sniper
                ? 'bg-amber-500/30 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                : 'bg-stone-800 border-stone-700 hover:bg-stone-700'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-stone-900 border border-stone-600 flex items-center justify-center text-[10px] font-black text-red-400">
              🎯
            </div>
            <span className="text-[9px] font-bold text-stone-300 mt-0.5">スニャ</span>
            <span className="text-[10px] font-black text-red-400">
              x{profile.items?.sniper || 0}
            </span>
          </button>
        </div>
      </div>

      {/* 6. BOTTOM NAVIGATION BAR (Hub Navigation) */}
      <div className="z-30 bg-stone-900/95 border-t-2 border-stone-800 p-2 sm:p-2.5 flex justify-around items-center">
        <button
          id="btn-nav-upgrade"
          onClick={() => {
            audio.playClick();
            onOpenUpgrade();
          }}
          className="flex-1 py-1.5 sm:py-2 px-1 mx-1 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs sm:text-sm font-black flex flex-col sm:flex-row items-center justify-center gap-1 shadow active:scale-95"
        >
          <span className="text-amber-400">⚡</span>
          <span>パワーアップ / 編成</span>
        </button>

        <button
          id="btn-nav-gacha"
          onClick={() => {
            audio.playClick();
            onOpenGacha();
          }}
          className="flex-1 py-1.5 sm:py-2 px-1 mx-1 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 border border-yellow-400 text-white text-xs sm:text-sm font-black flex flex-col sm:flex-row items-center justify-center gap-1 shadow active:scale-95"
        >
          <Sparkles size={16} className="text-yellow-300" />
          <span>にゃんこガチャ</span>
        </button>

        <button
          id="btn-nav-treasures"
          onClick={() => {
            audio.playClick();
            onOpenTreasures();
          }}
          className="flex-1 py-1.5 sm:py-2 px-1 mx-1 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs sm:text-sm font-black flex flex-col sm:flex-row items-center justify-center gap-1 shadow active:scale-95"
        >
          <Award size={16} className="text-yellow-400" />
          <span>お宝一覧</span>
        </button>

        <button
          id="btn-nav-encyclopedia"
          onClick={() => {
            audio.playClick();
            onOpenEncyclopedia();
          }}
          className="flex-1 py-1.5 sm:py-2 px-1 mx-1 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs sm:text-sm font-black flex flex-col sm:flex-row items-center justify-center gap-1 shadow active:scale-95"
        >
          <span>📖</span>
          <span>にゃんこ図鑑</span>
        </button>
      </div>
    </div>
  );
};
