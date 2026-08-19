import React from 'react';
import { PlayerProfile } from '../../types';
import { calculateUserRank } from '../../utils/storage';
import { audio } from '../../utils/audio';
import { X, Award, CheckCircle } from 'lucide-react';

interface UserRankRewardsModalProps {
  isOpen: boolean;
  profile: PlayerProfile;
  onClose: () => void;
  onUpdateProfile: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
}

interface RankRewardTier {
  rankRequired: number;
  title: string;
  rewardType: 'xp' | 'catFood' | 'items';
  rewardLabel: string;
  xpAmount?: number;
  catFoodAmount?: number;
}

const RANK_TIERS: RankRewardTier[] = [
  { rankRequired: 15, title: '初陣のにゃんこ軍団', rewardType: 'xp', rewardLabel: '経験値 +5,000 XP', xpAmount: 5000 },
  { rankRequired: 30, title: '育成の心得', rewardType: 'catFood', rewardLabel: 'ネコカン +50 缶', catFoodAmount: 50 },
  { rankRequired: 50, title: '侵略部隊の成長', rewardType: 'xp', rewardLabel: '経験値 +20,000 XP', xpAmount: 20000 },
  { rankRequired: 80, title: '全国侵略の立役者', rewardType: 'catFood', rewardLabel: 'ネコカン +150 缶（レアガチャ1回）', catFoodAmount: 150 },
  { rankRequired: 120, title: '精鋭にゃんこ部隊', rewardType: 'xp', rewardLabel: '経験値 +50,000 XP', xpAmount: 50000 },
  { rankRequired: 160, title: '大宇宙遠征軍', rewardType: 'catFood', rewardLabel: 'ネコカン +300 缶（レアガチャ2回）', catFoodAmount: 300 },
  { rankRequired: 200, title: '百戦錬磨のにゃんこ', rewardType: 'xp', rewardLabel: '経験値 +100,000 XP', xpAmount: 100000 },
  { rankRequired: 300, title: '超・にゃんこ大将軍', rewardType: 'catFood', rewardLabel: 'ネコカン +750 缶（11連ガチャ分！）', catFoodAmount: 750 },
  { rankRequired: 500, title: '神話の頂点', rewardType: 'xp', rewardLabel: '経験値 +500,000 XP', xpAmount: 500000 },
];

export const UserRankRewardsModal: React.FC<UserRankRewardsModalProps> = ({
  isOpen,
  profile,
  onClose,
  onUpdateProfile,
}) => {
  if (!isOpen) return null;

  const currentRank = calculateUserRank(profile);
  // Claimed ranks can be tracked in clearedStages or dev flags
  const claimedRanks: Record<number, boolean> = (profile as any).claimedRankRewards || {};

  const handleClaimReward = (tier: RankRewardTier) => {
    if (currentRank < tier.rankRequired) {
      alert(`ユーザーランクが ${tier.rankRequired} に達すると受け取れます！`);
      return;
    }
    if (claimedRanks[tier.rankRequired]) {
      return;
    }

    audio.playVictory();
    onUpdateProfile((prev) => ({
      ...prev,
      xp: prev.xp + (tier.xpAmount || 0),
      catFood: prev.catFood + (tier.catFoodAmount || 0),
      claimedRankRewards: {
        ...((prev as any).claimedRankRewards || {}),
        [tier.rankRequired]: true,
      },
    } as any));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-stone-900 border-4 border-amber-500 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-800 via-yellow-700 to-amber-900 p-4 border-b-2 border-amber-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-300" />
            <div>
              <h2 className="text-lg font-black text-white">🏆 ユーザーランク報酬</h2>
              <p className="text-[11px] text-amber-200">ユーザーランク＝全キャラとお城強化の合計レベル！</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Rank Display */}
        <div className="bg-stone-950 px-6 py-3 flex items-center justify-between border-b border-stone-800">
          <div className="text-sm font-bold text-stone-300">現在のユーザーランク:</div>
          <div className="flex items-center gap-2">
            <span
              className="text-2xl font-black text-yellow-400 tracking-widest"
              style={{ fontFamily: '"Courier New", monospace' }}
            >
              {currentRank}
            </span>
            <span className="text-xs text-stone-400 font-bold">Rank</span>
          </div>
        </div>

        {/* Reward Tiers List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {RANK_TIERS.map((tier) => {
            const isReached = currentRank >= tier.rankRequired;
            const isClaimed = !!claimedRanks[tier.rankRequired];

            return (
              <div
                key={tier.rankRequired}
                className={`p-3 rounded-2xl border-2 flex items-center justify-between transition-all ${
                  isClaimed
                    ? 'bg-stone-900/60 border-stone-800 opacity-60'
                    : isReached
                    ? 'bg-amber-950/70 border-yellow-400 ring-2 ring-yellow-400/30'
                    : 'bg-stone-850 border-stone-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-black/60 border border-amber-600/50 flex flex-col items-center justify-center">
                    <span className="text-[9px] text-amber-400 font-black">RANK</span>
                    <span className="text-base text-yellow-300 font-black font-mono">{tier.rankRequired}</span>
                  </div>

                  <div>
                    <div className="text-xs font-black text-white">{tier.title}</div>
                    <div className="text-xs font-bold text-amber-300">{tier.rewardLabel}</div>
                  </div>
                </div>

                <div>
                  {isClaimed ? (
                    <div className="flex items-center gap-1 text-emerald-400 font-black text-xs px-3 py-1.5 bg-emerald-950/60 rounded-xl border border-emerald-800">
                      <CheckCircle className="w-4 h-4" />
                      <span>受取済</span>
                    </div>
                  ) : isReached ? (
                    <button
                      onClick={() => handleClaimReward(tier)}
                      className="bg-gradient-to-b from-yellow-400 to-amber-500 hover:brightness-110 text-stone-950 font-black text-xs px-4 py-2 rounded-xl shadow-lg border border-yellow-200 animate-bounce"
                    >
                      受取可能!!
                    </button>
                  ) : (
                    <div className="text-stone-500 font-black text-xs px-3 py-1.5 bg-stone-900 rounded-xl border border-stone-800">
                      あと {tier.rankRequired - currentRank}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-stone-950 p-3 text-center border-t border-stone-800">
          <button
            onClick={onClose}
            className="bg-stone-800 hover:bg-stone-700 text-white font-black text-sm px-6 py-2 rounded-xl"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
