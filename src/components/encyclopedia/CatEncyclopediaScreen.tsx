import React, { useState } from 'react';
import { CatDefinition, EnemyDefinition, EnemyTrait } from '../../types';
import { CAT_DEFINITIONS, ENEMY_DEFINITIONS } from '../../data/units';
import { UnitSpriteRenderer } from '../battle/UnitSpriteRenderer';
import { ArrowLeft, Swords, Heart, Shield, Sparkles, Filter, Zap, Target, Flame, Star, Award } from 'lucide-react';
import { audio } from '../../utils/audio';

interface CatEncyclopediaScreenProps {
  onBack: () => void;
}

type TraitFilter = 'all' | 'has_trait' | 'red' | 'floating' | 'black' | 'alien' | 'zombie' | 'critical' | 'wave';

export const CatEncyclopediaScreen: React.FC<CatEncyclopediaScreenProps> = ({ onBack }) => {
  const [tab, setTab] = useState<'cats' | 'enemies'>('cats');
  const [selectedCatId, setSelectedCatId] = useState<string>('cat_basic');
  const [selectedEnemyId, setSelectedEnemyId] = useState<string>('enemy_doge');
  const [attackTypeFilter, setAttackTypeFilter] = useState<'all' | 'single' | 'area'>('all');
  const [traitFilter, setTraitFilter] = useState<TraitFilter>('all');
  const [selectedCatFormIndex, setSelectedCatFormIndex] = useState<number>(0);

  const selectedCat = CAT_DEFINITIONS.find((c) => c.id === selectedCatId) || CAT_DEFINITIONS[0];
  const selectedEnemy = ENEMY_DEFINITIONS[selectedEnemyId] || ENEMY_DEFINITIONS.enemy_doge;

  const currentCatForm = selectedCat.forms[selectedCatFormIndex] || selectedCat.forms[0];

  // Helper to check cat traits
  const getCatTraitInfo = (cat: CatDefinition) => {
    const f1 = cat.forms[0];
    const f2 = cat.forms[1];
    const hasAnyTrait = !!(
      f1.traitBonus || f1.abilities || f1.waveLevel ||
      f2.traitBonus || f2.abilities || f2.waveLevel
    );

    const hasRed = f1.traitBonus?.trait === 'red' || f1.abilities?.massiveDamage?.traits?.includes('red') || f1.abilities?.strong?.traits?.includes('red') || f2.traitBonus?.trait === 'red' || f2.abilities?.massiveDamage?.traits?.includes('red');
    const hasFloating = f1.traitBonus?.trait === 'floating' || f1.abilities?.massiveDamage?.traits?.includes('floating') || f2.traitBonus?.trait === 'floating';
    const hasBlack = f1.traitBonus?.trait === 'black' || f1.abilities?.massiveDamage?.traits?.includes('black') || f2.traitBonus?.trait === 'black';
    const hasAlien = f1.traitBonus?.trait === 'alien' || f1.abilities?.massiveDamage?.traits?.includes('alien') || f1.abilities?.barrierBreaker || f2.traitBonus?.trait === 'alien';
    const hasZombie = f1.traitBonus?.trait === 'zombie' || f1.abilities?.zombieKiller || f2.traitBonus?.trait === 'zombie' || f2.abilities?.zombieKiller;
    const hasCritical = !!(f1.abilities?.criticalChance || f2.abilities?.criticalChance);
    const hasWave = !!(f1.waveLevel || f2.waveLevel || f1.abilities?.wave || f2.abilities?.wave);

    return { hasAnyTrait, hasRed, hasFloating, hasBlack, hasAlien, hasZombie, hasCritical, hasWave };
  };

  const filteredCats = CAT_DEFINITIONS.filter((c) => {
    if (attackTypeFilter !== 'all' && c.forms[0].attackType !== attackTypeFilter) return false;
    if (traitFilter === 'all') return true;
    const info = getCatTraitInfo(c);
    if (traitFilter === 'has_trait') return info.hasAnyTrait;
    if (traitFilter === 'red') return info.hasRed;
    if (traitFilter === 'floating') return info.hasFloating;
    if (traitFilter === 'black') return info.hasBlack;
    if (traitFilter === 'alien') return info.hasAlien;
    if (traitFilter === 'zombie') return info.hasZombie;
    if (traitFilter === 'critical') return info.hasCritical;
    if (traitFilter === 'wave') return info.hasWave;
    return true;
  });

  const enemyList = Object.values(ENEMY_DEFINITIONS).filter((e) => {
    if (attackTypeFilter !== 'all' && e.attackType !== attackTypeFilter) return false;
    if (traitFilter === 'all') return true;
    if (traitFilter === 'has_trait') return e.traits.length > 0 || !!e.waveLevel || !!e.abilities;
    if (traitFilter === 'red') return e.traits.includes('red');
    if (traitFilter === 'floating') return e.traits.includes('floating');
    if (traitFilter === 'black') return e.traits.includes('black');
    if (traitFilter === 'alien') return e.traits.includes('alien') || e.traits.includes('star_alien');
    if (traitFilter === 'zombie') return e.traits.includes('zombie');
    if (traitFilter === 'critical') return !!e.abilities?.criticalChance;
    if (traitFilter === 'wave') return !!e.waveLevel || !!e.abilities?.wave;
    return true;
  });

  // Extract human-readable abilities description
  const renderCatAbilitiesSummary = (form: typeof currentCatForm) => {
    const list: { title: string; color: string; desc: string }[] = [];

    if (form.traitBonus) {
      const traitName = form.traitBonus.trait === 'red' ? '赤い敵' : form.traitBonus.trait === 'floating' ? '浮いてる敵' : form.traitBonus.trait === 'black' ? '黒い敵' : form.traitBonus.trait === 'alien' ? 'エイリアン' : form.traitBonus.trait === 'zombie' ? 'ゾンビ' : '対象属性';
      const effectName = form.traitBonus.effect === 'strong' ? 'めっぽう強い' : form.traitBonus.effect === 'massive_damage' ? '超ダメージ' : form.traitBonus.effect === 'resist' ? '打たれ強い' : form.traitBonus.effect === 'freeze' ? '動きを止める' : form.traitBonus.effect === 'slow' ? '動きを遅くする' : form.traitBonus.effect === 'knockback' ? 'ふっとばす' : '特効効果';

      list.push({
        title: `${traitName}に${effectName}`,
        color: 'bg-rose-950 text-rose-300 border-rose-500/50',
        desc: `${traitName}に対してダメージ${form.traitBonus.multiplier}倍などの有利効果を発揮します。`,
      });
    }

    if (form.abilities?.massiveDamage) {
      list.push({
        title: '超ダメージ',
        color: 'bg-amber-950 text-amber-300 border-amber-500/50',
        desc: '対象の敵に対して与えるダメージが通常の3〜4倍に大幅アップ！',
      });
    }

    if (form.abilities?.strong) {
      list.push({
        title: 'めっぽう強い',
        color: 'bg-emerald-950 text-emerald-300 border-emerald-500/50',
        desc: '対象の敵に与えるダメージがアップし、受ける被ダメージを大幅軽減します。',
      });
    }

    if (form.abilities?.criticalChance) {
      list.push({
        title: `クリティカル (${Math.round(form.abilities.criticalChance * 100)}%)`,
        color: 'bg-yellow-950 text-yellow-300 border-yellow-500/50',
        desc: 'メタル属性の防御力を貫通し、2倍の大ダメージを与える一撃を放ちます。',
      });
    }

    if (form.waveLevel || form.abilities?.wave) {
      const lvl = form.waveLevel || form.abilities?.wave?.level || 1;
      list.push({
        title: `波動攻撃 (Lv.${lvl})`,
        color: 'bg-cyan-950 text-cyan-300 border-cyan-500/50',
        desc: `攻撃ヒット時に前方を貫通する強力な波動ショックウェーブ(Lv.${lvl})を発生させます。`,
      });
    }

    if (form.abilities?.barrierBreaker) {
      list.push({
        title: 'バリアブレイカー',
        color: 'bg-purple-950 text-purple-300 border-purple-500/50',
        desc: 'スターエイリアンなどの宇宙バリアを一撃で破壊します。',
      });
    }

    if (form.abilities?.zombieKiller) {
      list.push({
        title: 'ゾンビキラー',
        color: 'bg-indigo-950 text-indigo-300 border-indigo-500/50',
        desc: 'ゾンビ属性の敵を倒した際、蘇生を完全に封じ込めて昇天させます。',
      });
    }

    if (form.abilities?.freeze) {
      list.push({
        title: `動きを止める (${form.abilities.freeze.duration}秒)`,
        color: 'bg-sky-950 text-sky-300 border-sky-500/50',
        desc: '敵を完全に氷結・静止させて行動を封じます。',
      });
    }

    return list;
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-stone-950 text-white select-none font-sans overflow-hidden">
      {/* Header */}
      <div className="bg-stone-900 border-b border-stone-800 px-3 sm:px-4 pt-[max(0.5rem,env(safe-area-inset-top,0px))] pb-2.5 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <button
            id="btn-encyclopedia-back"
            onClick={() => {
              audio.playClick();
              onBack();
            }}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-black text-amber-300">キャラクター大図鑑</h2>
            <p className="text-[10px] text-stone-400">特性持ちや新キャラのステータス・特殊効果を確認！</p>
          </div>
        </div>

        {/* Filter for Single vs Area attacks */}
        <div className="flex items-center gap-1 bg-stone-800 p-1 rounded-xl border border-stone-700 text-xs font-bold">
          <button
            id="filter-atk-all"
            onClick={() => setAttackTypeFilter('all')}
            className={`px-2 py-0.5 rounded-lg transition-all ${
              attackTypeFilter === 'all' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-white'
            }`}
          >
            全攻撃
          </button>
          <button
            id="filter-atk-single"
            onClick={() => setAttackTypeFilter('single')}
            className={`px-2 py-0.5 rounded-lg transition-all ${
              attackTypeFilter === 'single' ? 'bg-sky-700 text-white' : 'text-stone-400 hover:text-white'
            }`}
          >
            単体
          </button>
          <button
            id="filter-atk-area"
            onClick={() => setAttackTypeFilter('area')}
            className={`px-2 py-0.5 rounded-lg transition-all ${
              attackTypeFilter === 'area' ? 'bg-rose-600 text-white' : 'text-stone-400 hover:text-white'
            }`}
          >
            範囲
          </button>
        </div>
      </div>

      {/* Tab Switcher: にゃんこ図鑑 vs 敵キャラ図鑑 */}
      <div className="flex bg-stone-900 border-b border-stone-800 px-4 gap-2 py-2">
        <button
          id="tab-enc-cats"
          onClick={() => {
            audio.playClick();
            setTab('cats');
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
            tab === 'cats' ? 'bg-amber-600 text-white shadow' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
          }`}
        >
          <span>🐱 にゃんこ軍団図鑑 ({CAT_DEFINITIONS.length}体)</span>
        </button>
        <button
          id="tab-enc-enemies"
          onClick={() => {
            audio.playClick();
            setTab('enemies');
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
            tab === 'enemies' ? 'bg-rose-700 text-white shadow' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
          }`}
        >
          <span>👾 敵キャラ図鑑 ({Object.keys(ENEMY_DEFINITIONS).length}体)</span>
        </button>
      </div>

      {/* Trait Sub-Filter Bar */}
      <div className="bg-stone-950 px-3 py-1.5 border-b border-stone-800 flex items-center gap-1.5 overflow-x-auto text-xs">
        <span className="text-stone-500 font-bold shrink-0 text-[11px]">特性フィルター:</span>
        {[
          { id: 'all', label: 'すべて' },
          { id: 'has_trait', label: '✨ 特殊能力あり' },
          { id: 'red', label: '🔴 赤い敵' },
          { id: 'floating', label: '🕊️ 浮いてる敵' },
          { id: 'black', label: '⚫ 黒い敵' },
          { id: 'alien', label: '👽 エイリアン' },
          { id: 'zombie', label: '🧟 ゾンビ' },
          { id: 'critical', label: '⚡ クリティカル' },
          { id: 'wave', label: '🌊 波動' },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setTraitFilter(btn.id as TraitFilter)}
            className={`px-2 py-0.5 rounded-lg font-bold shrink-0 transition-all ${
              traitFilter === btn.id
                ? 'bg-amber-500 text-stone-950 font-black'
                : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Left/Top List Grid */}
        <div className="w-full md:w-5/12 bg-stone-900/50 border-b md:border-b-0 md:border-r border-stone-800 shrink-0 max-h-48 sm:max-h-56 md:max-h-none md:flex-1 overflow-y-auto p-2 sm:p-3 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-2 gap-1.5 sm:gap-2">
          {tab === 'cats'
            ? filteredCats.map((cat) => {
                const isSelected = selectedCatId === cat.id;
                const form = cat.forms[0];
                const traitInfo = getCatTraitInfo(cat);

                return (
                  <button
                    key={cat.id}
                    id={`enc-cat-${cat.id}`}
                    onClick={() => {
                      audio.playClick();
                      setSelectedCatId(cat.id);
                      setSelectedCatFormIndex(0);
                    }}
                    className={`relative p-1.5 sm:p-2 rounded-xl border-2 flex flex-col items-center justify-between text-center transition-all ${
                      isSelected
                        ? 'bg-amber-950 border-yellow-400 shadow-lg scale-105 z-10'
                        : 'bg-stone-900 border-stone-700 hover:border-stone-500'
                    }`}
                  >
                    <div className="w-full flex justify-between text-[8px] font-black">
                      <span
                        className={`px-1 py-0.2 rounded ${
                          form.attackType === 'area' ? 'bg-rose-600 text-white' : 'bg-sky-700 text-white'
                        }`}
                      >
                        {form.attackType === 'area' ? '範囲' : '単体'}
                      </span>

                      {traitInfo.hasAnyTrait && (
                        <span className="text-amber-300 font-bold flex items-center">
                          ✨
                        </span>
                      )}

                      <span className="text-amber-400 uppercase">{cat.rarity[0]}</span>
                    </div>

                    <div className="my-0.5 sm:my-1 h-12 flex items-center justify-center scale-75 sm:scale-90">
                      <UnitSpriteRenderer
                        spriteType={form.spriteType}
                        isCat={true}
                        state="walk"
                        animTimer={0.5}
                        scale={0.75}
                      />
                    </div>

                    <div className="text-[10px] sm:text-[11px] font-black text-white truncate w-full">{form.name}</div>
                  </button>
                );
              })
            : enemyList.map((enemy) => {
                const isSelected = selectedEnemyId === enemy.id;

                return (
                  <button
                    key={enemy.id}
                    id={`enc-enemy-${enemy.id}`}
                    onClick={() => {
                      audio.playClick();
                      setSelectedEnemyId(enemy.id);
                    }}
                    className={`p-1.5 sm:p-2 rounded-xl border-2 flex flex-col items-center justify-between text-center transition-all ${
                      isSelected
                        ? 'bg-rose-950 border-rose-400 shadow-lg scale-105 z-10'
                        : 'bg-stone-900 border-stone-700 hover:border-stone-500'
                    }`}
                  >
                    <div className="w-full flex justify-between text-[8px] font-black">
                      <span
                        className={`px-1 py-0.2 rounded ${
                          enemy.attackType === 'area' ? 'bg-rose-600 text-white' : 'bg-sky-700 text-white'
                        }`}
                      >
                        {enemy.attackType === 'area' ? '範囲' : '単体'}
                      </span>
                      {enemy.isBoss && <span className="text-yellow-400 font-bold">BOSS</span>}
                    </div>

                    <div className="my-0.5 sm:my-1 h-12 flex items-center justify-center scale-75 sm:scale-90">
                      <UnitSpriteRenderer
                        spriteType={enemy.spriteType}
                        isCat={false}
                        state="walk"
                        animTimer={0.5}
                        scale={0.75}
                      />
                    </div>

                    <div className="text-[10px] sm:text-[11px] font-black text-white truncate w-full">{enemy.name}</div>
                  </button>
                );
              })}
        </div>

        {/* Right Details Panel */}
        <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto min-h-0 flex flex-col justify-start space-y-3.5">
          {tab === 'cats' ? (
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded ${
                        currentCatForm.attackType === 'area' ? 'bg-rose-600 text-white' : 'bg-sky-700 text-white'
                      }`}
                    >
                      {currentCatForm.attackType === 'area' ? '範囲攻撃' : '単体攻撃'}
                    </span>
                    <span className="text-xs text-amber-400 font-bold uppercase">
                      {selectedCat.rarity.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                    {currentCatForm.name}
                  </h3>
                </div>

                {/* Form Switcher (第1形態 / 第2形態 / 第3形態) */}
                <div className="flex gap-1.5 bg-stone-900 p-1 rounded-xl border border-stone-700">
                  {selectedCat.forms.map((f, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedCatFormIndex(idx)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                        selectedCatFormIndex === idx
                          ? idx === 2
                            ? 'bg-amber-500 text-stone-950 shadow font-black'
                            : idx === 1
                            ? 'bg-indigo-600 text-white shadow'
                            : 'bg-amber-600 text-white shadow'
                          : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      {idx === 2 ? '第3形態（真の姿）' : idx === 1 ? '第2形態（進化）' : '第1形態'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Animation Showcase */}
              <div className="my-3 h-36 bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-800 rounded-2xl flex items-center justify-center relative overflow-hidden">
                <div className="scale-125">
                  <UnitSpriteRenderer
                    spriteType={currentCatForm.spriteType}
                    isCat={true}
                    state="walk"
                    animTimer={1.2}
                    scale={currentCatForm.scale || 1.0}
                  />
                </div>
              </div>

              {/* Lore / Description */}
              <div className="bg-stone-900 p-3 rounded-xl border border-stone-800 text-xs sm:text-sm text-stone-200 leading-relaxed">
                {currentCatForm.description}
              </div>

              {/* Special Traits / Abilities Box */}
              {renderCatAbilitiesSummary(currentCatForm).length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-black text-amber-400 flex items-center gap-1">
                    <Sparkles size={13} /> キャラクター特殊能力・特性
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {renderCatAbilitiesSummary(currentCatForm).map((ab, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-xl border ${ab.color} text-xs space-y-0.5 shadow`}
                      >
                        <div className="font-black flex items-center gap-1">
                          <Zap size={13} /> {ab.title}
                        </div>
                        <p className="text-[11px] opacity-90">{ab.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-800">
                  <div className="text-stone-400 font-bold">基本体力 (HP)</div>
                  <div className="text-sm font-black text-white mt-0.5">{currentCatForm.hp.toLocaleString()}</div>
                </div>
                <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-800">
                  <div className="text-stone-400 font-bold">基本攻撃力</div>
                  <div className="text-sm font-black text-white mt-0.5">{currentCatForm.attackPower.toLocaleString()}</div>
                </div>
                <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-800">
                  <div className="text-stone-400 font-bold">出撃コスト</div>
                  <div className="text-sm font-black text-yellow-300 mt-0.5">¥{currentCatForm.cost}</div>
                </div>
                <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-800">
                  <div className="text-stone-400 font-bold">射程 / 速度</div>
                  <div className="text-sm font-black text-cyan-300 mt-0.5">
                    {currentCatForm.attackRange} / {currentCatForm.speed}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Enemy Header */}
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded ${
                        selectedEnemy.attackType === 'area' ? 'bg-rose-600 text-white' : 'bg-sky-700 text-white'
                      }`}
                    >
                      {selectedEnemy.attackType === 'area' ? '範囲攻撃' : '単体攻撃'}
                    </span>
                    {selectedEnemy.isBoss && (
                      <span className="text-xs bg-yellow-500 text-stone-950 font-black px-2 py-0.5 rounded">
                        ボスキャラクター
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-1">{selectedEnemy.name}</h3>
                </div>
              </div>

              {/* Enemy Animation Showcase */}
              <div className="my-3 h-36 bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-800 rounded-2xl flex items-center justify-center relative overflow-hidden">
                <div className="scale-125">
                  <UnitSpriteRenderer
                    spriteType={selectedEnemy.spriteType}
                    isCat={false}
                    state="walk"
                    animTimer={1.2}
                    scale={selectedEnemy.scale || 1.0}
                  />
                </div>
              </div>

              {/* Enemy Lore */}
              <div className="bg-stone-900 p-3 rounded-xl border border-stone-800 text-xs sm:text-sm text-stone-200 leading-relaxed">
                {selectedEnemy.description}
              </div>

              {/* Enemy Attributes / Traits Badges */}
              {selectedEnemy.traits.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-black text-rose-400">エネミー属性:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEnemy.traits.map((t) => (
                      <span
                        key={t}
                        className={`text-xs px-2 py-0.5 rounded-lg font-bold border ${
                          t === 'red'
                            ? 'bg-red-950 text-red-300 border-red-500/50'
                            : t === 'floating'
                            ? 'bg-sky-950 text-sky-300 border-sky-500/50'
                            : t === 'black'
                            ? 'bg-stone-900 text-stone-200 border-stone-600'
                            : t === 'alien' || t === 'star_alien'
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                            : t === 'zombie'
                            ? 'bg-purple-950 text-purple-300 border-purple-500/50'
                            : 'bg-stone-800 text-stone-300 border-stone-700'
                        }`}
                      >
                        {t === 'red' ? '🔴 赤い敵' : t === 'floating' ? '🕊️ 浮いてる敵' : t === 'black' ? '⚫ 黒い敵' : t === 'alien' ? '👽 エイリアン' : t === 'star_alien' ? '⭐ スターエイリアン' : t === 'zombie' ? '🧟 ゾンビ' : t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Enemy Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-800">
                  <div className="text-stone-400 font-bold">体力 (HP)</div>
                  <div className="text-sm font-black text-rose-400 mt-0.5">{selectedEnemy.hp.toLocaleString()}</div>
                </div>
                <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-800">
                  <div className="text-stone-400 font-bold">攻撃力</div>
                  <div className="text-sm font-black text-rose-300 mt-0.5">{selectedEnemy.attackPower.toLocaleString()}</div>
                </div>
                <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-800">
                  <div className="text-stone-400 font-bold">撃破時報酬</div>
                  <div className="text-sm font-black text-yellow-300 mt-0.5">¥{selectedEnemy.rewardMoney}</div>
                </div>
                <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-800">
                  <div className="text-stone-400 font-bold">射程 / KB回数</div>
                  <div className="text-sm font-black text-cyan-300 mt-0.5">
                    {selectedEnemy.attackRange} / {selectedEnemy.knockbacks}回
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

