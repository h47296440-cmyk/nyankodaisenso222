import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PvpConnectionPayload, PvpPlayerInfo } from './PvpLobbyModal';
import { UnitSpriteRenderer } from '../battle/UnitSpriteRenderer';
import { audio } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  Zap,
  Shield,
  Flame,
  Swords,
  Heart,
  Smile,
  X,
  Sparkles,
  Trophy,
  ArrowLeft,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface PvpBattleScreenProps {
  payload: PvpConnectionPayload;
  onExit: (result?: { victory: boolean; xpEarned: number; catFoodEarned: number }) => void;
}

interface ActivePvpUnit {
  id: string;
  isMine: boolean;
  name: string;
  spriteType: string;
  x: number;
  hp: number;
  maxHp: number;
  attackPower: number;
  attackRange: number;
  attackSpeed: number;
  speed: number;
  state: 'walk' | 'attack' | 'knockback' | 'dead';
  animTimer: number;
  attackCooldown: number;
  knockbackTimer: number;
  width: number;
}

interface DamageNumber {
  id: string;
  x: number;
  y: number;
  damage: number;
  isCrit?: boolean;
  opacity: number;
}

const STAGE_WIDTH = 1800;
const BASE_MAX_HP = 40000;

export const PvpBattleScreen: React.FC<PvpBattleScreenProps> = ({ payload, onExit }) => {
  const { conn, isHost, localPlayer, remotePlayer } = payload;

  // Castle HPs
  const [myCastleHp, setMyCastleHp] = useState<number>(BASE_MAX_HP);
  const [enemyCastleHp, setEnemyCastleHp] = useState<number>(BASE_MAX_HP);

  // Economy
  const [money, setMoney] = useState<number>(500);
  const [maxMoney, setMaxMoney] = useState<number>(1000);
  const [workerLevel, setWorkerLevel] = useState<number>(1);

  // Cat Cannon
  const [cannonCharge, setCannonCharge] = useState<number>(0);
  const [isFiringCannon, setIsFiringCannon] = useState<boolean>(false);
  const [enemyFiringCannon, setEnemyFiringCannon] = useState<boolean>(false);

  // Deck Cooldowns
  const [deckCooldowns, setDeckCooldowns] = useState<{ [catId: string]: number }>({});

  // Active battlefield units & damage numbers
  const [units, setUnits] = useState<ActivePvpUnit[]>([]);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);

  // Camera X position
  const [cameraX, setCameraX] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Emote bubbles
  const [myEmote, setMyEmote] = useState<string | null>(null);
  const [enemyEmote, setEnemyEmote] = useState<string | null>(null);
  const [showEmotePicker, setShowEmotePicker] = useState<boolean>(false);

  // Battle State
  const [battleState, setBattleState] = useState<'playing' | 'victory' | 'defeat'>('playing');
  const [battleTimer, setBattleTimer] = useState<number>(0);

  const stageContainerRef = useRef<HTMLDivElement>(null);
  const unitsRef = useRef<ActivePvpUnit[]>([]);
  const myCastleHpRef = useRef<number>(BASE_MAX_HP);
  const enemyCastleHpRef = useRef<number>(BASE_MAX_HP);
  const lastTimeRef = useRef<number>(performance.now());
  const animationFrameRef = useRef<number | null>(null);

  // Drag tracking
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartCamXRef = useRef(0);

  // Keep refs in sync
  unitsRef.current = units;
  myCastleHpRef.current = myCastleHp;
  enemyCastleHpRef.current = enemyCastleHp;

  // Listen to P2P peer messages
  useEffect(() => {
    const handleData = (data: any) => {
      if (!data || typeof data !== 'object') return;

      switch (data.type) {
        case 'SPAWN_CAT': {
          const u = data.unit;
          if (u) {
            audio.playCatSpawn(0.9);
            const newUnit: ActivePvpUnit = {
              id: `remote-${Date.now()}-${Math.random()}`,
              isMine: false,
              name: u.name,
              spriteType: u.spriteType,
              x: STAGE_WIDTH - 140,
              hp: u.hp,
              maxHp: u.hp,
              attackPower: u.attackPower,
              attackRange: u.attackRange,
              attackSpeed: u.attackSpeed,
              speed: u.speed,
              state: 'walk',
              animTimer: 0,
              attackCooldown: 0,
              knockbackTimer: 0,
              width: 50,
            };
            setUnits((prev) => [...prev, newUnit]);
          }
          break;
        }

        case 'FIRE_CANNON': {
          setEnemyFiringCannon(true);
          audio.playCannonFire();
          setTimeout(() => setEnemyFiringCannon(false), 1200);

          // Knockback & damage all my units
          setUnits((prev) =>
            prev.map((u) => {
              if (u.isMine) {
                return {
                  ...u,
                  hp: Math.max(1, u.hp - 800),
                  state: 'knockback',
                  knockbackTimer: 0.5,
                  x: Math.max(140, u.x - 100),
                };
              }
              return u;
            })
          );
          break;
        }

        case 'EMOTE': {
          setEnemyEmote(data.emote);
          audio.playClick();
          setTimeout(() => setEnemyEmote(null), 3000);
          break;
        }

        case 'SURRENDER': {
          handleVictory();
          break;
        }

        default:
          break;
      }
    };

    conn.on('data', handleData);
    return () => {
      conn.off('data', handleData);
    };
  }, [conn]);

  // Main Game Loop (60 FPS)
  useEffect(() => {
    if (battleState !== 'playing') return;

    let isRunning = true;

    const gameLoop = (time: number) => {
      if (!isRunning) return;

      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      // Update timer & economy
      setBattleTimer((prev) => prev + dt);
      setMoney((prev) => Math.min(maxMoney, prev + (15 + workerLevel * 10) * dt));
      setCannonCharge((prev) => Math.min(100, prev + 2.5 * dt));

      // Decrement deck cooldowns
      setDeckCooldowns((prev) => {
        const next: { [k: string]: number } = {};
        for (const [k, v] of Object.entries(prev)) {
          const numV = typeof v === 'number' ? v : 0;
          if (numV > dt) next[k] = numV - dt;
        }
        return next;
      });

      // Update damage number opacities
      setDamageNumbers((prev) =>
        prev
          .map((d) => ({ ...d, y: d.y - 30 * dt, opacity: d.opacity - 1.2 * dt }))
          .filter((d) => d.opacity > 0)
      );

      // Battlefield physics & combat
      const currentUnits = [...unitsRef.current];
      const nextUnits: ActivePvpUnit[] = [];
      const newDamages: DamageNumber[] = [];

      let myBaseDamageAccum = 0;
      let enemyBaseDamageAccum = 0;

      for (let i = 0; i < currentUnits.length; i++) {
        const u = { ...currentUnits[i] };
        u.animTimer += dt;
        if (u.attackCooldown > 0) u.attackCooldown -= dt;

        // Knockback handling
        if (u.state === 'knockback') {
          u.knockbackTimer -= dt;
          if (u.knockbackTimer <= 0) {
            u.state = 'walk';
          }
          nextUnits.push(u);
          continue;
        }

        if (u.isMine) {
          // My Unit: moves right (x increases)
          const enemyInFront = currentUnits
            .filter((o) => !o.isMine && o.x > u.x)
            .sort((a, b) => a.x - b.x)[0];

          const enemyDistance = enemyInFront ? enemyInFront.x - u.x : 9999;
          const castleDistance = STAGE_WIDTH - 140 - u.x;

          if (enemyInFront && enemyDistance <= u.attackRange) {
            // In range of enemy unit
            if (u.attackCooldown <= 0) {
              u.state = 'attack';
              u.attackCooldown = Math.max(0.5, u.attackSpeed);
              enemyInFront.hp -= u.attackPower;
              audio.playHit(false, false);
              newDamages.push({
                id: `dmg-${Date.now()}-${Math.random()}`,
                x: enemyInFront.x,
                y: 180 + Math.random() * 40,
                damage: u.attackPower,
                opacity: 1,
              });

              if (enemyInFront.hp <= enemyInFront.maxHp * 0.4 && enemyInFront.state !== 'knockback') {
                enemyInFront.state = 'knockback';
                enemyInFront.knockbackTimer = 0.3;
                enemyInFront.x = Math.min(STAGE_WIDTH - 140, enemyInFront.x + 50);
              }
            } else {
              u.state = 'walk';
            }
          } else if (castleDistance <= u.attackRange) {
            // In range of enemy castle
            if (u.attackCooldown <= 0) {
              u.state = 'attack';
              u.attackCooldown = Math.max(0.5, u.attackSpeed);
              enemyBaseDamageAccum += u.attackPower;
              audio.playHit(true, false);
              newDamages.push({
                id: `dmg-base-${Date.now()}`,
                x: STAGE_WIDTH - 140,
                y: 200,
                damage: u.attackPower,
                opacity: 1,
              });
            } else {
              u.state = 'walk';
            }
          } else {
            // Move forward (Speed scaled with normal battle physics)
            u.state = 'walk';
            u.x += u.speed * 8 * dt;
          }
        } else {
          // Enemy Unit: moves left (x decreases)
          const myUnitInFront = currentUnits
            .filter((o) => o.isMine && o.x < u.x)
            .sort((a, b) => b.x - a.x)[0];

          const myUnitDistance = myUnitInFront ? u.x - myUnitInFront.x : 9999;
          const myCastleDistance = u.x - 140;

          if (myUnitInFront && myUnitDistance <= u.attackRange) {
            if (u.attackCooldown <= 0) {
              u.state = 'attack';
              u.attackCooldown = Math.max(0.5, u.attackSpeed);
              myUnitInFront.hp -= u.attackPower;
              audio.playHit(false, false);
              newDamages.push({
                id: `dmg-${Date.now()}-${Math.random()}`,
                x: myUnitInFront.x,
                y: 180 + Math.random() * 40,
                damage: u.attackPower,
                opacity: 1,
              });

              if (myUnitInFront.hp <= myUnitInFront.maxHp * 0.4 && myUnitInFront.state !== 'knockback') {
                myUnitInFront.state = 'knockback';
                myUnitInFront.knockbackTimer = 0.3;
                myUnitInFront.x = Math.max(140, myUnitInFront.x - 50);
              }
            } else {
              u.state = 'walk';
            }
          } else if (myCastleDistance <= u.attackRange) {
            if (u.attackCooldown <= 0) {
              u.state = 'attack';
              u.attackCooldown = Math.max(0.5, u.attackSpeed);
              myBaseDamageAccum += u.attackPower;
              audio.playHit(true, false);
              newDamages.push({
                id: `dmg-mybase-${Date.now()}`,
                x: 140,
                y: 200,
                damage: u.attackPower,
                opacity: 1,
              });
            } else {
              u.state = 'walk';
            }
          } else {
            u.state = 'walk';
            u.x -= u.speed * 8 * dt;
          }
        }

        // Keep alive if hp > 0
        if (u.hp > 0) {
          nextUnits.push(u);
        } else {
          audio.playHit(false, true);
        }
      }

      setUnits(nextUnits);
      if (newDamages.length > 0) {
        setDamageNumbers((prev) => [...prev, ...newDamages]);
      }

      // Apply base damage
      if (enemyBaseDamageAccum > 0) {
        setEnemyCastleHp((prev) => {
          const next = Math.max(0, prev - enemyBaseDamageAccum);
          if (next <= 0 && battleState === 'playing') {
            handleVictory();
          }
          return next;
        });
      }

      if (myBaseDamageAccum > 0) {
        setMyCastleHp((prev) => {
          const next = Math.max(0, prev - myBaseDamageAccum);
          if (next <= 0 && battleState === 'playing') {
            handleDefeat();
          }
          return next;
        });
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [battleState, maxMoney, workerLevel]);

  const handleVictory = () => {
    setBattleState('victory');
    audio.playVictory();
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
    });
  };

  const handleDefeat = () => {
    setBattleState('defeat');
    audio.playDefeat();
  };

  // Spawn My Cat
  const handleSpawnCat = (catDef: PvpPlayerInfo['deck'][0]) => {
    if (money < catDef.cost || (deckCooldowns[catDef.catId] || 0) > 0) return;

    audio.playCatSpawn();
    setMoney((prev) => prev - catDef.cost);
    setDeckCooldowns((prev) => ({ ...prev, [catDef.catId]: 2.5 }));

    // Send P2P spawn message to opponent
    try {
      conn.send({
        type: 'SPAWN_CAT',
        unit: {
          name: catDef.name,
          spriteType: catDef.spriteType,
          hp: catDef.hp,
          attackPower: catDef.attackPower,
          attackRange: catDef.attackRange,
          attackSpeed: catDef.attackSpeed,
          speed: catDef.speed,
        },
      });
    } catch (e) {
      console.error(e);
    }

    // Add to local state
    const newUnit: ActivePvpUnit = {
      id: `mine-${Date.now()}-${Math.random()}`,
      isMine: true,
      name: catDef.name,
      spriteType: catDef.spriteType,
      x: 140,
      hp: catDef.hp,
      maxHp: catDef.hp,
      attackPower: catDef.attackPower,
      attackRange: catDef.attackRange,
      attackSpeed: catDef.attackSpeed,
      speed: catDef.speed,
      state: 'walk',
      animTimer: 0,
      attackCooldown: 0,
      knockbackTimer: 0,
      width: 50,
    };

    setUnits((prev) => [...prev, newUnit]);
  };

  // Worker Cat Level Up
  const handleWorkerLevelUp = () => {
    const cost = 100 * workerLevel;
    if (workerLevel >= 8 || money < cost) return;

    audio.playWorkerUpgrade();
    setMoney((prev) => prev - cost);
    setWorkerLevel((prev) => prev + 1);
    setMaxMoney((prev) => prev + 400);
  };

  // Fire Cat Cannon
  const handleFireCannon = () => {
    if (cannonCharge < 100 || isFiringCannon) return;

    audio.playCannonFire();
    setIsFiringCannon(true);
    setCannonCharge(0);

    // Send P2P cannon message to opponent
    try {
      conn.send({ type: 'FIRE_CANNON' });
    } catch (e) {
      console.error(e);
    }

    // Damage & knockback opponent units
    setTimeout(() => {
      setUnits((prev) =>
        prev.map((u) => {
          if (!u.isMine) {
            return {
              ...u,
              hp: Math.max(1, u.hp - 800),
              state: 'knockback',
              knockbackTimer: 0.5,
              x: Math.min(STAGE_WIDTH - 140, u.x + 100),
            };
          }
          return u;
        })
      );
      setIsFiringCannon(false);
    }, 1200);
  };

  // Send Emote
  const handleSendEmote = (emote: string) => {
    setMyEmote(emote);
    setShowEmotePicker(false);
    audio.playClick();
    setTimeout(() => setMyEmote(null), 3000);
    try {
      conn.send({ type: 'EMOTE', emote });
    } catch (e) {}
  };

  // Camera pan handlers
  const handleCameraScroll = (delta: number) => {
    const containerW = stageContainerRef.current?.clientWidth || 900;
    const maxCam = Math.max(0, STAGE_WIDTH - containerW);
    setCameraX((prev) => Math.max(0, Math.min(maxCam, prev + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartCamXRef.current = cameraX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const diff = dragStartXRef.current - e.clientX;
    const containerW = stageContainerRef.current?.clientWidth || 900;
    const maxCam = Math.max(0, STAGE_WIDTH - containerW);
    setCameraX(Math.max(0, Math.min(maxCam, dragStartCamXRef.current + diff)));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      className="relative w-full h-[100dvh] bg-stone-950 flex flex-col justify-between overflow-hidden select-none font-sans"
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
    >
      {/* Top Status Header */}
      <div className="relative z-30 bg-gradient-to-b from-[#8a4e1d] via-[#63330f] to-[#432007] border-b-[3px] border-[#291102] px-3 sm:px-6 py-2 flex items-center justify-between shadow-lg">
        {/* Left: My Info & Castle HP */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 border-2 border-stone-900 flex items-center justify-center text-xl shadow">
            🐱
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-100 drop-shadow">
              <span>{localPlayer.name} (あなた)</span>
              <span className="text-[10px] text-yellow-300 font-mono">Rank {localPlayer.rank}</span>
            </div>
            {/* My HP Bar */}
            <div className="w-32 sm:w-48 h-3.5 bg-black/80 border border-amber-600 rounded-full overflow-hidden flex items-center p-0.5 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-200"
                style={{ width: `${(myCastleHp / BASE_MAX_HP) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: VS Badge & Timer */}
        <div className="flex flex-col items-center">
          <div className="bg-gradient-to-r from-red-600 to-amber-600 text-white font-black text-[10px] sm:text-xs px-3 py-0.5 rounded-full border border-yellow-300 shadow animate-pulse">
            ⚔️ P2P リアルタイム対戦 ⚔️
          </div>
          <span className="text-xs text-amber-300 font-mono font-black mt-0.5">
            {Math.floor(battleTimer / 60)}:{(Math.floor(battleTimer) % 60).toString().padStart(2, '0')}
          </span>
        </div>

        {/* Right: Opponent Info & Castle HP */}
        <div className="flex items-center gap-3 text-right">
          <div>
            <div className="flex items-center justify-end gap-1.5 text-xs font-black text-rose-100 drop-shadow">
              <span className="text-[10px] text-rose-300 font-mono">Rank {remotePlayer.rank}</span>
              <span>{remotePlayer.name} (対戦相手)</span>
            </div>
            {/* Enemy HP Bar */}
            <div className="w-32 sm:w-48 h-3.5 bg-black/80 border border-red-700 rounded-full overflow-hidden flex items-center justify-end p-0.5 shadow-inner">
              <div
                className="h-full bg-gradient-to-l from-rose-500 to-red-400 rounded-full transition-all duration-200"
                style={{ width: `${(enemyCastleHp / BASE_MAX_HP) * 100}%` }}
              />
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-600 border-2 border-stone-900 flex items-center justify-center text-xl shadow">
            ⚔️
          </div>
        </div>
      </div>

      {/* Battlefield Area (Scrollable Stage) */}
      <div
        ref={stageContainerRef}
        className="relative flex-1 bg-gradient-to-b from-[#87ceeb] via-[#e0f6ff] to-[#7fb77e] overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={(e) => handleCameraScroll(e.deltaY || e.deltaX)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        {/* Sky / Clouds / Hills background */}
        <div
          className="absolute inset-0 transition-transform duration-75 ease-out"
          style={{ transform: `translateX(-${cameraX}px)`, width: `${STAGE_WIDTH}px` }}
        >
          {/* Ground Surface */}
          <div className="absolute bottom-0 inset-x-0 h-28 bg-[#5c8a4d] border-t-4 border-[#3d5e32]">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#2d4424_1.5px,transparent_1.5px)] [background-size:12px_12px]" />
          </div>

          {/* Left Castle (My Base) */}
          <div className="absolute bottom-24 left-10 w-28 h-44 flex flex-col items-center justify-end">
            <div className="relative w-24 h-36 bg-gradient-to-b from-stone-200 to-stone-400 border-4 border-stone-800 rounded-t-3xl shadow-2xl flex flex-col items-center justify-between p-2">
              <div className="text-2xl">🏰</div>
              <div className="w-10 h-10 rounded-full bg-amber-400 border-2 border-stone-900 flex items-center justify-center text-xl shadow">
                🐱
              </div>
              <div className="bg-black/75 px-1.5 py-0.5 rounded text-[9px] text-white font-mono font-bold">
                {myCastleHp.toLocaleString()}
              </div>
            </div>
            {/* Emote over my base */}
            {myEmote && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white border-2 border-black rounded-2xl px-2.5 py-1 text-2xl shadow-xl animate-bounce">
                {myEmote}
              </div>
            )}
          </div>

          {/* Right Castle (Opponent Base) */}
          <div className="absolute bottom-24 right-10 w-28 h-44 flex flex-col items-center justify-end">
            <div className="relative w-24 h-36 bg-gradient-to-b from-stone-800 to-stone-950 border-4 border-red-800 rounded-t-3xl shadow-2xl flex flex-col items-center justify-between p-2">
              <div className="text-2xl">🏯</div>
              <div className="w-10 h-10 rounded-full bg-red-600 border-2 border-stone-900 flex items-center justify-center text-xl shadow">
                👿
              </div>
              <div className="bg-black/75 px-1.5 py-0.5 rounded text-[9px] text-rose-400 font-mono font-bold">
                {enemyCastleHp.toLocaleString()}
              </div>
            </div>
            {/* Emote over enemy base */}
            {enemyEmote && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white border-2 border-black rounded-2xl px-2.5 py-1 text-2xl shadow-xl animate-bounce">
                {enemyEmote}
              </div>
            )}
          </div>

          {/* Cannon Beam Effect (My Cannon) */}
          {isFiringCannon && (
            <div className="absolute bottom-32 left-32 right-32 h-16 bg-gradient-to-r from-amber-400 via-yellow-200 to-red-500 opacity-90 animate-pulse rounded-full shadow-[0_0_30px_rgba(234,179,8,0.9)] flex items-center justify-center">
              <span className="text-white font-black text-xl tracking-widest drop-shadow-md">
                ⚡ にゃんこ砲発射！ ⚡
              </span>
            </div>
          )}

          {/* Cannon Beam Effect (Opponent Cannon) */}
          {enemyFiringCannon && (
            <div className="absolute bottom-32 left-32 right-32 h-16 bg-gradient-to-l from-red-600 via-rose-300 to-purple-600 opacity-90 animate-pulse rounded-full shadow-[0_0_30px_rgba(225,29,72,0.9)] flex items-center justify-center">
              <span className="text-white font-black text-xl tracking-widest drop-shadow-md">
                💥 敵のにゃんこ砲直撃！ 💥
              </span>
            </div>
          )}

          {/* Render Active Units */}
          {units.map((unit) => {
            return (
              <div
                key={unit.id}
                className="absolute bottom-28 transition-transform duration-75"
                style={{
                  left: `${unit.x}px`,
                  transform: `translateX(-50%) ${unit.isMine ? 'scaleX(1)' : 'scaleX(-1)'}`,
                }}
              >
                {/* Unit HP Bar */}
                <div className="w-10 h-1.5 bg-black/60 rounded-full border border-black overflow-hidden mb-1 mx-auto scale-x-100">
                  <div
                    className={`h-full ${unit.isMine ? 'bg-emerald-400' : 'bg-rose-500'}`}
                    style={{ width: `${Math.max(0, (unit.hp / unit.maxHp) * 100)}%` }}
                  />
                </div>

                <UnitSpriteRenderer
                  spriteType={unit.spriteType}
                  isCat={true}
                  state={unit.state === 'knockback' ? 'knockback' : unit.state === 'attack' ? 'attack' : 'walk'}
                  animTimer={unit.animTimer}
                  scale={0.9}
                />
              </div>
            );
          })}

          {/* Floating Damage Numbers */}
          {damageNumbers.map((d) => (
            <div
              key={d.id}
              className="absolute text-yellow-300 font-black text-base font-mono drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] pointer-events-none"
              style={{
                left: `${d.x}px`,
                top: `${d.y}px`,
                opacity: d.opacity,
              }}
            >
              -{d.damage.toLocaleString()}
            </div>
          ))}
        </div>

        {/* Camera Pan Controls (Left & Right Overlay Buttons) */}
        <button
          onClick={() => handleCameraScroll(-350)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-14 bg-black/40 hover:bg-black/70 text-white rounded-r-2xl flex items-center justify-center text-xl z-20 active:scale-95"
        >
          ◀
        </button>
        <button
          onClick={() => handleCameraScroll(350)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-14 bg-black/40 hover:bg-black/70 text-white rounded-l-2xl flex items-center justify-center text-xl z-20 active:scale-95"
        >
          ▶
        </button>
      </div>

      {/* Bottom Production Dashboard & Controls */}
      <div className="relative z-30 bg-gradient-to-b from-[#8a4e1d] via-[#63330f] to-[#432007] border-t-[3px] border-[#291102] p-2 sm:p-3 flex flex-col gap-2 shadow-2xl">
        {/* Top bar of Dashboard: Money, Worker Level, Cannon, Emotes */}
        <div className="flex items-center justify-between gap-2 px-1 text-xs">
          {/* Money Display */}
          <div className="flex items-center gap-2 bg-black/80 border-2 border-amber-500/80 rounded-xl px-3 py-1 text-amber-300 font-mono font-black shadow-inner">
            <span className="text-sm">🪙</span>
            <span className="text-base sm:text-lg">
              ¥{Math.floor(money).toLocaleString()} / {maxMoney.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Worker Cat Button */}
            <button
              onClick={handleWorkerLevelUp}
              disabled={workerLevel >= 8 || money < 100 * workerLevel}
              className={`px-3 py-1.5 rounded-xl border-2 font-black text-xs flex items-center gap-1 shadow active:scale-95 transition-all ${
                workerLevel >= 8
                  ? 'bg-stone-800 border-stone-600 text-stone-500 cursor-not-allowed'
                  : money >= 100 * workerLevel
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 border-yellow-200 text-stone-950 hover:brightness-110'
                  : 'bg-stone-800 border-stone-700 text-stone-400'
              }`}
            >
              <span>💼 働きネコ Lv.{workerLevel}</span>
              {workerLevel < 8 && (
                <span className="text-[10px] font-mono">(¥{100 * workerLevel})</span>
              )}
            </button>

            {/* Cat Cannon Button */}
            <button
              onClick={handleFireCannon}
              disabled={cannonCharge < 100 || isFiringCannon}
              className={`relative px-4 py-1.5 rounded-xl border-2 font-black text-xs flex items-center gap-1.5 shadow active:scale-95 transition-all overflow-hidden ${
                cannonCharge >= 100
                  ? 'bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 border-yellow-300 text-white animate-pulse'
                  : 'bg-stone-800 border-stone-700 text-stone-400'
              }`}
            >
              <Zap size={14} className={cannonCharge >= 100 ? 'text-yellow-200' : ''} />
              <span>にゃんこ砲 ({Math.floor(cannonCharge)}%)</span>
            </button>

            {/* Emotes Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowEmotePicker((prev) => !prev)}
                className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 text-white border border-stone-600 flex items-center justify-center text-lg active:scale-95"
                title="エモート"
              >
                <Smile size={16} />
              </button>

              {showEmotePicker && (
                <div className="absolute bottom-10 right-0 bg-stone-900 border-2 border-amber-500 rounded-2xl p-2 flex gap-1 shadow-2xl z-50">
                  {['😺', '💢', '🔥', '🏆', '💥', '⚡', '🐾', '✨'].map((em) => (
                    <button
                      key={em}
                      onClick={() => handleSendEmote(em)}
                      className="w-8 h-8 hover:bg-stone-800 rounded-lg text-xl flex items-center justify-center transition-transform hover:scale-125"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 10 Deck Production Slots (2 rows of 5) */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {localPlayer.deck.map((cat, idx) => {
            const cd = deckCooldowns[cat.catId] || 0;
            const canAfford = money >= cat.cost && cd <= 0;

            return (
              <button
                key={idx}
                id={`pvp-unit-btn-${idx}`}
                onClick={() => handleSpawnCat(cat)}
                disabled={!canAfford}
                className={`relative h-14 sm:h-16 rounded-xl border-2 flex flex-col items-center justify-between p-1 transition-all overflow-hidden ${
                  canAfford
                    ? 'bg-gradient-to-b from-stone-800 to-stone-900 border-amber-400 text-white hover:brightness-110 active:scale-95 shadow-md'
                    : 'bg-stone-950 border-stone-800 text-stone-500 opacity-70'
                }`}
              >
                {/* Level badge */}
                <div className="absolute top-0.5 left-1 text-[8px] font-mono font-bold text-amber-300">
                  Lv.{cat.level}
                </div>

                {/* Sprite Preview */}
                <div className="h-7 flex items-center justify-center scale-75 mt-1">
                  <UnitSpriteRenderer
                    spriteType={cat.spriteType}
                    isCat={true}
                    state="walk"
                    animTimer={0.5}
                    scale={0.6}
                  />
                </div>

                {/* Name & Cost */}
                <div className="w-full flex items-center justify-between text-[9px] sm:text-[10px] font-black">
                  <span className="truncate max-w-[65%]">{cat.name}</span>
                  <span className="text-yellow-400 font-mono">¥{cat.cost}</span>
                </div>

                {/* Cooldown Overlay */}
                {cd > 0 && (
                  <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-xs font-mono font-bold text-yellow-300">
                    {cd.toFixed(1)}s
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Victory / Defeat Modal */}
      {battleState !== 'playing' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-stone-900 border-4 border-amber-500 rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center space-y-4 animate-scale-up">
            <div className="text-5xl animate-bounce">
              {battleState === 'victory' ? '🏆' : '💀'}
            </div>

            <h2
              className={`text-3xl sm:text-4xl font-black tracking-wider ${
                battleState === 'victory' ? 'text-yellow-400 drop-shadow-[0_2px_4px_rgba(234,179,8,0.8)]' : 'text-rose-500'
              }`}
            >
              {battleState === 'victory' ? '完全勝利！！' : '敗北...'}
            </h2>

            <p className="text-xs text-stone-300 font-bold">
              {battleState === 'victory'
                ? '素晴らしい戦術でにゃんこ軍団の猛攻を制覇したにゃ！'
                : '相手の軍団に押し切られてしまったにゃ...次こそリベンジだにゃ！'}
            </p>

            {battleState === 'victory' && (
              <div className="w-full bg-stone-950 border border-amber-500/40 rounded-2xl p-3 flex justify-around text-xs font-black">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span>✨ 経験値:</span>
                  <span className="text-sm font-mono">+15,000 XP</span>
                </div>
                <div className="flex items-center gap-1.5 text-yellow-400">
                  <span>🥫 ネコカン:</span>
                  <span className="text-sm font-mono">+30個</span>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                audio.playClick();
                onExit({
                  victory: battleState === 'victory',
                  xpEarned: battleState === 'victory' ? 15000 : 2000,
                  catFoodEarned: battleState === 'victory' ? 30 : 0,
                });
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-sm border-2 border-yellow-200 shadow-xl active:scale-95 transition-all"
            >
              ネコ基地へ戻る
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
