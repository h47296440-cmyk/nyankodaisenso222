import React, { useRef, useEffect } from 'react';
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
            {/* Cyber Grid & Skyscrapers */}
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
            {/* Cyber Grid Lines */}
            <div
              className="absolute bottom-0 left-0 right-0 h-16 opacity-30"
              style={{
                backgroundImage: 'linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)',
                backgroundSize: '40px 10px',
              }}
            />
          </div>
        );

      case 'future_space':
        return (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-950 to-indigo-950 overflow-hidden pointer-events-none">
            {/* Giant Orbiting Moon/Colony */}
            <div className="absolute top-8 right-16 w-32 h-32 rounded-full bg-cyan-400/20 border-2 border-cyan-300/40 blur-sm animate-pulse" />
            {/* Space Grid */}
            <div
              className="absolute bottom-0 left-0 right-0 h-24 opacity-25"
              style={{
                backgroundImage: 'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
                backgroundSize: '30px 12px',
              }}
            />
          </div>
        );

      case 'cosmos_dimension':
        return (
          <div className="absolute inset-0 bg-gradient-to-b from-black via-fuchsia-950 to-purple-950 overflow-hidden pointer-events-none">
            {/* Divine Dimensional Rift */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-amber-500/20 via-pink-500/25 to-cyan-500/20 rounded-full blur-3xl animate-pulse" />
            {/* Dimensional Shards */}
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
            {/* Fiery Smoke & Embers */}
            <div className="absolute top-0 left-1/3 w-80 h-80 bg-red-600/20 rounded-full blur-3xl" />
            <svg className="absolute bottom-16 left-0 w-full h-44 opacity-50 text-stone-900 fill-current" viewBox="0 0 1000 100" preserveAspectRatio="none">
              <polygon points="0,100 200,40 400,90 600,20 800,80 1000,100" />
            </svg>
          </div>
        );

      case 'cosmos_galaxy':
        return (
          <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950 to-slate-950 overflow-hidden pointer-events-none">
            {/* Stars */}
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white animate-pulse"
                style={{
                  left: `${(i * 47) % 100}%`,
                  top: `${(i * 31) % 70}%`,
                  width: `${(i % 3) + 1.5}px`,
                  height: `${(i % 3) + 1.5}px`,
                  opacity: 0.4 + (i % 6) * 0.1,
                }}
              />
            ))}
            {/* Nebula glow */}
            <div className="absolute top-10 left-1/3 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-20 right-1/4 w-80 h-80 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />
          </div>
        );

      case 'japan_city':
        return (
          <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950 to-slate-950 overflow-hidden pointer-events-none">
            {/* Stars */}
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white animate-pulse"
                style={{
                  left: `${(i * 47) % 100}%`,
                  top: `${(i * 31) % 70}%`,
                  width: `${(i % 3) + 1.5}px`,
                  height: `${(i % 3) + 1.5}px`,
                  opacity: 0.4 + (i % 6) * 0.1,
                }}
              />
            ))}
            {/* Nebula glow */}
            <div className="absolute top-10 left-1/3 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-20 right-1/4 w-80 h-80 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />
          </div>
        );

      case 'japan_city':
        return (
          <div className="absolute inset-0 bg-gradient-to-b from-amber-100 via-orange-100 to-rose-200 overflow-hidden pointer-events-none">
            {/* Distant Mt. Fuji & Sunset */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/25 rounded-full blur-xl" />
            <svg className="absolute bottom-16 left-1/4 w-96 h-40 opacity-30 text-indigo-950 fill-current" viewBox="0 0 100 40">
              <polygon points="10,40 50,5 90,40" />
              <polygon points="40,14 50,5 60,14" fill="#ffffff" />
            </svg>
            {/* City Silhouette */}
            <div className="absolute bottom-16 left-0 right-0 h-28 flex justify-between opacity-25">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="bg-stone-800 w-12" style={{ height: `${30 + (i % 6) * 12}%` }} />
              ))}
            </div>
          </div>
        );

      default: // 'japan_grass'
        return (
          <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-100 to-amber-50 overflow-hidden pointer-events-none">
            {/* Clouds */}
            <div className="absolute top-8 left-20 w-48 h-14 bg-white/70 rounded-full blur-sm" />
            <div className="absolute top-14 right-40 w-64 h-16 bg-white/60 rounded-full blur-sm" />
            {/* Mountain range */}
            <svg className="absolute bottom-16 left-0 w-full h-36 opacity-30 text-emerald-800 fill-current" viewBox="0 0 1000 100" preserveAspectRatio="none">
              <polygon points="0,100 150,20 300,80 500,10 700,70 850,30 1000,100" />
            </svg>
          </div>
        );
    }
  };

  const getGroundColor = () => {
    switch (stage.bgType) {
      case 'future_neon':
      case 'future_space':
        return 'bg-gradient-to-t from-slate-950 to-slate-900 border-cyan-500';
      case 'cosmos_galaxy':
      case 'cosmos_dimension':
        return 'bg-gradient-to-t from-black to-purple-950 border-purple-500';
      case 'japan_volcano':
        return 'bg-gradient-to-t from-stone-950 to-red-950 border-red-800';
      case 'japan_city':
        return 'bg-gradient-to-t from-stone-800 to-stone-700 border-stone-500';
      default:
        return 'bg-gradient-to-t from-amber-900 to-emerald-800 border-amber-950';
    }
  };

  return (
    <div
      ref={containerRef}
      id="battle-canvas-container"
      className="relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing touch-none"
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background */}
      {renderBackground()}

      {/* Minimap Radar Bar */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-64 max-w-[80vw] h-4 bg-black/60 backdrop-blur-md rounded-full border border-white/20 px-2 flex items-center z-30 pointer-events-none">
        <div className="relative w-full h-1.5 bg-stone-700/60 rounded-full">
          {/* Player base dot */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-blue-400 ring-2 ring-blue-200" />
          {/* Enemy base dot */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-300" />
          {/* Camera viewport rect indicator */}
          {containerRef.current && (
            <div
              className="absolute top-0 bottom-0 bg-white/25 border border-white/60 rounded"
              style={{
                left: `${(cameraX / battlefieldWidth) * 100}%`,
                width: `${(containerRef.current.clientWidth / battlefieldWidth) * 100}%`,
              }}
            />
          )}
          {/* Cats dots */}
          {cats.map((cat) => (
            <div
              key={cat.instanceId}
              className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-300"
              style={{ left: `${(cat.x / battlefieldWidth) * 100}%` }}
            />
          ))}
          {/* Enemy dots */}
          {enemies.map((enemy) => (
            <div
              key={enemy.instanceId}
              className={`absolute top-1/2 -translate-y-1/2 rounded-full ${
                enemy.isBoss ? 'w-2.5 h-2.5 bg-yellow-400 animate-ping' : 'w-1.5 h-1.5 bg-rose-400'
              }`}
              style={{ left: `${(enemy.x / battlefieldWidth) * 100}%` }}
            />
          ))}
        </div>
      </div>

      {/* Boss Warning Banner */}
      {bossAlert && (
        <div className="absolute top-7 left-1/2 -translate-x-1/2 bg-red-600/90 text-white font-black px-6 py-1.5 rounded-full border-2 border-yellow-300 shadow-2xl flex items-center gap-2 animate-bounce z-40">
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
        <div className={`absolute bottom-0 left-0 right-0 h-10 sm:h-12 border-t-4 ${getGroundColor()} z-10 flex items-center justify-between px-6 text-stone-400 text-[10px] sm:text-xs font-mono opacity-50`}>
          <span>【にゃんこ本陣】0m</span>
          <span>500m</span>
          <span>1000m</span>
          <span>1500m</span>
          <span>【敵軍要塞】{Math.round(battlefieldWidth)}m</span>
        </div>

        {/* Player Base (Left side at x: 80px) */}
        <div className="absolute bottom-10 sm:bottom-12 left-6 sm:left-10 z-10">
          <CastleSpriteRenderer
            isPlayer={true}
            hp={playerCastleHp}
            maxHp={playerCastleMaxHp}
            cannonCharging={cannonProgress >= 100}
          />
        </div>

        {/* Enemy Castle (Right side at battlefieldWidth - 120px) */}
        <div className="absolute bottom-10 sm:bottom-12 right-6 sm:right-10 z-10">
          <CastleSpriteRenderer
            isPlayer={false}
            hp={enemyCastleHp}
            maxHp={enemyCastleMaxHp}
            spriteType={stage.enemyCastleSprite}
          />
        </div>

        {/* Active Cats */}
        {cats.map((cat) => (
          <div
            key={cat.instanceId}
            className="absolute bottom-10 sm:bottom-12 z-20 transition-transform"
            style={{
              left: `${cat.x}px`,
              transform: 'translateX(-50%)',
            }}
          >
            {/* Small HP bar if damaged */}
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

        {/* Active Enemies */}
        {enemies.map((enemy) => (
          <div
            key={enemy.instanceId}
            className="absolute bottom-10 sm:bottom-12 z-20 transition-transform"
            style={{
              left: `${enemy.x}px`,
              transform: 'translateX(-50%)',
            }}
          >
            {/* Small HP bar if damaged */}
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

        {/* Cat Cannon Laser Blast Visual */}
        {isCannonFiring && (
          <div className="absolute bottom-16 sm:bottom-20 left-28 sm:left-36 right-0 h-24 sm:h-28 pointer-events-none z-30 flex items-center">
            {/* Giant laser beam */}
            <div className="w-full h-14 sm:h-16 bg-gradient-to-r from-sky-400 via-white to-sky-300 opacity-90 blur-sm animate-pulse" />
            <div className="absolute inset-0 bg-white opacity-80 animate-ping" />
            <div className="absolute inset-0 bg-gradient-to-t from-sky-500/0 via-sky-300/40 to-sky-500/0" />
          </div>
        )}

        {/* Visual FX (Slashing, explosions, dust) */}
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
              {fx.type === 'boss_roar' && (
                <div className="w-36 h-36 rounded-full border-4 border-red-500/80 animate-ping" />
              )}
              {fx.type === 'boss_shockwave' && (
                <div className="relative flex items-center justify-center pointer-events-none">
                  {/* Expanding Giant Shockwave Rings */}
                  <div className="w-64 h-64 rounded-full border-4 border-yellow-400 bg-yellow-300/20 blur-sm animate-ping" />
                  <div className="absolute w-96 h-96 rounded-full border-2 border-red-500/80 animate-pulse" />
                  {/* Wind / Blast Streaks */}
                  <div className="absolute -inset-x-32 h-16 bg-gradient-to-r from-transparent via-white/50 to-transparent blur-xs animate-pulse" />
                  <div className="absolute -top-12 bg-red-600/90 text-white font-black text-xs sm:text-sm px-3 py-1 rounded-full border-2 border-yellow-400 shadow-2xl animate-bounce">
                    ⚠ BOSS 出現衝撃波 ⚠
                  </div>
                </div>
              )}
              {fx.type === 'wave_blast' && (
                <div className="relative flex flex-col items-center pointer-events-none">
                  {/* Vertical Wave Shockwave Column (波動) */}
                  <div className="w-20 h-44 bg-gradient-to-t from-cyan-400 via-sky-300 to-transparent opacity-85 blur-xs rounded-t-full animate-pulse" />
                  <div className="absolute bottom-0 w-28 h-8 bg-cyan-200 rounded-full blur-sm animate-ping" />
                  <div className="absolute top-2 text-[10px] font-black text-cyan-200 stroke-cyan-900 drop-shadow-md">
                    波動!!
                  </div>
                </div>
              )}
              {fx.type === 'cat_soul' && (
                <div
                  className="relative flex flex-col items-center pointer-events-none"
                  style={{ transform: `translateY(-${progress * 60}px)` }}
                >
                  {/* Glowing Cat Angel Soul Ascending */}
                  <svg width="44" height="44" viewBox="0 0 44 44" className="drop-shadow-lg animate-bounce">
                    {/* Golden Halo */}
                    <ellipse cx="22" cy="6" rx="10" ry="3" fill="none" stroke="#fbbf24" strokeWidth="2" />
                    {/* Angel Wings */}
                    <path d="M 12 18 Q 2 8 8 28 Z" fill="#ffffff" fillOpacity="0.8" stroke="#38bdf8" strokeWidth="1.5" />
                    <path d="M 32 18 Q 42 8 36 28 Z" fill="#ffffff" fillOpacity="0.8" stroke="#38bdf8" strokeWidth="1.5" />
                    {/* Cat Spirit Head */}
                    <circle cx="22" cy="20" r="11" fill="#ffffff" fillOpacity="0.9" stroke="#94a3b8" strokeWidth="1.5" />
                    {/* Cat Ears */}
                    <polygon points="15,13 18,6 21,12" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                    <polygon points="23,12 26,6 29,13" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                    {/* Peaceful Sleeping Eyes */}
                    <path d="M 16 20 Q 18 22 20 20" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M 24 20 Q 26 22 28 20" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
                    {/* Little cute smile */}
                    <path d="M 20 24 Q 22 26 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span className="text-[9px] font-black text-amber-300 drop-shadow">昇天〜</span>
                </div>
              )}
              {fx.type === 'dust_puff' && (
                <div className="relative flex items-center justify-center">
                  <div
                    className="w-8 h-4 bg-amber-200/50 rounded-full blur-xs"
                    style={{ transform: `scale(${1 + progress * 1.5})` }}
                  />
                </div>
              )}
              {fx.type === 'metal_spark' && (
                <div className="relative flex items-center justify-center">
                  <div className="w-10 h-10 bg-cyan-200 rounded-full blur-sm animate-ping" />
                  <span className="absolute text-xs font-black text-cyan-200 stroke-cyan-900 drop-shadow">
                    ガキィン!
                  </span>
                </div>
              )}
              {fx.type === 'freeze_fx' && (
                <div className="relative flex flex-col items-center">
                  <div className="w-20 h-20 bg-sky-400/30 border-2 border-cyan-300 rounded-xl backdrop-blur-xs animate-pulse flex items-center justify-center">
                    <span className="text-xl">❄️</span>
                  </div>
                  <span className="text-[10px] font-black text-cyan-200 bg-blue-900/80 px-2 py-0.5 rounded border border-cyan-300 drop-shadow">
                    停止(フリーズ)!
                  </span>
                </div>
              )}
              {fx.type === 'crit_flash' && (
                <div className="relative flex items-center justify-center">
                  <div className="w-32 h-32 bg-yellow-300/40 rounded-full blur-md animate-ping" />
                  <div className="absolute w-24 h-1 bg-yellow-200 rotate-45 animate-pulse" />
                  <div className="absolute w-24 h-1 bg-yellow-200 -rotate-45 animate-pulse" />
                  <span className="absolute text-sm font-black text-red-600 bg-yellow-300 px-2 py-0.5 rounded border border-red-600 drop-shadow-lg animate-bounce">
                    CRITICAL!
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Damage Numbers */}
        {damageNumbers.map((dmg) => {
          const progress = dmg.lifetime / dmg.maxLifetime;
          return (
            <div
              key={dmg.id}
              className={`absolute font-black pointer-events-none z-30 transition-all ${
                dmg.isCritical
                  ? 'text-yellow-300 text-base sm:text-lg font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] scale-125'
                  : dmg.isCatDamage
                  ? 'text-white text-xs sm:text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
                  : 'text-rose-400 text-xs sm:text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
              }`}
              style={{
                left: `${dmg.x}px`,
                bottom: `${dmg.y + 50 + progress * 35}px`,
                opacity: 1 - progress,
                transform: 'translateX(-50%)',
              }}
            >
              {dmg.isCritical && <span className="text-[10px] block text-red-500">CRITICAL!</span>}
              {Math.round(dmg.value)}
            </div>
          );
        })}
      </div>

      {/* Screen edge navigation buttons for quick jumping across the battlefield */}
      <button
        id="btn-scroll-player-base"
        onClick={(e) => {
          e.stopPropagation();
          setCameraX(0);
        }}
        className="absolute bottom-12 sm:bottom-14 left-2 sm:left-4 bg-stone-900/85 hover:bg-stone-800 text-white text-[10px] sm:text-[11px] font-black px-2.5 py-1 rounded-lg border border-white/20 backdrop-blur shadow-lg z-30 active:scale-95"
      >
        ◀ 自城へ
      </button>

      <button
        id="btn-scroll-enemy-base"
        onClick={(e) => {
          e.stopPropagation();
          if (containerRef.current) {
            setCameraX(battlefieldWidth - containerRef.current.clientWidth);
          }
        }}
        className="absolute bottom-12 sm:bottom-14 right-2 sm:right-4 bg-stone-900/85 hover:bg-stone-800 text-white text-[10px] sm:text-[11px] font-black px-2.5 py-1 rounded-lg border border-white/20 backdrop-blur shadow-lg z-30 active:scale-95"
      >
        敵城へ ▶
      </button>
    </div>
  );
};
