import React from 'react';

interface UnitSpriteProps {
  spriteType: string;
  isCat: boolean;
  state: 'walk' | 'attack' | 'knockback' | 'die';
  animTimer: number;
  scale?: number;
  isAttackingWindup?: boolean;
}

export const UnitSpriteRenderer: React.FC<UnitSpriteProps> = React.memo(({
  spriteType,
  isCat,
  state,
  animTimer,
  scale = 1.0,
  isAttackingWindup = false,
}) => {
  const safeTimer = isFinite(animTimer) ? animTimer : 0;
  const safeScale = isFinite(scale) && scale > 0 ? scale : 1.0;

  // Rich physics and organic squash-stretch calculations
  const walkPhase = safeTimer * 10.5;
  const walkCycle = Math.sin(walkPhase);
  const bounceY = state === 'walk' ? Math.abs(Math.sin(walkPhase)) * 5.5 : 0;
  const walkSquashX = state === 'walk' ? 1 + Math.sin(walkPhase * 2) * 0.04 : 1;
  const walkSquashY = state === 'walk' ? 1 - Math.sin(walkPhase * 2) * 0.04 : 1;
  const walkTilt = state === 'walk' ? Math.sin(walkPhase) * 3.5 : 0;

  // Attack windup tension vs explosive strike lunge
  let attackTilt = 0;
  let attackTranslateX = 0;
  let attackTranslateY = 0;
  let attackScaleX = 1;
  let attackScaleY = 1;

  if (isAttackingWindup) {
    // Deep breath & pull-back anticipation
    const tremor = Math.sin(safeTimer * 45) * 2;
    attackTilt = isCat ? -16 : 16;
    attackTranslateX = (isCat ? -10 : 10) + tremor;
    attackTranslateY = -4;
    attackScaleX = 0.92;
    attackScaleY = 1.12;
  } else if (state === 'attack') {
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
  const finalScaleY = safeScale * walkSquashY * attackScaleY;
  const finalRot = walkTilt + attackTilt + knockbackRot;
  const finalY = -(bounceY + attackTranslateY + knockbackElevY);

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
          opacity: dieOpacity,
          filter: isAttackingWindup
            ? 'drop-shadow(0 0 6px rgba(250, 204, 21, 0.65))'
            : state === 'knockback'
            ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.7))'
            : 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.25))',
          transition: 'filter 0.15s ease',
        }}
      >
        {renderSpriteSvg(spriteType, walkCycle, isAttackingWindup || state === 'attack', safeTimer)}
      </div>

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
      const isWall = type === 'cat_wall';
      return (
        <svg width="56" height="74" viewBox="0 0 56 74" className="drop-shadow-md">
          {/* Ears */}
          <polygon points="12,14 15,3 22,12" fill={isWall ? "#e2e8f0" : "#f8fafc"} stroke="#0f172a" strokeWidth="2.5" />
          <polygon points="34,12 41,3 44,14" fill={isWall ? "#e2e8f0" : "#f8fafc"} stroke="#0f172a" strokeWidth="2.5" />
          {/* Pillar / Wall body */}
          <rect x="10" y="10" width="36" height="52" rx={isWall ? "4" : "14"} fill={isWall ? "#e2e8f0" : "#f8fafc"} stroke="#0f172a" strokeWidth="2.5" />
          {isWall && (
            <>
              {/* Brick lines */}
              <line x1="10" y1="28" x2="46" y2="28" stroke="#94a3b8" strokeWidth="2" />
              <line x1="10" y1="46" x2="46" y2="46" stroke="#94a3b8" strokeWidth="2" />
              <line x1="28" y1="28" x2="28" y2="46" stroke="#94a3b8" strokeWidth="2" />
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
      const isBrave = type === 'cat_brave';
      return (
        <svg width="68" height="58" viewBox="0 0 68 58" className="drop-shadow-md">
          {/* Sword / Axe */}
          {isBrave ? (
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
          {/* Helmet */}
          {isBrave ? (
            <path d="M 16 16 Q 28 4 40 16 L 38 22 L 18 22 Z" fill="#fbbf24" stroke="#0f172a" strokeWidth="2" />
          ) : (
            <g>
              <polygon points="12,18 16,6 23,15" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
              <polygon points="31,15 38,6 42,18" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
            </g>
          )}
          {/* Body */}
          <ellipse cx="28" cy="30" rx="17" ry="16" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          {/* Fierce Face */}
          <polygon points="20,24 26,27 22,29" fill="#0f172a" />
          <polygon points="36,24 30,27 34,29" fill="#0f172a" />
          <path d="M 23 34 Q 28 30 33 34" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
          {/* Shield for brave cat */}
          {isBrave && (
            <ellipse cx="14" cy="32" rx="7" ry="10" fill="#dc2626" stroke="#0f172a" strokeWidth="2" />
          )}
          {/* Legs */}
          <ellipse cx={20 + legOffset1} cy="48" rx="4" ry="5" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx={36 + legOffset2} cy="48" rx="4" ry="5" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    case 'cat_gross':
    case 'cat_legs':
      const isLegs = type === 'cat_legs';
      return (
        <svg width="60" height="96" viewBox="0 0 60 96" className="drop-shadow-md">
          {/* Cat Head on top */}
          <polygon points="18,16 22,6 28,14" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          <polygon points="32,14 38,6 42,16" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx="30" cy="22" rx="14" ry="13" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          <ellipse cx="25" cy="20" rx="2" ry="2.5" fill="#0f172a" />
          <ellipse cx="35" cy="20" rx="2" ry="2.5" fill="#0f172a" />
          <line x1="26" y1="26" x2="34" y2="26" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
          {/* Super long legs */}
          <path
            d={`M 22 34 Q ${18 + (isAttacking ? 35 : legOffset1)} 60 20 88`}
            fill="none"
            stroke="#f8fafc"
            strokeWidth="6"
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
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d={`M 38 34 Q ${42 + legOffset2} 60 40 88`}
            fill="none"
            stroke="#0f172a"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* High heels / Sexy feet */}
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
      const isGiraffe = type === 'cat_giraffe';
      return (
        <svg width="74" height="60" viewBox="0 0 74 60" className="drop-shadow-md">
          {/* Four-legged running body */}
          <ellipse cx="32" cy="34" rx="20" ry="14" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          {/* Cow spots */}
          <circle cx="26" cy="30" r="4" fill="#0f172a" />
          <circle cx="38" cy="36" r="5" fill="#0f172a" />
          <circle cx="44" cy="28" r="3" fill="#0f172a" />
          {/* Long Neck for giraffe */}
          {isGiraffe ? (
            <path d="M 44 32 L 58 12 L 66 16 L 50 36 Z" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          ) : null}
          {/* Head & Horns */}
          <g transform={isGiraffe ? "translate(58, 6)" : "translate(46, 20)"}>
            <polygon points="-4,-4 0,-14 6,-4" fill="#fbbf24" stroke="#0f172a" strokeWidth="1.5" />
            <polygon points="6,-4 12,-14 16,-4" fill="#fbbf24" stroke="#0f172a" strokeWidth="1.5" />
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
      const isUfo = type === 'cat_ufo';
      return (
        <svg width="64" height="64" viewBox="0 0 64 64" className="drop-shadow-lg">
          {isUfo ? (
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
      const isWhale = type === 'cat_whale';
      return (
        <svg width="74" height="60" viewBox="0 0 74 60" className="drop-shadow-md">
          {/* Whale / Fish Body */}
          <path
            d="M 12 30 Q 30 10 60 24 Q 68 28 62 40 Q 30 52 12 30 Z"
            fill={isWhale ? "#3b82f6" : "#f8fafc"}
            stroke="#0f172a"
            strokeWidth="2.5"
          />
          {/* Tail fin */}
          <polygon points="12,30 2,18 4,42" fill={isWhale ? "#3b82f6" : "#f8fafc"} stroke="#0f172a" strokeWidth="2" />
          {/* Ears on top */}
          <polygon points="36,18 40,6 46,18" fill={isWhale ? "#3b82f6" : "#f8fafc"} stroke="#0f172a" strokeWidth="2" />
          {/* Eyes & Sharp Teeth */}
          <circle cx="52" cy="25" r="3" fill="#0f172a" />
          <path d="M 44 34 L 48 30 L 52 34 L 56 30 L 60 34" fill="none" stroke="#0f172a" strokeWidth="2" />
          {/* Water spout for whale */}
          {isWhale && (
            <path d="M 40 8 Q 40 0 32 -4 M 40 8 Q 44 0 50 -2" fill="none" stroke="#38bdf8" strokeWidth="2" />
          )}
          {/* Legs scuttling under fish */}
          <ellipse cx={28 + legOffset1} cy="48" rx="4" ry="4" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx={44 + legOffset2} cy="48" rx="4" ry="4" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    case 'cat_lizard':
    case 'cat_dragon':
      const isDragon = type === 'cat_dragon';
      return (
        <svg width="80" height="65" viewBox="0 0 80 65" className="drop-shadow-lg">
          {/* Dragon Horns & Spikes */}
          {isDragon ? (
            <>
              <polygon points="26,14 30,2 35,16" fill="#ef4444" stroke="#0f172a" strokeWidth="2" />
              <polygon points="38,14 44,0 48,16" fill="#ef4444" stroke="#0f172a" strokeWidth="2" />
              <polygon points="18,30 10,24 16,36" fill="#ef4444" stroke="#0f172a" strokeWidth="2" />
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
              <path d="M 68 32 Q 88 26 95 35 Q 86 42 68 36 Z" fill="#ef4444" />
              <path d="M 70 33 Q 82 29 86 35 Q 80 39 70 35 Z" fill="#facc15" />
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
      return (
        <svg width="86" height="96" viewBox="0 0 86 96" className="drop-shadow-2xl">
          {/* Giant Muscular Shadow Titan */}
          {/* Huge Shoulders & Arms */}
          <path d="M 8 36 Q 0 16 16 10 Q 32 10 26 38 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="3" />
          <path d="M 78 36 Q 86 16 70 10 Q 54 10 60 38 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="3" />
          {/* Fist slamming animation */}
          {isAttacking ? (
            <circle cx="72" cy="70" r="14" fill="#0f172a" stroke="#ef4444" strokeWidth="3" />
          ) : (
            <circle cx="70" cy="50" r="10" fill="#1e293b" stroke="#0f172a" strokeWidth="2.5" />
          )}
          {/* Cat Head in center */}
          <polygon points="32,18 36,4 43,15" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          <polygon points="45,15 52,4 56,18" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="44" cy="26" r="16" fill="#f8fafc" stroke="#0f172a" strokeWidth="3" />
          <circle cx="38" cy="24" r="2.5" fill="#0f172a" />
          <circle cx="50" cy="24" r="2.5" fill="#0f172a" />
          {/* Giant Torso */}
          <path d="M 22 38 L 66 38 L 58 72 L 30 72 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="3" />
          {/* Chest lines */}
          <path d="M 32 46 L 56 46 M 44 46 L 44 65 M 34 56 L 54 56" stroke="#475569" strokeWidth="2" />
          {/* Massive Legs */}
          <rect x={28 + legOffset1} y="72" width="10" height="20" rx="3" fill="#1e293b" stroke="#0f172a" strokeWidth="2.5" />
          <rect x={50 + legOffset2} y="72" width="10" height="20" rx="3" fill="#1e293b" stroke="#0f172a" strokeWidth="2.5" />
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
    case 'cat_valkyrie_holy':
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
      return (
        <svg width="96" height="96" viewBox="0 0 96 96" className="drop-shadow-2xl">
          {/* Teacher Bun Bun (ぶんぶん先生) */}
          {/* Spinning Boxing Gloves */}
          <g className="animate-spin" style={{ transformOrigin: '48px 48px' }}>
            <circle cx="16" cy="48" r="14" fill="#dc2626" stroke="#0f172a" strokeWidth="3" />
            <circle cx="80" cy="48" r="14" fill="#dc2626" stroke="#0f172a" strokeWidth="3" />
          </g>
          {/* Muscular Torso */}
          <ellipse cx="48" cy="48" rx="26" ry="32" fill="#78350f" stroke="#0f172a" strokeWidth="3.5" />
          {/* Fierce Face with Bandana */}
          <rect x="28" y="24" width="40" height="10" fill="#dc2626" stroke="#0f172a" strokeWidth="2" />
          <circle cx="48" cy="34" r="16" fill="#fbcfe8" stroke="#0f172a" strokeWidth="2.5" />
          <ellipse cx="42" cy="32" rx="3" ry="3" fill="#0f172a" />
          <ellipse cx="54" cy="32" rx="3" ry="3" fill="#0f172a" />
          <line x1="38" y1="42" x2="58" y2="42" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
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

    // ----------------- CRAZED BOSS ENEMIES (降臨ボス) -----------------
    case 'enemy_crazed_cat':
    case 'enemy_crazed_tank':
    case 'enemy_crazed_axe':
    case 'enemy_crazed_cow':
    case 'enemy_crazed_lizard':
    case 'enemy_crazed_titan':
      return (
        <svg width="120" height="120" viewBox="0 0 120 120" className="drop-shadow-2xl">
          {/* Demonic Boss Aura */}
          <circle cx="60" cy="60" r="52" fill="none" stroke="#7e22ce" strokeWidth="5" strokeDasharray="14,8" className="animate-spin" />
          <circle cx="60" cy="60" r="44" fill="#09090b" stroke="#dc2626" strokeWidth="4" />
          {/* Evil Horns */}
          <polygon points="34,36 20,10 44,28" fill="#dc2626" stroke="#7f1d1d" strokeWidth="2.5" />
          <polygon points="86,36 100,10 76,28" fill="#dc2626" stroke="#7f1d1d" strokeWidth="2.5" />
          {/* Menacing Boss Eyes */}
          <ellipse cx="45" cy="50" rx="7" ry="9" fill="#ef4444" />
          <ellipse cx="75" cy="50" rx="7" ry="9" fill="#ef4444" />
          <ellipse cx="45" cy="50" rx="2" ry="7" fill="#000000" />
          <ellipse cx="75" cy="50" rx="2" ry="7" fill="#000000" />
          {/* Jagged Fangs */}
          <polygon points="50,68 60,82 70,68" fill="#ffffff" />
          <polygon points="40,70 48,80 52,70" fill="#ffffff" />
          <polygon points="68,70 72,80 80,70" fill="#ffffff" />
          {/* Pulsing shockwave on attack */}
          {isAttacking && (
            <circle cx="60" cy="60" r="56" fill="none" stroke="#ef4444" strokeWidth="6" className="animate-ping" />
          )}
          {/* Heavy Claw Stompers */}
          <rect x="36" y="98" width="18" height="14" rx="4" fill="#18181b" stroke="#71717a" strokeWidth="3" />
          <rect x="66" y="98" width="18" height="14" rx="4" fill="#18181b" stroke="#71717a" strokeWidth="3" />
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


