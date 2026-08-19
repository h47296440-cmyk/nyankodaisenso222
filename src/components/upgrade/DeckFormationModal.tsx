import React, { useState } from 'react';
import { PlayerProfile } from '../../types';
import { CAT_DEFINITIONS } from '../../data/units';
import { UnitSpriteRenderer } from '../battle/UnitSpriteRenderer';
import { audio } from '../../utils/audio';
import { X, ArrowRightLeft, Shield, Zap } from 'lucide-react';

interface DeckFormationModalProps {
  isOpen: boolean;
  profile: PlayerProfile;
  onClose: () => void;
  onUpdateProfile: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
}

export const DeckFormationModal: React.FC<DeckFormationModalProps> = ({
  isOpen,
  profile,
  onClose,
  onUpdateProfile,
}) => {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const unlockedCats = CAT_DEFINITIONS.filter((c) => profile.cats[c.id]?.unlocked);

  const handleSlotClick = (index: number) => {
    audio.playClick();
    setSelectedSlotIndex(selectedSlotIndex === index ? null : index);
  };

  const handleSelectCatForSlot = (catId: string) => {
    if (selectedSlotIndex === null) return;
    audio.playClick();

    onUpdateProfile((prev) => {
      const nextDeck = [...prev.deck];
      const existingIdx = nextDeck.indexOf(catId);
      if (existingIdx !== -1) {
        nextDeck[existingIdx] = nextDeck[selectedSlotIndex];
      }
      nextDeck[selectedSlotIndex] = catId;
      return {
        ...prev,
        deck: nextDeck,
      };
    });

    setSelectedSlotIndex(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-stone-900 border-4 border-amber-500 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 p-4 border-b-2 border-amber-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚔️</span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">キャラクター編成</h2>
              <p className="text-[11px] text-amber-200">
                出撃スロットを選択して、下にゃんこをタップで入れ替え！
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Deck (10 slots in 2 rows of 5) */}
        <div className="bg-stone-950 p-4 border-b border-stone-800">
          <div className="text-xs font-black text-amber-400 mb-2 flex items-center justify-between">
            <span>🛡️ 現在の出撃スロット（全10体）</span>
            {selectedSlotIndex !== null && (
              <span className="text-yellow-300 font-bold animate-pulse">
                入れ替えるスロット: No.{selectedSlotIndex + 1} を選択中！下のキャラをタップ！
              </span>
            )}
          </div>

          <div className="grid grid-cols-5 gap-2">
            {profile.deck.map((catId, idx) => {
              const def = CAT_DEFINITIONS.find((c) => c.id === catId);
              const prog = profile.cats[catId];
              const isSelected = selectedSlotIndex === idx;

              if (!def) return null;
              const form = def.forms[prog?.activeForm || 0];

              return (
                <button
                  key={idx}
                  onClick={() => handleSlotClick(idx)}
                  className={`p-2 rounded-2xl border-2 flex flex-col items-center justify-between text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-950 border-yellow-400 ring-4 ring-yellow-400/50 scale-105 shadow-xl'
                      : 'bg-stone-900 border-stone-700 hover:border-amber-500'
                  }`}
                >
                  <div className="w-full flex items-center justify-between text-[9px] font-black">
                    <span className="text-amber-400">No.{idx + 1}</span>
                    <span className="text-stone-400">Lv.{prog?.level || 1}</span>
                  </div>

                  <div className="my-1 scale-80">
                    <UnitSpriteRenderer
                      spriteType={form.spriteType}
                      isCat={true}
                      state="walk"
                      animTimer={0.5}
                      scale={0.8}
                    />
                  </div>

                  <div className="text-[10px] font-black text-white truncate w-full">{form.name}</div>
                  <div className="text-[9px] font-bold text-yellow-300">¢{form.cost}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Unlocked Cats Pool */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-xs font-black text-stone-300 mb-2">
            🐾 控えにゃんこ一覧（タップでスロットにセット）
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {unlockedCats.map((cat) => {
              const prog = profile.cats[cat.id];
              const isInDeck = profile.deck.includes(cat.id);
              const form = cat.forms[prog?.activeForm || 0];

              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCatForSlot(cat.id)}
                  className={`relative p-2 rounded-2xl border-2 flex flex-col items-center justify-between text-center transition-all cursor-pointer ${
                    isInDeck
                      ? 'bg-stone-900/90 border-amber-600/70'
                      : 'bg-stone-850 border-stone-700 hover:border-white'
                  }`}
                >
                  {/* 出陣 Stamp */}
                  {isInDeck && (
                    <div className="absolute top-1 right-1 w-6 h-6 rounded-full border-2 border-rose-600 bg-rose-600/20 flex items-center justify-center -rotate-12">
                      <span className="text-[8px] font-black text-rose-500">出陣</span>
                    </div>
                  )}

                  <div className="w-full flex justify-between text-[9px] font-black text-stone-400">
                    <span>Lv.{prog?.level || 1}</span>
                    <span className="text-amber-400">{cat.rarity[0].toUpperCase()}</span>
                  </div>

                  <div className="my-1 scale-75">
                    <UnitSpriteRenderer
                      spriteType={form.spriteType}
                      isCat={true}
                      state="walk"
                      animTimer={0.5}
                      scale={0.75}
                    />
                  </div>

                  <div className="text-[10px] font-black text-white truncate w-full">{form.name}</div>
                  <div className="text-[9px] text-yellow-400 font-bold">¢{form.cost}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-950 p-3 text-center border-t border-stone-800">
          <button
            onClick={onClose}
            className="bg-amber-600 hover:bg-amber-500 text-white font-black text-sm px-8 py-2 rounded-xl shadow-lg border border-amber-400"
          >
            編成完了
          </button>
        </div>
      </div>
    </div>
  );
};
