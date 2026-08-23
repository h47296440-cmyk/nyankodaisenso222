import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Target,
  Flag,
  Crosshair,
} from 'lucide-react';
import { TREASURES } from '../../data/stages';

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

const STAGE_WIDTH = 2200; // 広大で戦略性の高い戦場幅

export const PvpBattleScreen: React.FC<PvpBattleScreenProps> = ({ payload, onExit }) => {
  const { conn, isHost, localPlayer, remotePlayer } = payload;

  // =========================================================================
  // 1. お宝効果 & 施設レベルの計算 (TREASURE & FACILITY BUFFS)
  // =========================================================================
  const localProfile = localPlayer.profile;
  const collectedTreasures = localProfile?.treasures || {};
  const facilities = localProfile?.facilities || {
    workerEfficiency: 1,
    workerWallet: 1,
    castleHealth: 1,
    cannonPower: 1,
    cannonChargeRate: 1,
    xpBonus: 1,
  };

  // お宝倍率の計算
  const treasureBuffs = useMemo(() => {
    let catHpBuff = 0;
    let catAtkBuff = 0;
    let moneyRateBuff = 0;
    let moneyCapBuff = 0;
    let cannonChargeBuff = 0;

    Object.entries(collectedTreasures).forEach(([key, quality]) => {
      if (quality === 'none') return;
      const t = TREASURES[key];
      if (!t) return;
      const qMult = quality === 'gold' ? 1.0 : quality === 'silver' ? 0.65 : 0.35;
      const value = t.buffValue * qMult;

      switch (t.buffType) {
        case 'cat_hp':
          catHpBuff += value;
          break;
        case 'cat_atk':
          catAtkBuff += value;
          break;
        case 'money_rate':
          moneyRateBuff += value;
          break;
        case 'money_cap':
          moneyCapBuff += value;
          break;
        case 'cannon_charge':
          cannonChargeBuff += value;
          break;
      }
    });

    return {
      catHpMult: 1 + catHpBuff,
      catAtkMult: 1 + catAtkBuff,
      moneyRateMult: 1 + moneyRateBuff,
      moneyCapMult: 1 + moneyCapBuff,
      cannonChargeMult: 1 + cannonChargeBuff,
    };
  }, [collectedTreasures]);

  // 施設レベルに基づいた初期値計算
  const baseCastleHp = 40000 + (facilities.castleHealth - 1) * 4000;
  const initialWorkerLvl = 1;
  const baseMoneyCap = 500 + initialWorkerLvl * 250 + (facilities.workerWallet - 1) * 150;
  const initialMaxMoney = Math.round(baseMoneyCap * treasureBuffs.moneyCapMult);
  const initialMoney = 150;

  // Castle HPs
  const [myCastleHp, setMyCastleHp] = useState<number>(baseCastleHp);
  const [enemyCastleHp, setEnemyCastleHp] = useState<number>(baseCastleHp);

  // Economy
  const [money, setMoney] = useState<number>(initialMoney);
  const [workerLevel, setWorkerLevel] = useState<number>(initialWorkerLvl);

  const maxMoney = useMemo(() => {
    const cap = 500 + workerLevel * 250 + (facilities.workerWallet - 1) * 150;
    return Math.round(cap * treasureBuffs.moneyCapMult);
  }, [workerLevel, facilities.workerWallet, treasureBuffs.moneyCapMult]);

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
  const [pingMs, setPingMs] = useState<number>(20);

  const stageContainerRef = useRef<HTMLDivElement>(null);
  const unitsRef = useRef<ActivePvpUnit[]>([]);
  const myCastleHpRef = useRef<number>(baseCastleHp);
  const enemyCastleHpRef = useRef<number>(baseCastleHp);
  const lastTimeRef = useRef<number>(performance.now());
  const lastSyncTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Drag tracking
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartCamXRef = useRef(0);

  // Keep refs in sync
  unitsRef.current = units;
  myCastleHpRef.current = myCastleHp;
  enemyCastleHpRef.current = enemyCastleHp;

  // =========================================================================
  // 2. P2P SYNC & PEER MESSAGE HANDLING (P2P通信＆位置・HP同期)
  // =========================================================================
  useEffect(() => {
    const handleData = (data: any) => {
      if (!data || typeof data !== 'object') return;

      switch (data.type) {
        case 'SPAWN_CAT': {
          const u = data.unit;
          if (u) {
            audio.playCatSpawn(0.9);
            const newUnit: ActivePvpUnit = {
              id: u.id || `remote-${Date.now()}-${Math.random()}`,
              isMine: false,
              name: u.name,
              spriteType: u.spriteType,
              x: STAGE_WIDTH - 140, // 相手陣地から左へ向けて進軍
              hp: u.hp,
              maxHp: u.maxHp || u.hp,
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

        // 定期同期パケット: 相手の自軍ユニット位置とHPを受信して同期補正
        case 'SYNC_STATE': {
          if (data.myUnits && Array.isArray(data.myUnits)) {
            setUnits((prev) => {
              const myUnits = prev.filter((u) => u.isMine);
              const remoteUnitsMap = new Map<string, any>(data.myUnits.map((ru: any) => [ru.id, ru]));

              const updatedRemoteUnits: ActivePvpUnit[] = [];
              remoteUnitsMap.forEach((ru, id) => {
                const existing = prev.find((u) => !u.isMine && u.id === id);
                // 相手から見た x 座標は、こちらから見ると (STAGE_WIDTH - ru.x)
                const mirroredX = STAGE_WIDTH - ru.x;

                if (existing) {
                  updatedRemoteUnits.push({
                    ...existing,
                    x: Math.abs(existing.x - mirroredX) > 40 ? mirroredX : existing.x * 0.7 + mirroredX * 0.3,
                    hp: ru.hp,
                    state: ru.state || existing.state,
                  });
                }
              });

              return [...myUnits, ...updatedRemoteUnits];
            });
          }

          if (typeof data.castleHp === 'number') {
            setEnemyCastleHp(data.castleHp);
          }
          break;
        }

        case 'FIRE_CANNON': {
          setEnemyFiringCannon(true);
          audio.playCannonFire();
          setTimeout(() => setEnemyFiringCannon(false), 1200);

          // 相手のにゃんこ砲直撃！味方全員にダメージ＆ノックバック
          const cannonDamage = 800 + (data.cannonPower || 1) * 150;
          setUnits((prev) =>
            prev.map((u) => {
              if (u.isMine) {
                return {
                  ...u,
                  hp: Math.max(1, u.hp - cannonDamage),
                  state: 'knockback',
                  knockbackTimer: 0.5,
                  x: Math.max(140, u.x - 120),
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

        case 'PING': {
          if (data.time) {
            setPingMs(Math.max(5, Math.min(250, Math.round((Date.now() - data.time) / 2))));
          }
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

  // =========================================================================
  // 3. MAIN GAME PHYSICS LOOP (60FPS Frame-Accurate Update)
  // =========================================================================
  useEffect(() => {
    if (battleState !== 'playing') return;

    let isRunning = true;

    const gameLoop = (time: number) => {
      if (!isRunning) return;

      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      // 働きネコ仕事効率とお宝を反映したお金増加
      const moneyPerSec = (18 + workerLevel * 12 + (facilities.workerEfficiency - 1) * 6) * treasureBuffs.moneyRateMult;
      setMoney((prev) => Math.min(maxMoney, prev + moneyPerSec * dt));

      // にゃんこ砲チャージ速度
      const cannonChargePerSec = (3.0 + (facilities.cannonChargeRate - 1) * 0.8) * treasureBuffs.cannonChargeMult;
      setCannonCharge((prev) => Math.min(100, prev + cannonChargePerSec * dt));

      // タイマー更新
      setBattleTimer((prev) => prev + dt);

      // クールダウン減衰
      setDeckCooldowns((prev) => {
        const next: { [k: string]: number } = {};
        for (const [k, v] of Object.entries(prev)) {
          const numV = typeof v === 'number' ? v : 0;
          if (numV > dt) next[k] = numV - dt;
        }
        return next;
      });

      // ダメージ数値アニメーション
      setDamageNumbers((prev) =>
        prev
          .map((d) => ({ ...d, y: d.y - 35 * dt, opacity: d.opacity - 1.4 * dt }))
          .filter((d) => d.opacity > 0)
      );

      // 定期同期送信 (0.25秒毎)
      if (time - lastSyncTimeRef.current > 250) {
        lastSyncTimeRef.current = time;
        try {
          const myActiveUnits = unitsRef.current
            .filter((u) => u.isMine && u.hp > 0)
            .map((u) => ({
              id: u.id,
              x: u.x,
              hp: u.hp,
              state: u.state,
            }));

          conn.send({
            type: 'SYNC_STATE',
            myUnits: myActiveUnits,
            castleHp: myCastleHpRef.current,
            time: Date.now(),
          });
        } catch (e) {
          // ignore transient P2P buffer errors
        }
      }

      // 戦場シミュレーション
      const currentUnits = [...unitsRef.current];
      const nextUnits: ActivePvpUnit[] = [];
      const newDamages: DamageNumber[] = [];

      let myBaseDamageAccum = 0;
      let enemyBaseDamageAccum = 0;

      for (let i = 0; i < currentUnits.length; i++) {
        const u = { ...currentUnits[i] };
        u.animTimer += dt;
        if (u.attackCooldown > 0) u.attackCooldown -= dt;

        // ノックバック処理
        if (u.state === 'knockback') {
          u.knockbackTimer -= dt;
          if (u.knockbackTimer <= 0) {
            u.state = 'walk';
          }
          nextUnits.push(u);
          continue;
        }

        if (u.isMine) {
          // 自軍ユニット: 右（x増加）へ前進
          const enemyInFront = currentUnits
            .filter((o) => !o.isMine && o.x > u.x && o.hp > 0)
            .sort((a, b) => a.x - b.x)[0];

          const enemyDistance = enemyInFront ? enemyInFront.x - u.x : 9999;
          const castleDistance = STAGE_WIDTH - 140 - u.x;

          if (enemyInFront && enemyDistance <= u.attackRange) {
            // 敵ユニット攻撃
            if (u.attackCooldown <= 0) {
              u.state = 'attack';
              u.attackCooldown = Math.max(0.4, 1 / u.attackSpeed);
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
                enemyInFront.knockbackTimer = 0.35;
                enemyInFront.x = Math.min(STAGE_WIDTH - 140, enemyInFront.x + 60);
              }
            } else {
              u.state = 'walk';
            }
          } else if (castleDistance <= u.attackRange) {
            // 敵城攻撃
            if (u.attackCooldown <= 0) {
              u.state = 'attack';
              u.attackCooldown = Math.max(0.4, 1 / u.attackSpeed);
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
            // ★通常前進（正規化速度: u.speed * dt）
            u.state = 'walk';
            u.x += u.speed * dt;
          }
        } else {
          // 敵軍ユニット: 左（x減少）へ前進
          const myUnitInFront = currentUnits
            .filter((o) => o.isMine && o.x < u.x && o.hp > 0)
            .sort((a, b) => b.x - a.x)[0];

          const myUnitDistance = myUnitInFront ? u.x - myUnitInFront.x : 9999;
          const myCastleDistance = u.x - 140;

          if (myUnitInFront && myUnitDistance <= u.attackRange) {
            if (u.attackCooldown <= 0) {
              u.state = 'attack';
              u.attackCooldown = Math.max(0.4, 1 / u.attackSpeed);
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
                myUnitInFront.knockbackTimer = 0.35;
                myUnitInFront.x = Math.max(140, myUnitInFront.x - 60);
              }
            } else {
              u.state = 'walk';
            }
          } else if (myCastleDistance <= u.attackRange) {
            if (u.attackCooldown <= 0) {
              u.state = 'attack';
              u.attackCooldown = Math.max(0.4, 1 / u.attackSpeed);
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
            // ★通常前進（正規化速度: u.speed * dt）
            u.state = 'walk';
            u.x -= u.speed * dt;
          }
        }

        // 生存判定
        if (u.hp > 0) {
          nextUnits.push(u);
        }
      }

      setUnits(nextUnits);

      if (newDamages.length > 0) {
        setDamageNumbers((prev) => [...prev, ...newDamages]);
      }

      // 城ダメージ適用
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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [battleState, maxMoney, workerLevel, facilities, treasureBuffs]);

  // =========================================================================
  // 4. SPAWN & ACTION HANDLERS
  // =========================================================================
  const handleSpawnCat = (catSlot: any) => {
    if (money < catSlot.cost) {
      audio.playBuzzer();
      return;
    }

    const currentCd = deckCooldowns[catSlot.catId] || 0;
    if (currentCd > 0) {
      audio.playBuzzer();
      return;
    }

    setMoney((prev) => prev - catSlot.cost);
    setDeckCooldowns((prev) => ({
      ...prev,
      [catSlot.catId]: catSlot.cooldown || 2.5,
    }));

    audio.playCatSpawn(1.0);

    const unitHp = Math.round(catSlot.hp * treasureBuffs.catHpMult);
    const unitAtk = Math.round(catSlot.attackPower * treasureBuffs.catAtkMult);

    const newUnit: ActivePvpUnit = {
      id: `mine-${Date.now()}-${Math.random()}`,
      isMine: true,
      name: catSlot.name,
      spriteType: catSlot.spriteType,
      x: 140,
      hp: unitHp,
      maxHp: unitHp,
      attackPower: unitAtk,
      attackRange: catSlot.attackRange,
      attackSpeed: catSlot.attackSpeed,
      speed: catSlot.speed,
      state: 'walk',
      animTimer: 0,
      attackCooldown: 0,
      knockbackTimer: 0,
      width: 50,
    };

    setUnits((prev) => [...prev, newUnit]);

    // 相手へ出撃情報を送信
    try {
      conn.send({
        type: 'SPAWN_CAT',
        unit: {
          id: newUnit.id,
          name: catSlot.name,
          spriteType: catSlot.spriteType,
          hp: unitHp,
          maxHp: unitHp,
          attackPower: unitAtk,
          attackRange: catSlot.attackRange,
          attackSpeed: catSlot.attackSpeed,
          speed: catSlot.speed,
        },
      });
    } catch (err) {
      console.error('Failed to send spawn event', err);
    }
  };

  const handleWorkerLevelUp = () => {
    const upgradeCost = Math.round(80 * Math.pow(workerLevel, 1.35));
    if (workerLevel >= 8 || money < upgradeCost) {
      audio.playBuzzer();
      return;
    }
    audio.playLevelUp();
    setMoney((prev) => prev - upgradeCost);
    setWorkerLevel((prev) => prev + 1);
  };

  const handleFireCannon = () => {
    if (cannonCharge < 100 || isFiringCannon) {
      audio.playBuzzer();
      return;
    }

    audio.playCannonFire();
    setCannonCharge(0);
    setIsFiringCannon(true);
    setTimeout(() => setIsFiringCannon(false), 1200);

    const myCannonPower = 1000 + (facilities.cannonPower - 1) * 250;

    // 敵軍全体へダメージ＆ノックバック
    setUnits((prev) =>
      prev.map((u) => {
        if (!u.isMine) {
          return {
            ...u,
            hp: Math.max(1, u.hp - myCannonPower),
            state: 'knockback',
            knockbackTimer: 0.5,
            x: Math.min(STAGE_WIDTH - 140, u.x + 120),
          };
        }
        return u;
      })
    );

    try {
      conn.send({
        type: 'FIRE_CANNON',
        cannonPower: facilities.cannonPower,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendEmote = (emote: string) => {
    setMyEmote(emote);
    setShowEmotePicker(false);
    audio.playClick();
    setTimeout(() => setMyEmote(null), 3000);

    try {
      conn.send({
        type: 'EMOTE',
        emote,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleVictory = () => {
    if (battleState !== 'playing') return;
    setBattleState('victory');
    audio.playVictoryFanfare();
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
    });
  };

  const handleDefeat = () => {
    if (battleState !== 'playing') return;
    setBattleState('defeat');
    audio.playDefeatSound();
  };

  // =========================================================================
  // 5. CAMERA SCROLL CONTROLS
  // =========================================================================
  const handleCameraScroll = (delta: number) => {
    const containerWidth = stageContainerRef.current?.clientWidth || 800;
    const maxCamX = Math.max(0, STAGE_WIDTH - containerWidth);
    setCameraX((prev) => Math.max(0, Math.min(maxCamX, prev + delta)));
  };

  const snapCameraTo = (position: 'my_base' | 'mid' | 'enemy_base') => {
    const containerWidth = stageContainerRef.current?.clientWidth || 800;
    const maxCamX = Math.max(0, STAGE_WIDTH - containerWidth);
    audio.playClick();
    if (position === 'my_base') setCameraX(0);
    else if (position === 'mid') setCameraX(maxCamX / 2);
    else if (position === 'enemy_base') setCameraX(maxCamX);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartCamXRef.current = cameraX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = dragStartXRef.current - e.clientX;
    const containerWidth = stageContainerRef.current?.clientWidth || 800;
    const maxCamX = Math.max(0, STAGE_WIDTH - containerWidth);
    setCameraX(Math.max(0, Math.min(maxCamX, dragStartCamXRef.current + deltaX)));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Touch drag support for mobile/tablets
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStartXRef.current = e.touches[0].clientX;
      dragStartCamXRef.current = cameraX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const deltaX = dragStartXRef.current - e.touches[0].clientX;
    const containerWidth = stageContainerRef.current?.clientWidth || 800;
    const maxCamX = Math.max(0, STAGE_WIDTH - containerWidth);
    setCameraX(Math.max(0, Math.min(maxCamX, dragStartCamXRef.current + deltaX)));
  };

  return (
    <div
      className="relative w-full h-screen bg-black select-none overflow-hidden flex flex-col justify-between"
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
    >
      {/* Top HUD Header: Player Info, Castles, Emotes, Camera Nav */}
      <div className="relative z-40 bg-stone-950/90 border-b-2 border-amber-600/60 p-2 sm:p-3 flex items-center justify-between text-white shadow-xl backdrop-blur-md">
        {/* Left Player (Me) */}
        <div className="flex items-center gap-2 max-w-[35%]">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 border-2 border-amber-200 flex items-center justify-center text-xl shadow">
            🐱
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1">
              <span className="truncate">{localPlayer.name} (YOU)</span>
            </div>
            <div className="text-[10px] text-stone-400 font-mono">
              城HP: <span className="text-emerald-400 font-bold">{myCastleHp.toLocaleString()}</span> / {baseCastleHp.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Center: Camera Quick Nav Buttons & Timer */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1 bg-stone-900 border border-stone-700 rounded-full px-2 py-0.5 shadow-inner">
            <button
              onClick={() => snapCameraTo('my_base')}
              className="px-2 py-0.5 text-[10px] font-black rounded-full bg-stone-800 hover:bg-amber-600 text-stone-200 hover:text-white transition-colors"
            >
              🏰 自城
            </button>
            <button
              onClick={() => snapCameraTo('mid')}
              className="px-2 py-0.5 text-[10px] font-black rounded-full bg-stone-800 hover:bg-amber-600 text-stone-200 hover:text-white transition-colors"
            >
              ⚔️ 前線
            </button>
            <button
              onClick={() => snapCameraTo('enemy_base')}
              className="px-2 py-0.5 text-[10px] font-black rounded-full bg-stone-800 hover:bg-amber-600 text-stone-200 hover:text-white transition-colors"
            >
              🏯 敵城
            </button>
          </div>
          <div className="text-[11px] font-mono font-bold text-amber-400 flex items-center gap-2">
            <span>⏱️ {Math.floor(battleTimer / 60)}:{(Math.floor(battleTimer % 60)).toString().padStart(2, '0')}</span>
            <span className="text-[9px] text-emerald-400">📶 {pingMs}ms</span>
          </div>
        </div>

        {/* Right Player (Remote) */}
        <div className="flex items-center justify-end gap-2 max-w-[35%]">
          <div className="text-right">
            <div className="text-xs sm:text-sm font-black text-rose-300 flex items-center justify-end gap-1">
              <span className="truncate">{remotePlayer.name}</span>
            </div>
            <div className="text-[10px] text-stone-400 font-mono">
              城HP: <span className="text-rose-400 font-bold">{enemyCastleHp.toLocaleString()}</span> / {baseCastleHp.toLocaleString()}
            </div>
          </div>
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-700 to-red-500 border-2 border-rose-300 flex items-center justify-center text-xl shadow">
            👿
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {/* Stage Content */}
        <div
          className="absolute inset-0 transition-transform duration-75 ease-out"
          style={{ transform: `translateX(-${cameraX}px)`, width: `${STAGE_WIDTH}px` }}
        >
          {/* Ground Surface */}
          <div className="absolute bottom-0 inset-x-0 h-28 bg-[#5c8a4d] border-t-4 border-[#3d5e32]">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#2d4424_1.5px,transparent_1.5px)] [background-size:12px_12px]" />
          </div>

          {/* Left Castle (My Base: x=140) */}
          <div className="absolute bottom-24 left-10 w-36 h-52 flex flex-col items-center justify-end">
            <div className="relative w-32 h-44 bg-gradient-to-b from-stone-100 via-stone-200 to-stone-400 border-4 border-stone-900 rounded-t-3xl shadow-2xl flex flex-col items-center justify-between p-2">
              <div className="text-3xl">🏰</div>
              <div className="w-12 h-12 rounded-full bg-amber-400 border-2 border-stone-900 flex items-center justify-center text-2xl shadow">
                🐱
              </div>
              <div className="w-full bg-black/80 px-2 py-1 rounded text-[10px] text-white font-mono font-bold text-center border border-amber-500/50">
                {myCastleHp.toLocaleString()}
              </div>
            </div>
            {/* Emote over my base */}
            {myEmote && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white border-2 border-black rounded-2xl px-3 py-1 text-3xl shadow-2xl animate-bounce">
                {myEmote}
              </div>
            )}
          </div>

          {/* Right Castle (Opponent Base: x=STAGE_WIDTH-140) */}
          <div className="absolute bottom-24 right-10 w-36 h-52 flex flex-col items-center justify-end">
            <div className="relative w-32 h-44 bg-gradient-to-b from-stone-800 via-stone-900 to-black border-4 border-rose-700 rounded-t-3xl shadow-2xl flex flex-col items-center justify-between p-2">
              <div className="text-3xl">🏯</div>
              <div className="w-12 h-12 rounded-full bg-rose-600 border-2 border-stone-900 flex items-center justify-center text-2xl shadow">
                👿
              </div>
              <div className="w-full bg-black/80 px-2 py-1 rounded text-[10px] text-rose-400 font-mono font-bold text-center border border-rose-500/50">
                {enemyCastleHp.toLocaleString()}
              </div>
            </div>
            {/* Emote over enemy base */}
            {enemyEmote && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white border-2 border-black rounded-2xl px-3 py-1 text-3xl shadow-2xl animate-bounce">
                {enemyEmote}
              </div>
            )}
          </div>

          {/* Cannon Beam Effect (My Cannon) */}
          {isFiringCannon && (
            <div className="absolute bottom-32 left-32 right-32 h-20 bg-gradient-to-r from-amber-400 via-yellow-200 to-red-500 opacity-90 animate-pulse rounded-full shadow-[0_0_40px_rgba(234,179,8,0.9)] flex items-center justify-center z-30">
              <span className="text-white font-black text-2xl tracking-widest drop-shadow-md">
                ⚡ にゃんこ砲発射！！ ⚡
              </span>
            </div>
          )}

          {/* Cannon Beam Effect (Opponent Cannon) */}
          {enemyFiringCannon && (
            <div className="absolute bottom-32 left-32 right-32 h-20 bg-gradient-to-l from-red-600 via-rose-300 to-purple-600 opacity-90 animate-pulse rounded-full shadow-[0_0_40px_rgba(225,29,72,0.9)] flex items-center justify-center z-30">
              <span className="text-white font-black text-2xl tracking-widest drop-shadow-md">
                💥 敵のにゃんこ砲直撃！！ 💥
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
                <div className="w-12 h-2 bg-black/70 rounded-full border border-black overflow-hidden mb-1 mx-auto scale-x-100 shadow">
                  <div
                    className={`h-full transition-all ${unit.isMine ? 'bg-emerald-400' : 'bg-rose-500'}`}
                    style={{ width: `${Math.max(0, (unit.hp / unit.maxHp) * 100)}%` }}
                  />
                </div>

                <UnitSpriteRenderer
                  spriteType={unit.spriteType}
                  isCat={true}
                  state={unit.state === 'knockback' ? 'knockback' : unit.state === 'attack' ? 'attack' : 'walk'}
                  animTimer={unit.animTimer}
                  scale={0.95}
                />
              </div>
            );
          })}

          {/* Floating Damage Numbers */}
          {damageNumbers.map((d) => (
            <div
              key={d.id}
              className="absolute text-yellow-300 font-black text-lg font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] pointer-events-none z-40"
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

        {/* Camera Left/Right Buttons */}
        <button
          onClick={() => handleCameraScroll(-400)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-16 bg-black/50 hover:bg-black/80 text-white rounded-r-2xl flex items-center justify-center text-2xl z-30 shadow-lg active:scale-95 transition-all"
        >
          ◀
        </button>
        <button
          onClick={() => handleCameraScroll(400)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-16 bg-black/50 hover:bg-black/80 text-white rounded-l-2xl flex items-center justify-center text-2xl z-30 shadow-lg active:scale-95 transition-all"
        >
          ▶
        </button>
      </div>

      {/* Bottom Production Dashboard & Controls */}
      <div className="relative z-40 bg-gradient-to-b from-[#8a4e1d] via-[#63330f] to-[#432007] border-t-[3px] border-[#291102] p-2 sm:p-3 flex flex-col gap-2 shadow-2xl">
        {/* Top bar of Dashboard: Money, Worker Level, Cannon, Emotes */}
        <div className="flex items-center justify-between gap-2 px-1 text-xs">
          {/* Money Display */}
          <div className="flex items-center gap-2 bg-black/85 border-2 border-amber-500/80 rounded-xl px-3.5 py-1.5 text-amber-300 font-mono font-black shadow-inner">
            <span className="text-base">🪙</span>
            <span className="text-base sm:text-lg">
              ¥{Math.floor(money).toLocaleString()} / {maxMoney.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Worker Cat Button */}
            {(() => {
              const upgradeCost = Math.round(80 * Math.pow(workerLevel, 1.35));
              const canUpgrade = workerLevel < 8 && money >= upgradeCost;

              return (
                <button
                  onClick={handleWorkerLevelUp}
                  disabled={!canUpgrade}
                  className={`px-3 py-1.5 rounded-xl border-2 font-black text-xs flex items-center gap-1.5 shadow active:scale-95 transition-all ${
                    workerLevel >= 8
                      ? 'bg-stone-800 border-stone-600 text-stone-500 cursor-not-allowed'
                      : canUpgrade
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 border-yellow-200 text-stone-950 hover:brightness-110'
                      : 'bg-stone-800 border-stone-700 text-stone-400'
                  }`}
                >
                  <span>💼 働きネコ Lv.{workerLevel}</span>
                  {workerLevel < 8 && (
                    <span className="text-[10px] font-mono">(¥{upgradeCost})</span>
                  )}
                </button>
              );
            })()}

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
                <div className="absolute bottom-10 right-0 bg-stone-900 border-2 border-amber-500 rounded-2xl p-2 flex gap-1.5 shadow-2xl z-50">
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
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-xs font-mono font-bold text-yellow-300">
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
