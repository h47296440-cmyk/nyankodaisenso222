import React, { useState } from 'react';
import { PlayerProfile, Rarity } from '../../types';
import { CAT_DEFINITIONS } from '../../data/units';
import { UnitSpriteRenderer } from '../battle/UnitSpriteRenderer';
import { audio } from '../../utils/audio';
import {
  X,
  ArrowRightLeft,
  Shield,
  Zap,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle,
  HelpCircle,
  Flame,
  Swords,
  Heart,
  Layers,
} from 'lucide-react';

interface DeckFormationModalProps {
  isOpen: boolean;
  profile: PlayerProfile;
  onClose: () => void;
  onUpdateProfile: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
}

type FilterRarity = 'all' | Rarity | 'traits';
type SortOption = 'cost' | 'level' | 'rarity';

export const DeckFormationModal: React.FC<DeckFormationModalProps> = ({
  isOpen,
  profile,
  onClose,
  onUpdateProfile,
}) => {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(0);
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('all');
  const [sortBy, setSortBy] = useState<SortOption>('cost');
  const [selectedCatDetailId, setSelectedCatDetailId] = useState<string | null>(profile.deck[0] || null);

  if (!isOpen) return null;

  const unlockedCats = CAT_DEFINITIONS.filter((c) => profile.cats[c.id]?.unlocked);

  // Filter inventory
  const filteredInventory = unlockedCats.filter((cat) => {
    if (filterRarity === 'all') return true;
    if (filterRarity === 'traits') {
      const form1 = cat.forms[0];
      const form2 = cat.forms[1];
      return !!(form1.traitBonus || form1.abilities || form1.waveLevel || form2.traitBonus || form2.abilities || form2.waveLevel);
    }
    return cat.rarity === filterRarity;
  }).sort((a, b) => {
    const progA = profile.cats[a.id];
    const progB = profile.cats[b.id];
    const formA = a.forms[progA?.activeForm || 0];
    const formB = b.forms[progB?.activeForm || 0];

    if (sortBy === 'cost') return formA.cost - formB.cost;
    if (sortBy === 'level') return (progB?.level || 1) - (progA?.level || 1);
    return 0;
  });

  const handleSlotClick = (index: number) => {
    audio.playClick();
    setSelectedSlotIndex(index);
    const catAtSlot = profile.deck[index];
    if (catAtSlot) setSelectedCatDetailId(catAtSlot);
  };

  const handleSelectCatForSlot = (catId: string) => {
    audio.playClick();
    setSelectedCatDetailId(catId);

    if (selectedSlotIndex === null) {
      return;
    }

    onUpdateProfile((prev) => {
      const nextDeck = [...prev.deck];
      const existingIdx = nextDeck.indexOf(catId);

      if (existingIdx !== -1) {
        // Swap slots
        const temp = nextDeck[selectedSlotIndex];
        nextDeck[selectedSlotIndex] = catId;
        nextDeck[existingIdx] = temp;
      } else {
        nextDeck[selectedSlotIndex] = catId;
      }

      return {
        ...prev,
        deck: nextDeck,
      };
    });

    // Advance to next slot automatically for smooth consecutive deck building
    setSelectedSlotIndex((prev) => (prev !== null && prev < 9 ? prev + 1 : null));
  };

  // Toggle active form for selected unit
  const handleToggleForm = (catId: string) => {
    audio.playClick();
    onUpdateProfile((prev) => {
      const curProg = prev.cats[catId];
      if (!curProg) return prev;
      const catDef = CAT_DEFINITIONS.find((c) => c.id === catId);
      const totalForms = catDef ? catDef.forms.length : 2;
      
      // Determine max available form based on unlocks
      let maxAvailableForm = 1;
      if (catId === 'cat_valkyrie') {
        maxAvailableForm = prev.unlockedValkyrieTrueForm ? 2 : 1;
      } else if (totalForms >= 3 && curProg.level >= 20) {
        maxAvailableForm = 2;
      }

      const nextForm = (curProg.activeForm + 1) % (maxAvailableForm + 1);
      return {
        ...prev,
        cats: {
          ...prev.cats,
          [catId]: {
            ...curProg,
            activeForm: nextForm,
          },
        },
      };
    });
  };

  // Auto-balance recommendation
  const handleAutoFillDeck = () => {
    audio.playVictory();
    const sortedByCost = [...unlockedCats].sort((a, b) => a.forms[0].cost - b.forms[0].cost);
    const cheapMeatshields = sortedByCost.slice(0, 3).map((c) => c.id);
    const strongAttackers = sortedByCost.slice(3, 10).map((c) => c.id);
    const newDeck = [...cheapMeatshields, ...strongAttackers].slice(0, 10);

    // Pad if fewer than 10 unlocked
    while (newDeck.length < 10) {
      const missing = unlockedCats.find((c) => !newDeck.includes(c.id));
      if (missing) newDeck.push(missing.id);
      else if (unlockedCats[0]) newDeck.push(unlockedCats[0].id);
      else break;
    }

    onUpdateProfile((prev) => ({
      ...prev,
      deck: newDeck,
    }));
  };

  // Deck statistics
  const deckCosts = profile.deck.map((catId) => {
    const def = CAT_DEFINITIONS.find((c) => c.id === catId);
    const prog = profile.cats[catId];
    return def ? def.forms[prog?.activeForm || 0].cost : 0;
  });
  const avgCost = Math.round(deckCosts.reduce((a, b) => a + b, 0) / Math.max(1, profile.deck.length));

  // Selected Cat inspection
  const inspectingCat = CAT_DEFINITIONS.find((c) => c.id === selectedCatDetailId);
  const inspectingProg = inspectingCat ? profile.cats[inspectingCat.id] : null;
  const inspectingForm = inspectingCat ? inspectingCat.forms[inspectingProg?.activeForm || 0] : null;

  return (
    <div
      id="deck-formation-overlay"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        id="deck-formation-modal"
        className="bg-stone-900 border-4 border-amber-500 rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden shadow-2xl animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 px-4 py-3 border-b-2 border-amber-400 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-950/60 border border-amber-300/40 flex items-center justify-center text-xl shadow-inner">
              ⚔️
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black text-white tracking-wide">
                出撃スロット編成 (全10枠)
              </h2>
              <p className="text-[11px] text-amber-200 font-bold">
                スロットを選択し、下の一覧からにゃんこをタップして出撃陣形をセット！
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-auto-deck"
              onClick={handleAutoFillDeck}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-yellow-300 text-stone-950 font-black text-xs border border-yellow-100 shadow active:scale-95 transition-all flex items-center gap-1"
            >
              <Sparkles size={13} />
              <span>おまかせ編成</span>
            </button>

            <button
              id="btn-close-deck-modal"
              onClick={() => {
                audio.playClick();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white font-bold transition-all active:scale-95"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* TOP DECK FORMATION SLOTS (2 rows of 5) */}
        <div className="bg-stone-950 p-3 sm:p-4 border-b border-stone-800">
          <div className="flex items-center justify-between text-xs font-black text-amber-400 mb-2">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-stone-950 px-2 py-0.5 rounded font-black text-[10px]">
                出撃デッキ
              </span>
              <span>平均生産コスト: ¥{avgCost}</span>
            </div>

            {selectedSlotIndex !== null ? (
              <span className="text-yellow-300 font-bold animate-pulse text-[11px]">
                🎯 スロット No.{selectedSlotIndex + 1} を編集中！ 下のキャラをタップしてセット
              </span>
            ) : (
              <span className="text-stone-400 text-[11px]">スロットをタップすると入れ替えできます</span>
            )}
          </div>

          {/* 10 Slots Grid: 2 rows x 5 columns */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
            {profile.deck.map((catId, idx) => {
              const def = CAT_DEFINITIONS.find((c) => c.id === catId);
              const prog = profile.cats[catId];
              const isSelected = selectedSlotIndex === idx;

              if (!def) return null;
              const form = def.forms[prog?.activeForm || 0];

              return (
                <button
                  key={idx}
                  id={`deck-slot-${idx}`}
                  onClick={() => handleSlotClick(idx)}
                  className={`relative p-1.5 sm:p-2 rounded-2xl border-2 flex flex-col items-center justify-between text-center transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-amber-950 border-yellow-400 ring-4 ring-yellow-400/50 scale-105 shadow-xl z-10'
                      : 'bg-stone-900 border-stone-700 hover:border-amber-500/80 hover:bg-stone-850'
                  }`}
                >
                  {/* Slot Number Tag */}
                  <div className="w-full flex items-center justify-between text-[8px] sm:text-[9px] font-black">
                    <span className="bg-stone-950/80 text-amber-400 px-1 py-0.2 rounded border border-amber-500/30">
                      {idx + 1}
                    </span>
                    <span className="text-stone-300 font-mono">Lv.{prog?.level || 1}</span>
                  </div>

                  {/* Cat Sprite Animation */}
                  <div className="my-0.5 sm:my-1 h-12 flex items-center justify-center scale-90 sm:scale-100">
                    <UnitSpriteRenderer
                      spriteType={form.spriteType}
                      isCat={true}
                      state="walk"
                      animTimer={0.5 + idx * 0.1}
                      scale={0.8}
                    />
                  </div>

                  {/* Name & Cost */}
                  <div className="w-full">
                    <div className="text-[9px] sm:text-[10px] font-black text-white truncate w-full">
                      {form.name}
                    </div>
                    <div className="text-[8px] sm:text-[9px] font-bold text-yellow-300 font-mono">
                      ¥{form.cost}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* DETAIL INSPECTION & FORM TOGGLE STRIP */}
        {inspectingCat && inspectingForm && inspectingProg && (
          <div className="bg-stone-950/90 border-b border-stone-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="font-black text-amber-300 text-sm">{inspectingForm.name}</span>
                <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-500/40 px-1.5 rounded font-bold uppercase">
                  {inspectingCat.rarity.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">Lv.{inspectingProg.level}</span>
              </div>

              <div className="hidden sm:flex items-center gap-2.5 text-[11px] text-stone-300">
                <span className="flex items-center gap-0.5 text-rose-400 font-bold">
                  <Heart size={11} /> HP {inspectingForm.hp.toLocaleString()}
                </span>
                <span className="flex items-center gap-0.5 text-amber-300 font-bold">
                  <Swords size={11} /> 攻 {inspectingForm.attackPower.toLocaleString()}
                </span>
                <span className="text-cyan-300 font-bold">射程 {inspectingForm.attackRange}</span>
              </div>
            </div>

            {/* Form switcher button */}
            <button
              id="btn-toggle-unit-form"
              onClick={() => handleToggleForm(inspectingCat.id)}
              className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs border border-indigo-400 flex items-center gap-1 shadow active:scale-95 transition-all"
            >
              <RefreshCw size={12} />
              <span>形態切替 (第{(inspectingProg.activeForm || 0) + 1}形態)</span>
            </button>
          </div>
        )}

        {/* INVENTORY / BENCH SECTION */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col min-h-0">
          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            {/* Rarity Tabs */}
            <div className="flex flex-wrap gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
              <button
                onClick={() => setFilterRarity('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterRarity === 'all' ? 'bg-amber-500 text-stone-950 font-black' : 'text-stone-400 hover:text-white'
                }`}
              >
                すべて ({unlockedCats.length})
              </button>
              <button
                onClick={() => setFilterRarity('normal')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterRarity === 'normal' ? 'bg-amber-500 text-stone-950 font-black' : 'text-stone-400 hover:text-white'
                }`}
              >
                基本
              </button>
              <button
                onClick={() => setFilterRarity('rare')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterRarity === 'rare' ? 'bg-amber-500 text-stone-950 font-black' : 'text-stone-400 hover:text-white'
                }`}
              >
                レア
              </button>
              <button
                onClick={() => setFilterRarity('super_rare')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterRarity === 'super_rare' ? 'bg-amber-500 text-stone-950 font-black' : 'text-stone-400 hover:text-white'
                }`}
              >
                激レア
              </button>
              <button
                onClick={() => setFilterRarity('uber_rare')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterRarity === 'uber_rare' ? 'bg-amber-500 text-stone-950 font-black' : 'text-stone-400 hover:text-white'
                }`}
              >
                超激レア
              </button>
              <button
                onClick={() => setFilterRarity('traits')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterRarity === 'traits' ? 'bg-indigo-600 text-white font-black' : 'text-indigo-300 hover:text-white'
                }`}
              >
                ✨ 特性持ち
              </button>
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-1.5 text-xs text-stone-400 font-bold">
              <span>並び順:</span>
              <button
                onClick={() => setSortBy('cost')}
                className={`px-2 py-0.5 rounded border transition-all ${
                  sortBy === 'cost' ? 'bg-stone-700 text-amber-300 border-amber-500' : 'bg-stone-800 border-stone-700'
                }`}
              >
                コスト順
              </button>
              <button
                onClick={() => setSortBy('level')}
                className={`px-2 py-0.5 rounded border transition-all ${
                  sortBy === 'level' ? 'bg-stone-700 text-amber-300 border-amber-500' : 'bg-stone-800 border-stone-700'
                }`}
              >
                レベル順
              </button>
            </div>
          </div>

          {/* Grid of Unlocked Cats */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {filteredInventory.map((cat) => {
              const prog = profile.cats[cat.id];
              const isInDeck = profile.deck.includes(cat.id);
              const deckIndex = profile.deck.indexOf(cat.id);
              const form = cat.forms[prog?.activeForm || 0];
              const isSelected = selectedCatDetailId === cat.id;

              return (
                <button
                  key={cat.id}
                  id={`inventory-cat-${cat.id}`}
                  onClick={() => handleSelectCatForSlot(cat.id)}
                  className={`relative p-2 rounded-2xl border-2 flex flex-col items-center justify-between text-center transition-all cursor-pointer select-none ${
                    isInDeck
                      ? 'bg-amber-950/30 border-amber-600/70'
                      : isSelected
                      ? 'bg-stone-800 border-yellow-400 shadow-md'
                      : 'bg-stone-900/90 border-stone-700 hover:border-stone-400'
                  }`}
                >
                  {/* 出陣 Stamp Badge */}
                  {isInDeck && (
                    <div className="absolute top-1 right-1 px-1 py-0.2 rounded-full border border-rose-500 bg-rose-600/30 flex items-center justify-center shadow">
                      <span className="text-[7px] font-black text-rose-300">出撃中 No.{deckIndex + 1}</span>
                    </div>
                  )}

                  {/* Level & Rarity */}
                  <div className="w-full flex justify-between text-[8px] font-black text-stone-400">
                    <span>Lv.{prog?.level || 1}</span>
                    <span className="text-amber-400 uppercase">{cat.rarity[0]}</span>
                  </div>

                  {/* Sprite */}
                  <div className="my-1 h-12 flex items-center justify-center scale-80">
                    <UnitSpriteRenderer
                      spriteType={form.spriteType}
                      isCat={true}
                      state="walk"
                      animTimer={0.5}
                      scale={0.75}
                    />
                  </div>

                  {/* Name & Cost */}
                  <div className="w-full">
                    <div className="text-[9px] font-black text-white truncate w-full">{form.name}</div>
                    <div className="text-[8px] text-yellow-300 font-bold font-mono">¥{form.cost}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-950 p-3 px-4 flex items-center justify-between border-t border-stone-800">
          <div className="text-xs text-stone-400 font-bold">
            編成中: <span className="text-amber-400 font-black">{profile.deck.length} / 10 体</span>
          </div>

          <button
            id="btn-confirm-deck-formation"
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-xs sm:text-sm px-8 py-2 rounded-xl shadow-lg border-2 border-yellow-200 active:scale-95 transition-all"
          >
            編成完了
          </button>
        </div>
      </div>
    </div>
  );
};

