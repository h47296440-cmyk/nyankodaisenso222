import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { StageDefinition, TreasureQuality } from '../../types';
import { TREASURES } from '../../data/stages';
import { Trophy, Skull, Sparkles, ArrowRight, RotateCcw, Award } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-stone-900 border-4 border-amber-400 rounded-2xl p-5 sm:p-6 text-center text-white shadow-[0_0_40px_rgba(0,0,0,0.9)] flex flex-col items-center">
        {/* Banner */}
        {isVictory ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-stone-950 mb-2 border-2 border-white shadow-lg animate-bounce">
              <Trophy size={36} />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-yellow-300 tracking-wider font-['M_PLUS_Rounded_1c'] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              完全勝利！！
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 font-bold mt-1">
              {stage.jpName} を制覇した！
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center text-rose-500 mb-2 border-2 border-rose-600 shadow-lg">
              <Skull size={36} />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-rose-500 tracking-wider font-['M_PLUS_Rounded_1c']">
              敗北…
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 font-bold mt-1">
              にゃんこ城が崩壊してしまった…！
            </p>
          </div>
        )}

        {/* Rewards Breakdown for Victory */}
        {isVictory && (
          <div className="w-full bg-stone-800/90 rounded-xl p-4 my-4 border border-stone-700 space-y-3">
            <div className="flex justify-between items-center text-sm font-bold border-b border-stone-700 pb-2">
              <span className="text-stone-400">獲得経験値 (XP)</span>
              <span className="text-emerald-400 font-black text-base">+{xpEarned.toLocaleString()} XP</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold border-b border-stone-700 pb-2">
              <span className="text-stone-400">獲得ネコ缶</span>
              <span className="text-amber-300 font-black text-base">+{catFoodEarned} 缶</span>
            </div>

            {/* Treasure Drop Reveal */}
            {treasureDropped ? (
              <div className="bg-gradient-to-r from-amber-950/80 to-yellow-950/80 border-2 border-yellow-400 rounded-lg p-3 text-center animate-pulse">
                <div className="flex items-center justify-center gap-1.5 text-yellow-300 font-black text-sm">
                  <Award size={18} />
                  <span>お宝を発見したにゃ！</span>
                </div>
                <div className="text-base font-black text-white mt-1">
                  【{treasureDropped.name}】（
                  {treasureDropped.quality === 'gold'
                    ? '最高！金のお宝'
                    : treasureDropped.quality === 'silver'
                    ? '銀のお宝'
                    : '銅のお宝'}
                  ）
                </div>
                <div className="text-xs text-amber-200 mt-0.5">{treasureDropped.description}</div>
              </div>
            ) : (
              <div className="text-xs text-stone-400">※ 今回はお宝を発見できなかったにゃ…</div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-2 mt-2">
          {isVictory ? (
            <>
              <button
                id="btn-return-map"
                onClick={onReturnToMap}
                className="flex-1 py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-black text-sm border border-stone-600 transition-all"
              >
                マップへ戻る
              </button>
              {hasNextStage && (
                <button
                  id="btn-next-stage"
                  onClick={onNextStage}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black text-sm border-2 border-yellow-200 shadow-lg flex items-center justify-center gap-1 transition-all"
                >
                  <span>次のステージ</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </>
          ) : (
            <>
              <button
                id="btn-defeat-map"
                onClick={onReturnToMap}
                className="flex-1 py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-black text-sm border border-stone-600 transition-all"
              >
                マップへ戻る
              </button>
              <button
                id="btn-retry-stage"
                onClick={onRetry}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm border border-rose-400 shadow-lg flex items-center justify-center gap-1 transition-all"
              >
                <RotateCcw size={16} />
                <span>もう一度挑む</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
