import React from 'react';
import { audio } from '../../utils/audio';
import { X, BookOpen, Volume2, Wrench, History, Compass, Trophy, Gift, Target } from 'lucide-react';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAnnouncements?: () => void;
  onOpenTreasures: () => void;
  onOpenEncyclopedia: () => void;
  onOpenStorySelect: () => void;
  onOpenUpdateHistory: () => void;
  onOpenDevMode: () => void;
  onOpenMissions: () => void;
  onOpenRecords?: () => void;
  onOpenBgm?: () => void;
  onOpenAncientPearlMovie?: () => void;
  onOpenGiftCode: () => void;
  onBackToTitle: () => void;
}

export const MenuModal: React.FC<MenuModalProps> = ({
  isOpen,
  onClose,
  onOpenAnnouncements,
  onOpenTreasures,
  onOpenEncyclopedia,
  onOpenStorySelect,
  onOpenUpdateHistory,
  onOpenDevMode,
  onOpenMissions,
  onOpenRecords,
  onOpenBgm,
  onOpenAncientPearlMovie,
  onOpenGiftCode,
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
        <div className="p-4 space-y-2.5 max-h-[75vh] overflow-y-auto">
          {/* お知らせ (NEWS) */}
          <button
            id="menu-btn-announcements"
            onClick={() => {
              onClose();
              if (onOpenAnnouncements) onOpenAnnouncements();
            }}
            className="w-full bg-gradient-to-r from-red-800 via-amber-800 to-yellow-800 hover:brightness-110 border-2 border-yellow-400 p-3 rounded-2xl flex items-center justify-between text-left shadow text-white font-black text-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl animate-bounce">🔔</span>
              <span>🔔 お知らせ (レジェンド終結＆魔界編)</span>
            </div>
            <span className="text-xs bg-red-600 px-2 py-0.5 rounded-full font-black">特報 →</span>
          </button>

          {/* ミッション＆実績 */}
          <button
            id="menu-btn-missions"
            onClick={() => {
              onClose();
              onOpenMissions();
            }}
            className="w-full bg-gradient-to-r from-yellow-700 to-amber-700 hover:brightness-110 border border-yellow-400 p-3 rounded-2xl flex items-center justify-between text-left shadow text-white font-black text-sm"
          >
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-yellow-300 animate-pulse" />
              <span>🎯 ミッション＆実績</span>
            </div>
            <span className="text-xs text-yellow-200">報酬受取 →</span>
          </button>

          {/* 戦歴と記録 (Records) */}
          <button
            id="menu-btn-records"
            onClick={() => {
              onClose();
              if (onOpenRecords) onOpenRecords();
            }}
            className="w-full bg-gradient-to-r from-teal-800 to-emerald-800 hover:brightness-110 border-2 border-emerald-400 p-3 rounded-2xl flex items-center justify-between text-left shadow text-white font-black text-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📊</span>
              <span>📊 戦歴と記録 (プレイ時間・出撃数・総支出)</span>
            </div>
            <span className="text-xs bg-emerald-600 px-2 py-0.5 rounded-full font-black text-emerald-100">記録 →</span>
          </button>

          {/* サウンド鑑賞室 (BGM Jukebox) */}
          <button
            id="menu-btn-bgm-jukebox"
            onClick={() => {
              onClose();
              if (onOpenBgm) onOpenBgm();
            }}
            className="w-full bg-gradient-to-r from-purple-800 via-indigo-900 to-stone-800 hover:brightness-110 border-2 border-purple-400 p-3 rounded-2xl flex items-center justify-between text-left shadow text-white font-black text-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🎵</span>
              <span>🎵 にゃんこ サウンド鑑賞室 (BGM全曲)</span>
            </div>
            <span className="text-xs bg-purple-600 px-2 py-0.5 rounded-full font-black text-purple-100">試聴 →</span>
          </button>

          {/* 古代の真珠ムービー */}
          <button
            id="menu-btn-ancient-pearl-movie"
            onClick={() => {
              onClose();
              if (onOpenAncientPearlMovie) onOpenAncientPearlMovie();
            }}
            className="w-full bg-gradient-to-r from-cyan-900 via-blue-950 to-stone-900 hover:brightness-110 border-2 border-cyan-400 p-3 rounded-2xl flex items-center justify-between text-left shadow text-white font-black text-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🎬</span>
              <span>🎬 特別アニメ：古代の真珠の記憶</span>
            </div>
            <span className="text-xs bg-cyan-600 px-2 py-0.5 rounded-full font-black text-cyan-100">上映 →</span>
          </button>

          {/* プレゼントコード */}
          <button
            id="menu-btn-gift-code"
            onClick={() => {
              onClose();
              onOpenGiftCode();
            }}
            className="w-full bg-gradient-to-r from-pink-800 to-rose-700 hover:brightness-110 border border-pink-400 p-3 rounded-2xl flex items-center justify-between text-left shadow text-white font-black text-sm"
          >
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-pink-300 animate-bounce" />
              <span>🎁 プレゼントコード入力</span>
            </div>
            <span className="text-xs text-pink-200">受取 →</span>
          </button>

          {/* お宝ギャラリー */}
          <button
            id="menu-btn-treasures"
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
            id="menu-btn-encyclopedia"
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
            id="menu-btn-story"
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
            id="menu-btn-history"
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
            id="menu-btn-dev"
            onClick={() => {
              onClose();
              onOpenDevMode();
            }}
            className="w-full bg-gradient-to-r from-purple-950 to-stone-850 hover:brightness-110 border border-purple-600 p-3 rounded-2xl flex items-center justify-between text-left shadow text-white font-black text-sm"
          >
            <div className="flex items-center gap-3">
              <Wrench className="w-5 h-5 text-purple-400" />
              <span>🛠️ 開発者モード・配布コード一覧</span>
            </div>
            <span className="text-xs text-purple-300">開く →</span>
          </button>

          {/* タイトルへ戻る */}
          <button
            id="menu-btn-back-title"
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

