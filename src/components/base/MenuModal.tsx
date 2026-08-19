import React from 'react';
import { audio } from '../../utils/audio';
import { X, BookOpen, Volume2, Wrench, History, Compass, Trophy } from 'lucide-react';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTreasures: () => void;
  onOpenEncyclopedia: () => void;
  onOpenStorySelect: () => void;
  onOpenUpdateHistory: () => void;
  onOpenDevMode: () => void;
  onBackToTitle: () => void;
}

export const MenuModal: React.FC<MenuModalProps> = ({
  isOpen,
  onClose,
  onOpenTreasures,
  onOpenEncyclopedia,
  onOpenStorySelect,
  onOpenUpdateHistory,
  onOpenDevMode,
  onBackToTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-stone-900 border-4 border-amber-500 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-800 to-stone-900 p-4 border-b-2 border-amber-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📖</span>
            <h2 className="text-lg font-black text-white">メニュー一覧</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Buttons List */}
        <div className="p-4 space-y-2.5">
          {/* お宝ギャラリー */}
          <button
            onClick={() => {
              onClose();
              onOpenTreasures();
            }}
            className="w-full bg-gradient-to-r from-amber-900 to-amber-800 hover:brightness-110 border border-amber-500/80 p-3 rounded-2xl flex items-center justify-between text-left shadow text-white font-black text-sm"
          >
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span>🏆 お宝コレクション</span>
            </div>
            <span className="text-xs text-amber-300">開く →</span>
          </button>

          {/* にゃんこ図鑑 */}
          <button
            onClick={() => {
              onClose();
              onOpenEncyclopedia();
            }}
            className="w-full bg-gradient-to-r from-stone-800 to-stone-700 hover:brightness-110 border border-stone-600 p-3 rounded-2xl flex items-center justify-between text-left shadow text-white font-black text-sm"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-sky-400" />
              <span>📚 にゃんこ＆敵キャラ図鑑</span>
            </div>
            <span className="text-xs text-stone-400">開く →</span>
          </button>

          {/* ストーリー回想 */}
          <button
            onClick={() => {
              onClose();
              onOpenStorySelect();
            }}
            className="w-full bg-gradient-to-r from-stone-800 to-stone-700 hover:brightness-110 border border-stone-600 p-3 rounded-2xl flex items-center justify-between text-left shadow text-white font-black text-sm"
          >
            <div className="flex items-center gap-3">
              <Compass className="w-5 h-5 text-rose-400" />
              <span>📜 全章ストーリー回想（OP/ED）</span>
            </div>
            <span className="text-xs text-stone-400">開く →</span>
          </button>

          {/* アップデート履歴 */}
          <button
            onClick={() => {
              onClose();
              onOpenUpdateHistory();
            }}
            className="w-full bg-gradient-to-r from-stone-800 to-stone-700 hover:brightness-110 border border-stone-600 p-3 rounded-2xl flex items-center justify-between text-left shadow text-white font-black text-sm"
          >
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-emerald-400" />
              <span>📋 アップデート履歴</span>
            </div>
            <span className="text-xs text-stone-400">開く →</span>
          </button>

          {/* 開発者デバッグモード */}
          <button
            onClick={() => {
              onClose();
              onOpenDevMode();
            }}
            className="w-full bg-gradient-to-r from-purple-950 to-stone-850 hover:brightness-110 border border-purple-600 p-3 rounded-2xl flex items-center justify-between text-left shadow text-white font-black text-sm"
          >
            <div className="flex items-center gap-3">
              <Wrench className="w-5 h-5 text-purple-400" />
              <span>🛠️ デバッグ・無限機能</span>
            </div>
            <span className="text-xs text-purple-300">開く →</span>
          </button>

          {/* タイトルへ戻る */}
          <button
            onClick={() => {
              onClose();
              onBackToTitle();
            }}
            className="w-full bg-stone-950 hover:bg-stone-900 border border-stone-800 p-3 rounded-2xl flex items-center justify-center text-center shadow text-stone-400 hover:text-white font-black text-sm"
          >
            ↰ タイトル画面へ戻る
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
