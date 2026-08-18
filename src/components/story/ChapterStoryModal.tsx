import React, { useState, useEffect, useRef } from 'react';
import { ChapterStory, CHAPTER_STORIES } from '../../data/stories';
import { UnitSpriteRenderer } from '../battle/UnitSpriteRenderer';
import { audio } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  X,
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Sparkles,
  Scroll,
  Trophy,
  ChevronRight,
  Cat,
} from 'lucide-react';

interface ChapterStoryModalProps {
  storyKey: string | null;
  onClose: () => void;
  onFinish?: () => void;
}

export const ChapterStoryModal: React.FC<ChapterStoryModalProps> = ({
  storyKey,
  onClose,
  onFinish,
}) => {
  const story: ChapterStory | undefined = storyKey ? CHAPTER_STORIES[storyKey] : undefined;

  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isFastForward, setIsFastForward] = useState<boolean>(false);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    if (!story) return;

    setScrollProgress(0);
    setIsPlaying(true);
    setIsFastForward(false);
    setHasReachedEnd(false);

    if (story.type === 'ending') {
      audio.playVictory();
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.4 },
      });
    } else {
      audio.playWorkerLevelUp();
    }
  }, [storyKey]);

  // Smooth auto-scrolling loop
  useEffect(() => {
    if (!story || !isPlaying || hasReachedEnd) return;

    let lastTimestamp = performance.now();

    const animateScroll = (now: number) => {
      const delta = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const maxScroll = container.scrollHeight - container.clientHeight;

        if (maxScroll > 0) {
          const speed = isFastForward ? 95 : 38; // px per second
          const nextScrollTop = container.scrollTop + speed * delta;

          if (nextScrollTop >= maxScroll - 2) {
            container.scrollTop = maxScroll;
            setScrollProgress(100);
            setHasReachedEnd(true);
            setIsPlaying(false);
            if (story.type === 'ending') {
              audio.playTreasureJingle('gold');
            }
          } else {
            container.scrollTop = nextScrollTop;
            const progress = (nextScrollTop / maxScroll) * 100;
            setScrollProgress(progress);
            requestRef.current = requestAnimationFrame(animateScroll);
          }
        }
      }
    };

    requestRef.current = requestAnimationFrame(animateScroll);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [story, isPlaying, isFastForward, hasReachedEnd]);

  if (!story) return null;

  // Manual scroll listener to sync progress
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll > 0) {
        const progress = Math.min(100, Math.max(0, (container.scrollTop / maxScroll) * 100));
        setScrollProgress(progress);
        if (progress >= 98 && !hasReachedEnd) {
          setHasReachedEnd(true);
        }
      }
    }
  };

  const handleSkipToEnd = () => {
    audio.playClick();
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTop = container.scrollHeight - container.clientHeight;
      setScrollProgress(100);
      setHasReachedEnd(true);
      setIsPlaying(false);
    }
  };

  const handleReplay = () => {
    audio.playClick();
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    setScrollProgress(0);
    setHasReachedEnd(false);
    setIsPlaying(true);
  };

  const handleFinish = () => {
    audio.playClick();
    onClose();
    if (onFinish) onFinish();
  };

  // Background visual themes
  const getBgStyle = () => {
    if (story.bgType === 'future') {
      return 'bg-gradient-to-b from-stone-950 via-cyan-950 to-stone-950 border-cyan-500/80';
    }
    if (story.bgType === 'cosmos') {
      return 'bg-gradient-to-b from-stone-950 via-purple-950 to-stone-950 border-purple-500/80';
    }
    return 'bg-gradient-to-b from-amber-950/95 via-stone-950 to-amber-950/95 border-amber-600/80';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn select-none font-['M_PLUS_Rounded_1c']">
      <div
        className={`relative w-full max-w-2xl h-[90vh] max-h-[720px] rounded-2xl shadow-2xl border-4 flex flex-col overflow-hidden text-white ${getBgStyle()}`}
      >
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
          {story.bgType === 'japan' && (
            <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px] animate-pulse" />
          )}
          {story.bgType === 'future' && (
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d4_1px,transparent_1px),linear-gradient(to_bottom,#06b6d4_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
          )}
          {story.bgType === 'cosmos' && (
            <div className="absolute inset-0 bg-[radial-gradient(#c084fc_1.5px,transparent_1.5px)] [background-size:20px_20px]" />
          )}
        </div>

        {/* Top Header Bar */}
        <div className="relative z-10 bg-black/60 border-b border-white/10 px-4 py-3 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-1.5 rounded-lg border flex items-center justify-center ${
                story.type === 'ending'
                  ? 'bg-amber-500/20 text-yellow-300 border-yellow-400'
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-400'
              }`}
            >
              {story.type === 'ending' ? <Trophy size={18} /> : <Scroll size={18} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-stone-200 border border-white/20">
                  {story.bannerBadge}
                </span>
                <span className="text-xs font-bold text-stone-400">{story.chapterName}</span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-amber-200 truncate">
                {story.title}
              </h2>
            </div>
          </div>

          {/* Close / Skip button */}
          <button
            id="btn-story-close"
            onClick={handleFinish}
            className="p-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-300 border border-stone-600 active:scale-95 transition-all"
            title="閉じる"
          >
            <X size={18} />
          </button>
        </div>

        {/* Story Scroll Content Area */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="relative z-10 flex-1 overflow-y-auto px-6 sm:px-12 py-10 space-y-8 scroll-smooth text-center"
        >
          {/* Story Intro Header */}
          <div className="pt-6 pb-4 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/40 text-amber-300 text-xs font-bold shadow-inner">
              <Sparkles size={14} className="text-amber-400" />
              <span>にゃんこ年代記</span>
            </div>

            <h1 className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400 drop-shadow">
              {story.subtitle}
            </h1>
          </div>

          {/* Mascots Display */}
          <div className="flex items-center justify-center gap-6 py-4">
            <div className="scale-110 drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
              <UnitSpriteRenderer
                spriteType={story.type === 'ending' ? 'cat_titan' : 'cat_basic'}
                isCat={true}
                state="walk"
                animTimer={1.2}
                scale={1.2}
              />
            </div>
            {story.type === 'ending' && (
              <div className="scale-110 drop-shadow-[0_0_12px_rgba(251,191,36,0.4)]">
                <UnitSpriteRenderer
                  spriteType="cat_dragon"
                  isCat={true}
                  state="attack"
                  animTimer={0.8}
                  scale={1.1}
                />
              </div>
            )}
          </div>

          {/* Story Lore Paragraphs */}
          <div className="space-y-6 max-w-xl mx-auto text-stone-200 font-medium text-sm sm:text-base leading-loose tracking-wide">
            {story.paragraphs.map((para, idx) => {
              const isEndingHighlight =
                story.type === 'ending' && idx >= story.paragraphs.length - 2;
              return (
                <p
                  key={idx}
                  className={`transition-all duration-300 ${
                    isEndingHighlight
                      ? 'text-base sm:text-lg font-black text-amber-300 scale-105 bg-amber-950/40 py-2.5 px-4 rounded-xl border border-amber-500/30'
                      : 'text-stone-100 drop-shadow'
                  }`}
                >
                  {para}
                </p>
              );
            })}
          </div>

          {/* End of Scroll Sign */}
          <div className="pt-10 pb-16 space-y-4">
            <div className="w-16 h-1 bg-amber-400/40 mx-auto rounded-full" />
            <p className="text-xs text-stone-400 font-bold">
              {story.type === 'ending' ? '― Complete ―' : '― To Be Continued into Battle ―'}
            </p>
            <button
              id="btn-story-continue"
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-sm border-2 border-yellow-200 shadow-xl active:scale-95 transition-all inline-flex items-center gap-2"
            >
              <span>{story.type === 'ending' ? 'マップへ戻る' : 'ステージへ出撃！'}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="relative z-10 bg-black/80 border-t border-white/10 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 backdrop-blur-md">
          {/* Scroll Progress Bar */}
          <div className="w-full sm:w-1/3 flex items-center gap-2 text-[10px] text-stone-400">
            <span>進行度</span>
            <div className="flex-1 bg-stone-800 rounded-full h-1.5 overflow-hidden border border-stone-700">
              <div
                className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-150"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>
            <span className="w-8 text-right font-mono">{Math.round(scrollProgress)}%</span>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            {/* Play / Pause */}
            <button
              id="btn-story-toggle-play"
              onClick={() => {
                audio.playClick();
                if (hasReachedEnd) {
                  handleReplay();
                } else {
                  setIsPlaying(!isPlaying);
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-bold flex items-center gap-1 border border-stone-700 active:scale-95"
            >
              {hasReachedEnd ? (
                <>
                  <RotateCcw size={12} />
                  <span>最初から</span>
                </>
              ) : isPlaying ? (
                <>
                  <Pause size={12} />
                  <span>一時停止</span>
                </>
              ) : (
                <>
                  <Play size={12} />
                  <span>再生</span>
                </>
              )}
            </button>

            {/* Fast Forward 2x */}
            <button
              id="btn-story-speed"
              onClick={() => {
                audio.playClick();
                setIsFastForward(!isFastForward);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all active:scale-95 ${
                isFastForward
                  ? 'bg-amber-500 text-stone-950 border-amber-300 font-black'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700 border-stone-700'
              }`}
            >
              <FastForward size={12} />
              <span>早送り x2</span>
            </button>

            {/* Skip */}
            <button
              id="btn-story-skip"
              onClick={handleSkipToEnd}
              className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold border border-stone-700 active:scale-95"
            >
              スキップ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
