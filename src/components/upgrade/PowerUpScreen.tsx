import React, { useState } from 'react';
import { PlayerProfile, PlayerUpgrades } from '../../types';
import { CAT_DEFINITIONS } from '../../data/units';
import { getCatLevelUpCost, getBaseUpgradeCost } from '../../utils/storage';
import { UnitSpriteRenderer } from '../battle/UnitSpriteRenderer';
import { audio } from '../../utils/audio';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { ItemShopModal } from '../base/ItemShopModal';

interface PowerUpScreenProps {
  profile: PlayerProfile;
  onUpdateProfile: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
  onBack: () => void;
}

type PowerUpCategory = 'character' | 'base_skills' | 'ex_character';

export const PowerUpScreen: React.FC<PowerUpScreenProps> = ({
  profile,
  onUpdateProfile,
  onBack,
}) => {
  const [category, setCategory] = useState<PowerUpCategory>('character');
  const [selectedCatId, setSelectedCatId] = useState<string>('cat_basic');
  const [selectedBaseSkill, setSelectedBaseSkill] = useState<keyof PlayerUpgrades>('workerCatRate');
  const [showItemShop, setShowItemShop] = useState(false);

  const isInfiniteXp = !!profile.devMode?.infiniteXp;
  const isInfiniteCatFood = !!profile.devMode?.infiniteCatFood;
  const displayXp = isInfiniteXp ? 99999999 : profile.xp;
  const displayCatFood = isInfiniteCatFood ? 99999 : profile.catFood;

  // Currently selected cat definition & progress
  const selectedCatDef = CAT_DEFINITIONS.find((c) => c.id === selectedCatId) || CAT_DEFINITIONS[0];
  const catProgress = profile.cats[selectedCatId] || {
    catId: selectedCatId,
    level: 1,
    unlocked: false,
    activeForm: 0,
  };
  const hasClearedAncientPower = !!profile.clearedStages?.['legend_21_2'] || !!profile.clearedStages?.['real_legend_1_1'];
  const hasUnlockedLv30 = !!profile.hasClearedFilibuster && hasClearedAncientPower;
  const baseMaxLevel = hasUnlockedLv30 ? 30 : profile.hasClearedFilibuster ? 25 : 20;
  const catMaxLevel = Math.max(baseMaxLevel, catProgress.maxLevelUnlocked || baseMaxLevel);
  const maxLevel = Math.min(40, catMaxLevel);
  const currentForm = selectedCatDef.forms[catProgress.activeForm || 0] || selectedCatDef.forms[0];
  const catLevelCost = getCatLevelUpCost(selectedCatDef.rarity, catProgress.level);
  const canLevelUpCat =
    catProgress.unlocked && (isInfiniteXp || profile.xp >= catLevelCost) && catProgress.level < maxLevel;
  const canUseCatseye = catProgress.unlocked && catProgress.level >= 30 && maxLevel < 40;

  // Catseye use handler
  const handleUseCatseye = () => {
    if (!canUseCatseye) {
      if (catProgress.level < 30) {
        alert('キャッツアイは Lv.30 に到達したキャラクターにのみ使用できるにゃ！');
      } else if (maxLevel >= 40) {
        alert('このキャラクターは既にキャッツアイで最大上限(Lv.40)まで解放済みだにゃ！');
      }
      return;
    }

    const rarityKey = selectedCatDef.rarity;
    const catseyeCount = (profile.catseyes?.[rarityKey] || 0) + (profile.catseyes?.['all'] || 0);

    if (!isInfiniteXp && catseyeCount <= 0) {
      alert(`【キャッツアイ不足】\n${selectedCatDef.rarity.toUpperCase()} または共通のキャッツアイがありません！\nキャッツアイステージをクリアして手に入れてにゃ！`);
      return;
    }

    audio.playVictory();
    onUpdateProfile((prev) => {
      const cur = prev.cats[selectedCatId] || { catId: selectedCatId, level: 30, unlocked: true, activeForm: 0 };
      const nextMax = Math.min(40, (cur.maxLevelUnlocked || 30) + 1);
      
      let updatedCatseyes = { ...(prev.catseyes || {}) };
      if (!isInfiniteXp) {
        if ((updatedCatseyes[rarityKey] || 0) > 0) {
          updatedCatseyes[rarityKey] = Math.max(0, updatedCatseyes[rarityKey] - 1);
        } else if ((updatedCatseyes['all'] || 0) > 0) {
          updatedCatseyes['all'] = Math.max(0, updatedCatseyes['all'] - 1);
        }
      }

      return {
        ...prev,
        catseyes: updatedCatseyes,
        cats: {
          ...prev.cats,
          [selectedCatId]: {
            ...cur,
            maxLevelUnlocked: nextMax,
          },
        },
      };
    });
  };

  // True form (第3形態) Evolution Handler
  const handleEvolveTrueForm = () => {
    if (selectedCatDef.forms.length < 3) {
      alert('このキャラクターには第3形態が存在しないにゃ！');
      return;
    }
    if (catProgress.level < 30) {
      alert('第3形態への進化には Lv.30 が必要だにゃ！');
      return;
    }

    // Check Catfruit requirement or Manic stage requirement
    const isManicUnit = selectedCatId.startsWith('cat_crazed_');
    const requiredManicStageId = selectedCatDef.requiredStageId || '';
    const hasClearedManicStage = !!profile.clearedStages?.[requiredManicStageId];

    const rainbowFruit: number = profile.catfruits?.['rainbow'] ?? 0;
    const totalFruit: number = Object.values(profile.catfruits || {}).reduce<number>((a, b) => a + (Number(b) || 0), 0);
    const hasEnoughFruit: boolean = rainbowFruit >= 1 || totalFruit >= 5;

    if (!isInfiniteXp && !hasClearedManicStage && !hasEnoughFruit) {
      alert(
        `【進化素材不足】\n第3形態への進化には以下が必要です：\n` +
        `・大狂乱ステージクリア または\n` +
        `・マタタビ（虹のマタタビ×1 または マタタビ×5）\n\n` +
        `マタタビステージまたは大狂乱ステージで入手してにゃ！`
      );
      return;
    }

    audio.playVictory();
    onUpdateProfile((prev) => {
      const cur = prev.cats[selectedCatId] || { catId: selectedCatId, level: 30, unlocked: true, activeForm: 0 };
      
      // Deduct catfruit if user didn't clear the manic stage (or consume 1 rainbow fruit)
      let updatedCatfruits = { ...(prev.catfruits || {}) };
      if (!isInfiniteXp && !hasClearedManicStage) {
        if ((updatedCatfruits['rainbow'] || 0) >= 1) {
          updatedCatfruits['rainbow'] -= 1;
        } else {
          // Consume 5 of any fruits
          let toConsume = 5;
          for (const key of Object.keys(updatedCatfruits)) {
            if (updatedCatfruits[key] > 0) {
              const take = Math.min(toConsume, updatedCatfruits[key]);
              updatedCatfruits[key] -= take;
              toConsume -= take;
              if (toConsume <= 0) break;
            }
          }
        }
      }

      return {
        ...prev,
        catfruits: updatedCatfruits,
        unlockedTrueForms: {
          ...prev.unlockedTrueForms,
          [selectedCatId]: true,
        },
        cats: {
          ...prev.cats,
          [selectedCatId]: {
            ...cur,
            activeForm: 2, // 3rd Form!
          },
        },
      };
    });
  };

  // Base upgrades list
  const baseSkills: { key: keyof PlayerUpgrades; name: string; desc: string; icon: string }[] = [
    { key: 'workerCatRate', name: '働きネコ仕事効率', desc: '戦闘中の資金生産スピードがアップする基本能力！', icon: '💰' },
    { key: 'workerCatWallet', name: '働きネコお財布', desc: '戦闘中の最大所持金上限がアップして高額キャラが出撃可能に！', icon: '👛' },
    { key: 'cannonPower', name: 'にゃんこ砲攻撃力', desc: 'にゃんこ砲の発射ダメージが増加！大群を一撃で殲滅！', icon: '💥' },
    { key: 'cannonCharge', name: 'にゃんこ砲チャージ', desc: 'にゃんこ砲の装填時間が短縮されて連発可能に！', icon: '⚡' },
    { key: 'cannonRange', name: 'にゃんこ砲射程', desc: 'にゃんこ砲の攻撃範囲が遠くまで届くようになる！', icon: '🎯' },
    { key: 'castleHealth', name: 'お城体力', desc: 'にゃんこ城の最大耐久値がアップ！防衛力が強化！', icon: '🏰' },
    { key: 'researchSpeed', name: '研究力', desc: 'にゃんこの再生産クールダウンが短縮される！', icon: '🔬' },
    { key: 'accounting', name: '会計力', desc: '敵を倒した時に獲得できるお金の量が増加！', icon: '🪙' },
    { key: 'leadershipCap', name: '統率力上限', desc: '最大統率力（スタミナ）の上限が増加！', icon: '👑' },
  ];

  const currentBaseSkillLv = profile.upgrades[selectedBaseSkill] || 1;
  const baseSkillCost = getBaseUpgradeCost(currentBaseSkillLv);
  const canLevelUpBaseSkill =
    currentBaseSkillLv < 10 && (isInfiniteXp || profile.xp >= baseSkillCost);

  // Power Up action
  const handlePowerUpClick = () => {
    if (category === 'character' || category === 'ex_character') {
      if (!catProgress.unlocked) {
        // Check if unit is a stage drop / crazed reward
        if (selectedCatDef.unlockMethod === 'stage_reward') {
          const reqStageId = selectedCatDef.requiredStageId || '';
          const isCleared = !!profile.clearedStages?.[reqStageId];
          if (!isCleared) {
            alert(selectedCatDef.unlockHint || 'このキャラクターは降臨ステージクリア限定報酬だにゃ！');
            return;
          }
          // If stage was cleared, allow claiming
          audio.playVictory();
          onUpdateProfile((prev) => ({
            ...prev,
            cats: {
              ...prev.cats,
              [selectedCatId]: {
                catId: selectedCatId,
                level: 1,
                unlocked: true,
                activeForm: 0,
              },
            },
          }));
          return;
        }

        // Check if unit is gacha only
        if (selectedCatDef.unlockMethod === 'gacha' || (!selectedCatDef.unlockCostXp && !selectedCatDef.unlockedAtStart)) {
          alert(selectedCatDef.unlockHint || 'このキャラクターはレアガチャ限定だにゃ！ガチャ画面で入手してにゃ！');
          return;
        }

        // Unlock with XP
        const unlockCost = selectedCatDef.unlockCostXp;
        if (!unlockCost) {
          alert('このキャラクターはXPでは解放できないにゃ！');
          return;
        }
        if (!isInfiniteXp && profile.xp < unlockCost) {
          alert('経験値（XP）が足りないにゃ！');
          return;
        }
        audio.playVictory();
        onUpdateProfile((prev) => ({
          ...prev,
          xp: isInfiniteXp ? prev.xp : prev.xp - unlockCost,
          cats: {
            ...prev.cats,
            [selectedCatId]: {
              catId: selectedCatId,
              level: 1,
              unlocked: true,
              activeForm: 0,
            },
          },
        }));
        return;
      }

      if (!canLevelUpCat) {
        if (catProgress.level >= maxLevel) {
          alert(
            hasUnlockedLv30
              ? 'このキャラクターは既に最大レベル(Lv.30)だにゃ！'
              : profile.hasClearedFilibuster
              ? 'このキャラクターは現在Lv.25が上限だにゃ！レジェンド最終章「太古の力」をクリアするとLv.30まで解放されるにゃ！'
              : 'このキャラクターは現在Lv.20が上限だにゃ！宇宙編3章のフィリバスター撃破＆レジェンド最終章「太古の力」クリアでLv.30まで解放されるにゃ！'
          );
        } else {
          alert('経験値（XP）が足りないにゃ！');
        }
        return;
      }

      audio.playWorkerLevelUp();
      onUpdateProfile((prev) => {
        const cur = prev.cats[selectedCatId] || { catId: selectedCatId, level: 1, unlocked: true, activeForm: 0 };
        const nextLv = cur.level + 1;
        let nextForm = cur.activeForm;
        if (cur.level === 9 && nextLv === 10) nextForm = 1;
        if (cur.level === 29 && nextLv === 30 && selectedCatDef.forms.length >= 3) nextForm = 2; // 第3形態へ進化！
        return {
          ...prev,
          xp: isInfiniteXp ? prev.xp : prev.xp - catLevelCost,
          cats: {
            ...prev.cats,
            [selectedCatId]: {
              ...cur,
              level: nextLv,
              activeForm: nextForm,
            },
          },
        };
      });
    } else {
      // Base skill level up
      if (!canLevelUpBaseSkill) {
        if (currentBaseSkillLv >= 10) {
          alert('この基本能力は既に最大レベル(Lv.10)だにゃ！');
        } else {
          alert('経験値（XP）が足りないにゃ！');
        }
        return;
      }

      audio.playWorkerLevelUp();
      onUpdateProfile((prev) => ({
        ...prev,
        xp: isInfiniteXp ? prev.xp : prev.xp - baseSkillCost,
        upgrades: {
          ...prev.upgrades,
          [selectedBaseSkill]: currentBaseSkillLv + 1,
        },
      }));
    }
  };

  // Form toggle for evolved cats (第1形態 ⇄ 第2形態 ⇄ 第3形態)
  const handleToggleActiveForm = () => {
    const totalForms = selectedCatDef.forms.length;
    if (catProgress.level < 10) {
      alert('第2形態は Lv.10 以上にパワーアップすると解放されるにゃ！');
      return;
    }
    const maxAvailableForm = catProgress.level >= 30 && totalForms >= 3 ? totalForms : Math.min(2, totalForms);
    audio.playClick();
    onUpdateProfile((prev) => {
      const cur = prev.cats[selectedCatId];
      const nextActive = (cur.activeForm + 1) % maxAvailableForm;
      return {
        ...prev,
        cats: {
          ...prev.cats,
          [selectedCatId]: {
            ...cur,
            activeForm: nextActive,
          },
        },
      };
    });
  };

  // Filter cats for display
  const normalCats = CAT_DEFINITIONS.filter((c) => c.rarity === 'normal' || c.rarity === 'rare');
  const exCats = CAT_DEFINITIONS.filter((c) => c.rarity === 'super_rare' || c.rarity === 'uber_rare');
  const displayCats = category === 'ex_character' ? exCats : normalCats;

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden select-none bg-[#fbf6e8] font-sans">
      {/* Background patterned wallpaper */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none bg-[radial-gradient(#8a4e1d_1.5px,transparent_1.5px)] [background-size:16px_16px]" />

      {/* ========================================================
          TOP HEADER BAR
         ======================================================== */}
      <div className="relative z-20 w-full bg-gradient-to-b from-[#8a4e1d] via-[#63330f] to-[#432007] border-b-[3px] border-[#291102] px-3 sm:px-6 py-1.5 flex items-center justify-between shadow-lg">
        {/* Title: パワーアップ */}
        <div className="flex items-center gap-3">
          <h1
            className="text-2xl sm:text-3xl font-black text-amber-100 tracking-wider"
            style={{
              fontFamily: '"Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
              textShadow:
                '3px 3px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000, 0px 4px 6px rgba(0,0,0,0.8)',
            }}
          >
            パワーアップ
          </h1>
          {profile.hasClearedFilibuster ? (
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 border border-yellow-300 rounded-full px-2.5 py-0.5 text-[10px] sm:text-xs font-black text-yellow-300 shadow flex items-center gap-1 animate-pulse">
              <span>★</span>
              <span>上限Lv.25解放中!!</span>
            </div>
          ) : (
            <div className="bg-stone-900/80 border border-stone-600 rounded-full px-2.5 py-0.5 text-[9px] sm:text-[11px] font-bold text-stone-300 shadow hidden sm:flex items-center gap-1">
              <span>上限Lv.20</span>
              <span className="text-yellow-400 text-[9px]">(宇宙編3章クリアでLv.25解放)</span>
            </div>
          )}
        </div>

        {/* Right Info: 経験値 XP Counter */}
        <div className="flex items-center bg-black/75 border-2 border-amber-800 rounded-lg px-2.5 py-0.5 shadow-inner">
          <span className="text-stone-300 text-[10px] sm:text-xs font-black mr-1">経験値</span>
          <span className="text-cyan-400 font-black text-xs sm:text-sm mr-1 tracking-tighter">XP+</span>
          <span
            className="text-amber-400 font-black text-base sm:text-lg tracking-widest"
            style={{
              fontFamily: '"Courier New", Courier, monospace',
              textShadow: '1px 1px 0px #000, -1px -1px 0px #000',
            }}
          >
            {displayXp.toLocaleString()}
          </span>
        </div>
      </div>

      {/* ========================================================
          MAIN BODY AREA
         ======================================================== */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-2 sm:p-4">
        {/* Top Category Tabs & Pagination dots */}
        <div className="flex items-center justify-between px-2 pt-1 pb-2">
          {/* Category Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                audio.playClick();
                setCategory('character');
              }}
              className={`px-4 sm:px-6 py-1 rounded-full text-xs sm:text-sm font-black border-2 transition-all cursor-pointer ${
                category === 'character'
                  ? 'bg-black text-white border-black shadow'
                  : 'bg-stone-200 text-stone-700 border-stone-400 hover:bg-stone-300'
              }`}
            >
              キャラクター
            </button>

            <button
              onClick={() => {
                audio.playClick();
                setCategory('base_skills');
              }}
              className={`px-4 sm:px-6 py-1 rounded-full text-xs sm:text-sm font-black border-2 transition-all cursor-pointer ${
                category === 'base_skills'
                  ? 'bg-black text-white border-black shadow'
                  : 'bg-stone-200 text-stone-700 border-stone-400 hover:bg-stone-300'
              }`}
            >
              お城・にゃんこ砲
            </button>
          </div>

          {/* Center Pagination Indicator Dots */}
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-stone-700 bg-white" />
            <span className="w-2 h-2 rounded-full bg-stone-700" />
            <span className="w-2 h-2 rounded-full bg-stone-700" />
            <span className="w-2 h-2 rounded-full bg-stone-700" />
            <span className="w-2 h-2 rounded-full bg-stone-700" />
            <span className="w-2 h-2 rounded-full bg-stone-700" />
            <span className="w-2 h-2 rounded-full bg-stone-700" />
            <span className="w-2 h-2 rounded-full bg-stone-700" />
          </div>

          {/* Novice / Recommended Mark */}
          <div className="w-6 h-6 rounded-full bg-yellow-400 border-2 border-stone-900 flex items-center justify-center shadow">
            <span className="text-xs">🔰</span>
          </div>
        </div>

        {/* ========================================================
            CAROUSEL ROW: EX Character Button + Cards
           ======================================================== */}
        <div className="flex-1 flex items-center gap-3 overflow-x-auto py-2 px-1 scrollbar-thin">
          {/* EX Character Toggle Button (Left Golden Box) */}
          <div className="flex items-center gap-1 shrink-0">
            <ChevronLeft className="w-6 h-6 text-sky-400 shrink-0" />
            <button
              onClick={() => {
                audio.playClick();
                setCategory(category === 'ex_character' ? 'character' : 'ex_character');
              }}
              className={`w-28 sm:w-32 h-36 sm:h-44 rounded-2xl border-[3px] border-stone-900 flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer shadow-lg ${
                category === 'ex_character'
                  ? 'bg-gradient-to-b from-amber-400 to-yellow-300 ring-4 ring-yellow-400'
                  : 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 hover:brightness-110'
              }`}
            >
              <span className="text-sm sm:text-base font-black text-stone-950 tracking-wider">
                {category === 'ex_character' ? '基本キャラ' : 'EXキャラクター'}
              </span>
            </button>
          </div>

          {/* CARDS LIST: Characters or Base Skills */}
          {category !== 'base_skills' ? (
            displayCats.map((cat) => {
              const prog = profile.cats[cat.id] || { catId: cat.id, level: 1, unlocked: false, activeForm: 0 };
              const isSelected = selectedCatId === cat.id;
              const isInDeck = profile.deck.includes(cat.id);
              const form = cat.forms[prog.activeForm || 0] || cat.forms[0];
              const cost = getCatLevelUpCost(cat.rarity, prog.level);
              const isMax = prog.level >= maxLevel;

              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    audio.playClick();
                    setSelectedCatId(cat.id);
                  }}
                  className={`relative w-44 sm:w-52 h-44 sm:h-52 bg-white rounded-2xl border-[3.5px] shrink-0 flex flex-col justify-between overflow-hidden cursor-pointer transition-all shadow-xl ${
                    isSelected
                      ? 'border-yellow-400 ring-4 ring-yellow-400/50 scale-105'
                      : 'border-stone-900 hover:border-stone-700'
                  }`}
                >
                  {/* Top Black Bar: Unit Name & NEW badge */}
                  <div className="bg-black text-white px-2 py-1 flex items-center justify-between border-b-2 border-stone-900">
                    <span className="text-xs sm:text-sm font-black truncate">{form.name}</span>
                    {/* NEW Badge */}
                    <div className="bg-red-600 border border-white text-white text-[8px] font-black px-1.5 py-0.2 rounded -rotate-6 shadow">
                      NEW!
                    </div>
                  </div>

                  {/* Artwork Box */}
                  <div className="relative flex-1 bg-white flex items-center justify-center p-2 overflow-hidden">
                    {/* 出陣 Red Ink Stamp */}
                    {isInDeck && (
                      <div className="absolute top-1 right-2 z-10 w-10 h-10 rounded-full border-[2.5px] border-rose-600 bg-rose-600/10 flex items-center justify-center -rotate-12 shadow-sm pointer-events-none">
                        <span className="text-xs font-black text-rose-600 tracking-tighter">出陣</span>
                      </div>
                    )}

                    {/* Sprite Artwork (or Silhouette if locked) */}
                    {prog.unlocked ? (
                      <div className="scale-95 sm:scale-110">
                        <UnitSpriteRenderer
                          spriteType={form.spriteType}
                          isCat={true}
                          state="walk"
                          animTimer={0.5}
                          scale={1.0}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <div className="scale-90 filter brightness-0 opacity-80">
                          <UnitSpriteRenderer
                            spriteType={form.spriteType}
                            isCat={true}
                            state="walk"
                            animTimer={0.5}
                            scale={0.9}
                          />
                        </div>
                        <div className="absolute inset-x-2 bottom-1 bg-black/80 rounded py-0.5 text-center">
                          <span className="text-[10px] font-black text-emerald-400">新キャラクター!!</span>
                        </div>
                      </div>
                    )}

                    {/* Bottom-right Level Tag */}
                    {prog.unlocked && (
                      <div className="absolute bottom-0 right-0 bg-black text-white px-2 py-0.5 rounded-tl-xl border-t border-l border-stone-800 flex items-center gap-1">
                        <span className="text-[9px] font-bold text-stone-300">レベル</span>
                        <span className="text-sm font-black text-yellow-400 font-mono">{prog.level}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Black Bar: Required XP / Unlock Status */}
                  <div className="bg-black text-white px-2 py-1 flex items-center justify-between border-t-2 border-stone-900 text-xs font-black">
                    <span className="text-stone-300 text-[10px]">必要</span>
                    <div className="flex items-center gap-1">
                      {!prog.unlocked ? (
                        cat.unlockMethod === 'stage_reward' ? (
                          profile.clearedStages?.[cat.requiredStageId || ''] ? (
                            <span className="text-emerald-400 text-xs font-bold">クリア済 (受取可)</span>
                          ) : (
                            <span className="text-rose-400 text-xs font-bold">降臨クリア限定</span>
                          )
                        ) : cat.unlockMethod === 'gacha' || (!cat.unlockCostXp && !cat.unlockedAtStart) ? (
                          <span className="text-amber-400 text-xs font-bold">ガチャ限定</span>
                        ) : (
                          <>
                            <span className="text-cyan-400 text-[10px]">XP</span>
                            <span className="text-yellow-400 text-xs sm:text-sm font-mono font-black">
                              {(cat.unlockCostXp || 500).toLocaleString()}
                            </span>
                          </>
                        )
                      ) : (
                        <>
                          <span className="text-cyan-400 text-[10px]">XP</span>
                          <span className="text-yellow-400 text-xs sm:text-sm font-mono font-black">
                            {isMax ? 'MAX' : cost.toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            /* BASE SKILLS CARDS */
            baseSkills.map((skill) => {
              const lv = profile.upgrades[skill.key] || 1;
              const isSelected = selectedBaseSkill === skill.key;
              const cost = getBaseUpgradeCost(lv);
              const isMax = lv >= 10;

              return (
                <div
                  key={skill.key}
                  onClick={() => {
                    audio.playClick();
                    setSelectedBaseSkill(skill.key);
                  }}
                  className={`relative w-44 sm:w-52 h-44 sm:h-52 bg-white rounded-2xl border-[3.5px] shrink-0 flex flex-col justify-between overflow-hidden cursor-pointer transition-all shadow-xl ${
                    isSelected
                      ? 'border-yellow-400 ring-4 ring-yellow-400/50 scale-105'
                      : 'border-stone-900 hover:border-stone-700'
                  }`}
                >
                  <div className="bg-black text-white px-2 py-1 flex items-center justify-between border-b-2 border-stone-900">
                    <span className="text-xs sm:text-sm font-black truncate">{skill.name}</span>
                  </div>

                  <div className="relative flex-1 bg-stone-100 flex flex-col items-center justify-center p-2">
                    <span className="text-4xl sm:text-5xl">{skill.icon}</span>
                    <div className="absolute bottom-0 right-0 bg-black text-white px-2 py-0.5 rounded-tl-xl border-t border-l border-stone-800 flex items-center gap-1">
                      <span className="text-[9px] font-bold text-stone-300">レベル</span>
                      <span className="text-sm font-black text-yellow-400 font-mono">{lv}</span>
                    </div>
                  </div>

                  <div className="bg-black text-white px-2 py-1 flex items-center justify-between border-t-2 border-stone-900 text-xs font-black">
                    <span className="text-stone-300 text-[10px]">必要</span>
                    <div className="flex items-center gap-1">
                      <span className="text-cyan-400 text-[10px]">XP</span>
                      <span className="text-yellow-400 text-xs sm:text-sm font-mono font-black">
                        {isMax ? 'MAX' : cost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <ChevronRight className="w-6 h-6 text-sky-400 shrink-0" />
        </div>

        {/* ========================================================
            ACTION SECTION: Big Glowing 「パワーアップ!!」 Button
           ======================================================== */}
        <div className="flex items-center justify-between gap-3 px-2 my-1">
          {/* Left Big Glowing Button */}
          {(() => {
            const isCharCategory = category !== 'base_skills';
            const isUnlocked = isCharCategory ? catProgress.unlocked : true;

            if (isCharCategory && !isUnlocked) {
              if (selectedCatDef.unlockMethod === 'stage_reward') {
                const isStageCleared = !!profile.clearedStages?.[selectedCatDef.requiredStageId || ''];
                if (isStageCleared) {
                  return (
                    <button
                      id="btn-do-power-up"
                      onClick={handlePowerUpClick}
                      className="group relative rounded-full bg-gradient-to-b from-emerald-300 via-green-400 to-emerald-600 border-[4px] border-emerald-800 shadow-[0_0_15px_rgba(16,185,129,0.8),0_4px_0_#064e3b] px-6 sm:px-10 py-2.5 sm:py-3 active:scale-95 transition-all flex items-center justify-center cursor-pointer hover:brightness-110"
                    >
                      <span className="text-xl sm:text-2xl font-black text-stone-950 tracking-wider">
                        🎁 報酬を受け取る!!
                      </span>
                    </button>
                  );
                } else {
                  return (
                    <button
                      id="btn-do-power-up"
                      onClick={handlePowerUpClick}
                      className="group relative rounded-full bg-stone-700 border-[4px] border-stone-800 shadow-[0_4px_0_#1c1917] px-6 sm:px-10 py-2.5 sm:py-3 active:scale-95 transition-all flex items-center justify-center cursor-pointer hover:bg-stone-600"
                    >
                      <span className="text-base sm:text-xl font-black text-rose-300 tracking-wider">
                        🔒 降臨ステージ未クリア
                      </span>
                    </button>
                  );
                }
              }

              if (selectedCatDef.unlockMethod === 'gacha' || (!selectedCatDef.unlockCostXp && !selectedCatDef.unlockedAtStart)) {
                return (
                  <button
                    id="btn-do-power-up"
                    onClick={handlePowerUpClick}
                    className="group relative rounded-full bg-gradient-to-b from-purple-400 via-fuchsia-500 to-purple-700 border-[4px] border-purple-900 shadow-[0_0_15px_rgba(168,85,247,0.8),0_4px_0_#3b0764] px-6 sm:px-10 py-2.5 sm:py-3 active:scale-95 transition-all flex items-center justify-center cursor-pointer hover:brightness-110"
                  >
                    <span className="text-base sm:text-xl font-black text-white tracking-wider">
                      🎰 レアガチャ限定キャラ
                    </span>
                  </button>
                );
              }

              return (
                <button
                  id="btn-do-power-up"
                  onClick={handlePowerUpClick}
                  className="group relative rounded-full bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-500 border-[4px] border-fuchsia-600 shadow-[0_0_15px_rgba(217,70,239,0.8),0_4px_0_#701a75] px-6 sm:px-10 py-2.5 sm:py-3 active:scale-95 transition-all flex items-center justify-center cursor-pointer hover:brightness-110"
                >
                  <span
                    className="text-xl sm:text-2xl font-black text-stone-950 tracking-wider"
                    style={{
                      fontFamily: '"Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
                      textShadow: '0 1px 2px rgba(255,255,255,0.8)',
                    }}
                  >
                    キャラクター解放!!
                  </span>
                </button>
              );
            }

            return (
              <button
                id="btn-do-power-up"
                onClick={handlePowerUpClick}
                className="group relative rounded-full bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-500 border-[4px] border-fuchsia-600 shadow-[0_0_15px_rgba(217,70,239,0.8),0_4px_0_#701a75] px-6 sm:px-10 py-2.5 sm:py-3 active:scale-95 transition-all flex items-center justify-center cursor-pointer hover:brightness-110"
              >
                <span
                  className="text-xl sm:text-2xl font-black text-stone-950 tracking-wider"
                  style={{
                    fontFamily: '"Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
                    textShadow: '0 1px 2px rgba(255,255,255,0.8)',
                  }}
                >
                  パワーアップ!!
                </span>
              </button>
            );
          })()}

          {/* Catseye Lv 40 Cap Unlock & Form Toggle Buttons */}
          {category !== 'base_skills' && catProgress.unlocked && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Catseye Button if Level >= 30 */}
              {catProgress.level >= 30 && maxLevel < 40 && (
                <button
                  id="btn-use-catseye"
                  onClick={handleUseCatseye}
                  className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-b from-cyan-400 via-sky-500 to-blue-700 text-white font-black text-xs sm:text-sm border-2 border-cyan-200 shadow-[0_3px_0_#0369a1] active:translate-y-0.5 transition-all flex items-center gap-1.5 animate-pulse"
                  title="キャッツアイを使用してレベル上限を解放(最大Lv.40)"
                >
                  <span>👁️</span>
                  <span>キャッツアイ (上限Lv.{maxLevel + 1}へ)</span>
                </button>
              )}

              {/* True Form Evolution Button for units with 3 forms at Lv 30 */}
              {selectedCatDef.forms.length >= 3 && catProgress.level >= 30 && (catProgress.activeForm || 0) < 2 && (
                <button
                  id="btn-evolve-true-form"
                  onClick={handleEvolveTrueForm}
                  className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-600 text-stone-950 font-black text-xs sm:text-sm border-2 border-yellow-200 shadow-[0_3px_0_#b45309] active:translate-y-0.5 transition-all flex items-center gap-1.5 animate-bounce"
                  title="マタタビで第3形態へ進化！"
                >
                  <span>🌟</span>
                  <span>第3形態へマタタビ進化!!</span>
                </button>
              )}

              {/* Form Toggle Button for Evolved Cats (第1形態 ⇄ 第2形態 ⇄ 第3形態) */}
              <button
                onClick={handleToggleActiveForm}
                className={`px-3 sm:px-4 py-2 rounded-xl border-2 text-xs sm:text-sm font-black transition-all ${
                  catProgress.level >= 10
                    ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-300 shadow'
                    : 'bg-stone-300 text-stone-600 border-stone-400 cursor-not-allowed'
                }`}
              >
                形態切替（第{(catProgress.activeForm || 0) + 1}形態）
              </button>
            </div>
          )}
        </div>

        {/* ========================================================
            BOTTOM DESCRIPTION BOX (Dark Brown wooden box with white text)
           ======================================================== */}
        <div className="bg-[#381c07] border-2 border-amber-900 rounded-2xl p-3 sm:p-4 text-white shadow-xl flex flex-col gap-1.5">
          {category !== 'base_skills' && !catProgress.unlocked && selectedCatDef.unlockHint && (
            <div className="flex items-center gap-1.5 bg-amber-950/80 border border-amber-500/50 rounded-lg px-2.5 py-1 text-amber-200 text-xs font-black">
              <span className="text-sm">📌</span>
              <span>入手条件：{selectedCatDef.unlockHint}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm font-bold leading-relaxed">
              {category !== 'base_skills'
                ? currentForm.description || '安価で生産できる基本キャラ'
                : baseSkills.find((s) => s.key === selectedBaseSkill)?.desc || '基本能力'}
            </p>
            <ChevronDown className="w-5 h-5 text-stone-400 shrink-0 ml-2" />
          </div>
        </div>
      </div>

      {/* ========================================================
          BOTTOM CONTROL BAR
         ======================================================== */}
      <div className="relative z-20 w-full bg-gradient-to-t from-[#361a05] via-[#522909] to-[#6d3910] border-t-[3px] border-[#291102] px-3 sm:px-6 py-2 flex items-center justify-between shadow-2xl">
        {/* Back Button (Golden circle) */}
        <button
          id="btn-upgrade-back"
          onClick={() => {
            audio.playClick();
            onBack();
          }}
          className="w-11 h-11 rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 border-3 border-stone-900 shadow-[0_3px_0_#78350f] active:translate-y-0.5 flex items-center justify-center hover:scale-105 transition-transform"
        >
          <span className="text-stone-900 font-black text-2xl">↰</span>
        </button>

        {/* Center: アイテムショップ */}
        <button
          onClick={() => {
            audio.playClick();
            setShowItemShop(true);
          }}
          className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 border-[3px] border-stone-900 rounded-full px-4 sm:px-6 py-1 shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <span className="text-lg">🛒</span>
          <span className="text-stone-950 font-black text-sm sm:text-base tracking-wider">
            アイテムショップ
          </span>
        </button>

        {/* Right: ネコカン Counter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-black/80 border-2 border-amber-700/80 rounded-lg px-2.5 py-0.5 shadow-inner">
            <span className="text-amber-100 text-xs font-black mr-1">ネコカン</span>
            <span className="text-base mr-1">🥫</span>
            <span
              className="text-yellow-400 font-black text-base sm:text-lg tracking-widest"
              style={{
                fontFamily: '"Courier New", Courier, monospace',
                textShadow: '1px 1px 0px #000, -1px -1px 0px #000',
              }}
            >
              {displayCatFood}
            </span>
          </div>

          <button
            onClick={() => {
              audio.playClick();
              setShowItemShop(true);
            }}
            className="w-7 h-7 rounded-full bg-yellow-400 border-2 border-stone-900 font-black text-stone-900 text-sm flex items-center justify-center hover:scale-110 active:scale-95 shadow"
          >
            +
          </button>
        </div>
      </div>

      {/* Item Shop Modal */}
      <ItemShopModal
        isOpen={showItemShop}
        profile={profile}
        onClose={() => setShowItemShop(false)}
        onUpdateProfile={onUpdateProfile}
      />
    </div>
  );
};
