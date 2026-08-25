import React, { useState, useEffect } from 'react';
import { X, Play, Square, Volume2, Music, Sparkles, Disc } from 'lucide-react';
import { audio, BGM_CATALOG, BgmTrackInfo, BgmTrack } from '../../utils/audio';

interface BgmJukeboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BgmJukeboxModal: React.FC<BgmJukeboxModalProps> = ({ isOpen, onClose }) => {
  const [selectedTrack, setSelectedTrack] = useState<BgmTrackInfo>(BGM_CATALOG[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      setIsPlaying(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: '全曲' },
    { id: 'main', label: 'メイン・日本編' },
    { id: 'battle', label: 'レジェンド・激戦' },
    { id: 'cosmos', label: '宇宙・次元' },
    { id: 'aku', label: '魔界・悪魔' },
    { id: 'ancient', label: '真レジェ・太古神話' },
    { id: 'advent', label: '降臨・暴風神' },
    { id: 'special', label: '特殊・エンディング' },
  ];

  const filteredTracks = activeCategory === 'all'
    ? BGM_CATALOG
    : BGM_CATALOG.filter((t) => t.category === activeCategory);

  const handlePlayTrack = (track: BgmTrackInfo) => {
    audio.playClick();
    setSelectedTrack(track);
    audio.switchBgm(track.id);
    setIsPlaying(true);
  };

  const handleStopBgm = () => {
    audio.playClick();
    audio.stopBgm();
    setIsPlaying(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        id="modal-bgm-jukebox"
        className="relative w-full max-w-4xl max-h-[92vh] bg-gradient-to-b from-[#241a14] via-[#1a120c] to-[#0d0906] border-4 border-[#e69500] rounded-3xl shadow-[0_0_35px_rgba(230,149,0,0.45)] flex flex-col overflow-hidden text-white font-['M_PLUS_Rounded_1c'] select-none"
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#593418] via-[#7d481f] to-[#593418] border-b-4 border-[#3a200e] px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 border-2 border-yellow-200 shadow-md flex items-center justify-center text-stone-950">
              <Disc className="animate-spin" size={24} />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-amber-200 tracking-wider flex items-center gap-2 drop-shadow">
                <span>にゃんこ サウンド鑑賞室</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-600/80 border border-yellow-300 text-yellow-100 font-bold">
                  BGM JUKEBOX
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-amber-100/80 font-bold">
                ゲーム内の多彩な名曲BGMをいつでも自由に再生・鑑賞できます
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-white border-2 border-stone-600 flex items-center justify-center transition-all shadow-md active:scale-95"
            title="閉じる"
          >
            <X size={20} />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="bg-[#19110b] px-4 py-2 border-b border-[#3d2716] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                audio.playClick();
                setActiveCategory(cat.id);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-black whitespace-nowrap transition-all border ${
                activeCategory === cat.id
                  ? 'bg-amber-500 text-stone-950 border-yellow-300 shadow-md font-black'
                  : 'bg-stone-900/80 text-stone-300 border-stone-700 hover:bg-stone-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row p-3 sm:p-5 gap-4">
          {/* Left: Track List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar max-h-[48vh] md:max-h-full">
            {filteredTracks.map((track) => {
              const isSelected = selectedTrack.id === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => handlePlayTrack(track)}
                  className={`group relative p-3 sm:p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-md ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-900/90 via-yellow-950/80 to-stone-900 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)] ring-1 ring-yellow-300'
                      : 'bg-[#2a1d14]/80 hover:bg-[#36251a] border-[#4a3321] text-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-yellow-400 text-stone-950 border-yellow-200 font-black'
                          : 'bg-stone-900 text-stone-400 border-stone-700'
                      }`}
                    >
                      {isSelected && isPlaying ? (
                        <div className="flex items-end gap-0.5 h-4">
                          <span className="w-1 bg-stone-950 h-3 animate-pulse" />
                          <span className="w-1 bg-stone-950 h-4 animate-bounce" />
                          <span className="w-1 bg-stone-950 h-2 animate-pulse" />
                        </div>
                      ) : (
                        <Music size={16} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-black/40 text-amber-300 border border-amber-900/50">
                          {track.category.toUpperCase()}
                        </span>
                        <span className="text-xs sm:text-sm font-black text-white truncate drop-shadow">
                          {track.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 truncate">{track.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayTrack(track);
                      }}
                      className={`p-2 rounded-xl font-black text-xs border flex items-center gap-1 transition-all ${
                        isSelected && isPlaying
                          ? 'bg-amber-400 text-stone-950 border-yellow-200 shadow'
                          : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                      }`}
                    >
                      <Play size={14} className={isSelected && isPlaying ? 'fill-stone-950' : ''} />
                      <span className="hidden sm:inline">再生</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Now Playing Disc Player & Track Lore */}
          <div className="w-full md:w-80 bg-gradient-to-b from-[#1f150e] to-[#120c08] border-2 border-[#452b19] rounded-2xl p-4 flex flex-col justify-between shadow-xl shrink-0">
            <div>
              {/* Disc Artwork */}
              <div className="relative w-full aspect-square max-w-[200px] mx-auto rounded-full bg-gradient-to-br from-stone-900 via-stone-800 to-black border-4 border-[#e69500] shadow-[0_0_20px_rgba(230,149,0,0.5)] flex items-center justify-center p-3 mb-4">
                <div
                  className={`w-full h-full rounded-full border-4 border-dashed border-amber-500/60 flex items-center justify-center bg-gradient-to-tr from-amber-950/40 via-stone-900 to-amber-950/40 ${
                    isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''
                  }`}
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 border-2 border-white shadow-inner flex items-center justify-center text-stone-950 font-black text-xs text-center p-1">
                    🐾 BGM
                  </div>
                </div>
                {/* Center hole */}
                <div className="absolute w-5 h-5 rounded-full bg-stone-950 border-2 border-stone-700" />
              </div>

              {/* Title & Description */}
              <div className="text-center space-y-1 mb-4">
                <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                  NOW PLAYING TRACK
                </div>
                <div className="text-base sm:text-lg font-black text-white drop-shadow">
                  {selectedTrack.title}
                </div>
                <div className="text-xs text-stone-300 font-bold leading-relaxed px-2 bg-stone-900/60 py-2 rounded-xl border border-stone-800">
                  {selectedTrack.description}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => handlePlayTrack(selectedTrack)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black text-sm border-2 border-yellow-200 shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <Play size={16} className="fill-stone-950" />
                  <span>再生</span>
                </button>

                <button
                  onClick={handleStopBgm}
                  className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-black text-sm border-2 border-stone-600 shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <Square size={16} />
                  <span>停止</span>
                </button>
              </div>

              <div className="text-[10px] text-center text-stone-400 font-bold">
                ※ Web Audio APIによりリアルタイムで迫力のBGMシンセシスが演奏されます
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
