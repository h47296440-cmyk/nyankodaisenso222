import React, { useRef } from 'react';
import { ActiveEntity, DamageNumber, VisualEffect, StageDefinition } from '../../types';
import { UnitSpriteRenderer } from './UnitSpriteRenderer';
import { CastleSpriteRenderer } from './CastleSpriteRenderer';

interface BattleCanvasProps {
  stage: StageDefinition;
  playerCastleHp: number;
  playerCastleMaxHp: number;
  enemyCastleHp: number;
  enemyCastleMaxHp: number;
  cats: ActiveEntity[];
  enemies: ActiveEntity[];
  damageNumbers: DamageNumber[];
  visualEffects: VisualEffect[];
  isCannonFiring: boolean;
  cannonProgress: number;
  cameraX: number;
  setCameraX: (fn: (prev: number) => number | number) => void;
  bossAlert: string | null;
}

export const BattleCanvas: React.FC<BattleCanvasProps> = ({
  stage,
  playerCastleHp,
  playerCastleMaxHp,
  enemyCastleHp,
  enemyCastleMaxHp,
  cats,
  enemies,
  damageNumbers,
  visualEffects,
  isCannonFiring,
  cannonProgress,
  cameraX,
  setCameraX,
  bossAlert,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startDragXRef = useRef(0);
  const startCameraXRef = useRef(0);

  const battlefieldWidth = stage.battlefieldWidth || 1800;

  // Touch and mouse drag panning for mobile & desktop
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    isDraggingRef.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startDragXRef.current = clientX;
    startCameraXRef.current = cameraX;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - startDragXRef.current;
    const viewportWidth = containerRef.current.clientWidth;
    const maxCameraX = Math.max(0, battlefieldWidth - viewportWidth);

    const newCameraX = Math.max(0, Math.min(maxCameraX, startCameraXRef.current - deltaX));
    setCameraX(newCameraX);
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // Background visual themes
  const renderBackground = () => {
    switch (stage.bgType) {
      case 'future_neon':
        return (
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-slate-900 to-cyan-950 overflow-hidden pointer-events-none">
            <div className="absolute bottom-16 left-0 right-0 h-48 flex justify-around opacity-40">
              {Array.from({ length: 15 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-cyan-900 border-t border-cyan-400 w-16"
                  style={{
                    height: `${40 + (i % 5) * 25}%`,
                    boxShadow: '0 0 15px rgba(6,182,212,0.3)',
                  }}
                />
              ))}
            </div>
            <div
              className="absolute bottom-0 left-0 right-0 h-16 opacity-30"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)',
                backgroundSize: '40px 10px',
              }}
            />
          </div>
        );

      case 'future_space':
        return (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-950 to-indigo-950 overflow-hidden pointer-events-none">
            <div className="absolute top-8 right-16 w-32 h-32 rounded-full bg-cyan-400/20 border-2 border-cyan-300/40 blur-sm animate-pulse" />
            <div
              className="absolute bottom-0 left-0 right-0 h-24 opacity-25"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
                backgroundSize: '30px 12px',
              }}
            />
          </div>
        );

      case 'cosmos_dimension':
      case 'cosmos_galaxy':
        return (
          <div className="absolute inset-0 bg-gradient-to-b from-black via-fuchsia-950 to-purple-950 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-amber-500/20 via-pink-500/25 to-cyan-500/20 rounded-full blur-3xl animate-pulse" />
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="absolute bg-amber-300/60 rotate-45 animate-ping"
                style={{
                  left: `${(i * 33) % 100}%`,
                  top: `${(i * 27) % 65}%`,
                  width: `${(i % 4) + 2}px`,
                  height: `${(i % 4) + 2}px`,
                  animationDuration: `${2 + (i % 3)}s`,
                }}
              />
            ))}
          </div>
        );

      case 'japan_volcano':
        return (
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-red-950 to-amber-950 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/3 w-80 h-80 bg-red-600/20 rounded-full blur-3xl" />
            <svg
              className="absolute bottom-16 left-0 w-full h-44 opacity-50 text-stone-900 fill-current"
              viewBox="0 0 1000 100"
              preserveAspectRatio="none"
            >
              <polygon points="0,100 200,40 400,90 600,20 800,80 1000,100" />
            </svg>
          </div>
        );

      case 'legend_ancient':
        return (
          <div className="absolute inset-0 bg-gradient-to-b from-amber-950 via-yellow-950 to-stone-900 overflow-hidden pointer-events-none">
            <div className="absolute top-4 left-1/4 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl" />
            {/* Distant Ancient Ruins */}
            <svg
              className="absolute bottom-16 left-0 w-full h-40 opacity-40 text-amber-950 fill-current"
              viewBox="0 0 1000 100"
              preserveAspectRatio="none"
            >
              <polygon points="0,100 100,50 150,50 160,80 300,30 360,30 380,85 600,40 680,40 700,90 850,25 920,25 1000,100" />
            </svg>
          </div>
        );

      case 'legend_cave':
        return (
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-stone-900 to-amber-950 overflow-hidden pointer-events-none">
            {/* Stalactites */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-stone-900 to-transparent flex justify-around opacity-60">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="w-8 bg-stone-800 rounded-b-full"
                  style={{ height: `${30 + (i % 4) * 20}px` }}
                />
              ))}
            </div>
          </div>
        );

      case 'crazed_hell':
        return (
          <div className="absolute inset-0 bg-gradient-to-b from-purple-950 via-red-950 to-stone-950 overflow-hidden pointer-events-none">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-red-600/30 rounded-full blur-3xl animate-pulse" />
            {/* Dark Storm Clouds */}
            <div className="absolute top-2 left-10 w-96 h-20 bg-purple-900/40 rounded-full blur-xl" />
            <div className="absolute top-6 right-20 w-80 h-24 bg-red-900/40 rounded-full blur-xl" />
          </div>
        );

      default:
        // Classic Battle Cats Sky & Plains (Matching Screenshot)
        return (
          <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-300 to-amber-100 overflow-hidden pointer-events-none">
            {/* Distant Japanese Mountains / Hills */}
            <svg
              className="absolute bottom-12 left-0 w-full h-36 opacity-30 text-emerald-800 fill-current"
              viewBox="0 0 1000 100"
              preserveAspectRatio="none"
            >
              <polygon points="0,100 120,40 280,75 450,30 650,80 820,35 1000,100" />
            </svg>
            <svg
              className="absolute bottom-12 left-0 w-full h-24 opacity-40 text-emerald-600 fill-current"
              viewBox="0 0 1000 100"
              preserveAspectRatio="none"
            >
              <polygon points="0,100 180,50 350,85 520,45 720,70 900,40 1000,100" />
            </svg>

            {/* Fluffy White Clouds */}
            <div className="absolute top-8 left-12 w-36 h-12 bg-white/75 rounded-full blur-xs" />
            <div className="absolute top-12 left-32 w-28 h-10 bg-white/80 rounded-full blur-xs" />
            <div className="absolute top-14 right-24 w-44 h-14 bg-white/70 rounded-full blur-xs" />
            <div className="absolute top-8 right-56 w-32 h-10 bg-white/60 rounded-full blur-xs" />
          </div>
        );
    }
  };

  const getGroundColor = () => {
    switch (stage.bgType) {
      case 'future_neon':
        return 'bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border-cyan-500';
      case 'future_space':
        return 'bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-sky-400';
      case 'cosmos_dimension':
      case 'cosmos_galaxy':
        return 'bg-gradient-to-r from-purple-950 via-fuchsia-950 to-slate-950 border-pink-500';
      case 'japan_volcano':
        return 'bg-gradient-to-r from-stone-900 via-red-950 to-stone-900 border-amber-600';
      case 'legend_ancient':
        return 'bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 border-amber-700';
      case 'legend_cave':
        return 'bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 border-stone-700';
      case 'crazed_hell':
        return 'bg-gradient-to-r from-purple-950 via-stone-900 to-red-950 border-rose-800';
      default:
        // Classic Battle Cats Japanese Grassy/Dirt Battlefield Ground
        return 'bg-[#78350f] border-[#92400e]';
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing bg-stone-950"
    >
      {/* Dynamic Background Themes */}
      {renderBackground()}

      {/* Boss Appearance Shock Banner */}
      {bossAlert && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white font-black px-6 py-1.5 rounded-full border-2 border-yellow-300 shadow-2xl flex items-center gap-2 animate-bounce z-40">
          <span className="text-yellow-300 text-lg">⚠️</span>
          <span className="text-xs sm:text-sm tracking-wider uppercase font-black drop-shadow">{bossAlert}</span>
        </div>
      )}

      {/* World Battlefield Stage Container translated by cameraX */}
      <div
        className="absolute top-0 bottom-0 left-0 flex items-end will-change-transform"
        style={{
          width: `${battlefieldWidth}px`,
          transform: `translateX(-${cameraX}px)`,
        }}
      >
        {/* Ground Bar */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-10 sm:h-12 border-t-4 ${getGroundColor()} z-10 flex items-center justify-between px-6 text-stone-200 text-[10px] sm:text-xs font-mono font-black opacity-80`}
        >
          <span className="text-yellow-300">【にゃんこ本陣】0m</span>
          <span>500m</span>
          <span>1000m</span>
          <span>1500m</span>
          <span className="text-rose-300">【敵城】{Math.round(battlefieldWidth)}m</span>
        </div>

        {/* Player Base on the LEFT (Calico Cat Cannon Base at left: 80px) */}
        <div className="absolute bottom-10 sm:bottom-12 left-6 sm:left-10 z-10">
          <CastleSpriteRenderer
            isPlayer={true}
            hp={playerCastleHp}
            maxHp={playerCastleMaxHp}
            cannonCharging={cannonProgress >= 100}
          />
        </div>

        {/* Enemy Castle on the RIGHT (Stone/Sci-fi Castle at right: 80px) */}
        <div className="absolute bottom-10 sm:bottom-12 right-6 sm:right-10 z-10">
          <CastleSpriteRenderer
            isPlayer={false}
            hp={enemyCastleHp}
            maxHp={enemyCastleMaxHp}
            spriteType={stage.enemyCastleSprite}
          />
        </div>

        {/* Active Cats (Spawn from Left and March Right) */}
        {cats.map((cat) => (
          <div
            key={cat.instanceId}
            className="absolute bottom-10 sm:bottom-12 z-20 transition-transform"
            style={{
              left: `${cat.x}px`,
              transform: 'translateX(-50%)',
            }}
          >
            {cat.hp < cat.maxHp && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-black/60 rounded-full overflow-hidden border border-black/40">
                <div
                  className="h-full bg-emerald-400"
                  style={{ width: `${(cat.hp / cat.maxHp) * 100}%` }}
                />
              </div>
            )}
            <UnitSpriteRenderer
              spriteType={cat.spriteType}
              isCat={true}
              state={cat.state}
              animTimer={cat.animTimer}
              scale={cat.scale}
              isAttackingWindup={cat.isWindupActive}
            />
          </div>
        ))}

        {/* Active Enemies (Spawn from Right and March Left) */}
        {enemies.map((enemy) => (
          <div
            key={enemy.instanceId}
            className="absolute bottom-10 sm:bottom-12 z-20 transition-transform"
            style={{
              left: `${enemy.x}px`,
              transform: 'translateX(-50%)',
            }}
          >
            {enemy.hp < enemy.maxHp && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-black/60 rounded-full overflow-hidden border border-black/40">
                <div
                  className="h-full bg-rose-500"
                  style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                />
              </div>
            )}
            <UnitSpriteRenderer
              spriteType={enemy.spriteType}
              isCat={false}
              state={enemy.state}
              animTimer={enemy.animTimer}
              scale={enemy.scale}
              isAttackingWindup={enemy.isWindupActive}
            />
          </div>
        ))}

        {/* Cat Cannon Laser Blast Visual (Shooting from Left Base to Right) */}
        {isCannonFiring && (
          <div className="absolute bottom-16 sm:bottom-20 left-28 sm:left-36 right-0 h-24 sm:h-28 pointer-events-none z-30 flex items-center">
            <div className="w-full h-14 sm:h-16 bg-gradient-to-r from-sky-400 via-white to-sky-300 opacity-90 blur-sm animate-pulse" />
            <div className="absolute inset-0 bg-white opacity-80 animate-ping" />
            <div className="absolute inset-0 bg-gradient-to-t from-sky-500/0 via-sky-300/40 to-sky-500/0" />
          </div>
        )}

        {/* Visual FX (Hits, souls, shockwaves, critical flashes) */}
        {visualEffects.map((fx) => {
          const progress = fx.lifetime / fx.maxLifetime;
          return (
            <div
              key={fx.id}
              className="absolute pointer-events-none z-30"
              style={{
                left: `${fx.x}px`,
                bottom: `${fx.y + 40}px`,
                transform: 'translate(-50%, -50%)',
                opacity: 1 - progress,
              }}
            >
              {fx.type === 'hit' && (
                <div className="relative">
                  <div className="w-12 h-12 bg-amber-300 rounded-full blur-sm animate-ping" />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white stroke-black stroke-2 drop-shadow">
                    ドンッ!
                  </span>
                </div>
              )}
              {fx.type === 'aoe_burst' && (
                <div className="relative">
                  <div className="w-24 h-24 bg-rose-500 rounded-full blur-md animate-ping" />
                  <div className="absolute inset-0 flex items-center justify-center font-black text-sm text-yellow-300 drop-shadow-lg">
                    ズドォォン!!
                  </div>
                </div>
              )}
              {fx.type === 'crit_flash' && (
                <div className="relative flex items-center justify-center">
                  <div className="w-32 h-32 bg-yellow-300 rounded-full blur-md animate-ping" />
                  <div className="absolute font-black text-base text-yellow-300 uppercase tracking-widest drop-shadow-[0_0_12px_rgba(253,224,71,1)]">
                    CRITICAL!!
                  </div>
                </div>
              )}
              {fx.type === 'metal_spark' && (
                <div className="relative flex items-center justify-center">
                  <div className="w-10 h-10 bg-cyan-300 rounded-full blur-xs animate-ping" />
                  <div className="absolute text-[10px] font-black text-cyan-200">カキーン!</div>
                </div>
              )}
              {fx.type === 'freeze_fx' && (
                <div className="w-20 h-20 bg-sky-400/40 rounded-full border-2 border-cyan-200 blur-xs animate-pulse" />
              )}
              {fx.type === 'cat_soul' && (
                <div className="relative flex flex-col items-center animate-bounce">
                  <svg viewBox="0 0 32 32" className="w-8 h-8 opacity-85 drop-shadow">
                    <path
                      d="M 16 4 Q 8 14 8 22 Q 8 28 16 28 Q 24 28 24 22 Q 24 14 16 4 Z"
                      fill="#38bdf8"
                    />
                    <circle cx="13" cy="20" r="2" fill="#000000" />
                    <circle cx="19" cy="20" r="2" fill="#000000" />
                  </svg>
                </div>
              )}
              {fx.type === 'boss_shockwave' && (
                <div className="relative flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 rounded-full border-4 border-yellow-400 bg-yellow-300/20 blur-sm animate-ping" />
                  <div className="absolute w-96 h-96 rounded-full border-2 border-red-500/80 animate-pulse" />
                </div>
              )}
            </div>
          );
        })}

        {/* Damage Numbers */}
        {damageNumbers.map((d) => (
          <div
            key={d.id}
            className={`absolute font-black pointer-events-none z-30 transition-all ${
              d.isCritical
                ? 'text-yellow-300 text-lg sm:text-xl scale-125 animate-bounce drop-shadow-[0_0_8px_rgba(253,224,71,0.9)]'
                : d.isCatDamage
                ? 'text-white text-xs sm:text-sm drop-shadow'
                : 'text-rose-400 text-xs sm:text-sm drop-shadow'
            }`}
            style={{
              left: `${d.x}px`,
              bottom: `${d.y + 40 + (d.lifetime / d.maxLifetime) * 35}px`,
              transform: 'translateX(-50%)',
              opacity: 1 - d.lifetime / d.maxLifetime,
              textShadow: '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000',
            }}
          >
            {d.isCritical ? `CRIT! -${d.value}` : `-${d.value}`}
          </div>
        ))}
      </div>

      {/* Floating Minimap / Battlefield Overview */}
      <div className="absolute top-2 right-3 w-40 sm:w-56 h-4 sm:h-5 bg-black/70 border border-stone-600 rounded-full px-2 flex items-center z-20 pointer-events-none shadow-md">
        {/* Player Castle Indicator on Left */}
        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 mr-1 flex-shrink-0" title="自陣" />
        {/* Battlefield Minimap Track */}
        <div className="relative flex-1 h-1.5 bg-stone-700 rounded-full overflow-hidden">
          {/* Viewport Box Indicator */}
          {containerRef.current && (
            <div
              className="absolute top-0 bottom-0 bg-white/40 border border-white/60 rounded"
              style={{
                left: `${(cameraX / battlefieldWidth) * 100}%`,
                width: `${(containerRef.current.clientWidth / battlefieldWidth) * 100}%`,
              }}
            />
          )}
          {/* Cat Blips */}
          {cats.map((c) => (
            <div
              key={c.instanceId}
              className="absolute top-0 bottom-0 w-1.5 bg-cyan-400 rounded-full"
              style={{ left: `${(c.x / battlefieldWidth) * 100}%` }}
            />
          ))}
          {/* Enemy Blips */}
          {enemies.map((e) => (
            <div
              key={e.instanceId}
              className="absolute top-0 bottom-0 w-1.5 bg-rose-500 rounded-full"
              style={{ left: `${(e.x / battlefieldWidth) * 100}%` }}
            />
          ))}
        </div>
        {/* Enemy Castle Indicator on Right */}
        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ml-1 flex-shrink-0" title="敵城" />
      </div>
    </div>
  );
};
