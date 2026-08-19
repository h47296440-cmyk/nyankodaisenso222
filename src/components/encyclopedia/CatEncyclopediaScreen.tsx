import React, { useState } from 'react';
import { CatDefinition, EnemyDefinition } from '../../types';
import { CAT_DEFINITIONS, ENEMY_DEFINITIONS } from '../../data/units';
import { UnitSpriteRenderer } from '../battle/UnitSpriteRenderer';
import { ArrowLeft, Swords, Heart, Shield, Sparkles, Filter } from 'lucide-react';
import { audio } from '../../utils/audio';

interface CatEncyclopediaScreenProps {
  onBack: () => void;
}

export const CatEncyclopediaScreen: React.FC<CatEncyclopediaScreenProps> = ({ onBack }) => {
  const [tab, setTab] = useState<'cats' | 'enemies'>('cats');
  const [selectedCatId, setSelectedCatId] = useState<string>('cat_basic');
  const [selectedEnemyId, setSelectedEnemyId] = useState<string>('enemy_doge');
  const [attackTypeFilter, setAttackTypeFilter] = useState<'all' | 'single' | 'area'>('all');
  const [selectedCatFormIndex, setSelectedCatFormIndex] = useState<number>(0);

  const selectedCat = CAT_DEFINITIONS.find((c) => c.id === selectedCatId) || CAT_DEFINITIONS[0];
  const selectedEnemy = ENEMY_DEFINITIONS[selectedEnemyId] || ENEMY_DEFINITIONS.enemy_doge;

  const currentCatForm = selectedCat.forms[selectedCatFormIndex] || selectedCat.forms[0];

  const filteredCats = CAT_DEFINITIONS.filter((c) => {
    if (attackTypeFilter === 'all') return true;
    return c.forms[0].attackType === attackTypeFilter;
  });

  const enemyList = Object.values(ENEMY_DEFINITIONS).filter((e) => {
    if (attackTypeFilter === 'all') return true;
    return e.attackType === attackTypeFilter;
  });

  return (
    <div className="flex flex-col h-full min-h-0 bg-stone-950 text-white select-none font-['M_PLUS_Rounded_1c'] overflow-hidden">
      {/* Header */}
      <div className="bg-stone-900 border-b border-stone-800 px-3 sm:px-4 pt-[max(0.5rem,env(safe-area-inset-top,0px))] pb-2.5 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <button
            id="btn-encyclopedia-back"
            onClick={() => {
              audio.playClick();
              onBack();
            }}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-base sm:text-lg font-black text-amber-300">キャラクター大図鑑</h2>
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
            全タイプ
          </button>
          <button
            id="filter-atk-single"
            onClick={() => setAttackTypeFilter('single')}
            className={`px-2 py-0.5 rounded-lg transition-all ${
              attackTypeFilter === 'single' ? 'bg-sky-700 text-white' : 'text-stone-400 hover:text-white'
            }`}
          >
            単体攻撃
          </button>
          <button
            id="filter-atk-area"
            onClick={() => setAttackTypeFilter('area')}
            className={`px-2 py-0.5 rounded-lg transition-all ${
              attackTypeFilter === 'area' ? 'bg-rose-600 text-white' : 'text-stone-400 hover:text-white'
            }`}
          >
            範囲攻撃
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
          className={`flex-1 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
            tab === 'cats' ? 'bg-amber-600 text-white shadow' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
          }`}
        >
          にゃんこ図鑑（味方）
        </button>
        <button
          id="tab-enc-enemies"
          onClick={() => {
            audio.playClick();
            setTab('enemies');
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
            tab === 'enemies' ? 'bg-rose-700 text-white shadow' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
          }`}
        >
          敵キャラ図鑑（エネミー）
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Left/Top List Grid */}
        <div className="w-full md:w-5/12 bg-stone-900/50 border-b md:border-b-0 md:border-r border-stone-800 shrink-0 max-h-40 sm:max-h-48 md:max-h-none md:flex-1 overflow-y-auto p-2 sm:p-3 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-2 gap-1.5 sm:gap-2">
          {tab === 'cats'
            ? filteredCats.map((cat) => {
                const isSelected = selectedCatId === cat.id;
                const form = cat.forms[0];

                return (
                  <button
                    key={cat.id}
                    id={`enc-cat-${cat.id}`}
                    onClick={() => {
                      audio.playClick();
                      setSelectedCatId(cat.id);
                      setSelectedCatFormIndex(0);
                    }}
                    className={`p-1.5 sm:p-2 rounded-xl border-2 flex flex-col items-center justify-between text-center transition-all ${
                      isSelected
                        ? 'bg-amber-950 border-yellow-400 shadow-lg scale-105'
                        : 'bg-stone-900 border-stone-700 hover:border-stone-500'
                    }`}
                  >
                    <div className="w-full flex justify-between text-[8px] font-black">
                      <span
                        className={`px-1 py-0.5 rounded ${
                          form.attackType === 'area' ? 'bg-rose-600 text-white' : 'bg-sky-700 text-white'
                        }`}
                      >
                        {form.attackType === 'area' ? '範囲' : '単体'}
                      </span>
                      <span className="text-amber-400">{cat.rarity[0].toUpperCase()}</span>
                    </div>

                    <div className="my-0.5 sm:my-1 scale-75 sm:scale-90">
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
                        ? 'bg-rose-950 border-rose-400 shadow-lg scale-105'
                        : 'bg-stone-900 border-stone-700 hover:border-stone-500'
                    }`}
                  >
                    <div className="w-full flex justify-between text-[8px] font-black">
                      <span
                        className={`px-1 py-0.5 rounded ${
                          enemy.attackType === 'area' ? 'bg-rose-600 text-white' : 'bg-sky-700 text-white'
                        }`}
                      >
                        {enemy.attackType === 'area' ? '範囲' : '単体'}
                      </span>
                      {enemy.isBoss && <span className="text-yellow-400 font-bold">BOSS</span>}
                    </div>

                    <div className="my-0.5 sm:my-1 scale-75 sm:scale-90">
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

        {/* Right Details Panel - Clear and Scrollable */}
        <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto min-h-0 flex flex-col justify-start">
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
                  <h3 className="text-2xl font-black text-white mt-1">
                    {currentCatForm.name}
                  </h3>
                </div>

                {/* Form Switcher (第1形態 / 第2形態) */}
                <div className="flex gap-1.5 bg-stone-900 p-1 rounded-xl border border-stone-700">
                  <button
                    onClick={() => setSelectedCatFormIndex(0)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                      selectedCatFormIndex === 0 ? 'bg-amber-600 text-white shadow' : 'text-stone-400'
                    }`}
                  >
                    第1形態
                  </button>
                  <button
                    onClick={() => setSelectedCatFormIndex(1)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                      selectedCatFormIndex === 1 ? 'bg-indigo-600 text-white shadow' : 'text-stone-400'
                    }`}
                  >
                    第2形態（進化）
                  </button>
                </div>
              </div>

              {/* Animation Showcase */}
              <div className="my-4 h-36 bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-800 rounded-2xl flex items-center justify-center relative overflow-hidden">
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
              <div className="bg-stone-900 p-3.5 rounded-xl border border-stone-800 text-xs sm:text-sm text-stone-200 leading-relaxed">
                {currentCatForm.description}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4 text-xs">
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
                  <h3 className="text-2xl font-black text-white mt-1">{selectedEnemy.name}</h3>
                </div>
              </div>

              {/* Enemy Animation Showcase */}
              <div className="my-4 h-36 bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-800 rounded-2xl flex items-center justify-center relative overflow-hidden">
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
              <div className="bg-stone-900 p-3.5 rounded-xl border border-stone-800 text-xs sm:text-sm text-stone-200 leading-relaxed">
                {selectedEnemy.description}
              </div>

              {/* Enemy Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4 text-xs">
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
