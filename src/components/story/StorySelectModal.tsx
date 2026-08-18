import React from 'react';
import { PlayerProfile } from '../../types';
import { CHAPTER_STORIES } from '../../data/stories';
import { audio } from '../../utils/audio';
import { X, Play, Lock, BookOpen, Sparkles, Trophy } from 'lucide-react';

interface StorySelectModalProps {
  isOpen: boolean;
  profile: PlayerProfile;
  onClose: () => void;
  onSelectStory: (storyKey: string) => void;
}

export const StorySelectModal: React.FC<StorySelectModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSelectStory,
}) => {
  if (!isOpen) return null;

  // Unlocking rules:
  // Japan Opening: always available
  // Japan Ending: cleared japan_12 (or dev mode)
  // Future Opening: cleared japan_12 (or dev mode)
  // Future Ending: cleared future_3 (or dev mode)
  // Cosmos Opening: cleared future_3 (or dev mode)
  // Cosmos Ending: cleared cosmos_3 (or dev mode)
  const isDevUnlocked = !!profile.devMode?.unlocked;

  const isJapanEndingUnlocked =
    isDevUnlocked ||
    !!profile.clearedStages['japan_1_5'] ||
    !!profile.clearedStages['japan_3_3'] ||
    !!profile.clearedStages['japan_12'] ||
    !!profile.clearedStages['japan_6'];

  const isFutureOpeningUnlocked = isDevUnlocked || isJapanEndingUnlocked;

  const isFutureEndingUnlocked =
    isDevUnlocked ||
    !!profile.clearedStages['future_3_3'] ||
    !!profile.clearedStages['future_3'];

  const isCosmosOpeningUnlocked = isDevUnlocked || isFutureEndingUnlocked;

  const isCosmosEndingUnlocked =
    isDevUnlocked ||
    !!profile.clearedStages['cosmos_3_3'] ||
    !!profile.clearedStages['cosmos_3'] ||
    !!profile.clearedStages['cosmos_2'];

  const storyItems = [
    {
      key: 'japan_opening',
      chapter: '第1章 日本編',
      type: 'オープニング (OP)',
      unlocked: true,
      condition: '初期解放',
      badgeColor: 'from-amber-600 to-yellow-600',
    },
    {
      key: 'japan_ending',
      chapter: '第1章 日本編',
      type: 'エンディング (ED)',
      unlocked: isJapanEndingUnlocked,
      condition: '日本編 月面クリアで解放',
      badgeColor: 'from-amber-700 to-rose-700',
    },
    {
      key: 'future_opening',
      chapter: '第2章 未来編',
      type: 'オープニング (OP)',
      unlocked: isFutureOpeningUnlocked,
      condition: '日本編クリアで解放',
      badgeColor: 'from-cyan-600 to-blue-600',
    },
    {
      key: 'future_ending',
      chapter: '第2章 未来編',
      type: 'エンディング (ED)',
      unlocked: isFutureEndingUnlocked,
      condition: '未来編 ニューヨーククリアで解放',
      badgeColor: 'from-cyan-700 to-indigo-700',
    },
    {
      key: 'cosmos_opening',
      chapter: '第3章 宇宙編',
      type: 'オープニング (OP)',
      unlocked: isCosmosOpeningUnlocked,
      condition: '未来編クリアで解放',
      badgeColor: 'from-purple-600 to-violet-600',
    },
    {
      key: 'cosmos_ending',
      chapter: '第3章 宇宙編',
      type: 'エンディング (ED)',
      unlocked: isCosmosEndingUnlocked,
      condition: '宇宙編 ビッグバンクリアで解放',
      badgeColor: 'from-purple-700 to-pink-700',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-stone-900 border-4 border-amber-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white font-['M_PLUS_Rounded_1c']">
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-950 via-amber-950/60 to-stone-950 border-b-2 border-amber-500/60 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-1.5">
                <span>ストーリーシアター (STORY THEATER)</span>
              </h2>
              <p className="text-[10px] text-stone-400">各章のオープニング＆エンディング巻物シアター</p>
            </div>
          </div>

          <button
            id="btn-close-story-select"
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 active:scale-95 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* List of Stories */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {storyItems.map((item) => {
              const story = CHAPTER_STORIES[item.key];
              if (!story) return null;

              return (
                <div
                  key={item.key}
                  className={`p-3.5 rounded-xl border-2 flex flex-col justify-between transition-all ${
                    item.unlocked
                      ? 'bg-stone-950 border-stone-700 hover:border-amber-400 hover:shadow-lg'
                      : 'bg-stone-950/60 border-stone-800 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-stone-800 text-amber-400 border border-stone-700">
                        {item.chapter}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded text-white bg-gradient-to-r ${item.badgeColor}`}
                      >
                        {item.type}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-white line-clamp-1">
                      {story.title}
                    </h3>
                    <p className="text-[11px] text-stone-400 line-clamp-2 mt-1 leading-snug">
                      {story.subtitle}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-stone-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-stone-500 font-bold">
                      {item.unlocked ? '視聴可能' : item.condition}
                    </span>

                    {item.unlocked ? (
                      <button
                        id={`btn-play-story-${item.key}`}
                        onClick={() => {
                          audio.playClick();
                          onSelectStory(item.key);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black flex items-center gap-1 shadow active:scale-95 transition-all"
                      >
                        <Play size={12} className="fill-current" />
                        <span>再生する</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] text-stone-600 font-bold px-2 py-1 bg-stone-900 rounded">
                        <Lock size={12} />
                        <span>ロック</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
