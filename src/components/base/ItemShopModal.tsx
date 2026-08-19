import React from 'react';
import { PlayerProfile } from '../../types';
import { audio } from '../../utils/audio';
import { X, ShoppingBag } from 'lucide-react';

interface ItemShopModalProps {
  isOpen: boolean;
  profile: PlayerProfile;
  onClose: () => void;
  onUpdateProfile: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
}

export const ItemShopModal: React.FC<ItemShopModalProps> = ({
  isOpen,
  profile,
  onClose,
  onUpdateProfile,
}) => {
  if (!isOpen) return null;

  const buyItemWithCatFood = (itemKey: keyof PlayerProfile['items'], catFoodCost: number, count: number) => {
    if (profile.catFood < catFoodCost && !profile.devMode?.infiniteCatFood) {
      alert('ネコカンが足りないにゃ！');
      return;
    }
    audio.playWorkerLevelUp();
    onUpdateProfile((prev) => ({
      ...prev,
      catFood: prev.devMode?.infiniteCatFood ? prev.catFood : prev.catFood - catFoodCost,
      items: {
        ...prev.items,
        [itemKey]: (prev.items[itemKey] || 0) + count,
      },
    }));
  };

  const buyCatFoodWithXp = (xpCost: number, catFoodAmount: number) => {
    if (profile.xp < xpCost && !profile.devMode?.infiniteXp) {
      alert('経験値（XP）が足りないにゃ！ステージをクリアしてXPを貯めるにゃ！');
      return;
    }
    audio.playWorkerLevelUp();
    onUpdateProfile((prev) => ({
      ...prev,
      xp: prev.devMode?.infiniteXp ? prev.xp : prev.xp - xpCost,
      catFood: prev.catFood + catFoodAmount,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-stone-900 border-4 border-amber-500 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 p-4 border-b-2 border-amber-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-yellow-300" />
            <h2 className="text-xl font-black text-white tracking-wider">🛒 アイテムショップ</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Currency summary */}
        <div className="bg-stone-950 px-4 py-2 flex items-center justify-around border-b border-stone-800 text-sm font-bold">
          <div className="text-amber-400 flex items-center gap-1">
            <span>🥫 ネコカン:</span>
            <span className="font-mono text-base text-yellow-300 font-black">{profile.catFood}</span>
          </div>
          <div className="text-cyan-400 flex items-center gap-1">
            <span>✨ 経験値 (XP):</span>
            <span className="font-mono text-base text-yellow-300 font-black">{profile.xp.toLocaleString()}</span>
          </div>
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h3 className="text-sm font-black text-amber-300 mb-2">⚡ バトルお役立ちアイテム（ネコカンで購入）</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* スピードアップ */}
              <div className="bg-stone-850 border border-stone-700 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-white flex items-center gap-1">
                    <span>⏩ スピードアップ</span>
                    <span className="text-xs text-stone-400">×3</span>
                  </div>
                  <div className="text-[11px] text-stone-400">戦闘速度を2倍速に加速！</div>
                  <div className="text-[11px] text-yellow-400 mt-1">所持数: {profile.items.speedUp || 0}個</div>
                </div>
                <button
                  onClick={() => buyItemWithCatFood('speedUp', 30, 3)}
                  className="bg-gradient-to-b from-yellow-400 to-amber-600 hover:brightness-110 text-stone-950 font-black text-xs px-3 py-2 rounded-xl shadow border border-amber-300"
                >
                  🥫 30カン
                </button>
              </div>

              {/* ネコボン */}
              <div className="bg-stone-850 border border-stone-700 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-white flex items-center gap-1">
                    <span>🍖 ネコボン</span>
                    <span className="text-xs text-stone-400">×1</span>
                  </div>
                  <div className="text-[11px] text-stone-400">働きネコLv最大で出撃開始！</div>
                  <div className="text-[11px] text-yellow-400 mt-1">所持数: {profile.items.richCat || 0}個</div>
                </div>
                <button
                  onClick={() => buyItemWithCatFood('richCat', 50, 1)}
                  className="bg-gradient-to-b from-yellow-400 to-amber-600 hover:brightness-110 text-stone-950 font-black text-xs px-3 py-2 rounded-xl shadow border border-amber-300"
                >
                  🥫 50カン
                </button>
              </div>

              {/* トレジャーレーダー */}
              <div className="bg-stone-850 border border-stone-700 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-white flex items-center gap-1">
                    <span>📡 トレジャーレーダー</span>
                    <span className="text-xs text-stone-400">×1</span>
                  </div>
                  <div className="text-[11px] text-stone-400">最高のお宝を100%確定入手！</div>
                  <div className="text-[11px] text-yellow-400 mt-1">所持数: {profile.items.treasureRadar || 0}個</div>
                </div>
                <button
                  onClick={() => buyItemWithCatFood('treasureRadar', 90, 1)}
                  className="bg-gradient-to-b from-yellow-400 to-amber-600 hover:brightness-110 text-stone-950 font-black text-xs px-3 py-2 rounded-xl shadow border border-amber-300"
                >
                  🥫 90カン
                </button>
              </div>

              {/* ニャンピュータ */}
              <div className="bg-stone-850 border border-stone-700 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-white flex items-center gap-1">
                    <span>🤖 ニャンピュータ</span>
                    <span className="text-xs text-stone-400">×3</span>
                  </div>
                  <div className="text-[11px] text-stone-400">にゃんこ自動生産＆砲自動発射！</div>
                  <div className="text-[11px] text-yellow-400 mt-1">所持数: {profile.items.catCpu || 0}個</div>
                </div>
                <button
                  onClick={() => buyItemWithCatFood('catCpu', 40, 3)}
                  className="bg-gradient-to-b from-yellow-400 to-amber-600 hover:brightness-110 text-stone-950 font-black text-xs px-3 py-2 rounded-xl shadow border border-amber-300"
                >
                  🥫 40カン
                </button>
              </div>

              {/* おかめはちもく */}
              <div className="bg-stone-850 border border-stone-700 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-white flex items-center gap-1">
                    <span>🎭 おかめはちもく</span>
                    <span className="text-xs text-stone-400">×2</span>
                  </div>
                  <div className="text-[11px] text-stone-400">戦闘獲得XPが1.5倍にUP！</div>
                  <div className="text-[11px] text-yellow-400 mt-1">所持数: {profile.items.catJobs || 0}個</div>
                </div>
                <button
                  onClick={() => buyItemWithCatFood('catJobs', 35, 2)}
                  className="bg-gradient-to-b from-yellow-400 to-amber-600 hover:brightness-110 text-stone-950 font-black text-xs px-3 py-2 rounded-xl shadow border border-amber-300"
                >
                  🥫 35カン
                </button>
              </div>

              {/* スニャイパー */}
              <div className="bg-stone-850 border border-stone-700 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-white flex items-center gap-1">
                    <span>🎯 スニャイパー</span>
                    <span className="text-xs text-stone-400">×2</span>
                  </div>
                  <div className="text-[11px] text-stone-400">敵の最前線に定期狙撃＆ノックバック！</div>
                  <div className="text-[11px] text-yellow-400 mt-1">所持数: {profile.items.sniper || 0}個</div>
                </div>
                <button
                  onClick={() => buyItemWithCatFood('sniper', 45, 2)}
                  className="bg-gradient-to-b from-yellow-400 to-amber-600 hover:brightness-110 text-stone-950 font-black text-xs px-3 py-2 rounded-xl shadow border border-amber-300"
                >
                  🥫 45カン
                </button>
              </div>
            </div>
          </div>

          {/* XP 交換 ネコカン */}
          <div>
            <h3 className="text-sm font-black text-cyan-300 mb-2">💎 経験値（XP）でネコカンを交換</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-stone-850 border border-stone-700 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-white">🥫 ネコカン ×50</div>
                  <div className="text-[11px] text-stone-400">お試しネコカンパック</div>
                </div>
                <button
                  onClick={() => buyCatFoodWithXp(10000, 50)}
                  className="bg-gradient-to-b from-cyan-500 to-blue-600 hover:brightness-110 text-white font-black text-xs px-3 py-2 rounded-xl shadow border border-cyan-300"
                >
                  XP 10,000
                </button>
              </div>

              <div className="bg-stone-850 border border-stone-700 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-white">🥫 ネコカン ×150（ガチャ1回分）</div>
                  <div className="text-[11px] text-stone-400">レアガチャを1回引ける！</div>
                </div>
                <button
                  onClick={() => buyCatFoodWithXp(25000, 150)}
                  className="bg-gradient-to-b from-cyan-500 to-blue-600 hover:brightness-110 text-white font-black text-xs px-3 py-2 rounded-xl shadow border border-cyan-300"
                >
                  XP 25,000
                </button>
              </div>
            </div>
          </div>
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
