import React, { useState } from 'react';
import { ChapterDefinition, StageDefinition, PlayerProfile, TreasureQuality } from '../../types';
import { CHAPTERS, TREASURES } from '../../data/stages';
import { Play, Sparkles, Award, ShieldAlert, ChevronRight, Lock, Zap, ArrowLeft } from 'lucide-react';
import { audio } from '../../utils/audio';

interface StageSelectScreenProps {
  profile: PlayerProfile;
  onSelectStage: (stage: StageDefinition) => void;
  onOpenUpgrade: () => void;
  onOpenGacha: () => void;
  onOpenTreasures: () => void;
  onOpenEncyclopedia: () => void;
  onBackToTitle: () => void;
}

export const StageSelectScreen: React.FC<StageSelectScreenProps> = ({
  profile,
  onSelectStage,
  onOpenUpgrade,
  onOpenGacha,
  onOpenTreasures,
  onOpenEncyclopedia,
  onBackToTitle,
}) => {
  const [selectedChapterId, setSelectedChapterId] = useState<'japan' | 'future' | 'cosmos'>('japan');

  const currentChapter = CHAPTERS.find((c) => c.id === selectedChapterId) || CHAPTERS[0];

  // Check chapter unlock condition
  const isFutureUnlocked = !!profile.clearedStages['japan_6'];
  const isCosmosUnlocked = !!profile.clearedStages['future_3'];

  const handleStageClick = (stage: StageDefinition) => {
    audio.playClick();
    if (profile.energy < stage.energyCost) {
      alert('統率力（エナジー）が足りないにゃ！時間が経つと回復するにゃ。');
      return;
    }
    onSelectStage(stage);
  };

  const getTreasureBadge = (stageId: string) => {
    const quality = profile.treasures[stageId] || 'none';
    if (quality === 'gold') {
      return (
        <span className="flex items-center gap-0.5 text-[10px] font-black text-amber-300 bg-amber-950/80 border border-yellow-400 px-1.5 py-0.5 rounded-full">
          <Award size={12} className="text-yellow-400" /> 金のお宝
        </span>
      );
    }
    if (quality === 'silver') {
      return (
        <span className="flex items-center gap-0.5 text-[10px] font-black text-slate-300 bg-slate-900 border border-slate-400 px-1.5 py-0.5 rounded-full">
          <Award size={12} className="text-slate-300" /> 銀のお宝
        </span>
      );
    }
    if (quality === 'bronze') {
      return (
        <span className="flex items-center gap-0.5 text-[10px] font-black text-amber-600 bg-amber-950/40 border border-amber-700 px-1.5 py-0.5 rounded-full">
          <Award size={12} className="text-amber-600" /> 銅のお宝
        </span>
      );
    }
    return (
      <span className="text-[10px] text-stone-500 font-bold">
        お宝未獲得
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-stone-950 text-white select-none font-['M_PLUS_Rounded_1c']">
      {/* Top Resource & Navigation Header */}
      <div className="bg-stone-900 border-b border-stone-800 px-3 sm:px-6 py-2 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-to-title"
            onClick={() => {
              audio.playClick();
              onBackToTitle();
            }}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm sm:text-base font-black text-amber-300 leading-tight">
              にゃんこ大戦争 <span className="text-xs text-stone-400 font-bold">v1.0</span>
            </h1>
            <div className="text-[11px] text-stone-400 font-bold">ステージ選択</div>
          </div>
        </div>

        {/* Resources: Energy (統率力), XP, Cat Food */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs font-black">
          {/* Energy */}
          <div className="flex items-center gap-1 bg-stone-800/90 border border-cyan-500/50 px-2.5 py-1 rounded-full text-cyan-300">
            <Zap size={14} className="text-cyan-400" />
            <span>
              {profile.energy} <span className="text-[10px] text-stone-400">/ {profile.maxEnergy}</span>
            </span>
          </div>

          {/* XP */}
          <div className="flex items-center gap-1 bg-stone-800/90 border border-emerald-500/50 px-2.5 py-1 rounded-full text-emerald-300">
            <span className="text-[10px] text-emerald-400">XP</span>
            <span>{profile.xp.toLocaleString()}</span>
          </div>

          {/* Cat Food (ネコ缶) */}
          <div className="flex items-center gap-1 bg-stone-800/90 border border-amber-500/50 px-2.5 py-1 rounded-full text-amber-300">
            <span className="text-[10px] text-amber-400">缶</span>
            <span>{profile.catFood}</span>
          </div>
        </div>
      </div>

      {/* Chapter Selection Tabs */}
      <div className="flex bg-stone-900 border-b border-stone-800 px-2 sm:px-6 gap-2 overflow-x-auto py-2">
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
              className={`flex-1 min-w-[130px] sm:min-w-[160px] py-2 px-3 rounded-xl border-2 font-black text-xs sm:text-sm flex flex-col items-center justify-center transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 border-amber-300 text-white shadow-lg scale-[1.02]'
                  : isLocked
                  ? 'bg-stone-900/60 border-stone-800 text-stone-600 opacity-60 cursor-not-allowed'
                  : 'bg-stone-800/80 border-stone-700 text-stone-300 hover:bg-stone-700 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1">
                {isLocked && <Lock size={12} />}
                <span>{ch.name}</span>
              </div>
              <span className="text-[10px] font-normal text-stone-300 truncate max-w-full">
                {isLocked ? ch.unlockRequirement : ch.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stage Cards Grid / List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {currentChapter.stages.map((st, idx) => {
          const isCleared = !!profile.clearedStages[st.id];
          // Stage unlocked if stage 1 or previous stage cleared
          const prevStage = currentChapter.stages[idx - 1];
          const isUnlocked = idx === 0 || (prevStage && !!profile.clearedStages[prevStage.id]);
          const trDef = TREASURES[st.id];

          return (
            <div
              key={st.id}
              id={`card-stage-${st.id}`}
              className={`rounded-2xl border-2 p-4 flex flex-col justify-between transition-all ${
                isUnlocked
                  ? 'bg-stone-900/90 border-stone-700 hover:border-amber-400 hover:shadow-xl'
                  : 'bg-stone-950/80 border-stone-800/60 opacity-50 cursor-not-allowed'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-amber-400">
                    STAGE {st.stageNumber}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isCleared && (
                      <span className="bg-emerald-950 text-emerald-300 border border-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                        クリア済 ★
                      </span>
                    )}
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-0.5">
                      <Zap size={12} /> {st.energyCost}
                    </span>
                  </div>
                </div>

                {/* Stage Name */}
                <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                  {st.name}
                </h3>
                <p className="text-xs text-stone-400 mt-0.5 line-clamp-2">
                  {st.jpName}
                </p>

                {/* Treasure Info */}
                {trDef && (
                  <div className="mt-3 pt-2.5 border-t border-stone-800/80 flex items-center justify-between text-xs">
                    <span className="text-stone-400 text-[11px] font-bold">
                      お宝: {trDef.name}
                    </span>
                    {getTreasureBadge(st.id)}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-4">
                {isUnlocked ? (
                  <button
                    id={`btn-deploy-${st.id}`}
                    onClick={() => handleStageClick(st)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black text-sm border-2 border-yellow-200 shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <Play size={16} fill="currentColor" />
                    <span>出撃する（統率力 {st.energyCost}）</span>
                  </button>
                ) : (
                  <div className="w-full py-2 rounded-xl bg-stone-800/50 text-stone-500 font-bold text-xs text-center flex items-center justify-center gap-1">
                    <Lock size={14} />
                    <span>前のステージをクリアで解放</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Hub Nav: Upgrades, Gacha, Treasures, Encyclopedia */}
      <div className="bg-stone-900/95 border-t-2 border-stone-800 p-2 sm:p-3 flex justify-around items-center">
        <button
          id="btn-nav-upgrade"
          onClick={() => {
            audio.playClick();
            onOpenUpgrade();
          }}
          className="flex-1 py-2 px-1 mx-1 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs sm:text-sm font-black flex flex-col sm:flex-row items-center justify-center gap-1 shadow"
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
          className="flex-1 py-2 px-1 mx-1 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 border border-yellow-400 text-white text-xs sm:text-sm font-black flex flex-col sm:flex-row items-center justify-center gap-1 shadow"
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
          className="flex-1 py-2 px-1 mx-1 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs sm:text-sm font-black flex flex-col sm:flex-row items-center justify-center gap-1 shadow"
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
          className="flex-1 py-2 px-1 mx-1 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs sm:text-sm font-black flex flex-col sm:flex-row items-center justify-center gap-1 shadow"
        >
          <span>📖</span>
          <span>にゃんこ図鑑</span>
        </button>
      </div>
    </div>
  );
};
