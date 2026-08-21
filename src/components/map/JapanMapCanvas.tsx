import React, { useEffect, useRef, useState } from 'react';
import { StageDefinition, ChapterDefinition } from '../../types';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface JapanMapCanvasProps {
  chapter: ChapterDefinition;
  stages: StageDefinition[];
  selectedStageId: string;
  clearedStages: Record<string, any>;
  onSelectStage: (stage: StageDefinition) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export const JapanMapCanvas: React.FC<JapanMapCanvasProps> = ({
  chapter,
  stages,
  selectedStageId,
  clearedStages,
  onSelectStage,
  containerRef: externalContainerRef,
}) => {
  const localContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainer = externalContainerRef?.current || localContainerRef.current;
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const isJapan = chapter.category === 'japan' || chapter.id.startsWith('japan');
  const isFuture = chapter.category === 'future' || chapter.id.startsWith('future');
  const isCosmos = chapter.category === 'cosmos' || chapter.id.startsWith('cosmos');
  const isLegend = chapter.category === 'legend' || chapter.id.startsWith('legend');
  const isCrazed = chapter.category === 'crazed' || chapter.id.startsWith('crazed');

  const selectedStage = stages.find((s) => s.id === selectedStageId) || stages[0];

  // Auto-scroll to center on the selected stage
  useEffect(() => {
    if (!scrollContainer || !selectedStage) return;

    const timer = setTimeout(() => {
      const stagePixelX = ((selectedStage.mapX ?? 50) / 100) * 1400 + 80;
      const stagePixelY = ((selectedStage.mapY ?? 50) / 100) * 700 + 70;

      const viewportWidth = scrollContainer.clientWidth;
      const viewportHeight = scrollContainer.clientHeight;

      const targetScrollLeft = (stagePixelX * zoomLevel) - viewportWidth / 2;
      const targetScrollTop = (stagePixelY * zoomLevel) - viewportHeight / 2;

      scrollContainer.scrollTo({
        left: Math.max(0, targetScrollLeft),
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      });
    }, 80);

    return () => clearTimeout(timer);
  }, [selectedStageId, chapter.id, zoomLevel]);

  // Handle zoom changes
  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => {
      const next = Math.min(1.5, Math.max(0.65, prev + delta));
      return Math.round(next * 100) / 100;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  return (
    <div className="relative w-full h-full min-h-0 flex-1 overflow-hidden">
      {/* Zoom / View Control Floating Toolbar */}
      <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1.5 bg-stone-900/90 border border-amber-600/60 p-1.5 rounded-xl shadow-lg backdrop-blur-sm">
        <button
          onClick={() => handleZoom(0.15)}
          className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 active:scale-95 text-xs font-black"
          title="拡大 (+)"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => handleZoom(-0.15)}
          className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 active:scale-95 text-xs font-black"
          title="縮小 (-)"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={handleResetZoom}
          className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-black active:scale-95 flex items-center gap-1"
          title="倍率リセット"
        >
          <Maximize2 size={13} />
          <span>{Math.round(zoomLevel * 100)}%</span>
        </button>
      </div>

      {/* Main Scrollable Canvas Container */}
      <div
        ref={externalContainerRef || localContainerRef}
        className={`w-full h-full overflow-auto select-none cursor-grab active:cursor-grabbing touch-pan-x touch-pan-y ${
          isJapan
            ? 'bg-[#ded4bc]'
            : isFuture
            ? 'bg-[#0a1224]'
            : isCosmos
            ? 'bg-[#050510]'
            : isLegend
            ? 'bg-[#261d15]'
            : 'bg-[#18081f]'
        }`}
        style={{
          backgroundImage: isJapan
            ? `
              radial-gradient(#baa98a 1px, transparent 1px),
              linear-gradient(to right, rgba(186, 169, 138, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(186, 169, 138, 0.15) 1px, transparent 1px)
            `
            : isFuture
            ? `
              linear-gradient(to right, rgba(34, 211, 238, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(34, 211, 238, 0.1) 1px, transparent 1px)
            `
            : isCosmos
            ? `
              radial-gradient(white 1px, transparent 1px),
              radial-gradient(rgba(147, 51, 234, 0.4) 1px, transparent 1px)
            `
            : isLegend
            ? `
              radial-gradient(#d97706 1px, transparent 1px),
              linear-gradient(to right, rgba(217, 119, 6, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(217, 119, 6, 0.15) 1px, transparent 1px)
            `
            : `
              radial-gradient(#f43f5e 1.5px, transparent 1.5px),
              radial-gradient(rgba(168, 85, 247, 0.3) 1px, transparent 1px)
            `,
          backgroundSize: isJapan
            ? '40px 40px, 40px 40px, 40px 40px'
            : isFuture
            ? '50px 50px, 50px 50px'
            : isCosmos
            ? '80px 80px, 120px 120px'
            : isLegend
            ? '45px 45px, 45px 45px, 45px 45px'
            : '60px 60px, 90px 90px',
        }}
      >
        {/* Scaled Map Inner Area */}
        <div
          className="relative pointer-events-auto origin-top-left transition-transform duration-200"
          style={{
            width: `${1600 * zoomLevel}px`,
            height: `${850 * zoomLevel}px`,
            minWidth: `${1600 * zoomLevel}px`,
            minHeight: `${850 * zoomLevel}px`,
            transform: `scale(${zoomLevel})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Scrollable Stage Area: 1600px x 850px Base */}
          <div className="relative w-[1600px] h-[850px]">
            {/* Map Silhouette SVG */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 1600 850"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Japan Vintage Parchment / Land Gradient */}
                <linearGradient id="japanLandGrad" x1="0" y1="0" x2="1600" y2="850" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#d5c7a5" />
                  <stop offset="50%" stopColor="#cdbf9b" />
                  <stop offset="100%" stopColor="#c5b58d" />
                </linearGradient>

                <filter id="mapShadow" x="-5%" y="-5%" width="110%" height="110%">
                  <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="#8c7755" floodOpacity="0.4" />
                </filter>

                {/* Future Cyber Glow */}
                <filter id="neonGlow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Red Marker 3D Gradient */}
                <radialGradient id="marker3D" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#ff7b7b" />
                  <stop offset="40%" stopColor="#e61919" />
                  <stop offset="100%" stopColor="#800505" />
                </radialGradient>
              </defs>

              {/* JAPAN MAP LAND MASSES */}
              {isJapan && (
                <g filter="url(#mapShadow)">
                  {/* Kyushu Island */}
                  <path
                    d="M 220 540 Q 250 510 290 490 Q 340 500 370 530 Q 380 570 360 620 Q 340 680 320 730 Q 280 740 250 710 Q 230 650 210 600 Q 180 580 200 550 Z"
                    fill="url(#japanLandGrad)"
                    stroke="#b09f7a"
                    strokeWidth="3"
                  />
                  {/* Nagasaki Peninsula & Gotō Islands */}
                  <path
                    d="M 180 570 Q 160 590 170 630 Q 200 620 210 590 Z"
                    fill="url(#japanLandGrad)"
                    stroke="#b09f7a"
                    strokeWidth="2"
                  />
                  <circle cx="145" cy="550" r="10" fill="url(#japanLandGrad)" stroke="#b09f7a" strokeWidth="2" />
                  <circle cx="130" cy="580" r="12" fill="url(#japanLandGrad)" stroke="#b09f7a" strokeWidth="2" />

                  {/* Shikoku Island */}
                  <path
                d="M 450 580 Q 520 560 590 590 Q 610 630 580 660 Q 520 680 460 660 Q 430 620 450 580 Z"
                fill="url(#japanLandGrad)"
                stroke="#b09f7a"
                strokeWidth="3"
              />

              {/* Chugoku / Kansai / Chubu / Kanto / Tohoku (Honshu Main Land) */}
              <path
                d="M 380 470 Q 450 460 530 470 Q 620 490 680 520 Q 750 530 830 500 Q 900 480 970 440 Q 1020 380 1060 300 Q 1080 220 1060 160 Q 1030 150 1010 200 Q 980 280 930 350 Q 860 380 800 410 Q 730 420 660 410 Q 560 400 480 420 Q 410 430 380 470 Z"
                fill="url(#japanLandGrad)"
                stroke="#b09f7a"
                strokeWidth="4"
              />

              {/* Kanto Plain & Boso Peninsula detail */}
              <path
                d="M 850 490 Q 900 520 920 550 Q 910 580 880 570 Q 860 530 840 500 Z"
                fill="url(#japanLandGrad)"
                stroke="#b09f7a"
                strokeWidth="2"
              />

              {/* Hokkaido Island */}
              <path
                d="M 1040 120 Q 1120 70 1220 60 Q 1280 90 1270 150 Q 1220 200 1140 210 Q 1070 200 1050 160 Z"
                fill="url(#japanLandGrad)"
                stroke="#b09f7a"
                strokeWidth="4"
              />
              <path
                d="M 1030 160 Q 1000 190 1020 220 Q 1060 210 1060 180 Z"
                fill="url(#japanLandGrad)"
                stroke="#b09f7a"
                strokeWidth="2"
              />

              {/* Moon in Sky / Space Orbit (Stage 12) */}
              <g transform="translate(1320, 80)">
                <circle cx="0" cy="0" r="55" fill="#fef08a" stroke="#ca8a04" strokeWidth="4" />
                <circle cx="-15" cy="-10" r="12" fill="#fde047" opacity="0.6" />
                <circle cx="18" cy="15" r="16" fill="#fde047" opacity="0.6" />
                <circle cx="-5" cy="22" r="8" fill="#fde047" opacity="0.6" />
                <text x="0" y="5" textAnchor="middle" fill="#713f12" fontSize="14" fontWeight="900">
                  MOON
                </text>
              </g>

              {/* Japan Coastlines Waves / Vintage Compass Rose */}
              <g transform="translate(1400, 480)" opacity="0.4">
                <circle cx="0" cy="0" r="60" stroke="#8c7755" strokeWidth="2" strokeDasharray="6,4" />
                <polygon points="0,-75 12,-15 75,0 15,12 0,75 -12,15 -75,0 -15,-12" fill="#8c7755" />
                <text x="0" y="-85" textAnchor="middle" fill="#5c4c34" fontSize="18" fontWeight="900">
                  N
                </text>
              </g>
            </g>
          )}

          {/* FUTURE MAP (WORLD CYBER CONTINENTS) */}
          {isFuture && (
            <g>
              <path
                d="M 200 450 Q 300 400 450 480 Q 550 600 480 700 Q 300 720 220 580 Z"
                fill="#0f2942"
                stroke="#06b6d4"
                strokeWidth="3"
                filter="url(#neonGlow)"
              />
              <path
                d="M 650 300 Q 900 250 1100 350 Q 1200 500 1000 650 Q 800 600 700 450 Z"
                fill="#0f2942"
                stroke="#3b82f6"
                strokeWidth="3"
                filter="url(#neonGlow)"
              />
              <path
                d="M 1250 200 Q 1450 180 1500 320 Q 1420 450 1300 380 Z"
                fill="#0f2942"
                stroke="#a855f7"
                strokeWidth="3"
                filter="url(#neonGlow)"
              />
            </g>
          )}

          {/* COSMOS MAP (GALAXIES & NEBULA) */}
          {isCosmos && (
            <g>
              <ellipse cx="400" cy="450" rx="220" ry="140" fill="url(#cosmosNebula)" opacity="0.6" />
              <ellipse cx="1100" cy="350" rx="300" ry="180" fill="url(#cosmosNebula2)" opacity="0.6" />
            </g>
          )}

          {/* ROUTE CONNECTING DOTTED LINES */}
          <g>
            {stages.map((st, idx) => {
              if (idx === stages.length - 1) return null;
              const nextSt = stages[idx + 1];
              const x1 = ((st.mapX ?? 10) / 100) * 1400 + 80;
              const y1 = ((st.mapY ?? 50) / 100) * 700 + 70;
              const x2 = ((nextSt.mapX ?? 10) / 100) * 1400 + 80;
              const y2 = ((nextSt.mapY ?? 50) / 100) * 700 + 70;

              return (
                <line
                  key={`line-${st.id}-${nextSt.id}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isJapan ? '#ffffff' : '#38bdf8'}
                  strokeWidth="5"
                  strokeDasharray="6,8"
                  strokeLinecap="round"
                  opacity={0.85}
                  filter={
                    isJapan
                      ? 'drop-shadow(0px 2px 2px rgba(0,0,0,0.3))'
                      : 'drop-shadow(0px 0px 4px rgba(56,189,248,0.8))'
                  }
                />
              );
            })}
          </g>
        </svg>

        {/* STAGE MARKER BUTTONS */}
        {stages.map((st, idx) => {
          const posX = ((st.mapX ?? 10) / 100) * 1400 + 80;
          const posY = ((st.mapY ?? 50) / 100) * 700 + 70;
          const isSelected = st.id === selectedStageId;
          const isCleared = !!clearedStages[st.id];
          const prevStage = stages[idx - 1];
          const isUnlocked = idx === 0 || (prevStage && !!clearedStages[prevStage.id]);

          return (
            <div
              key={`stage-marker-${st.id}`}
              id={`marker-${st.id}`}
              onClick={() => onSelectStage(st)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
              style={{ left: `${posX}px`, top: `${posY}px` }}
            >
              {/* Selected Pulsing Ring */}
              {isSelected && (
                <div className="absolute -inset-3 rounded-full border-4 border-yellow-400 animate-ping opacity-75 pointer-events-none" />
              )}
              {isSelected && (
                <div className="absolute -inset-2 rounded-full border-2 border-amber-300 shadow-[0_0_15px_rgba(250,204,21,0.9)] pointer-events-none" />
              )}

              {/* 3D Marker Circle (Zombie-themed if zombie stage) */}
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-transform group-hover:scale-110 active:scale-95 ${
                  st.isZombieStage
                    ? isUnlocked
                      ? 'bg-gradient-to-br from-purple-500 via-purple-700 to-emerald-900 shadow-purple-950/80 ring-2 ring-purple-400'
                      : 'bg-stone-800 border-stone-600 opacity-60'
                    : isUnlocked
                    ? 'bg-gradient-to-br from-red-400 via-red-600 to-rose-900 shadow-rose-950/60 ring-2 ring-black/30'
                    : 'bg-stone-600 border-stone-400 opacity-60'
                }`}
              >
                {/* Inner Icon or Number */}
                {isCleared ? (
                  <span className="text-[11px] font-black text-yellow-300 drop-shadow">★</span>
                ) : st.isZombieStage ? (
                  <span className="text-[11px] font-black text-purple-200">🧟</span>
                ) : isUnlocked ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-white/90 shadow-inner" />
                ) : (
                  <span className="text-[9px] text-stone-300 font-bold">🔒</span>
                )}
              </div>

              {/* Stage Name Badge below marker */}
              <div
                className={`mt-1 text-[11px] sm:text-xs font-black px-2 py-0.5 rounded-md whitespace-nowrap shadow-md border text-center transition-all ${
                  isSelected
                    ? st.isZombieStage
                      ? 'bg-purple-950 text-purple-200 border-purple-400 scale-105 shadow-purple-500/30'
                      : 'bg-stone-900 text-amber-300 border-amber-400 scale-105 shadow-amber-500/30'
                    : st.isZombieStage
                    ? 'bg-purple-950/80 text-purple-300 border-purple-800 group-hover:bg-purple-900'
                    : 'bg-stone-900/80 text-stone-200 border-stone-700/80 group-hover:bg-stone-800'
                }`}
              >
                {st.name}
              </div>
            </div>
          );
        })}

        {/* CAT ON JETPLANE / MASCOT CURRENT LOCATION INDICATOR */}
        {selectedStage && (
          <div
            className="absolute z-20 pointer-events-none transition-all duration-500 ease-out flex flex-col items-center"
            style={{
              left: `${((selectedStage.mapX ?? 10) / 100) * 1400 + 80 - 65}px`,
              top: `${((selectedStage.mapY ?? 50) / 100) * 700 + 70 - 45}px`,
            }}
          >
            {/* Jetstar / Airplane Cat Mascot Animation */}
            <div className="animate-bounce duration-1000 flex items-center justify-center">
              <svg width="72" height="52" viewBox="0 0 100 70" fill="none">
                {/* Airplane Body */}
                <ellipse cx="50" cy="45" rx="35" ry="14" fill="#ffffff" stroke="#1c1917" strokeWidth="2.5" />
                {/* Jet Orange Tail */}
                <path d="M 18 45 L 8 20 L 25 22 L 30 45 Z" fill="#f97316" stroke="#1c1917" strokeWidth="2" />
                <path d="M 12 28 L 22 28" stroke="#ffffff" strokeWidth="2" />
                {/* Jet Wing */}
                <polygon points="40,48 55,62 70,48" fill="#f97316" stroke="#1c1917" strokeWidth="2" />
                {/* Jetstar Logo Text */}
                <text x="50" y="48" fontSize="8" fontWeight="900" fill="#f97316" textAnchor="middle">
                  ★JetCat
                </text>

                {/* Cute Cat Pilot on Top */}
                <circle cx="50" cy="24" r="14" fill="#ffffff" stroke="#1c1917" strokeWidth="2.5" />
                {/* Cat Ears */}
                <polygon points="39,18 43,8 48,15" fill="#ffffff" stroke="#1c1917" strokeWidth="2.5" />
                <polygon points="52,15 57,8 61,18" fill="#ffffff" stroke="#1c1917" strokeWidth="2.5" />
                {/* Cat Face */}
                <circle cx="45" cy="22" r="1.5" fill="#1c1917" />
                <circle cx="55" cy="22" r="1.5" fill="#1c1917" />
                <path d="M 48 26 Q 50 28 52 26" stroke="#1c1917" strokeWidth="1.5" fill="none" />
                {/* Whiskers */}
                <line x1="38" y1="23" x2="42" y2="24" stroke="#1c1917" strokeWidth="1.5" />
                <line x1="38" y1="27" x2="42" y2="26" stroke="#1c1917" strokeWidth="1.5" />
                <line x1="58" y1="24" x2="62" y2="23" stroke="#1c1917" strokeWidth="1.5" />
                <line x1="58" y1="26" x2="62" y2="27" stroke="#1c1917" strokeWidth="1.5" />
              </svg>
            </div>
            {/* Soft Shadow below plane */}
            <div className="w-10 h-2 bg-black/25 rounded-full blur-[1px] -mt-1" />
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};
