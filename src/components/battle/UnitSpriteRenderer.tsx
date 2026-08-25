import React from 'react';

interface UnitSpriteProps {
  spriteType: string;
  isCat: boolean;
  state: 'walk' | 'attack' | 'knockback' | 'die' | 'burrow' | 'revive';
  animTimer: number;
  scale?: number;
  isAttackingWindup?: boolean;
  isFrozen?: boolean;
  isSlowed?: boolean;
  isWeakened?: boolean;
  isBurrowing?: boolean;
  isReviving?: boolean;
}

export const UnitSpriteRenderer: React.FC<UnitSpriteProps> = React.memo(({
  spriteType,
  isCat,
  state,
  animTimer,
  scale = 1.0,
  isAttackingWindup = false,
  isFrozen = false,
  isSlowed = false,
  isWeakened = false,
  isBurrowing = false,
  isReviving = false,
}) => {
  const safeTimer = isFinite(animTimer) ? animTimer : 0;
  const safeScale = isFinite(scale) && scale > 0 ? scale : 1.0;

  // Rich physics and organic squash-stretch calculations
  const walkPhase = safeTimer * 10.5;
  const walkCycle = isFrozen ? 0 : Math.sin(walkPhase);
  const bounceY = (state === 'walk' && !isFrozen) ? Math.abs(Math.sin(walkPhase)) * 5.5 : 0;
  const walkSquashX = (state === 'walk' && !isFrozen) ? 1 + Math.sin(walkPhase * 2) * 0.04 : 1;
  const walkSquashY = (state === 'walk' && !isFrozen) ? 1 - Math.sin(walkPhase * 2) * 0.04 : 1;
  const walkTilt = (state === 'walk' && !isFrozen) ? Math.sin(walkPhase) * 3.5 : 0;

  // Attack windup tension vs explosive strike lunge
  let attackTilt = 0;
  let attackTranslateX = 0;
  let attackTranslateY = 0;
  let attackScaleX = 1;
  let attackScaleY = 1;

  if (isAttackingWindup && !isFrozen) {
    // Deep breath & pull-back anticipation
    const tremor = Math.sin(safeTimer * 45) * 2;
    attackTilt = isCat ? -16 : 16;
    attackTranslateX = (isCat ? -10 : 10) + tremor;
    attackTranslateY = -4;
    attackScaleX = 0.92;
    attackScaleY = 1.12;
  } else if (state === 'attack' && !isFrozen) {
    // Explosive forward strike snap
    attackTilt = isCat ? 22 : -22;
    attackTranslateX = isCat ? 18 : -18;
    attackTranslateY = 2;
    attackScaleX = 1.22;
    attackScaleY = 0.84;
  }

  // Knockback tumbling arc
  let knockbackRot = 0;
  let knockbackElevY = 0;
  if (state === 'knockback') {
    const kbProgress = Math.min(1.0, safeTimer / 0.4);
    knockbackElevY = Math.sin(kbProgress * Math.PI) * 26;
    knockbackRot = (isCat ? -1 : 1) * Math.sin(kbProgress * Math.PI * 0.8) * 35;
  }

  const dieOpacity = state === 'die' ? Math.max(0, 1 - safeTimer * 2.5) : 1;
  const facingTransform = isCat ? 'scaleX(1)' : 'scaleX(-1)';

  const finalScaleX = safeScale * walkSquashX * attackScaleX;
  const finalScaleY = isBurrowing ? safeScale * 0.35 : (isReviving ? safeScale * 0.6 : safeScale * walkSquashY * attackScaleY);
  const finalRot = walkTilt + attackTilt + knockbackRot;
  const finalY = isBurrowing ? 18 : -(bounceY + attackTranslateY + knockbackElevY);

  return (
    <div className="relative flex flex-col items-center justify-center pointer-events-none select-none will-change-transform">
      {/* Dynamic Ground Shadow */}
      <div
        className="absolute -bottom-1 bg-black/35 rounded-full blur-[1px] transition-all"
        style={{
          width: `${36 * safeScale}px`,
          height: `${10 * safeScale}px`,
          transform: `scale(${Math.max(0.4, 1 - (bounceY + knockbackElevY) * 0.025)})`,
          opacity: Math.max(0.2, 0.4 - (bounceY + knockbackElevY) * 0.01),
        }}
      />

      {/* Main Animated Unit Sprite */}
      <div
        style={{
          transform: `${facingTransform} scale(${finalScaleX}, ${finalScaleY}) rotate(${finalRot}deg) translate(${attackTranslateX}px, ${finalY}px)`,
          opacity: isBurrowing ? 0.65 : (isReviving ? 0.75 : dieOpacity),
          filter: isFrozen
            ? 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.9)) brightness(1.2) hue-rotate(170deg)'
            : isSlowed
            ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.75)) sepia(0.5)'
            : isWeakened
            ? 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.8)) opacity(0.8)'
            : isAttackingWindup
            ? 'drop-shadow(0 0 6px rgba(250, 204, 21, 0.65))'
            : state === 'knockback'
            ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.7))'
            : 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.25))',
          transition: 'filter 0.15s ease',
        }}
      >
        {renderSpriteSvg(spriteType, walkCycle, isAttackingWindup || state === 'attack', safeTimer)}
      </div>

      {/* Status Overlays */}
      {isFrozen && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 border-2 border-sky-300 bg-sky-400/25 rounded-lg rotate-45 animate-pulse" />
          <span className="absolute -top-3 text-xs">❄️</span>
        </div>
      )}

      {isSlowed && (
        <div className="absolute -top-4 right-0 pointer-events-none flex items-center gap-0.5 animate-bounce">
          <span className="text-xs bg-amber-500/80 text-white rounded-full px-1 text-[9px] font-black">🐌 SLOW</span>
        </div>
      )}

      {isWeakened && (
        <div className="absolute -top-4 left-0 pointer-events-none flex items-center gap-0.5 animate-bounce">
          <span className="text-xs bg-purple-600/80 text-white rounded-full px-1 text-[9px] font-black">⬇️ WEAK</span>
        </div>
      )}

      {isBurrowing && (
        <div className="absolute bottom-0 inset-x-0 flex flex-col items-center pointer-events-none">
          <div className="w-12 h-3 bg-purple-950/80 rounded-full blur-xs border border-purple-500 animate-ping" />
        </div>
      )}

      {isReviving && (
        <div className="absolute -top-6 flex flex-col items-center pointer-events-none animate-pulse">
          <span className="text-xs font-black text-purple-300 drop-shadow">☠️ 蘇生中...</span>
          <div className="w-8 h-8 rounded-full border border-purple-500 bg-purple-900/40 animate-spin" />
        </div>
      )}

      {/* Attack Charge Sparks */}
      {isAttackingWindup && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
          <div className="w-6 h-6 rounded-full bg-yellow-400/40 border border-yellow-200 animate-ping" />
        </div>
      )}
    </div>
  );
});

