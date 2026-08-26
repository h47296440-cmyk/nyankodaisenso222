import React from 'react';
import { X, Trophy, Clock, Coins, Swords, Users, Skull, Sparkles, Award, ShieldCheck, Flame } from 'lucide-react';
import { PlayerProfile } from '../../types';
import { calculateUserRank } from '../../utils/storage';
import { audio } from '../../utils/audio';

interface PlayerRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
}

export const PlayerRecordsModal: React.FC<PlayerRecordsModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  if (!isOpen) return null;

  // Calculate stats formatting safely with fallback values
  const totalSeconds = profile.stats?.playTimeSeconds || 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const formattedPlayTime = `${hours}時間 ${minutes}分 ${seconds}秒`;

  const totalStagesCleared = Object.values(profile.clearedStages || {}).filter(Boolean).length;
  const totalTreasures = Object.values(profile.treasures || {}).filter((t) => t === 'gold').length;
  const totalCatsUnlocked = Object.values(profile.cats || {}).filter((c: any) => c && c.unlocked).length;
  const userRank = calculateUserRank(profile);

  const battlesFought = profile.stats?.totalBattles || 0;
  const battlesWon = profile.stats?.totalVictories || 0;
  const winRate = battlesFought > 0 ? Math.round((battlesWon / battlesFought) * 100) : 0;

  const statCards = [
    {
      id: 'user_rank',
      label: 'ユーザーランク',
      value: `${userRank} UR`,
      subtext: '育成や進化でランクアップ！',
      icon: <Trophy className="text-yellow-400" size={24} />,
      bg: 'from-amber-950/80 to-yellow-950/80 border-yellow-500/50',
    },
    {
      id: 'play_time',
      label: '総プレイ時間',
      value: formattedPlayTime,
      subtext: 'にゃんこと共に歩んだ時間',
      icon: <Clock className="text-cyan-400" size={24} />,
      bg: 'from-cyan-950/80 to-blue-950/80 border-cyan-500/50',
    },
    {
      id: 'money_spent',
      label: '使ったお金の総額 (戦闘中)',
      value: `¥${(profile.stats?.totalMoneySpent || 0).toLocaleString()} 円`,
      subtext: '戦闘中に生産投入した全軍費',
      icon: <Coins className="text-amber-400" size={24} />,
      bg: 'from-amber-950/80 to-orange-950/80 border-amber-500/50',
    },
    {
      id: 'cats_spawned',
      label: '生産したにゃんこ総数',
      value: `${(profile.stats?.totalCatsSpawned || 0).toLocaleString()} 体`,
      subtext: '出陣させた頼もしき仲間たち',
      icon: <Users className="text-emerald-400" size={24} />,
      bg: 'from-emerald-950/80 to-teal-950/80 border-emerald-500/50',
    },
    {
      id: 'battles_count',
      label: '総出撃回数',
      value: `${battlesFought.toLocaleString()} 回`,
      subtext: `勝利数: ${battlesWon.toLocaleString()} 回 (勝率 ${winRate}%)`,
      icon: <Swords className="text-rose-400" size={24} />,
      bg: 'from-rose-950/80 to-red-950/80 border-rose-500/50',
    },
    {
      id: 'enemies_defeated',
      label: '撃破した敵の総数',
      value: `${(profile.stats?.totalEnemiesDefeated || 0).toLocaleString()} 体`,
      subtext: '吹き飛ばした強敵たちの数',
      icon: <Skull className="text-purple-400" size={24} />,
      bg: 'from-purple-950/80 to-indigo-950/80 border-purple-500/50',
    },
    {
      id: 'cat_food_used',
      label: '消費したネコカン総数',
      value: `${(profile.stats?.totalCatFoodUsed || 0).toLocaleString()} 缶`,
      subtext: 'ガチャやアイテムに使った缶',
      icon: <Sparkles className="text-yellow-300" size={24} />,
      bg: 'from-yellow-950/80 to-stone-900 border-yellow-400/50',
    },
    {
      id: 'cats_unlocked',
      label: '仲間になったにゃんこ',
      value: `${totalCatsUnlocked} 体`,
      subtext: '収集したキャラクター数',
      icon: <Award className="text-sky-400" size={24} />,
      bg: 'from-sky-950/80 to-blue-950/80 border-sky-500/50',
    },
    {
      id: 'gold_treasures',
      label: '獲得した最高のお宝 (金)',
      value: `${totalTreasures} 個`,
      subtext: '世界各地で集めた至高の秘宝',
      icon: <ShieldCheck className="text-amber-300" size={24} />,
      bg: 'from-amber-900/80 to-stone-900 border-amber-400/50',
    },
    {
      id: 'stages_cleared',
      label: '制覇したステージ総数',
      value: `${totalStagesCleared} ステージ`,
      subtext: 'クリア済みの戦場',
      icon: <Flame className="text-orange-400" size={24} />,
      bg: 'from-orange-950/80 to-stone-900 border-orange-500/50',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        id="modal-player-records"
        className="relative w-full max-w-4xl max-h-[92vh] bg-gradient-to-b from-[#251912] via-[#1a110a] to-[#0c0806] border-4 border-[#e69500] rounded-3xl shadow-[0_0_40px_rgba(230,149,0,0.5)] flex flex-col overflow-hidden text-white font-['M_PLUS_Rounded_1c'] select-none"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#593418] via-[#7d481f] to-[#593418] border-b-4 border-[#3a200e] px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 border-2 border-yellow-200 shadow-md flex items-center justify-center text-stone-950">
              <Trophy size={24} />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-amber-200 tracking-wider flex items-center gap-2 drop-shadow">
                <span>にゃんこ 戦歴と記録</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-600/80 border border-yellow-300 text-yellow-100 font-bold">
                  RECORDS
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-amber-100/80 font-bold">
                あなたのこれまでの戦闘実績、プレイ時間、軍備支出などの全記録です
              </p>
            </div>
          </div>

          <button
            id="btn-close-player-records"
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-white border-2 border-stone-600 flex items-center justify-center transition-all shadow-md active:scale-95"
            title="閉じる"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {statCards.map((card) => (
              <div
                key={card.id}
                id={`record-card-${card.id}`}
                className={`p-4 rounded-2xl border-2 bg-gradient-to-br ${card.bg} shadow-lg flex flex-col justify-between transition-all hover:scale-[1.02]`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-black text-stone-300 tracking-wide">
                    {card.label}
                  </span>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/10 shrink-0">
                    {card.icon}
                  </div>
                </div>

                <div>
                  <div className="text-xl sm:text-2xl font-black text-white drop-shadow tracking-tight">
                    {card.value}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-stone-400 font-bold mt-0.5">
                    {card.subtext}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="bg-[#19110b] border-t-2 border-[#3d2716] px-4 py-3 sm:px-6 flex items-center justify-between">
          <div className="text-xs font-bold text-amber-300/80">
            🐾 毎回の戦闘終了時に自動で戦歴が記録・集計されます
          </div>
          <button
            id="btn-bottom-close-player-records"
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black text-xs sm:text-sm border-2 border-yellow-200 shadow-md active:scale-95 transition-all"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
