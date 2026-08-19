import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { StageDefinition, TreasureQuality } from '../../types';
import { TREASURES } from '../../data/stages';
import { CAT_DEFINITIONS } from '../../data/units';
import { Trophy, Skull, Sparkles, ArrowRight, RotateCcw, Award, CheckCircle } from 'lucide-react';
import { audio } from '../../utils/audio';

interface BattleResultModalProps {
  isVictory: boolean;
  stage: StageDefinition;
  xpEarned: number;
  catFoodEarned: number;
  treasureDropped: {
    name: string;
    quality: TreasureQuality;
    description: string;
  } | null;
  onNextStage: () => void;
  onReturnToMap: () => void;
  onRetry: () => void;
  hasNextStage: boolean;
}

export const BattleResultModal: React.FC<BattleResultModalProps> = ({
  isVictory,
  stage,
  xpEarned,
  catFoodEarned,
  treasureDropped,
  onNextStage,
  onReturnToMap,
  onRetry,
  hasNextStage,
}) => {
  useEffect(() => {
    if (isVictory) {
      audio.playVictory();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else {
      audio.playDefeat();
    }
  }, [isVictory]);

  const unlockedCatDef = stage.rewardCatUnlockId
    ? CAT_DEFINITIONS.find((c) => c.id === stage.rewardCatUnlockId)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md max-h-[94dvh] sm:max-h-[88vh] bg-stone-900 border-3 sm:border-4 border-amber-400 rounded-2xl p-3.5 sm:p-5 text-center text-white shadow-[0_0_40px_rgba(0,0,0,0.9)] flex flex-col items-center overflow-hidden">
        {/* Scrollable Content Container */}
        <div className="w-full flex-1 min-h-0 overflow-y-auto px-1 py-1 flex flex-col items-center">
          {/* Banner */}
          {isVictory ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-stone-950 mb-1.5 sm:mb-2 border-2 border-white shadow-lg animate-bounce">
                <Trophy size={28} className="sm:w-9 sm:h-9" />
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-yellow-300 tracking-wider font-['M_PLUS_Rounded_1c'] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                完全勝利！！
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 font-bold mt-0.5 sm:mt-1">
                {stage.jpName} を制覇した！
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-stone-800 flex items-center justify-center text-rose-500 mb-1.5 sm:mb-2 border-2 border-rose-600 shadow-lg">
                <Skull size={28} className="sm:w-9 sm:h-9" />
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-rose-500 tracking-wider font-['M_PLUS_Rounded_1c']">
                敗北…
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 font-bold mt-0.5 sm:mt-1">
                にゃんこ城が崩壊してしまった…！
              </p>
            </div>
          )}

          {/* Rewards Breakdown for Victory */}
          {isVictory && (
            <div className="w-full bg-stone-800/90 rounded-xl p-2.5 sm:p-4 my-2 sm:my-3 border border-stone-700 space-y-2 sm:space-y-2.5">
              <div className="flex justify-between items-center text-xs sm:text-sm font-bold border-b border-stone-700 pb-1.5">
                <span className="text-stone-400">獲得経験値 (XP)</span>
                <span className="text-emerald-400 font-black text-sm sm:text-base">+{xpEarned.toLocaleString()} XP</span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm font-bold border-b border-stone-700 pb-1.5">
                <span className="text-stone-400">獲得ネコ缶</span>
                <span className="text-amber-300 font-black text-sm sm:text-base">+{catFoodEarned} 缶</span>
              </div>

              {/* Character Unlock Reveal Banner */}
              {unlockedCatDef && (
                <div className="bg-gradient-to-r from-purple-900/90 via-fuchsia-900/90 to-purple-900/90 border-2 border-fuchsia-400 rounded-lg p-2 sm:p-2.5 text-center shadow-lg animate-pulse">
                  <div className="flex items-center justify-center gap-1 text-fuchsia-300 font-black text-xs sm:text-sm">
                    <Sparkles size={16} className="text-yellow-400" />
                    <span>新キャラクター解放報酬！</span>
                  </div>
                  <div className="text-sm sm:text-base font-black text-yellow-300 mt-0.5">
                    【{unlockedCatDef.forms[0].name}】を仲間にしたにゃ！
                  </div>
                  <div className="text-[11px] sm:text-xs text-purple-200 mt-0.5">
                    編成画面やパワーアップ画面から出撃・強化できるにゃ！
                  </div>
                </div>
              )}

              {/* Treasure Drop Reveal */}
              {treasureDropped ? (
                <div className="bg-gradient-to-r from-amber-950/80 to-yellow-950/80 border-2 border-yellow-400 rounded-lg p-2 sm:p-2.5 text-center animate-pulse">
                  <div className="flex items-center justify-center gap-1.5 text-yellow-300 font-black text-xs sm:text-sm">
                    <Award size={16} />
                    <span>お宝を発見したにゃ！</span>
                  </div>
                  <div className="text-sm sm:text-base font-black text-white mt-0.5">
                    【{treasureDropped.name}】（
                    {treasureDropped.quality === 'gold'
                      ? '最高！金のお宝'
                      : treasureDropped.quality === 'silver'
                      ? '銀のお宝'
                      : '銅のお宝'}
                    ）
                  </div>
                  <div className="text-[11px] sm:text-xs text-amber-200 mt-0.5">{treasureDropped.description}</div>
                </div>
              ) : (
                !unlockedCatDef && <div className="text-[11px] sm:text-xs text-stone-400">※ 今回はお宝を発見できなかったにゃ…</div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons (Always pinned at the bottom with safe padding) */}
        <div className="w-full flex flex-row gap-2 pt-2 border-t border-stone-800 shrink-0">
          {isVictory ? (
            <>
              <button
                id="btn-return-map"
                onClick={onReturnToMap}
                className="flex-1 py-2 sm:py-2.5 px-2 sm:px-4 rounded-xl bg-stone-800 hover:bg-stone-700 active:bg-stone-600 text-stone-200 font-black text-xs sm:text-sm border border-stone-600 transition-all flex items-center justify-center min-h-[40px]"
              >
                マップへ戻る
              </button>
              {hasNextStage && (
                <button
                  id="btn-next-stage"
                  onClick={onNextStage}
                  className="flex-1 py-2 sm:py-2.5 px-2 sm:px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:from-amber-600 active:to-yellow-500 text-stone-950 font-black text-xs sm:text-sm border-2 border-yellow-200 shadow-lg flex items-center justify-center gap-1 transition-all min-h-[40px]"
                >
                  <span>次のステージ</span>
                  <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                </button>
              )}
            </>
          ) : (
            <>
              <button
                id="btn-defeat-map"
                onClick={onReturnToMap}
                className="flex-1 py-2 sm:py-2.5 px-2 sm:px-4 rounded-xl bg-stone-800 hover:bg-stone-700 active:bg-stone-600 text-stone-200 font-black text-xs sm:text-sm border border-stone-600 transition-all flex items-center justify-center min-h-[40px]"
              >
                マップへ戻る
              </button>
              <button
                id="btn-retry-stage"
                onClick={onRetry}
                className="flex-1 py-2 sm:py-2.5 px-2 sm:px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-black text-xs sm:text-sm border border-rose-400 shadow-lg flex items-center justify-center gap-1 transition-all min-h-[40px]"
              >
                <RotateCcw size={14} className="sm:w-4 sm:h-4" />
                <span>もう一度挑む</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
