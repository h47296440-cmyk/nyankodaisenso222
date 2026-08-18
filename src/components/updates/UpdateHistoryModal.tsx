import React from 'react';
import { UPDATE_HISTORY, UpdateEntry } from '../../data/updates';
import { X, Sparkles, Wrench, RefreshCw, Layout, History, CheckCircle2 } from 'lucide-react';
import { audio } from '../../utils/audio';

interface UpdateHistoryModalProps {
  onClose: () => void;
}

export const UpdateHistoryModal: React.FC<UpdateHistoryModalProps> = ({ onClose }) => {
  const getCategoryBadge = (type: string) => {
    switch (type) {
      case 'feature':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500">
            <Sparkles size={12} /> 新機能・追加
          </span>
        );
      case 'fix':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500">
            <Wrench size={12} /> 不具合修正
          </span>
        );
      case 'ui':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-500">
            <Layout size={12} /> UI・画面改善
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500">
            <RefreshCw size={12} /> バランス調整
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        id="modal-update-history"
        className="relative w-full max-w-2xl max-h-[85vh] bg-stone-900 border-2 border-amber-500/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white font-['M_PLUS_Rounded_1c']"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-amber-950/40 to-stone-900 px-5 py-3.5 border-b border-stone-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-yellow-400 border border-amber-500/40">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-amber-300">アップデート履歴</h2>
              <p className="text-xs text-stone-400 font-bold">これまでの更新内容と改善履歴一覧</p>
            </div>
          </div>

          <button
            id="btn-close-update-history"
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Update Entries */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 divide-y divide-stone-800">
          {UPDATE_HISTORY.map((entry, index) => (
            <div key={entry.version} className={index > 0 ? 'pt-6' : ''}>
              {/* Version & Date banner */}
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-black px-2.5 py-0.5 rounded-lg bg-amber-500 text-stone-950 shadow">
                    {entry.version}
                  </span>
                  {entry.isLatest && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                      最新バージョン
                    </span>
                  )}
                  <h3 className="text-sm sm:text-base font-black text-white">{entry.title}</h3>
                </div>
                <span className="text-xs font-mono text-stone-400 bg-stone-800 px-2 py-0.5 rounded">
                  {entry.date}
                </span>
              </div>

              {/* Categories and detail bullets */}
              <div className="space-y-4 ml-1">
                {entry.categories.map((cat, catIdx) => (
                  <div key={catIdx} className="bg-stone-950/60 rounded-xl p-3.5 border border-stone-800/80">
                    <div className="flex items-center gap-2 mb-2">
                      {getCategoryBadge(cat.type)}
                      <span className="text-xs font-bold text-stone-300">{cat.title}</span>
                    </div>

                    <ul className="space-y-1.5 ml-2">
                      {cat.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-2 text-xs text-stone-300 leading-relaxed">
                          <CheckCircle2 size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-stone-950 px-5 py-3 border-t border-stone-800 flex justify-end items-center">
          <button
            id="btn-confirm-update-history"
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs sm:text-sm transition-all shadow-md active:scale-95"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
