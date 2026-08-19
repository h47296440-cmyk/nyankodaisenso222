import React from 'react';
import { PlayerProfile } from '../../types';
import { CAT_DEFINITIONS } from '../../data/units';
import { UnitSpriteRenderer } from '../battle/UnitSpriteRenderer';
import { X, Package } from 'lucide-react';

interface StorageModalProps {
  isOpen: boolean;
  profile: PlayerProfile;
  onClose: () => void;
  onOpenGacha: () => void;
}

export const StorageModal: React.FC<StorageModalProps> = ({
  isOpen,
  profile,
  onClose,
  onOpenGacha,
}) => {
  if (!isOpen) return null;

  const unlockedCats = CAT_DEFINITIONS.filter((c) => profile.cats[c.id]?.unlocked);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-stone-900 border-4 border-amber-500 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-900 to-blue-950 p-4 border-b-2 border-cyan-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧊</span>
            <div>
              <h2 className="text-lg font-black text-white">にゃんこ貯蔵庫</h2>
              <p className="text-[11px] text-cyan-200">ガチャから獲得したにゃんこやアイテムの保管庫</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h3 className="text-xs font-black text-amber-300 mb-2">🐾 解放済みにゃんこ軍団 ({unlockedCats.length}体)</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {unlockedCats.map((cat) => {
                const prog = profile.cats[cat.id];
                const form = cat.forms[prog?.activeForm || 0];

                return (
                  <div
                    key={cat.id}
                    className="bg-stone-850 border border-stone-700 rounded-xl p-2 flex flex-col items-center justify-between text-center"
                  >
                    <div className="text-[10px] font-black text-amber-400">Lv.{prog?.level || 1}</div>
                    <div className="my-1 scale-75">
                      <UnitSpriteRenderer
                        spriteType={form.spriteType}
                        isCat={true}
                        state="walk"
                        animTimer={0.5}
                        scale={0.7}
                      />
                    </div>
                    <div className="text-[10px] font-black text-white truncate w-full">{form.name}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black text-yellow-300 mb-2">🎒 所持バトルアイテム一覧</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-bold text-stone-300">
              <div className="bg-stone-850 p-2 rounded-lg border border-stone-800 flex justify-between">
                <span>⏩ スピードアップ</span>
                <span className="text-yellow-400">{profile.items.speedUp || 0}個</span>
              </div>
              <div className="bg-stone-850 p-2 rounded-lg border border-stone-800 flex justify-between">
                <span>🍖 ネコボン</span>
                <span className="text-yellow-400">{profile.items.richCat || 0}個</span>
              </div>
              <div className="bg-stone-850 p-2 rounded-lg border border-stone-800 flex justify-between">
                <span>📡 レーダー</span>
                <span className="text-yellow-400">{profile.items.treasureRadar || 0}個</span>
              </div>
              <div className="bg-stone-850 p-2 rounded-lg border border-stone-800 flex justify-between">
                <span>🤖 ニャンピュータ</span>
                <span className="text-yellow-400">{profile.items.catCpu || 0}個</span>
              </div>
              <div className="bg-stone-850 p-2 rounded-lg border border-stone-800 flex justify-between">
                <span>🎭 おかめはちもく</span>
                <span className="text-yellow-400">{profile.items.catJobs || 0}個</span>
              </div>
              <div className="bg-stone-850 p-2 rounded-lg border border-stone-800 flex justify-between">
                <span>🎯 スニャイパー</span>
                <span className="text-yellow-400">{profile.items.sniper || 0}個</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-950 p-3 flex items-center justify-between border-t border-stone-800">
          <button
            onClick={() => {
              onClose();
              onOpenGacha();
            }}
            className="bg-amber-600 hover:bg-amber-500 text-white font-black text-xs px-4 py-2 rounded-xl"
          >
            🎰 ガチャを引きに行く
          </button>
          <button
            onClick={onClose}
            className="bg-stone-800 hover:bg-stone-700 text-white font-black text-xs px-6 py-2 rounded-xl"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
