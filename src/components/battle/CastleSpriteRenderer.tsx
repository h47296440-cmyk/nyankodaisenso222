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
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));

  return (
    <div className={`relative flex flex-col items-center select-none ${isHit ? 'animate-bounce' : ''}`}>
      {/* Castle HP Gauge */}
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-32 bg-stone-900/90 border-2 border-stone-700 rounded-full p-0.5 shadow-lg z-20">
        <div
          className={`h-2.5 rounded-full transition-all duration-200 ${
            isPlayer
              ? hpPercent > 30
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-red-600 to-rose-400 animate-pulse'
              : hpPercent > 30
              ? 'bg-gradient-to-r from-red-500 to-rose-400'
              : 'bg-gradient-to-r from-amber-500 to-yellow-300 animate-pulse'
          }`}
          style={{ width: `${hpPercent}%` }}
        />
        <div className="text-[10px] text-center font-black tracking-tight text-white drop-shadow -mt-3.5">
          {hp.toLocaleString()} / {maxHp.toLocaleString()}
        </div>
      </div>

      {isPlayer ? (
        /* Player Cat Base (にゃんこ城) */
        <div className="relative w-36 h-60">
          <svg width="144" height="240" viewBox="0 0 144 240" className="drop-shadow-2xl">
            {/* Castle Roof & Cat Cannon Turret */}
            <rect x="24" y="90" width="96" height="130" fill="#e2e8f0" stroke="#0f172a" strokeWidth="4" rx="6" />
            {/* Bricks */}
            <path d="M 24 130 L 120 130 M 24 170 L 120 170 M 68 90 L 68 130 M 48 130 L 48 170 M 92 130 L 92 170 M 72 170 L 72 220" stroke="#94a3b8" strokeWidth="3" />
            
            {/* Castle Gate */}
            <path d="M 44 220 L 44 170 Q 72 140 100 170 L 100 220 Z" fill="#334155" stroke="#0f172a" strokeWidth="3" />
            
            {/* Huge Cat Head on Roof (The Cannon Mount) */}
            <g transform="translate(16, 20)">
              {/* Ears */}
              <polygon points="18,34 26,4 44,28" fill="#f8fafc" stroke="#0f172a" strokeWidth="3.5" />
              <polygon points="68,28 86,4 94,34" fill="#f8fafc" stroke="#0f172a" strokeWidth="3.5" />
              {/* Cat Face */}
              <circle cx="56" cy="52" r="44" fill="#f8fafc" stroke="#0f172a" strokeWidth="4" />
              {/* Cannon Barrel in Mouth */}
              <circle cx="56" cy="62" r="16" fill="#0f172a" stroke={cannonCharging ? "#38bdf8" : "#64748b"} strokeWidth="4" />
              {cannonCharging && (
                <circle cx="56" cy="62" r="10" fill="#38bdf8" className="animate-ping" />
              )}
              {/* Eyes */}
              <ellipse cx="40" cy="44" rx="4" ry="6" fill={cannonCharging ? "#38bdf8" : "#0f172a"} />
              <ellipse cx="72" cy="44" rx="4" ry="6" fill={cannonCharging ? "#38bdf8" : "#0f172a"} />
              {/* Cheeks */}
              <circle cx="28" cy="54" r="5" fill="#fda4af" />
              <circle cx="84" cy="54" r="5" fill="#fda4af" />
            </g>

            {/* Cat Flag on top */}
            <line x1="24" y1="20" x2="24" y2="2" stroke="#0f172a" strokeWidth="3" />
            <polygon points="24,2 6,10 24,18" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />
          </svg>
        </div>
      ) : (
        /* Enemy Castle */
        <div className="relative w-40 h-60">
          {spriteType === 'castle_future' ? (
            <svg width="160" height="240" viewBox="0 0 160 240" className="drop-shadow-2xl">
              {/* Future Cyber Fortress */}
              <polygon points="20,220 40,80 120,80 140,220" fill="#0f172a" stroke="#06b6d4" strokeWidth="4" />
              <polygon points="45,80 80,20 115,80" fill="#083344" stroke="#22d3ee" strokeWidth="3" />
              {/* Glowing Core */}
              <circle cx="80" cy="140" r="28" fill="#0891b2" stroke="#22d3ee" strokeWidth="4" className="animate-pulse" />
              <line x1="80" y1="20" x2="80" y2="2" stroke="#22d3ee" strokeWidth="3" />
              <circle cx="80" cy="2" r="5" fill="#22d3ee" className="animate-ping" />
              {/* Gate */}
              <rect x="62" y="180" width="36" height="40" rx="4" fill="#083344" stroke="#06b6d4" strokeWidth="3" />
            </svg>
          ) : spriteType === 'castle_cosmos' ? (
            <svg width="160" height="240" viewBox="0 0 160 240" className="drop-shadow-2xl">
              {/* Cosmic Portal Fortress */}
              <ellipse cx="80" cy="120" rx="60" ry="70" fill="#1e1b4b" stroke="#a855f7" strokeWidth="4" />
              <circle cx="80" cy="120" r="38" fill="#312e81" stroke="#ec4899" strokeWidth="3" strokeDasharray="6,4" className="animate-spin" />
              <polygon points="80,10 60,60 100,60" fill="#c084fc" stroke="#7e22ce" strokeWidth="3" />
              <polygon points="30,220 80,190 130,220" fill="#0f172a" stroke="#a855f7" strokeWidth="3" />
            </svg>
          ) : (
            /* Japan Enemy Shrine / Doge Castle */
            <svg width="160" height="240" viewBox="0 0 160 240" className="drop-shadow-2xl">
              {/* Dark Pagoda Roofs */}
              <polygon points="10,90 80,40 150,90 130,100 80,60 30,100" fill="#dc2626" stroke="#0f172a" strokeWidth="3" />
              <polygon points="25,50 80,15 135,50 120,58 80,30 40,58" fill="#dc2626" stroke="#0f172a" strokeWidth="3" />
              {/* Castle Wall */}
              <rect x="30" y="96" width="100" height="124" fill="#1e293b" stroke="#0f172a" strokeWidth="4" rx="4" />
              {/* Red Lanterns */}
              <ellipse cx="44" cy="118" rx="8" ry="12" fill="#ef4444" stroke="#0f172a" strokeWidth="2" />
              <ellipse cx="116" cy="118" rx="8" ry="12" fill="#ef4444" stroke="#0f172a" strokeWidth="2" />
              {/* Doge Insignia / Gate */}
              <path d="M 52 220 L 52 165 Q 80 140 108 165 L 108 220 Z" fill="#0f172a" stroke="#ef4444" strokeWidth="3" />
              <circle cx="80" cy="120" r="14" fill="#fed7aa" stroke="#0f172a" strokeWidth="2" />
              <circle cx="76" cy="118" r="2" fill="#0f172a" />
              <circle cx="84" cy="118" r="2" fill="#0f172a" />
              <circle cx="80" cy="124" r="2" fill="#0f172a" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
};
