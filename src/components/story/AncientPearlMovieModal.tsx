import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, FastForward, Sparkles, AlertTriangle, Globe } from 'lucide-react';
import { audio } from '../../utils/audio';

interface AncientPearlMovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export const AncientPearlMovieModal: React.FC<AncientPearlMovieModalProps> = ({
  isOpen,
  onClose,
  onCompleted,
}) => {
  const [sceneIndex, setSceneIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [fadeAlpha, setFadeAlpha] = useState<number>(1);

  const scenes = [
    {
      title: '第1節：始原の調和「創世の古代真珠」',
      text: '遥か太古の昔――世界には、万物の調和と時空の理を司る神秘の秘宝『古代の真珠』が眠っていた。その碧き輝きは、古代の生命を育み、平穏を約束していた…',
      bgGradient: 'from-cyan-950 via-teal-950 to-slate-950',
      pearlColor: '#00f2fe',
      atmosphere: 'peaceful',
      effect: 'glow',
    },
    {
      title: '第2節：侵蝕の影「悪意による強奪」',
      text: 'しかし、暗黒の深淵より現れし何者かによって、古代の真珠は悪用されてしまう！呪詛の詠唱とともに、真珠の純粋なる魔力は禍々しい混沌の赤黒き力へと変貌を遂げた…！',
      bgGradient: 'from-purple-950 via-red-950 to-black',
      pearlColor: '#ff0055',
      atmosphere: 'corrupted',
      effect: 'dark_lightning',
    },
    {
      title: '第3節：太古崩壊「裂けゆく始原の世界」',
      text: '暴走した真珠の破滅の力は大地を灼き、空を裂き、古代の世界を粉々に破壊し尽くしていく！かつての緑豊かな原始の大地は、紅蓮の業火と天変地異の奈落へと呑み込まれた…',
      bgGradient: 'from-amber-950 via-red-950 to-stone-950',
      pearlColor: '#ff4500',
      atmosphere: 'cataclysm',
      effect: 'fire_storm',
    },
    {
      title: '第4節：現代消滅の危機「時空の裂け目」',
      text: '崩壊の余波は時空を超え、現代の世界へも侵蝕を開始！高層ビル群が歪み、街が虚無の闇へと消滅していく…！このままでは、過去も現在も、すべての世界が消え去ってしまう！',
      bgGradient: 'from-slate-950 via-indigo-950 to-purple-950',
      pearlColor: '#a855f7',
      atmosphere: 'modern_void',
      effect: 'void_rift',
    },
    {
      title: '第5節：にゃんこ軍団の誓い「真珠を救い出せ」',
      text: '世界の消滅を阻止する唯一の希望――それはにゃんこ軍団！時空を超えて真・レジェンドの最奥へ突き進み、悪用されし古代の真珠を取り戻し、世界を救うのだ！！',
      bgGradient: 'from-amber-900 via-yellow-950 to-black',
      pearlColor: '#eab308',
      atmosphere: 'heroic',
      effect: 'divine_light',
    },
  ];

  useEffect(() => {
    if (!isOpen) return;
    setSceneIndex(0);
    setIsPaused(false);
    audio.switchBgm('ancient_power');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isPaused) return;

    const timer = setTimeout(() => {
      if (sceneIndex < scenes.length - 1) {
        setFadeAlpha(0);
        setTimeout(() => {
          setSceneIndex((prev) => prev + 1);
          setFadeAlpha(1);
        }, 400);
      } else {
        // Finished
      }
    }, 6500);

    return () => clearTimeout(timer);
  }, [isOpen, sceneIndex, isPaused, scenes.length]);

  if (!isOpen) return null;

  const currentScene = scenes[sceneIndex];

  const handleNext = () => {
    audio.playClick();
    if (sceneIndex < scenes.length - 1) {
      setSceneIndex((prev) => prev + 1);
    } else {
      if (onCompleted) onCompleted();
      onClose();
    }
  };

  const handleRestart = () => {
    audio.playClick();
    setSceneIndex(0);
  };

  const handleSkip = () => {
    audio.playClick();
    if (onCompleted) onCompleted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg select-none font-['M_PLUS_Rounded_1c']">
      <div
        id="modal-ancient-pearl-movie"
        className={`relative w-full h-full max-w-6xl max-h-[92vh] flex flex-col justify-between overflow-hidden bg-gradient-to-b ${currentScene.bgGradient} border-4 border-[#e69500] rounded-3xl shadow-[0_0_60px_rgba(230,149,0,0.6)] text-white p-4 sm:p-8 transition-colors duration-1000`}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between z-20">
          <div className="flex items-center gap-2 bg-black/60 px-4 py-1.5 rounded-full border border-amber-500/40">
            <Sparkles className="text-yellow-400 animate-spin" size={16} />
            <span className="text-xs sm:text-sm font-black text-amber-200">
              特別ムービー：古代の真珠の記録 ({sceneIndex + 1}/{scenes.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused((p) => !p)}
              className="p-2 rounded-xl bg-black/60 hover:bg-black/80 border border-stone-700 text-stone-300 text-xs font-bold flex items-center gap-1 transition-all"
            >
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
              <span>{isPaused ? '再開' : '一時停止'}</span>
            </button>

            <button
              onClick={handleRestart}
              className="p-2 rounded-xl bg-black/60 hover:bg-black/80 border border-stone-700 text-stone-300 text-xs font-bold flex items-center gap-1 transition-all"
              title="最初から再生"
            >
              <RotateCcw size={14} />
            </button>

            <button
              onClick={handleSkip}
              className="px-4 py-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 border-2 border-stone-600 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <FastForward size={16} />
              <span>スキップ</span>
            </button>
          </div>
        </div>

        {/* Center Animated Stage & Dynamic Visuals */}
        <div className="relative flex-1 flex flex-col items-center justify-center my-4 overflow-hidden">
          {/* Ambient Particles / Energy Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Pulsing Aura */}
            <div
              className="w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-40 animate-pulse transition-all duration-1000"
              style={{ backgroundColor: currentScene.pearlColor }}
            />
            {/* Spinning Ring */}
            <div className="absolute w-80 h-80 sm:w-[420px] sm:h-[420px] rounded-full border-2 border-dashed border-white/20 animate-[spin_20s_linear_infinite]" />
          </div>

          {/* Central Ancient Pearl Graphic */}
          <div className="relative z-10 flex flex-col items-center justify-center transition-all duration-700 transform scale-100 hover:scale-105">
            <div
              className="relative w-36 h-36 sm:w-48 sm:h-48 rounded-full border-4 border-white/90 shadow-[0_0_50px_rgba(255,255,255,0.8)] flex items-center justify-center transition-all duration-1000"
              style={{
                boxShadow: `0 0 60px ${currentScene.pearlColor}, inset 0 0 40px ${currentScene.pearlColor}`,
                background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${currentScene.pearlColor} 70%, #000000 100%)`,
              }}
            >
              {/* Pearl Core Magic Glyphs */}
              <div className="text-3xl sm:text-4xl opacity-90 animate-bounce">
                {sceneIndex === 0 && '✨'}
                {sceneIndex === 1 && '😈'}
                {sceneIndex === 2 && '🌋'}
                {sceneIndex === 3 && '🌪️'}
                {sceneIndex === 4 && '👑'}
              </div>
            </div>

            {/* Stage Title */}
            <div className="mt-6 text-center">
              <span className="px-4 py-1 rounded-full bg-black/60 border border-yellow-500/60 text-xs sm:text-sm font-black text-amber-300 shadow-md">
                {currentScene.title}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Cinematic Subtitle Box */}
        <div className="relative z-20 bg-black/80 border-2 sm:border-4 border-[#e69500] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md">
          <div className="min-h-[70px] sm:min-h-[90px] flex items-center justify-center text-center">
            <p className="text-sm sm:text-lg md:text-xl font-black text-amber-100 leading-relaxed drop-shadow tracking-wide">
              {currentScene.text}
            </p>
          </div>

          {/* Progress Indicators & Navigation */}
          <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {scenes.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setSceneIndex(idx)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    idx === sceneIndex
                      ? 'w-8 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                      : idx < sceneIndex
                      ? 'w-3 bg-amber-600'
                      : 'w-2.5 bg-stone-700'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black text-xs sm:text-sm border-2 border-yellow-200 shadow-md active:scale-95 transition-all flex items-center gap-1"
            >
              <span>{sceneIndex < scenes.length - 1 ? '次へ進む ▶' : 'ムービー終了 (出撃へ) ⚔️'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
