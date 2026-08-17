import React, { useState } from 'react';
import { PlayerProfile, CatDefinition, PlayerUpgrades } from '../../types';
import { CAT_DEFINITIONS } from '../../data/units';
import { getCatLevelUpCost, getBaseUpgradeCost } from '../../utils/storage';
import { UnitSpriteRenderer } from '../battle/UnitSpriteRenderer';
import { ArrowLeft, Sparkles, ChevronUp, Shield, Zap, Swords, Heart, RefreshCw, Check } from 'lucide-react';
import { audio } from '../../utils/audio';

interface PowerUpScreenProps {
  profile: PlayerProfile;
  onUpdateProfile: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
  onBack: () => void;
}

export const PowerUpScreen: React.FC<PowerUpScreenProps> = ({
  profile,
  onUpdateProfile,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'cats' | 'deck' | 'base'>('cats');
  const [selectedCatId, setSelectedCatId] = useState<string>('cat_basic');
  const [selectedDeckSlotIndex, setSelectedDeckSlotIndex] = useState<number | null>(null);

  const selectedCatDef = CAT_DEFINITIONS.find((c) => c.id === selectedCatId) || CAT_DEFINITIONS[0];
  const catProgress = profile.cats[selectedCatId] || { catId: selectedCatId, level: 1, unlocked: false, activeForm: 0 };
  const currentFormIndex = catProgress.activeForm;
  const currentForm = selectedCatDef.forms[currentFormIndex];
  const isEvolved = catProgress.level >= 10;
  const levelUpCost = getCatLevelUpCost(selectedCatDef.rarity, catProgress.level);
  const canLevelUp = catProgress.unlocked && profile.xp >= levelUpCost && catProgress.level < 20;

  // Level Up Cat
  const handleLevelUpCat = () => {
    if (!canLevelUp) return;
    audio.playWorkerLevelUp();
    onUpdateProfile((prev) => {
      const current = prev.cats[selectedCatId] || { catId: selectedCatId, level: 1, unlocked: true, activeForm: 0 };
      const nextLevel = current.level + 1;
      const nextForm = nextLevel >= 10 ? 1 : current.activeForm;
      return {
        ...prev,
        xp: prev.xp - levelUpCost,
        cats: {
          ...prev.cats,
          [selectedCatId]: {
            ...current,
            level: nextLevel,
            activeForm: nextForm,
          },
        },
      };
    });
  };

  // Unlock Cat with XP
  const handleUnlockWithXp = () => {
    const cost = selectedCatDef.unlockCostXp || 1000;
    if (profile.xp < cost) return;
    audio.playVictory();
    onUpdateProfile((prev) => ({
      ...prev,
      xp: prev.xp - cost,
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
  };

  // Toggle Form between 1 and 2
  const handleToggleForm = () => {
    if (!isEvolved) return;
    audio.playClick();
    onUpdateProfile((prev) => {
      const current = prev.cats[selectedCatId];
      return {
        ...prev,
        cats: {
          ...prev.cats,
          [selectedCatId]: {
            ...current,
            activeForm: current.activeForm === 0 ? 1 : 0,
          },
        },
      };
    });
  };

  // Upgrade Base Skill
  const handleUpgradeBaseSkill = (skillKey: keyof PlayerUpgrades) => {
    const currentLv = profile.upgrades[skillKey] || 1;
    const cost = getBaseUpgradeCost(currentLv);
    if (currentLv >= 10 || profile.xp < cost) return;

    audio.playWorkerLevelUp();
    onUpdateProfile((prev) => ({
      ...prev,
      xp: prev.xp - cost,
      upgrades: {
        ...prev.upgrades,
        [skillKey]: currentLv + 1,
      },
    }));
  };

  // Deck Slot Swap
  const handleSelectDeckSlot = (slotIdx: number) => {
    setSelectedDeckSlotIndex(slotIdx);
  };

  const handleSwapIntoDeck = (catId: string) => {
    if (selectedDeckSlotIndex === null) return;
    audio.playClick();
    onUpdateProfile((prev) => {
      const nextDeck = [...prev.deck];
      // If cat is already elsewhere in deck, swap them
      const existingIdx = nextDeck.indexOf(catId);
      if (existingIdx !== -1) {
        nextDeck[existingIdx] = nextDeck[selectedDeckSlotIndex];
      }
      nextDeck[selectedDeckSlotIndex] = catId;
      return { ...prev, deck: nextDeck };
    });
    setSelectedDeckSlotIndex(null);
  };

  const baseSkillsConfig: { key: keyof PlayerUpgrades; name: string; desc: string; icon: string }[] = [
    { key: 'workerCatRate', name: '働きネコ仕事効率', desc: '戦闘中の資金生産スピードがアップ', icon: '💰' },
    { key: 'workerCatWallet', name: '働きネコお財布', desc: '戦闘中の最大所持金上限がアップ', icon: '👛' },
    { key: 'castleHealth', name: 'お城体力', desc: 'にゃんこ城の最大耐久値がアップ', icon: '🏰' },
    { key: 'cannonPower', name: 'にゃんこ砲攻撃力', desc: 'にゃんこ砲レーザーの破壊力がアップ', icon: '⚡' },
    { key: 'cannonCharge', name: 'にゃんこ砲チャージ', desc: 'にゃんこ砲のチャージ速度がアップ', icon: '⏱️' },
    { key: 'researchSpeed', name: '研究力', desc: '全にゃんこの再生産クールダウンが短縮', icon: '🧪' },
    { key: 'accounting', name: '会計力', desc: '敵撃破時に得られる資金量が増加', icon: '📊' },
    { key: 'leadershipCap', name: '統率力上限', desc: '最大統率力（スタミナ）の上限が増加', icon: '👑' },
  ];

  return (
    <div className="flex flex-col h-full bg-stone-950 text-white select-none font-['M_PLUS_Rounded_1c']">
      {/* Header */}
      <div className="bg-stone-900 border-b border-stone-800 px-4 py-2.5 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <button
            id="btn-upgrade-back"
            onClick={() => {
              audio.playClick();
              onBack();
            }}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-base sm:text-lg font-black text-amber-300">パワーアップ＆編成</h2>
        </div>
        <div className="flex items-center gap-3 text-xs font-black">
          <div className="bg-stone-800 border border-emerald-500/50 px-3 py-1 rounded-full text-emerald-300">
            <span className="text-[10px] text-emerald-400 mr-1">所持XP</span>
            <span className="text-sm font-black">{profile.xp.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-stone-900 border-b border-stone-800 px-4 gap-2 py-1.5">
        <button
          id="tab-upgrade-cats"
          onClick={() => {
            audio.playClick();
            setActiveTab('cats');
          }}
          className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
            activeTab === 'cats'
              ? 'bg-amber-600 text-white shadow'
              : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
          }`}
        >
          にゃんこ育成＆進化
        </button>
        <button
          id="tab-upgrade-deck"
          onClick={() => {
            audio.playClick();
            setActiveTab('deck');
          }}
          className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
            activeTab === 'deck'
              ? 'bg-amber-600 text-white shadow'
              : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
          }`}
        >
          キャラクター編成 (10体)
        </button>
        <button
          id="tab-upgrade-base"
          onClick={() => {
            audio.playClick();
            setActiveTab('base');
          }}
          className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
            activeTab === 'base'
              ? 'bg-amber-600 text-white shadow'
              : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
          }`}
        >
          基本施設・スキル強化
        </button>
      </div>

      {/* Tab 1: Cats Upgrades & Evolution */}
      {activeTab === 'cats' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Cat Roster List */}
          <div className="w-full md:w-1/3 bg-stone-900/60 border-r border-stone-800 overflow-y-auto p-3 grid grid-cols-3 md:grid-cols-2 gap-2">
            {CAT_DEFINITIONS.map((cat) => {
              const prog = profile.cats[cat.id] || { level: 1, unlocked: false, activeForm: 0 };
              const form = cat.forms[prog.activeForm];
              const isSelected = selectedCatId === cat.id;

              return (
                <button
                  key={cat.id}
                  id={`cat-select-${cat.id}`}
                  onClick={() => {
                    audio.playClick();
                    setSelectedCatId(cat.id);
                  }}
                  className={`p-2 rounded-xl border-2 flex flex-col items-center justify-between text-center transition-all ${
                    isSelected
                      ? 'bg-amber-950/80 border-yellow-400 shadow-lg scale-105'
                      : prog.unlocked
                      ? 'bg-stone-900 border-stone-700 hover:border-stone-500'
                      : 'bg-stone-950 border-stone-800/80 opacity-50'
                  }`}
                >
                  <div className="w-full flex justify-between items-center text-[9px] font-black">
                    <span
                      className={`px-1 py-0.5 rounded text-[8px] ${
                        form.attackType === 'area'
                          ? 'bg-rose-600 text-white'
                          : 'bg-sky-700 text-sky-100'
                      }`}
                    >
                      {form.attackType === 'area' ? '範囲' : '単体'}
                    </span>
                    <span className="text-amber-400">{prog.unlocked ? `Lv.${prog.level}` : '未所持'}</span>
                  </div>

                  <div className="my-1.5 scale-90">
                    <UnitSpriteRenderer
                      spriteType={form.spriteType}
                      isCat={true}
                      state="walk"
                      animTimer={0.5}
                      scale={0.85}
                    />
                  </div>

                  <div className="text-[11px] font-black truncate w-full">{form.name}</div>
                </button>
              );
            })}
          </div>

          {/* Right Selected Cat Details & Level Up */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              {/* Top Banner */}
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded ${
                        currentForm.attackType === 'area' ? 'bg-rose-600 text-white' : 'bg-sky-700 text-white'
                      }`}
                    >
                      {currentForm.attackType === 'area' ? '範囲攻撃' : '単体攻撃'}
                    </span>
                    <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                      {selectedCatDef.rarity.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                    {currentForm.name}
                  </h3>
                  <div className="text-xs text-amber-300 font-bold">
                    {catProgress.unlocked ? `現在のレベル: Lv.${catProgress.level} / 20` : '未解放キャラクター'}
                  </div>
                </div>

                {/* Evolved Form Switch Button */}
                {isEvolved && (
                  <button
                    id="btn-toggle-form"
                    onClick={handleToggleForm}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black border border-purple-300 shadow flex items-center gap-1.5 active:scale-95"
                  >
                    <RefreshCw size={14} />
                    <span>形態切替 (第{currentFormIndex + 1}形態)</span>
                  </button>
                )}
              </div>

              {/* Character Animation Showcase */}
              <div className="my-4 h-32 bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-800 rounded-2xl flex items-center justify-center relative overflow-hidden">
                <div className="scale-125">
                  <UnitSpriteRenderer
                    spriteType={currentForm.spriteType}
                    isCat={true}
                    state="walk"
                    animTimer={1.2}
                    scale={currentForm.scale || 1.0}
                  />
                </div>
                <div className="absolute bottom-2 text-[10px] text-stone-500 font-mono">
                  {currentForm.jpName} - 第{currentFormIndex + 1}形態
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-stone-300 bg-stone-900/80 p-3 rounded-xl border border-stone-800 leading-relaxed">
                {currentForm.description}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4 text-xs">
                <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-800">
                  <div className="text-stone-400 flex items-center gap-1 font-bold">
                    <Heart size={14} className="text-rose-400" /> 体力 (HP)
                  </div>
                  <div className="text-sm font-black text-white mt-1">
                    {Math.round(currentForm.hp * (1 + (catProgress.level - 1) * 0.1)).toLocaleString()}
                  </div>
                </div>

                <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-800">
                  <div className="text-stone-400 flex items-center gap-1 font-bold">
                    <Swords size={14} className="text-amber-400" /> 攻撃力
                  </div>
                  <div className="text-sm font-black text-white mt-1">
                    {Math.round(currentForm.attackPower * (1 + (catProgress.level - 1) * 0.1)).toLocaleString()}
                  </div>
                </div>

                <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-800">
                  <div className="text-stone-400 font-bold">生産コスト</div>
                  <div className="text-sm font-black text-yellow-300 mt-1">
                    ¥{currentForm.cost}
                  </div>
                </div>

                <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-800">
                  <div className="text-stone-400 font-bold">攻撃射程</div>
                  <div className="text-sm font-black text-cyan-300 mt-1">
                    {currentForm.attackRange}
                  </div>
                </div>
              </div>

              {/* Evolution Notice */}
              {catProgress.unlocked && catProgress.level < 10 && (
                <div className="text-xs text-purple-300 bg-purple-950/40 border border-purple-800 rounded-xl p-2.5 flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-400 flex-shrink-0" />
                  <span>Lv.10 到達で【第2形態（進化）】へ覚醒進化するにゃ！</span>
                </div>
              )}
            </div>

            {/* Level Up Button / Unlock Button */}
            <div className="mt-4 pt-3 border-t border-stone-800">
              {catProgress.unlocked ? (
                <button
                  id="btn-level-up-cat"
                  disabled={!canLevelUp}
                  onClick={handleLevelUpCat}
                  className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border-2 transition-all ${
                    canLevelUp
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-stone-950 border-emerald-200 shadow-lg active:scale-95'
                      : 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  <ChevronUp size={20} />
                  <span>
                    {catProgress.level >= 20
                      ? 'レベルMAX (Lv.20)'
                      : `レベルアップ！ (必要XP: ${levelUpCost.toLocaleString()})`}
                  </span>
                </button>
              ) : selectedCatDef.unlockCostXp ? (
                <button
                  id="btn-unlock-cat-xp"
                  disabled={profile.xp < (selectedCatDef.unlockCostXp || 1000)}
                  onClick={handleUnlockWithXp}
                  className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border-2 transition-all ${
                    profile.xp >= (selectedCatDef.unlockCostXp || 1000)
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 border-yellow-200 shadow-lg active:scale-95'
                      : 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  <Sparkles size={18} />
                  <span>XPで解放する (必要XP: {selectedCatDef.unlockCostXp?.toLocaleString()})</span>
                </button>
              ) : (
                <div className="text-center text-xs text-stone-400 py-3 bg-stone-900 rounded-xl">
                  ※ ガチャまたは特定ステージクリアで獲得できます
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Team Deck Formation (10 slots) */}
      {activeTab === 'deck' && (
        <div className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col gap-4">
          <div>
            <h3 className="text-base font-black text-amber-300">
              出撃メンバー編成（10スロット）
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              スロットをタップして、入れ替えたいにゃんこを選択してください。
            </p>
          </div>

          {/* 10 Active Deck Slots (2 rows of 5) */}
          <div className="grid grid-cols-5 gap-2 p-3 bg-stone-900 rounded-2xl border-2 border-stone-700">
            {profile.deck.slice(0, 10).map((catId, idx) => {
              const def = CAT_DEFINITIONS.find((c) => c.id === catId) || CAT_DEFINITIONS[0];
              const prog = profile.cats[catId] || { level: 1, activeForm: 0 };
              const form = def.forms[prog.activeForm];
              const isSelectedSlot = selectedDeckSlotIndex === idx;

              return (
                <button
                  key={idx}
                  id={`deck-slot-${idx}`}
                  onClick={() => handleSelectDeckSlot(idx)}
                  className={`relative p-2 rounded-xl border-2 flex flex-col items-center justify-between text-center transition-all ${
                    isSelectedSlot
                      ? 'bg-amber-950 border-yellow-300 shadow-[0_0_15px_rgba(253,224,71,0.6)] animate-pulse scale-105'
                      : 'bg-stone-800 hover:bg-stone-700 border-stone-600'
                  }`}
                >
                  <div className="w-full flex justify-between text-[8px] font-black">
                    <span className="text-stone-400">枠{idx + 1}</span>
                    <span className="text-yellow-300">¥{form.cost}</span>
                  </div>
                  <div className="my-1 scale-90">
                    <UnitSpriteRenderer
                      spriteType={form.spriteType}
                      isCat={true}
                      state="walk"
                      animTimer={0.5}
                      scale={0.8}
                    />
                  </div>
                  <div className="text-[10px] font-black truncate w-full">{form.name}</div>
                </button>
              );
            })}
          </div>

          {/* Unlocked Cats to swap in */}
          <div>
            <h4 className="text-xs font-black text-stone-300 mb-2">
              所持キャラクター一覧（タップして編成にセット）
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {CAT_DEFINITIONS.filter((c) => profile.cats[c.id]?.unlocked).map((cat) => {
                const prog = profile.cats[cat.id];
                const form = cat.forms[prog.activeForm];
                const isInDeck = profile.deck.includes(cat.id);

                return (
                  <button
                    key={cat.id}
                    id={`btn-swap-cat-${cat.id}`}
                    onClick={() => handleSwapIntoDeck(cat.id)}
                    className={`p-2 rounded-xl border-2 flex flex-col items-center text-center transition-all ${
                      isInDeck
                        ? 'bg-stone-900 border-emerald-600 opacity-90'
                        : 'bg-stone-900 hover:bg-stone-800 border-stone-700 hover:border-amber-400'
                    }`}
                  >
                    <div className="w-full flex justify-between text-[8px] font-black">
                      <span className="text-amber-400">Lv.{prog.level}</span>
                      {isInDeck && <span className="text-emerald-400 font-bold">編成中</span>}
                    </div>
                    <div className="my-1">
                      <UnitSpriteRenderer
                        spriteType={form.spriteType}
                        isCat={true}
                        state="walk"
                        animTimer={0.5}
                        scale={0.75}
                      />
                    </div>
                    <div className="text-[10px] font-black truncate w-full">{form.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Base Facility & Skill Upgrades */}
      {activeTab === 'base' && (
        <div className="flex-1 p-4 md:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3">
          {baseSkillsConfig.map((skill) => {
            const currentLv = profile.upgrades[skill.key] || 1;
            const cost = getBaseUpgradeCost(currentLv);
            const isMax = currentLv >= 10;
            const canAfford = profile.xp >= cost && !isMax;

            return (
              <div
                key={skill.key}
                id={`base-upgrade-${skill.key}`}
                className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{skill.icon}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white">{skill.name}</h4>
                      <span className="text-xs font-black text-amber-300">
                        {isMax ? 'MAX (Lv.10)' : `Lv.${currentLv}`}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">{skill.desc}</p>
                  </div>
                </div>

                <button
                  id={`btn-upgrade-skill-${skill.key}`}
                  disabled={!canAfford}
                  onClick={() => handleUpgradeBaseSkill(skill.key)}
                  className={`px-3 py-2 rounded-xl text-xs font-black border transition-all ${
                    isMax
                      ? 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed'
                      : canAfford
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-stone-950 border-emerald-200 shadow active:scale-95'
                      : 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  {isMax ? 'MAX' : `Lv UP (${cost.toLocaleString()} XP)`}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
