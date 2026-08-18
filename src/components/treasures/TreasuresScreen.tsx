import React, { useState } from 'react';
import { PlayerProfile, TreasureQuality } from '../../types';
import { CHAPTERS, TREASURES } from '../../data/stages';
import { ArrowLeft, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import { audio } from '../../utils/audio';

interface TreasuresScreenProps {
  profile: PlayerProfile;
  onBack: () => void;
}

export const TreasuresScreen: React.FC<TreasuresScreenProps> = ({ profile, onBack }) => {
  const [selectedChapterId, setSelectedChapterId] = useState<'japan' | 'future' | 'cosmos'>('japan');

  const currentChapter = CHAPTERS.find((c) => c.id === selectedChapterId) || CHAPTERS[0];

  // Calculate cumulative buff percentages
  let totalMoneyRateBuff = 0;
  let totalMoneyCapBuff = 0;
  let totalCatHpBuff = 0;
  let totalCatAtkBuff = 0;
  let totalCannonPowerBuff = 0;
  let totalCannonChargeBuff = 0;

  Object.entries(profile.treasures || {}).forEach(([stageId, quality]) => {
    const tr = TREASURES[stageId];
    if (tr && quality !== 'none') {
      const qMult = quality === 'gold' ? 1.0 : quality === 'silver' ? 0.7 : 0.4;
      const val = Math.round(tr.buffValue * qMult * 100);
      if (tr.buffType === 'money_rate') totalMoneyRateBuff += val;
      if (tr.buffType === 'money_cap') totalMoneyCapBuff += val;
      if (tr.buffType === 'cat_hp') totalCatHpBuff += val;
      if (tr.buffType === 'cat_atk') totalCatAtkBuff += val;
      if (tr.buffType === 'cannon_power') totalCannonPowerBuff += val;
      if (tr.buffType === 'cannon_charge') totalCannonChargeBuff += val;
    }
  });

  return (
    <div className="flex flex-col h-full min-h-0 bg-stone-950 text-white select-none font-['M_PLUS_Rounded_1c'] overflow-hidden">
      {/* Top Header */}
      <div className="bg-stone-900 border-b border-stone-800 px-3 sm:px-4 pt-[max(0.5rem,env(safe-area-inset-top,0px))] pb-2.5 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <button
            id="btn-treasures-back"
            onClick={() => {
              audio.playClick();
              onBack();
            }}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-base sm:text-lg font-black text-amber-300">お宝コレクション・発動効果</h2>
        </div>
      </div>

      {/* Cumulative Buffs Summary Bar */}
      <div className="bg-stone-900/90 border-b border-stone-800 p-3 px-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
        <div className="bg-stone-800/80 p-2 rounded-xl border border-stone-700">
          <div className="text-stone-400 font-bold">資金生産速度</div>
          <div className="text-amber-300 font-black text-sm mt-0.5">+{totalMoneyRateBuff}%</div>
        </div>
        <div className="bg-stone-800/80 p-2 rounded-xl border border-stone-700">
          <div className="text-stone-400 font-bold">最大所持金上限</div>
          <div className="text-amber-300 font-black text-sm mt-0.5">+{totalMoneyCapBuff}%</div>
        </div>
        <div className="bg-stone-800/80 p-2 rounded-xl border border-stone-700">
          <div className="text-stone-400 font-bold">全にゃんこ体力</div>
          <div className="text-emerald-300 font-black text-sm mt-0.5">+{totalCatHpBuff}%</div>
        </div>
        <div className="bg-stone-800/80 p-2 rounded-xl border border-stone-700">
          <div className="text-stone-400 font-bold">全にゃんこ攻撃力</div>
          <div className="text-rose-300 font-black text-sm mt-0.5">+{totalCatAtkBuff}%</div>
        </div>
        <div className="bg-stone-800/80 p-2 rounded-xl border border-stone-700">
          <div className="text-stone-400 font-bold">にゃんこ砲攻撃力</div>
          <div className="text-sky-300 font-black text-sm mt-0.5">+{totalCannonPowerBuff}%</div>
        </div>
        <div className="bg-stone-800/80 p-2 rounded-xl border border-stone-700">
          <div className="text-stone-400 font-bold">砲チャージ速度</div>
          <div className="text-purple-300 font-black text-sm mt-0.5">+{totalCannonChargeBuff}%</div>
        </div>
      </div>

      {/* Chapter Filter Tabs */}
      <div className="flex bg-stone-900 border-b border-stone-800 px-4 gap-2 py-2">
        {CHAPTERS.map((ch) => (
          <button
            key={ch.id}
            id={`tab-treasure-chapter-${ch.id}`}
            onClick={() => {
              audio.playClick();
              setSelectedChapterId(ch.id);
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
              selectedChapterId === ch.id
                ? 'bg-amber-600 text-white shadow'
                : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
            }`}
          >
            {ch.name}のお宝
          </button>
        ))}
      </div>

      {/* Treasures List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {currentChapter.stages.map((st) => {
          const tr = TREASURES[st.id];
          if (!tr) return null;

          const quality = profile.treasures[st.id] || 'none';
          const isGold = quality === 'gold';
          const isSilver = quality === 'silver';
          const isBronze = quality === 'bronze';
          const hasTreasure = quality !== 'none';

          return (
            <div
              key={st.id}
              className={`p-4 rounded-2xl border-2 flex items-start justify-between transition-all ${
                isGold
                  ? 'bg-gradient-to-br from-amber-950/80 to-stone-900 border-yellow-400 shadow-lg'
                  : isSilver
                  ? 'bg-gradient-to-br from-slate-900 to-stone-900 border-slate-400'
                  : isBronze
                  ? 'bg-gradient-to-br from-amber-950/30 to-stone-900 border-amber-700'
                  : 'bg-stone-900/60 border-stone-800 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 ${
                    isGold
                      ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 border-yellow-100 text-stone-950 shadow'
                      : isSilver
                      ? 'bg-slate-300 border-white text-stone-900'
                      : isBronze
                      ? 'bg-amber-700 border-amber-500 text-amber-100'
                      : 'bg-stone-800 border-stone-700 text-stone-600'
                  }`}
                >
                  <Award size={20} />
                </div>
                <div>
                  <div className="text-[10px] text-amber-400 font-black">
                    {st.name} ({st.jpName})
                  </div>
                  <h4 className="text-sm font-black text-white">{tr.name}</h4>
                  <p className="text-xs text-stone-300 mt-1">{tr.effectDescription}</p>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    isGold
                      ? 'bg-yellow-400 text-stone-950 border-yellow-200 shadow'
                      : isSilver
                      ? 'bg-slate-300 text-stone-950 border-white'
                      : isBronze
                      ? 'bg-amber-700 text-white border-amber-500'
                      : 'bg-stone-800 text-stone-500 border-stone-700'
                  }`}
                >
                  {isGold ? '金のお宝' : isSilver ? '銀のお宝' : isBronze ? '銅のお宝' : '未獲得'}
                </span>
                {!hasTreasure && (
                  <span className="text-[9px] text-stone-500 mt-1 font-mono">周回して入手</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
