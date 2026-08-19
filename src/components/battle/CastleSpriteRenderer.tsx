import React from 'react';

interface CastleProps {
  isPlayer: boolean;
  hp: number;
  maxHp: number;
  spriteType?: string;
  isHit?: boolean;
  cannonCharging?: boolean;
}

export const CastleSpriteRenderer: React.FC<CastleProps> = ({
  isPlayer,
  hp,
  maxHp,
  spriteType = 'castle_japan',
  isHit = false,
  cannonCharging = false,
}) => {
  return (
    <div className={`relative flex flex-col items-center select-none ${isHit ? 'animate-bounce' : ''}`}>
      {/* Classic Battle Cats Digital Block HP Display */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-20 pointer-events-none">
        <span
          className="text-base sm:text-lg font-black tracking-wider text-white font-mono"
          style={{
            textShadow:
              '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 3px 5px rgba(0,0,0,0.85)',
          }}
        >
          {Math.round(hp)}/{Math.round(maxHp)}
        </span>
      </div>

      {isPlayer ? (
        /* Player Base: Iconic Calico Cat Cannon Base (にゃんこ城) with Satellite Dish */
        <div className="relative w-32 h-52 sm:w-40 sm:h-64 flex items-end">
          <svg viewBox="0 0 160 260" className="w-full h-full drop-shadow-2xl overflow-visible">
            {/* Base Body - Rounded White Cat Tower */}
            <path
              d="M 25 240 L 25 110 Q 25 45 80 45 Q 135 45 135 110 L 135 240 Z"
              fill="#ffffff"
              stroke="#000000"
              strokeWidth="4"
            />

            {/* Calico Spots (Orange & Dark Brown patches) */}
            {/* Top Right Orange Spot */}
            <path
              d="M 105 48 Q 130 52 135 80 Q 115 95 95 70 Z"
              fill="#ea580c"
              stroke="#000000"
              strokeWidth="3"
            />
            {/* Middle Left Orange Spot */}
            <path
              d="M 25 120 Q 55 125 45 165 Q 25 175 25 120 Z"
              fill="#ea580c"
              stroke="#000000"
              strokeWidth="3"
            />
            {/* Middle Right Dark Spot */}
            <path
              d="M 135 140 Q 105 145 115 185 Q 135 190 135 140 Z"
              fill="#3e1a0b"
              stroke="#000000"
              strokeWidth="3"
            />
            {/* Bottom Left Dark Spot */}
            <path
              d="M 25 195 Q 50 190 45 230 Q 25 240 25 195 Z"
              fill="#3e1a0b"
              stroke="#000000"
              strokeWidth="3"
            />
            {/* Bottom Right Orange Spot */}
            <path
              d="M 135 205 Q 110 200 115 238 Q 135 240 135 205 Z"
              fill="#ea580c"
              stroke="#000000"
              strokeWidth="3"
            />

            {/* Cat Ears */}
            <polygon points="40,55 52,15 68,48" fill="#ffffff" stroke="#000000" strokeWidth="4" />
            <polygon points="92,48 108,15 120,55" fill="#ea580c" stroke="#000000" strokeWidth="4" />

            {/* Giant Metallic Cannon Snout (Pointing Leftwards) */}
            <g transform="translate(15, 80)">
              {/* Cannon Barrel Base Cylinder */}
              <ellipse cx="60" cy="30" rx="30" ry="26" fill="#64748b" stroke="#000000" strokeWidth="4" />
              {/* Cannon Tube projecting Left */}
              <path
                d="M 45 10 L 5 18 L 5 42 L 45 50 Z"
                fill="#475569"
                stroke="#000000"
                strokeWidth="4"
              />
              {/* Cannon Muzzle Ring */}
              <ellipse cx="5" cy="30" rx="6" ry="12" fill="#1e293b" stroke="#000000" strokeWidth="4" />
              <ellipse
                cx="5"
                cy="30"
                rx="3"
                ry="8"
                fill={cannonCharging ? "#38bdf8" : "#0f172a"}
                className={cannonCharging ? "animate-pulse" : ""}
              />
              {/* Cat Face Whiskers on Base */}
              <line x1="68" y1="20" x2="80" y2="18" stroke="#000000" strokeWidth="2.5" />
              <line x1="68" y1="26" x2="82" y2="28" stroke="#000000" strokeWidth="2.5" />
            </g>

            {/* Wooden Signboard with Paw Print */}
            <g transform="translate(50, 140)">
              {/* Hanging Rope */}
              <line x1="12" y1="-8" x2="12" y2="0" stroke="#78350f" strokeWidth="2.5" />
              <line x1="48" y1="-8" x2="48" y2="0" stroke="#78350f" strokeWidth="2.5" />
              {/* Wooden Board */}
              <rect x="0" y="0" width="60" height="22" rx="4" fill="#d97706" stroke="#000000" strokeWidth="3" />
              {/* Black Paw Print */}
              <circle cx="30" cy="14" r="5" fill="#000000" />
              <circle cx="23" cy="8" r="2.5" fill="#000000" />
              <circle cx="28" cy="5" r="2.5" fill="#000000" />
              <circle cx="33" cy="5" r="2.5" fill="#000000" />
              <circle cx="38" cy="8" r="2.5" fill="#000000" />
            </g>

            {/* Dark Arched Castle Gate */}
            <path
              d="M 55 240 L 55 185 Q 80 160 105 185 L 105 240 Z"
              fill="#1e1b18"
              stroke="#000000"
              strokeWidth="4"
            />

            {/* Robotic Satellite Radar Dish on Top-Right */}
            <g transform="translate(110, -5)">
              {/* Robotic Arm Mount */}
              <path
                d="M 5 65 L 18 35 L 8 10"
                fill="none"
                stroke="#64748b"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="18" cy="35" r="4" fill="#1e293b" stroke="#000000" strokeWidth="2" />
              <circle cx="8" cy="10" r="3" fill="#1e293b" stroke="#000000" strokeWidth="2" />
              {/* Golden Radar Dish */}
              <ellipse
                cx="15"
                cy="0"
                rx="24"
                ry="12"
                fill="#facc15"
                stroke="#000000"
                strokeWidth="3.5"
                transform="rotate(-25 15 0)"
              />
              {/* Dish Red Center Node */}
              <circle
                cx="15"
                cy="0"
                r="5"
                fill="#ef4444"
                stroke="#000000"
                strokeWidth="2"
                transform="rotate(-25 15 0)"
              />
              {/* Antenna Spike */}
              <line
                x1="15"
                y1="0"
                x2="30"
                y2="-8"
                stroke="#000000"
                strokeWidth="3"
                transform="rotate(-25 15 0)"
              />
            </g>
          </svg>
        </div>
      ) : (
        /* Enemy Base: Classic Grey Stone Brick Castle (or Future/Cosmos variants) */
        <div className="relative w-32 h-52 sm:w-40 sm:h-64 flex items-end">
          {spriteType === 'castle_future' ? (
            <svg viewBox="0 0 160 260" className="w-full h-full drop-shadow-2xl overflow-visible">
              <polygon points="20,240 38,80 122,80 140,240" fill="#0f172a" stroke="#06b6d4" strokeWidth="4" />
              <polygon points="45,80 80,20 115,80" fill="#083344" stroke="#22d3ee" strokeWidth="3" />
              <circle cx="80" cy="140" r="28" fill="#0891b2" stroke="#22d3ee" strokeWidth="4" className="animate-pulse" />
              <line x1="80" y1="20" x2="80" y2="2" stroke="#22d3ee" strokeWidth="3" />
              <circle cx="80" cy="2" r="5" fill="#22d3ee" className="animate-ping" />
              <rect x="62" y="195" width="36" height="45" rx="4" fill="#083344" stroke="#06b6d4" strokeWidth="3" />
            </svg>
          ) : spriteType === 'castle_cosmos' ? (
            <svg viewBox="0 0 160 260" className="w-full h-full drop-shadow-2xl overflow-visible">
              <ellipse cx="80" cy="130" rx="60" ry="70" fill="#1e1b4b" stroke="#a855f7" strokeWidth="4" />
              <circle cx="80" cy="130" r="38" fill="#312e81" stroke="#ec4899" strokeWidth="3" strokeDasharray="6,4" className="animate-spin" />
              <polygon points="80,10 60,60 100,60" fill="#c084fc" stroke="#7e22ce" strokeWidth="3" />
              <polygon points="30,240 80,200 130,240" fill="#0f172a" stroke="#a855f7" strokeWidth="3" />
            </svg>
          ) : (
            /* Classic Stone Castle with Red Flag from Screenshot */
            <svg viewBox="0 0 160 260" className="w-full h-full drop-shadow-2xl overflow-visible">
              {/* Red Flag on Top-Left Pole */}
              <line x1="45" y1="65" x2="45" y2="20" stroke="#000000" strokeWidth="3.5" />
              <polygon points="45,22 80,32 45,44" fill="#ef4444" stroke="#000000" strokeWidth="2.5" />

              {/* Main Stone Castle Tower */}
              <rect x="25" y="85" width="110" height="155" fill="#94a3b8" stroke="#000000" strokeWidth="4" rx="2" />

              {/* Crenellations (Battlements on Top Roof) */}
              <polygon
                points="25,85 25,65 50,65 50,75 70,75 70,65 90,65 90,75 110,75 110,65 135,65 135,85"
                fill="#94a3b8"
                stroke="#000000"
                strokeWidth="4"
              />

              {/* Stone Brick Texture Lines */}
              <line x1="25" y1="105" x2="135" y2="105" stroke="#475569" strokeWidth="2.5" />
              <line x1="25" y1="125" x2="135" y2="125" stroke="#475569" strokeWidth="2.5" />
              <line x1="25" y1="145" x2="135" y2="145" stroke="#475569" strokeWidth="2.5" />
              <line x1="25" y1="165" x2="135" y2="165" stroke="#475569" strokeWidth="2.5" />
              <line x1="25" y1="185" x2="135" y2="185" stroke="#475569" strokeWidth="2.5" />
              <line x1="25" y1="205" x2="135" y2="205" stroke="#475569" strokeWidth="2.5" />
              <line x1="25" y1="225" x2="135" y2="225" stroke="#475569" strokeWidth="2.5" />

              {/* Brick Vertical Joints */}
              <line x1="55" y1="85" x2="55" y2="105" stroke="#475569" strokeWidth="2" />
              <line x1="95" y1="85" x2="95" y2="105" stroke="#475569" strokeWidth="2" />
              <line x1="75" y1="105" x2="75" y2="125" stroke="#475569" strokeWidth="2" />
              <line x1="115" y1="105" x2="115" y2="125" stroke="#475569" strokeWidth="2" />
              <line x1="50" y1="125" x2="50" y2="145" stroke="#475569" strokeWidth="2" />
              <line x1="100" y1="125" x2="100" y2="145" stroke="#475569" strokeWidth="2" />

              {/* Upper Arched Window */}
              <path
                d="M 70 120 L 70 105 Q 80 95 90 105 L 90 120 Z"
                fill="#1e293b"
                stroke="#000000"
                strokeWidth="3"
              />

              {/* Black Arched Castle Door Entrance */}
              <path
                d="M 58 240 L 58 175 Q 80 150 102 175 L 102 240 Z"
                fill="#0f172a"
                stroke="#000000"
                strokeWidth="4"
              />
            </svg>
          )}
        </div>
      )}
    </div>
  );
};
