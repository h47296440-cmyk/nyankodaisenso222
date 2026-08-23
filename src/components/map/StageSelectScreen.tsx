import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChapterDefinition,
  StageDefinition,
  PlayerProfile,
  TreasureQuality,
  BattleActiveItems,
  ChapterId,
} from '../../types';
import { CHAPTERS } from '../../data/stages';
import {
  ArrowLeft,
  Sparkles,
  Lock,
  Wrench,
  HelpCircle,
  Zap,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  Shield,
  Flame,
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
  const [showMobileDetails, setShowMobileDetails] = useState<boolean>(false);

  // Screen View: 'chapter_select' (ふすまの章選択画面) or 'stage_map' (地図でのステージ選択画面)
  const [screenView, setScreenView] = useState<'chapter_select' | 'stage_map'>('chapter_select');

  // Selected Chapter ID
  const [selectedChapterId, setSelectedChapterId] = useState<ChapterId>('japan_1');
  const [isZombieMode, setIsZombieMode] = useState<boolean>(false);
  const [catSpeech, setCatSpeech] = useState<string>(
    'にゃんコンボ図鑑に表示されたにゃんコンボの名前部分をダブルタップすると自動でセット出来て便利にゃ'
  );
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Category filter for the chapter select menu
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'japan' | 'future' | 'cosmos' | 'legend' | 'crazed' | 'advent'>('all');

  const isInfiniteEnergy = !!profile.devMode?.infiniteEnergy;
  const isInfiniteXp = !!profile.devMode?.infiniteXp;
  const isInfiniteCatFood = !!profile.devMode?.infiniteCatFood;

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
  const chapterListRef = useRef<HTMLDivElement>(null);

  // =========================================================================
  // CHAPTER UNLOCK & PROGRESSION LOGIC
  // =========================================================================
  const checkChapterCleared = (chId: ChapterId): boolean => {
    const ch = CHAPTERS.find((c) => c.id === chId);
    if (!ch || ch.stages.length === 0) return false;
    const lastStage = ch.stages[ch.stages.length - 1];
    return !!profile.clearedStages[lastStage.id];
  };

  const checkChapterUnlocked = (chId: ChapterId): boolean => {
    switch (chId) {
      case 'japan_1':
      case 'japan':
        return true;
      case 'japan_2':
        return checkChapterCleared('japan_1');
      case 'japan_3':
        return checkChapterCleared('japan_2');
      case 'future_1':
      case 'future':
        return checkChapterCleared('japan_3') || checkChapterCleared('japan_1');
      case 'future_2':
        return checkChapterCleared('future_1');
      case 'future_3':
        return checkChapterCleared('future_2');
      case 'cosmos_1':
      case 'cosmos':
        return checkChapterCleared('future_3') || checkChapterCleared('future_1');
      case 'cosmos_2':
        return checkChapterCleared('cosmos_1');
      case 'cosmos_3':
        return checkChapterCleared('cosmos_2');
      case 'legend_1':
      case 'legend':
        return checkChapterCleared('japan_1');
      case 'legend_2':
        return checkChapterCleared('legend_1');
      case 'legend_3':
        return checkChapterCleared('legend_2');
      case 'legend_4':
        return checkChapterCleared('legend_3');
      case 'legend_5':
        return checkChapterCleared('legend_4');
      case 'legend_6':
        return checkChapterCleared('legend_5');
      case 'legend_7':
        return checkChapterCleared('legend_6');
      case 'legend_8':
        return checkChapterCleared('legend_7');
      case 'legend_9':
        return !!profile.hasClearedFilibuster && checkChapterCleared('legend_8');
      case 'legend_10':
        return !!profile.hasClearedFilibuster && checkChapterCleared('legend_9');
      case 'legend_11':
        return !!profile.hasClearedFilibuster && checkChapterCleared('legend_10');
      case 'legend_12':
        return !!profile.hasClearedFilibuster && checkChapterCleared('legend_11');
      case 'legend_13':
        return !!profile.hasClearedFilibuster && checkChapterCleared('legend_12');
      case 'legend_14':
        return !!profile.hasClearedFilibuster && checkChapterCleared('legend_13');
      case 'legend_15':
        return !!profile.hasClearedFilibuster && checkChapterCleared('legend_14');
      case 'legend_16':
        return !!profile.hasClearedFilibuster && checkChapterCleared('legend_15');
      case 'legend_17':
        return !!profile.hasClearedFilibuster && checkChapterCleared('legend_16');
      case 'legend_18':
        return !!profile.hasClearedFilibuster && checkChapterCleared('legend_17');
      case 'legend_19':
        return !!profile.hasClearedFilibuster && checkChapterCleared('legend_18');
      case 'legend_20':
        return !!profile.hasClearedFilibuster && checkChapterCleared('legend_19');
      case 'legend_21':
        return !!profile.hasClearedFilibuster && checkChapterCleared('legend_20');
      case 'real_legend_1':
      case 'real_legend':
        return !!profile.hasClearedFilibuster && checkChapterCleared('legend_21');
      case 'crazed_event':
      case 'crazed':
        return checkChapterCleared('japan_1');
      case 'zombie_future':
        return checkChapterCleared('future_1') || checkChapterCleared('japan_1');
      case 'zombie_cosmos':
        return checkChapterCleared('cosmos_1') || checkChapterCleared('future_1');
      case 'advent_clionel':
      case 'advent_hannya':
      case 'advent_red_cyclone':
      case 'advent_black_cyclone':
      case 'advent_alien_cyclone':
      case 'advent_zombie_cyclone':
      case 'advent_ancient_cyclone':
      case 'advent':
        return checkChapterCleared('japan_3') || checkChapterCleared('japan_1');
      case 'challenge_score_attack':
        return checkChapterCleared('japan_1');
      default:
        return false;
    }
  };

  // List of all Chapters with progressive visibility
  // "解放されてるところとそれをクリアすると解放されるところ(暗くして)以外は見えないように"
  const visibleChaptersWithStatus = useMemo(() => {
    const chaptersToFilter = activeCategoryTab === 'all' 
      ? CHAPTERS 
      : CHAPTERS.filter((c) => c.category === activeCategoryTab);

    const result: {
      chapter: ChapterDefinition;
      status: 'cleared' | 'unlocked' | 'next_locked';
      timeRemaining?: string;
      isEvent?: boolean;
    }[] = [];

    let hasFoundNextLocked = false;

    for (let i = 0; i < chaptersToFilter.length; i++) {
      const ch = chaptersToFilter[i];
      const isCleared = checkChapterCleared(ch.id);
      const isUnlocked = checkChapterUnlocked(ch.id);

      if (isCleared) {
        result.push({
          chapter: ch,
          status: 'cleared',
          timeRemaining: ch.category === 'crazed' ? 'のこり 01時間09分' : undefined,
          isEvent: ch.category === 'crazed',
        });
      } else if (isUnlocked) {
        result.push({
          chapter: ch,
          status: 'unlocked',
          timeRemaining: ch.category === 'crazed' ? 'のこり 01時間09分' : undefined,
          isEvent: ch.category === 'crazed',
        });
      } else if (!hasFoundNextLocked) {
        result.push({
          chapter: ch,
          status: 'next_locked',
          isEvent: ch.category === 'crazed',
        });
        hasFoundNextLocked = true;
      }
      // Subsequent locked chapters are hidden
    }

    return result;
  }, [activeCategoryTab, profile.clearedStages]);

  const currentChapter = useMemo(() => {
    return (
      CHAPTERS.find((c) => c.id === selectedChapterId) ||
      visibleChaptersWithStatus[0]?.chapter ||
      CHAPTERS[0]
    );
  }, [selectedChapterId, visibleChaptersWithStatus]);

  const hasZombieStages = !!(
    (currentChapter.category === 'japan' || currentChapter.category === 'future') &&
    currentChapter.zombieStages &&
    currentChapter.zombieStages.length > 0
  );

  const rawActiveStages = useMemo(() => {
    const baseList =
      isZombieMode && hasZombieStages && currentChapter.zombieStages
        ? currentChapter.zombieStages
        : currentChapter.stages;

    // Gate cosmos_3_filibuster behind Legend Chapter 8 clear
    return baseList.filter((st) => {
      if (st.id === 'cosmos_3_filibuster') {
        return checkChapterCleared('legend_8');
      }
      return true;
    });
  }, [isZombieMode, hasZombieStages, currentChapter, profile.clearedStages]);

  // Progressive visibility for stages in map
  const visibleStagesWithStatus = useMemo(() => {
    const result: { stage: StageDefinition; status: 'cleared' | 'unlocked' | 'next_locked' }[] = [];
    let hasFoundNextLocked = false;

    for (let i = 0; i < rawActiveStages.length; i++) {
      const st = rawActiveStages[i];
      const isCleared = !!profile.clearedStages[st.id];
      const isUnlocked = i === 0 || !!profile.clearedStages[rawActiveStages[i - 1].id];

      if (isCleared) {
        result.push({ stage: st, status: 'cleared' });
      } else if (isUnlocked) {
        result.push({ stage: st, status: 'unlocked' });
      } else if (!hasFoundNextLocked) {
        result.push({ stage: st, status: 'next_locked' });
        hasFoundNextLocked = true;
      }
    }

    return result;
  }, [rawActiveStages, profile.clearedStages]);

  const playableStages = useMemo(() => {
    return visibleStagesWithStatus.filter((s) => s.status !== 'next_locked').map((s) => s.stage);
  }, [visibleStagesWithStatus]);

  // Stage selection state
  const [selectedStageId, setSelectedStageId] = useState<string>(
    playableStages[0]?.id || rawActiveStages[0]?.id || 'japan_1_1'
  );

  // Sync selected stage when chapter or mode changes
  useEffect(() => {
    if (playableStages.length > 0) {
      const stageToSelect = playableStages[playableStages.length - 1] || playableStages[0];
      setSelectedStageId(stageToSelect.id);
    } else if (rawActiveStages.length > 0) {
      setSelectedStageId(rawActiveStages[0].id);
    }
  }, [selectedChapterId, isZombieMode]);

  const currentStage = useMemo(() => {
    return (
      rawActiveStages.find((s) => s.id === selectedStageId) ||
      playableStages[0] ||
      rawActiveStages[0]
    );
  }, [selectedStageId, rawActiveStages, playableStages]);

  const currentIndex = rawActiveStages.findIndex((s) => s.id === currentStage?.id);

  // Update Cat's speech on stage selection
  useEffect(() => {
    if (screenView === 'stage_map' && currentStage) {
      if (currentStage.id === 'crazed_allstars') {
        setCatSpeech(
          '極ムズ警告だにゃ！狂乱キャラ全員が一斉に押し寄せてくるにゃ！安価壁を5枚以上連打して前線を死守し、高火力アタッカーで総力戦だにゃ！'
        );
      } else if (currentStage.id.startsWith('crazed')) {
        setCatSpeech(
          `超激ムズ降臨だにゃ！${currentStage.name}の猛攻を耐え抜いて討伐すると狂乱キャラが仲間になるにゃ！`
        );
      } else if (currentStage.isZombieStage) {
        setCatSpeech(
          'ゾンビ敵は地中を潜って拠点を急襲し、倒されても蘇生するにゃ！ゾンビキラー特性持ちの味方が大活躍するにゃ！'
        );
      } else if (currentStage.isFinalBossStage) {
        setCatSpeech(
          `この章の最終決戦だにゃ！BOSS【${currentChapter.bossName}】を討伐して完全制覇を目指すにゃ！`
        );
      } else if (currentStage.treasureFestival) {
        setCatSpeech('お宝出現率が超UPしているにゃ！最高のお宝（金）を狙う絶好のチャンスだにゃ！');
      } else {
        const tips = [
          '壁キャラを絶え間なく生産して後ろの長射程アタッカーを守るのが勝利の秘訣だにゃ！',
          '働きネコのレベルを上げるとお金の上限と生産速度がアップするにゃ！',
          'お宝を金で揃えると統率力や攻撃力が劇的にパワーアップするにゃ！',
          '赤い敵には勇者ネコや暗黒ネコ、浮いてる敵にはネコ番長が頼もしいにゃ！',
        ];
        setCatSpeech(tips[Math.floor(Math.random() * tips.length)]);
      }
    }
  }, [currentStage?.id, screenView]);

  // Toggle battle item selection
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
    if (!currentStage) return;
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
      setSelectedStageId(rawActiveStages[currentIndex - 1].id);
    }
  };

  const handleNextStage = () => {
    if (currentIndex < rawActiveStages.length - 1) {
      audio.playClick();
      setSelectedStageId(rawActiveStages[currentIndex + 1].id);
    }
  };

  // Treasure status helper
  const getTreasureStatus = (stageId: string): TreasureQuality => {
    return profile.treasures[stageId] || 'none';
  };

  const currentTreasureStatus = currentStage ? getTreasureStatus(currentStage.id) : 'none';

  return (
    <div
      id="screen-stage-select"
      className="relative w-full h-full flex flex-col bg-stone-950 text-white select-none font-['M_PLUS_Rounded_1c'] overflow-hidden"
    >
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BAR (Iconic Battle Cats Top Bar with Wood & Gold accents)  */}
      {/* ========================================================================= */}
      <div className="z-30 bg-[#2b1e16] border-b-4 border-[#17100b] px-2 sm:px-4 pt-[max(0.35rem,env(safe-area-inset-top,0px))] pb-2 shadow-xl flex items-center justify-between gap-2">
        {/* Left: Back to Base Button (or Back to Chapter Select) */}
        <div className="flex items-center gap-2 shrink-0">
          {screenView === 'stage_map' ? (
            <button
              id="btn-back-to-chapter-select"
              onClick={() => {
                audio.playClick();
                setScreenView('chapter_select');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-b from-amber-500 via-amber-600 to-amber-800 hover:from-amber-400 hover:to-amber-700 text-stone-950 font-black text-xs sm:text-sm border-2 border-[#17100b] shadow-[0_2px_0_#17100b] active:translate-y-0.5 transition-all"
              title="章選択へ戻る"
            >
              <ArrowLeft size={16} strokeWidth={3} className="text-stone-950" />
              <span>章選択へ</span>
            </button>
          ) : (
            <button
              id="btn-back-to-base"
              onClick={() => {
                audio.playClick();
                onBackToTitle();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-b from-amber-500 via-amber-600 to-amber-800 hover:from-amber-400 hover:to-amber-700 text-stone-950 font-black text-xs sm:text-sm border-2 border-[#17100b] shadow-[0_2px_0_#17100b] active:translate-y-0.5 transition-all"
              title="ネコ基地へ戻る"
            >
              <ArrowLeft size={16} strokeWidth={3} className="text-stone-950" />
              <span>ネコ基地</span>
            </button>
          )}

          {/* Limited Sale / Event Banner (Authentic to Battle Cats UI) */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 border border-yellow-300 shadow text-[11px] font-black text-white animate-pulse">
            <Sparkles size={13} className="text-yellow-200" />
            <span>いまだけ!! のこり1日 超お得★限定パック発売中！</span>
          </div>
        </div>

        {/* Center: Title / Story Theater Badge */}
        <div className="flex items-center gap-1.5">
          {screenView === 'stage_map' ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-900/90 border border-amber-600/60 text-amber-300 font-black text-xs sm:text-sm shadow">
              <span>🗺️</span>
              <span>{currentChapter.jpName}</span>
            </div>
          ) : (
            <button
              id="btn-map-story-theater"
              onClick={() => {
                audio.playClick();
                onOpenStorySelect();
              }}
              className="text-[10px] sm:text-xs font-black text-white bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 px-2.5 py-1 rounded-lg shadow border border-purple-400 flex items-center gap-1 active:scale-95 transition-all whitespace-nowrap"
              title="各章のオープニング・エンディング"
            >
              <span>📜</span>
              <span>物語シアター</span>
            </button>
          )}

          <button
            id="btn-map-dev-mode"
            onClick={() => {
              audio.playClick();
              onOpenDevMode();
            }}
            className="text-[10px] sm:text-xs font-black text-stone-900 bg-amber-400 hover:bg-amber-300 px-2 py-1 rounded-lg shadow border border-amber-600 flex items-center gap-1 active:scale-95 transition-all whitespace-nowrap"
            title="開発者モード"
          >
            <Wrench size={12} className="text-stone-900" />
            <span className="hidden sm:inline">開発</span>
          </button>

          <button
            id="btn-help-modal"
            onClick={() => {
              audio.playClick();
              setShowHelpModal(true);
            }}
            className="p-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-600 active:scale-95"
            title="ヘルプ"
          >
            <HelpCircle size={16} />
          </button>
        </div>

        {/* Right: Currency & Energy Resources */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 text-xs font-black shrink-0">
          {/* XP */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border-2 whitespace-nowrap ${
              isInfiniteXp
                ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse'
                : 'bg-stone-900 border-[#4a3525] text-emerald-300'
            }`}
          >
            <span className="text-[10px] font-black text-emerald-400">経験値 XP</span>
            <span className="text-xs font-black">
              {isInfiniteXp ? '∞' : profile.xp.toLocaleString()}
            </span>
          </div>

          {/* Cat Food */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border-2 whitespace-nowrap ${
              isInfiniteCatFood
                ? 'bg-amber-950/90 border-amber-400 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.4)] animate-pulse'
                : 'bg-stone-900 border-[#4a3525] text-amber-300'
            }`}
          >
            <span className="text-[10px] font-black text-amber-400">缶</span>
            <span className="text-xs font-black">
              {isInfiniteCatFood ? '∞' : profile.catFood.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN VIEW SWITCHER: CHAPTER SELECT (FUSUMA MENU) VS MAP VIEW           */}
      {/* ========================================================================= */}
      {screenView === 'chapter_select' ? (
        // =========================================================================
        // SCREEN 1: CHAPTER & EVENT SELECT MENU (ATTACHED SCREENSHOT AUTHENTIC UI!)
        // =========================================================================
        <div
          id="fusuma-chapter-select-menu"
          className="relative flex-1 w-full h-full flex flex-col md:flex-row overflow-hidden"
          style={{
            // Green Japanese Karakusa / Fusuma pattern matching the screenshot!
            backgroundColor: '#3b5c46',
            backgroundImage: `
              radial-gradient(circle at 50% 50%, #466e54 10%, transparent 10.5%),
              radial-gradient(circle at 0% 50%, #466e54 10%, transparent 10.5%),
              radial-gradient(circle at 100% 50%, #466e54 10%, transparent 10.5%),
              radial-gradient(circle at 50% 0%, #466e54 10%, transparent 10.5%),
              radial-gradient(circle at 50% 100%, #466e54 10%, transparent 10.5%)
            `,
            backgroundSize: '48px 48px',
          }}
        >
          {/* Fusuma Center Divider & Traditional Metal Pull (襖の引き手) */}
          <div className="hidden md:flex absolute inset-y-0 left-1/2 -translate-x-1/2 w-10 flex-col items-center justify-center pointer-events-none z-10">
            {/* Center Vertical Fusuma Seam */}
            <div className="absolute inset-y-0 w-1.5 bg-[#17100b] shadow-[0_0_8px_rgba(0,0,0,0.8)]" />
            {/* Round Metal Fusuma Pull with Cat Paw Motif */}
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-stone-500 via-stone-700 to-stone-900 border-4 border-[#17100b] shadow-[0_4px_10px_rgba(0,0,0,0.9)] flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-stone-800 to-stone-950 border-2 border-stone-600 flex items-center justify-center text-stone-400 font-black text-lg">
                🐾
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* LEFT PANEL: Scrollable Orange/Amber Chapter & Event Buttons          */}
          {/* ------------------------------------------------------------------- */}
          <div className="flex-1 md:w-1/2 md:max-w-xl lg:max-w-2xl h-full flex flex-col z-20 overflow-hidden bg-black/10 backdrop-blur-[1px]">
            {/* Filter Tabs Header */}
            <div className="p-2 sm:px-4 bg-[#1e150f]/90 border-b-2 border-[#3d2a1c] flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow">
              {[
                { id: 'all' as const, label: 'すべて' },
                { id: 'japan' as const, label: '日本編' },
                { id: 'future' as const, label: '未来編' },
                { id: 'cosmos' as const, label: '宇宙編' },
                { id: 'legend' as const, label: 'レジェンド' },
                { id: 'crazed' as const, label: '狂乱祭' },
                { id: 'advent' as const, label: '降臨BOSS' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  id={`tab-filter-${tab.id}`}
                  onClick={() => {
                    audio.playClick();
                    setActiveCategoryTab(tab.id);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-black whitespace-nowrap transition-all border ${
                    activeCategoryTab === tab.id
                      ? 'bg-amber-500 text-stone-950 border-yellow-300 shadow font-black'
                      : 'bg-stone-900/80 text-stone-300 border-stone-700 hover:bg-stone-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable Chapter Buttons List */}
            <div
              ref={chapterListRef}
              className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col gap-3.5 no-scrollbar"
            >
              {visibleChaptersWithStatus.map(({ chapter: ch, status, timeRemaining, isEvent }) => {
                const isCleared = status === 'cleared';
                const isNextLocked = status === 'next_locked';

                return (
                  <div
                    key={ch.id}
                    id={`chapter-card-${ch.id}`}
                    onClick={() => {
                      if (!isNextLocked) {
                        audio.playClick();
                        setSelectedChapterId(ch.id);
                        setScreenView('stage_map'); // Transition to JapanMapCanvas!
                      }
                    }}
                    className={`group relative w-full rounded-2xl border-[3.5px] p-3 sm:p-4 flex items-center justify-between gap-3 shadow-[0_6px_0_rgba(0,0,0,0.6)] active:translate-y-1 active:shadow-[0_2px_0_rgba(0,0,0,0.6)] transition-all ${
                      isNextLocked
                        ? 'bg-gradient-to-r from-stone-800 to-stone-900 border-stone-700 opacity-60 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#ff6e00] via-[#fa5a00] to-[#e64a00] hover:from-[#ff7a14] hover:to-[#f05000] border-black text-white cursor-pointer'
                    }`}
                  >
                    {/* Time Limit / Event Tag Banner on Top-Right of Button */}
                    {timeRemaining && (
                      <div className="absolute -top-3 right-6 bg-[#1a1410] border-2 border-[#543b27] px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black text-white shadow flex items-center gap-1 z-10">
                        <span className="text-yellow-400">⏱️</span>
                        <span>{timeRemaining}</span>
                      </div>
                    )}

                    {/* Left: Stamp (CLEAR!) & Title Details */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Red Stamp Badge (CLEAR!) as in user screenshot */}
                      {isCleared ? (
                        <div className="bg-red-600 text-white font-black text-[10px] sm:text-xs px-2.5 py-0.5 rounded border-2 border-black shadow rotate-[-10deg] tracking-wider shrink-0 animate-pulse">
                          CLEAR!
                        </div>
                      ) : isNextLocked ? (
                        <div className="w-8 h-8 rounded-full bg-stone-900 border-2 border-stone-600 flex items-center justify-center text-stone-400 shrink-0">
                          <Lock size={16} />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 border-2 border-black text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center shadow shrink-0">
                          {ch.category === 'crazed' ? '👹' : '★'}
                        </div>
                      )}

                      {/* Chapter Names & Difficulty */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] sm:text-xs font-black text-amber-200 drop-shadow">
                            {ch.category === 'japan'
                              ? '日本編'
                              : ch.category === 'future'
                              ? '未来編'
                              : ch.category === 'cosmos'
                              ? '宇宙編'
                              : ch.category === 'legend'
                              ? 'レジェンドストーリー'
                              : '降臨イベント'}
                          </span>
                          {ch.category === 'crazed' && (
                            <span className="text-[9px] bg-red-700 text-white px-1.5 py-0.2 rounded font-black border border-red-400">
                              極ムズ
                            </span>
                          )}
                        </div>

                        {/* Big Bold Chapter / Stage Name */}
                        <div className="text-base sm:text-xl font-black text-white tracking-wide drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)] truncate">
                          {ch.jpName}
                        </div>

                        <div className="text-[11px] sm:text-xs font-bold text-amber-100/90 truncate mt-0.5">
                          {isNextLocked ? '🔒 前の章をクリアで解放！' : ch.subtitle}
                        </div>
                      </div>
                    </div>

                    {/* Right: Authentic Speech Lore Button (...) */}
                    <div className="flex items-center gap-2 shrink-0">
                      {!isNextLocked && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            audio.playClick();
                            if (ch.category === 'crazed') {
                              setCatSpeech(
                                `【${ch.jpName}】だにゃ！狂乱キャラの強力な一撃に耐え抜いて仲間を手に入れるにゃ！`
                              );
                            } else {
                              setCatSpeech(
                                `【${ch.jpName}】へ進軍するにゃ！${ch.subtitle} 準備はいいかにゃ？`
                              );
                            }
                          }}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white hover:bg-stone-100 text-stone-950 font-black text-sm border-2 border-black shadow flex items-center justify-center active:scale-95"
                          title="章の解説を聞く"
                        >
                          ...
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* RIGHT PANEL: Authentic Battle Cats Mascot & Speech Bubble           */}
          {/* ------------------------------------------------------------------- */}
          <div className="md:flex-1 md:w-1/2 h-auto md:h-full flex flex-col justify-end p-2 sm:p-4 md:p-8 z-20 pointer-events-none shrink-0">
            <div className="flex flex-col items-end gap-2 md:gap-3 pointer-events-auto max-w-lg ml-auto w-full">
              {/* Authentic Dark Speech Bubble with White Outline matching screenshot! */}
              <div className="relative w-full bg-[#1b262c]/95 border-2 sm:border-4 border-white text-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-[0_10px_25px_rgba(0,0,0,0.8)] backdrop-blur-sm">
                <div className="text-xs sm:text-base font-black leading-relaxed tracking-wide">
                  {catSpeech}
                </div>
                {/* Speech Bubble Tail pointing to Cat */}
                <div className="absolute -bottom-3 sm:-bottom-4 right-16 sm:right-20 w-0 h-0 border-x-[8px] sm:border-x-[12px] border-x-transparent border-t-[12px] sm:border-t-[16px] border-t-white" />
                <div className="absolute -bottom-2 sm:-bottom-2.5 right-16 sm:right-20 w-0 h-0 border-x-[6px] sm:border-x-[9px] border-x-transparent border-t-[9px] sm:border-t-[12px] border-t-[#1b262c]" />
              </div>

              {/* Big Iconic Battle Cat Face Illustration */}
              <div className="relative -mr-2 sm:mr-4 w-28 h-24 sm:w-44 sm:h-36 md:w-56 md:h-44 shrink-0 flex items-end justify-center">
                <svg viewBox="0 0 200 160" className="w-full h-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]">
                  {/* Cat Head / Body (White with thick black outline) */}
                  <path
                    d="M 30 160 C 20 80, 50 40, 100 40 C 150 40, 180 80, 170 160 Z"
                    fill="#ffffff"
                    stroke="#000000"
                    strokeWidth="7"
                    strokeLinejoin="round"
                  />
                  {/* Left Ear */}
                  <polygon
                    points="45,65 30,10 75,45"
                    fill="#ffffff"
                    stroke="#000000"
                    strokeWidth="7"
                    strokeLinejoin="round"
                  />
                  {/* Right Ear */}
                  <polygon
                    points="155,65 170,10 125,45"
                    fill="#ffffff"
                    stroke="#000000"
                    strokeWidth="7"
                    strokeLinejoin="round"
                  />
                  {/* Eyes (Round black dots) */}
                  <circle cx="75" cy="85" r="7" fill="#000000" />
                  <circle cx="125" cy="85" r="7" fill="#000000" />
                  {/* Mouth (Iconic :3 curve) */}
                  <path
                    d="M 90 102 Q 100 112 100 102 Q 100 112 110 102"
                    stroke="#000000"
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                  />
                  {/* Whiskers */}
                  <line x1="30" y1="88" x2="55" y2="92" stroke="#000000" strokeWidth="5" strokeLinecap="round" />
                  <line x1="28" y1="104" x2="54" y2="102" stroke="#000000" strokeWidth="5" strokeLinecap="round" />
                  <line x1="170" y1="88" x2="145" y2="92" stroke="#000000" strokeWidth="5" strokeLinecap="round" />
                  <line x1="172" y1="104" x2="146" y2="102" stroke="#000000" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // =========================================================================
        // SCREEN 2: INTERACTIVE MAP & STAGE DEPLOYMENT (JapanMapCanvas View)
        // =========================================================================
        <div className="relative flex-1 w-full h-full flex flex-col md:flex-row overflow-hidden bg-stone-950">
          {/* Main Map Viewport (Takes full available height in portrait mode!) */}
          <div className="relative flex-1 w-full h-[55vh] md:h-full min-h-[260px] overflow-hidden">
            <JapanMapCanvas
              chapter={currentChapter}
              stages={rawActiveStages}
              selectedStageId={selectedStageId}
              clearedStages={profile.clearedStages}
              onSelectStage={(st) => {
                audio.playClick();
                setSelectedStageId(st.id);
              }}
              containerRef={mapScrollRef}
            />

            {/* Zombie Mode Switcher Button (Overlay on Map for Japan/Future) */}
            {hasZombieStages && (
              <div className="absolute top-3 left-3 z-30">
                <button
                  id="btn-toggle-zombie-mode-map"
                  onClick={() => {
                    audio.playClick();
                    setIsZombieMode((prev) => !prev);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-lg border-2 active:scale-95 ${
                    isZombieMode
                      ? 'bg-gradient-to-r from-purple-800 via-indigo-900 to-emerald-900 text-purple-200 border-purple-400 ring-2 ring-purple-400 shadow-purple-500/50 animate-pulse'
                      : 'bg-[#2b1e16]/90 text-purple-300 border-purple-700/80 hover:bg-[#3d2a1c]'
                  }`}
                  title="ゾンビ襲来モード切替"
                >
                  <span>🧟</span>
                  <span>{isZombieMode ? 'ゾンビ襲来中！' : 'ゾンビ襲来切替'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Right/Bottom Stage Deployment Control Panel (Responsive for Portrait & Landscape) */}
          <div className="w-full md:w-84 lg:w-96 bg-[#180f0a] border-t-4 md:border-t-0 md:border-l-4 border-[#2d1b11] p-2.5 sm:p-4 flex flex-col justify-between shadow-2xl overflow-y-auto no-scrollbar z-20 shrink-0 max-h-[45vh] md:max-h-full">
            {/* Top: Stage Title & Navigation */}
            <div className="flex flex-col gap-2">
              {/* Chapter & Stage Switcher Header */}
              <div className="flex items-center justify-between bg-stone-900/90 p-1.5 sm:p-2 rounded-xl border border-stone-800">
                <button
                  onClick={handlePrevStage}
                  disabled={currentIndex <= 0}
                  className={`p-1 rounded-lg border text-xs font-black ${
                    currentIndex > 0
                      ? 'bg-amber-600 text-white border-amber-400 hover:bg-amber-500'
                      : 'bg-stone-800 text-stone-600 border-stone-700 cursor-not-allowed'
                  }`}
                  title="前のステージ"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="text-center px-2 flex-1 min-w-0">
                  <div className="text-[10px] text-amber-400 font-bold truncate">
                    {currentChapter.jpName} (第{currentIndex + 1}ステージ)
                  </div>
                  <div className="text-sm sm:text-base font-black text-white truncate">
                    {currentStage?.name}
                  </div>
                </div>

                <button
                  onClick={handleNextStage}
                  disabled={currentIndex >= rawActiveStages.length - 1}
                  className={`p-1 rounded-lg border text-xs font-black ${
                    currentIndex < rawActiveStages.length - 1
                      ? 'bg-amber-600 text-white border-amber-400 hover:bg-amber-500'
                      : 'bg-stone-800 text-stone-600 border-stone-700 cursor-not-allowed'
                  }`}
                  title="次のステージ"
                >
                  <ChevronRight size={16} />
                </button>

                {/* Mobile Toggle Details Button */}
                <button
                  onClick={() => {
                    audio.playClick();
                    setShowMobileDetails((prev) => !prev);
                  }}
                  className="md:hidden ml-1 px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 text-[10px] font-black shrink-0"
                >
                  {showMobileDetails ? '詳細閉じる ▲' : 'アイテム/詳細 ▼'}
                </button>
              </div>

              {/* Collapsible details on mobile, always visible on desktop */}
              <div className={`${showMobileDetails ? 'flex' : 'hidden md:flex'} flex-col gap-2`}>
                {/* Stage Rewards & Treasure Details */}
                {currentStage && (
                  <div className="bg-[#241710] border-2 border-[#4d3221] p-2.5 rounded-2xl shadow flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                      <div className="bg-stone-900/80 p-1.5 rounded-xl border border-stone-800">
                        <div className="text-[9px] text-stone-400">獲得可能 XP</div>
                        <div className="text-emerald-400 font-black text-xs sm:text-sm">
                          +{currentStage.baseRewardXp.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-stone-900/80 p-1.5 rounded-xl border border-stone-800">
                        <div className="text-[9px] text-stone-400">初回ネコカン</div>
                        <div className="text-amber-400 font-black text-xs sm:text-sm">
                          +{currentStage.baseRewardCatFood}缶
                        </div>
                      </div>
                    </div>

                    {/* Treasure Quality Status */}
                    <div className="flex items-center justify-between bg-stone-900/80 px-2.5 py-1 rounded-xl border border-stone-800">
                      <span className="text-[11px] font-bold text-stone-300">お宝状況:</span>
                      <div className="flex items-center gap-1">
                        {currentTreasureStatus === 'gold' ? (
                          <span className="text-[11px] font-black text-yellow-300 flex items-center gap-1">
                            👑 最高 (金)
                          </span>
                        ) : currentTreasureStatus === 'silver' ? (
                          <span className="text-[11px] font-black text-slate-300 flex items-center gap-1">
                            🥈 普通 (銀)
                          </span>
                        ) : currentTreasureStatus === 'bronze' ? (
                          <span className="text-[11px] font-black text-amber-500 flex items-center gap-1">
                            🥉 粗悪 (銅)
                          </span>
                        ) : (
                          <span className="text-[11px] text-stone-500 font-bold">未獲得</span>
                        )}
                      </div>
                    </div>

                    {currentStage.rewardCatUnlockId && (
                      <div className="bg-gradient-to-r from-purple-950 to-red-950 border border-purple-400 p-1.5 rounded-xl flex items-center gap-1.5">
                        <Sparkles size={14} className="text-yellow-300 shrink-0" />
                        <span className="text-[10px] font-black text-yellow-200">
                          クリアで狂乱キャラを必ず獲得！
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Cat Advice Bubble */}
                <div className="bg-stone-900/90 border border-stone-800 p-2 rounded-xl flex items-start gap-1.5">
                  <span className="text-base">🐱</span>
                  <span className="text-[10px] sm:text-[11px] text-stone-300 font-bold leading-tight">
                    {catSpeech}
                  </span>
                </div>

                {/* Battle Items Quick Toggles */}
                <div>
                  <div className="text-[9px] sm:text-[10px] font-black text-amber-400 mb-1 flex items-center justify-between">
                    <span>出撃アイテム使用:</span>
                    <span className="text-stone-400 text-[8px]">タップでON/OFF</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1 bg-stone-900/90 p-1.5 rounded-xl border border-stone-800">
                    {/* Speed Up */}
                    <button
                      id="item-toggle-speedup"
                      onClick={() => handleToggleItem('speedUp', profile.items?.speedUp || 0)}
                      className={`flex flex-col items-center justify-center p-1 rounded-lg border text-center transition-all ${
                        activeItems.speedUp
                          ? 'bg-amber-500/30 border-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                          : 'bg-stone-800 border-stone-700'
                      }`}
                    >
                      <span className="text-[10px] font-black text-amber-300">⚡</span>
                      <span className="text-[7px] sm:text-[8px] text-stone-300">SPEED</span>
                      <span className="text-[8px] sm:text-[9px] font-black text-amber-400">
                        x{profile.items?.speedUp || 0}
                      </span>
                    </button>

                    {/* Radar */}
                    <button
                      id="item-toggle-radar"
                      onClick={() => handleToggleItem('treasureRadar', profile.items?.treasureRadar || 0)}
                      className={`flex flex-col items-center justify-center p-1 rounded-lg border text-center transition-all ${
                        activeItems.treasureRadar
                          ? 'bg-amber-500/30 border-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                          : 'bg-stone-800 border-stone-700'
                      }`}
                    >
                      <span className="text-[10px] font-black text-yellow-400">GET</span>
                      <span className="text-[7px] sm:text-[8px] text-stone-300">レーダー</span>
                      <span className="text-[8px] sm:text-[9px] font-black text-yellow-400">
                        x{profile.items?.treasureRadar || 0}
                      </span>
                    </button>

                    {/* Rich Cat */}
                    <button
                      id="item-toggle-richcat"
                      onClick={() => handleToggleItem('richCat', profile.items?.richCat || 0)}
                      className={`flex flex-col items-center justify-center p-1 rounded-lg border text-center transition-all ${
                        activeItems.richCat
                          ? 'bg-amber-500/30 border-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                          : 'bg-stone-800 border-stone-700'
                      }`}
                    >
                      <span className="text-[10px] font-black text-emerald-400">MAX</span>
                      <span className="text-[7px] sm:text-[8px] text-stone-300">ネコボン</span>
                      <span className="text-[8px] sm:text-[9px] font-black text-emerald-400">
                        x{profile.items?.richCat || 0}
                      </span>
                    </button>

                    {/* CPU */}
                    <button
                      id="item-toggle-catcpu"
                      onClick={() => handleToggleItem('catCpu', profile.items?.catCpu || 0)}
                      className={`flex flex-col items-center justify-center p-1 rounded-lg border text-center transition-all ${
                        activeItems.catCpu
                          ? 'bg-amber-500/30 border-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                          : 'bg-stone-800 border-stone-700'
                      }`}
                    >
                      <span className="text-[10px] font-black text-cyan-400">CPU</span>
                      <span className="text-[7px] sm:text-[8px] text-stone-300">ニャンピ</span>
                      <span className="text-[8px] sm:text-[9px] font-black text-cyan-400">
                        x{profile.items?.catCpu || 0}
                      </span>
                    </button>

                    {/* Jobs */}
                    <button
                      id="item-toggle-catjobs"
                      onClick={() => handleToggleItem('catJobs', profile.items?.catJobs || 0)}
                      className={`flex flex-col items-center justify-center p-1 rounded-lg border text-center transition-all ${
                        activeItems.catJobs
                          ? 'bg-amber-500/30 border-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                          : 'bg-stone-800 border-stone-700'
                      }`}
                    >
                      <span className="text-[10px] font-black text-purple-400">XP</span>
                      <span className="text-[7px] sm:text-[8px] text-stone-300">おかめ</span>
                      <span className="text-[8px] sm:text-[9px] font-black text-purple-400">
                        x{profile.items?.catJobs || 0}
                      </span>
                    </button>

                    {/* Sniper */}
                    <button
                      id="item-toggle-sniper"
                      onClick={() => handleToggleItem('sniper', profile.items?.sniper || 0)}
                      className={`flex flex-col items-center justify-center p-1 rounded-lg border text-center transition-all ${
                        activeItems.sniper
                          ? 'bg-amber-500/30 border-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                          : 'bg-stone-800 border-stone-700'
                      }`}
                    >
                      <span className="text-[10px] font-black text-red-400">🎯</span>
                      <span className="text-[7px] sm:text-[8px] text-stone-300">スニャ</span>
                      <span className="text-[8px] sm:text-[9px] font-black text-red-400">
                        x{profile.items?.sniper || 0}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom: Energy Cost & Golden Deploy Button */}
            <div className="flex flex-col gap-2 mt-2 pt-1.5 border-t-2 border-[#3d2415]">
              <div className="flex items-center justify-between bg-black/60 px-3 py-1 rounded-xl border border-stone-800">
                <span className="text-xs font-black text-stone-300">必要統率力</span>
                <div className="flex items-center gap-1.5">
                  <Zap size={14} className="text-cyan-400" />
                  <span className="text-sm font-black text-cyan-300">
                    {currentStage?.energyCost}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-stone-400">
                    (所持: {isInfiniteEnergy ? '∞' : profile.energy})
                  </span>
                </div>
              </div>

              <button
                id="btn-deploy-battle"
                onClick={handleDeploy}
                className="w-full py-2.5 sm:py-3 rounded-2xl bg-gradient-to-b from-yellow-400 via-amber-500 to-amber-700 hover:from-yellow-300 hover:to-amber-600 text-stone-950 font-black text-sm sm:text-lg border-2 sm:border-4 border-yellow-200 shadow-[0_4px_0_#451a03] sm:shadow-[0_6px_0_#451a03] active:translate-y-1 active:shadow-[0_1px_0_#451a03] flex items-center justify-center gap-2 tracking-wider transition-all"
              >
                <span className="text-base sm:text-xl">⚔️</span>
                <span>戦闘開始!! (いざ出陣)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. HELP MODAL                                                             */}
      {/* ========================================================================= */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#241710] border-4 border-amber-500 rounded-3xl max-w-md w-full p-5 text-white shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b-2 border-stone-700 pb-2">
              <div className="text-base font-black text-amber-300 flex items-center gap-2">
                <HelpCircle size={20} className="text-yellow-400" />
                <span>ステージ選択・出撃の遊び方</span>
              </div>
              <button
                onClick={() => {
                  audio.playClick();
                  setShowHelpModal(false);
                }}
                className="text-stone-400 hover:text-white font-black text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="text-xs sm:text-sm space-y-2.5 text-stone-200 leading-relaxed max-h-[60vh] overflow-y-auto no-scrollbar">
              <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800">
                <span className="text-amber-300 font-black">1. 章・エリアの選択</span>
                <p className="text-[12px] text-stone-300 mt-0.5">
                  ふすま画面の大きなオレンジ色のボタンをタップすると、その章のマップ画面に移動します。
                </p>
              </div>
              <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800">
                <span className="text-amber-300 font-black">2. 地図上でステージ選択</span>
                <p className="text-[12px] text-stone-300 mt-0.5">
                  日本地図や世界地図上の赤いピンをタップして攻略したい都道府県やステージを選択します。
                </p>
              </div>
              <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800">
                <span className="text-amber-300 font-black">3. 出撃アイテムと戦闘開始</span>
                <p className="text-[12px] text-stone-300 mt-0.5">
                  右側パネルでアイテム使用を設定し、「戦闘開始!!」を押すとバトルが開始されます！
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                audio.playClick();
                setShowHelpModal(false);
              }}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm border-2 border-amber-300 shadow active:scale-95"
            >
              わかったにゃ！
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
