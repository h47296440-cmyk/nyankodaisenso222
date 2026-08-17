import React, { useState, useEffect, useRef } from 'react';
import {
  StageDefinition,
  PlayerProfile,
  ActiveEntity,
  DamageNumber,
  VisualEffect,
  TreasureQuality,
  AttackType,
} from '../../types';
import { CAT_DEFINITIONS, ENEMY_DEFINITIONS } from '../../data/units';
import { TREASURES } from '../../data/stages';
import { BattleCanvas } from './BattleCanvas';
import { BattleHud } from './BattleHud';
import { BattleResultModal } from './BattleResultModal';
import { audio } from '../../utils/audio';

interface BattleScreenProps {
  stage: StageDefinition;
  profile: PlayerProfile;
  onBattleEnd: (result: {
    victory: boolean;
    xpEarned: number;
    catFoodEarned: number;
    treasureQuality?: TreasureQuality;
  }) => void;
  onExit: () => void;
  onNextStage?: () => void;
  hasNextStage: boolean;
}

export const BattleScreen: React.FC<BattleScreenProps> = ({
  stage,
  profile,
  onBattleEnd,
  onExit,
  onNextStage,
  hasNextStage,
}) => {
  // Apply passive treasure buffs and base upgrades
  const workerRateLevel = profile.upgrades?.workerCatRate || 1;
  const workerWalletLevel = profile.upgrades?.workerCatWallet || 1;
  const castleHpLevel = profile.upgrades?.castleHealth || 1;
  const cannonPowerLevel = profile.upgrades?.cannonPower || 1;
  const cannonChargeLevel = profile.upgrades?.cannonCharge || 1;
  const researchLevel = profile.upgrades?.researchSpeed || 1;

  // Treasure bonuses
  let treasureMoneyRateMult = 1.0;
  let treasureMoneyCapMult = 1.0;
  let treasureCatHpMult = 1.0;
  let treasureCatAtkMult = 1.0;
  let treasureCannonPowerMult = 1.0;
  let treasureCannonChargeMult = 1.0;

  Object.entries(profile.treasures || {}).forEach(([stageKey, quality]) => {
    const tr = TREASURES[stageKey];
    if (tr && quality !== 'none') {
      const qMult = quality === 'gold' ? 1.0 : quality === 'silver' ? 0.7 : 0.4;
      const boost = tr.buffValue * qMult;
      if (tr.buffType === 'money_rate') treasureMoneyRateMult += boost;
      if (tr.buffType === 'money_cap') treasureMoneyCapMult += boost;
      if (tr.buffType === 'cat_hp') treasureCatHpMult += boost;
      if (tr.buffType === 'cat_atk') treasureCatAtkMult += boost;
      if (tr.buffType === 'cannon_power') treasureCannonPowerMult += boost;
      if (tr.buffType === 'cannon_charge') treasureCannonChargeMult += boost;
    }
  });

  const basePlayerCastleHp = Math.round((2000 + castleHpLevel * 500) * treasureCatHpMult);
  const battlefieldWidth = stage.battlefieldWidth || 1800;

  // Battle State
  const [playerCastleHp, setPlayerCastleHp] = useState(basePlayerCastleHp);
  const [enemyCastleHp, setEnemyCastleHp] = useState(stage.castleHp);
  const [workerLevel, setWorkerLevel] = useState(1);
  const [money, setMoney] = useState(100);
  const [cannonProgress, setCannonProgress] = useState(0);
  const [isCannonFiring, setIsCannonFiring] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isAutoBattle, setIsAutoBattle] = useState(false);
  const [cameraX, setCameraX] = useState(0);
  const [bossAlert, setBossAlert] = useState<string | null>(null);

  // Entities & visual fx
  const [cats, setCats] = useState<ActiveEntity[]>([]);
  const [enemies, setEnemies] = useState<ActiveEntity[]>([]);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [visualEffects, setVisualEffects] = useState<VisualEffect[]>([]);

  // Deck cooldowns
  const [deckCooldowns, setDeckCooldowns] = useState<Record<string, number>>({});

  // End State
  const [battleResult, setBattleResult] = useState<{
    ended: boolean;
    victory: boolean;
    xpEarned: number;
    catFoodEarned: number;
    treasureDropped: { name: string; quality: TreasureQuality; description: string } | null;
  }>({
    ended: false,
    victory: false,
    xpEarned: 0,
    catFoodEarned: 0,
    treasureDropped: null,
  });

  // Timers & Waves tracking
  const battleTimeRef = useRef(0);
  const spawnedWaveIndicesRef = useRef<Set<number>>(new Set());
  const spawnedThresholdWavesRef = useRef<Set<number>>(new Set());
  const isTerminatedRef = useRef(false);

  // Maximum Money based on worker level
  const baseCap = 500 + workerLevel * 250 + (workerWalletLevel - 1) * 150;
  const maxMoney = Math.round(baseCap * treasureMoneyCapMult);

  // Worker Cat Level Up Cost
  const workerUpgradeCost = Math.round(80 * Math.pow(workerLevel, 1.4));
  const maxWorkerLevel = 8;

  // Deck definition mapping
  const deckSlotDefs = profile.deck.slice(0, 10).map((catId) => {
    const def = CAT_DEFINITIONS.find((c) => c.id === catId) || CAT_DEFINITIONS[0];
    const catProg = profile.cats[catId];
    const activeFormIndex = catProg ? catProg.activeForm : 0;
    const form = def.forms[activeFormIndex];
    const cdReduction = (researchLevel - 1) * 0.05; // 5% cd reduction per level
    const maxCooldown = Math.max(1.0, form.cooldown * (1 - cdReduction));
    return {
      def,
      activeFormIndex,
      cooldownRemaining: deckCooldowns[catId] || 0,
      maxCooldown,
      cost: form.cost,
    };
  });

  // Start BGM on mount
  useEffect(() => {
    audio.startBattleBgm();
    return () => {
      audio.stopBattleBgm();
    };
  }, []);

  // Main 60fps Game Loop
  useEffect(() => {
    let lastTime = performance.now();
    let animationFrameId: number;

    const gameTick = (now: number) => {
      const deltaRaw = (now - lastTime) / 1000;
      lastTime = now;

      if (!isPaused && !battleResult.ended && !isTerminatedRef.current) {
        const dt = Math.min(0.1, deltaRaw) * gameSpeed;
        battleTimeRef.current += dt;

        // 1. Money Generation
        const ratePerSec = (15 + workerLevel * 12 + (workerRateLevel - 1) * 8) * treasureMoneyRateMult;
        setMoney((prev) => Math.min(maxMoney, prev + ratePerSec * dt));

        // 2. Cannon Charging
        const cannonChargeRate = (1.5 + cannonChargeLevel * 0.4) * treasureCannonChargeMult;
        setCannonProgress((prev) => Math.min(100, prev + cannonChargeRate * dt));

        // 3. Deck Cooldown countdowns
        setDeckCooldowns((prev) => {
          const next: Record<string, number> = {};
          let changed = false;
          Object.entries(prev).forEach(([id, rem]) => {
            const remNum = Number(rem);
            if (remNum > 0) {
              const updated = Math.max(0, remNum - dt);
              next[id] = updated;
              changed = true;
            }
          });
          return changed ? next : prev;
        });

        // 4. Wave Spawner
        stage.waves.forEach((wave, idx) => {
          // Time-based wave
          if (wave.timeSeconds > 0 && battleTimeRef.current >= wave.timeSeconds && !spawnedWaveIndicesRef.current.has(idx)) {
            spawnedWaveIndicesRef.current.add(idx);
            spawnEnemy(wave.enemyId, wave.boss);
          }

          // Castle HP threshold wave
          if (wave.castleHpThreshold && !spawnedThresholdWavesRef.current.has(idx)) {
            const hpPercent = (enemyCastleHp / stage.castleHp) * 100;
            if (hpPercent <= wave.castleHpThreshold) {
              spawnedThresholdWavesRef.current.add(idx);
              spawnEnemy(wave.enemyId, wave.boss);
              if (wave.boss && stage.bossAlert) {
                setBossAlert(stage.bossAlert);
                audio.playHit(true, true);
                setTimeout(() => setBossAlert(null), 4000);
              }
            }
          }
        });

        // 5. Update Active Units Physics, Attacks, and States
        updateEntities(dt);

        // 6. Update Visual Effects & Damage Numbers
        setDamageNumbers((prev) =>
          prev
            .map((d) => ({ ...d, lifetime: d.lifetime + dt }))
            .filter((d) => d.lifetime < d.maxLifetime)
        );

        setVisualEffects((prev) =>
          prev
            .map((fx) => ({ ...fx, lifetime: fx.lifetime + dt }))
            .filter((fx) => fx.lifetime < fx.maxLifetime)
        );

        // 7. Auto-Battle Logic (ニャンピューター)
        if (isAutoBattle) {
          handleAutoBattleTick();
        }
      }

      animationFrameId = requestAnimationFrame(gameTick);
    };

    animationFrameId = requestAnimationFrame(gameTick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    isPaused,
    gameSpeed,
    workerLevel,
    isAutoBattle,
    battleResult.ended,
    enemyCastleHp,
    playerCastleHp,
    maxMoney,
  ]);

  // Auto Battle AI
  const handleAutoBattleTick = () => {
    // 1. If money >= worker upgrade cost, upgrade worker first if below cap
    if (workerLevel < maxWorkerLevel && money >= workerUpgradeCost) {
      handleUpgradeWorker();
      return;
    }

    // 2. Fire cannon if ready
    if (cannonProgress >= 100 && enemies.length > 2) {
      handleFireCannon();
      return;
    }

    // 3. Spawn available units from cheapest meatshield to big hitters
    for (const slot of deckSlotDefs) {
      if (money >= slot.cost && slot.cooldownRemaining <= 0) {
        handleSpawnCat(slot.def.id);
        break;
      }
    }
  };

  // Spawn Cat Handler
  const handleSpawnCat = (catId: string) => {
    const slot = deckSlotDefs.find((s) => s.def.id === catId);
    if (!slot || money < slot.cost || slot.cooldownRemaining > 0) return;

    const form = slot.def.forms[slot.activeFormIndex];
    const catLevel = profile.cats[catId]?.level || 1;
    // Level scaling: +10% HP and +10% ATK per level
    const levelMult = 1 + (catLevel - 1) * 0.1;

    const newCat: ActiveEntity = {
      instanceId: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      defId: catId,
      name: form.name,
      isCat: true,
      x: 100, // spawn near player castle
      y: 0,
      hp: Math.round(form.hp * levelMult * treasureCatHpMult),
      maxHp: Math.round(form.hp * levelMult * treasureCatHpMult),
      attackPower: Math.round(form.attackPower * levelMult * treasureCatAtkMult),
      attackRange: form.attackRange,
      attackInterval: 1 / form.attackSpeed,
      attackTimer: 0,
      attackWindupTimer: 0,
      isWindupActive: false,
      speed: form.speed,
      knockbackCount: 0,
      maxKnockbacks: form.knockbacks,
      attackType: form.attackType,
      cost: form.cost,
      spriteType: form.spriteType,
      scale: form.scale || 1.0,
      formIndex: slot.activeFormIndex,
      state: 'walk',
      animTimer: 0,
      knockbackVelocityX: 0,
      knockbackTimer: 0,
      hitFlashTimer: 0,
    };

    setMoney((prev) => prev - form.cost);
    setDeckCooldowns((prev) => ({ ...prev, [catId]: slot.maxCooldown }));
    setCats((prev) => [...prev, newCat]);
    audio.playCatSpawn();
  };

  // Spawn Enemy Helper
  const spawnEnemy = (enemyId: string, isBoss: boolean = false) => {
    const def = ENEMY_DEFINITIONS[enemyId] || ENEMY_DEFINITIONS.enemy_doge;
    const newEnemy: ActiveEntity = {
      instanceId: `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      defId: enemyId,
      name: def.name,
      isCat: false,
      x: battlefieldWidth - 140, // spawn near enemy castle
      y: 0,
      hp: def.hp,
      maxHp: def.hp,
      attackPower: def.attackPower,
      attackRange: def.attackRange,
      attackInterval: 1 / def.attackSpeed,
      attackTimer: 0,
      attackWindupTimer: 0,
      isWindupActive: false,
      speed: def.speed,
      knockbackCount: 0,
      maxKnockbacks: def.knockbacks,
      attackType: def.attackType,
      traits: def.traits,
      spriteType: def.spriteType,
      scale: def.scale || 1.0,
      formIndex: 0,
      isBoss: isBoss || def.isBoss,
      state: 'walk',
      animTimer: 0,
      knockbackVelocityX: 0,
      knockbackTimer: 0,
      hitFlashTimer: 0,
    };

    setEnemies((prev) => [...prev, newEnemy]);
  };

  // Upgrade Worker Cat
  const handleUpgradeWorker = () => {
    if (workerLevel >= maxWorkerLevel || money < workerUpgradeCost) return;
    setMoney((prev) => prev - workerUpgradeCost);
    setWorkerLevel((prev) => prev + 1);
    audio.playWorkerLevelUp();
  };

  // Fire Cat Cannon (にゃんこ砲)
  const handleFireCannon = () => {
    if (cannonProgress < 100 || isCannonFiring) return;
    setIsCannonFiring(true);
    setCannonProgress(0);
    audio.playCannonBlast();

    const cannonDmg = Math.round((400 + cannonPowerLevel * 180) * treasureCannonPowerMult);

    // Blast effect and knockback to ALL active enemies
    setTimeout(() => {
      setEnemies((prev) =>
        prev.map((enemy) => {
          const nextHp = enemy.hp - cannonDmg;
          // Spawn damage number
          spawnDamageNum(enemy.x, 30, cannonDmg, true, true);
          return {
            ...enemy,
            hp: Math.max(0, nextHp),
            state: 'knockback',
            knockbackVelocityX: 200,
            knockbackTimer: 0.5,
            x: Math.min(battlefieldWidth - 100, enemy.x + 80),
          };
        })
      );
      setIsCannonFiring(false);
    }, 450);
  };

  const spawnDamageNum = (x: number, y: number, value: number, isCritical: boolean, isCatDamage: boolean) => {
    const newDmg: DamageNumber = {
      id: `dmg_${Date.now()}_${Math.random()}`,
      x,
      y,
      value,
      isCritical,
      isCatDamage,
      lifetime: 0,
      maxLifetime: 0.8,
    };
    setDamageNumbers((prev) => [...prev.slice(-20), newDmg]);
  };

  const spawnFx = (x: number, y: number, type: VisualEffect['type'], color?: string) => {
    const newFx: VisualEffect = {
      id: `fx_${Date.now()}_${Math.random()}`,
      x,
      y,
      type,
      color,
      lifetime: 0,
      maxLifetime: 0.35,
    };
    setVisualEffects((prev) => [...prev.slice(-15), newFx]);
  };

  // Entity Simulation Update
  const updateEntities = (dt: number) => {
    // Check Victory / Defeat Conditions
    if (enemyCastleHp <= 0 && !battleResult.ended) {
      handleMatchEnd(true);
      return;
    }
    if (playerCastleHp <= 0 && !battleResult.ended) {
      handleMatchEnd(false);
      return;
    }

    // 1. UPDATE CATS
    setCats((currentCats) => {
      return currentCats
        .map((cat) => {
          let c = { ...cat, animTimer: cat.animTimer + dt };

          // Knockback handling
          if (c.state === 'knockback') {
            c.knockbackTimer -= dt;
            c.x = Math.max(100, c.x - c.knockbackVelocityX * dt);
            if (c.knockbackTimer <= 0) {
              c.state = 'walk';
            }
            return c;
          }

          // Cooldowns
          if (c.attackTimer > 0) {
            c.attackTimer -= dt;
          }

          // Target Detection: Enemy unit or Enemy Castle
          // Find frontmost enemy in front of this cat
          const enemiesInFront = enemies.filter((e) => e.x > c.x && e.hp > 0);
          const enemyDistance = enemiesInFront.length > 0 ? Math.min(...enemiesInFront.map((e) => e.x - c.x)) : Infinity;
          const castleDistance = (battlefieldWidth - 140) - c.x;
          const targetDistance = Math.min(enemyDistance, castleDistance);

          // If within attack range, attack!
          if (targetDistance <= c.attackRange) {
            if (!c.isWindupActive && c.attackTimer <= 0) {
              // Start Attack Windup
              c.isWindupActive = true;
              c.attackWindupTimer = 0.25; // windup before damage connects
              c.state = 'attack';
            }

            if (c.isWindupActive) {
              c.attackWindupTimer -= dt;
              if (c.attackWindupTimer <= 0) {
                // Execute attack damage!
                executeCatAttack(c);
                c.isWindupActive = false;
                c.attackTimer = c.attackInterval;
                c.state = 'walk';
              }
            }
          } else {
            // Move forward
            c.state = 'walk';
            c.isWindupActive = false;
            c.x = Math.min(battlefieldWidth - 140, c.x + c.speed * dt);
          }

          return c;
        })
        .filter((cat) => cat.hp > 0);
    });

    // 2. UPDATE ENEMIES
    setEnemies((currentEnemies) => {
      return currentEnemies
        .map((enemy) => {
          let e = { ...enemy, animTimer: enemy.animTimer + dt };

          // Knockback handling
          if (e.state === 'knockback') {
            e.knockbackTimer -= dt;
            e.x = Math.min(battlefieldWidth - 140, e.x + e.knockbackVelocityX * dt);
            if (e.knockbackTimer <= 0) {
              e.state = 'walk';
            }
            return e;
          }

          // Cooldowns
          if (e.attackTimer > 0) {
            e.attackTimer -= dt;
          }

          // Target Detection: Cat unit or Player Castle
          const catsInFront = cats.filter((cat) => cat.x < e.x && cat.hp > 0);
          const catDistance = catsInFront.length > 0 ? Math.min(...catsInFront.map((cat) => e.x - cat.x)) : Infinity;
          const playerCastleDist = e.x - 100;
          const targetDistance = Math.min(catDistance, playerCastleDist);

          // If in range, attack!
          if (targetDistance <= e.attackRange) {
            if (!e.isWindupActive && e.attackTimer <= 0) {
              e.isWindupActive = true;
              e.attackWindupTimer = 0.25;
              e.state = 'attack';
            }

            if (e.isWindupActive) {
              e.attackWindupTimer -= dt;
              if (e.attackWindupTimer <= 0) {
                executeEnemyAttack(e);
                e.isWindupActive = false;
                e.attackTimer = e.attackInterval;
                e.state = 'walk';
              }
            }
          } else {
            // Move leftwards towards player base
            e.state = 'walk';
            e.isWindupActive = false;
            e.x = Math.max(100, e.x - e.speed * dt);
          }

          return e;
        })
        .filter((e) => e.hp > 0);
    });
  };

  // Cat Attacks: Single-target vs Area Attack!
  const executeCatAttack = (cat: ActiveEntity) => {
    const isArea = cat.attackType === 'area';
    const isCrit = Math.random() < 0.15; // 15% crit chance
    const dmg = Math.round(cat.attackPower * (isCrit ? 2.0 : 1.0));

    // Find enemies in reach
    const enemiesInReach = enemies.filter((e) => e.x >= cat.x && e.x <= cat.x + cat.attackRange && e.hp > 0);

    if (enemiesInReach.length > 0) {
      if (isArea) {
        // ★ AREA ATTACK (範囲攻撃): Hits ALL enemies in range!
        audio.playHit(isCrit, true);
        spawnFx(cat.x + cat.attackRange * 0.5, 20, 'aoe_burst');

        setEnemies((prev) =>
          prev.map((e) => {
            if (e.x >= cat.x && e.x <= cat.x + cat.attackRange && e.hp > 0) {
              const nextHp = Math.max(0, e.hp - dmg);
              spawnDamageNum(e.x, 25, dmg, isCrit, true);

              // Knockback if crossed KB threshold
              const kbThreshold = e.maxHp / e.maxKnockbacks;
              const currentKBs = Math.floor((e.maxHp - nextHp) / kbThreshold);
              const shouldKb = currentKBs > e.knockbackCount;

              if (nextHp <= 0) {
                // Reward money on kill
                const def = ENEMY_DEFINITIONS[e.defId];
                if (def) setMoney((m) => Math.min(maxMoney, m + def.rewardMoney));
              }

              if (shouldKb) {
                audio.playKnockback();
                return {
                  ...e,
                  hp: nextHp,
                  knockbackCount: currentKBs,
                  state: 'knockback',
                  knockbackVelocityX: 180,
                  knockbackTimer: 0.4,
                  x: Math.min(battlefieldWidth - 100, e.x + 50),
                };
              }
              return { ...e, hp: nextHp };
            }
            return e;
          })
        );
      } else {
        // ★ SINGLE TARGET ATTACK (単体攻撃): Hits ONLY the front-most enemy!
        audio.playHit(isCrit, false);
        // Sort to find closest enemy to cat
        const target = [...enemiesInReach].sort((a, b) => a.x - b.x)[0];
        spawnFx(target.x, 20, 'hit');
        spawnDamageNum(target.x, 25, dmg, isCrit, true);

        setEnemies((prev) =>
          prev.map((e) => {
            if (e.instanceId === target.instanceId) {
              const nextHp = Math.max(0, e.hp - dmg);
              const kbThreshold = e.maxHp / e.maxKnockbacks;
              const currentKBs = Math.floor((e.maxHp - nextHp) / kbThreshold);
              const shouldKb = currentKBs > e.knockbackCount;

              if (nextHp <= 0) {
                const def = ENEMY_DEFINITIONS[e.defId];
                if (def) setMoney((m) => Math.min(maxMoney, m + def.rewardMoney));
              }

              if (shouldKb) {
                audio.playKnockback();
                return {
                  ...e,
                  hp: nextHp,
                  knockbackCount: currentKBs,
                  state: 'knockback',
                  knockbackVelocityX: 180,
                  knockbackTimer: 0.4,
                  x: Math.min(battlefieldWidth - 100, e.x + 50),
                };
              }
              return { ...e, hp: nextHp };
            }
            return e;
          })
        );
      }
    } else {
      // Hit Enemy Castle
      const castleX = battlefieldWidth - 140;
      if (castleX - cat.x <= cat.attackRange) {
        audio.playHit(false, false);
        spawnFx(castleX, 40, isArea ? 'aoe_burst' : 'hit');
        spawnDamageNum(castleX, 40, dmg, isCrit, true);
        setEnemyCastleHp((prev) => Math.max(0, prev - dmg));
      }
    }
  };

  // Enemy Attacks: Single-target vs Area Attack!
  const executeEnemyAttack = (enemy: ActiveEntity) => {
    const isArea = enemy.attackType === 'area';
    const dmg = enemy.attackPower;

    // Find cats in reach
    const catsInReach = cats.filter((c) => c.x <= enemy.x && c.x >= enemy.x - enemy.attackRange && c.hp > 0);

    if (catsInReach.length > 0) {
      if (isArea) {
        audio.playHit(false, true);
        spawnFx(enemy.x - enemy.attackRange * 0.5, 20, 'aoe_burst');

        setCats((prev) =>
          prev.map((c) => {
            if (c.x <= enemy.x && c.x >= enemy.x - enemy.attackRange && c.hp > 0) {
              const nextHp = Math.max(0, c.hp - dmg);
              spawnDamageNum(c.x, 25, dmg, false, false);

              const kbThreshold = c.maxHp / c.maxKnockbacks;
              const currentKBs = Math.floor((c.maxHp - nextHp) / kbThreshold);
              const shouldKb = currentKBs > c.knockbackCount;

              if (shouldKb) {
                return {
                  ...c,
                  hp: nextHp,
                  knockbackCount: currentKBs,
                  state: 'knockback',
                  knockbackVelocityX: 180,
                  knockbackTimer: 0.4,
                  x: Math.max(100, c.x - 50),
                };
              }
              return { ...c, hp: nextHp };
            }
            return c;
          })
        );
      } else {
        audio.playHit(false, false);
        // Closest cat to enemy (highest x)
        const target = [...catsInReach].sort((a, b) => b.x - a.x)[0];
        spawnFx(target.x, 20, 'hit');
        spawnDamageNum(target.x, 25, dmg, false, false);

        setCats((prev) =>
          prev.map((c) => {
            if (c.instanceId === target.instanceId) {
              const nextHp = Math.max(0, c.hp - dmg);
              const kbThreshold = c.maxHp / c.maxKnockbacks;
              const currentKBs = Math.floor((c.maxHp - nextHp) / kbThreshold);
              const shouldKb = currentKBs > c.knockbackCount;

              if (shouldKb) {
                return {
                  ...c,
                  hp: nextHp,
                  knockbackCount: currentKBs,
                  state: 'knockback',
                  knockbackVelocityX: 180,
                  knockbackTimer: 0.4,
                  x: Math.max(100, c.x - 50),
                };
              }
              return { ...c, hp: nextHp };
            }
            return c;
          })
        );
      }
    } else {
      // Hit Player Castle
      if (enemy.x - 100 <= enemy.attackRange) {
        audio.playHit(false, false);
        spawnFx(100, 40, 'hit');
        spawnDamageNum(100, 40, dmg, false, false);
        setPlayerCastleHp((prev) => Math.max(0, prev - dmg));
      }
    }
  };

  // Match Complete Handler
  const handleMatchEnd = (victory: boolean) => {
    isTerminatedRef.current = true;

    // Treasure drop roll if victory
    let treasureDrop: { name: string; quality: TreasureQuality; description: string } | null = null;
    let treasureQuality: TreasureQuality = 'none';

    if (victory) {
      const trDef = TREASURES[stage.id];
      if (trDef) {
        const roll = Math.random();
        if (roll < 0.35) {
          treasureQuality = 'gold';
        } else if (roll < 0.65) {
          treasureQuality = 'silver';
        } else if (roll < 0.88) {
          treasureQuality = 'bronze';
        }

        if (treasureQuality !== 'none') {
          treasureDrop = {
            name: trDef.name,
            quality: treasureQuality,
            description: trDef.effectDescription,
          };
        }
      }
    }

    const xpEarned = victory ? stage.baseRewardXp : Math.floor(stage.baseRewardXp * 0.2);
    const catFoodEarned = victory ? stage.baseRewardCatFood : 0;

    setBattleResult({
      ended: true,
      victory,
      xpEarned,
      catFoodEarned,
      treasureDropped: treasureDrop,
    });

    onBattleEnd({
      victory,
      xpEarned,
      catFoodEarned,
      treasureQuality,
    });
  };

  const toggleSpeed = () => {
    setGameSpeed((prev) => (prev === 1 ? 2 : prev === 2 ? 3 : 1));
  };

  const toggleSound = () => {
    audio.toggleSound();
    audio.toggleBgm();
  };

  return (
    <div className="relative w-full h-full bg-stone-950 flex flex-col select-none overflow-hidden font-['M_PLUS_Rounded_1c']">
      {/* 2D Horizontal Scrolling Battlefield Canvas */}
      <div className="relative flex-1 w-full overflow-hidden">
        <BattleCanvas
          stage={stage}
          playerCastleHp={playerCastleHp}
          playerCastleMaxHp={basePlayerCastleHp}
          enemyCastleHp={enemyCastleHp}
          enemyCastleMaxHp={stage.castleHp}
          cats={cats}
          enemies={enemies}
          damageNumbers={damageNumbers}
          visualEffects={visualEffects}
          isCannonFiring={isCannonFiring}
          cannonProgress={cannonProgress}
          cameraX={cameraX}
          setCameraX={setCameraX}
          bossAlert={bossAlert}
        />

        {/* Floating HUD controls on top and bottom */}
        <div className="absolute inset-0 pointer-events-none">
          <BattleHud
            money={money}
            maxMoney={maxMoney}
            workerLevel={workerLevel}
            maxWorkerLevel={maxWorkerLevel}
            workerUpgradeCost={workerUpgradeCost}
            onUpgradeWorker={handleUpgradeWorker}
            cannonProgress={cannonProgress}
            onFireCannon={handleFireCannon}
            isCannonFiring={isCannonFiring}
            deckCats={deckSlotDefs}
            onSpawnCat={handleSpawnCat}
            gameSpeed={gameSpeed}
            onToggleSpeed={toggleSpeed}
            isPaused={isPaused}
            onTogglePause={() => setIsPaused((p) => !p)}
            isAutoBattle={isAutoBattle}
            onToggleAutoBattle={() => setIsAutoBattle((a) => !a)}
            onRetreat={onExit}
            soundEnabled={audio.soundEnabled}
            onToggleSound={toggleSound}
          />
        </div>
      </div>

      {/* Result Modal when victory / defeat occurs */}
      {battleResult.ended && (
        <BattleResultModal
          isVictory={battleResult.victory}
          stage={stage}
          xpEarned={battleResult.xpEarned}
          catFoodEarned={battleResult.catFoodEarned}
          treasureDropped={battleResult.treasureDropped}
          onNextStage={() => {
            if (onNextStage) onNextStage();
          }}
          onReturnToMap={onExit}
          onRetry={() => {
            // Reset battle
            setPlayerCastleHp(basePlayerCastleHp);
            setEnemyCastleHp(stage.castleHp);
            setWorkerLevel(1);
            setMoney(100);
            setCannonProgress(0);
            setCats([]);
            setEnemies([]);
            setDamageNumbers([]);
            setVisualEffects([]);
            setDeckCooldowns({});
            battleTimeRef.current = 0;
            spawnedWaveIndicesRef.current = new Set();
            spawnedThresholdWavesRef.current = new Set();
            isTerminatedRef.current = false;
            setBattleResult({
              ended: false,
              victory: false,
              xpEarned: 0,
              catFoodEarned: 0,
              treasureDropped: null,
            });
          }}
          hasNextStage={hasNextStage}
        />
      )}
    </div>
  );
};
