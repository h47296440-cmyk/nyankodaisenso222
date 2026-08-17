import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { PlayerProfile, CatDefinition, Rarity } from '../../types';
import { CAT_DEFINITIONS } from '../../data/units';
import { UnitSpriteRenderer } from '../battle/UnitSpriteRenderer';
import { ArrowLeft, Sparkles, Star, Award, Gift } from 'lucide-react';
import { audio } from '../../utils/audio';

interface GachaScreenProps {
  profile: PlayerProfile;
  onUpdateProfile: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
  onBack: () => void;
}

interface GachaResultItem {
  cat: CatDefinition;
  isNew: boolean;
  xpBonus: number;
}

export const GachaScreen: React.FC<GachaScreenProps> = ({
  profile,
  onUpdateProfile,
  onBack,
}) => {
  const [isRolling, setIsRolling] = useState(false);
  const [gachaResults, setGachaResults] = useState<GachaResultItem[] | null>(null);

  // Gacha probability weights:
  // Rare: 65%, Super Rare: 25%, Uber Rare: 10%
  const performSingleRoll = (guaranteeUber: boolean = false): GachaResultItem => {
    let rarity: Rarity = 'rare';
    const rand = Math.random();

    if (guaranteeUber) {
      rarity = 'uber_rare';
    } else if (rand < 0.12) {
      rarity = 'uber_rare';
    } else if (rand < 0.38) {
      rarity = 'super_rare';
    } else {
      rarity = 'rare';
    }

    const eligibleCats = CAT_DEFINITIONS.filter((c) => c.rarity === rarity);
    const selectedCat = eligibleCats[Math.floor(Math.random() * eligibleCats.length)] || CAT_DEFINITIONS[0];

    const isAlreadyUnlocked = !!profile.cats[selectedCat.id]?.unlocked;
    const xpBonus = isAlreadyUnlocked
      ? rarity === 'uber_rare'
        ? 15000
        : rarity === 'super_rare'
        ? 6000
        : 2000
      : 0;

    return {
      cat: selectedCat,
      isNew: !isAlreadyUnlocked,
      xpBonus,
    };
  };

  const handleRoll = (count: number) => {
    const cost = count === 1 ? 150 : 1500;
    if (profile.catFood < cost || isRolling) return;

    audio.playClick();
    setIsRolling(true);

    const results: GachaResultItem[] = [];
    for (let i = 0; i < count; i++) {
      const isGuaranteedUber = count === 11 && i === count - 1;
      results.push(performSingleRoll(isGuaranteedUber));
    }

    // Deduct cat food and update profile with unlocked cats / XP bonuses
    setTimeout(() => {
      setIsRolling(false);
      setGachaResults(results);

      const hasUber = results.some((r) => r.cat.rarity === 'uber_rare');
      audio.playGachaReveal(hasUber);

      if (hasUber) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
        });
      }

      onUpdateProfile((prev) => {
        const nextCats = { ...prev.cats };
        let totalXpBonus = 0;

        results.forEach((r) => {
          totalXpBonus += r.xpBonus;
          if (r.isNew) {
            nextCats[r.cat.id] = {
              catId: r.cat.id,
              level: 1,
              unlocked: true,
              activeForm: 0,
            };
          }
        });

        return {
          ...prev,
          catFood: prev.catFood - cost,
          xp: prev.xp + totalXpBonus,
          cats: nextCats,
        };
      });
    }, 1200);
  };

  // Free daily bonus Cat Food gift
  const handleClaimFreeCatFood = () => {
    audio.playVictory();
    onUpdateProfile((prev) => ({
      ...prev,
      catFood: prev.catFood + 150,
    }));
    alert('無料ネコ缶 +150缶 をプレゼントしたにゃ！');
  };

  return (
    <div className="flex flex-col h-full bg-stone-950 text-white select-none font-['M_PLUS_Rounded_1c']">
      {/* Top Header */}
      <div className="bg-stone-900 border-b border-stone-800 px-4 py-2.5 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <button
            id="btn-gacha-back"
            onClick={() => {
              audio.playClick();
              onBack();
            }}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-base sm:text-lg font-black text-amber-300">にゃんこレアガチャ</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-claim-free-catfood"
            onClick={handleClaimFreeCatFood}
            className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-black px-2.5 py-1 rounded-full border border-pink-300 flex items-center gap-1 shadow animate-bounce"
          >
            <Gift size={13} />
            <span>ネコ缶無料受取</span>
          </button>
          <div className="bg-stone-800 border border-amber-500/50 px-3 py-1 rounded-full text-amber-300 font-black text-xs">
            <span className="text-[10px] text-amber-400 mr-1">所持ネコ缶</span>
            <span className="text-sm">{profile.catFood}</span>
          </div>
        </div>
      </div>

      {/* Main Banner */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col items-center justify-between max-w-4xl mx-auto w-full">
        {/* Banner Art Card */}
        <div className="w-full bg-gradient-to-r from-purple-950 via-indigo-900 to-amber-950 border-4 border-amber-400 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-center flex flex-col items-center">
          <div className="absolute top-2 right-4 bg-red-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full border border-yellow-300 animate-pulse">
            超激レア確率UP中！
          </div>

          <div className="text-xs sm:text-sm font-black text-amber-300 tracking-widest uppercase mb-1">
            ★ 超古代勇者 ＆ 伝説の破壊神フェス ★
          </div>
          <h3 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 drop-shadow">
            超激ダイナマイツ！レアガチャ
          </h3>
          <p className="text-xs text-stone-300 mt-2 max-w-md">
            「かさじぞう」「狂乱のネコムート」「ネコヴァルキリー」「皇獣ガオウ」など、最強クラスの範囲攻撃キャラクターが多数参戦！
          </p>

          {/* Featured characters showcase */}
          <div className="flex justify-center items-center gap-6 my-6">
            <div className="flex flex-col items-center">
              <UnitSpriteRenderer spriteType="cat_jizo" isCat={true} state="walk" animTimer={1} scale={1.1} />
              <span className="text-[10px] font-black text-amber-300 mt-1">かさじぞう</span>
            </div>
            <div className="flex flex-col items-center">
              <UnitSpriteRenderer spriteType="cat_bahamut" isCat={true} state="walk" animTimer={1} scale={1.25} />
              <span className="text-[10px] font-black text-purple-300 mt-1">狂乱のネコムート</span>
            </div>
            <div className="flex flex-col items-center">
              <UnitSpriteRenderer spriteType="cat_valkyrie" isCat={true} state="walk" animTimer={1} scale={1.15} />
              <span className="text-[10px] font-black text-cyan-300 mt-1">ネコヴァルキリー</span>
            </div>
          </div>
        </div>

        {/* Rolling Capsule Animation Overlay */}
        {isRolling && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-4 border-white shadow-[0_0_50px_rgba(253,224,71,0.9)] animate-spin flex items-center justify-center">
              <Sparkles size={48} className="text-stone-900 animate-pulse" />
            </div>
            <div className="text-xl font-black text-yellow-300 mt-6 tracking-widest animate-bounce">
              カプセル開封中…！！
            </div>
          </div>
        )}

        {/* Gacha Results Modal */}
        {gachaResults && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-stone-900 border-4 border-amber-400 rounded-3xl p-6 flex flex-col items-center shadow-2xl">
              <h3 className="text-2xl font-black text-yellow-300 mb-4 flex items-center gap-2">
                <Sparkles size={24} /> ガチャ結果発表！
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full max-h-[60vh] overflow-y-auto p-2">
                {gachaResults.map((res, i) => {
                  const form = res.cat.forms[0];
                  const isUber = res.cat.rarity === 'uber_rare';
                  const isSuper = res.cat.rarity === 'super_rare';

                  return (
                    <div
                      key={i}
                      className={`p-3 rounded-2xl border-2 flex flex-col items-center text-center relative ${
                        isUber
                          ? 'bg-gradient-to-b from-purple-950 to-stone-900 border-purple-400 shadow-lg scale-105'
                          : isSuper
                          ? 'bg-gradient-to-b from-amber-950 to-stone-900 border-yellow-400'
                          : 'bg-stone-800 border-stone-700'
                      }`}
                    >
                      {res.isNew ? (
                        <span className="absolute -top-2 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-yellow-200">
                          NEW!
                        </span>
                      ) : (
                        <span className="absolute -top-2 bg-emerald-700 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                          XP +{res.xpBonus}
                        </span>
                      )}

                      <div className="my-2">
                        <UnitSpriteRenderer
                          spriteType={form.spriteType}
                          isCat={true}
                          state="walk"
                          animTimer={0.5}
                          scale={0.85}
                        />
                      </div>

                      <div className="text-xs font-black text-white truncate w-full">{form.name}</div>
                      <div className="text-[9px] font-black text-amber-300 uppercase mt-0.5">
                        {res.cat.rarity.replace('_', ' ')}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                id="btn-close-gacha-result"
                onClick={() => setGachaResults(null)}
                className="mt-6 py-2.5 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 font-black text-sm border-2 border-yellow-200 shadow-lg active:scale-95"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-4 mt-6">
          {/* 1x Roll */}
          <button
            id="btn-gacha-roll-1"
            disabled={profile.catFood < 150}
            onClick={() => handleRoll(1)}
            className={`flex-1 py-4 rounded-2xl border-2 flex flex-col items-center justify-center font-black transition-all ${
              profile.catFood >= 150
                ? 'bg-stone-900 hover:bg-stone-800 border-amber-400 text-white shadow-lg active:scale-95'
                : 'bg-stone-900 border-stone-800 text-stone-600 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="text-sm font-black text-amber-300">1回ガチャを引く</div>
            <div className="text-xs text-stone-300 mt-1">ネコ缶 150缶</div>
          </button>

          {/* 11x Roll with Guaranteed Uber */}
          <button
            id="btn-gacha-roll-11"
            disabled={profile.catFood < 1500}
            onClick={() => handleRoll(11)}
            className={`flex-1 py-4 rounded-2xl border-2 flex flex-col items-center justify-center font-black transition-all ${
              profile.catFood >= 1500
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 border-yellow-100 text-stone-950 shadow-xl active:scale-95'
                : 'bg-stone-900 border-stone-800 text-stone-600 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="text-sm sm:text-base font-black">11連続ガチャ（超激レア確定！）</div>
            <div className="text-xs text-stone-900 font-bold mt-1">ネコ缶 1500缶</div>
          </button>
        </div>
      </div>
    </div>
  );
};