function renderSpriteSvg(
  type: string,
  walkCycle: number,
  isAttacking: boolean,
  timer: number
) {
  const legOffset1 = walkCycle * 4;
  const legOffset2 = -walkCycle * 4;

  switch (type) {
    // ----------------- CATS -----------------
    case 'cat_basic':
      return (
        <svg width="56" height="56" viewBox="0 0 56 56" className="drop-shadow-md">
          {/* Ears */}
          <polygon points="12,18 16,4 25,14" fill="#ffffff" stroke="#000000" strokeWidth="3" strokeLinejoin="round" />
          <polygon points="31,14 40,4 44,18" fill="#ffffff" stroke="#000000" strokeWidth="3" strokeLinejoin="round" />
          {/* Body */}
          <ellipse cx="28" cy="29" rx="21" ry="20" fill="#ffffff" stroke="#000000" strokeWidth="3" />
          {/* Eyes */}
          <ellipse cx="19" cy="24" rx="2.8" ry="3.5" fill="#000000" />
          <ellipse cx="37" cy="24" rx="2.8" ry="3.5" fill="#000000" />
          {/* Open tongue mouth (Classic Battle Cats style) */}
          <path d="M 25 31 Q 28 38 31 31 Z" fill="#fb7185" stroke="#000000" strokeWidth="2" strokeLinejoin="round" />
          {/* Nose & 'w' shape snout */}
          <path d="M 28 26 L 28 30 M 22 30 Q 25 34 28 30 Q 31 34 34 30" fill="none" stroke="#000000" strokeWidth="2.8" strokeLinecap="round" />
          {/* Whiskers */}
          <line x1="7" y1="26" x2="16" y2="28" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
          <line x1="7" y1="32" x2="16" y2="31" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
          <line x1="49" y1="26" x2="40" y2="28" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
          <line x1="49" y1="32" x2="40" y2="31" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
          {/* Legs */}
          <ellipse cx={20 + legOffset1} cy="48" rx="4.5" ry="5.5" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />
          <ellipse cx={36 + legOffset2} cy="48" rx="4.5" ry="5.5" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />
        </svg>
      );

    case 'cat_builder':
      return (
        <svg width="60" height="60" viewBox="0 0 60 60" className="drop-shadow-md">
          {/* Muscle arms */}
          <path d="M 12 28 Q 4 18 10 12 Q 18 12 18 24" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          <path d="M 48 28 Q 56 18 50 12 Q 42 12 42 24" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          {/* Ears */}
          <polygon points="16,18 20,6 27,15" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          <polygon points="33,15 40,6 44,18" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          {/* Body */}
          <ellipse cx="30" cy="28" rx="18" ry="17" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          {/* Six Pack & Pecs lines */}
          <path d="M 23 28 Q 30 32 37 28 M 30 28 L 30 42 M 25 35 L 35 35" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
          {/* Fierce eyes */}
          <polygon points="20,22 25,25 21,26" fill="#0f172a" />
          <polygon points="40,22 35,25 39,26" fill="#0f172a" />
          {/* Mouth */}
          <path d="M 27 25 L 27 27 M 25 28 L 35 28" stroke="#0f172a" strokeWidth="2" />
          {/* Legs */}
          <ellipse cx={22 + legOffset1} cy="48" rx="5" ry="6" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          <ellipse cx={38 + legOffset2} cy="48" rx="5" ry="6" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
        </svg>
      );

    case 'cat_tank':
    case 'cat_wall':
    case 'cat_eraser':
      const isWall = type === 'cat_wall';
      const isEraser = type === 'cat_eraser';
      return (
        <svg width="56" height="74" viewBox="0 0 56 74" className="drop-shadow-md">
          {/* Ears */}
          <polygon points="12,14 15,3 22,12" fill={isEraser ? "#ffffff" : isWall ? "#e2e8f0" : "#f8fafc"} stroke="#0f172a" strokeWidth="2.5" />
          <polygon points="34,12 41,3 44,14" fill={isEraser ? "#ffffff" : isWall ? "#e2e8f0" : "#f8fafc"} stroke="#0f172a" strokeWidth="2.5" />
          {/* Pillar / Wall / Eraser body */}
          <rect x="10" y="10" width="36" height="52" rx={isEraser ? "2" : isWall ? "4" : "14"} fill={isEraser ? "#ffffff" : isWall ? "#e2e8f0" : "#f8fafc"} stroke="#0f172a" strokeWidth="2.5" />
          {isWall && (
            <>
              {/* Brick lines */}
              <line x1="10" y1="28" x2="46" y2="28" stroke="#94a3b8" strokeWidth="2" />
              <line x1="10" y1="46" x2="46" y2="46" stroke="#94a3b8" strokeWidth="2" />
              <line x1="28" y1="28" x2="28" y2="46" stroke="#94a3b8" strokeWidth="2" />
            </>
          )}
          {isEraser && (
            <>
              {/* MONO Eraser style blue/black sleeve */}
              <rect x="10" y="32" width="36" height="30" fill="#0284c7" stroke="#0f172a" strokeWidth="2" />
              <rect x="10" y="42" width="36" height="8" fill="#ffffff" />
              <rect x="10" y="50" width="36" height="12" fill="#0f172a" />
              <text x="28" y="48" fontSize="6" fontWeight="bold" textAnchor="middle" fill="#0284c7">GOMU</text>
            </>
          )}
          {/* Stoic Face */}
          <ellipse cx="21" cy="22" rx="2.5" ry="2.5" fill="#0f172a" />
          <ellipse cx="35" cy="22" rx="2.5" ry="2.5" fill="#0f172a" />
          <line x1="24" y1="28" x2="32" y2="28" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
          {/* Feet */}
          <ellipse cx={20 + legOffset1} cy="64" rx="4" ry="5" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx={36 + legOffset2} cy="64" rx="4" ry="5" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    case 'cat_axe':
    case 'cat_brave':
    case 'cat_dark':
      const isBrave = type === 'cat_brave';
      const isDark = type === 'cat_dark';
      return (
        <svg width="68" height="58" viewBox="0 0 68 58" className="drop-shadow-md">
          {/* Sword / Axe / Dark Cursed Blade */}
          {isDark ? (
            <g transform={isAttacking ? "rotate(45 46 22)" : "rotate(-15 46 22)"} className="transition-transform duration-100">
              <rect x="44" y="2" width="7" height="36" rx="2" fill="#450a0a" stroke="#ef4444" strokeWidth="2" />
              <line x1="38" y1="26" x2="56" y2="26" stroke="#991b1b" strokeWidth="3" />
              <circle cx="47" cy="38" r="4" fill="#ef4444" stroke="#450a0a" strokeWidth="2" />
            </g>
          ) : isBrave ? (
            <g transform={isAttacking ? "rotate(40 46 22)" : "rotate(-15 46 22)"} className="transition-transform duration-100">
              <rect x="44" y="2" width="6" height="34" rx="2" fill="#38bdf8" stroke="#0f172a" strokeWidth="2" />
              <line x1="38" y1="26" x2="56" y2="26" stroke="#fbbf24" strokeWidth="3" />
              <circle cx="47" cy="38" r="4" fill="#fbbf24" stroke="#0f172a" strokeWidth="2" />
            </g>
          ) : (
            <g transform={isAttacking ? "rotate(50 44 24)" : "rotate(-20 44 24)"} className="transition-transform duration-100">
              <rect x="42" y="6" width="5" height="28" fill="#78350f" stroke="#0f172a" strokeWidth="1.5" />
              <path d="M 47 6 Q 62 4 58 18 Q 47 22 47 16 Z" fill="#94a3b8" stroke="#0f172a" strokeWidth="2" />
            </g>
          )}
          {/* Helmet / Dark Horned Armor */}
          {isDark ? (
            <path d="M 14 16 Q 28 0 42 16 L 40 24 L 16 24 Z" fill="#18181b" stroke="#ef4444" strokeWidth="2" />
          ) : isBrave ? (
            <path d="M 16 16 Q 28 4 40 16 L 38 22 L 18 22 Z" fill="#fbbf24" stroke="#0f172a" strokeWidth="2" />
          ) : (
            <g>
              <polygon points="12,18 16,6 23,15" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
              <polygon points="31,15 38,6 42,18" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
            </g>
          )}
          {/* Body */}
          <ellipse cx="28" cy="30" rx="17" ry="16" fill={isDark ? "#27272a" : "#f8fafc"} stroke={isDark ? "#ef4444" : "#0f172a"} strokeWidth="2.5" />
          {/* Fierce Face */}
          <polygon points="20,24 26,27 22,29" fill={isDark ? "#ef4444" : "#0f172a"} />
          <polygon points="36,24 30,27 34,29" fill={isDark ? "#ef4444" : "#0f172a"} />
          <path d="M 23 34 Q 28 30 33 34" fill="none" stroke={isDark ? "#ef4444" : "#0f172a"} strokeWidth="2" strokeLinecap="round" />
          {/* Shield for brave / dark cat */}
          {isDark ? (
            <ellipse cx="14" cy="32" rx="7" ry="10" fill="#7f1d1d" stroke="#ef4444" strokeWidth="2" />
          ) : isBrave ? (
            <ellipse cx="14" cy="32" rx="7" ry="10" fill="#dc2626" stroke="#0f172a" strokeWidth="2" />
          ) : null}
          {/* Legs */}
          <ellipse cx={20 + legOffset1} cy="48" rx="4" ry="5" fill={isDark ? "#27272a" : "#f8fafc"} stroke={isDark ? "#ef4444" : "#0f172a"} strokeWidth="2" />
          <ellipse cx={36 + legOffset2} cy="48" rx="4" ry="5" fill={isDark ? "#27272a" : "#f8fafc"} stroke={isDark ? "#ef4444" : "#0f172a"} strokeWidth="2" />
        </svg>
      );

    case 'cat_gross':
    case 'cat_legs':
    case 'cat_macho_legs':
      const isLegs = type === 'cat_legs';
      const isMachoLegs = type === 'cat_macho_legs';
      return (
        <svg width="60" height="96" viewBox="0 0 60 96" className="drop-shadow-md">
          {/* Cat Head on top */}
          <polygon points="18,16 22,6 28,14" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          <polygon points="32,14 38,6 42,16" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx="30" cy="22" rx="14" ry="13" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          <ellipse cx="25" cy="20" rx="2" ry="2.5" fill="#0f172a" />
          <ellipse cx="35" cy="20" rx="2" ry="2.5" fill="#0f172a" />
          <line x1="26" y1="26" x2="34" y2="26" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
          {/* Legs */}
          <path
            d={`M 22 34 Q ${18 + (isAttacking ? 35 : legOffset1)} 60 20 88`}
            fill="none"
            stroke="#f8fafc"
            strokeWidth={isMachoLegs ? "9" : "6"}
            strokeLinecap="round"
          />
          <path
            d={`M 22 34 Q ${18 + (isAttacking ? 35 : legOffset1)} 60 20 88`}
            fill="none"
            stroke="#0f172a"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d={`M 38 34 Q ${42 + legOffset2} 60 40 88`}
            fill="none"
            stroke="#f8fafc"
            strokeWidth={isMachoLegs ? "9" : "6"}
            strokeLinecap="round"
          />
          <path
            d={`M 38 34 Q ${42 + legOffset2} 60 40 88`}
            fill="none"
            stroke="#0f172a"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Muscle details for Macho Legs */}
          {isMachoLegs && (
            <>
              <ellipse cx="20" cy="54" rx="4" ry="6" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
              <ellipse cx="40" cy="54" rx="4" ry="6" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
              <line x1="18" y1="52" x2="22" y2="52" stroke="#0f172a" strokeWidth="1.5" />
              <line x1="38" y1="52" x2="42" y2="52" stroke="#0f172a" strokeWidth="1.5" />
            </>
          )}
          {/* High heels / Sexy feet / Macho feet */}
          {isLegs ? (
            <>
              <polygon points="16,88 28,88 22,94" fill="#dc2626" stroke="#0f172a" strokeWidth="1.5" />
              <polygon points="36,88 48,88 42,94" fill="#dc2626" stroke="#0f172a" strokeWidth="1.5" />
            </>
          ) : (
            <>
              <ellipse cx="20" cy="89" rx="4" ry="3" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
              <ellipse cx="40" cy="89" rx="4" ry="3" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
            </>
          )}
        </svg>
      );

    case 'cat_cow':
    case 'cat_giraffe':
    case 'cat_lion':
      const isGiraffe = type === 'cat_giraffe';
      const isLion = type === 'cat_lion';
      return (
        <svg width="78" height="60" viewBox="0 0 78 60" className="drop-shadow-md">
          {/* Four-legged running body */}
          <ellipse cx="32" cy="34" rx="20" ry="14" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          {/* Spots or Lion Mane */}
          {isLion ? (
            <circle cx="52" cy="24" r="14" fill="#d97706" stroke="#78350f" strokeWidth="2" />
          ) : (
            <>
              <circle cx="26" cy="30" r="4" fill="#0f172a" />
              <circle cx="38" cy="36" r="5" fill="#0f172a" />
              <circle cx="44" cy="28" r="3" fill="#0f172a" />
            </>
          )}
          {/* Long Neck for giraffe */}
          {isGiraffe && (
            <path d="M 44 32 L 58 12 L 66 16 L 50 36 Z" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          )}
          {/* Head & Horns */}
          <g transform={isLion ? "translate(48, 16)" : isGiraffe ? "translate(58, 6)" : "translate(46, 20)"}>
            {!isLion && (
              <>
                <polygon points="-4,-4 0,-14 6,-4" fill="#fbbf24" stroke="#0f172a" strokeWidth="1.5" />
                <polygon points="6,-4 12,-14 16,-4" fill="#fbbf24" stroke="#0f172a" strokeWidth="1.5" />
              </>
            )}
            <ellipse cx="6" cy="2" rx="10" ry="9" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
            <ellipse cx="6" cy="0" rx="2" ry="2" fill="#0f172a" />
            <ellipse cx="12" cy="0" rx="2" ry="2" fill="#0f172a" />
          </g>
          {/* Running 4 legs */}
          <line x1="18" y1="44" x2={14 + legOffset1 * 2} y2="56" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
          <line x1="26" y1="44" x2={22 + legOffset2 * 2} y2="56" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
          <line x1="38" y1="44" x2={42 + legOffset1 * 2} y2="56" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
          <line x1="46" y1="44" x2={50 + legOffset2 * 2} y2="56" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'cat_bird':
    case 'cat_ufo':
    case 'cat_flying':
      const isUfo = type === 'cat_ufo';
      const isFlying = type === 'cat_flying';
      return (
        <svg width="68" height="68" viewBox="0 0 68 68" className="drop-shadow-lg">
          {isFlying ? (
            <>
              {/* Flying Angel Wings & Halo */}
              <circle cx="34" cy="14" r="8" fill="none" stroke="#fbbf24" strokeWidth="2" />
              <path d={`M 10 32 Q 2 ${18 + walkCycle * 8} 20 22`} fill="#fef08a" stroke="#b45309" strokeWidth="2" />
              <path d={`M 58 32 Q 66 ${18 + walkCycle * 8} 48 22`} fill="#fef08a" stroke="#b45309" strokeWidth="2" />
              {/* Body */}
              <ellipse cx="34" cy="34" rx="18" ry="16" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
              <circle cx="28" cy="30" r="2.5" fill="#0f172a" />
              <circle cx="40" cy="30" r="2.5" fill="#0f172a" />
              {/* Holy Light Beam on Attack */}
              {isAttacking && (
                <polygon points="34,42 20,68 48,68" fill="#fef08a" opacity="0.8" stroke="#fbbf24" strokeWidth="2" className="animate-pulse" />
              )}
            </>
          ) : isUfo ? (
            <>
              {/* UFO Saucer */}
              <ellipse cx="32" cy="40" rx="28" ry="10" fill="#64748b" stroke="#0f172a" strokeWidth="2.5" />
              <ellipse cx="32" cy="38" rx="22" ry="6" fill="#38bdf8" />
              {/* Glass dome with Cat head inside */}
              <path d="M 18 36 A 14 14 0 0 1 46 36 Z" fill="#93c5fd" fillOpacity="0.7" stroke="#0f172a" strokeWidth="2" />
              <circle cx="32" cy="30" r="8" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
              <ellipse cx="30" cy="28" rx="1.5" ry="2" fill="#0f172a" />
              <ellipse cx="34" cy="28" rx="1.5" ry="2" fill="#0f172a" />
              {/* UFO lights */}
              <circle cx="16" cy="42" r="2.5" fill="#facc15" />
              <circle cx="26" cy="44" r="2.5" fill="#facc15" />
              <circle cx="38" cy="44" r="2.5" fill="#facc15" />
              <circle cx="48" cy="42" r="2.5" fill="#facc15" />
            </>
          ) : (
            <>
              {/* Wings flapping */}
              <path d={`M 14 26 Q 4 ${12 + walkCycle * 8} 18 16`} fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
              <path d={`M 50 26 Q 60 ${12 + walkCycle * 8} 46 16`} fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
              {/* Bird Cat Body */}
              <polygon points="20,16 23,6 30,14" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
              <polygon points="34,14 41,6 44,16" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
              <ellipse cx="32" cy="28" rx="18" ry="16" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
              {/* Big Beak */}
              <polygon points="26,26 44,30 26,34" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />
              <ellipse cx="26" cy="24" rx="2.5" ry="3" fill="#0f172a" />
            </>
          )}
        </svg>
      );

    case 'cat_fish':
    case 'cat_whale':
    case 'cat_island':
      const isWhale = type === 'cat_whale';
      const isIsland = type === 'cat_island';
      return (
        <svg width="76" height="64" viewBox="0 0 76 64" className="drop-shadow-md">
          {/* Island Palm Tree on Head */}
          {isIsland && (
            <g transform="translate(36, 4)">
              <path d="M 4 14 Q 2 6 6 0" stroke="#78350f" strokeWidth="2.5" fill="none" />
              <path d="M 6 0 Q 0 -4 -6 0 M 6 0 Q 12 -4 18 0 M 6 0 Q 6 -8 6 -10" stroke="#16a34a" strokeWidth="2" fill="none" />
            </g>
          )}
          {/* Whale / Fish / Island Body */}
          <path
            d="M 12 34 Q 30 14 60 28 Q 68 32 62 44 Q 30 56 12 34 Z"
            fill={isIsland ? "#15803d" : isWhale ? "#3b82f6" : "#f8fafc"}
            stroke="#0f172a"
            strokeWidth="2.5"
          />
          {/* Tail fin */}
          <polygon points="12,34 2,22 4,46" fill={isIsland ? "#15803d" : isWhale ? "#3b82f6" : "#f8fafc"} stroke="#0f172a" strokeWidth="2" />
          {/* Ears on top */}
          {!isIsland && (
            <polygon points="36,22 40,10 46,22" fill={isWhale ? "#3b82f6" : "#f8fafc"} stroke="#0f172a" strokeWidth="2" />
          )}
          {/* Eyes & Sharp Teeth */}
          <circle cx="52" cy="29" r="3" fill="#0f172a" />
          <path d="M 44 38 L 48 34 L 52 38 L 56 34 L 60 38" fill="none" stroke="#0f172a" strokeWidth="2" />
          {/* Water spout for whale */}
          {isWhale && (
            <path d="M 40 12 Q 40 4 32 0 M 40 12 Q 44 4 50 2" fill="none" stroke="#38bdf8" strokeWidth="2" />
          )}
          {/* Legs scuttling under fish */}
          <ellipse cx={28 + legOffset1} cy="52" rx="4" ry="4" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx={44 + legOffset2} cy="52" rx="4" ry="4" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    case 'cat_lizard':
    case 'cat_dragon':
    case 'cat_king_dragon':
      const isDragon = type === 'cat_dragon';
      const isKingDragon = type === 'cat_king_dragon';
      return (
        <svg width="84" height="68" viewBox="0 0 84 68" className="drop-shadow-lg">
          {/* King Dragon Crown */}
          {isKingDragon && (
            <polygon points="50,12 53,4 57,9 61,4 64,12" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
          )}
          {/* Dragon Horns & Spikes */}
          {(isDragon || isKingDragon) ? (
            <>
              <polygon points="26,14 30,2 35,16" fill={isKingDragon ? "#fbbf24" : "#ef4444"} stroke="#0f172a" strokeWidth="2" />
              <polygon points="38,14 44,0 48,16" fill={isKingDragon ? "#fbbf24" : "#ef4444"} stroke="#0f172a" strokeWidth="2" />
              <polygon points="18,30 10,24 16,36" fill={isKingDragon ? "#fbbf24" : "#ef4444"} stroke="#0f172a" strokeWidth="2" />
            </>
          ) : (
            <polygon points="28,14 32,4 37,16" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          )}
          {/* Long Neck & Snout */}
          <path d="M 24 44 Q 32 20 48 20 Q 66 20 68 34 L 56 42 Q 36 46 24 44 Z" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          {/* Body */}
          <ellipse cx="28" cy="40" rx="16" ry="14" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          {/* Fierce eye */}
          <ellipse cx="56" cy="28" rx="3" ry="3" fill="#0f172a" />
          {/* Fire breath when attacking */}
          {isAttacking && (
            <g className="animate-pulse">
              <path d="M 68 32 Q 88 26 95 35 Q 86 42 68 36 Z" fill={isKingDragon ? "#3b82f6" : "#ef4444"} />
              <path d="M 70 33 Q 82 29 86 35 Q 80 39 70 35 Z" fill={isKingDragon ? "#93c5fd" : "#facc15"} />
            </g>
          )}
          {/* Tail */}
          <path d="M 14 38 Q 4 36 2 48" fill="none" stroke="#f8fafc" strokeWidth="6" strokeLinecap="round" />
          <path d="M 14 38 Q 4 36 2 48" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
          {/* Legs */}
          <ellipse cx={22 + legOffset1} cy="54" rx="5" ry="5" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx={36 + legOffset2} cy="54" rx="5" ry="5" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    case 'cat_titan':
    case 'cat_darabocchi':
    case 'cat_jamiera':
      const isJamiera = type === 'cat_jamiera';
      return (
        <svg width="88" height="98" viewBox="0 0 88 98" className="drop-shadow-2xl">
          {/* Giant Muscular Shadow Titan */}
          {/* Huge Shoulders & Arms */}
          <path d="M 8 36 Q 0 16 16 10 Q 32 10 26 38 Z" fill={isJamiera ? "#475569" : "#1e293b"} stroke="#0f172a" strokeWidth="3" />
          <path d="M 78 36 Q 86 16 70 10 Q 54 10 60 38 Z" fill={isJamiera ? "#475569" : "#1e293b"} stroke="#0f172a" strokeWidth="3" />
          {/* Fist slamming animation */}
          {isAttacking ? (
            <circle cx="72" cy="70" r="14" fill="#0f172a" stroke="#ef4444" strokeWidth="3" />
          ) : (
            <circle cx="70" cy="50" r="10" fill={isJamiera ? "#475569" : "#1e293b"} stroke="#0f172a" strokeWidth="2.5" />
          )}
          {/* Cat Head in center */}
          <polygon points="32,18 36,4 43,15" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          <polygon points="45,15 52,4 56,18" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="44" cy="26" r="16" fill="#f8fafc" stroke="#0f172a" strokeWidth="3" />
          <circle cx="38" cy="24" r="2.5" fill="#0f172a" />
          <circle cx="50" cy="24" r="2.5" fill="#0f172a" />
          {/* Giant Torso */}
          <path d="M 22 38 L 66 38 L 58 72 L 30 72 Z" fill={isJamiera ? "#334155" : "#1e293b"} stroke="#0f172a" strokeWidth="3" />
          {/* Skull T-shirt for Jamiera */}
          {isJamiera ? (
            <g transform="translate(44, 52)">
              <circle cx="0" cy="0" r="7" fill="#f8fafc" />
              <circle cx="-2.5" cy="-1" r="1.5" fill="#0f172a" />
              <circle cx="2.5" cy="-1" r="1.5" fill="#0f172a" />
              <rect x="-3" y="3" width="6" height="3" fill="#f8fafc" />
            </g>
          ) : (
            <path d="M 32 46 L 56 46 M 44 46 L 44 65 M 34 56 L 54 56" stroke="#475569" strokeWidth="2" />
          )}
          {/* Massive Legs */}
          <rect x={28 + legOffset1} y="72" width="10" height="20" rx="3" fill={isJamiera ? "#475569" : "#1e293b"} stroke="#0f172a" strokeWidth="2.5" />
          <rect x={50 + legOffset2} y="72" width="10" height="20" rx="3" fill={isJamiera ? "#475569" : "#1e293b"} stroke="#0f172a" strokeWidth="2.5" />
        </svg>
      );

    case 'cat_salon':
    case 'cat_perfect':
      return (
        <svg width="65" height="85" viewBox="0 0 65 85" className="drop-shadow-md">
          {/* Fur Boa & Dress */}
          <ellipse cx="32" cy="46" rx="16" ry="22" fill="#ec4899" stroke="#0f172a" strokeWidth="2.5" />
          <path d="M 16 32 Q 32 20 48 32 Q 32 42 16 32 Z" fill="#fbcfe8" stroke="#0f172a" strokeWidth="2" />
          {/* Head & Glasses */}
          <polygon points="22,16 26,6 32,15" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          <polygon points="36,15 42,6 46,16" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx="34" cy="24" rx="14" ry="12" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          {/* Retro Sunglasses */}
          <polygon points="22,22 30,22 28,28 24,28" fill="#1e1b4b" />
          <polygon points="36,22 44,22 42,28 38,28" fill="#1e1b4b" />
          {/* Sparkling sonic ring on attack */}
          {isAttacking && (
            <ellipse cx="56" cy="40" rx="8" ry="18" fill="none" stroke="#f43f5e" strokeWidth="3" className="animate-ping" />
          )}
          {/* Legs */}
          <line x1="26" y1="68" x2={24 + legOffset1} y2="82" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
          <line x1="38" y1="68" x2={36 + legOffset2} y2="82" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'cat_valkyrie':
      return (
        <svg width="84" height="90" viewBox="0 0 84 90" className="drop-shadow-2xl">
          {/* Angel Wings */}
          <path d="M 16 28 Q 0 4 20 2 Q 28 8 28 32 Z" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          <path d="M 52 28 Q 68 4 48 2 Q 40 8 40 32 Z" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          {/* Halo */}
          <ellipse cx="34" cy="4" rx="12" ry="4" fill="none" stroke="#facc15" strokeWidth="2.5" />
          {/* Golden Spear */}
          <g transform={isAttacking ? "rotate(45 56 42)" : "rotate(-10 56 42)"} className="transition-transform duration-100">
            <line x1="16" y1="80" x2="68" y2="10" stroke="#facc15" strokeWidth="4" />
            <polygon points="68,10 82,2 76,18" fill="#38bdf8" stroke="#0f172a" strokeWidth="2" />
          </g>
          {/* Valkyrie Armor Body */}
          <ellipse cx="34" cy="38" rx="14" ry="18" fill="#e0e7ff" stroke="#0f172a" strokeWidth="2.5" />
          <polygon points="26,20 28,10 34,18" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          <polygon points="36,18 42,10 44,20" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          <circle cx="34" cy="24" r="11" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx="31" cy="23" rx="1.5" ry="2" fill="#0f172a" />
          <ellipse cx="37" cy="23" rx="1.5" ry="2" fill="#0f172a" />
          {/* Golden Armor Trim */}
          <circle cx="34" cy="42" r="5" fill="#facc15" stroke="#0f172a" strokeWidth="1.5" />
          {/* Legs */}
          <line x1="28" y1="56" x2={26 + legOffset1} y2="82" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
          <line x1="40" y1="56" x2={38 + legOffset2} y2="82" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'cat_valkyrie_true':
      return (
        <svg width="92" height="95" viewBox="0 0 92 95" className="drop-shadow-2xl">
          {/* Radiant True Valkyrie Angel Wings */}
          <path d="M 14 30 Q -4 0 22 -2 Q 32 6 30 36 Z" fill="#e0e7ff" stroke="#312e81" strokeWidth="2.5" />
          <path d="M 58 30 Q 76 0 50 -2 Q 40 6 42 36 Z" fill="#e0e7ff" stroke="#312e81" strokeWidth="2.5" />
          {/* Multi-layered Halo */}
          <ellipse cx="36" cy="3" rx="14" ry="4.5" fill="none" stroke="#facc15" strokeWidth="3" />
          <ellipse cx="36" cy="3" rx="8" ry="2.5" fill="none" stroke="#38bdf8" strokeWidth="2" />
          {/* True Silver-Gold Twin Lance */}
          <g transform={isAttacking ? "rotate(50 60 44)" : "rotate(-12 60 44)"} className="transition-transform duration-100">
            <line x1="12" y1="88" x2="74" y2="8" stroke="#38bdf8" strokeWidth="4.5" />
            <polygon points="74,8 88,-2 82,18" fill="#facc15" stroke="#713f12" strokeWidth="2" />
            <polygon points="12,88 2,98 8,78" fill="#facc15" stroke="#713f12" strokeWidth="2" />
          </g>
          {/* Silver Valkyrie Body */}
          <ellipse cx="36" cy="40" rx="16" ry="20" fill="#c7d2fe" stroke="#312e81" strokeWidth="2.5" />
          <polygon points="26,20 30,8 36,18" fill="#f8fafc" stroke="#312e81" strokeWidth="2" />
          <polygon points="38,18 44,8 48,20" fill="#f8fafc" stroke="#312e81" strokeWidth="2" />
          <circle cx="36" cy="24" r="12" fill="#f8fafc" stroke="#312e81" strokeWidth="2.5" />
          <ellipse cx="33" cy="23" rx="1.8" ry="2.2" fill="#1e1b4b" />
          <ellipse cx="39" cy="23" rx="1.8" ry="2.2" fill="#1e1b4b" />
          {/* Royal Armor Plate */}
          <circle cx="36" cy="44" r="6" fill="#facc15" stroke="#713f12" strokeWidth="2" />
          {/* Legs */}
          <line x1="30" y1="60" x2={28 + legOffset1} y2="86" stroke="#312e81" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="42" y1="60" x2={40 + legOffset2} y2="86" stroke="#312e81" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );

    case 'cat_valkyrie_holy':
      return (
        <svg width="105" height="105" viewBox="0 0 105 105" className="drop-shadow-[0_0_25px_rgba(250,204,21,0.85)]">
          {/* Sacred Golden Holy Aura Ring */}
          <circle cx="50" cy="50" r="46" fill="none" stroke="#fef08a" strokeWidth="2" strokeDasharray="8,6" className="animate-spin" />
          {/* Divine Golden Archangel Feather Wings */}
          <path d="M 20 35 Q -10 -5 28 -8 Q 42 2 38 42 Z" fill="#fef08a" stroke="#ca8a04" strokeWidth="3" />
          <path d="M 68 35 Q 98 -5 60 -8 Q 46 2 50 42 Z" fill="#fef08a" stroke="#ca8a04" strokeWidth="3" />
          <path d="M 28 42 Q 6 12 36 6 Z" fill="#ffffff" stroke="#eab308" strokeWidth="2" />
          <path d="M 60 42 Q 82 12 52 6 Z" fill="#ffffff" stroke="#eab308" strokeWidth="2" />
          {/* Sacred Sun Halo */}
          <ellipse cx="44" cy="2" rx="18" ry="6" fill="#fef08a" stroke="#eab308" strokeWidth="3" className="animate-pulse" />
          <ellipse cx="44" cy="2" rx="10" ry="3.5" fill="#38bdf8" />
          {/* Divine Holy Thunder Twin Lances */}
          <g transform={isAttacking ? "rotate(55 72 48)" : "rotate(-15 72 48)"} className="transition-transform duration-100">
            <line x1="10" y1="96" x2="82" y2="4" stroke="#eab308" strokeWidth="5.5" />
            <line x1="10" y1="96" x2="82" y2="4" stroke="#ffffff" strokeWidth="2.5" />
            <polygon points="82,4 98,-8 90,14" fill="#38bdf8" stroke="#0369a1" strokeWidth="2" />
            <polygon points="10,96 -2,106 4,86" fill="#38bdf8" stroke="#0369a1" strokeWidth="2" />
            {isAttacking && (
              <circle cx="88" cy="4" r="16" fill="none" stroke="#facc15" strokeWidth="4" className="animate-ping" />
            )}
          </g>
          {/* Holy Valkyrie Armor Body */}
          <ellipse cx="44" cy="44" rx="18" ry="22" fill="#ffffff" stroke="#ca8a04" strokeWidth="3" />
          <polygon points="32,22 38,8 44,20" fill="#fef08a" stroke="#ca8a04" strokeWidth="2.5" />
          <polygon points="46,20 52,8 58,22" fill="#fef08a" stroke="#ca8a04" strokeWidth="2.5" />
          <circle cx="44" cy="26" r="13" fill="#ffffff" stroke="#ca8a04" strokeWidth="2.5" />
          <ellipse cx="40" cy="25" rx="2" ry="2.5" fill="#0284c7" />
          <ellipse cx="48" cy="25" rx="2" ry="2.5" fill="#0284c7" />
          {/* Glowing Divine Core Jewel */}
          <circle cx="44" cy="48" r="8" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" className="animate-pulse" />
          {/* Golden Plated Legs */}
          <line x1="36" y1="66" x2={34 + legOffset1} y2="94" stroke="#ca8a04" strokeWidth="4" strokeLinecap="round" />
          <line x1="52" y1="66" x2={50 + legOffset2} y2="94" stroke="#ca8a04" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'cat_bahamut':
    case 'cat_bahamut_awake':
      return (
        <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-2xl">
          {/* Demon Dragon Wings */}
          <path d="M 20 40 Q -10 10 24 4 Q 38 18 34 50 Z" fill="#4c1d95" stroke="#0f172a" strokeWidth="2.5" />
          <path d="M 68 40 Q 98 10 64 4 Q 50 18 54 50 Z" fill="#4c1d95" stroke="#0f172a" strokeWidth="2.5" />
          {/* Dark Matter Sphere Charging on attack */}
          {isAttacking && (
            <g className="animate-spin">
              <circle cx="82" cy="36" r="18" fill="#7e22ce" stroke="#c084fc" strokeWidth="3" opacity="0.9" />
              <circle cx="82" cy="36" r="10" fill="#000000" />
            </g>
          )}
          {/* Dragon Horns */}
          <polygon points="36,24 24,6 42,18" fill="#0f172a" />
          <polygon points="52,18 70,6 58,24" fill="#0f172a" />
          {/* Body */}
          <path d="M 34 26 L 60 26 L 56 68 L 38 68 Z" fill="#1e1b4b" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="47" cy="30" r="13" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          {/* Glowing Red Eyes */}
          <ellipse cx="43" cy="29" rx="2" ry="3" fill="#ef4444" />
          <ellipse cx="51" cy="29" rx="2" ry="3" fill="#ef4444" />
          {/* Claw Legs */}
          <line x1="38" y1="68" x2={34 + legOffset1} y2="92" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
          <line x1="56" y1="68" x2={52 + legOffset2} y2="92" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'cat_jizo':
    case 'cat_kamui':
      return (
        <svg width="76" height="85" viewBox="0 0 76 85" className="drop-shadow-xl">
          {/* Straw Hat */}
          <polygon points="12,28 38,10 64,28" fill="#d97706" stroke="#0f172a" strokeWidth="2.5" />
          {/* Stone Jizo Body */}
          <ellipse cx="38" cy="46" rx="20" ry="24" fill="#94a3b8" stroke="#0f172a" strokeWidth="2.5" />
          {/* Red Bib */}
          <path d="M 24 38 Q 38 52 52 38 Z" fill="#ef4444" stroke="#0f172a" strokeWidth="2" />
          {/* Cute Peaceful Face */}
          <ellipse cx="33" cy="34" rx="2" ry="2.5" fill="#0f172a" />
          <ellipse cx="43" cy="34" rx="2" ry="2.5" fill="#0f172a" />
          <path d="M 35 38 Q 38 40 41 38" fill="none" stroke="#0f172a" strokeWidth="1.5" />
          {/* Tommy Gun / Bazooka firing */}
          <rect x="42" y="44" width="28" height="8" rx="2" fill="#0f172a" />
          <circle cx="48" cy="54" r="5" fill="#0f172a" />
          {isAttacking && (
            <polygon points="70,44 86,40 86,56" fill="#facc15" className="animate-ping" />
          )}
          {/* Feet */}
          <ellipse cx={30 + legOffset1} cy="70" rx="5" ry="5" fill="#94a3b8" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx={46 + legOffset2} cy="70" rx="5" ry="5" fill="#94a3b8" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    case 'cat_gao':
    case 'cat_gao_apex':
      return (
        <svg width="88" height="88" viewBox="0 0 88 88" className="drop-shadow-2xl">
          {/* Majestic Lion Mane */}
          <circle cx="44" cy="38" r="28" fill="#f59e0b" stroke="#0f172a" strokeWidth="3" />
          {/* Crown */}
          <polygon points="32,16 38,4 44,12 50,4 56,16" fill="#fbbf24" stroke="#0f172a" strokeWidth="2" />
          {/* Beast Face */}
          <circle cx="44" cy="40" r="18" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          <polygon points="30,28 34,18 40,26" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          <polygon points="48,26 54,18 58,28" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          <circle cx="38" cy="38" r="3" fill="#0f172a" />
          <circle cx="50" cy="38" r="3" fill="#0f172a" />
          <polygon points="44,42 41,46 47,46" fill="#0f172a" />
          {/* Shockwave on attack */}
          {isAttacking && (
            <circle cx="70" cy="40" r="16" fill="none" stroke="#f59e0b" strokeWidth="4" className="animate-ping" />
          )}
          {/* Strong Paws */}
          <ellipse cx={32 + legOffset1} cy="68" rx="6" ry="6" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          <ellipse cx={56 + legOffset2} cy="68" rx="6" ry="6" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
        </svg>
      );

    // ----------------- CRAZED CATS (狂乱の味方キャラ) -----------------
    case 'cat_crazed_basic':
    case 'cat_crazed_builder':
      return (
        <svg width="60" height="60" viewBox="0 0 60 60" className="drop-shadow-lg">
          {/* Crazed Purple Dark Aura */}
          <circle cx="30" cy="30" r="24" fill="none" stroke="#9333ea" strokeWidth="2.5" strokeDasharray="6,4" className="animate-spin" />
          {/* Dark Cat Body */}
          <circle cx="30" cy="30" r="18" fill="#18181b" stroke="#71717a" strokeWidth="2.5" />
          {/* Ears */}
          <polygon points="18,18 20,7 28,15" fill="#18181b" stroke="#71717a" strokeWidth="2" />
          <polygon points="42,18 40,7 32,15" fill="#18181b" stroke="#71717a" strokeWidth="2" />
          {/* Glowing Fierce Red Eyes */}
          <circle cx="23" cy="27" r="3.5" fill="#ef4444" />
          <circle cx="37" cy="27" r="3.5" fill="#ef4444" />
          <ellipse cx="23" cy="27" rx="1.5" ry="3" fill="#000000" />
          <ellipse cx="37" cy="27" rx="1.5" ry="3" fill="#000000" />
          {/* Sharp Fangs */}
          <polygon points="27,34 30,38 33,34" fill="#ffffff" />
          {/* Builder Helmet if builder form */}
          {type === 'cat_crazed_builder' && (
            <path d="M 14 18 Q 30 6 46 18 Z" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="2" />
          )}
          {/* Legs */}
          <line x1="24" y1="46" x2={22 + legOffset1} y2="56" stroke="#71717a" strokeWidth="3" strokeLinecap="round" />
          <line x1="36" y1="46" x2={34 + legOffset2} y2="56" stroke="#71717a" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'cat_crazed_tank':
    case 'cat_crazed_wall':
      return (
        <svg width="58" height="74" viewBox="0 0 58 74" className="drop-shadow-lg">
          {/* Dark Monolith Body */}
          <rect x="14" y="10" width="30" height="48" rx="7" fill="#18181b" stroke="#71717a" strokeWidth="3" />
          {/* Cracked Energy Lines */}
          <path d="M 20 20 L 26 28 L 22 36 L 28 44" fill="none" stroke="#dc2626" strokeWidth="1.5" />
          {/* Angry glowing red slit eyes */}
          <line x1="20" y1="24" x2="27" y2="24" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
          <line x1="31" y1="24" x2="38" y2="24" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
          {/* Legs */}
          <line x1="22" y1="58" x2={20 + legOffset1} y2="70" stroke="#71717a" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="36" y1="58" x2={34 + legOffset2} y2="70" stroke="#71717a" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );

    case 'cat_crazed_axe':
    case 'cat_crazed_brave':
      return (
        <svg width="68" height="68" viewBox="0 0 68 68" className="drop-shadow-lg">
          {/* Blood-Red Battle Axe */}
          <g transform={`rotate(${isAttacking ? 60 : -15} 44 26)`}>
            <line x1="44" y1="46" x2="44" y2="10" stroke="#7f1d1d" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 44 10 Q 64 6 56 26 Q 44 18 44 10 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="2.5" />
          </g>
          {/* Dark Body */}
          <circle cx="28" cy="34" r="18" fill="#18181b" stroke="#71717a" strokeWidth="2.5" />
          <polygon points="16,22 18,10 26,19" fill="#18181b" stroke="#71717a" strokeWidth="2" />
          <polygon points="40,22 38,10 30,19" fill="#18181b" stroke="#71717a" strokeWidth="2" />
          {/* Eyes */}
          <circle cx="21" cy="30" r="3" fill="#ef4444" />
          <circle cx="33" cy="30" r="3" fill="#ef4444" />
          {/* Feet */}
          <line x1="22" y1="50" x2={20 + legOffset1} y2="62" stroke="#71717a" strokeWidth="3" strokeLinecap="round" />
          <line x1="34" y1="50" x2={32 + legOffset2} y2="62" stroke="#71717a" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'cat_crazed_cow':
    case 'cat_crazed_giraffe':
      return (
        <svg width="80" height="70" viewBox="0 0 80 70" className="drop-shadow-lg">
          {/* Dark Bull Body */}
          <ellipse cx="44" cy="40" rx="24" ry="16" fill="#18181b" stroke="#71717a" strokeWidth="2.5" />
          {/* Long Neck / Horns */}
          <path d="M 28 36 L 16 16 L 24 16 L 36 34 Z" fill="#18181b" stroke="#71717a" strokeWidth="2" />
          {/* Head & Wicked Horns */}
          <circle cx="18" cy="14" r="10" fill="#18181b" stroke="#71717a" strokeWidth="2" />
          <path d="M 12 10 Q 4 2 8 -2" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 22 10 Q 28 2 24 -2" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="15" cy="13" r="2.5" fill="#ef4444" />
          {/* Fast Running Legs */}
          <line x1="26" y1="52" x2={20 + legOffset1 * 1.5} y2="68" stroke="#71717a" strokeWidth="3" strokeLinecap="round" />
          <line x1="38" y1="54" x2={34 + legOffset2 * 1.5} y2="68" stroke="#71717a" strokeWidth="3" strokeLinecap="round" />
          <line x1="52" y1="54" x2={48 + legOffset1 * 1.5} y2="68" stroke="#71717a" strokeWidth="3" strokeLinecap="round" />
          <line x1="62" y1="52" x2={60 + legOffset2 * 1.5} y2="68" stroke="#71717a" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'cat_crazed_lizard':
    case 'cat_crazed_dragon':
      return (
        <svg width="86" height="74" viewBox="0 0 86 74" className="drop-shadow-xl">
          {/* Crazed Dark Dragon Tail & Body */}
          <path d="M 64 54 Q 78 44 82 28 Q 74 36 60 48 Z" fill="#18181b" stroke="#71717a" strokeWidth="2.5" />
          <ellipse cx="44" cy="46" rx="20" ry="14" fill="#18181b" stroke="#71717a" strokeWidth="2.5" />
          {/* Long Neck & Head */}
          <path d="M 32 44 L 20 22 L 28 20 L 40 42 Z" fill="#18181b" stroke="#71717a" strokeWidth="2" />
          <ellipse cx="18" cy="18" rx="14" ry="10" fill="#18181b" stroke="#71717a" strokeWidth="2" />
          {/* Dragon Spines & Horns */}
          <polygon points="12,10 6,2 14,8" fill="#dc2626" />
          <polygon points="20,10 18,0 24,8" fill="#dc2626" />
          <circle cx="14" cy="16" r="2.5" fill="#ef4444" />
          {/* Blue/Red Fire Breath on attack */}
          {isAttacking && (
            <path d="M 6 18 Q -16 10 -24 20 Q -10 26 6 22 Z" fill="#ef4444" stroke="#facc15" strokeWidth="2" className="animate-pulse" />
          )}
          {/* Legs */}
          <line x1="34" y1="58" x2={30 + legOffset1} y2="70" stroke="#71717a" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="52" y1="58" x2={50 + legOffset2} y2="70" stroke="#71717a" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );

    case 'cat_crazed_titan':
    case 'cat_crazed_mythical':
      return (
        <svg width="96" height="110" viewBox="0 0 96 110" className="drop-shadow-2xl">
          {/* Massive Dark Muscular Torso */}
          <ellipse cx="48" cy="48" rx="30" ry="32" fill="#18181b" stroke="#71717a" strokeWidth="3.5" />
          {/* Crimson Tribal Tattoos */}
          <path d="M 28 36 Q 48 52 68 36" fill="none" stroke="#dc2626" strokeWidth="3" />
          <path d="M 32 50 Q 48 64 64 50" fill="none" stroke="#dc2626" strokeWidth="3" />
          {/* Head & Glowing Horns */}
          <circle cx="48" cy="22" r="16" fill="#18181b" stroke="#71717a" strokeWidth="3" />
          <polygon points="34,14 26,0 40,10" fill="#dc2626" stroke="#991b1b" strokeWidth="2" />
          <polygon points="62,14 70,0 56,10" fill="#dc2626" stroke="#991b1b" strokeWidth="2" />
          <circle cx="42" cy="20" r="3" fill="#ef4444" />
          <circle cx="54" cy="20" r="3" fill="#ef4444" />
          {/* Shockwave Wave Energy on Attack */}
          {isAttacking && (
            <g className="animate-ping">
              <circle cx="48" cy="70" r="28" fill="none" stroke="#ef4444" strokeWidth="4" />
            </g>
          )}
          {/* Gigantic Strong Legs */}
          <line x1="34" y1="78" x2={30 + legOffset1} y2="106" stroke="#71717a" strokeWidth="6" strokeLinecap="round" />
          <line x1="62" y1="78" x2={58 + legOffset2} y2="106" stroke="#71717a" strokeWidth="6" strokeLinecap="round" />
        </svg>
      );

    // ----------------- ENEMIES -----------------
    case 'enemy_doge':
      return (
        <svg width="56" height="52" viewBox="0 0 56 52" className="drop-shadow-sm">
          {/* Ears */}
          <polygon points="14,14 18,4 26,14" fill="#fed7aa" stroke="#0f172a" strokeWidth="2" />
          <polygon points="34,14 42,4 46,14" fill="#fed7aa" stroke="#0f172a" strokeWidth="2" />
          {/* Dog Head & Snout */}
          <ellipse cx="30" cy="26" rx="18" ry="16" fill="#ffedd5" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx="40" cy="30" rx="9" ry="7" fill="#ffedd5" stroke="#0f172a" strokeWidth="1.5" />
          {/* Nose & Eyes */}
          <circle cx="47" cy="28" r="3" fill="#0f172a" />
          <circle cx="28" cy="24" r="2.5" fill="#0f172a" />
          <circle cx="36" cy="24" r="2.5" fill="#0f172a" />
          {/* Tail */}
          <path d="M 12 32 Q 4 28 6 20" fill="none" stroke="#fed7aa" strokeWidth="4" strokeLinecap="round" />
          <path d="M 12 32 Q 4 28 6 20" fill="none" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
          {/* Legs */}
          <ellipse cx={22 + legOffset1} cy="44" rx="4" ry="4" fill="#fed7aa" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx={38 + legOffset2} cy="44" rx="4" ry="4" fill="#fed7aa" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    case 'enemy_snache':
      return (
        <svg width="60" height="46" viewBox="0 0 60 46" className="drop-shadow-sm">
          {/* Coiled snake body */}
          <path
            d={`M 8 36 Q 16 ${20 + walkCycle * 4} 28 34 Q 40 ${20 - walkCycle * 4} 50 24`}
            fill="none"
            stroke="#86efac"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d={`M 8 36 Q 16 ${20 + walkCycle * 4} 28 34 Q 40 ${20 - walkCycle * 4} 50 24`}
            fill="none"
            stroke="#0f172a"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Snake Head */}
          <ellipse cx="50" cy="24" rx="9" ry="8" fill="#86efac" stroke="#0f172a" strokeWidth="2" />
          <circle cx="52" cy="22" r="2.5" fill="#0f172a" />
          {/* Forked Tongue */}
          <path d="M 58 26 L 64 26 L 68 22 M 64 26 L 68 30" fill="none" stroke="#ef4444" strokeWidth="1.5" />
        </svg>
      );

    case 'enemy_guys':
      return (
        <svg width="46" height="56" viewBox="0 0 46 56" className="drop-shadow-sm">
          {/* Stickman */}
          <circle cx="23" cy="14" r="8" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          <circle cx="21" cy="13" r="1.5" fill="#0f172a" />
          <circle cx="25" cy="13" r="1.5" fill="#0f172a" />
          {/* Body */}
          <line x1="23" y1="22" x2="23" y2="38" stroke="#0f172a" strokeWidth="2.5" />
          {/* Arms running */}
          <line x1="23" y1="26" x2={14 + legOffset1 * 1.5} y2="32" stroke="#0f172a" strokeWidth="2" />
          <line x1="23" y1="26" x2={32 + legOffset2 * 1.5} y2="32" stroke="#0f172a" strokeWidth="2" />
          {/* Legs */}
          <line x1="23" y1="38" x2={16 + legOffset1 * 2} y2="52" stroke="#0f172a" strokeWidth="2.5" />
          <line x1="23" y1="38" x2={30 + legOffset2 * 2} y2="52" stroke="#0f172a" strokeWidth="2.5" />
        </svg>
      );

    case 'enemy_hippoe':
      return (
        <svg width="78" height="66" viewBox="0 0 78 66" className="drop-shadow-md">
          {/* Hippo Ears */}
          <ellipse cx="22" cy="14" rx="4" ry="6" fill="#f472b6" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx="36" cy="14" rx="4" ry="6" fill="#f472b6" stroke="#0f172a" strokeWidth="2" />
          {/* Hippo Big Head & Body */}
          <ellipse cx="32" cy="34" rx="24" ry="20" fill="#f472b6" stroke="#0f172a" strokeWidth="2.5" />
          {/* Giant Snout */}
          <ellipse cx="54" cy="38" rx="18" ry="15" fill="#f472b6" stroke="#0f172a" strokeWidth="2.5" />
          {/* Nostrils */}
          <ellipse cx="62" cy="34" rx="3" ry="4" fill="#0f172a" />
          <circle cx="34" cy="24" r="3" fill="#0f172a" />
          {/* Stubby Legs */}
          <rect x={18 + legOffset1} y="48" width="10" height="14" rx="3" fill="#f472b6" stroke="#0f172a" strokeWidth="2" />
          <rect x={38 + legOffset2} y="48" width="10" height="14" rx="3" fill="#f472b6" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    case 'enemy_seal':
      return (
        <svg width="74" height="54" viewBox="0 0 74 54" className="drop-shadow-md">
          {/* Red Seal Body */}
          <path d="M 12 36 Q 30 16 62 26 Q 70 34 60 44 Q 30 50 12 36 Z" fill="#ef4444" stroke="#0f172a" strokeWidth="2.5" />
          {/* Seal Tail */}
          <polygon points="12,36 2,26 4,46" fill="#ef4444" stroke="#0f172a" strokeWidth="2" />
          {/* Seal Face */}
          <circle cx="56" cy="30" r="3" fill="#0f172a" />
          <circle cx="64" cy="34" r="2.5" fill="#0f172a" />
          {/* Whiskers */}
          <line x1="58" y1="36" x2="68" y2="38" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="58" y1="40" x2="68" y2="42" stroke="#0f172a" strokeWidth="1.5" />
          {/* Flippers */}
          <ellipse cx={38 + legOffset1} cy="42" rx="8" ry="5" fill="#dc2626" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    case 'enemy_moth':
      return (
        <svg width="84" height="74" viewBox="0 0 84 74" className="drop-shadow-xl">
          {/* Floating Moth Wings */}
          <path d={`M 36 34 Q 8 ${6 + walkCycle * 8} 20 54 Z`} fill="#c084fc" stroke="#0f172a" strokeWidth="2" />
          <path d={`M 48 34 Q 76 ${6 + walkCycle * 8} 64 54 Z`} fill="#c084fc" stroke="#0f172a" strokeWidth="2" />
          {/* Moth Body */}
          <ellipse cx="42" cy="40" rx="8" ry="18" fill="#eab308" stroke="#0f172a" strokeWidth="2" />
          {/* Compound Eyes */}
          <circle cx="38" cy="28" r="4" fill="#ef4444" stroke="#0f172a" strokeWidth="1.5" />
          <circle cx="46" cy="28" r="4" fill="#ef4444" stroke="#0f172a" strokeWidth="1.5" />
          {/* Antennae */}
          <path d="M 38 24 Q 30 10 24 12" fill="none" stroke="#0f172a" strokeWidth="2" />
          <path d="M 46 24 Q 54 10 60 12" fill="none" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    case 'enemy_pigge':
      return (
        <svg width="68" height="58" viewBox="0 0 68 58" className="drop-shadow-md">
          {/* Red Pig Body */}
          <ellipse cx="32" cy="30" rx="20" ry="17" fill="#f87171" stroke="#0f172a" strokeWidth="2.5" />
          {/* Ears */}
          <polygon points="18,16 22,6 28,16" fill="#ef4444" stroke="#0f172a" strokeWidth="2" />
          <polygon points="34,16 40,6 44,16" fill="#ef4444" stroke="#0f172a" strokeWidth="2" />
          {/* Pig Snout */}
          <ellipse cx="46" cy="32" rx="10" ry="8" fill="#fca5a5" stroke="#0f172a" strokeWidth="2" />
          <circle cx="43" cy="32" r="2" fill="#0f172a" />
          <circle cx="49" cy="32" r="2" fill="#0f172a" />
          {/* Angry Eyes */}
          <polygon points="26,22 32,25 28,27" fill="#0f172a" />
          <polygon points="40,22 34,25 38,27" fill="#0f172a" />
          {/* Legs */}
          <rect x={20 + legOffset1} y="44" width="6" height="10" rx="2" fill="#ef4444" stroke="#0f172a" strokeWidth="2" />
          <rect x={36 + legOffset2} y="44" width="6" height="10" rx="2" fill="#ef4444" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    case 'enemy_face':
      return (
        <svg width="90" height="96" viewBox="0 0 90 96" className="drop-shadow-2xl">
          {/* Floating Giant Face (Kaoru-kun / The Face) */}
          <ellipse cx="45" cy="48" rx="36" ry="42" fill="#e2e8f0" stroke="#0f172a" strokeWidth="3.5" />
          {/* Creepy Realistic Face features */}
          {/* Eyebrows */}
          <path d="M 22 28 Q 32 24 40 28 M 50 28 Q 58 24 68 28" stroke="#0f172a" strokeWidth="3" fill="none" />
          {/* Bloodshot Glowing Eyes */}
          <ellipse cx="32" cy="36" rx="7" ry="8" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          <circle cx="33" cy="36" r="3.5" fill="#ef4444" />
          <ellipse cx="58" cy="36" rx="7" ry="8" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          <circle cx="57" cy="36" r="3.5" fill="#ef4444" />
          {/* Nose */}
          <path d="M 45 36 L 42 52 L 48 52" fill="none" stroke="#0f172a" strokeWidth="2.5" />
          {/* Giant Chattering Teeth Mouth */}
          <rect x="24" y="60" width="42" height="18" rx="4" fill="#ef4444" stroke="#0f172a" strokeWidth="2.5" />
          <line x1="24" y1="69" x2="66" y2="69" stroke="#f8fafc" strokeWidth="6" />
          <line x1="32" y1="60" x2="32" y2="78" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="42" y1="60" x2="42" y2="78" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="52" y1="60" x2="52" y2="78" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="60" y1="60" x2="60" y2="78" stroke="#0f172a" strokeWidth="1.5" />
        </svg>
      );

    case 'enemy_bunbun':
    case 'enemy_red_bunbun':
    case 'enemy_black_bunbun':
    case 'enemy_alien_bunbun':
    case 'enemy_star_bunbun':
    case 'enemy_angel_bunbun':
    case 'enemy_relic_bunbun': {
      const isRed = type === 'enemy_red_bunbun';
      const isBlack = type === 'enemy_black_bunbun';
      const isAlien = type === 'enemy_alien_bunbun';
      const isStar = type === 'enemy_star_bunbun';
      const isAngel = type === 'enemy_angel_bunbun';
      const isRelic = type === 'enemy_relic_bunbun';

      const torsoColor = isRed ? '#991b1b' : isBlack ? '#18181b' : isAlien ? '#0891b2' : isStar ? '#1e1b4b' : isAngel ? '#fef08a' : isRelic ? '#713f12' : '#78350f';
      const gloveColor = isRed ? '#ef4444' : isBlack ? '#dc2626' : isAlien ? '#06b6d4' : isStar ? '#3b82f6' : isAngel ? '#facc15' : isRelic ? '#ca8a04' : '#dc2626';
      const bandanaColor = isRed ? '#f87171' : isBlack ? '#7f1d1d' : isAlien ? '#22d3ee' : isStar ? '#a855f7' : isAngel ? '#fef9c3' : isRelic ? '#fbbf24' : '#dc2626';
      const faceColor = isRed ? '#fca5a5' : isBlack ? '#3f3f46' : isAlien ? '#a5f3fc' : isStar ? '#c084fc' : isAngel ? '#ffffff' : isRelic ? '#fde047' : '#fbcfe8';

      return (
        <svg width="96" height="96" viewBox="0 0 96 96" className="drop-shadow-2xl">
          {/* Angel Wings / Relic Gears / Star Nebula */}
          {isAngel && (
            <g className="animate-pulse">
              <path d="M 28 32 Q 4 10 12 50 Z" fill="#ffffff" stroke="#facc15" strokeWidth="2" />
              <path d="M 68 32 Q 92 10 84 50 Z" fill="#ffffff" stroke="#facc15" strokeWidth="2" />
              <ellipse cx="48" cy="14" rx="16" ry="5" fill="none" stroke="#facc15" strokeWidth="3" />
            </g>
          )}
          {isStar && (
            <ellipse cx="48" cy="48" rx="44" ry="16" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4,4" className="animate-spin" />
          )}

          {/* Spinning Boxing Gloves */}
          <g className="animate-spin" style={{ transformOrigin: '48px 48px' }}>
            <circle cx="16" cy="48" r="15" fill={gloveColor} stroke="#0f172a" strokeWidth="3" />
            <circle cx="80" cy="48" r="15" fill={gloveColor} stroke="#0f172a" strokeWidth="3" />
            {isAlien && <circle cx="16" cy="48" r="6" fill="#67e8f9" />}
            {isAlien && <circle cx="80" cy="48" r="6" fill="#67e8f9" />}
            {isBlack && <circle cx="16" cy="48" r="5" fill="#450a0a" />}
            {isBlack && <circle cx="80" cy="48" r="5" fill="#450a0a" />}
          </g>

          {/* Muscular Torso */}
          <ellipse cx="48" cy="48" rx="26" ry="32" fill={torsoColor} stroke="#0f172a" strokeWidth="3.5" />

          {/* Fierce Face with Bandana */}
          <rect x="28" y="24" width="40" height="10" rx="2" fill={bandanaColor} stroke="#0f172a" strokeWidth="2" />
          <circle cx="48" cy="34" r="16" fill={faceColor} stroke="#0f172a" strokeWidth="2.5" />
          
          {/* Eyes */}
          <ellipse cx="42" cy="32" rx="3" ry="3" fill={isBlack || isRed ? '#ef4444' : isAngel ? '#3b82f6' : '#0f172a'} />
          <ellipse cx="54" cy="32" rx="3" ry="3" fill={isBlack || isRed ? '#ef4444' : isAngel ? '#3b82f6' : '#0f172a'} />
          
          {/* Mouth */}
          <line x1="38" y1="42" x2="58" y2="42" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    }

    case 'enemy_super_metal_hippoe':
      return (
        <svg width="86" height="74" viewBox="0 0 86 74" className="drop-shadow-2xl">
          {/* Super Steel Armored Hippo */}
          <ellipse cx="28" cy="16" rx="5" ry="7" fill="#94a3b8" stroke="#0f172a" strokeWidth="2.5" />
          <ellipse cx="44" cy="16" rx="5" ry="7" fill="#94a3b8" stroke="#0f172a" strokeWidth="2.5" />
          <ellipse cx="38" cy="38" rx="28" ry="24" fill="#cbd5e1" stroke="#0f172a" strokeWidth="3" />
          <ellipse cx="62" cy="42" rx="20" ry="18" fill="#e2e8f0" stroke="#0f172a" strokeWidth="3" />
          {/* Metal Bolts and Armor Plates */}
          <circle cx="34" cy="30" r="3" fill="#64748b" />
          <circle cx="46" cy="30" r="3" fill="#64748b" />
          <line x1="20" y1="38" x2="54" y2="38" stroke="#64748b" strokeWidth="2" />
          {/* Glowing Red Robotic Eyes */}
          <circle cx="40" cy="26" r="3.5" fill="#ef4444" className="animate-pulse" />
          {/* Snout Nostrils */}
          <ellipse cx="72" cy="38" rx="4" ry="5" fill="#0f172a" />
          {/* Armored Legs */}
          <rect x={22 + legOffset1} y="54" width="12" height="16" rx="3" fill="#94a3b8" stroke="#0f172a" strokeWidth="2.5" />
          <rect x={44 + legOffset2} y="54" width="12" height="16" rx="3" fill="#94a3b8" stroke="#0f172a" strokeWidth="2.5" />
        </svg>
      );

    case 'enemy_metal_cyclone':
      return (
        <svg width="96" height="96" viewBox="0 0 96 96" className="drop-shadow-2xl">
          {/* Rotating Metal Saws / Blades */}
          <g className="animate-spin" style={{ transformOrigin: '48px 48px' }}>
            <circle cx="48" cy="48" r="42" fill="#94a3b8" stroke="#334155" strokeWidth="3" strokeDasharray="12,6" />
            <polygon points="48,6 56,24 40,24" fill="#cbd5e1" stroke="#0f172a" strokeWidth="2" />
            <polygon points="90,48 72,56 72,40" fill="#cbd5e1" stroke="#0f172a" strokeWidth="2" />
            <polygon points="48,90 40,72 56,72" fill="#cbd5e1" stroke="#0f172a" strokeWidth="2" />
            <polygon points="6,48 24,40 24,56" fill="#cbd5e1" stroke="#0f172a" strokeWidth="2" />
          </g>
          {/* Center Steel Core with Glowing Crimson Eye */}
          <circle cx="48" cy="48" r="24" fill="#334155" stroke="#0f172a" strokeWidth="3" />
          <circle cx="48" cy="48" r="14" fill="#ef4444" stroke="#f87171" strokeWidth="2" className="animate-ping" />
          <circle cx="48" cy="48" r="8" fill="#ffffff" />
        </svg>
      );

    case 'enemy_zombie_master':
      return (
        <svg width="98" height="98" viewBox="0 0 98 98" className="drop-shadow-2xl">
          {/* Grim Reaper Robe (Purple/Dark) */}
          <path d="M 24 36 Q 49 10 74 36 L 82 86 Q 49 76 16 86 Z" fill="#2e1065" stroke="#581c87" strokeWidth="3" />
          {/* Skull Face */}
          <circle cx="49" cy="36" r="16" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2.5" />
          <ellipse cx="44" cy="34" rx="3.5" ry="4.5" fill="#0f172a" />
          <ellipse cx="54" cy="34" rx="3.5" ry="4.5" fill="#0f172a" />
          <polygon points="49,38 47,43 51,43" fill="#0f172a" />
          <path d="M 42 47 L 56 47" stroke="#0f172a" strokeWidth="2" />
          {/* Death Scythe */}
          <g transform={isAttacking ? "rotate(40 68 36)" : "rotate(-10 68 36)"} className="transition-transform duration-100">
            <line x1="68" y1="12" x2="68" y2="88" stroke="#78350f" strokeWidth="4" />
            <path d="M 68 14 Q 92 -4 94 28 Q 78 22 68 18" fill="#84cc16" stroke="#0f172a" strokeWidth="2.5" />
          </g>
          {/* Toxic Miasma Bubbles */}
          <circle cx="28" cy="65" r="5" fill="#a855f7" opacity="0.7" className="animate-bounce" />
          <circle cx="70" cy="72" r="6" fill="#22c55e" opacity="0.7" className="animate-pulse" />
        </svg>
      );

    case 'enemy_ancient_omega':
      return (
        <svg width="105" height="105" viewBox="0 0 105 105" className="drop-shadow-2xl">
          {/* Transcendent Omega God Halo */}
          <g className="animate-spin" style={{ transformOrigin: '52px 52px' }}>
            <circle cx="52" cy="52" r="46" fill="none" stroke="#fbbf24" strokeWidth="3" strokeDasharray="14,8" />
            <circle cx="52" cy="6" r="6" fill="#ef4444" />
            <circle cx="98" cy="52" r="6" fill="#3b82f6" />
            <circle cx="52" cy="98" r="6" fill="#a855f7" />
            <circle cx="6" cy="52" r="6" fill="#22c55e" />
          </g>
          {/* Divine Body */}
          <path d="M 32 46 Q 52 14 72 46 L 78 92 Q 52 84 26 92 Z" fill="#78350f" stroke="#fbbf24" strokeWidth="3" />
          {/* Supreme Golden Face */}
          <circle cx="52" cy="38" r="18" fill="#fef08a" stroke="#d97706" strokeWidth="3" />
          {/* Third Eye of Omniscience */}
          <ellipse cx="52" cy="28" rx="4" ry="2.5" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1" />
          <ellipse cx="46" cy="38" rx="3.5" ry="3.5" fill="#0f172a" />
          <ellipse cx="58" cy="38" rx="3.5" ry="3.5" fill="#0f172a" />
          <path d="M 44 48 Q 52 54 60 48" fill="none" stroke="#0f172a" strokeWidth="2.5" />
          {/* Glowing Divine Aura Hands */}
          {isAttacking && (
            <circle cx="52" cy="52" r="38" fill="#f59e0b" fillOpacity="0.4" className="animate-ping" />
          )}
        </svg>
      );

    case 'enemy_alien_doge':
      return (
        <svg width="60" height="54" viewBox="0 0 60 54" className="drop-shadow-lg">
          {/* Alien Antenna */}
          <line x1="30" y1="12" x2="30" y2="2" stroke="#06b6d4" strokeWidth="2.5" />
          <circle cx="30" cy="2" r="3.5" fill="#22d3ee" className="animate-ping" />
          {/* Alien Doge Body */}
          <ellipse cx="30" cy="28" rx="19" ry="17" fill="#06b6d4" stroke="#083344" strokeWidth="2.5" />
          <ellipse cx="42" cy="32" rx="9" ry="7" fill="#22d3ee" stroke="#083344" strokeWidth="2" />
          {/* Glowing Eyes */}
          <ellipse cx="26" cy="25" rx="3" ry="4" fill="#fef08a" />
          <ellipse cx="36" cy="25" rx="3" ry="4" fill="#fef08a" />
          <circle cx="48" cy="30" r="3" fill="#083344" />
          {/* Legs */}
          <ellipse cx={22 + legOffset1} cy="46" rx="4" ry="4" fill="#0891b2" stroke="#083344" strokeWidth="2" />
          <ellipse cx={38 + legOffset2} cy="46" rx="4" ry="4" fill="#0891b2" stroke="#083344" strokeWidth="2" />
        </svg>
      );

    case 'enemy_alien_crab':
      return (
        <svg width="74" height="66" viewBox="0 0 74 66" className="drop-shadow-xl">
          {/* Alien Crab Glowing Claws */}
          <g transform={isAttacking ? "rotate(20 16 26)" : "rotate(-10 16 26)"}>
            <polygon points="16,26 4,10 0,28" fill="#06b6d4" stroke="#083344" strokeWidth="2" />
          </g>
          <g transform={isAttacking ? "rotate(-20 58 26)" : "rotate(10 58 26)"}>
            <polygon points="58,26 70,10 74,28" fill="#06b6d4" stroke="#083344" strokeWidth="2" />
          </g>
          {/* Crab Shell */}
          <ellipse cx="37" cy="36" rx="22" ry="16" fill="#0891b2" stroke="#083344" strokeWidth="2.5" />
          {/* Stalk Eyes */}
          <line x1="30" y1="24" x2="28" y2="16" stroke="#083344" strokeWidth="3" />
          <circle cx="28" cy="14" r="4" fill="#facc15" stroke="#083344" strokeWidth="2" />
          <line x1="44" y1="24" x2="46" y2="16" stroke="#083344" strokeWidth="3" />
          <circle cx="46" cy="14" r="4" fill="#facc15" stroke="#083344" strokeWidth="2" />
          {/* Scuttling Legs */}
          <line x1="22" y1="46" x2={16 + legOffset1} y2="60" stroke="#083344" strokeWidth="2.5" />
          <line x1="30" y1="46" x2={26 + legOffset2} y2="60" stroke="#083344" strokeWidth="2.5" />
          <line x1="44" y1="46" x2={48 + legOffset1} y2="60" stroke="#083344" strokeWidth="2.5" />
          <line x1="52" y1="46" x2={58 + legOffset2} y2="60" stroke="#083344" strokeWidth="2.5" />
        </svg>
      );

    case 'enemy_alien_pigge':
      return (
        <svg width="74" height="62" viewBox="0 0 74 62" className="drop-shadow-lg">
          {/* Alien Pig Body (Cyan/Teal) */}
          <ellipse cx="36" cy="32" rx="22" ry="18" fill="#06b6d4" stroke="#083344" strokeWidth="2.5" />
          {/* Ears */}
          <polygon points="20,16 26,6 32,16" fill="#0891b2" stroke="#083344" strokeWidth="2" />
          <polygon points="38,16 44,6 48,16" fill="#0891b2" stroke="#083344" strokeWidth="2" />
          {/* Snout */}
          <ellipse cx="52" cy="34" rx="11" ry="9" fill="#22d3ee" stroke="#083344" strokeWidth="2" />
          <circle cx="48" cy="34" r="2.5" fill="#083344" />
          <circle cx="55" cy="34" r="2.5" fill="#083344" />
          {/* Neon Eyes */}
          <circle cx="32" cy="24" r="3.5" fill="#fef08a" stroke="#083344" strokeWidth="1.5" />
          <circle cx="42" cy="24" r="3.5" fill="#fef08a" stroke="#083344" strokeWidth="1.5" />
          {/* Legs */}
          <rect x={22 + legOffset1} y="46" width="7" height="11" rx="2" fill="#0891b2" stroke="#083344" strokeWidth="2" />
          <rect x={40 + legOffset2} y="46" width="7" height="11" rx="2" fill="#0891b2" stroke="#083344" strokeWidth="2" />
        </svg>
      );

    case 'enemy_black_gorilla':
      return (
        <svg width="78" height="74" viewBox="0 0 78 74" className="drop-shadow-xl">
          {/* Black Gorilla Body */}
          <ellipse cx="38" cy="40" rx="26" ry="24" fill="#18181b" stroke="#09090b" strokeWidth="3" />
          {/* Chest Muscles */}
          <path d="M 26 34 Q 38 46 50 34" fill="none" stroke="#3f3f46" strokeWidth="3" />
          {/* Red Glowing Eyes */}
          <circle cx="32" cy="26" r="3" fill="#ef4444" />
          <circle cx="44" cy="26" r="3" fill="#ef4444" />
          {/* Gorilla Fists */}
          <ellipse cx={18 + (isAttacking ? 12 : legOffset1)} cy="50" rx="9" ry="9" fill="#27272a" stroke="#09090b" strokeWidth="2" />
          <ellipse cx={58 + (isAttacking ? -12 : legOffset2)} cy="50" rx="9" ry="9" fill="#27272a" stroke="#09090b" strokeWidth="2" />
        </svg>
      );

    case 'enemy_star_peng':
      return (
        <svg width="68" height="66" viewBox="0 0 68 66" className="drop-shadow-lg">
          {/* Space Helmet */}
          <circle cx="34" cy="24" r="18" fill="#38bdf8" fillOpacity="0.4" stroke="#0284c7" strokeWidth="2.5" />
          {/* Penguin Head */}
          <circle cx="34" cy="24" r="12" fill="#0f172a" stroke="#0284c7" strokeWidth="1.5" />
          <polygon points="34,22 46,26 34,30" fill="#facc15" stroke="#0f172a" strokeWidth="1.5" />
          <circle cx="32" cy="20" r="2.5" fill="#f8fafc" />
          {/* Space Suit Body */}
          <ellipse cx="34" cy="46" rx="16" ry="14" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2" />
          {/* Flippers */}
          <ellipse cx={20 + legOffset1} cy="46" rx="5" ry="9" fill="#0284c7" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx={48 + legOffset2} cy="46" rx="5" ry="9" fill="#0284c7" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    // ==========================================
    // 9 CHAPTER UNIQUE BOSSES
    // ==========================================

    // Chapter 2 Boss: Emperor Nyandam (悪の帝王ニャンダム)
    case 'enemy_nyandam':
      return (
        <svg width="105" height="105" viewBox="0 0 105 105" className="drop-shadow-2xl">
          {/* Evil Crimson Throne */}
          <rect x="22" y="30" width="60" height="60" rx="6" fill="#7f1d1d" stroke="#450a0a" strokeWidth="3" />
          <polygon points="18,30 28,10 40,30" fill="#991b1b" stroke="#450a0a" strokeWidth="2" />
          <polygon points="64,30 76,10 86,30" fill="#991b1b" stroke="#450a0a" strokeWidth="2" />
          {/* Horned Demon Overlord */}
          <ellipse cx="52" cy="48" rx="22" ry="24" fill="#dc2626" stroke="#450a0a" strokeWidth="2.5" />
          {/* Golden Demonic Horns */}
          <polygon points="36,32 30,14 42,26" fill="#f59e0b" stroke="#450a0a" strokeWidth="2" />
          <polygon points="68,32 74,14 62,26" fill="#f59e0b" stroke="#450a0a" strokeWidth="2" />
          {/* Sinister Red Eyes */}
          <polygon points="42,42 48,46 44,48" fill="#fef08a" stroke="#0f172a" strokeWidth="1" />
          <polygon points="62,42 56,46 60,48" fill="#fef08a" stroke="#0f172a" strokeWidth="1" />
          {/* Wine Glass in Hand */}
          <polygon points="76,52 86,52 81,64" fill="#991b1b" stroke="#facc15" strokeWidth="1.5" />
          <line x1="81" y1="64" x2="81" y2="72" stroke="#facc15" strokeWidth="2" />
          {/* Meteor summoning FX on attack */}
          {isAttacking && (
            <g className="animate-ping">
              <circle cx="52" cy="18" r="16" fill="#f97316" fillOpacity="0.8" stroke="#ef4444" strokeWidth="3" />
            </g>
          )}
        </svg>
      );

    // Chapter 4 (Future 1) Boss: Alien Clione (侵略生命体クリ・オネ)
    case 'enemy_clione':
      return (
        <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-2xl">
          {/* Translucent Alien Clione Body */}
          <path
            d="M 50 18 Q 70 35 62 70 Q 50 90 38 70 Q 30 35 50 18 Z"
            fill="#06b6d4"
            fillOpacity="0.75"
            stroke="#083344"
            strokeWidth="3"
          />
          {/* Cosmic Glowing Viscera Core */}
          <circle cx="50" cy="46" r="12" fill="#f43f5e" className="animate-pulse" />
          {/* Floating Clione Wings */}
          <ellipse
            cx={28}
            cy={42 + walkCycle * 4}
            rx="16"
            ry="9"
            fill="#22d3ee"
            fillOpacity="0.8"
            stroke="#083344"
            strokeWidth="2"
            transform="rotate(-25 28 42)"
          />
          <ellipse
            cx={72}
            cy={42 - walkCycle * 4}
            rx="16"
            ry="9"
            fill="#22d3ee"
            fillOpacity="0.8"
            stroke="#083344"
            strokeWidth="2"
            transform="rotate(25 72 42)"
          />
          {/* Piercing Cosmic Laser on Attack */}
          {isAttacking && (
            <line x1="50" y1="46" x2="-80" y2="46" stroke="#f43f5e" strokeWidth="8" strokeLinecap="round" className="animate-ping" />
          )}
          {/* Buccal Cones (tentacles on head) */}
          <polygon points="46,18 42,4 48,12" fill="#f43f5e" stroke="#083344" strokeWidth="1.5" />
          <polygon points="54,18 58,4 52,12" fill="#f43f5e" stroke="#083344" strokeWidth="1.5" />
        </svg>
      );

    // Chapter 5 (Future 2) Boss: Corrupted Valkyrie (反逆の戦乙女ヴァルキリー)
    case 'enemy_valkyrie_corrupt':
      return (
        <svg width="105" height="105" viewBox="0 0 105 105" className="drop-shadow-2xl">
          {/* Dark Cyber Wings */}
          <polygon points="50,45 10,15 25,60" fill="#0284c7" stroke="#083344" strokeWidth="2.5" />
          <polygon points="50,45 90,15 75,60" fill="#0284c7" stroke="#083344" strokeWidth="2.5" />
          {/* Slender Cyber Warrior Body */}
          <ellipse cx="50" cy="52" rx="14" ry="24" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
          {/* Cybernetic Visor Face */}
          <circle cx="50" cy="30" r="14" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          <rect x="40" y="26" width="20" height="6" rx="2" fill="#ef4444" className="animate-pulse" />
          {/* Cyber Valkyrie Spear */}
          <line
            x1={isAttacking ? "-10" : "20"}
            y1="50"
            x2="80"
            y2="50"
            stroke="#38bdf8"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <polygon points="15,44 0,50 15,56" fill="#facc15" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    // Chapter 6 (Future 3) Boss: Raging Bahamut (暴走の狂乱ネコムート)
    case 'enemy_bahamut_corrupt':
      return (
        <svg width="115" height="115" viewBox="0 0 115 115" className="drop-shadow-2xl">
          {/* Massive Dragon Wings */}
          <path d="M 55 45 Q 10 10 15 70 Z" fill="#4c1d95" stroke="#0f172a" strokeWidth="3" />
          <path d="M 60 45 Q 105 10 100 70 Z" fill="#4c1d95" stroke="#0f172a" strokeWidth="3" />
          {/* Ancient Deity Torso */}
          <ellipse cx="58" cy="58" rx="22" ry="28" fill="#1e1b4b" stroke="#7c3aed" strokeWidth="3" />
          {/* Ferocious Dragon Skull */}
          <polygon points="58,15 42,35 74,35" fill="#f8fafc" stroke="#0f172a" strokeWidth="3" />
          <circle cx="50" cy="28" r="3" fill="#ef4444" />
          <circle cx="66" cy="28" r="3" fill="#ef4444" />
          {/* Supernova Dark Ball on attack */}
          {isAttacking && (
            <circle cx="58" cy="90" r="22" fill="#7c3aed" stroke="#c084fc" strokeWidth="4" className="animate-ping" />
          )}
          {/* Claws */}
          <ellipse cx={40 + legOffset1} cy="86" rx="8" ry="8" fill="#312e81" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx={76 + legOffset2} cy="86" rx="8" ry="8" fill="#312e81" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    // Chapter 7 (Cosmos 1) Boss: Space Cyclone (スペースサイクロン)
    case 'enemy_space_cyclone':
      return (
        <svg width="110" height="110" viewBox="0 0 110 110" className="drop-shadow-2xl">
          {/* Swirling Cosmic Vortex Blades */}
          <g className="animate-spin" style={{ transformOrigin: '55px 55px' }}>
            <circle cx="55" cy="55" r="48" fill="none" stroke="#06b6d4" strokeWidth="6" strokeDasharray="20,10" />
            <polygon points="55,10 40,55 55,55" fill="#0891b2" />
            <polygon points="100,55 55,40 55,55" fill="#0891b2" />
            <polygon points="55,100 70,55 55,55" fill="#0891b2" />
            <polygon points="10,55 55,70 55,55" fill="#0891b2" />
          </g>
          {/* Dark Event Horizon Core */}
          <circle cx="55" cy="55" r="26" fill="#09090b" stroke="#22d3ee" strokeWidth="4" />
          <circle cx="55" cy="55" r="10" fill="#f43f5e" className="animate-pulse" />
        </svg>
      );

    // Chapter 8 (Cosmos 2) Boss: Supreme Commander Big Peng (スター司令官ビッグ・ペン)
    case 'enemy_big_peng':
      return (
        <svg width="110" height="110" viewBox="0 0 110 110" className="drop-shadow-2xl">
          {/* Powered Armor Suit */}
          <ellipse cx="55" cy="60" rx="36" ry="34" fill="#0284c7" stroke="#082f49" strokeWidth="3.5" />
          {/* Golden Commander Epaulets */}
          <polygon points="20,40 32,32 36,46" fill="#fbbf24" stroke="#082f49" strokeWidth="2" />
          <polygon points="90,40 78,32 74,46" fill="#fbbf24" stroke="#082f49" strokeWidth="2" />
          {/* Penguin Helmet & Glowing Visor */}
          <circle cx="55" cy="36" r="20" fill="#0f172a" stroke="#082f49" strokeWidth="3" />
          <rect x="42" y="32" width="26" height="8" rx="3" fill="#facc15" stroke="#082f49" strokeWidth="1.5" />
          <polygon points="55,42 68,46 55,50" fill="#f97316" stroke="#082f49" strokeWidth="2" />
          {/* Twin Heavy Laser Cannons */}
          <rect x="12" y="55" width="16" height="24" rx="4" fill="#38bdf8" stroke="#082f49" strokeWidth="2" />
          <rect x="82" y="55" width="16" height="24" rx="4" fill="#38bdf8" stroke="#082f49" strokeWidth="2" />
        </svg>
      );

    // Chapter 9 (Cosmos 3) FINAL CLIMAX BOSS: Final Cosmic God Cat (宇宙創世神 ファイナル・ネコゴッド)
    case 'enemy_cosmos_god_final':
      return (
        <svg width="130" height="130" viewBox="0 0 130 130" className="drop-shadow-2xl">
          {/* Multi-tier Rotating Divine Halo */}
          <g className="animate-spin" style={{ transformOrigin: '65px 65px' }}>
            <circle cx="65" cy="65" r="58" fill="none" stroke="#fbbf24" strokeWidth="4" strokeDasharray="14,8" />
            <circle cx="65" cy="65" r="50" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="8,6" />
          </g>
          {/* Radiant Sunburst Rays */}
          <polygon points="65,4 69,20 61,20" fill="#fef08a" />
          <polygon points="126,65 110,69 110,61" fill="#fef08a" />
          <polygon points="65,126 61,110 69,110" fill="#fef08a" />
          <polygon points="4,65 20,61 20,69" fill="#fef08a" />
          {/* Majestic God Face */}
          <ellipse cx="65" cy="62" rx="36" ry="40" fill="#fef3c7" stroke="#b45309" strokeWidth="3.5" />
          {/* God Cat Ears */}
          <polygon points="40,32 30,12 50,26" fill="#fef3c7" stroke="#b45309" strokeWidth="2.5" />
          <polygon points="90,32 100,12 80,26" fill="#fef3c7" stroke="#b45309" strokeWidth="2.5" />
          {/* Flowing Golden Divine Beard */}
          <path d="M 38 72 Q 65 112 92 72 Q 65 92 38 72 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="3" />
          {/* All-Seeing Cosmic Eyes */}
          <ellipse cx="52" cy="54" rx="5" ry="6" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="1.5" />
          <ellipse cx="78" cy="54" rx="5" ry="6" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="1.5" />
          {/* Third Eye / Universe Core Jewel */}
          <polygon points="65,30 72,40 65,50 58,40" fill="#ec4899" stroke="#b45309" strokeWidth="2.5" />
          {/* Divine Thunder Aura on attack */}
          {isAttacking && (
            <g className="animate-ping">
              <polygon points="65,0 80,30 65,40 85,70 50,60 65,0" fill="#fbbf24" fillOpacity="0.8" />
            </g>
          )}
        </svg>
      );

    case 'enemy_future_satellite':
      return (
        <svg width="96" height="96" viewBox="0 0 96 96" className="drop-shadow-2xl">
          {/* Orbital Rings */}
          <ellipse cx="48" cy="48" rx="44" ry="16" fill="none" stroke="#38bdf8" strokeWidth="3" transform="rotate(30 48 48)" />
          <ellipse cx="48" cy="48" rx="44" ry="16" fill="none" stroke="#818cf8" strokeWidth="2" transform="rotate(-30 48 48)" />
          {/* Satellite Core */}
          <circle cx="48" cy="48" r="22" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
          <circle cx="48" cy="48" r="12" fill="#ef4444" className="animate-pulse" />
          {/* Solar Panels */}
          <rect x="0" y="44" width="20" height="8" fill="#0369a1" stroke="#38bdf8" strokeWidth="1.5" />
          <rect x="76" y="44" width="20" height="8" fill="#0369a1" stroke="#38bdf8" strokeWidth="1.5" />
        </svg>
      );

    case 'enemy_cosmos_god':
      return (
        <svg width="105" height="105" viewBox="0 0 105 105" className="drop-shadow-2xl">
          {/* Divine Golden Halo & Beams */}
          <circle cx="52" cy="52" r="42" fill="none" stroke="#fbbf24" strokeWidth="4" strokeDasharray="6,4" className="animate-spin" />
          {/* God Head */}
          <ellipse cx="52" cy="50" rx="30" ry="34" fill="#fef3c7" stroke="#b45309" strokeWidth="3" />
          {/* Golden Beard & Mustache */}
          <path d="M 32 60 Q 52 88 72 60 Q 52 74 32 60 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
          {/* Cosmic Eyes */}
          <ellipse cx="42" cy="44" rx="4" ry="5" fill="#3b82f6" />
          <ellipse cx="62" cy="44" rx="4" ry="5" fill="#3b82f6" />
          {/* Third Eye / Galaxy Gem on Forehead */}
          <polygon points="52,24 57,32 52,40 47,32" fill="#ec4899" stroke="#b45309" strokeWidth="2" />
        </svg>
      );

    // --- NEW PLAYABLE CATS ---
    case 'cat_macho':
    case 'cat_mohican':
      const isMohican = type === 'cat_mohican';
      return (
        <svg width="60" height="66" viewBox="0 0 60 66" className="drop-shadow-md">
          {/* Mohican Hair */}
          {isMohican && (
            <path d="M 30 2 L 24 16 L 36 16 Z M 30 6 L 26 22 L 34 22 Z" fill="#ef4444" stroke="#7f1d1d" strokeWidth="2" />
          )}
          {/* Ears */}
          <polygon points="16,20 20,8 27,18" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />
          <polygon points="33,18 40,8 44,20" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />
          {/* Ripped Body */}
          <ellipse cx="30" cy="34" rx="19" ry="18" fill="#ffffff" stroke="#000000" strokeWidth="2.8" />
          {/* Fierce Macho Eyes */}
          <line x1="20" y1="26" x2="26" y2="30" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
          <line x1="40" y1="26" x2="34" y2="30" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
          <circle cx="23" cy="29" r="1.5" fill="#000000" />
          <circle cx="37" cy="29" r="1.5" fill="#000000" />
          {/* Macho Muscle Abs */}
          <path d="M 24 36 Q 30 40 36 36 M 30 36 L 30 48 M 26 42 L 34 42" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
          {/* Legs */}
          <ellipse cx={20 + legOffset1} cy="56" rx="5" ry="6" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />
          <ellipse cx={40 + legOffset2} cy="56" rx="5" ry="6" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />
        </svg>
      );

    case 'cat_jura':
    case 'cat_jurasaurus':
      const isSaurus = type === 'cat_jurasaurus';
      return (
        <svg width="68" height="66" viewBox="0 0 68 66" className="drop-shadow-md">
          {/* Dino Skull Helmet */}
          <path d="M 16 26 Q 34 4 52 26 Q 34 20 16 26 Z" fill={isSaurus ? "#fed7aa" : "#e2e8f0"} stroke="#0f172a" strokeWidth="2.5" />
          {/* Sharp Dino Teeth on Helmet */}
          <polygon points="22,24 25,29 28,24" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
          <polygon points="32,23 35,28 38,23" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
          <polygon points="42,24 45,29 48,24" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
          {/* Cat Head underneath */}
          <ellipse cx="34" cy="34" rx="18" ry="16" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
          {/* Eyes */}
          <ellipse cx="26" cy="32" rx="2.5" ry="3.5" fill="#0f172a" />
          <ellipse cx="42" cy="32" rx="2.5" ry="3.5" fill="#0f172a" />
          {/* Club / Bone Weapon */}
          <g transform={isAttacking ? "rotate(45 52 36)" : "rotate(-15 52 36)"} className="transition-transform duration-100">
            <rect x="50" y="16" width="6" height="28" rx="2" fill="#78350f" stroke="#0f172a" strokeWidth="1.5" />
            <circle cx="53" cy="14" r="8" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2" />
          </g>
          {/* Legs */}
          <ellipse cx={24 + legOffset1} cy="52" rx="4.5" ry="5.5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx={44 + legOffset2} cy="52" rx="4.5" ry="5.5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    case 'cat_surfer':
    case 'cat_castaway':
      const isCastaway = type === 'cat_castaway';
      return (
        <svg width="78" height="70" viewBox="0 0 78 70" className="drop-shadow-lg">
          {/* Cosmic Surfboard */}
          <ellipse cx="39" cy="56" rx="34" ry="7" fill={isCastaway ? "#38bdf8" : "#f59e0b"} stroke="#0f172a" strokeWidth="2.5" transform={`rotate(${walkCycle * 6} 39 56)`} />
          {/* Surfing Water / Cosmic Splashes */}
          <path d="M 6 56 Q 16 46 22 56 Q 28 66 34 56" fill="none" stroke="#67e8f9" strokeWidth="3" strokeLinecap="round" />
          {/* Cool Sunglasses & Head */}
          <ellipse cx="39" cy="28" rx="18" ry="17" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
          <polygon points="26,18 29,6 36,16" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <polygon points="42,16 49,6 52,18" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          {/* Sunglasses */}
          <rect x="25" y="24" width="13" height="8" rx="2" fill="#0f172a" />
          <rect x="40" y="24" width="13" height="8" rx="2" fill="#0f172a" />
          <line x1="38" y1="28" x2="40" y2="28" stroke="#0f172a" strokeWidth="2" />
          {/* Cool Smirk */}
          <path d="M 34 38 Q 42 42 45 36" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
          {/* Freezing Wave Particles on attack */}
          {isAttacking && (
            <circle cx="68" cy="30" r="12" fill="#38bdf8" fillOpacity="0.8" stroke="#0284c7" strokeWidth="2" className="animate-ping" />
          )}
        </svg>
      );

    case 'cat_bancho':
    case 'cat_bancho_rage':
      const isRage = type === 'cat_bancho_rage';
      return (
        <svg width="84" height="84" viewBox="0 0 84 84" className="drop-shadow-xl">
          {/* Flowing Delinquent Long Coat (Gakuran) */}
          <path d="M 22 36 Q 10 50 14 74 Q 42 66 70 74 Q 74 50 62 36 Z" fill="#09090b" stroke="#3f3f46" strokeWidth="2.5" />
          {/* Bancho Hat with Gold Cat Emblem */}
          <polygon points="20,24 64,24 58,12 26,12" fill="#09090b" stroke="#3f3f46" strokeWidth="2.5" />
          <circle cx="42" cy="18" r="4" fill="#fbbf24" stroke="#000000" strokeWidth="1.5" />
          {/* Intimidating Face */}
          <ellipse cx="42" cy="32" rx="16" ry="14" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />
          <line x1="30" y1="28" x2="38" y2="32" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
          <line x1="54" y1="28" x2="46" y2="32" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
          {/* Rapid Punch Effect on attack */}
          {isAttacking && (
            <g className="animate-pulse">
              <ellipse cx="72" cy="36" rx="14" ry="10" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
              <ellipse cx="76" cy="50" rx="14" ry="10" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
            </g>
          )}
        </svg>
      );

    case 'cat_aphrodite':
    case 'cat_aphrodite_true':
      const isTrueAphrodite = type === 'cat_aphrodite_true';
      return (
        <svg width="95" height="95" viewBox="0 0 95 95" className="drop-shadow-2xl">
          {/* Golden Angel Wings */}
          <path d="M 45 40 Q 15 15 20 65 Z" fill={isTrueAphrodite ? "#fbbf24" : "#fef08a"} stroke="#b45309" strokeWidth="2" />
          <path d="M 50 40 Q 80 15 75 65 Z" fill={isTrueAphrodite ? "#fbbf24" : "#fef08a"} stroke="#b45309" strokeWidth="2" />
          {/* Slender Goddess Robes */}
          <path d="M 35 45 Q 47.5 90 60 45 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
          {/* Divine Long Hair & Tiara */}
          <circle cx="47.5" cy="30" r="16" fill="#fef3c7" stroke="#b45309" strokeWidth="2" />
          <polygon points="40,16 47.5,8 55,16" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
          {/* Long Golden Bow */}
          <path d="M 68 15 Q 85 47.5 68 80" fill="none" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
          <line x1="68" y1="15" x2="68" y2="80" stroke="#fef08a" strokeWidth="1.5" strokeDasharray="3,3" />
          {/* Light Arrow on Attack */}
          {isAttacking && (
            <line x1="68" y1="47.5" x2="-60" y2="47.5" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" className="animate-ping" />
          )}
        </svg>
      );

    case 'cat_god':
    case 'cat_god_divine':
      const isDivine = type === 'cat_god_divine';
      return (
        <svg width="105" height="105" viewBox="0 0 105 105" className="drop-shadow-2xl">
          {/* Golden Rotating Sunburst Halo */}
          <circle cx="52" cy="52" r="44" fill="none" stroke="#fbbf24" strokeWidth="4" strokeDasharray="10,6" className="animate-spin" />
          {/* God Cloud Platform */}
          <ellipse cx="52" cy="80" rx="34" ry="12" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
          {/* Majestic God Face */}
          <ellipse cx="52" cy="46" rx="26" ry="28" fill="#fef3c7" stroke="#b45309" strokeWidth="3" />
          <path d="M 34 54 Q 52 82 70 54 Q 52 68 34 54 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
          {/* God Cat Ears */}
          <polygon points="34,24 24,8 42,18" fill="#fef3c7" stroke="#b45309" strokeWidth="2" />
          <polygon points="70,24 80,8 62,18" fill="#fef3c7" stroke="#b45309" strokeWidth="2" />
          {/* Thunder Lightning on Attack */}
          {isAttacking && (
            <g className="animate-ping">
              <polygon points="52,0 64,24 52,32 68,56 40,48 52,0" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
            </g>
          )}
        </svg>
      );

    // --- NEW ENEMIES ---
    case 'enemy_metal_hippoe':
      return (
        <svg width="90" height="70" viewBox="0 0 90 70" className="drop-shadow-2xl">
          {/* Steel Plated Heavy Armor Hippo */}
          <path d="M 18 52 Q 10 22 45 20 Q 75 20 85 45 Q 80 58 55 56 Q 30 58 18 52 Z" fill="#94a3b8" stroke="#334155" strokeWidth="3" />
          {/* Metallic Bolt Rivets */}
          <circle cx="28" cy="28" r="2.5" fill="#475569" />
          <circle cx="48" cy="26" r="2.5" fill="#475569" />
          <circle cx="68" cy="30" r="2.5" fill="#475569" />
          {/* Heavy Steel Snout & Giant Metal Teeth */}
          <rect x="65" y="38" width="18" height="16" rx="4" fill="#64748b" stroke="#1e293b" strokeWidth="2.5" />
          <polygon points="70,54 74,46 78,54" fill="#f8fafc" stroke="#1e293b" strokeWidth="1.5" />
          {/* Glowing Red Robotic Eye */}
          <circle cx="58" cy="30" r="4" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1.5" className="animate-pulse" />
          {/* Steel Stomp Feet */}
          <rect x={28 + legOffset1} y="54" width="14" height="12" rx="3" fill="#64748b" stroke="#1e293b" strokeWidth="2" />
          <rect x={54 + legOffset2} y="54" width="14" height="12" rx="3" fill="#64748b" stroke="#1e293b" strokeWidth="2" />
        </svg>
      );

    case 'enemy_red_face':
      return (
        <svg width="105" height="105" viewBox="0 0 105 105" className="drop-shadow-2xl">
          {/* Massive Crimson Floating Head */}
          <ellipse cx="52" cy="50" rx="38" ry="42" fill="#dc2626" stroke="#450a0a" strokeWidth="3.5" />
          {/* Fiery Red Face Brows */}
          <polygon points="26,26 48,34 32,38" fill="#7f1d1d" />
          <polygon points="78,26 56,34 72,38" fill="#7f1d1d" />
          {/* Piercing Demon Eyes */}
          <ellipse cx="36" cy="38" rx="6" ry="7" fill="#fef08a" stroke="#000000" strokeWidth="1.5" />
          <ellipse cx="68" cy="38" rx="6" ry="7" fill="#fef08a" stroke="#000000" strokeWidth="1.5" />
          <circle cx="36" cy="38" r="2.5" fill="#000000" />
          <circle cx="68" cy="38" r="2.5" fill="#000000" />
          {/* Huge Jaws Chomp Attack */}
          <path
            d={isAttacking ? "M 24 54 Q 52 88 80 54 Q 52 100 24 54 Z" : "M 30 62 Q 52 74 74 62 Q 52 80 30 62 Z"}
            fill="#450a0a"
            stroke="#000000"
            strokeWidth="3"
          />
          {/* Sharp Fangs */}
          <polygon points="38,58 42,66 46,58" fill="#ffffff" />
          <polygon points="58,58 62,66 66,58" fill="#ffffff" />
        </svg>
      );

    case 'enemy_gorilla':
      return (
        <svg width="78" height="74" viewBox="0 0 78 74" className="drop-shadow-lg">
          {/* Muscular Gorilla Torso */}
          <ellipse cx="39" cy="42" rx="26" ry="24" fill="#334155" stroke="#0f172a" strokeWidth="3" />
          {/* Gorilla Head & Crest */}
          <circle cx="39" cy="22" r="16" fill="#1e293b" stroke="#0f172a" strokeWidth="2.5" />
          <polygon points="34,8 39,2 44,8" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
          {/* Eyes & Nostrils */}
          <ellipse cx="33" cy="20" rx="2.5" ry="3" fill="#f8fafc" />
          <ellipse cx="45" cy="20" rx="2.5" ry="3" fill="#f8fafc" />
          <circle cx="33" cy="20" r="1.2" fill="#000000" />
          <circle cx="45" cy="20" r="1.2" fill="#000000" />
          <ellipse cx="39" cy="28" rx="6" ry="4" fill="#475569" />
          {/* Heavy Fist Slam Arms */}
          <ellipse cx={18 + legOffset1} cy="52" rx="9" ry="14" fill="#1e293b" stroke="#0f172a" strokeWidth="2.5" />
          <ellipse cx={60 + legOffset2} cy="52" rx="9" ry="14" fill="#1e293b" stroke="#0f172a" strokeWidth="2.5" />
        </svg>
      );

    case 'enemy_angel_hippoe':
      return (
        <svg width="90" height="75" viewBox="0 0 90 75" className="drop-shadow-2xl">
          {/* Golden Divine Halo */}
          <ellipse cx="45" cy="10" rx="18" ry="6" fill="none" stroke="#fbbf24" strokeWidth="3" className="animate-pulse" />
          {/* Angel Wings */}
          <path d="M 28 26 Q 10 10 20 40 Z" fill="#ffffff" stroke="#fbbf24" strokeWidth="2" />
          {/* Holy White Hippo Body */}
          <path d="M 18 52 Q 10 22 45 20 Q 75 20 85 45 Q 80 58 55 56 Q 30 58 18 52 Z" fill="#fefce8" stroke="#b45309" strokeWidth="2.8" />
          {/* Pure Golden Snout */}
          <rect x="65" y="38" width="18" height="16" rx="4" fill="#fef08a" stroke="#b45309" strokeWidth="2" />
          {/* Eyes */}
          <circle cx="58" cy="30" r="3.5" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="1" />
          {/* Legs */}
          <rect x={28 + legOffset1} y="54" width="14" height="12" rx="3" fill="#fefce8" stroke="#b45309" strokeWidth="2" />
          <rect x={54 + legOffset2} y="54" width="14" height="12" rx="3" fill="#fefce8" stroke="#b45309" strokeWidth="2" />
        </svg>
      );

    case 'enemy_god_final':
      return (
        <svg width="135" height="135" viewBox="0 0 135 135" className="drop-shadow-2xl">
          {/* Ultra Cosmic God Wheel */}
          <g className="animate-spin" style={{ transformOrigin: '67px 67px' }}>
            <circle cx="67" cy="67" r="62" fill="none" stroke="#fbbf24" strokeWidth="5" strokeDasharray="16,8" />
            <circle cx="67" cy="67" r="52" fill="none" stroke="#ec4899" strokeWidth="3" strokeDasharray="10,6" />
          </g>
          {/* God Head */}
          <ellipse cx="67" cy="65" rx="38" ry="42" fill="#fef3c7" stroke="#b45309" strokeWidth="4" />
          <polygon points="42,32 30,10 54,24" fill="#fef3c7" stroke="#b45309" strokeWidth="3" />
          <polygon points="92,32 104,10 80,24" fill="#fef3c7" stroke="#b45309" strokeWidth="3" />
          {/* Flowing Golden Beard */}
          <path d="M 40 76 Q 67 122 94 76 Q 67 96 40 76 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="3.5" />
          {/* Third Eye of Omniscience */}
          <polygon points="67,32 75,44 67,56 59,44" fill="#ec4899" stroke="#b45309" strokeWidth="2.5" />
          {/* Super Mega Wave Lightning on Attack */}
          {isAttacking && (
            <g className="animate-ping">
              <circle cx="67" cy="67" r="50" fill="#fbbf24" fillOpacity="0.4" stroke="#f59e0b" strokeWidth="4" />
            </g>
          )}
        </svg>
      );

    // ----------------- LEGEND STORY ENEMIES -----------------
    case 'enemy_face_red':
      return (
        <svg width="105" height="105" viewBox="0 0 105 105" className="drop-shadow-2xl">
          {/* Crimson Giant Floating Face */}
          <ellipse cx="52" cy="52" rx="44" ry="46" fill="#dc2626" stroke="#450a0a" strokeWidth="4" />
          {/* Angry Eyes */}
          <ellipse cx="36" cy="38" rx="8" ry="6" fill="#fef08a" stroke="#450a0a" strokeWidth="2.5" />
          <ellipse cx="68" cy="38" rx="8" ry="6" fill="#fef08a" stroke="#450a0a" strokeWidth="2.5" />
          <circle cx="38" cy="38" r="3" fill="#000000" />
          <circle cx="66" cy="38" r="3" fill="#000000" />
          {/* Massive Gaping Jaw */}
          <g transform={`rotate(${isAttacking ? 25 : 0} 52 64)`}>
            <ellipse cx="52" cy="68" rx="30" ry="18" fill="#450a0a" stroke="#7f1d1d" strokeWidth="2" />
            {/* Razor Fangs */}
            <polygon points="30,60 36,68 42,60" fill="#ffffff" />
            <polygon points="44,60 52,70 60,60" fill="#ffffff" />
            <polygon points="62,60 68,68 74,60" fill="#ffffff" />
            <polygon points="34,76 40,68 46,76" fill="#ffffff" />
            <polygon points="48,76 56,66 64,76" fill="#ffffff" />
          </g>
        </svg>
      );

    case 'enemy_master_a':
      return (
        <svg width="100" height="75" viewBox="0 0 100 75" className="drop-shadow-xl">
          {/* Anteater Body */}
          <ellipse cx="60" cy="46" rx="28" ry="18" fill="#e2e8f0" stroke="#0f172a" strokeWidth="3" />
          {/* Bushy Tail */}
          <path d="M 86 44 Q 104 28 92 16 Q 84 32 80 48 Z" fill="#94a3b8" stroke="#0f172a" strokeWidth="2.5" />
          {/* Long Slender Snout / Tongue Whip */}
          <path d="M 40 40 L 14 36 L 36 50 Z" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2.5" />
          {/* Tongue on Attack */}
          {isAttacking ? (
            <path d="M 14 36 Q -20 30 -35 44" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
          ) : (
            <circle cx="14" cy="36" r="2" fill="#ef4444" />
          )}
          {/* Slit Martial Eye */}
          <line x1="36" y1="36" x2="44" y2="34" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
          {/* Martial Arts Robe Belt */}
          <rect x="52" y="30" width="8" height="32" fill="#b91c1c" rx="2" />
          {/* Feet */}
          <ellipse cx={48 + legOffset1} cy="64" rx="6" ry="6" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx={72 + legOffset2} cy="64" rx="6" ry="6" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    case 'enemy_black_bear':
      return (
        <svg width="88" height="74" viewBox="0 0 88 74" className="drop-shadow-2xl">
          {/* Jet Black Bear Body */}
          <ellipse cx="44" cy="42" rx="30" ry="22" fill="#09090b" stroke="#3f3f46" strokeWidth="3" />
          <circle cx="24" cy="30" r="16" fill="#09090b" stroke="#3f3f46" strokeWidth="2.5" />
          <circle cx="14" cy="18" r="6" fill="#09090b" stroke="#3f3f46" strokeWidth="2" />
          <circle cx="28" cy="16" r="6" fill="#09090b" stroke="#3f3f46" strokeWidth="2" />
          {/* Piercing Red Eyes */}
          <ellipse cx="20" cy="28" rx="2.5" ry="3.5" fill="#ef4444" />
          <ellipse cx="28" cy="28" rx="2.5" ry="3.5" fill="#ef4444" />
          {/* Claws */}
          <polygon points="8,40 2,44 8,46" fill="#ffffff" />
          <polygon points="8,46 2,50 8,52" fill="#ffffff" />
          {/* Legs */}
          <line x1="28" y1="58" x2={22 + legOffset1 * 2} y2="70" stroke="#3f3f46" strokeWidth="5" strokeLinecap="round" />
          <line x1="58" y1="58" x2={52 + legOffset2 * 2} y2="70" stroke="#3f3f46" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );

    case 'enemy_daddy':
      return (
        <svg width="86" height="96" viewBox="0 0 86 96" className="drop-shadow-2xl">
          {/* Kangaroo Body */}
          <ellipse cx="44" cy="52" rx="22" ry="28" fill="#e2e8f0" stroke="#0f172a" strokeWidth="3" />
          {/* Kangaroo Head & Long Ears */}
          <ellipse cx="38" cy="24" rx="14" ry="12" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2.5" />
          <ellipse cx="28" cy="8" rx="4" ry="12" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx="42" cy="8" rx="4" ry="12" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2" />
          <circle cx="34" cy="22" r="2.5" fill="#0f172a" />
          {/* Red Boxing Gloves */}
          <circle cx={isAttacking ? 12 : 24} cy={isAttacking ? 36 : 46} r="10" fill="#dc2626" stroke="#991b1b" strokeWidth="2.5" />
          <circle cx="36" cy="48" r="9" fill="#dc2626" stroke="#991b1b" strokeWidth="2" />
          {/* Shockwave Rings on Attack */}
          {isAttacking && (
            <circle cx="6" cy="36" r="16" fill="none" stroke="#dc2626" strokeWidth="3" className="animate-ping" />
          )}
          {/* Strong Hopping Legs */}
          <ellipse cx={32 + legOffset1} cy="78" rx="7" ry="14" fill="#e2e8f0" stroke="#0f172a" strokeWidth="3" />
          <ellipse cx={54 + legOffset2} cy="78" rx="7" ry="14" fill="#e2e8f0" stroke="#0f172a" strokeWidth="3" />
        </svg>
      );

    case 'enemy_alien_bear':
      return (
        <svg width="90" height="80" viewBox="0 0 90 80" className="drop-shadow-2xl">
          {/* Cosmic Alien Bear Cyan Body */}
          <ellipse cx="46" cy="46" rx="30" ry="24" fill="#0284c7" stroke="#082f49" strokeWidth="3.5" />
          <circle cx="26" cy="34" r="16" fill="#0284c7" stroke="#082f49" strokeWidth="2.5" />
          {/* Antenna */}
          <line x1="26" y1="20" x2="26" y2="6" stroke="#38bdf8" strokeWidth="3" />
          <circle cx="26" cy="6" r="5" fill="#f43f5e" className="animate-pulse" />
          {/* Glowing Eyes */}
          <circle cx="20" cy="32" r="3.5" fill="#facc15" />
          <circle cx="30" cy="32" r="3.5" fill="#facc15" />
          {/* Legs */}
          <line x1="30" y1="64" x2={24 + legOffset1} y2="76" stroke="#082f49" strokeWidth="5" strokeLinecap="round" />
          <line x1="60" y1="64" x2={56 + legOffset2} y2="76" stroke="#082f49" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );

    // ----------------- CRAZED BOSS ENEMIES (超激ムズ 降臨ボス個別スプライト) -----------------
    case 'enemy_crazed_cat':
      return (
        <svg width="115" height="115" viewBox="0 0 115 115" className="drop-shadow-2xl">
          {/* Crazed Demonic Flame Aura */}
          <circle cx="58" cy="58" r="50" fill="none" stroke="#7e22ce" strokeWidth="4" strokeDasharray="10,6" className="animate-spin" />
          <circle cx="58" cy="58" r="44" fill="#18181b" stroke="#dc2626" strokeWidth="3.5" />
          {/* Crazed Ears */}
          <polygon points="32,32 20,8 44,24" fill="#dc2626" stroke="#450a0a" strokeWidth="2" />
          <polygon points="84,32 96,8 72,24" fill="#dc2626" stroke="#450a0a" strokeWidth="2" />
          {/* Dark Shadow Markings */}
          <path d="M 38 42 Q 58 36 78 42 Q 58 56 38 42 Z" fill="#27272a" />
          {/* Crazed Glowing Blood-Red Eyes */}
          <ellipse cx="44" cy="52" rx="6.5" ry="8.5" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1.5" />
          <ellipse cx="72" cy="52" rx="6.5" ry="8.5" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1.5" />
          <circle cx="45" cy="52" r="2.5" fill="#000000" />
          <circle cx="71" cy="52" r="2.5" fill="#000000" />
          {/* Sinister Mouth & Sharp Fangs */}
          <g transform={`rotate(${isAttacking ? 20 : 0} 58 68)`}>
            <ellipse cx="58" cy="70" rx="16" ry="10" fill="#450a0a" stroke="#dc2626" strokeWidth="1.5" />
            <polygon points="46,64 50,71 54,64" fill="#ffffff" />
            <polygon points="56,64 60,72 64,64" fill="#ffffff" />
            <polygon points="66,64 70,71 74,64" fill="#ffffff" />
            <polygon points="50,76 54,70 58,76" fill="#ffffff" />
            <polygon points="60,76 64,70 68,76" fill="#ffffff" />
          </g>
          {/* Attack Bite Shockwave */}
          {isAttacking && (
            <path d="M 20 50 Q -10 60 10 90 Q 25 70 20 50 Z" fill="#ef4444" className="animate-ping" />
          )}
          {/* Agile Paws */}
          <ellipse cx={46 + legOffset1} cy="98" rx="8" ry="7" fill="#27272a" stroke="#dc2626" strokeWidth="2" />
          <ellipse cx={70 + legOffset2} cy="98" rx="8" ry="7" fill="#27272a" stroke="#dc2626" strokeWidth="2" />
        </svg>
      );

    case 'enemy_crazed_tank':
      return (
        <svg width="120" height="135" viewBox="0 0 120 135" className="drop-shadow-2xl">
          {/* Crazed Aura */}
          <rect x="22" y="12" width="76" height="106" rx="16" fill="none" stroke="#7e22ce" strokeWidth="4" strokeDasharray="12,6" className="animate-pulse" />
          {/* Heavy Monolithic Body */}
          <g transform={`rotate(${isAttacking ? 15 : 0} 60 90)`}>
            <rect x="26" y="16" width="68" height="98" rx="12" fill="#18181b" stroke="#dc2626" strokeWidth="4" />
            {/* Dark Armor Plating Details */}
            <line x1="36" y1="20" x2="36" y2="110" stroke="#3f3f46" strokeWidth="2.5" />
            <line x1="84" y1="20" x2="84" y2="110" stroke="#3f3f46" strokeWidth="2.5" />
            <line x1="28" y1="65" x2="92" y2="65" stroke="#3f3f46" strokeWidth="2.5" />
            {/* Small Crazed Ears */}
            <polygon points="36,18 30,2 48,16" fill="#dc2626" />
            <polygon points="84,18 90,2 72,16" fill="#dc2626" />
            {/* Vein of Rage */}
            <path d="M 52 28 L 56 34 L 50 40 L 58 44" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
            {/* Fierce Angry Eyes */}
            <polygon points="38,48 52,54 38,58" fill="#ef4444" />
            <polygon points="82,48 68,54 82,58" fill="#ef4444" />
            {/* Heavy Iron Gritted Teeth */}
            <rect x="42" y="74" width="36" height="14" rx="2" fill="#450a0a" stroke="#dc2626" strokeWidth="2" />
            <line x1="51" y1="74" x2="51" y2="88" stroke="#ffffff" strokeWidth="2" />
            <line x1="60" y1="74" x2="60" y2="88" stroke="#ffffff" strokeWidth="2" />
            <line x1="69" y1="74" x2="69" y2="88" stroke="#ffffff" strokeWidth="2" />
          </g>
          {/* Ground Slam Quake Effect on Attack */}
          {isAttacking && (
            <ellipse cx="60" cy="122" rx="48" ry="10" fill="none" stroke="#ef4444" strokeWidth="5" className="animate-ping" />
          )}
          {/* Massive Footpads */}
          <rect x={32 + legOffset1} y="112" width="22" height="14" rx="4" fill="#09090b" stroke="#71717a" strokeWidth="3" />
          <rect x={66 + legOffset2} y="112" width="22" height="14" rx="4" fill="#09090b" stroke="#71717a" strokeWidth="3" />
        </svg>
      );

    case 'enemy_crazed_axe':
      return (
        <svg width="125" height="120" viewBox="0 0 125 120" className="drop-shadow-2xl">
          {/* Demonic Red & Purple Aura */}
          <circle cx="62" cy="62" r="50" fill="none" stroke="#dc2626" strokeWidth="4" strokeDasharray="12,6" className="animate-spin" />
          {/* Crazed Berserker Body */}
          <ellipse cx="62" cy="64" rx="34" ry="32" fill="#18181b" stroke="#b91c1c" strokeWidth="3.5" />
          {/* Crimson Warrior Headband / Horns */}
          <path d="M 34 46 Q 62 36 90 46 Q 62 52 34 46 Z" fill="#dc2626" stroke="#450a0a" strokeWidth="2" />
          <polygon points="38,38 24,14 48,28" fill="#dc2626" stroke="#450a0a" strokeWidth="2" />
          <polygon points="86,38 100,14 76,28" fill="#dc2626" stroke="#450a0a" strokeWidth="2" />
          {/* Glaring Slit Eyes */}
          <ellipse cx="48" cy="56" rx="5" ry="7" fill="#facc15" stroke="#000000" strokeWidth="1.5" />
          <ellipse cx="76" cy="56" rx="5" ry="7" fill="#facc15" stroke="#000000" strokeWidth="1.5" />
          <circle cx="49" cy="56" r="2" fill="#dc2626" />
          <circle cx="75" cy="56" r="2" fill="#dc2626" />
          {/* Snarl Jaw */}
          <path d="M 50 74 Q 62 82 74 74" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
          {/* Giant Blood-Stained Battleaxe */}
          <g transform={`rotate(${isAttacking ? -65 : 15} 30 50)`}>
            {/* Axe Handle */}
            <rect x="24" y="10" width="8" height="75" rx="3" fill="#78350f" stroke="#000000" strokeWidth="2" />
            {/* Twin Dark Crimson Axe Blades */}
            <path d="M 28 20 Q 2 10 0 35 Q 12 50 28 42 Z" fill="#991b1b" stroke="#f87171" strokeWidth="2.5" />
            <path d="M 28 22 Q 46 14 52 34 Q 40 48 28 42 Z" fill="#991b1b" stroke="#f87171" strokeWidth="2.5" />
            {/* Axe Skull Emblem */}
            <circle cx="28" cy="32" r="6" fill="#facc15" stroke="#000000" strokeWidth="1.5" />
          </g>
          {/* Cleave Slash Crescent on Attack */}
          {isAttacking && (
            <path d="M 5 25 Q -20 60 15 95" fill="none" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" className="animate-ping" />
          )}
          {/* Feet */}
          <ellipse cx={48 + legOffset1} cy="96" rx="8" ry="7" fill="#09090b" stroke="#b91c1c" strokeWidth="2.5" />
          <ellipse cx={76 + legOffset2} cy="96" rx="8" ry="7" fill="#09090b" stroke="#b91c1c" strokeWidth="2.5" />
        </svg>
      );

    case 'enemy_crazed_cow':
      return (
        <svg width="135" height="105" viewBox="0 0 135 105" className="drop-shadow-2xl">
          {/* Speed Lines Aura */}
          <line x1="120" y1="30" x2="140" y2="30" stroke="#dc2626" strokeWidth="3" strokeDasharray="6,4" />
          <line x1="115" y1="55" x2="142" y2="55" stroke="#7e22ce" strokeWidth="3" strokeDasharray="6,4" />
          <line x1="110" y1="75" x2="135" y2="75" stroke="#dc2626" strokeWidth="3" strokeDasharray="6,4" />
          {/* Long Slender Crazed Giraffe/Cow Body */}
          <ellipse cx="80" cy="55" rx="34" ry="24" fill="#18181b" stroke="#7e22ce" strokeWidth="3.5" />
          {/* Dark Purple Markings */}
          <ellipse cx="70" cy="50" rx="8" ry="12" fill="#581c87" />
          <ellipse cx="92" cy="55" rx="10" ry="8" fill="#581c87" />
          {/* Ultra Long Neck & Head */}
          <g transform={`translate(${isAttacking ? -18 : 0}, 0)`}>
            {/* Long Neck */}
            <path d="M 60 45 L 25 22 L 32 15 L 72 38 Z" fill="#18181b" stroke="#7e22ce" strokeWidth="3" />
            {/* Head & Angry Horns */}
            <ellipse cx="22" cy="18" rx="16" ry="12" fill="#18181b" stroke="#dc2626" strokeWidth="3" />
            <polygon points="26,10 32,-4 20,4" fill="#dc2626" stroke="#450a0a" strokeWidth="1.5" />
            <polygon points="12,12 4,0 10,8" fill="#dc2626" stroke="#450a0a" strokeWidth="1.5" />
            {/* Glowing Red Eyes */}
            <circle cx="16" cy="16" r="3.5" fill="#ef4444" />
            <circle cx="16" cy="16" r="1.5" fill="#000000" />
            {/* Snout */}
            <ellipse cx="10" cy="22" rx="6" ry="4" fill="#dc2626" />
          </g>
          {/* Headbutt Shockwave Sparks on Attack */}
          {isAttacking && (
            <g className="animate-ping">
              <circle cx="2" cy="18" r="14" fill="none" stroke="#ef4444" strokeWidth="4" />
              <polygon points="0,6 -10,18 0,30" fill="#facc15" />
            </g>
          )}
          {/* Long Galloping Legs */}
          <line x1="58" y1="75" x2={50 + legOffset1 * 2} y2="98" stroke="#18181b" strokeWidth="6" strokeLinecap="round" />
          <line x1="72" y1="75" x2={66 + legOffset2 * 2} y2="98" stroke="#18181b" strokeWidth="6" strokeLinecap="round" />
          <line x1="95" y1="75" x2={90 + legOffset1 * 2} y2="98" stroke="#18181b" strokeWidth="6" strokeLinecap="round" />
          <line x1="108" y1="75" x2={104 + legOffset2 * 2} y2="98" stroke="#18181b" strokeWidth="6" strokeLinecap="round" />
        </svg>
      );

    case 'enemy_crazed_lizard':
      return (
        <svg width="145" height="110" viewBox="0 0 145 110" className="drop-shadow-2xl">
          {/* Dark Fire Dragon Tail */}
          <path d="M 115 65 Q 140 70 142 45 Q 128 55 110 60 Z" fill="#18181b" stroke="#7e22ce" strokeWidth="3" />
          {/* Spiky Dragon Back Fins */}
          <polygon points="75,42 82,24 90,44" fill="#dc2626" stroke="#450a0a" strokeWidth="1.5" />
          <polygon points="92,44 100,28 106,48" fill="#dc2626" stroke="#450a0a" strokeWidth="1.5" />
          <polygon points="108,48 116,34 122,54" fill="#dc2626" stroke="#450a0a" strokeWidth="1.5" />
          {/* Dragon Reptilian Body */}
          <ellipse cx="85" cy="62" rx="36" ry="24" fill="#18181b" stroke="#7e22ce" strokeWidth="3.5" />
          {/* Long Sinuous Dragon Neck */}
          <path d="M 65 55 Q 45 45 35 25 Q 52 35 70 48 Z" fill="#18181b" stroke="#7e22ce" strokeWidth="3" />
          {/* Dragon Head */}
          <g transform={`rotate(${isAttacking ? -15 : 0} 30 20)`}>
            {/* Horns */}
            <polygon points="34,16 48,-2 30,8" fill="#dc2626" stroke="#450a0a" strokeWidth="2" />
            <polygon points="26,18 36,2 22,12" fill="#dc2626" stroke="#450a0a" strokeWidth="2" />
            {/* Snout & Gaping Jaws */}
            <path d="M 38 18 L 8 16 L 24 32 Z" fill="#18181b" stroke="#dc2626" strokeWidth="2.5" />
            {/* Slit Golden Reptile Eye */}
            <ellipse cx="26" cy="18" rx="4" ry="5" fill="#facc15" stroke="#000000" strokeWidth="1" />
            <line x1="26" y1="14" x2="26" y2="22" stroke="#000000" strokeWidth="2" />
            {/* Razor Fangs in Jaws */}
            <polygon points="14,17 18,24 22,17" fill="#ffffff" />
          </g>
          {/* Hyper Mega Beam Breath Laser on Attack */}
          {isAttacking && (
            <g className="animate-pulse">
              <line x1="8" y1="18" x2="-80" y2="18" stroke="#7e22ce" strokeWidth="16" strokeLinecap="round" opacity="0.6" />
              <line x1="8" y1="18" x2="-80" y2="18" stroke="#ef4444" strokeWidth="10" strokeLinecap="round" />
              <line x1="8" y1="18" x2="-80" y2="18" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
              <circle cx="8" cy="18" r="14" fill="#facc15" />
            </g>
          )}
          {/* Dragon Claw Stumps */}
          <ellipse cx={68 + legOffset1} cy="86" rx="9" ry="8" fill="#09090b" stroke="#7e22ce" strokeWidth="2.5" />
          <ellipse cx={102 + legOffset2} cy="86" rx="9" ry="8" fill="#09090b" stroke="#7e22ce" strokeWidth="2.5" />
        </svg>
      );

    case 'enemy_crazed_titan':
      return (
        <svg width="150" height="150" viewBox="0 0 150 150" className="drop-shadow-2xl">
          {/* Colossal Demonic Wave Aura */}
          <circle cx="75" cy="75" r="68" fill="none" stroke="#7e22ce" strokeWidth="6" strokeDasharray="16,8" className="animate-spin" />
          <circle cx="75" cy="75" r="58" fill="#09090b" stroke="#dc2626" strokeWidth="5" />
          {/* Red Tribal Tattoo Markings on Chest and Shoulders */}
          <path d="M 45 45 Q 60 70 75 55 Q 90 70 105 45" fill="none" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" />
          <path d="M 55 75 Q 75 90 95 75" fill="none" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" />
          {/* Colossal Horns */}
          <polygon points="40,36 15,4 55,24" fill="#dc2626" stroke="#450a0a" strokeWidth="3" />
          <polygon points="110,36 135,4 95,24" fill="#dc2626" stroke="#450a0a" strokeWidth="3" />
          {/* Glowing Piercing Demonic Eyes */}
          <ellipse cx="55" cy="50" rx="9" ry="11" fill="#ef4444" stroke="#450a0a" strokeWidth="2" />
          <ellipse cx="95" cy="50" rx="9" ry="11" fill="#ef4444" stroke="#450a0a" strokeWidth="2" />
          <ellipse cx="55" cy="50" rx="3" ry="9" fill="#000000" />
          <ellipse cx="95" cy="50" rx="3" ry="9" fill="#000000" />
          {/* Terrifying Jagged Maw */}
          <g transform={`rotate(${isAttacking ? 25 : 0} 75 80)`}>
            <ellipse cx="75" cy="82" rx="28" ry="16" fill="#450a0a" stroke="#dc2626" strokeWidth="3" />
            <polygon points="54,74 62,86 70,74" fill="#ffffff" />
            <polygon points="72,74 80,88 88,74" fill="#ffffff" />
            <polygon points="60,90 68,78 76,90" fill="#ffffff" />
            <polygon points="78,90 86,78 94,90" fill="#ffffff" />
          </g>
          {/* Titan Massive Fist Smash & Lv5 Shockwave on Attack */}
          {isAttacking ? (
            <g>
              {/* Massive Fist Slamming Down */}
              <circle cx="20" cy="85" r="26" fill="#18181b" stroke="#dc2626" strokeWidth="4" />
              {/* Expanding Wave Rings (Lv5 Wave) */}
              <circle cx="20" cy="115" r="45" fill="none" stroke="#7e22ce" strokeWidth="6" className="animate-ping" />
              <circle cx="20" cy="115" r="65" fill="none" stroke="#ef4444" strokeWidth="4" className="animate-ping" />
            </g>
          ) : (
            <circle cx="35" cy="90" r="16" fill="#18181b" stroke="#71717a" strokeWidth="3" />
          )}
          {/* Heavy Claw Stompers */}
          <rect x={44 + legOffset1} y="122" width="26" height="18" rx="6" fill="#18181b" stroke="#71717a" strokeWidth="4" />
          <rect x={82 + legOffset2} y="122" width="26" height="18" rx="6" fill="#18181b" stroke="#71717a" strokeWidth="4" />
        </svg>
      );


    case 'enemy_crazed_gross':
      return (
        <svg width="90" height="130" viewBox="0 0 90 130" className="drop-shadow-2xl">
          <circle cx="45" cy="40" r="32" fill="none" stroke="#7e22ce" strokeWidth="4" strokeDasharray="10,6" className="animate-spin" />
          {/* Crazed Gross Cat body */}
          <ellipse cx="45" cy="40" rx="22" ry="20" fill="#18181b" stroke="#dc2626" strokeWidth="3" />
          <polygon points="32,26 26,10 38,20" fill="#dc2626" stroke="#450a0a" strokeWidth="1.5" />
          <polygon points="58,26 64,10 52,20" fill="#dc2626" stroke="#450a0a" strokeWidth="1.5" />
          <circle cx="38" cy="38" r="3.5" fill="#ef4444" />
          <circle cx="52" cy="38" r="3.5" fill="#ef4444" />
          <path d="M 40 48 Q 45 54 50 48" fill="none" stroke="#dc2626" strokeWidth="2.5" />
          {/* Long Muscular Legs with Wave Aura */}
          <line x1="36" y1="58" x2={28 + legOffset1 * 2} y2="120" stroke="#18181b" strokeWidth="6" strokeLinecap="round" />
          <line x1="54" y1="58" x2={50 + legOffset2 * 2} y2="120" stroke="#18181b" strokeWidth="6" strokeLinecap="round" />
          {isAttacking && (
            <ellipse cx="45" cy="120" rx="35" ry="8" fill="none" stroke="#7e22ce" strokeWidth="4" className="animate-ping" />
          )}
        </svg>
      );

    case 'enemy_crazed_bird':
      return (
        <svg width="105" height="105" viewBox="0 0 105 105" className="drop-shadow-2xl">
          <circle cx="52" cy="52" r="46" fill="none" stroke="#7e22ce" strokeWidth="4" strokeDasharray="10,5" className="animate-spin" />
          {/* Dark Demonic Bird Body & Wings */}
          <g transform={`rotate(${Math.sin(timer * 15) * 20} 52 52)`}>
            <polygon points="52,40 10,20 30,60" fill="#18181b" stroke="#dc2626" strokeWidth="2.5" />
            <polygon points="52,40 94,20 74,60" fill="#18181b" stroke="#dc2626" strokeWidth="2.5" />
          </g>
          <ellipse cx="52" cy="52" rx="26" ry="24" fill="#18181b" stroke="#dc2626" strokeWidth="3" />
          <polygon points="38,36 30,16 46,30" fill="#dc2626" />
          <polygon points="66,36 74,16 58,30" fill="#dc2626" />
          <circle cx="44" cy="48" r="4" fill="#facc15" stroke="#ef4444" strokeWidth="1" />
          <circle cx="60" cy="48" r="4" fill="#facc15" stroke="#ef4444" strokeWidth="1" />
          <polygon points="46,56 52,68 58,56" fill="#ef4444" stroke="#450a0a" strokeWidth="1.5" />
          {isAttacking && (
            <circle cx="52" cy="52" r="42" fill="none" stroke="#ef4444" strokeWidth="5" className="animate-ping" />
          )}
        </svg>
      );

    case 'enemy_crazed_fish':
      return (
        <svg width="120" height="95" viewBox="0 0 120 95" className="drop-shadow-2xl">
          <ellipse cx="60" cy="48" rx="55" ry="38" fill="none" stroke="#7e22ce" strokeWidth="4" strokeDasharray="12,6" />
          {/* Crazed Whale / Fish Body */}
          <path d="M 20 48 Q 45 18 90 28 Q 115 48 90 68 Q 45 78 20 48 Z" fill="#18181b" stroke="#dc2626" strokeWidth="3.5" />
          {/* Fin */}
          <polygon points="60,22 75,5 80,24" fill="#dc2626" stroke="#450a0a" strokeWidth="2" />
          <polygon points="20,48 5,30 5,66" fill="#dc2626" stroke="#450a0a" strokeWidth="2" />
          {/* Fierce Shark Teeth */}
          <g transform={`rotate(${isAttacking ? 20 : 0} 95 48)`}>
            <polygon points="90,44 100,48 90,52" fill="#ffffff" />
            <polygon points="82,42 92,48 82,54" fill="#ffffff" />
          </g>
          <circle cx="75" cy="38" r="4" fill="#ef4444" />
          {isAttacking && (
            <path d="M 90 25 Q 120 48 90 70" fill="none" stroke="#ef4444" strokeWidth="6" className="animate-ping" />
          )}
        </svg>
      );

    // =========================================================================
    // ZOMBIE ENEMIES (ゾンビ軍団スプライト)
    // =========================================================================
    case 'enemy_zombie_doge':
      return (
        <svg width="68" height="54" viewBox="0 0 68 54" className="drop-shadow-md">
          {/* Purple Necro Glow */}
          <ellipse cx="34" cy="28" rx="24" ry="20" fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="6,4" />
          {/* Exposed Ribs and Bone Body */}
          <ellipse cx="32" cy="28" rx="18" ry="15" fill="#f1f5f9" stroke="#475569" strokeWidth="2.5" />
          {/* Rib Lines */}
          <line x1="24" y1="22" x2="24" y2="34" stroke="#475569" strokeWidth="2" />
          <line x1="30" y1="20" x2="30" y2="36" stroke="#475569" strokeWidth="2" />
          <line x1="36" y1="22" x2="36" y2="34" stroke="#475569" strokeWidth="2" />
          {/* Skull Snout */}
          <ellipse cx="46" cy="28" rx="9" ry="8" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
          {/* Violet Undead Eyes */}
          <circle cx="28" cy="22" r="3" fill="#a855f7" className="animate-pulse" />
          <circle cx="38" cy="22" r="3" fill="#a855f7" className="animate-pulse" />
          {/* Bone Legs */}
          <line x1="22" y1="42" x2={18 + legOffset1} y2="50" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
          <line x1="38" y1="42" x2={36 + legOffset2} y2="50" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'enemy_zombie_snache':
      return (
        <svg width="74" height="48" viewBox="0 0 74 48" className="drop-shadow-md">
          {/* Skeletal Snake Body */}
          <path d="M 12 36 Q 30 14 48 34 Q 60 40 68 24" fill="none" stroke="#cbd5e1" strokeWidth="8" strokeLinecap="round" />
          <path d="M 12 36 Q 30 14 48 34 Q 60 40 68 24" fill="none" stroke="#7e22ce" strokeWidth="3" strokeDasharray="4,4" />
          {/* Skull Head */}
          <circle cx="68" cy="24" r="8" fill="#f1f5f9" stroke="#475569" strokeWidth="2" />
          <circle cx="66" cy="22" r="2.5" fill="#c084fc" className="animate-pulse" />
          <polygon points="74,24 82,21 82,27" fill="#dc2626" />
        </svg>
      );

    case 'enemy_zombie_pigge':
      return (
        <svg width="78" height="65" viewBox="0 0 78 65" className="drop-shadow-lg">
          {/* Rotting Violet Pig Body */}
          <ellipse cx="38" cy="34" rx="24" ry="20" fill="#7e22ce" stroke="#3b0764" strokeWidth="3" />
          {/* Stitches */}
          <line x1="28" y1="20" x2="34" y2="30" stroke="#a855f7" strokeWidth="2.5" />
          <line x1="26" y1="24" x2="32" y2="22" stroke="#a855f7" strokeWidth="1.5" />
          {/* Snout with Slime */}
          <ellipse cx="56" cy="36" rx="12" ry="10" fill="#a855f7" stroke="#3b0764" strokeWidth="2" />
          <circle cx="52" cy="36" r="2.5" fill="#22c55e" />
          <circle cx="60" cy="36" r="2.5" fill="#22c55e" />
          {/* Glowing Green Zombie Eyes */}
          <circle cx="34" cy="26" r="3.5" fill="#22c55e" className="animate-pulse" />
          <circle cx="44" cy="26" r="3.5" fill="#22c55e" className="animate-pulse" />
          {/* Legs */}
          <rect x={22 + legOffset1} y="50" width="8" height="12" rx="2" fill="#581c87" stroke="#3b0764" strokeWidth="2" />
          <rect x={42 + legOffset2} y="50" width="8" height="12" rx="2" fill="#581c87" stroke="#3b0764" strokeWidth="2" />
        </svg>
      );

    case 'enemy_zombie_gorilla':
      return (
        <svg width="90" height="85" viewBox="0 0 90 85" className="drop-shadow-xl">
          {/* Giant Stitched Zombie Gorilla */}
          <ellipse cx="45" cy="48" rx="30" ry="28" fill="#581c87" stroke="#2e1065" strokeWidth="3.5" />
          <circle cx="45" cy="24" r="18" fill="#4c1d95" stroke="#2e1065" strokeWidth="3" />
          {/* Cyber Bolts / Metal Screws */}
          <rect x="22" y="20" width="6" height="4" fill="#94a3b8" />
          <rect x="62" y="20" width="6" height="4" fill="#94a3b8" />
          {/* Glowing Violet Eyes */}
          <circle cx="38" cy="22" r="4" fill="#c084fc" className="animate-pulse" />
          <circle cx="52" cy="22" r="4" fill="#c084fc" className="animate-pulse" />
          {/* Zombie Gorilla Fists */}
          <ellipse cx={20 + (isAttacking ? 16 : legOffset1)} cy="58" rx="11" ry="11" fill="#3b0764" stroke="#2e1065" strokeWidth="2.5" />
          <ellipse cx={70 + legOffset2} cy="58" rx="11" ry="11" fill="#3b0764" stroke="#2e1065" strokeWidth="2.5" />
        </svg>
      );

    case 'enemy_zombie_hippoe':
      return (
        <svg width="98" height="75" viewBox="0 0 98 75" className="drop-shadow-xl">
          {/* Bone Skull Hippo */}
          <ellipse cx="40" cy="40" rx="30" ry="24" fill="#6b21a8" stroke="#3b0764" strokeWidth="3.5" />
          <ellipse cx="68" cy="44" rx="22" ry="18" fill="#581c87" stroke="#3b0764" strokeWidth="3" />
          {/* Bone Snout & Exposed Teeth */}
          <polygon points="76,58 80,48 84,58" fill="#f8fafc" stroke="#3b0764" strokeWidth="1.5" />
          <polygon points="86,58 90,48 94,58" fill="#f8fafc" stroke="#3b0764" strokeWidth="1.5" />
          <circle cx="44" cy="30" r="4" fill="#22c55e" className="animate-pulse" />
          <rect x={24 + legOffset1} y="58" width="14" height="14" rx="3" fill="#3b0764" stroke="#2e1065" strokeWidth="2.5" />
          <rect x={52 + legOffset2} y="58" width="14" height="14" rx="3" fill="#3b0764" stroke="#2e1065" strokeWidth="2.5" />
        </svg>
      );

    case 'enemy_zombie_coffin':
      return (
        <svg width="84" height="74" viewBox="0 0 84 74" className="drop-shadow-2xl">
          {/* Coffin on Back */}
          <polygon points="26,8 54,8 60,45 40,60 20,45" fill="#3f3f46" stroke="#71717a" strokeWidth="2.5" />
          <line x1="38" y1="18" x2="38" y2="40" stroke="#dc2626" strokeWidth="3" />
          <line x1="28" y1="26" x2="48" y2="26" stroke="#dc2626" strokeWidth="3" />
          {/* Dog emerging */}
          <ellipse cx="50" cy="44" rx="18" ry="14" fill="#581c87" stroke="#2e1065" strokeWidth="2.5" />
          <circle cx="56" cy="40" r="3" fill="#22c55e" className="animate-pulse" />
          <ellipse cx={40 + legOffset1} cy="64" rx="5" ry="5" fill="#3b0764" stroke="#2e1065" strokeWidth="2" />
          <ellipse cx={60 + legOffset2} cy="64" rx="5" ry="5" fill="#3b0764" stroke="#2e1065" strokeWidth="2" />
        </svg>
      );

    case 'enemy_zombie_hanako':
      return (
        <svg width="130" height="130" viewBox="0 0 130 130" className="drop-shadow-2xl">
          <circle cx="65" cy="65" r="58" fill="none" stroke="#a855f7" strokeWidth="5" strokeDasharray="14,7" className="animate-spin" />
          {/* Demonic Cemetery Lady Ghost */}
          <path d="M 35 110 Q 65 30 95 110 Z" fill="#3b0764" stroke="#a855f7" strokeWidth="4" />
          <circle cx="65" cy="42" r="22" fill="#e9d5ff" stroke="#581c87" strokeWidth="3" />
          {/* Bleeding Violet Eyes */}
          <ellipse cx="56" cy="40" rx="4" ry="6" fill="#7e22ce" />
          <ellipse cx="74" cy="40" rx="4" ry="6" fill="#7e22ce" />
          <circle cx="56" cy="40" r="1.5" fill="#22c55e" />
          <circle cx="74" cy="40" r="1.5" fill="#22c55e" />
          {/* Long Ghost Hair */}
          <path d="M 42 38 Q 30 70 38 100" fill="none" stroke="#1e1b4b" strokeWidth="5" strokeLinecap="round" />
          <path d="M 88 38 Q 100 70 92 100" fill="none" stroke="#1e1b4b" strokeWidth="5" strokeLinecap="round" />
          {isAttacking && (
            <ellipse cx="65" cy="115" rx="50" ry="12" fill="none" stroke="#22c55e" strokeWidth="4" className="animate-ping" />
          )}
        </svg>
      );

    case 'enemy_zombie_bear':
      return (
        <svg width="135" height="120" viewBox="0 0 135 120" className="drop-shadow-2xl">
          <circle cx="67" cy="60" r="54" fill="none" stroke="#22c55e" strokeWidth="4" strokeDasharray="12,6" className="animate-spin" />
          {/* Frankenbear Monster */}
          <ellipse cx="67" cy="64" rx="42" ry="34" fill="#3b0764" stroke="#1e1b4b" strokeWidth="4" />
          <circle cx="36" cy="46" r="24" fill="#4c1d95" stroke="#1e1b4b" strokeWidth="3.5" />
          {/* Bolts in Neck */}
          <rect x="15" y="44" width="8" height="6" fill="#94a3b8" />
          <rect x="57" y="44" width="8" height="6" fill="#94a3b8" />
          {/* Fierce Glowing Eyes */}
          <circle cx="30" cy="42" r="5" fill="#22c55e" className="animate-pulse" />
          <circle cx="44" cy="42" r="5" fill="#22c55e" className="animate-pulse" />
          {/* Claws & Smash */}
          <polygon points="12,68 0,76 10,82" fill="#f8fafc" />
          <polygon points="12,78 0,86 10,92" fill="#f8fafc" />
          {isAttacking && (
            <circle cx="20" cy="70" r="30" fill="none" stroke="#22c55e" strokeWidth="6" className="animate-ping" />
          )}
          <line x1="45" y1="95" x2={38 + legOffset1 * 2} y2="114" stroke="#1e1b4b" strokeWidth="8" strokeLinecap="round" />
          <line x1="88" y1="95" x2={82 + legOffset2 * 2} y2="114" stroke="#1e1b4b" strokeWidth="8" strokeLinecap="round" />
        </svg>
      );

    // =========================================================================
    // LEGEND / DEBUFF ENEMIES (妨害・レジェンド強敵スプライト)
    // =========================================================================
    case 'enemy_nakai':
      return (
        <svg width="86" height="86" viewBox="0 0 86 86" className="drop-shadow-xl">
          {/* Reindeer Antlers */}
          <path d="M 30 20 L 15 5 M 24 14 L 16 18 M 38 20 L 52 5 M 44 14 L 52 18" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
          {/* Reindeer Head and Body */}
          <ellipse cx="38" cy="44" rx="20" ry="18" fill="#f8fafc" stroke="#0f172a" strokeWidth="3" />
          <circle cx="30" cy="38" r="3" fill="#0f172a" />
          <circle cx="44" cy="38" r="3" fill="#0f172a" />
          <circle cx="37" cy="46" r="3.5" fill="#ef4444" />
          {/* Speed Kicking Legs */}
          <line x1="28" y1="60" x2={18 + legOffset1 * 2.5} y2="80" stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="48" y1="60" x2={42 + legOffset2 * 2.5} y2="80" stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      );

    case 'enemy_professor':
      return (
        <svg width="105" height="80" viewBox="0 0 105 80" className="drop-shadow-xl">
          {/* Red Anteater Body with Glasses and Cap */}
          <ellipse cx="65" cy="48" rx="28" ry="18" fill="#dc2626" stroke="#450a0a" strokeWidth="3" />
          {/* Academic Graduation Cap */}
          <polygon points="35,16 55,22 35,28 15,22" fill="#18181b" stroke="#facc15" strokeWidth="1.5" />
          {/* Glasses */}
          <circle cx="36" cy="38" r="5" fill="none" stroke="#facc15" strokeWidth="2" />
          <line x1="30" y1="38" x2="42" y2="38" stroke="#facc15" strokeWidth="2" />
          {/* Long Super Whip Tongue */}
          <path d="M 40 44 L 14 42 L 36 54 Z" fill="#dc2626" stroke="#450a0a" strokeWidth="2.5" />
          {isAttacking ? (
            <path d="M 14 42 Q -30 35 -60 50" fill="none" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
          ) : (
            <circle cx="14" cy="42" r="2.5" fill="#ef4444" />
          )}
          <ellipse cx={52 + legOffset1} cy="66" rx="6" ry="6" fill="#b91c1c" stroke="#450a0a" strokeWidth="2" />
          <ellipse cx={78 + legOffset2} cy="66" rx="6" ry="6" fill="#b91c1c" stroke="#450a0a" strokeWidth="2" />
        </svg>
      );

    case 'enemy_kurosawa':
      return (
        <svg width="125" height="115" viewBox="0 0 125 115" className="drop-shadow-2xl">
          {/* Director Kurosawa in Black Trenchcoat */}
          <ellipse cx="62" cy="62" rx="36" ry="32" fill="#09090b" stroke="#3f3f46" strokeWidth="4" />
          {/* Director Sunglasses */}
          <rect x="42" y="44" width="16" height="10" rx="2" fill="#18181b" stroke="#71717a" strokeWidth="2" />
          <rect x="66" y="44" width="16" height="10" rx="2" fill="#18181b" stroke="#71717a" strokeWidth="2" />
          <line x1="58" y1="48" x2="66" y2="48" stroke="#71717a" strokeWidth="2" />
          {/* Giant Film Megaphone */}
          <polygon points="34,56 6,40 6,76" fill="#dc2626" stroke="#18181b" strokeWidth="3" />
          {/* Shockwave Blast on Attack */}
          {isAttacking && (
            <g className="animate-ping">
              <circle cx="6" cy="58" r="28" fill="none" stroke="#ef4444" strokeWidth="5" />
            </g>
          )}
          <ellipse cx={48 + legOffset1} cy="96" rx="8" ry="8" fill="#18181b" stroke="#3f3f46" strokeWidth="3" />
          <ellipse cx={76 + legOffset2} cy="96" rx="8" ry="8" fill="#18181b" stroke="#3f3f46" strokeWidth="3" />
        </svg>
      );

    case 'enemy_legend_matador':
      return (
        <svg width="135" height="125" viewBox="0 0 135 125" className="drop-shadow-2xl">
          <ellipse cx="68" cy="60" rx="42" ry="44" fill="#dc2626" stroke="#450a0a" strokeWidth="4" />
          {/* Matador Hat (Montera) */}
          <path d="M 40 24 Q 68 10 96 24 Q 68 28 40 24 Z" fill="#09090b" stroke="#facc15" strokeWidth="2" />
          {/* Bullfighter Eyes */}
          <ellipse cx="52" cy="46" rx="6" ry="7" fill="#fef08a" />
          <ellipse cx="84" cy="46" rx="6" ry="7" fill="#fef08a" />
          {/* Red Muleta Cape Swirling */}
          <g transform={`rotate(${isAttacking ? -35 : 10} 30 70)`}>
            <path d="M 30 50 Q -10 60 5 95 Q 40 90 30 50 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="3" />
            <polygon points="10,48 4,38 12,42" fill="#facc15" />
          </g>
          {isAttacking && (
            <circle cx="20" cy="70" r="30" fill="none" stroke="#ef4444" strokeWidth="6" className="animate-ping" />
          )}
        </svg>
      );

    case 'enemy_legend_yakuza_cat':
      return (
        <svg width="145" height="135" viewBox="0 0 145 135" className="drop-shadow-2xl">
          <circle cx="72" cy="70" r="62" fill="none" stroke="#dc2626" strokeWidth="5" strokeDasharray="16,8" className="animate-spin" />
          {/* Yakuza Cat Boss with Kimono & Katana */}
          <ellipse cx="72" cy="68" rx="36" ry="34" fill="#09090b" stroke="#dc2626" strokeWidth="4" />
          {/* Dragon Tattoo over Shoulder */}
          <path d="M 50 50 Q 60 65 72 54 Q 85 68 95 50" fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
          {/* Slit Boss Eyes */}
          <line x1="56" y1="52" x2="66" y2="54" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="88" y1="54" x2="78" y2="52" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
          {/* Katana Slash */}
          <g transform={`rotate(${isAttacking ? -65 : 25} 35 55)`}>
            <rect x="25" y="10" width="6" height="70" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2" />
            <rect x="22" y="70" width="12" height="16" fill="#dc2626" />
          </g>
          {isAttacking && (
            <path d="M 10 20 Q -25 70 20 120" fill="none" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" className="animate-ping" />
          )}
          <ellipse cx={56 + legOffset1} cy="104" rx="9" ry="8" fill="#18181b" stroke="#dc2626" strokeWidth="3" />
          <ellipse cx={88 + legOffset2} cy="104" rx="9" ry="8" fill="#18181b" stroke="#dc2626" strokeWidth="3" />
        </svg>
      );

    // =========================================================================
    // DEBUFF ALLY CATS (妨害・状態異常 味方ネコスプライト)
    // =========================================================================
    case 'cat_onmyoji':
    case 'cat_onmyoji_evolved':
    case 'cat_shikigami':
    case 'cat_shikigami_evolved':
      return (
        <svg width="65" height="65" viewBox="0 0 65 65" className="drop-shadow-md">
          {/* Onmyoji Robe & Hat */}
          <polygon points="32,2 24,18 40,18" fill="#1e1b4b" stroke="#4338ca" strokeWidth="2" />
          <ellipse cx="32" cy="32" rx="18" ry="17" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
          {/* Yin Yang / Talisman Seal */}
          <rect x={isAttacking ? 10 : 20} y="34" width="8" height="14" fill="#fef08a" stroke="#dc2626" strokeWidth="1.5" />
          <line x1={isAttacking ? 12 : 22} y1="38" x2={isAttacking ? 16 : 26} y2="38" stroke="#dc2626" strokeWidth="2" />
          {/* Eyes */}
          <circle cx="26" cy="28" r="2.5" fill="#0f172a" />
          <circle cx="38" cy="28" r="2.5" fill="#0f172a" />
          <ellipse cx={24 + legOffset1} cy="50" rx="4" ry="5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx={40 + legOffset2} cy="50" rx="4" ry="5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    case 'cat_pirate':
    case 'cat_pirate_captain':
    case 'cat_pirate_evolved':
      return (
        <svg width="65" height="65" viewBox="0 0 65 65" className="drop-shadow-md">
          {/* Pirate Tricorne Hat */}
          <polygon points="12,18 32,4 52,18 32,14" fill="#0f172a" stroke="#dc2626" strokeWidth="2" />
          <ellipse cx="32" cy="34" rx="18" ry="17" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
          {/* Eye Patch */}
          <circle cx="26" cy="30" r="3" fill="#0f172a" />
          <line x1="20" y1="26" x2="32" y2="34" stroke="#0f172a" strokeWidth="2" />
          <circle cx="38" cy="30" r="2.5" fill="#0f172a" />
          {/* Flintlock Pistol / Cutlass */}
          <rect x={isAttacking ? 44 : 38} y="32" width="16" height="6" rx="2" fill="#78350f" stroke="#0f172a" strokeWidth="1.5" />
          <ellipse cx={24 + legOffset1} cy="52" rx="4" ry="5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx={40 + legOffset2} cy="52" rx="4" ry="5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    case 'cat_shaman':
    case 'cat_necromancer':
    case 'cat_shaman_evolved':
      return (
        <svg width="65" height="65" viewBox="0 0 65 65" className="drop-shadow-md">
          {/* Feathered Headdress */}
          <polygon points="26,14 32,2 38,14" fill="#a855f7" />
          <polygon points="18,18 24,6 28,18" fill="#3b82f6" />
          <polygon points="36,18 40,6 46,18" fill="#ef4444" />
          <ellipse cx="32" cy="34" rx="18" ry="17" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="26" cy="30" r="2.5" fill="#0f172a" />
          <circle cx="38" cy="30" r="2.5" fill="#0f172a" />
          {/* Shaman Skull Rattle */}
          <g transform={`rotate(${Math.sin(timer * 20) * 25} 44 34)`}>
            <line x1="44" y1="20" x2="44" y2="44" stroke="#78350f" strokeWidth="3" />
            <circle cx="44" cy="20" r="6" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
          </g>
          <ellipse cx={24 + legOffset1} cy="52" rx="4" ry="5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx={40 + legOffset2} cy="52" rx="4" ry="5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    case 'cat_witch':
    case 'cat_sorceress':
    case 'cat_witch_evolved':
      return (
        <svg width="65" height="65" viewBox="0 0 65 65" className="drop-shadow-md">
          {/* Pointy Witch Hat */}
          <polygon points="32,2 20,18 44,18" fill="#581c87" stroke="#3b0764" strokeWidth="2" />
          <ellipse cx="32" cy="18" rx="16" ry="4" fill="#7e22ce" />
          <ellipse cx="32" cy="34" rx="18" ry="17" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="26" cy="30" r="2.5" fill="#a855f7" />
          <circle cx="38" cy="30" r="2.5" fill="#a855f7" />
          {/* Magic Wand with Star */}
          <line x1="44" y1="42" x2={isAttacking ? 56 : 48} y2={isAttacking ? 22 : 28} stroke="#f59e0b" strokeWidth="3" />
          <polygon points="56,22 52,26 56,30 60,26" fill="#facc15" />
          <ellipse cx={24 + legOffset1} cy="52" rx="4" ry="5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx={40 + legOffset2} cy="52" rx="4" ry="5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    case 'cat_monk':
    case 'cat_monk_evolved':
      return (
        <svg width="65" height="65" viewBox="0 0 65 65" className="drop-shadow-md">
          {/* Monk Robe and Beads */}
          <ellipse cx="32" cy="34" rx="18" ry="17" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
          <path d="M 22 28 Q 32 38 42 28" fill="none" stroke="#78350f" strokeWidth="3" />
          <circle cx="26" cy="28" r="2.5" fill="#0f172a" />
          <circle cx="38" cy="28" r="2.5" fill="#0f172a" />
          <g transform={`rotate(${isAttacking ? -30 : 15} 46 32)`}>
            <line x1="46" y1="12" x2="46" y2="48" stroke="#d97706" strokeWidth="3" />
            <circle cx="46" cy="14" r="6" fill="none" stroke="#d97706" strokeWidth="2" />
          </g>
          <ellipse cx={24 + legOffset1} cy="52" rx="4" ry="5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx={40 + legOffset2} cy="52" rx="4" ry="5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    case 'cat_flower':
    case 'cat_bomber':
      return (
        <svg width="68" height="65" viewBox="0 0 68 65" className="drop-shadow-md">
          {/* Black Body Bomber Cat */}
          <ellipse cx="34" cy="34" rx="18" ry="17" fill="#0f172a" stroke="#000000" strokeWidth="2.5" />
          <circle cx="28" cy="30" r="3" fill="#ffffff" />
          <circle cx="28" cy="30" r="1.5" fill="#0f172a" />
          <circle cx="40" cy="30" r="3" fill="#ffffff" />
          <circle cx="40" cy="30" r="1.5" fill="#0f172a" />
          {/* Flower on head or Sparking Bomb */}
          <circle cx="34" cy="14" r="7" fill="#ef4444" stroke="#000000" strokeWidth="1.5" />
          <line x1="34" y1="7" x2="34" y2="2" stroke="#eab308" strokeWidth="2" />
          {isAttacking && (
            <circle cx="34" cy="14" r="12" fill="none" stroke="#f59e0b" strokeWidth="3" className="animate-ping" />
          )}
          <ellipse cx={26 + legOffset1} cy="52" rx="4" ry="5" fill="#0f172a" stroke="#000000" strokeWidth="2" />
          <ellipse cx={42 + legOffset2} cy="52" rx="4" ry="5" fill="#0f172a" stroke="#000000" strokeWidth="2" />
        </svg>
      );

    case 'cat_chronos':
    case 'cat_chronos_evolved':
      return (
        <svg width="90" height="90" viewBox="0 0 90 90" className="drop-shadow-xl">
          {/* Chronos Time Dial Ring */}
          <circle cx="45" cy="45" r="36" fill="none" stroke="#facc15" strokeWidth="2.5" strokeDasharray="8,4" className="animate-spin" />
          <ellipse cx="45" cy="48" rx="22" ry="20" fill="#f8fafc" stroke="#1e1b4b" strokeWidth="2.5" />
          {/* Goddess Crown */}
          <polygon points="35,28 45,16 55,28 45,24" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
          <circle cx="38" cy="44" r="3" fill="#3b82f6" />
          <circle cx="52" cy="44" r="3" fill="#3b82f6" />
          {/* Hourglass Staff */}
          <g transform={`rotate(${isAttacking ? 45 : -10} 60 45)`}>
            <line x1="60" y1="20" x2="60" y2="70" stroke="#f59e0b" strokeWidth="3" />
            <polygon points="56,22 64,22 60,30" fill="#38bdf8" />
            <polygon points="56,38 64,38 60,30" fill="#38bdf8" />
          </g>
          {isAttacking && (
            <circle cx="45" cy="45" r="28" fill="none" stroke="#38bdf8" strokeWidth="4" className="animate-ping" />
          )}
          <ellipse cx={36 + legOffset1} cy="68" rx="5" ry="6" fill="#f8fafc" stroke="#1e1b4b" strokeWidth="2" />
          <ellipse cx={54 + legOffset2} cy="68" rx="5" ry="6" fill="#f8fafc" stroke="#1e1b4b" strokeWidth="2" />
        </svg>
      );

    case 'cat_amaterasu':
    case 'cat_amaterasu_evolved':
      return (
        <svg width="95" height="95" viewBox="0 0 95 95" className="drop-shadow-xl">
          {/* Solar Mirror Ring */}
          <circle cx="47" cy="47" r="38" fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="12,6" className="animate-spin" />
          <circle cx="47" cy="47" r="28" fill="#fef08a" opacity="0.25" />
          <ellipse cx="47" cy="50" rx="20" ry="18" fill="#ffffff" stroke="#991b1b" strokeWidth="2.5" />
          {/* Sun Goddess Headdress */}
          <polygon points="37,30 47,15 57,30" fill="#dc2626" />
          <circle cx="40" cy="46" r="3" fill="#dc2626" />
          <circle cx="54" cy="46" r="3" fill="#dc2626" />
          {/* Sacred Mirror */}
          <circle cx="20" cy="45" r="10" fill="#facc15" stroke="#b45309" strokeWidth="2" />
          {isAttacking && (
            <circle cx="47" cy="47" r="35" fill="none" stroke="#f97316" strokeWidth="5" className="animate-ping" />
          )}
          <ellipse cx={38 + legOffset1} cy="70" rx="5" ry="6" fill="#ffffff" stroke="#991b1b" strokeWidth="2" />
          <ellipse cx={56 + legOffset2} cy="70" rx="5" ry="6" fill="#ffffff" stroke="#991b1b" strokeWidth="2" />
        </svg>
      );

    case 'cat_poseidon':
    case 'cat_poseidon_evolved':
      return (
        <svg width="95" height="95" viewBox="0 0 95 95" className="drop-shadow-xl">
          {/* Sea God Aura */}
          <circle cx="47" cy="47" r="36" fill="none" stroke="#06b6d4" strokeWidth="3" strokeDasharray="10,5" className="animate-spin" />
          <ellipse cx="47" cy="50" rx="20" ry="18" fill="#ffffff" stroke="#0e7490" strokeWidth="2.5" />
          {/* Ocean Crown */}
          <polygon points="36,32 40,20 47,26 54,20 58,32" fill="#06b6d4" stroke="#083344" strokeWidth="1.5" />
          <circle cx="40" cy="46" r="3" fill="#0891b2" />
          <circle cx="54" cy="46" r="3" fill="#0891b2" />
          {/* Trident */}
          <g transform={`rotate(${isAttacking ? 45 : -15} 65 45)`}>
            <line x1="65" y1="15" x2="65" y2="75" stroke="#f59e0b" strokeWidth="3.5" />
            <path d="M 55 25 L 65 15 L 75 25" fill="none" stroke="#06b6d4" strokeWidth="3" />
          </g>
          <ellipse cx={38 + legOffset1} cy="70" rx="5" ry="6" fill="#ffffff" stroke="#0e7490" strokeWidth="2" />
          <ellipse cx={56 + legOffset2} cy="70" rx="5" ry="6" fill="#ffffff" stroke="#0e7490" strokeWidth="2" />
        </svg>
      );

    case 'cat_sarukani':
    case 'cat_sarukani_evolved':
      return (
        <svg width="90" height="85" viewBox="0 0 90 85" className="drop-shadow-lg">
          {/* Sarukani Crab & Monkey mech */}
          <ellipse cx="45" cy="46" rx="24" ry="20" fill="#ef4444" stroke="#7f1d1d" strokeWidth="2.5" />
          {/* Monkey Driver Head */}
          <circle cx="45" cy="24" r="12" fill="#d97706" stroke="#78350f" strokeWidth="2" />
          <ellipse cx="45" cy="26" rx="8" ry="6" fill="#fde68a" />
          <circle cx="42" cy="24" r="2" fill="#000000" />
          <circle cx="48" cy="24" r="2" fill="#000000" />
          {/* Giant Crab Pincers */}
          <g transform={`rotate(${isAttacking ? -30 : 0} 22 45)`}>
            <path d="M 22 45 Q 8 30 14 20 Q 24 35 22 45" fill="#dc2626" stroke="#7f1d1d" strokeWidth="2" />
          </g>
          <g transform={`rotate(${isAttacking ? 30 : 0} 68 45)`}>
            <path d="M 68 45 Q 82 30 76 20 Q 66 35 68 45" fill="#dc2626" stroke="#7f1d1d" strokeWidth="2" />
          </g>
          <ellipse cx={34 + legOffset1} cy="68" rx="6" ry="5" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="2" />
          <ellipse cx={56 + legOffset2} cy="68" rx="6" ry="5" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="2" />
        </svg>
      );

    case 'cat_lumberjack':
    case 'cat_chainsaw':
      return (
        <svg width="68" height="65" viewBox="0 0 68 65" className="drop-shadow-md">
          {/* Plaid Lumberjack Cap */}
          <path d="M 18 20 Q 34 10 50 20 Z" fill="#dc2626" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx="34" cy="34" rx="18" ry="17" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="28" cy="30" r="2.5" fill="#0f172a" />
          <circle cx="40" cy="30" r="2.5" fill="#0f172a" />
          {/* Roaring Chainsaw */}
          <rect x={isAttacking ? 38 : 34} y="32" width="22" height="10" rx="2" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />
          <polygon points="60,32 66,37 60,42" fill="#94a3b8" />
          <ellipse cx={26 + legOffset1} cy="52" rx="4" ry="5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx={42 + legOffset2} cy="52" rx="4" ry="5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    case 'cat_boxer':
    case 'cat_champion':
      return (
        <svg width="68" height="65" viewBox="0 0 68 65" className="drop-shadow-md">
          <ellipse cx="34" cy="32" rx="18" ry="17" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
          {/* Headband & Bruise */}
          <rect x="18" y="20" width="32" height="5" fill="#dc2626" />
          <circle cx="28" cy="28" r="2.5" fill="#0f172a" />
          <circle cx="40" cy="28" r="2.5" fill="#0f172a" />
          {/* Red Boxing Gloves */}
          <circle cx={isAttacking ? 52 : 44} cy="36" r="7" fill="#dc2626" stroke="#991b1b" strokeWidth="2" />
          <circle cx="24" cy="38" r="6" fill="#dc2626" stroke="#991b1b" strokeWidth="2" />
          <ellipse cx={26 + legOffset1} cy="50" rx="4" ry="5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx={42 + legOffset2} cy="50" rx="4" ry="5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    case 'cat_fencer':
    case 'cat_swordmaster':
    case 'cat_liberty':
      return (
        <svg width="76" height="70" viewBox="0 0 76 70" className="drop-shadow-md">
          {/* Fencing Helmet / Rapier or Statue of Liberty torch */}
          <ellipse cx="38" cy="34" rx="20" ry="18" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
          {/* Fencing Mesh Mask */}
          <ellipse cx="34" cy="32" rx="12" ry="10" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
          <circle cx="30" cy="30" r="1.5" fill="#f8fafc" />
          {/* Glowing Barrier-Breaker Rapier Blade */}
          <g transform={`rotate(${isAttacking ? 45 : -15} 48 38)`}>
            <line x1="48" y1="38" x2="80" y2="28" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="48" cy="38" r="5" fill="#f59e0b" stroke="#0f172a" strokeWidth="1.5" />
            {isAttacking && (
              <polygon points="78,24 86,28 78,32" fill="#38bdf8" className="animate-ping" />
            )}
          </g>
          <ellipse cx={30 + legOffset1} cy="54" rx="4" ry="5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx={46 + legOffset2} cy="54" rx="4" ry="5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    // =========================================================================
    // STAR ALIEN ENEMIES (スターエイリアン敵スプライト: 星リング＋バリア・ワープ意匠)
    // =========================================================================
    case 'enemy_star_doge':
      return (
        <svg width="68" height="60" viewBox="0 0 68 60" className="drop-shadow-lg">
          {/* Cosmic Star Halo */}
          <circle cx="34" cy="28" r="26" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6,4" className="animate-spin" />
          {/* Star Alien Doge Body */}
          <ellipse cx="34" cy="30" rx="20" ry="16" fill="#06b6d4" stroke="#082f49" strokeWidth="2.5" />
          {/* Glowing Alien Star Antenna */}
          <line x1="34" y1="14" x2="34" y2="4" stroke="#facc15" strokeWidth="2.5" />
          <polygon points="34,1 36,5 40,5 37,8 38,12 34,9 30,12 31,8 28,5 32,5" fill="#facc15" />
          {/* Alien Eyes */}
          <ellipse cx="26" cy="28" rx="3.5" ry="5" fill="#f43f5e" />
          <ellipse cx="42" cy="28" rx="3.5" ry="5" fill="#f43f5e" />
          <circle cx="27" cy="26" r="1.5" fill="#ffffff" />
          <circle cx="43" cy="26" r="1.5" fill="#ffffff" />
          {/* Star Alien Feet */}
          <ellipse cx={24 + legOffset1} cy="48" rx="4.5" ry="5" fill="#0891b2" stroke="#082f49" strokeWidth="2" />
          <ellipse cx={44 + legOffset2} cy="48" rx="4.5" ry="5" fill="#0891b2" stroke="#082f49" strokeWidth="2" />
        </svg>
      );

    case 'enemy_star_snache':
      return (
        <svg width="74" height="55" viewBox="0 0 74 55" className="drop-shadow-lg">
          <ellipse cx="37" cy="27" rx="28" ry="12" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="8,4" className="animate-spin" />
          <path d="M 60 40 Q 40 15 20 40 Q 10 30 5 22" fill="none" stroke="#0284c7" strokeWidth="12" strokeLinecap="round" />
          <circle cx="8" cy="20" r="7" fill="#06b6d4" stroke="#0c4a6e" strokeWidth="2" />
          <polygon points="8,8 10,14 16,14 11,18 13,24 8,20 3,24 5,18 0,14 6,14" fill="#facc15" />
          <circle cx="6" cy="18" r="2.5" fill="#f43f5e" />
        </svg>
      );

    case 'enemy_star_croc':
      return (
        <svg width="78" height="55" viewBox="0 0 78 55" className="drop-shadow-lg">
          <ellipse cx="38" cy="28" rx="30" ry="12" fill="none" stroke="#c084fc" strokeWidth="2" strokeDasharray="8,4" className="animate-spin" />
          <ellipse cx="40" cy="30" rx="26" ry="13" fill="#0284c7" stroke="#0c4a6e" strokeWidth="2.5" />
          {/* Croc Jaw with Sharp Star Teeth */}
          <polygon points="12,28 2,24 16,36" fill="#0284c7" stroke="#0c4a6e" strokeWidth="2" />
          <polygon points="4,24 8,28 12,25 16,29" fill="#facc15" />
          {/* Triple Cosmic Eyes */}
          <circle cx="22" cy="24" r="3" fill="#f43f5e" />
          <circle cx="30" cy="22" r="3" fill="#f43f5e" />
          <circle cx="38" cy="24" r="3" fill="#f43f5e" />
          <ellipse cx={26 + legOffset1} cy="45" rx="5" ry="4" fill="#0369a1" stroke="#0c4a6e" strokeWidth="2" />
          <ellipse cx={52 + legOffset2} cy="45" rx="5" ry="4" fill="#0369a1" stroke="#0c4a6e" strokeWidth="2" />
        </svg>
      );

    case 'enemy_star_peng':
    case 'enemy_alien_penguin':
      return (
        <svg width="70" height="65" viewBox="0 0 70 65" className="drop-shadow-lg">
          {/* Star Penguin */}
          <polygon points="35,4 38,12 46,12 40,17 42,25 35,20 28,25 30,17 24,12 32,12" fill="#facc15" />
          <ellipse cx="36" cy="35" rx="18" ry="16" fill="#0ea5e9" stroke="#075985" strokeWidth="2.5" />
          <polygon points="16,35 6,38 16,42" fill="#f43f5e" stroke="#075985" strokeWidth="1.5" />
          <circle cx="24" cy="32" r="3.5" fill="#facc15" />
          <circle cx="23" cy="31" r="1.5" fill="#000000" />
          {/* Cosmic Wing */}
          <g transform={`rotate(${Math.sin(timer * 25) * 30} 42 34)`}>
            <ellipse cx="46" cy="32" rx="14" ry="7" fill="#38bdf8" stroke="#075985" strokeWidth="2" />
          </g>
          <line x1={30 + legOffset1} y1="50" x2="30" y2="58" stroke="#f43f5e" strokeWidth="2.5" />
          <line x1={42 + legOffset2} y1="50" x2="42" y2="58" stroke="#f43f5e" strokeWidth="2.5" />
        </svg>
      );

    case 'enemy_star_gregory':
      return (
        <svg width="85" height="75" viewBox="0 0 85 75" className="drop-shadow-xl">
          <circle cx="42" cy="38" r="32" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="10,5" className="animate-spin" />
          <ellipse cx="42" cy="40" rx="24" ry="20" fill="#0284c7" stroke="#082f49" strokeWidth="3" />
          {/* Gregory Horns / Stars */}
          <polygon points="26,20 18,6 30,16" fill="#facc15" stroke="#b45309" strokeWidth="1.5" />
          <polygon points="58,20 66,6 54,16" fill="#facc15" stroke="#b45309" strokeWidth="1.5" />
          {/* Fierce Alien Visage */}
          <circle cx="34" cy="36" r="4" fill="#f43f5e" />
          <circle cx="50" cy="36" r="4" fill="#f43f5e" />
          <ellipse cx={32 + legOffset1} cy="60" rx="7" ry="6" fill="#0369a1" stroke="#082f49" strokeWidth="2" />
          <ellipse cx={52 + legOffset2} cy="60" rx="7" ry="6" fill="#0369a1" stroke="#082f49" strokeWidth="2" />
        </svg>
      );

    case 'enemy_star_manticore':
      return (
        <svg width="105" height="85" viewBox="0 0 105 85" className="drop-shadow-2xl">
          <circle cx="52" cy="42" r="38" fill="none" stroke="#a855f7" strokeWidth="3" strokeDasharray="12,6" className="animate-spin" />
          {/* Mole Pirate Captain Star Alien */}
          <ellipse cx="52" cy="45" rx="30" ry="22" fill="#0f766e" stroke="#042f2e" strokeWidth="3" />
          <polygon points="32,24 52,10 72,24 52,20" fill="#0f172a" stroke="#facc15" strokeWidth="2" />
          <circle cx="42" cy="40" r="4" fill="#facc15" />
          <circle cx="62" cy="40" r="4" fill="#f43f5e" />
          {/* Mole Claws */}
          <g transform={`rotate(${isAttacking ? -35 : 10} 25 50)`}>
            <polygon points="12,42 28,45 18,58" fill="#14b8a6" stroke="#042f2e" strokeWidth="2" />
          </g>
          <ellipse cx={40 + legOffset1} cy="68" rx="8" ry="6" fill="#115e59" stroke="#042f2e" strokeWidth="2.5" />
          <ellipse cx={64 + legOffset2} cy="68" rx="8" ry="6" fill="#115e59" stroke="#042f2e" strokeWidth="2.5" />
        </svg>
      );

    case 'enemy_star_manboros':
      return (
        <svg width="125" height="95" viewBox="0 0 125 95" className="drop-shadow-2xl">
          <circle cx="62" cy="48" r="44" fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeDasharray="14,7" className="animate-spin" />
          {/* Cosmic Sunfish Manboros */}
          <ellipse cx="62" cy="48" rx="38" ry="28" fill="#0369a1" stroke="#082f49" strokeWidth="3.5" />
          <polygon points="62,10 72,22 52,22" fill="#38bdf8" stroke="#082f49" strokeWidth="2" />
          <polygon points="62,86 72,74 52,74" fill="#38bdf8" stroke="#082f49" strokeWidth="2" />
          <circle cx="36" cy="44" r="6" fill="#f43f5e" />
          <circle cx="34" cy="42" r="2.5" fill="#ffffff" />
          <circle cx="20" cy="48" r="4" fill="#082f49" />
        </svg>
      );

    case 'enemy_star_evil':
      return (
        <svg width="115" height="100" viewBox="0 0 115 100" className="drop-shadow-2xl">
          <circle cx="58" cy="50" r="45" fill="none" stroke="#9333ea" strokeWidth="3.5" strokeDasharray="16,8" className="animate-spin" />
          {/* Evil Star Alien Boss */}
          <polygon points="58,15 72,38 98,42 78,60 84,85 58,72 32,85 38,60 18,42 44,38" fill="#4c1d95" stroke="#c084fc" strokeWidth="3" />
          <ellipse cx="58" cy="48" rx="14" ry="16" fill="#09090b" stroke="#f43f5e" strokeWidth="3" />
          <circle cx="58" cy="48" r="6" fill="#f43f5e" className="animate-pulse" />
        </svg>
      );

    case 'enemy_star_pigeon':
      return (
        <svg width="70" height="65" viewBox="0 0 70 65" className="drop-shadow-lg">
          {/* Star Pigeon */}
          <polygon points="35,4 38,12 46,12 40,17 42,25 35,20 28,25 30,17 24,12 32,12" fill="#facc15" />
          <ellipse cx="36" cy="35" rx="18" ry="16" fill="#0ea5e9" stroke="#075985" strokeWidth="2.5" />
          <polygon points="16,35 6,38 16,42" fill="#f43f5e" stroke="#075985" strokeWidth="1.5" />
          <circle cx="24" cy="32" r="3.5" fill="#facc15" />
          <circle cx="23" cy="31" r="1.5" fill="#000000" />
          {/* Cosmic Wing */}
          <g transform={`rotate(${Math.sin(timer * 25) * 30} 42 34)`}>
            <ellipse cx="46" cy="32" rx="14" ry="7" fill="#38bdf8" stroke="#075985" strokeWidth="2" />
          </g>
          <line x1={30 + legOffset1} y1="50" x2="30" y2="58" stroke="#f43f5e" strokeWidth="2.5" />
          <line x1={42 + legOffset2} y1="50" x2="42" y2="58" stroke="#f43f5e" strokeWidth="2.5" />
        </svg>
      );

    case 'enemy_star_hippo':
      return (
        <svg width="95" height="75" viewBox="0 0 95 75" className="drop-shadow-xl">
          <circle cx="48" cy="38" r="34" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="10,6" className="animate-spin" />
          {/* Bulky Hippo Snout */}
          <ellipse cx="32" cy="40" rx="22" ry="18" fill="#0284c7" stroke="#082f49" strokeWidth="3" />
          <ellipse cx="60" cy="36" rx="24" ry="20" fill="#0ea5e9" stroke="#082f49" strokeWidth="3" />
          <circle cx="20" cy="36" r="3" fill="#082f49" />
          <circle cx="26" cy="36" r="3" fill="#082f49" />
          {/* Alien Eyes */}
          <ellipse cx="44" cy="26" rx="4" ry="5" fill="#f43f5e" />
          <ellipse cx="54" cy="26" rx="4" ry="5" fill="#f43f5e" />
          <ellipse cx={40 + legOffset1} cy="58" rx="8" ry="7" fill="#0369a1" stroke="#082f49" strokeWidth="2.5" />
          <ellipse cx={68 + legOffset2} cy="58" rx="8" ry="7" fill="#0369a1" stroke="#082f49" strokeWidth="2.5" />
        </svg>
      );

    case 'enemy_star_pig':
      return (
        <svg width="80" height="65" viewBox="0 0 80 65" className="drop-shadow-lg">
          <ellipse cx="40" cy="34" rx="22" ry="18" fill="#ec4899" stroke="#831843" strokeWidth="2.5" />
          {/* Star Alien Snout */}
          <ellipse cx="22" cy="36" rx="10" ry="7" fill="#f472b6" stroke="#831843" strokeWidth="2" />
          <circle cx="19" cy="36" r="2" fill="#831843" />
          <circle cx="25" cy="36" r="2" fill="#831843" />
          {/* Starlight Crest */}
          <polygon points="40,6 42,12 48,12 43,16 45,22 40,18 35,22 37,16 32,12 38,12" fill="#38bdf8" />
          <circle cx="34" cy="28" r="3.5" fill="#38bdf8" />
          <circle cx="46" cy="28" r="3.5" fill="#38bdf8" />
          <ellipse cx={30 + legOffset1} cy="54" rx="5" ry="5" fill="#be185d" stroke="#831843" strokeWidth="2" />
          <ellipse cx={50 + legOffset2} cy="54" rx="5" ry="5" fill="#be185d" stroke="#831843" strokeWidth="2" />
        </svg>
      );

    case 'enemy_star_le_boin':
      return (
        <svg width="125" height="100" viewBox="0 0 125 100" className="drop-shadow-2xl">
          <ellipse cx="65" cy="50" rx="52" ry="42" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="16,8" className="animate-spin" />
          {/* Big Alien Elephant Body */}
          <ellipse cx="75" cy="52" rx="34" ry="28" fill="#0284c7" stroke="#082f49" strokeWidth="3.5" />
          <ellipse cx="40" cy="46" rx="22" ry="20" fill="#0ea5e9" stroke="#082f49" strokeWidth="3.5" />
          {/* Glowing Cosmic Trunk */}
          <g transform={`rotate(${Math.sin(timer * 12) * 20} 25 50)`}>
            <path d="M 30 50 Q 15 70 8 55 Q 0 45 10 40" fill="none" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" />
          </g>
          {/* Big Star Alien Ear */}
          <ellipse cx="56" cy="40" rx="14" ry="18" fill="#38bdf8" stroke="#082f49" strokeWidth="2.5" />
          <ellipse cx="32" cy="38" rx="4.5" ry="6" fill="#f43f5e" />
          <ellipse cx={52 + legOffset1} cy="82" rx="10" ry="8" fill="#0369a1" stroke="#082f49" strokeWidth="3" />
          <ellipse cx={88 + legOffset2} cy="82" rx="10" ry="8" fill="#0369a1" stroke="#082f49" strokeWidth="3" />
        </svg>
      );

    case 'enemy_star_moth':
      return (
        <svg width="105" height="85" viewBox="0 0 105 85" className="drop-shadow-xl">
          {/* Flapping Star Wings */}
          <g transform={`scale(1, ${Math.sin(timer * 22)})`}>
            <ellipse cx="32" cy="30" rx="26" ry="18" fill="#06b6d4" stroke="#083344" strokeWidth="2.5" />
            <ellipse cx="74" cy="30" rx="26" ry="18" fill="#06b6d4" stroke="#083344" strokeWidth="2.5" />
            <polygon points="32,24 35,32 44,32 37,38 40,46 32,40 24,46 27,38 20,32 29,32" fill="#facc15" />
            <polygon points="74,24 77,32 86,32 79,38 82,46 74,40 66,46 69,38 62,32 71,32" fill="#facc15" />
          </g>
          {/* Moth Body */}
          <ellipse cx="53" cy="38" rx="10" ry="24" fill="#0891b2" stroke="#083344" strokeWidth="2.5" />
          <circle cx="53" cy="20" r="5" fill="#f43f5e" />
          <line x1="50" y1="16" x2="40" y2="4" stroke="#38bdf8" strokeWidth="2" />
          <line x1="56" y1="16" x2="66" y2="4" stroke="#38bdf8" strokeWidth="2" />
        </svg>
      );

    // =========================================================================
    // BOSS: FILIBUSTER (フィリバスター・超神撃チャージボス)
    // =========================================================================
    case 'enemy_filibuster':
    case 'boss_filibuster':
      return (
        <svg width="165" height="155" viewBox="0 0 165 155" className="drop-shadow-[0_0_25px_rgba(168,85,247,0.9)]">
          {/* Huge Mystical Halo Rings */}
          <circle cx="82" cy="75" r="70" fill="none" stroke="#c084fc" strokeWidth="4" strokeDasharray="20,10" className="animate-spin" />
          <circle cx="82" cy="75" r="54" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="12,6" className="animate-spin" />
          {/* Godly Floating Relic Armor */}
          <polygon points="82,8 96,38 136,44 104,70 114,110 82,88 50,110 60,70 28,44 68,38" fill="#4c1d95" stroke="#a855f7" strokeWidth="4" />
          {/* Core Eye / Nucleus */}
          <ellipse cx="82" cy="68" rx="20" ry="24" fill="#09090b" stroke="#f43f5e" strokeWidth="4" />
          <circle cx="82" cy="68" r="10" fill="#f43f5e" className="animate-pulse" />
          <circle cx="82" cy="68" r="4" fill="#ffffff" />
          {/* Energy Tendrils / Floating Hands */}
          <g transform={`rotate(${Math.sin(timer * 8) * 15} 35 80)`}>
            <polygon points="20,70 36,60 30,90" fill="#7c3aed" stroke="#c084fc" strokeWidth="2" />
          </g>
          <g transform={`rotate(${-Math.sin(timer * 8) * 15} 130 80)`}>
            <polygon points="144,70 128,60 134,90" fill="#7c3aed" stroke="#c084fc" strokeWidth="2" />
          </g>
          {/* Attack Charge Pulsing Nova */}
          {isAttacking && (
            <circle cx="82" cy="68" r="45" fill="none" stroke="#f43f5e" strokeWidth="8" className="animate-ping" />
          )}
        </svg>
      );

    // =========================================================================
    // NEW CAT: SUMMER CAT 2026 (夏キャット2026)
    // =========================================================================
    case 'cat_summer_2026':
      return (
        <svg width="75" height="70" viewBox="0 0 75 70" className="drop-shadow-lg">
          {/* Inflatable Flamingo / Tropical Floatie Ring */}
          <ellipse cx="38" cy="44" rx="28" ry="12" fill="#fb7185" stroke="#be123c" strokeWidth="2.5" />
          <ellipse cx="38" cy="44" rx="16" ry="6" fill="#f43f5e" />
          {/* Floatie Flamingo Head */}
          <g transform={`rotate(${Math.sin(timer * 10) * 8} 14 36)`}>
            <path d="M 14 44 Q 10 32 12 24 Q 15 18 20 22 Q 16 28 16 44 Z" fill="#fb7185" stroke="#be123c" strokeWidth="2" />
            <polygon points="12,24 6,26 12,28" fill="#1e293b" />
          </g>
          {/* Cat Body in Swimwear */}
          <polygon points="26,18 30,6 38,15" fill="#ffffff" stroke="#000000" strokeWidth="2.5" strokeLinejoin="round" />
          <polygon points="44,15 52,6 56,18" fill="#ffffff" stroke="#000000" strokeWidth="2.5" strokeLinejoin="round" />
          <ellipse cx="40" cy="28" rx="18" ry="17" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />
          {/* Sunglasses */}
          <rect x="26" y="22" width="12" height="8" rx="2" fill="#0284c7" stroke="#0f172a" strokeWidth="1.5" />
          <rect x="42" y="22" width="12" height="8" rx="2" fill="#0284c7" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="38" y1="26" x2="42" y2="26" stroke="#0f172a" strokeWidth="2" />
          {/* Smiling Tongue */}
          <path d="M 37 32 Q 40 37 43 32 Z" fill="#f43f5e" stroke="#000000" strokeWidth="1.5" />
          {/* Surfboard / Tropical Drink on attack */}
          <g transform={`rotate(${isAttacking ? -35 : 15} 58 35)`}>
            <rect x="54" y="15" width="8" height="26" rx="4" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
            <ellipse cx="58" cy="14" rx="6" ry="3" fill="#38bdf8" />
            {isAttacking && (
              <polygon points="62,10 75,5 68,18" fill="#38bdf8" className="animate-ping" />
            )}
          </g>
          {/* Water Splash at bottom */}
          <ellipse cx="38" cy="56" rx="24" ry="4" fill="#38bdf8" opacity="0.6" />
        </svg>
      );

    case 'cat_summer_2026_evolved':
      return (
        <svg width="90" height="85" viewBox="0 0 90 85" className="drop-shadow-2xl">
          {/* Blazing Sun Aura */}
          <circle cx="45" cy="40" r="36" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="10,6" className="animate-spin" />
          {/* Giant Tropical Sun Parasol Laser Cannon */}
          <g transform={`rotate(${isAttacking ? -45 : -10} 60 25)`}>
            <path d="M 40 20 Q 60 0 80 20 Z" fill="#ef4444" stroke="#7f1d1d" strokeWidth="2.5" />
            <path d="M 46 20 Q 60 4 74 20 Z" fill="#facc15" />
            <line x1="60" y1="20" x2="60" y2="55" stroke="#b45309" strokeWidth="3.5" />
            {isAttacking && (
              <g className="animate-ping">
                <circle cx="60" cy="5" r="14" fill="#fbbf24" opacity="0.8" />
                <line x1="60" y1="5" x2="90" y2="-10" stroke="#f43f5e" strokeWidth="5" />
              </g>
            )}
          </g>
          {/* High-speed Jet Wave Surfboard */}
          <ellipse cx="42" cy="62" rx="34" ry="9" fill="#0284c7" stroke="#075985" strokeWidth="3" />
          <polygon points="12,62 6,56 16,56" fill="#38bdf8" />
          {/* Cat Supreme Body */}
          <polygon points="28,26 32,12 42,22" fill="#ffffff" stroke="#000000" strokeWidth="3" strokeLinejoin="round" />
          <polygon points="48,22 58,12 62,26" fill="#ffffff" stroke="#000000" strokeWidth="3" strokeLinejoin="round" />
          <ellipse cx="45" cy="38" rx="20" ry="19" fill="#ffffff" stroke="#000000" strokeWidth="3" />
          {/* Gold Star Sunglasses */}
          <polygon points="34,28 36,33 41,33 37,36 39,41 34,38 29,41 31,36 27,33 32,33" fill="#fbbf24" stroke="#000000" strokeWidth="1.5" />
          <polygon points="54,28 56,33 61,33 57,36 59,41 54,38 49,41 51,36 47,33 52,33" fill="#fbbf24" stroke="#000000" strokeWidth="1.5" />
          {/* Water Splash */}
          <ellipse cx="42" cy="74" rx="32" ry="5" fill="#38bdf8" opacity="0.7" />
        </svg>
      );

    // =========================================================================
    // NEW CAT: RELIC EMPEROR (古代帝王ネコ / 時空超越神オメガキャット)
    // =========================================================================
    case 'cat_relic_emperor':
      return (
        <svg width="85" height="85" viewBox="0 0 85 85" className="drop-shadow-2xl">
          {/* Relic Emperor Crown & Robes */}
          <polygon points="26,20 30,8 38,18" fill="#fef08a" stroke="#854d0e" strokeWidth="2.5" strokeLinejoin="round" />
          <polygon points="46,18 54,8 58,20" fill="#fef08a" stroke="#854d0e" strokeWidth="2.5" strokeLinejoin="round" />
          {/* Crown */}
          <polygon points="32,18 36,6 42,14 48,6 52,18" fill="#eab308" stroke="#713f12" strokeWidth="2" />
          {/* Body */}
          <ellipse cx="42" cy="42" rx="24" ry="22" fill="#fef9c3" stroke="#854d0e" strokeWidth="3" />
          <circle cx="34" cy="38" r="3.5" fill="#713f12" />
          <circle cx="50" cy="38" r="3.5" fill="#713f12" />
          {/* Scepter */}
          <g transform={`rotate(${isAttacking ? -30 : 10} 65 45)`}>
            <line x1="65" y1="20" x2="65" y2="65" stroke="#ca8a04" strokeWidth="4" />
            <circle cx="65" cy="18" r="8" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" />
          </g>
          {/* Legs */}
          <ellipse cx={32 + legOffset1} cy="66" rx="6" ry="6" fill="#fef08a" stroke="#854d0e" strokeWidth="2" />
          <ellipse cx={52 + legOffset2} cy="66" rx="6" ry="6" fill="#fef08a" stroke="#854d0e" strokeWidth="2" />
        </svg>
      );

    case 'cat_relic_emperor_evolved':
      return (
        <svg width="105" height="100" viewBox="0 0 105 100" className="drop-shadow-[0_0_20px_rgba(234,179,8,0.8)]">
          {/* Cosmic Relic Halo */}
          <circle cx="52" cy="50" r="44" fill="none" stroke="#eab308" strokeWidth="3" strokeDasharray="14,7" className="animate-spin" />
          {/* God Wings */}
          <path d="M 45 40 Q 15 15 10 50 Q 25 60 45 48 Z" fill="#ca8a04" stroke="#713f12" strokeWidth="2.5" />
          <path d="M 60 40 Q 90 15 95 50 Q 80 60 60 48 Z" fill="#ca8a04" stroke="#713f12" strokeWidth="2.5" />
          {/* Omega Cat Sphere Body */}
          <circle cx="52" cy="48" r="24" fill="#fef08a" stroke="#713f12" strokeWidth="3.5" />
          {/* Radiant Omega Eyes */}
          <circle cx="44" cy="44" r="4.5" fill="#0284c7" />
          <circle cx="60" cy="44" r="4.5" fill="#0284c7" />
          {/* Divine Omega Sigil */}
          <circle cx="52" cy="48" r="8" fill="none" stroke="#dc2626" strokeWidth="2" className="animate-pulse" />
          {isAttacking && (
            <circle cx="52" cy="48" r="32" fill="none" stroke="#38bdf8" strokeWidth="6" className="animate-ping" />
          )}
        </svg>
      );

    // =========================================================================
    // CORRUPTED VALKYRIE (腐敗されしネコヴァルキリー)
    // =========================================================================
    case 'enemy_corrupted_valkyrie':
      return (
        <svg width="95" height="98" viewBox="0 0 95 98" className="drop-shadow-[0_0_20px_rgba(168,85,247,0.85)]">
          {/* Decayed Necrotic Wings */}
          <path d="M 16 32 Q -6 6 18 2 Q 28 8 26 38 Z" fill="#581c87" stroke="#3b0764" strokeWidth="2.5" />
          <path d="M 56 32 Q 78 6 52 2 Q 42 8 44 38 Z" fill="#581c87" stroke="#3b0764" strokeWidth="2.5" />
          {/* Torn Wing Feathers */}
          <polygon points="6,12 12,24 2,22" fill="#2e1065" />
          <polygon points="72,12 66,24 76,22" fill="#2e1065" />
          {/* Broken Corrupted Dark Halo */}
          <ellipse cx="36" cy="4" rx="14" ry="4" fill="none" stroke="#a855f7" strokeWidth="3" strokeDasharray="6,4" />
          {/* Cursed Purple Necro Spear */}
          <g transform={isAttacking ? "rotate(45 60 44)" : "rotate(-15 60 44)"} className="transition-transform duration-100">
            <line x1="12" y1="88" x2="76" y2="10" stroke="#7e22ce" strokeWidth="5" />
            <line x1="12" y1="88" x2="76" y2="10" stroke="#c084fc" strokeWidth="2" />
            <polygon points="76,10 92,2 84,20" fill="#22c55e" stroke="#14532d" strokeWidth="2" />
            {isAttacking && (
              <circle cx="86" cy="10" r="14" fill="#a855f7" fillOpacity="0.6" className="animate-ping" />
            )}
          </g>
          {/* Corrupted Valkyrie Body with exposed zombie bones */}
          <ellipse cx="36" cy="42" rx="16" ry="20" fill="#475569" stroke="#0f172a" strokeWidth="2.5" />
          <polygon points="26,22 30,10 36,20" fill="#64748b" stroke="#0f172a" strokeWidth="2" />
          <polygon points="38,20 44,10 48,22" fill="#64748b" stroke="#0f172a" strokeWidth="2" />
          <circle cx="36" cy="26" r="12" fill="#94a3b8" stroke="#0f172a" strokeWidth="2" />
          {/* Glowing Cursed Eyes */}
          <ellipse cx="33" cy="25" rx="2" ry="3" fill="#ef4444" />
          <ellipse cx="39" cy="25" rx="2" ry="3" fill="#ef4444" />
          {/* Toxic Zombie Goo Drip */}
          <path d="M 32 50 Q 36 60 38 52" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
          {/* Skeletal Legs */}
          <line x1="28" y1="62" x2={26 + legOffset1} y2="88" stroke="#334155" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="44" y1="62" x2={42 + legOffset2} y2="88" stroke="#334155" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );

    // =========================================================================
    // ADVENT BOSS: CLIONEL (断罪天使クオリネル)
    // =========================================================================
    case 'enemy_clionel':
      return (
        <svg width="115" height="110" viewBox="0 0 115 110" className="drop-shadow-[0_0_30px_rgba(56,189,248,0.9)]">
          {/* Heavenly Holy Ring */}
          <circle cx="58" cy="55" r="50" fill="none" stroke="#fef08a" strokeWidth="3" strokeDasharray="12,6" className="animate-spin" />
          {/* Angelic Clione Floating Wings */}
          <path d="M 46 45 Q 10 15 15 55 Q 30 65 46 55 Z" fill="#bae6fd" fillOpacity="0.85" stroke="#0284c7" strokeWidth="3" />
          <path d="M 70 45 Q 106 15 101 55 Q 86 65 70 55 Z" fill="#bae6fd" fillOpacity="0.85" stroke="#0284c7" strokeWidth="3" />
          {/* Angel Clione Body */}
          <path d="M 58 18 Q 42 35 48 75 Q 58 92 68 75 Q 74 35 58 18 Z" fill="#e0f2fe" stroke="#0284c7" strokeWidth="3.5" />
          {/* Inner Glowing Sacred Core / Organs */}
          <circle cx="58" cy="48" r="11" fill="#f43f5e" stroke="#be123c" strokeWidth="2" className="animate-pulse" />
          {/* Angelic Golden Halo */}
          <ellipse cx="58" cy="10" rx="20" ry="6" fill="#fef08a" stroke="#eab308" strokeWidth="3.5" />
          {/* Sacred Antennae / Horns */}
          <path d="M 52 18 Q 46 4 40 8" stroke="#0284c7" strokeWidth="3" fill="none" />
          <path d="M 64 18 Q 70 4 76 8" stroke="#0284c7" strokeWidth="3" fill="none" />
          {/* Holy Eyes */}
          <circle cx="53" cy="28" r="2.5" fill="#0369a1" />
          <circle cx="63" cy="28" r="2.5" fill="#0369a1" />
          {/* Attack Blast: Divine Meteor Condemnation */}
          {isAttacking && (
            <g>
              <circle cx="58" cy="48" r="38" fill="none" stroke="#facc15" strokeWidth="5" className="animate-ping" />
              <line x1="58" y1="48" x2="110" y2="48" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
            </g>
          )}
        </svg>
      );

    // =========================================================================
    // ADVENT BOSS: HANNYA (般若我王)
    // =========================================================================
    case 'enemy_hannya':
      return (
        <svg width="120" height="115" viewBox="0 0 120 115" className="drop-shadow-[0_0_30px_rgba(239,68,68,0.95)]">
          {/* Infernal Hellfire Ring */}
          <circle cx="60" cy="58" r="52" fill="none" stroke="#f97316" strokeWidth="4" strokeDasharray="16,8" className="animate-spin" />
          {/* Blazing Horns */}
          <path d="M 38 28 Q 20 -8 10 2 Q 22 18 34 32 Z" fill="#ef4444" stroke="#7f1d1d" strokeWidth="3.5" />
          <path d="M 82 28 Q 100 -8 110 2 Q 98 18 86 32 Z" fill="#ef4444" stroke="#7f1d1d" strokeWidth="3.5" />
          {/* Flaming Demon Hair */}
          <path d="M 22 45 Q 6 30 18 60 Q 24 75 32 68 Z" fill="#b91c1c" stroke="#450a0a" strokeWidth="2.5" />
          <path d="M 98 45 Q 114 30 102 60 Q 96 75 88 68 Z" fill="#b91c1c" stroke="#450a0a" strokeWidth="2.5" />
          {/* Demonic Crimson Hannya Face Mask */}
          <path d="M 36 28 L 84 28 Q 96 55 84 88 Q 60 102 36 88 Q 24 55 36 28 Z" fill="#dc2626" stroke="#450a0a" strokeWidth="4" />
          {/* Golden Demonic Eyes */}
          <polygon points="38,44 54,42 46,50" fill="#facc15" stroke="#78350f" strokeWidth="2" />
          <polygon points="82,44 66,42 74,50" fill="#facc15" stroke="#78350f" strokeWidth="2" />
          <circle cx="46" cy="46" r="2.5" fill="#000000" />
          <circle cx="74" cy="46" r="2.5" fill="#000000" />
          {/* Terrifying Fangs and Wide Mouth */}
          <path d="M 40 70 Q 60 84 80 70 Q 60 66 40 70 Z" fill="#450a0a" stroke="#7f1d1d" strokeWidth="2.5" />
          <polygon points="44,68 48,78 52,68" fill="#ffffff" />
          <polygon points="68,68 72,78 76,68" fill="#ffffff" />
          <polygon points="42,76 46,66 50,76" fill="#ffffff" />
          <polygon points="70,76 74,66 78,76" fill="#ffffff" />
          {/* Attack Blast: Hellfire Curse Wave */}
          {isAttacking && (
            <g>
              <ellipse cx="60" cy="74" rx="42" ry="20" fill="none" stroke="#ef4444" strokeWidth="6" className="animate-ping" />
            </g>
          )}
        </svg>
      );

    // =========================================================================
    // ZOMBIE EXTREME UNITS (スカル・ルー & カダヴァル・ボア)
    // =========================================================================
    case 'enemy_zombie_kang_roo':
      return (
        <svg width="78" height="75" viewBox="0 0 78 75" className="drop-shadow-lg">
          {/* Kangaroo Body with Necrotic Tone */}
          <ellipse cx="38" cy="38" rx="20" ry="16" fill="#64748b" stroke="#0f172a" strokeWidth="2.5" />
          {/* Ears */}
          <polygon points="46,16 52,4 58,16" fill="#64748b" stroke="#0f172a" strokeWidth="2" />
          <polygon points="36,16 38,4 44,16" fill="#64748b" stroke="#0f172a" strokeWidth="2" />
          {/* Head & Boxing Gloves */}
          <circle cx="50" cy="24" r="11" fill="#64748b" stroke="#0f172a" strokeWidth="2" />
          <circle cx="48" cy="22" r="2.5" fill="#ef4444" />
          {/* Boxing Gloves */}
          <circle cx={isAttacking ? 68 : 58} cy="32" r="8" fill="#9333ea" stroke="#581c87" strokeWidth="2.5" />
          {/* Big Bounding Tail */}
          <path d="M 20 40 Q 6 48 10 60" stroke="#0f172a" strokeWidth="4" fill="none" />
          {/* Legs */}
          <rect x={28 + legOffset1} y="50" width="8" height="18" rx="3" fill="#64748b" stroke="#0f172a" strokeWidth="2" />
          <rect x={42 + legOffset2} y="50" width="8" height="18" rx="3" fill="#64748b" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    case 'enemy_zombie_alien_bore':
      return (
        <svg width="88" height="75" viewBox="0 0 88 75" className="drop-shadow-xl">
          {/* Star Alien Star on Forehead */}
          <polygon points="62,10 65,16 72,16 67,20 69,26 62,22 55,26 57,20 52,16 59,16" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
          {/* Bore Body (Cyan-Zombie hybrid) */}
          <ellipse cx="44" cy="40" rx="32" ry="22" fill="#0d9488" stroke="#042f2e" strokeWidth="3" />
          {/* Sharp Tusks */}
          <polygon points="68,44 82,32 74,48" fill="#f8fafc" stroke="#042f2e" strokeWidth="2" />
          {/* Spiky Spine */}
          <polygon points="22,22 28,14 34,22" fill="#a855f7" stroke="#042f2e" strokeWidth="2" />
          <polygon points="36,20 42,12 48,20" fill="#a855f7" stroke="#042f2e" strokeWidth="2" />
          {/* Evil Star Eye */}
          <circle cx="62" cy="30" r="4" fill="#ef4444" />
          {/* Stomping Hooves */}
          <rect x={24 + legOffset1} y="56" width="9" height="15" rx="3" fill="#042f2e" />
          <rect x={54 + legOffset2} y="56" width="9" height="15" rx="3" fill="#042f2e" />
        </svg>
      );

    // =========================================================================
    // ADVENT DROPS & CYCLONES & LEGEND BOSSES
    // =========================================================================
    case 'cat_clionel_drop':
      return (
        <svg width="60" height="60" viewBox="0 0 60 60" className="drop-shadow-md">
          {/* Angel Wings */}
          <path d="M 12 24 Q 4 14 18 10 Q 22 18 20 28" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.5" />
          <path d="M 48 24 Q 56 14 42 10 Q 38 18 40 28" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.5" />
          {/* Golden Halo */}
          <ellipse cx="30" cy="10" rx="14" ry="4" fill="none" stroke="#facc15" strokeWidth="3" />
          {/* Holy Scales */}
          <line x1="30" y1="20" x2="30" y2="34" stroke="#ca8a04" strokeWidth="2" />
          <line x1="20" y1="26" x2="40" y2="26" stroke="#ca8a04" strokeWidth="2" />
          {/* Cat Head */}
          <circle cx="30" cy="38" r="14" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <polygon points="20,28 24,20 28,26" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <polygon points="40,28 36,20 32,26" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <circle cx="25" cy="36" r="1.5" fill="#0f172a" />
          <circle cx="35" cy="36" r="1.5" fill="#0f172a" />
          <ellipse cx="30" cy="40" rx="2" ry="1.5" fill="#f43f5e" />
          {/* Legs */}
          <rect x={24 + legOffset1} y="50" width="4" height="8" rx="2" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
          <rect x={32 + legOffset2} y="50" width="4" height="8" rx="2" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
        </svg>
      );

    case 'cat_clionel_evolved':
      return (
        <svg width="70" height="70" viewBox="0 0 70 70" className="drop-shadow-xl">
          {/* Radiant Halo */}
          <circle cx="35" cy="12" r="12" fill="none" stroke="#fde047" strokeWidth="3.5" className="animate-pulse" />
          {/* Glorious Seraph Wings */}
          <path d="M 8 28 Q 0 8 24 6 Q 28 20 22 36" fill="#bae6fd" stroke="#0284c7" strokeWidth="2" />
          <path d="M 62 28 Q 70 8 46 6 Q 42 20 48 36" fill="#bae6fd" stroke="#0284c7" strokeWidth="2" />
          {/* Archangel Robe & Body */}
          <path d="M 22 32 L 48 32 L 52 58 L 18 58 Z" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          {/* Archangel Cat Head */}
          <circle cx="35" cy="30" r="13" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <polygon points="25,20 28,12 33,18" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <polygon points="45,20 42,12 37,18" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <circle cx="30" cy="28" r="2" fill="#38bdf8" />
          <circle cx="40" cy="28" r="2" fill="#38bdf8" />
          {/* Staff of Judgement */}
          <line x1={isAttacking ? 58 : 50} y1="10" x2={isAttacking ? 58 : 50} y2="58" stroke="#ca8a04" strokeWidth="3" />
          <polygon points={isAttacking ? "58,4 52,10 64,10" : "50,4 44,10 56,10"} fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
        </svg>
      );

    case 'cat_hannya_drop':
      return (
        <svg width="60" height="60" viewBox="0 0 60 60" className="drop-shadow-md">
          {/* Buddhist Monk Beads */}
          <ellipse cx="30" cy="38" rx="14" ry="12" fill="none" stroke="#78350f" strokeWidth="3" strokeDasharray="3,3" />
          {/* Monk Robe */}
          <path d="M 20 34 L 40 34 L 44 54 L 16 54 Z" fill="#ea580c" stroke="#7c2d12" strokeWidth="2" />
          {/* Cat Head with Red Bead Necklace */}
          <circle cx="30" cy="26" r="13" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <polygon points="20,16 24,8 29,14" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <polygon points="40,16 36,8 31,14" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <circle cx="26" cy="24" r="1.5" fill="#0f172a" />
          <circle cx="34" cy="24" r="1.5" fill="#0f172a" />
          {/* Tin Staff */}
          <line x1="46" y1="12" x2="46" y2="54" stroke="#d97706" strokeWidth="2.5" />
          <circle cx="46" cy="12" r="5" fill="none" stroke="#d97706" strokeWidth="2" />
        </svg>
      );

    case 'cat_hannya_evolved':
      return (
        <svg width="72" height="72" viewBox="0 0 72 72" className="drop-shadow-xl">
          {/* Crimson Hellfire Aura */}
          <ellipse cx="36" cy="36" rx="30" ry="28" fill="#fecaca" opacity="0.3" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,4" className="animate-spin" />
          {/* Ferocious Hannya Mask on Head */}
          <path d="M 22 14 L 50 14 Q 56 30 50 48 Q 36 56 22 48 Q 16 30 22 14 Z" fill="#b91c1c" stroke="#450a0a" strokeWidth="2.5" />
          {/* Golden Horns */}
          <polygon points="20,18 10,6 26,12" fill="#facc15" stroke="#78350f" strokeWidth="2" />
          <polygon points="52,18 62,6 46,12" fill="#facc15" stroke="#78350f" strokeWidth="2" />
          {/* Fierce Eyes */}
          <polygon points="24,28 32,26 28,32" fill="#facc15" />
          <polygon points="48,28 40,26 44,32" fill="#facc15" />
          {/* Fangs */}
          <polygon points="28,42 32,46 36,42" fill="#ffffff" />
          <polygon points="36,42 40,46 44,42" fill="#ffffff" />
          {/* Flaming Monk Staff */}
          <line x1={isAttacking ? 62 : 54} y1="6" x2={isAttacking ? 62 : 54} y2="64" stroke="#b45309" strokeWidth="4" />
          <polygon points={isAttacking ? "62,2 56,12 68,12" : "54,2 48,12 60,12"} fill="#ef4444" stroke="#991b1b" strokeWidth="2" />
        </svg>
      );

    case 'cat_cyclone_drop':
      return (
        <svg width="60" height="60" viewBox="0 0 60 60" className="drop-shadow-md">
          {/* Rugby Helmet */}
          <circle cx="30" cy="26" r="14" fill="#dc2626" stroke="#991b1b" strokeWidth="2" />
          <polygon points="20,16 23,8 27,15" fill="#dc2626" stroke="#991b1b" strokeWidth="2" />
          <polygon points="40,16 37,8 33,15" fill="#dc2626" stroke="#991b1b" strokeWidth="2" />
          {/* Face Visor */}
          <rect x="22" y="24" width="16" height="8" rx="2" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
          <circle cx="26" cy="28" r="1.5" fill="#0f172a" />
          <circle cx="34" cy="28" r="1.5" fill="#0f172a" />
          {/* Rugby Ball */}
          <ellipse cx={isAttacking ? 44 : 38} cy="38" rx="9" ry="6" transform="rotate(-30 38 38)" fill="#78350f" stroke="#451a03" strokeWidth="2" />
          {/* Legs Sprinting */}
          <rect x={18 + legOffset1} y="44" width="6" height="12" rx="3" fill="#dc2626" stroke="#0f172a" strokeWidth="1.5" />
          <rect x={36 + legOffset2} y="44" width="6" height="12" rx="3" fill="#dc2626" stroke="#0f172a" strokeWidth="1.5" />
        </svg>
      );

    case 'cat_cyclone_evolved':
      return (
        <svg width="75" height="75" viewBox="0 0 75 75" className="drop-shadow-xl">
          {/* Hurricane Whirlpool Blades */}
          <circle cx="37" cy="37" rx="32" ry="32" fill="none" stroke="#38bdf8" strokeWidth="4" strokeDasharray="12,6" className="animate-spin" />
          <path d="M 37 10 Q 55 20 50 37 Q 45 55 37 64 Q 20 50 24 37 Q 28 20 37 10 Z" fill="#bae6fd" opacity="0.7" />
          {/* Rotating Razor Vacuum Waves */}
          <polygon points="37,4 44,22 30,22" fill="#0284c7" />
          <polygon points="70,37 52,44 52,30" fill="#0284c7" />
          <polygon points="37,70 30,52 44,52" fill="#0284c7" />
          <polygon points="4,37 22,30 22,44" fill="#0284c7" />
          {/* Cyclone Cat Core Face */}
          <circle cx="37" cy="37" r="13" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="33" cy="35" r="2" fill="#0f172a" />
          <circle cx="41" cy="35" r="2" fill="#0f172a" />
          <ellipse cx="37" cy="39" rx="2" ry="1.5" fill="#f43f5e" />
        </svg>
      );

    // =========================================================================
    // ADVENT BOSS CYCLONES (ホワイト・レッド・ブラック・スペース・アンデッド)
    // =========================================================================
    case 'enemy_white_cyclone':
      return (
        <svg width="110" height="110" viewBox="0 0 110 110" className="drop-shadow-2xl">
          {/* Outer White/Silver Raging Gale */}
          <circle cx="55" cy="55" r="50" fill="none" stroke="#e2e8f0" strokeWidth="6" strokeDasharray="16,8" className="animate-spin" />
          {/* Razor Whirl Blades */}
          <path d="M 55 12 Q 80 25 75 55 Q 70 85 55 98 Q 30 85 35 55 Q 40 25 55 12 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="3" />
          <path d="M 12 55 Q 25 30 55 35 Q 85 40 98 55 Q 85 80 55 75 Q 25 70 12 55 Z" fill="#cbd5e1" opacity="0.8" />
          {/* Terrifying Cyclone Core Face */}
          <circle cx="55" cy="55" r="26" fill="#e2e8f0" stroke="#475569" strokeWidth="4" />
          {/* Sharp White Gale Eyes */}
          <circle cx="45" cy="48" r="5" fill="#38bdf8" />
          <circle cx="65" cy="48" r="5" fill="#38bdf8" />
          <circle cx="45" cy="48" r="2.5" fill="#0f172a" />
          <circle cx="65" cy="48" r="2.5" fill="#0f172a" />
          {/* Gnashing Whirlpool Maw */}
          <polygon points="40,64 45,72 50,64" fill="#0f172a" />
          <polygon points="50,64 55,72 60,64" fill="#0f172a" />
          <polygon points="60,64 65,72 70,64" fill="#0f172a" />
          {isAttacking && (
            <ellipse cx="55" cy="55" rx="52" ry="52" fill="none" stroke="#e2e8f0" strokeWidth="8" className="animate-ping" />
          )}
        </svg>
      );

    case 'enemy_red_cyclone':
      return (
        <svg width="110" height="110" viewBox="0 0 110 110" className="drop-shadow-2xl">
          {/* Outer Crimson Raging Gale */}
          <circle cx="55" cy="55" r="50" fill="none" stroke="#ef4444" strokeWidth="6" strokeDasharray="16,8" className="animate-spin" />
          {/* Razor Whirl Blades */}
          <path d="M 55 12 Q 80 25 75 55 Q 70 85 55 98 Q 30 85 35 55 Q 40 25 55 12 Z" fill="#991b1b" stroke="#450a0a" strokeWidth="3" />
          <path d="M 12 55 Q 25 30 55 35 Q 85 40 98 55 Q 85 80 55 75 Q 25 70 12 55 Z" fill="#dc2626" opacity="0.8" />
          {/* Terrifying Cyclone Core Face */}
          <circle cx="55" cy="55" r="26" fill="#7f1d1d" stroke="#450a0a" strokeWidth="4" />
          {/* Piercing Red Eyes */}
          <circle cx="45" cy="48" r="5" fill="#fef08a" />
          <circle cx="65" cy="48" r="5" fill="#fef08a" />
          <circle cx="45" cy="48" r="2.5" fill="#000000" />
          <circle cx="65" cy="48" r="2.5" fill="#000000" />
          {/* Gnashing Whirlpool Maw */}
          <polygon points="40,64 45,72 50,64" fill="#ffffff" />
          <polygon points="50,64 55,72 60,64" fill="#ffffff" />
          <polygon points="60,64 65,72 70,64" fill="#ffffff" />
          {isAttacking && (
            <ellipse cx="55" cy="55" rx="52" ry="52" fill="none" stroke="#f87171" strokeWidth="8" className="animate-ping" />
          )}
        </svg>
      );

    case 'enemy_black_cyclone':
      return (
        <svg width="110" height="110" viewBox="0 0 110 110" className="drop-shadow-2xl">
          {/* Dark Purple Vortex */}
          <circle cx="55" cy="55" r="50" fill="none" stroke="#581c87" strokeWidth="6" strokeDasharray="16,8" className="animate-spin" />
          <path d="M 55 12 Q 80 25 75 55 Q 70 85 55 98 Q 30 85 35 55 Q 40 25 55 12 Z" fill="#18181b" stroke="#09090b" strokeWidth="3" />
          <path d="M 12 55 Q 25 30 55 35 Q 85 40 98 55 Q 85 80 55 75 Q 25 70 12 55 Z" fill="#3f3f46" opacity="0.8" />
          {/* Core Face */}
          <circle cx="55" cy="55" r="26" fill="#09090b" stroke="#a855f7" strokeWidth="4" />
          <circle cx="45" cy="48" r="5" fill="#c084fc" />
          <circle cx="65" cy="48" r="5" fill="#c084fc" />
          <circle cx="45" cy="48" r="2" fill="#ffffff" />
          <circle cx="65" cy="48" r="2" fill="#ffffff" />
          <polygon points="40,64 45,72 50,64" fill="#e4e4e7" />
          <polygon points="50,64 55,72 60,64" fill="#e4e4e7" />
          <polygon points="60,64 65,72 70,64" fill="#e4e4e7" />
        </svg>
      );

    case 'enemy_alien_cyclone':
      return (
        <svg width="110" height="110" viewBox="0 0 110 110" className="drop-shadow-2xl">
          {/* Cyan Alien Orbit Barrier */}
          <circle cx="55" cy="55" r="50" fill="none" stroke="#0284c7" strokeWidth="6" strokeDasharray="16,8" className="animate-spin" />
          <path d="M 55 12 Q 80 25 75 55 Q 70 85 55 98 Q 30 85 35 55 Q 40 25 55 12 Z" fill="#0369a1" stroke="#082f49" strokeWidth="3" />
          <path d="M 12 55 Q 25 30 55 35 Q 85 40 98 55 Q 85 80 55 75 Q 25 70 12 55 Z" fill="#38bdf8" opacity="0.7" />
          {/* Core Face with Star Forehead */}
          <circle cx="55" cy="55" r="26" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="4" />
          <polygon points="55,34 57,39 62,39 58,42 60,47 55,44 50,47 52,42 48,39 53,39" fill="#facc15" />
          <circle cx="45" cy="50" r="4.5" fill="#38bdf8" />
          <circle cx="65" cy="50" r="4.5" fill="#38bdf8" />
          <circle cx="45" cy="50" r="2" fill="#ffffff" />
          <circle cx="65" cy="50" r="2" fill="#ffffff" />
        </svg>
      );

    case 'enemy_zombie_cyclone':
      return (
        <svg width="110" height="110" viewBox="0 0 110 110" className="drop-shadow-2xl">
          {/* Necrotic Green/Purple Miasma */}
          <circle cx="55" cy="55" r="50" fill="none" stroke="#9333ea" strokeWidth="6" strokeDasharray="16,8" className="animate-spin" />
          <path d="M 55 12 Q 80 25 75 55 Q 70 85 55 98 Q 30 85 35 55 Q 40 25 55 12 Z" fill="#475569" stroke="#0f172a" strokeWidth="3" />
          <path d="M 12 55 Q 25 30 55 35 Q 85 40 98 55 Q 85 80 55 75 Q 25 70 12 55 Z" fill="#65a30d" opacity="0.8" />
          {/* Skull Core Face */}
          <circle cx="55" cy="55" r="26" fill="#1e293b" stroke="#a855f7" strokeWidth="4" />
          {/* Red Glowing Dead Eyes */}
          <circle cx="45" cy="48" r="5" fill="#ef4444" />
          <circle cx="65" cy="48" r="5" fill="#ef4444" />
          <circle cx="45" cy="48" r="2" fill="#000000" />
          <circle cx="65" cy="48" r="2" fill="#000000" />
          {/* Skeletal Teeth */}
          <rect x="42" y="62" width="6" height="8" rx="1" fill="#f8fafc" stroke="#0f172a" />
          <rect x="52" y="62" width="6" height="8" rx="1" fill="#f8fafc" stroke="#0f172a" />
          <rect x="62" y="62" width="6" height="8" rx="1" fill="#f8fafc" stroke="#0f172a" />
        </svg>
      );

    case 'enemy_relic_ape':
      return (
        <svg width="85" height="85" viewBox="0 0 85 85" className="drop-shadow-xl">
          {/* Ancient Relic Armor Plates */}
          <ellipse cx="42" cy="48" rx="26" ry="22" fill="#78350f" stroke="#451a03" strokeWidth="3" />
          {/* Mandrill Blue and Red Face */}
          <circle cx="42" cy="28" r="18" fill="#1e3a8a" stroke="#0f172a" strokeWidth="2.5" />
          <ellipse cx="42" cy="28" rx="6" ry="12" fill="#dc2626" />
          <circle cx="34" cy="24" r="3" fill="#facc15" />
          <circle cx="50" cy="24" r="3" fill="#facc15" />
          <circle cx="34" cy="24" r="1.5" fill="#000000" />
          <circle cx="50" cy="24" r="1.5" fill="#000000" />
          {/* Fangs */}
          <polygon points="36,36 40,44 44,36" fill="#ffffff" />
          {/* Arms Banging Ground */}
          <rect x={12 + legOffset1} y="38" width="10" height="28" rx="4" fill="#451a03" />
          <rect x={62 + legOffset2} y="38" width="10" height="28" rx="4" fill="#451a03" />
        </svg>
      );

    case 'enemy_cosmic_dragon':
      return (
        <svg width="100" height="90" viewBox="0 0 100 90" className="drop-shadow-2xl">
          {/* Cosmic Dragon Wings */}
          <path d="M 20 40 Q 2 10 38 6 Q 44 26 36 48" fill="#312e81" stroke="#6366f1" strokeWidth="2.5" />
          <path d="M 70 40 Q 88 10 52 6 Q 46 26 54 48" fill="#312e81" stroke="#6366f1" strokeWidth="2.5" />
          {/* Dragon Body */}
          <ellipse cx="45" cy="50" rx="24" ry="18" fill="#1e1b4b" stroke="#818cf8" strokeWidth="3" />
          {/* Dragon Head with Horns */}
          <polygon points="32,24 24,10 38,18" fill="#c084fc" stroke="#6b21a8" strokeWidth="2" />
          <polygon points="58,24 66,10 52,18" fill="#c084fc" stroke="#6b21a8" strokeWidth="2" />
          <circle cx="45" cy="30" r="14" fill="#312e81" stroke="#818cf8" strokeWidth="2" />
          <circle cx="40" cy="28" r="3" fill="#38bdf8" />
          <circle cx="50" cy="28" r="3" fill="#38bdf8" />
          {/* Tail */}
          <path d="M 68 52 Q 88 60 92 78" stroke="#6366f1" strokeWidth="5" fill="none" />
        </svg>
      );

    case 'enemy_angel_sun':
      return (
        <svg width="95" height="95" viewBox="0 0 95 95" className="drop-shadow-2xl">
          {/* Blazing Sun Rays */}
          <circle cx="47" cy="47" r="38" fill="none" stroke="#facc15" strokeWidth="4" strokeDasharray="10,6" className="animate-spin" />
          {/* Golden Sun Core */}
          <circle cx="47" cy="47" r="28" fill="#fbbf24" stroke="#b45309" strokeWidth="3.5" />
          {/* Seraphim Feathers */}
          <polygon points="47,4 53,18 41,18" fill="#fef08a" />
          <polygon points="90,47 76,53 76,41" fill="#fef08a" />
          <polygon points="47,90 41,76 53,76" fill="#fef08a" />
          <polygon points="4,47 18,41 18,53" fill="#fef08a" />
          {/* Benevolent Divine Face */}
          <circle cx="40" cy="44" r="3.5" fill="#78350f" />
          <circle cx="54" cy="44" r="3.5" fill="#78350f" />
          <path d="M 42 54 Q 47 58 52 54" stroke="#78350f" strokeWidth="2" fill="none" />
        </svg>
      );

    // =========================================================================
    // CRAZED CATS (狂乱のキモネコ・狂乱のトリ・狂乱のフィッシュ 等)
    // =========================================================================
    case 'cat_crazed_gross':
    case 'cat_crazed_macholegs':
      return (
        <svg width="64" height="96" viewBox="0 0 64 96" className="drop-shadow-2xl">
          {/* Crazed Dark Aura */}
          <ellipse cx="32" cy="48" rx="28" ry="44" fill="#581c87" opacity="0.25" className="animate-pulse" />
          {/* Cat Head on top with crazed dark eyes */}
          <polygon points="20,16 24,6 30,14" fill="#18181b" stroke="#a855f7" strokeWidth="2" />
          <polygon points="34,14 40,6 44,16" fill="#18181b" stroke="#a855f7" strokeWidth="2" />
          <ellipse cx="32" cy="22" rx="14" ry="13" fill="#18181b" stroke="#a855f7" strokeWidth="2.5" />
          {/* Glowing Red Eyes */}
          <ellipse cx="27" cy="20" rx="2.5" ry="3" fill="#ef4444" />
          <ellipse cx="37" cy="20" rx="2.5" ry="3" fill="#ef4444" />
          {/* Muscular Dark Legs */}
          <path
            d={`M 24 34 Q ${20 + (isAttacking ? 35 : legOffset1)} 60 22 88`}
            fill="none"
            stroke="#18181b"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d={`M 24 34 Q ${20 + (isAttacking ? 35 : legOffset1)} 60 22 88`}
            fill="none"
            stroke="#a855f7"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d={`M 40 34 Q ${44 + legOffset2} 60 42 88`}
            fill="none"
            stroke="#18181b"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d={`M 40 34 Q ${44 + legOffset2} 60 42 88`}
            fill="none"
            stroke="#a855f7"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Shockwave burst on attack */}
          {isAttacking && (
            <ellipse cx="22" cy="90" rx="16" ry="6" fill="#a855f7" opacity="0.8" className="animate-ping" />
          )}
        </svg>
      );

    case 'cat_crazed_bird':
    case 'cat_crazed_ufo':
      const isCrazedUfo = type === 'cat_crazed_ufo';
      return (
        <svg width="70" height="70" viewBox="0 0 70 70" className="drop-shadow-2xl">
          {isCrazedUfo ? (
            <>
              {/* Dark UFO Saucer */}
              <ellipse cx="35" cy="42" rx="30" ry="11" fill="#18181b" stroke="#dc2626" strokeWidth="2.5" />
              <ellipse cx="35" cy="40" rx="24" ry="7" fill="#7f1d1d" />
              {/* Glass dome with Red Glowing Cat head inside */}
              <path d="M 21 38 A 14 14 0 0 1 49 38 Z" fill="#991b1b" fillOpacity="0.7" stroke="#dc2626" strokeWidth="2" />
              <circle cx="35" cy="32" r="8" fill="#18181b" stroke="#dc2626" strokeWidth="1.5" />
              <ellipse cx="33" cy="30" rx="1.5" ry="2" fill="#ef4444" />
              <ellipse cx="37" cy="30" rx="1.5" ry="2" fill="#ef4444" />
              {/* Laser lights */}
              <circle cx="18" cy="44" r="2.5" fill="#ef4444" className="animate-ping" />
              <circle cx="35" cy="46" r="2.5" fill="#ef4444" className="animate-ping" />
              <circle cx="52" cy="44" r="2.5" fill="#ef4444" className="animate-ping" />
            </>
          ) : (
            <>
              {/* Dark Flapping Wings */}
              <path d={`M 14 26 Q 4 ${12 + walkCycle * 8} 18 16`} fill="#18181b" stroke="#dc2626" strokeWidth="2" />
              <path d={`M 56 26 Q 66 ${12 + walkCycle * 8} 52 16`} fill="#18181b" stroke="#dc2626" strokeWidth="2" />
              {/* Crazed Bird Head */}
              <polygon points="22,16 25,6 32,14" fill="#18181b" stroke="#dc2626" strokeWidth="2" />
              <polygon points="36,14 43,6 46,16" fill="#18181b" stroke="#dc2626" strokeWidth="2" />
              <ellipse cx="34" cy="28" rx="18" ry="16" fill="#18181b" stroke="#dc2626" strokeWidth="2.5" />
              <polygon points="28,26 46,30 28,34" fill="#dc2626" stroke="#7f1d1d" strokeWidth="2" />
              <ellipse cx="28" cy="24" rx="2.5" ry="3" fill="#ef4444" />
            </>
          )}
        </svg>
      );

    case 'cat_crazed_fish':
    case 'cat_crazed_whale':
      const isCrazedWhale = type === 'cat_crazed_whale';
      return (
        <svg width="78" height="66" viewBox="0 0 78 66" className="drop-shadow-2xl">
          {/* Crazed Fish / Whale Body */}
          <path
            d="M 12 34 Q 30 14 60 28 Q 68 32 62 44 Q 30 56 12 34 Z"
            fill={isCrazedWhale ? "#09090b" : "#18181b"}
            stroke="#ef4444"
            strokeWidth="3"
          />
          {/* Tail fin */}
          <polygon points="12,34 2,22 4,46" fill="#18181b" stroke="#ef4444" strokeWidth="2" />
          {/* Red Glowing Eye & Bloodthirsty Fangs */}
          <circle cx="52" cy="29" r="3.5" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1" />
          <circle cx="52" cy="29" r="1.5" fill="#ffffff" />
          <path d="M 42 38 L 46 32 L 50 38 L 54 32 L 58 38 L 62 32" fill="none" stroke="#ef4444" strokeWidth="2.5" />
          {/* Legs */}
          <ellipse cx={28 + legOffset1} cy="52" rx="4" ry="4" fill="#18181b" stroke="#ef4444" strokeWidth="2" />
          <ellipse cx={44 + legOffset2} cy="52" rx="4" ry="4" fill="#18181b" stroke="#ef4444" strokeWidth="2" />
        </svg>
      );

    // =========================================================================
    // NEW CAT: ネコエンシェント / 古代神ネコ / 覚醒古代神ネコ・ゼウス
    // =========================================================================
    case 'cat_ancient_cyclone_drop':
    case 'cat_ancient_cyclone_evolved':
      const isEvolvedAncient = type === 'cat_ancient_cyclone_evolved';
      return (
        <svg width="84" height="84" viewBox="0 0 84 84" className="drop-shadow-2xl">
          {/* Primordial Jade & Amber Rotating Halo */}
          <circle cx="42" cy="42" r="36" fill="none" stroke="#10b981" strokeWidth="3.5" strokeDasharray="10,6" className="animate-spin" />
          {isEvolvedAncient && (
            <circle cx="42" cy="42" r="40" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6,4" className="animate-spin" />
          )}
          {/* Ancient Fossil Relic Board */}
          <rect x="22" y="32" width="40" height="42" rx="6" fill="#78350f" stroke="#d97706" strokeWidth="2.5" />
          <path d="M 32 40 L 52 40 M 32 48 L 52 48 M 32 56 L 46 56" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          {/* Cat Deity Face */}
          <ellipse cx="42" cy="24" rx="16" ry="15" fill="#fef3c7" stroke="#b45309" strokeWidth="2.5" />
          <polygon points="30,16 34,4 40,14" fill="#fef3c7" stroke="#b45309" strokeWidth="2" />
          <polygon points="44,14 50,4 54,16" fill="#fef3c7" stroke="#b45309" strokeWidth="2" />
          {/* Third Eye Jade Crystal */}
          <polygon points="42,14 45,18 42,22 39,18" fill="#10b981" stroke="#047857" strokeWidth="1.5" />
          <ellipse cx="36" cy="24" rx="2" ry="2.5" fill="#047857" />
          <ellipse cx="48" cy="24" rx="2" ry="2.5" fill="#047857" />
          {/* Critical Ancient Blast on Attack */}
          {isAttacking && (
            <g className="animate-ping">
              <polygon points="42,0 54,22 42,30 58,54 30,46 42,0" fill="#10b981" fillOpacity="0.8" />
            </g>
          )}
        </svg>
      );

    // =========================================================================
    // BUFFED BOSS & ANCIENT ENEMIES (古代種レジェンドブンブン・エンシェントサイクロン・古代リス等)
    // =========================================================================
    case 'enemy_legend_bunbun':
      return (
        <svg width="130" height="130" viewBox="0 0 130 130" className="drop-shadow-2xl">
          {/* Primordial Ancient Relic Aura & Whirlwinds */}
          <g className="animate-spin" style={{ transformOrigin: '65px 65px' }}>
            <circle cx="65" cy="65" r="58" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="14,8" />
            <circle cx="65" cy="65" r="50" fill="none" stroke="#d97706" strokeWidth="3" strokeDasharray="10,6" />
          </g>
          {/* Giant Ancient Bun Bun Wings */}
          <path d="M 30 36 Q 4 10 38 12 Q 52 30 42 50 Z" fill="#065f46" stroke="#047857" strokeWidth="3" />
          <path d="M 100 36 Q 126 10 92 12 Q 78 30 88 50 Z" fill="#065f46" stroke="#047857" strokeWidth="3" />
          {/* Muscular Ancient Body */}
          <ellipse cx="65" cy="68" rx="34" ry="38" fill="#064e3b" stroke="#10b981" strokeWidth="4" />
          {/* Ancient Glyphs & Armor Lines */}
          <path d="M 50 60 L 80 60 M 65 60 L 65 92 M 52 76 L 78 76" stroke="#34d399" strokeWidth="3" />
          {/* Head & Ancient Horns */}
          <circle cx="65" cy="40" r="22" fill="#047857" stroke="#10b981" strokeWidth="3" />
          <polygon points="50,28 42,6 56,20" fill="#f59e0b" stroke="#78350f" strokeWidth="2.5" />
          <polygon points="80,28 88,6 74,20" fill="#f59e0b" stroke="#78350f" strokeWidth="2.5" />
          {/* Glowing Relic Red Eyes */}
          <circle cx="56" cy="38" r="4.5" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1.5" />
          <circle cx="74" cy="38" r="4.5" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1.5" />
          {/* Blazing Rotating Fists (秒間5.5回の高速回転腕！) */}
          <g className="animate-spin" style={{ transformOrigin: '28px 75px' }}>
            <circle cx="28" cy="75" r="16" fill="#047857" stroke="#10b981" strokeWidth="3" />
            <polygon points="28,60 36,75 20,75" fill="#34d399" />
          </g>
          <g className="animate-spin" style={{ transformOrigin: '102px 75px' }}>
            <circle cx="102" cy="75" r="16" fill="#047857" stroke="#10b981" strokeWidth="3" />
            <polygon points="102,60 110,75 94,75" fill="#34d399" />
          </g>
          {/* 30% Critical / Wave Blast */}
          {isAttacking && (
            <g className="animate-ping">
              <circle cx="65" cy="65" r="54" fill="none" stroke="#ef4444" strokeWidth="6" />
              <polygon points="65,10 75,40 100,50 75,60 65,90 55,60 30,50 55,40" fill="#fef08a" opacity="0.9" />
            </g>
          )}
        </svg>
      );

    case 'enemy_ancient_cyclone':
      return (
        <svg width="125" height="125" viewBox="0 0 125 125" className="drop-shadow-2xl">
          {/* Primordial Emerald & Amber Storm Vortex */}
          <circle cx="62" cy="62" r="56" fill="none" stroke="#10b981" strokeWidth="7" strokeDasharray="18,8" className="animate-spin" />
          <circle cx="62" cy="62" r="48" fill="none" stroke="#f59e0b" strokeWidth="5" strokeDasharray="12,6" className="animate-spin" />
          {/* Ancient Whirl Razor Blades */}
          <path d="M 62 14 Q 92 28 86 62 Q 80 96 62 110 Q 34 96 40 62 Q 46 28 62 14 Z" fill="#065f46" stroke="#047857" strokeWidth="3.5" />
          <path d="M 14 62 Q 28 34 62 40 Q 96 46 110 62 Q 96 90 62 84 Q 28 78 14 62 Z" fill="#d97706" opacity="0.8" />
          {/* Ancient Cyclone Core */}
          <circle cx="62" cy="62" r="28" fill="#064e3b" stroke="#34d399" strokeWidth="4.5" />
          {/* Cursed All-Seeing Relic Eye */}
          <circle cx="52" cy="56" r="6" fill="#fde047" stroke="#78350f" strokeWidth="2" />
          <circle cx="72" cy="56" r="6" fill="#fde047" stroke="#78350f" strokeWidth="2" />
          <circle cx="52" cy="56" r="3" fill="#ef4444" />
          <circle cx="72" cy="56" r="3" fill="#ef4444" />
          {/* Razor Maw */}
          <polygon points="46,72 52,82 58,72" fill="#ffffff" />
          <polygon points="58,72 64,82 70,72" fill="#ffffff" />
          <polygon points="70,72 76,82 82,72" fill="#ffffff" />
          {/* Hyper-Speed Wind Rush on Attack */}
          {isAttacking && (
            <ellipse cx="62" cy="62" rx="60" ry="60" fill="none" stroke="#6ee7b7" strokeWidth="8" className="animate-ping" />
          )}
        </svg>
      );

    case 'enemy_ancient_squirrel':
    case 'enemy_ancient_relic_squirrel':
      return (
        <svg width="72" height="60" viewBox="0 0 72 60" className="drop-shadow-xl">
          {/* Ancient Relic Squirrel - Super Fast Sprint */}
          {/* Giant Fossil Tail */}
          <path d="M 52 38 Q 68 12 56 4 Q 44 8 48 26 Z" fill="#78350f" stroke="#10b981" strokeWidth="2.5" />
          {/* Body */}
          <ellipse cx="32" cy="34" rx="18" ry="14" fill="#047857" stroke="#10b981" strokeWidth="2.5" />
          {/* Head & Ears */}
          <circle cx="18" cy="24" r="10" fill="#047857" stroke="#10b981" strokeWidth="2" />
          <polygon points="16,16 12,6 20,12" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
          <polygon points="22,16 26,6 26,14" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
          {/* Piercing Red Eye */}
          <circle cx="15" cy="22" r="2.5" fill="#ef4444" />
          {/* Giant Acorn / Fossil Weapon */}
          <ellipse cx="12" cy="36" rx="5" ry="4" fill="#d97706" />
          {/* Speed Wind Streaks */}
          <line x1="44" y1="44" x2="68" y2="44" stroke="#34d399" strokeWidth="2" strokeDasharray="4,3" />
          <line x1="38" y1="48" x2="62" y2="48" stroke="#34d399" strokeWidth="2" strokeDasharray="4,3" />
          {/* Sprinting Legs */}
          <ellipse cx={24 + legOffset1 * 2} cy="48" rx="4" ry="6" fill="#047857" stroke="#10b981" strokeWidth="1.5" />
          <ellipse cx={40 + legOffset2 * 2} cy="48" rx="4" ry="6" fill="#047857" stroke="#10b981" strokeWidth="1.5" />
        </svg>
      );

    case 'enemy_ancient_doge':
      return (
        <svg width="68" height="60" viewBox="0 0 68 60" className="drop-shadow-lg">
          {/* Ancient Doge Body with Fossil Armor */}
          <ellipse cx="34" cy="34" rx="20" ry="15" fill="#065f46" stroke="#10b981" strokeWidth="2.5" />
          {/* Head & Ears */}
          <circle cx="20" cy="22" r="12" fill="#065f46" stroke="#10b981" strokeWidth="2.5" />
          <polygon points="12,14 8,4 18,10" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />
          <polygon points="24,14 28,4 28,12" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />
          {/* Cursed Eyes */}
          <ellipse cx="16" cy="20" rx="2" ry="3" fill="#ef4444" />
          <ellipse cx="24" cy="20" rx="2" ry="3" fill="#ef4444" />
          {/* Snout */}
          <ellipse cx="14" cy="26" rx="4" ry="3" fill="#047857" />
          <circle cx="12" cy="25" r="1.5" fill="#0f172a" />
          {/* Legs */}
          <ellipse cx={22 + legOffset1} cy="48" rx="4" ry="5" fill="#065f46" stroke="#10b981" strokeWidth="2" />
          <ellipse cx={42 + legOffset2} cy="48" rx="4" ry="5" fill="#065f46" stroke="#10b981" strokeWidth="2" />
        </svg>
      );

    case 'enemy_ancient_relic_otter':
      return (
        <svg width="84" height="74" viewBox="0 0 84 74" className="drop-shadow-xl">
          {/* Ancient Heavy Otter Body */}
          <ellipse cx="42" cy="42" rx="28" ry="20" fill="#78350f" stroke="#10b981" strokeWidth="3" />
          <circle cx="22" cy="30" r="14" fill="#78350f" stroke="#10b981" strokeWidth="2.5" />
          <circle cx="16" cy="26" r="3" fill="#ef4444" />
          {/* Huge Fossil Shell in Hands */}
          <ellipse cx={isAttacking ? 10 : 18} cy={isAttacking ? 36 : 46} rx="12" ry="10" fill="#fde047" stroke="#78350f" strokeWidth="2.5" />
          {/* Legs */}
          <ellipse cx={32 + legOffset1} cy="62" rx="6" ry="6" fill="#78350f" stroke="#10b981" strokeWidth="2" />
          <ellipse cx={56 + legOffset2} cy="62" rx="6" ry="6" fill="#78350f" stroke="#10b981" strokeWidth="2" />
        </svg>
      );

    case 'enemy_ancient_moth':
      return (
        <svg width="88" height="76" viewBox="0 0 88 76" className="drop-shadow-2xl">
          {/* Ancient Moth Wings with Amber Eyespots */}
          <ellipse cx="30" cy="34" rx="26" ry="20" fill="#065f46" stroke="#10b981" strokeWidth="2.5" transform={`rotate(${walkCycle * 8} 30 34)`} />
          <ellipse cx="58" cy="34" rx="26" ry="20" fill="#065f46" stroke="#10b981" strokeWidth="2.5" transform={`rotate(${-walkCycle * 8} 58 34)`} />
          <circle cx="26" cy="32" r="6" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
          <circle cx="62" cy="32" r="6" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
          {/* Moth Body */}
          <ellipse cx="44" cy="42" rx="8" ry="24" fill="#78350f" stroke="#10b981" strokeWidth="2.5" />
          <circle cx="44" cy="20" r="7" fill="#047857" stroke="#10b981" strokeWidth="2" />
          <circle cx="41" cy="19" r="2" fill="#ef4444" />
          <circle cx="47" cy="19" r="2" fill="#ef4444" />
          {/* Spore Powder on Attack */}
          {isAttacking && (
            <circle cx="44" cy="64" r="18" fill="#10b981" opacity="0.6" className="animate-ping" />
          )}
        </svg>
      );

    case 'enemy_ancient_gorilla':
      return (
        <svg width="84" height="80" viewBox="0 0 84 80" className="drop-shadow-2xl">
          {/* Ancient Muscular Gorilla */}
          <ellipse cx="42" cy="46" rx="28" ry="26" fill="#064e3b" stroke="#10b981" strokeWidth="3.5" />
          {/* Head & Ancient Crest */}
          <circle cx="42" cy="24" r="16" fill="#065f46" stroke="#10b981" strokeWidth="2.5" />
          <polygon points="36,10 42,2 48,10" fill="#d97706" stroke="#78350f" strokeWidth="2" />
          <ellipse cx="36" cy="22" rx="2.5" ry="3" fill="#ef4444" />
          <ellipse cx="48" cy="22" rx="2.5" ry="3" fill="#ef4444" />
          {/* Heavy Arm Slams */}
          <ellipse cx={18 + legOffset1} cy="56" rx="10" ry="16" fill="#047857" stroke="#10b981" strokeWidth="2.5" />
          <ellipse cx={66 + legOffset2} cy="56" rx="10" ry="16" fill="#047857" stroke="#10b981" strokeWidth="2.5" />
        </svg>
      );

    case 'enemy_ancient_sunfish':
      return (
        <svg width="120" height="110" viewBox="0 0 120 110" className="drop-shadow-2xl">
          {/* Primordial Giant Ocean Sunfish Body */}
          <ellipse cx="60" cy="55" rx="46" ry="38" fill="#064e3b" stroke="#10b981" strokeWidth="4" />
          {/* Top & Bottom Ancient Fin Blades */}
          <polygon points="54,18 64,0 74,18" fill="#d97706" stroke="#78350f" strokeWidth="2.5" />
          <polygon points="54,92 64,110 74,92" fill="#d97706" stroke="#78350f" strokeWidth="2.5" />
          {/* Glowing Ancient Relic Eye */}
          <circle cx="34" cy="46" r="8" fill="#fde047" stroke="#78350f" strokeWidth="2" />
          <circle cx="34" cy="46" r="4" fill="#ef4444" />
          {/* Laser Cannon on Attack */}
          {isAttacking && (
            <line x1="20" y1="55" x2="-80" y2="55" stroke="#10b981" strokeWidth="8" strokeLinecap="round" className="animate-ping" />
          )}
        </svg>
      );

    // ==========================================
    // 悪魔編（AKU REALM）新敵スプライト
    // ==========================================
    case 'enemy_aku_doge':
      return (
        <svg width="70" height="65" viewBox="0 0 70 65" className="drop-shadow-xl">
          {/* Aku Doge Body - Dark Obsidian */}
          <ellipse cx="35" cy="38" rx="22" ry="16" fill="#1e1b4b" stroke="#7c3aed" strokeWidth="2.5" />
          {/* Aku Horns */}
          <path d="M 22 18 Q 14 6 12 2 Q 18 10 24 16 Z" fill="#9333ea" stroke="#c084fc" strokeWidth="1.5" />
          <path d="M 32 18 Q 38 6 42 2 Q 36 10 30 16 Z" fill="#9333ea" stroke="#c084fc" strokeWidth="1.5" />
          {/* Head */}
          <circle cx="24" cy="26" r="14" fill="#1e1b4b" stroke="#7c3aed" strokeWidth="2.5" />
          {/* Glowing Red Devil Eyes */}
          <ellipse cx="18" cy="24" rx="2.5" ry="3.5" fill="#ef4444" />
          <ellipse cx="26" cy="24" rx="2.5" ry="3.5" fill="#ef4444" />
          {/* Snout */}
          <ellipse cx="14" cy="30" rx="4" ry="3" fill="#312e81" />
          <polygon points="12,29 16,29 14,32" fill="#ef4444" />
          {/* Legs */}
          <ellipse cx={22 + legOffset1} cy="52" rx="5" ry="6" fill="#1e1b4b" stroke="#7c3aed" strokeWidth="2" />
          <ellipse cx={44 + legOffset2} cy="52" rx="5" ry="6" fill="#1e1b4b" stroke="#7c3aed" strokeWidth="2" />
        </svg>
      );

    case 'enemy_aku_squirrel':
      return (
        <svg width="80" height="60" viewBox="0 0 80 60" className="drop-shadow-2xl">
          {/* Speed Distortion Trail */}
          <path d="M 50 36 Q 74 12 60 2 Q 46 6 50 24 Z" fill="#581c87" stroke="#a855f7" strokeWidth="2.5" />
          <line x1="48" y1="42" x2="80" y2="42" stroke="#c084fc" strokeWidth="3" strokeDasharray="6,4" />
          <line x1="42" y1="48" x2="76" y2="48" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="4,4" />
          {/* Aku Body */}
          <ellipse cx="32" cy="34" rx="18" ry="13" fill="#1e1b4b" stroke="#a855f7" strokeWidth="2.5" />
          {/* Devil Horns */}
          <polygon points="14,14 10,2 18,10" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
          <polygon points="22,14 26,2 26,12" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
          {/* Head & Red Eye */}
          <circle cx="18" cy="24" r="10" fill="#1e1b4b" stroke="#a855f7" strokeWidth="2" />
          <circle cx="14" cy="22" r="3" fill="#ef4444" className="animate-pulse" />
          {/* Sprinting Legs */}
          <ellipse cx={22 + legOffset1 * 2.5} cy="46" rx="4" ry="6" fill="#1e1b4b" stroke="#a855f7" strokeWidth="2" />
          <ellipse cx={40 + legOffset2 * 2.5} cy="46" rx="4" ry="6" fill="#1e1b4b" stroke="#a855f7" strokeWidth="2" />
        </svg>
      );

    case 'enemy_hell_gorilla':
      return (
        <svg width="95" height="90" viewBox="0 0 95 90" className="drop-shadow-2xl">
          {/* Flaming Crimson Savage Blow Aura (50% Chance) */}
          <circle cx="48" cy="48" r="42" fill="#dc2626" opacity={isAttacking ? 0.45 : 0.15} className="animate-pulse" />
          {/* Hell Gorilla Muscular Obsidian Torso */}
          <ellipse cx="48" cy="50" rx="32" ry="28" fill="#18181b" stroke="#dc2626" strokeWidth="4" />
          {/* Demon Horns */}
          <path d="M 32 20 Q 20 8 16 0 Q 26 8 36 18 Z" fill="#ef4444" stroke="#7f1d1d" strokeWidth="2" />
          <path d="M 64 20 Q 76 8 80 0 Q 70 8 60 18 Z" fill="#ef4444" stroke="#7f1d1d" strokeWidth="2" />
          {/* Gorilla Demon Head */}
          <circle cx="48" cy="28" r="18" fill="#18181b" stroke="#dc2626" strokeWidth="3" />
          {/* Burning Yellow/Red Eyes */}
          <circle cx="40" cy="26" r="4" fill="#fbbf24" stroke="#dc2626" strokeWidth="1.5" />
          <circle cx="56" cy="26" r="4" fill="#fbbf24" stroke="#dc2626" strokeWidth="1.5" />
          <circle cx="40" cy="26" r="2" fill="#ef4444" />
          <circle cx="56" cy="26" r="2" fill="#ef4444" />
          {/* Hellfire Fangs */}
          <polygon points="44,36 48,42 52,36" fill="#f8fafc" />
          {/* Giant Burning Fist Slams */}
          <g transform={`rotate(${isAttacking ? -35 : 0} 20 58)`}>
            <ellipse cx={20 + legOffset1} cy="60" rx="13" ry="18" fill="#991b1b" stroke="#ef4444" strokeWidth="3" />
            <circle cx="16" cy="70" r="5" fill="#f59e0b" />
          </g>
          <g transform={`rotate(${isAttacking ? 35 : 0} 76 58)`}>
            <ellipse cx={76 + legOffset2} cy="60" rx="13" ry="18" fill="#991b1b" stroke="#ef4444" strokeWidth="3" />
            <circle cx="80" cy="70" r="5" fill="#f59e0b" />
          </g>
        </svg>
      );

    case 'enemy_guilty_peng':
      return (
        <svg width="75" height="70" viewBox="0 0 75 70" className="drop-shadow-xl">
          {/* Aku Penguin Body */}
          <ellipse cx="38" cy="38" rx="22" ry="24" fill="#1e1b4b" stroke="#7c3aed" strokeWidth="3" />
          <ellipse cx="36" cy="40" rx="14" ry="16" fill="#f3e8ff" />
          {/* Head & Demon Beak */}
          <circle cx="34" cy="20" r="14" fill="#1e1b4b" stroke="#7c3aed" strokeWidth="2.5" />
          <polygon points="18,22 8,24 18,28" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1.5" />
          <circle cx="28" cy="18" r="3" fill="#ef4444" />
          {/* Demon Horn */}
          <polygon points="32,8 36,0 40,8" fill="#a855f7" />
          {/* Feet */}
          <ellipse cx={28 + legOffset1} cy="62" rx="6" ry="4" fill="#ef4444" />
          <ellipse cx={46 + legOffset2} cy="62" rx="6" ry="4" fill="#ef4444" />
        </svg>
      );

    case 'enemy_mamomo':
      return (
        <svg width="105" height="100" viewBox="0 0 105 100" className="drop-shadow-2xl">
          {/* Heavy Demon Gatekeeper Armored Body */}
          <ellipse cx="52" cy="55" rx="38" ry="34" fill="#311042" stroke="#a855f7" strokeWidth="4" />
          {/* Iron Horns */}
          <polygon points="30,24 18,6 38,18" fill="#7e22ce" stroke="#c084fc" strokeWidth="2" />
          <polygon points="74,24 86,6 66,18" fill="#7e22ce" stroke="#c084fc" strokeWidth="2" />
          {/* Face Plate */}
          <circle cx="52" cy="34" r="20" fill="#18181b" stroke="#a855f7" strokeWidth="3" />
          <circle cx="44" cy="32" r="4" fill="#ef4444" />
          <circle cx="60" cy="32" r="4" fill="#ef4444" />
          {/* Giant Spiked Demon Club */}
          <g transform={`rotate(${isAttacking ? 60 : -20} 80 50)`}>
            <rect x="74" y="20" width="12" height="60" rx="3" fill="#0f172a" stroke="#a855f7" strokeWidth="2" />
            <polygon points="70,30 64,32 70,36" fill="#ef4444" />
            <polygon points="90,30 96,32 90,36" fill="#ef4444" />
            <polygon points="70,45 64,47 70,51" fill="#ef4444" />
          </g>
          <ellipse cx={36 + legOffset1} cy="88" rx="10" ry="8" fill="#18181b" stroke="#a855f7" strokeWidth="2" />
          <ellipse cx={68 + legOffset2} cy="88" rx="10" ry="8" fill="#18181b" stroke="#a855f7" strokeWidth="2" />
        </svg>
      );

    case 'enemy_sister_cassis':
      return (
        <svg width="90" height="95" viewBox="0 0 90 95" className="drop-shadow-2xl">
          {/* Black Nun Veil & Robe */}
          <path d="M 45 10 Q 15 35 20 85 L 70 85 Q 75 35 45 10 Z" fill="#0f172a" stroke="#9333ea" strokeWidth="3" />
          {/* White Habit Collar */}
          <ellipse cx="45" cy="40" rx="18" ry="8" fill="#f1f5f9" stroke="#9333ea" strokeWidth="2" />
          {/* Pale Cursed Face */}
          <circle cx="45" cy="30" r="14" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx="39" cy="28" rx="2.5" ry="3" fill="#7e22ce" />
          <ellipse cx="51" cy="28" rx="2.5" ry="3" fill="#7e22ce" />
          {/* Inverted Demon Rosary Cross */}
          <g transform={`rotate(${isAttacking ? 180 : 0} 45 65)`}>
            <line x1="45" y1="50" x2="45" y2="78" stroke="#ef4444" strokeWidth="3.5" />
            <line x1="34" y1="68" x2="56" y2="68" stroke="#ef4444" strokeWidth="3.5" />
          </g>
        </svg>
      );

    case 'enemy_midnight_nyandar':
      return (
        <svg width="120" height="110" viewBox="0 0 120 110" className="drop-shadow-2xl">
          {/* Demon Cat Noble Cape */}
          <path d="M 60 25 Q 10 60 25 95 L 95 95 Q 110 60 60 25 Z" fill="#4c0519" stroke="#be123c" strokeWidth="3.5" />
          {/* Vampire Demon Cat Body */}
          <ellipse cx="60" cy="58" rx="28" ry="24" fill="#18181b" stroke="#7c3aed" strokeWidth="3" />
          {/* Demon Bat Wings */}
          <path d="M 32 45 Q 8 20 2 38 Q 12 55 32 50 Z" fill="#581c87" stroke="#a855f7" strokeWidth="2" />
          <path d="M 88 45 Q 112 20 118 38 Q 108 55 88 50 Z" fill="#581c87" stroke="#a855f7" strokeWidth="2" />
          {/* Cat Noble Head */}
          <circle cx="60" cy="34" r="18" fill="#18181b" stroke="#7c3aed" strokeWidth="2.5" />
          <polygon points="46,20 40,6 52,14" fill="#be123c" />
          <polygon points="74,20 80,6 68,14" fill="#be123c" />
          <circle cx="52" cy="32" r="3.5" fill="#f43f5e" />
          <circle cx="68" cy="32" r="3.5" fill="#f43f5e" />
          {/* Magic Orb on Attack */}
          {isAttacking && (
            <circle cx="20" cy="40" r="14" fill="#be123c" opacity="0.8" className="animate-ping" />
          )}
        </svg>
      );

    case 'enemy_aku_cyclone':
      return (
        <svg width="135" height="135" viewBox="0 0 135 135" className="drop-shadow-2xl">
          {/* Chaos Spinning Dark Vortex */}
          <g transform={`rotate(${walkCycle * 70} 67 67)`}>
            <circle cx="67" cy="67" r="58" fill="#18181b" stroke="#7c3aed" strokeWidth="6" strokeDasharray="16,8" />
            <circle cx="67" cy="67" r="44" fill="#4c0519" stroke="#e11d48" strokeWidth="5" strokeDasharray="12,6" />
            <circle cx="67" cy="67" r="30" fill="#2e1065" stroke="#a855f7" strokeWidth="4" />
          </g>
          {/* Center Demon Core Eye & Fangs */}
          <circle cx="67" cy="67" r="18" fill="#000000" stroke="#f43f5e" strokeWidth="3" />
          <ellipse cx="67" cy="67" rx="8" ry="12" fill="#ef4444" />
          <circle cx="67" cy="67" r="4" fill="#fbbf24" />
          {/* Devil Horns extending outward */}
          <polygon points="50,18 42,2 58,10" fill="#9333ea" />
          <polygon points="85,18 93,2 77,10" fill="#9333ea" />
        </svg>
      );

    case 'enemy_demon_lord_jagi':
      return (
        <svg width="150" height="145" viewBox="0 0 150 145" className="drop-shadow-2xl">
          {/* Lord Jagi - Demon Throne Aura */}
          <circle cx="75" cy="72" r="68" fill="#581c87" opacity="0.35" className="animate-pulse" />
          {/* Massive Demonic Overlord Armor */}
          <ellipse cx="75" cy="80" rx="46" ry="40" fill="#09090b" stroke="#7c3aed" strokeWidth="5" />
          {/* Grand Demon Horns Crown */}
          <path d="M 40 35 Q 15 10 10 0 Q 30 15 50 30 Z" fill="#9333ea" stroke="#e879f9" strokeWidth="3" />
          <path d="M 110 35 Q 135 10 140 0 Q 120 15 100 30 Z" fill="#9333ea" stroke="#e879f9" strokeWidth="3" />
          {/* Skull Helm */}
          <circle cx="75" cy="45" r="26" fill="#18181b" stroke="#dc2626" strokeWidth="4" />
          {/* Piercing Demon Soul Eyes */}
          <circle cx="64" cy="42" r="6" fill="#ef4444" stroke="#fbbf24" strokeWidth="2" />
          <circle cx="86" cy="42" r="6" fill="#ef4444" stroke="#fbbf24" strokeWidth="2" />
          {/* Demonic Greatsword */}
          <g transform={`rotate(${isAttacking ? 50 : -25} 115 80)`}>
            <rect x="110" y="20" width="10" height="85" rx="3" fill="#be123c" stroke="#f43f5e" strokeWidth="3" />
            <polygon points="105,25 115,5 125,25" fill="#f59e0b" />
          </g>
          <ellipse cx={52 + legOffset1} cy="120" rx="14" ry="10" fill="#09090b" stroke="#7c3aed" strokeWidth="3" />
          <ellipse cx={98 + legOffset2} cy="120" rx="14" ry="10" fill="#09090b" stroke="#7c3aed" strokeWidth="3" />
        </svg>
      );

    case 'enemy_aku_koryu':
      return (
        <svg width="85" height="80" viewBox="0 0 85 80" className="drop-shadow-2xl">
          {/* Demon Koala Body */}
          <ellipse cx="42" cy="44" rx="28" ry="24" fill="#3b0764" stroke="#9333ea" strokeWidth="3" />
          {/* Giant Fluffy Demon Ears with Horns */}
          <circle cx="20" cy="22" r="14" fill="#581c87" stroke="#a855f7" strokeWidth="2" />
          <circle cx="64" cy="22" r="14" fill="#581c87" stroke="#a855f7" strokeWidth="2" />
          <polygon points="20,10 16,0 26,6" fill="#ef4444" />
          <polygon points="64,10 68,0 58,6" fill="#ef4444" />
          {/* Head & Demon Nose */}
          <circle cx="42" cy="30" r="18" fill="#3b0764" stroke="#9333ea" strokeWidth="2.5" />
          <ellipse cx="42" cy="30" rx="8" ry="11" fill="#0f172a" />
          <circle cx="32" cy="24" r="3" fill="#ef4444" />
          <circle cx="52" cy="24" r="3" fill="#ef4444" />
          {/* Legs */}
          <ellipse cx={30 + legOffset1} cy="68" rx="6" ry="7" fill="#3b0764" stroke="#9333ea" strokeWidth="2" />
          <ellipse cx={54 + legOffset2} cy="68" rx="6" ry="7" fill="#3b0764" stroke="#9333ea" strokeWidth="2" />
        </svg>
      );

    // ==========================================
    // 真レジェンド 強化新敵スプライト
    // ==========================================
    case 'enemy_real_ancient_hippo':
      return (
        <svg width="105" height="85" viewBox="0 0 105 85" className="drop-shadow-2xl">
          {/* Primeval Super Hippo */}
          <ellipse cx="56" cy="48" rx="38" ry="28" fill="#047857" stroke="#34d399" strokeWidth="3.5" />
          {/* Fossil Shell Crest */}
          <path d="M 40 22 Q 60 10 80 22" fill="none" stroke="#f59e0b" strokeWidth="4" />
          {/* Giant Hippo Snout */}
          <ellipse cx="28" cy="48" rx="22" ry="18" fill="#065f46" stroke="#34d399" strokeWidth="3" />
          <circle cx="20" cy="40" r="4" fill="#047857" />
          <circle cx="38" cy="32" r="4" fill="#ef4444" />
          {/* Massive Primitive Tusks */}
          <polygon points="16,56 12,68 22,58" fill="#fef08a" stroke="#78350f" strokeWidth="1.5" />
          <polygon points="34,56 38,68 28,58" fill="#fef08a" stroke="#78350f" strokeWidth="1.5" />
          <ellipse cx={40 + legOffset1} cy="74" rx="8" ry="8" fill="#047857" stroke="#34d399" strokeWidth="2" />
          <ellipse cx={74 + legOffset2} cy="74" rx="8" ry="8" fill="#047857" stroke="#34d399" strokeWidth="2" />
        </svg>
      );

    case 'enemy_real_ancient_elephant':
      return (
        <svg width="125" height="110" viewBox="0 0 125 110" className="drop-shadow-2xl">
          {/* Primeval Mammoth Elephant Body */}
          <ellipse cx="68" cy="60" rx="44" ry="36" fill="#064e3b" stroke="#10b981" strokeWidth="4" />
          {/* Mammoth Tusks */}
          <path d="M 32 60 Q 6 70 8 40" fill="none" stroke="#fef08a" strokeWidth="6" strokeLinecap="round" />
          {/* Elephant Trunk */}
          <path d={`M 36 48 Q ${isAttacking ? 10 : 22} 75 ${isAttacking ? 0 : 28} 95`} fill="none" stroke="#047857" strokeWidth="10" strokeLinecap="round" />
          {/* Head & Ear */}
          <circle cx="44" cy="42" r="22" fill="#064e3b" stroke="#10b981" strokeWidth="3" />
          <ellipse cx="58" cy="38" rx="16" ry="20" fill="#047857" stroke="#10b981" strokeWidth="2" />
          <circle cx="34" cy="36" r="4" fill="#ef4444" />
          <ellipse cx={48 + legOffset1} cy="96" rx="10" ry="10" fill="#064e3b" stroke="#10b981" strokeWidth="2.5" />
          <ellipse cx={88 + legOffset2} cy="96" rx="10" ry="10" fill="#064e3b" stroke="#10b981" strokeWidth="2.5" />
        </svg>
      );

    case 'enemy_real_ancient_master_a':
      return (
        <svg width="95" height="75" viewBox="0 0 95 75" className="drop-shadow-xl">
          {/* Ancient Master Anteater Body */}
          <ellipse cx="55" cy="42" rx="30" ry="20" fill="#065f46" stroke="#34d399" strokeWidth="3" />
          {/* Long Snout */}
          <polygon points="32,36 4,40 32,46" fill="#047857" stroke="#34d399" strokeWidth="2" />
          {/* Rapid Anteater Tongue on Attack */}
          {isAttacking && (
            <line x1="4" y1="40" x2="-60" y2="40" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
          )}
          {/* Ancient Beard & Eye */}
          <path d="M 28 46 Q 24 60 18 64" fill="none" stroke="#f8fafc" strokeWidth="3" />
          <circle cx="28" cy="34" r="3" fill="#ef4444" />
          <ellipse cx={46 + legOffset1} cy="62" rx="6" ry="6" fill="#065f46" stroke="#34d399" strokeWidth="2" />
          <ellipse cx={70 + legOffset2} cy="62" rx="6" ry="6" fill="#065f46" stroke="#34d399" strokeWidth="2" />
        </svg>
      );

    case 'enemy_real_ancient_bore':
      return (
        <svg width="100" height="75" viewBox="0 0 100 75" className="drop-shadow-2xl">
          {/* Primeval Boar Body */}
          <ellipse cx="50" cy="42" rx="34" ry="24" fill="#78350f" stroke="#f59e0b" strokeWidth="3.5" />
          {/* Spiky Ancient Bristles */}
          <path d="M 30 20 L 38 8 L 46 20 L 54 6 L 62 20 L 70 8 L 78 20" fill="#047857" stroke="#10b981" strokeWidth="2" />
          {/* Boar Head & Huge Horns */}
          <polygon points="26,30 4,42 26,52" fill="#78350f" stroke="#f59e0b" strokeWidth="2.5" />
          <polygon points="12,46 4,32 18,42" fill="#fef08a" stroke="#78350f" strokeWidth="2" />
          <circle cx="22" cy="34" r="3.5" fill="#ef4444" />
          <ellipse cx={36 + legOffset1 * 2} cy="64" rx="7" ry="8" fill="#78350f" stroke="#f59e0b" strokeWidth="2" />
          <ellipse cx={68 + legOffset2 * 2} cy="64" rx="7" ry="8" fill="#78350f" stroke="#f59e0b" strokeWidth="2" />
        </svg>
      );

    case 'enemy_real_ancient_sloth':
      return (
        <svg width="125" height="115" viewBox="0 0 125 115" className="drop-shadow-2xl">
          {/* Ancient Giant Megalonyx Sloth Body */}
          <ellipse cx="65" cy="62" rx="46" ry="38" fill="#064e3b" stroke="#10b981" strokeWidth="4" />
          {/* Huge Primeval Sloth Head */}
          <circle cx="34" cy="40" r="20" fill="#065f46" stroke="#10b981" strokeWidth="3" />
          <circle cx="26" cy="36" r="4" fill="#ef4444" />
          {/* Giant Razor Claws */}
          <g transform={`rotate(${isAttacking ? 75 : -15} 30 65)`}>
            <path d="M 30 65 Q 10 90 0 110" fill="none" stroke="#fef08a" strokeWidth="6" strokeLinecap="round" />
            <path d="M 36 65 Q 20 95 12 115" fill="none" stroke="#fef08a" strokeWidth="6" strokeLinecap="round" />
          </g>
          <ellipse cx={52 + legOffset1} cy="98" rx="10" ry="10" fill="#064e3b" stroke="#10b981" strokeWidth="2.5" />
          <ellipse cx={92 + legOffset2} cy="98" rx="10" ry="10" fill="#064e3b" stroke="#10b981" strokeWidth="2.5" />
        </svg>
      );

    case 'enemy_ancient_zero':
      return (
        <svg width="150" height="150" viewBox="0 0 150 150" className="drop-shadow-[0_0_30px_rgba(234,179,8,0.8)]">
          {/* Golden Divine Halo Ring */}
          <circle cx="75" cy="65" r="55" fill="none" stroke="#eab308" strokeWidth="4" strokeDasharray="8 6" className="animate-spin" style={{ animationDuration: '8s' }} />
          <circle cx="75" cy="65" r="42" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" />
          
          {/* Celestial Ancient Wings */}
          <path d="M 75 65 Q 10 15 5 55 Q 30 75 75 65" fill="#0f172a" stroke="#eab308" strokeWidth="3.5" />
          <path d="M 75 65 Q 140 15 145 55 Q 120 75 75 65" fill="#0f172a" stroke="#eab308" strokeWidth="3.5" />
          <path d="M 75 65 Q 20 50 15 85 Q 45 95 75 65" fill="#1e293b" stroke="#f59e0b" strokeWidth="3" />
          <path d="M 75 65 Q 130 50 135 85 Q 105 95 75 65" fill="#1e293b" stroke="#f59e0b" strokeWidth="3" />

          {/* Central God Body (Ancient Primeval Core) */}
          <circle cx="75" cy="65" r="30" fill="#020617" stroke="#eab308" strokeWidth="4.5" />
          <ellipse cx="75" cy="65" rx="20" ry="24" fill="#047857" stroke="#10b981" strokeWidth="3" />
          
          {/* Divine Eyes */}
          <circle cx="68" cy="58" r="5" fill="#ef4444" stroke="#fef08a" strokeWidth="2" />
          <circle cx="82" cy="58" r="5" fill="#ef4444" stroke="#fef08a" strokeWidth="2" />
          <circle cx="75" cy="48" r="4" fill="#facc15" stroke="#ffffff" strokeWidth="1.5" />
          
          {/* God Crown / Horns */}
          <polygon points="75,20 65,42 85,42" fill="#eab308" stroke="#78350f" strokeWidth="2" />
          <polygon points="52,28 60,45 50,48" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
          <polygon points="98,28 90,45 100,48" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />

          {/* Divine Lightning Ray on Attack */}
          {isAttacking && (
            <g>
              <line x1="75" y1="65" x2="-30" y2="90" stroke="#fef08a" strokeWidth="8" strokeLinecap="round" />
              <circle cx="-30" cy="90" r="18" fill="#eab308" opacity="0.8" />
            </g>
          )}

          {/* Flowing Divine Mantle */}
          <path d="M 60 88 Q 75 135 55 145" fill="none" stroke="#eab308" strokeWidth="4" />
          <path d="M 90 88 Q 75 135 95 145" fill="none" stroke="#eab308" strokeWidth="4" />
          <circle cx="75" cy="115" r="8" fill="#ef4444" stroke="#eab308" strokeWidth="2.5" />
        </svg>
      );

    default:
      return (
        <svg width="50" height="50" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" fill="#cbd5e1" stroke="#0f172a" strokeWidth="2" />
          <text x="25" y="30" fontSize="12" textAnchor="middle" fill="#0f172a">?</text>
        </svg>
      );
  }
}


