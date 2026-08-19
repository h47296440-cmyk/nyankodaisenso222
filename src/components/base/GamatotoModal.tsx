import React, { useState } from 'react';
import { PlayerProfile } from '../../types';
import { audio } from '../../utils/audio';
import { X, Sparkles, Compass } from 'lucide-react';

interface GamatotoModalProps {
  isOpen: boolean;
  profile: PlayerProfile;
  onClose: () => void;
  onUpdateProfile: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
}

export const GamatotoModal: React.FC<GamatotoModalProps> = ({
  isOpen,
  profile,
  onClose,
  onUpdateProfile,
}) => {
  const [isExploring, setIsExploring] = useState(false);
  const [lastFound, setLastFound] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartExpedition = () => {
    setIsExploring(true);
    setLastFound(null);
    audio.playWorkerLevelUp();

    setTimeout(() => {
      setIsExploring(false);
      const randomRewards = [
        { xp: 5000, catFood: 10, item: 'speedUp', text: '5,000 XP と ネコカン10缶、スピードアップ' },
        { xp: 12000, catFood: 25, item: 'richCat', text: '12,000 XP と ネコカン25缶、ネコボン' },
        { xp: 8000, catFood: 15, item: 'treasureRadar', text: '8,000 XP と ネコカン15缶、トレジャーレーダー' },
        { xp: 20000, catFood: 50, item: 'catCpu', text: '20,000 XP と ネコカン50缶、ニャンピュータ' },
      ];
      const selected = randomRewards[Math.floor(Math.random() * randomRewards.length)];
      audio.playVictory();
      setLastFound(selected.text);

      onUpdateProfile((prev) => ({
        ...prev,
        xp: prev.xp + selected.xp,
        catFood: prev.catFood + selected.catFood,
        items: {
          ...prev.items,
          [selected.item]: (prev.items[selected.item as keyof PlayerProfile['items']] || 0) + 1,
        },
      }));
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-stone-900 border-4 border-amber-500 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 to-amber-900 p-4 border-b-2 border-amber-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⛏️</span>
            <div>
              <h2 className="text-lg font-black text-white">ガマトト探検隊</h2>
              <p className="text-[11px] text-amber-200">洞窟や古代遺跡を探検してXPやお宝を発掘！</p>
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
        <div className="p-6 text-center space-y-4">
          <div className="w-24 h-24 mx-auto rounded-full bg-amber-950/70 border-3 border-amber-400 flex items-center justify-center shadow-inner">
            <span className={`text-5xl ${isExploring ? 'animate-spin' : 'animate-bounce'}`}>
              ⛏️
            </span>
          </div>

          <div className="text-sm font-bold text-stone-200">
            {isExploring ? (
              <span className="text-yellow-300 font-black animate-pulse">ガマトトが洞窟を採掘中だにゃ…</span>
            ) : lastFound ? (
              <div className="bg-emerald-950/80 border border-emerald-500 rounded-2xl p-3 text-emerald-200">
                <div className="text-xs font-bold text-emerald-400 mb-1">🎉 発掘大成功！</div>
                <div className="text-sm font-black text-white">{lastFound} をゲットしたにゃ！</div>
              </div>
            ) : (
              <span>ガマトトを探検に出発させてXPやネコカン、アイテムを探すにゃ！</span>
            )}
          </div>

          <button
            disabled={isExploring}
            onClick={handleStartExpedition}
            className={`w-full py-3.5 rounded-2xl font-black text-base tracking-wider shadow-xl border-2 transition-all ${
              isExploring
                ? 'bg-stone-700 text-stone-400 border-stone-600 cursor-not-allowed'
                : 'bg-gradient-to-b from-yellow-400 to-amber-500 hover:brightness-110 text-stone-950 border-yellow-200 active:scale-95'
            }`}
          >
            {isExploring ? '探検中…' : '⛏️ 探検に出発する！！'}
          </button>
        </div>

        {/* Footer */}
        <div className="bg-stone-950 p-3 text-center border-t border-stone-800">
          <button
            onClick={onClose}
            className="bg-stone-800 hover:bg-stone-700 text-white font-black text-sm px-6 py-2 rounded-xl"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
