import React, { useState, useEffect, useRef } from 'react';
import {
  StageDefinition,
  PlayerProfile,
  ActiveEntity,
  DamageNumber,
  VisualEffect,
  TreasureQuality,
  AttackType,
  BattleActiveItems,
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
  activeItems?: BattleActiveItems;
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
  activeItems = {} as BattleActiveItems,
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
  const playerCastleX = 100;
  const enemyCastleX = battlefieldWidth - 140;

  // Initial Rich Cat item setup
  const initWorkerLvl = activeItems.richCat ? 8 : 1;
  const initBaseCap = 500 + initWorkerLvl * 250 + (workerWalletLevel - 1) * 150;
  const initMoney = activeItems.richCat ? Math.round(initBaseCap * treasureMoneyCapMult) : 100;

  // Timers & Waves tracking
  const battleTimeRef = useRef(0);
  const sniperTimerRef = useRef(0);
  const spawnedWaveIndicesRef = useRef<Set<number>>(new Set());
  const spawnedThresholdWavesRef = useRef<Set<number>>(new Set());
  const isTerminatedRef = useRef(false);

  // Authoritative Simulation Refs (prevents React closure stale state)
  const catsRef = useRef<ActiveEntity[]>([]);
  const enemiesRef = useRef<ActiveEntity[]>([]);
  const playerCastleHpRef = useRef(basePlayerCastleHp);
  const enemyCastleHpRef = useRef(stage.castleHp);
  const moneyRef = useRef(initMoney);
  const cannonProgressRef = useRef(0);
  const damageNumbersRef = useRef<DamageNumber[]>([]);
  const visualEffectsRef = useRef<VisualEffect[]>([]);
  const deckCooldownsRef = useRef<Record<string, number>>({});
  const workerLevelRef = useRef(initWorkerLvl);

  // React State for UI Rendering
  const [playerCastleHp, setPlayerCastleHp] = useState(basePlayerCastleHp);
  const [enemyCastleHp, setEnemyCastleHp] = useState(stage.castleHp);
  const [workerLevel, setWorkerLevel] = useState(initWorkerLvl);
  const [money, setMoney] = useState(initMoney);
  const [cannonProgress, setCannonProgress] = useState(0);
  const [isCannonFiring, setIsCannonFiring] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(activeItems.speedUp ? 2 : 1);
  const [isPaused, setIsPaused] = useState(false);
  const [isAutoBattle, setIsAutoBattle] = useState(!!activeItems.catCpu);
  const [cameraX, setCameraX] = useState(0);
  const [bossAlert, setBossAlert] = useState<string | null>(null);

  // Entities & visual fx for UI
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
    if (stage.isFinalBossStage) {
      audio.startFinalBossBgm();
    } else if (stage.isBossStage) {
      audio.startBossBgm();
    } else {
      audio.startBattleBgm();
    }
    return () => {
      audio.stopBattleBgm();
    };
  }, [stage.id, stage.isFinalBossStage, stage.isBossStage]);

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
        const ratePerSec = (15 + workerLevelRef.current * 12 + (workerRateLevel - 1) * 8) * treasureMoneyRateMult;
        moneyRef.current = Math.min(maxMoney, moneyRef.current + ratePerSec * dt);

        // 2. Cannon Charging
        const cannonChargeRate = (1.5 + cannonChargeLevel * 0.4) * treasureCannonChargeMult;
        cannonProgressRef.current = Math.min(100, cannonProgressRef.current + cannonChargeRate * dt);

        // 3. Deck Cooldown countdowns
        const nextCds: Record<string, number> = {};
        Object.entries(deckCooldownsRef.current).forEach(([id, rem]) => {
          const remNum = Number(rem);
          if (remNum > 0) {
            nextCds[id] = Math.max(0, remNum - dt);
          }
        });
        deckCooldownsRef.current = nextCds;

        // 4. Wave Spawner
        stage.waves.forEach((wave, idx) => {
          // Time-based wave
          if (wave.timeSeconds > 0 && battleTimeRef.current >= wave.timeSeconds && !spawnedWaveIndicesRef.current.has(idx)) {
            spawnedWaveIndicesRef.current.add(idx);
            spawnEnemy(wave.enemyId, wave.boss);
            if (wave.boss) {
              audio.playBossAlert();
              if (stage.isFinalBossStage) {
                audio.startFinalBossBgm();
              } else {
                audio.startBossBgm();
              }
              if (stage.bossAlert) {
                setBossAlert(stage.bossAlert);
                setTimeout(() => setBossAlert(null), 4000);
              }
            }
          }

          // Castle HP threshold wave
          if (wave.castleHpThreshold && !spawnedThresholdWavesRef.current.has(idx)) {
            const hpPercent = (enemyCastleHpRef.current / stage.castleHp) * 100;
            if (hpPercent <= wave.castleHpThreshold) {
              spawnedThresholdWavesRef.current.add(idx);
              spawnEnemy(wave.enemyId, wave.boss);
              if (wave.boss) {
                audio.playBossAlert();
                if (stage.isFinalBossStage) {
                  audio.startFinalBossBgm();
                } else {
                  audio.startBossBgm();
                }
                if (stage.bossAlert) {
                  setBossAlert(stage.bossAlert);
                  setTimeout(() => setBossAlert(null), 4000);
                }
              }
            }
          }
        });

        // 5. Update Active Units Physics, Attacks, and States
        updateEntities(dt);

        // 6. Update Visual Effects & Damage Numbers
        damageNumbersRef.current = damageNumbersRef.current
          .map((d) => ({ ...d, lifetime: d.lifetime + dt }))
          .filter((d) => d.lifetime < d.maxLifetime);

        visualEffectsRef.current = visualEffectsRef.current
          .map((fx) => ({ ...fx, lifetime: fx.lifetime + dt }))
          .filter((fx) => fx.lifetime < fx.maxLifetime);

        // 7. Sniper Item Automatic Support
        if (activeItems.sniper && enemiesRef.current.length > 0) {
          sniperTimerRef.current += dt;
          if (sniperTimerRef.current >= 8.0) {
            sniperTimerRef.current = 0;
            // Find foremost enemy (closest to player castle, i.e. lowest X)
            let foremostEnemy: ActiveEntity | null = null;
            enemiesRef.current.forEach((en) => {
              if (!foremostEnemy || en.x < foremostEnemy.x) {
                foremostEnemy = en;
              }
            });

            if (foremostEnemy) {
              const target = foremostEnemy as ActiveEntity;
              audio.playHit(true, true);
              const sniperDmg = 450;
              target.hp -= sniperDmg;
              target.state = 'knockback';
              target.knockbackTimer = 0.45;
              target.knockbackVelocityX = 75; // Knock back towards right
              target.hitFlashTimer = 0.3;
              spawnFx(target.x, target.y + 20, 'hit');
              spawnDamageNum(target.x, target.y + 35, sniperDmg, true, true);
            }
          }
        }

        // 8. Auto-Battle Logic (ニャンピューター)
        if (isAutoBattle) {
          handleAutoBattleTick();
        }

        // 9. Synchronize ref state to React state for fluid rendering
        setCats([...catsRef.current]);
        setEnemies([...enemiesRef.current]);
        setPlayerCastleHp(playerCastleHpRef.current);
        setEnemyCastleHp(enemyCastleHpRef.current);
        setMoney(moneyRef.current);
        setCannonProgress(cannonProgressRef.current);
        setDeckCooldowns({ ...deckCooldownsRef.current });
        setDamageNumbers([...damageNumbersRef.current]);
        setVisualEffects([...visualEffectsRef.current]);
      }

      animationFrameId = requestAnimationFrame(gameTick);
    };

    animationFrameId = requestAnimationFrame(gameTick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, gameSpeed, isAutoBattle, battleResult.ended, maxMoney]);

  // Auto Battle AI
  const handleAutoBattleTick = () => {
    // 1. If money >= worker upgrade cost, upgrade worker first if below cap
    if (workerLevelRef.current < maxWorkerLevel && moneyRef.current >= workerUpgradeCost) {
      handleUpgradeWorker();
      return;
    }

    // 2. Fire cannon if ready
    if (cannonProgressRef.current >= 100 && enemiesRef.current.length > 2) {
      handleFireCannon();
      return;
    }

    // 3. Spawn available units from cheapest meatshield to big hitters
    for (const slot of deckSlotDefs) {
      if (moneyRef.current >= slot.cost && (deckCooldownsRef.current[slot.def.id] || 0) <= 0) {
        handleSpawnCat(slot.def.id);
        break;
      }
    }
  };

  // Spawn Cat Handler
  const handleSpawnCat = (catId: string) => {
    const slot = deckSlotDefs.find((s) => s.def.id === catId);
    if (!slot || moneyRef.current < slot.cost || (deckCooldownsRef.current[catId] || 0) > 0) return;

    const form = slot.def.forms[slot.activeFormIndex];
    const catLevel = profile.cats[catId]?.level || 1;
    // Level scaling: +10% HP and +10% ATK per level
    const levelMult = 1 + (catLevel - 1) * 0.1;

    const newCat: ActiveEntity = {
      instanceId: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      defId: catId,
      name: form.name,
      isCat: true,
      x: playerCastleX, // spawn near player castle
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

    moneyRef.current -= form.cost;
    deckCooldownsRef.current[catId] = slot.maxCooldown;
    catsRef.current.push(newCat);

    audio.playCatSpawn(1.0, slot.def.rarity);
  };

  // Spawn Enemy Helper
  const spawnEnemy = (enemyId: string, isBoss: boolean = false) => {
    const def = ENEMY_DEFINITIONS[enemyId] || ENEMY_DEFINITIONS.enemy_doge;
    const newEnemy: ActiveEntity = {
      instanceId: `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      defId: enemyId,
      name: def.name,
      isCat: false,
      x: enemyCastleX, // spawn near enemy castle
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

    enemiesRef.current.push(newEnemy);
  };

  // Upgrade Worker Cat
  const handleUpgradeWorker = () => {
    if (workerLevelRef.current >= maxWorkerLevel || moneyRef.current < workerUpgradeCost) return;
    moneyRef.current -= workerUpgradeCost;
    workerLevelRef.current += 1;
    setWorkerLevel(workerLevelRef.current);
    audio.playWorkerLevelUp();
  };

  // Fire Cat Cannon (にゃんこ砲)
  const handleFireCannon = () => {
    if (cannonProgressRef.current < 100 || isCannonFiring) return;
    setIsCannonFiring(true);
    cannonProgressRef.current = 0;
    setCannonProgress(0);
    audio.playCannonBlast();

    const cannonDmg = Math.round((400 + cannonPowerLevel * 180) * treasureCannonPowerMult);

    // Blast effect and knockback to ALL active enemies
    setTimeout(() => {
      enemiesRef.current.forEach((enemy) => {
        const nextHp = Math.max(0, enemy.hp - cannonDmg);
        enemy.hp = nextHp;
        spawnDamageNum(enemy.x, 30, cannonDmg, true, true);
        enemy.state = 'knockback';
        enemy.knockbackVelocityX = 220;
        enemy.knockbackTimer = 0.5;
        enemy.x = Math.min(enemyCastleX, enemy.x + 80);
        enemy.isWindupActive = false;
      });
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
    damageNumbersRef.current.push(newDmg);
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
    visualEffectsRef.current.push(newFx);
  };

  // Entity Simulation Update (Frame-accurate ref-based physics)
  const updateEntities = (dt: number) => {
    // Check Victory / Defeat Conditions
    if (enemyCastleHpRef.current <= 0 && !battleResult.ended && !isTerminatedRef.current) {
      handleMatchEnd(true);
      return;
    }
    if (playerCastleHpRef.current <= 0 && !battleResult.ended && !isTerminatedRef.current) {
      handleMatchEnd(false);
      return;
    }

    // 1. UPDATE CATS
    for (let i = 0; i < catsRef.current.length; i++) {
      const cat = catsRef.current[i];
      cat.animTimer += dt;

      // Knockback handling
      if (cat.state === 'knockback') {
        cat.knockbackTimer -= dt;
        cat.x = Math.max(playerCastleX, cat.x - cat.knockbackVelocityX * dt);
        if (cat.knockbackTimer <= 0) {
          cat.state = 'walk';
        }
        continue;
      }

      // Attack Cooldown
      if (cat.attackTimer > 0) {
        cat.attackTimer -= dt;
      }

      // Find living enemies ahead of this cat
      const enemiesInFront = enemiesRef.current.filter((e) => e.hp > 0 && e.x >= cat.x - 15);
      const closestEnemyX = enemiesInFront.length > 0 ? Math.min(...enemiesInFront.map((e) => e.x)) : enemyCastleX;
      const targetDistance = Math.max(0, closestEnemyX - cat.x);

      // Clamp position so cat NEVER passes enemy frontline
      if (cat.x > closestEnemyX - 5) {
        cat.x = Math.max(playerCastleX, closestEnemyX - 5);
      }

      if (targetDistance <= cat.attackRange) {
        // Within range: Stop and attack
        if (!cat.isWindupActive && cat.attackTimer <= 0) {
          cat.isWindupActive = true;
          cat.attackWindupTimer = 0.25;
          cat.state = 'attack';
        }

        if (cat.isWindupActive) {
          cat.attackWindupTimer -= dt;
          if (cat.attackWindupTimer <= 0) {
            executeCatAttack(cat);
            cat.isWindupActive = false;
            cat.attackTimer = cat.attackInterval;
            cat.state = 'walk';
          }
        }
      } else {
        // Move forward towards enemy/castle, capped strictly before target
        cat.state = 'walk';
        cat.isWindupActive = false;
        const nextX = cat.x + cat.speed * dt;
        cat.x = Math.min(closestEnemyX - 5, Math.min(enemyCastleX, nextX));
      }
    }

    // 2. UPDATE ENEMIES
    for (let i = 0; i < enemiesRef.current.length; i++) {
      const enemy = enemiesRef.current[i];
      enemy.animTimer += dt;

      // Knockback handling
      if (enemy.state === 'knockback') {
        enemy.knockbackTimer -= dt;
        enemy.x = Math.min(enemyCastleX, enemy.x + enemy.knockbackVelocityX * dt);
        if (enemy.knockbackTimer <= 0) {
          enemy.state = 'walk';
        }
        continue;
      }

      // Attack Cooldown
      if (enemy.attackTimer > 0) {
        enemy.attackTimer -= dt;
      }

      // Find living cats ahead of this enemy
      const catsInFront = catsRef.current.filter((c) => c.hp > 0 && c.x <= enemy.x + 15);
      const closestCatX = catsInFront.length > 0 ? Math.max(...catsInFront.map((c) => c.x)) : playerCastleX;
      const targetDistance = Math.max(0, enemy.x - closestCatX);

      // Clamp position so enemy NEVER passes cat frontline
      if (enemy.x < closestCatX + 5) {
        enemy.x = Math.min(enemyCastleX, closestCatX + 5);
      }

      if (targetDistance <= enemy.attackRange) {
        // Within range: Stop and attack
        if (!enemy.isWindupActive && enemy.attackTimer <= 0) {
          enemy.isWindupActive = true;
          enemy.attackWindupTimer = 0.25;
          enemy.state = 'attack';
        }

        if (enemy.isWindupActive) {
          enemy.attackWindupTimer -= dt;
          if (enemy.attackWindupTimer <= 0) {
            executeEnemyAttack(enemy);
            enemy.isWindupActive = false;
            enemy.attackTimer = enemy.attackInterval;
            enemy.state = 'walk';
          }
        }
      } else {
        // Move leftwards towards player base, capped strictly before cat
        enemy.state = 'walk';
        enemy.isWindupActive = false;
        const nextX = enemy.x - enemy.speed * dt;
        enemy.x = Math.max(closestCatX + 5, Math.max(playerCastleX, nextX));
      }
    }

    // Filter dead entities
    catsRef.current = catsRef.current.filter((c) => c.hp > 0);
    enemiesRef.current = enemiesRef.current.filter((e) => e.hp > 0);
  };

  // Cat Attacks: Single-target vs Area Attack!
  const executeCatAttack = (cat: ActiveEntity) => {
    const isArea = cat.attackType === 'area';
    const isCrit = Math.random() < 0.15; // 15% crit chance
    const dmg = Math.round(cat.attackPower * (isCrit ? 2.0 : 1.0));

    // Find enemies in reach (in front of cat within range + buffer)
    const enemiesInReach = enemiesRef.current.filter(
      (e) => e.hp > 0 && e.x >= cat.x - 25 && e.x <= cat.x + cat.attackRange + 30
    );

    if (enemiesInReach.length > 0) {
      if (isArea) {
        // ★ AREA ATTACK (範囲攻撃): Hits ALL enemies in range!
        audio.playHit(isCrit, true);
        spawnFx(cat.x + cat.attackRange * 0.5, 20, 'aoe_burst');

        enemiesInReach.forEach((e) => {
          const nextHp = Math.max(0, e.hp - dmg);
          e.hp = nextHp;
          spawnDamageNum(e.x, 25, dmg, isCrit, true);

          // Knockback if crossed KB threshold
          const kbThreshold = e.maxHp / e.maxKnockbacks;
          const currentKBs = Math.floor((e.maxHp - nextHp) / kbThreshold);
          const shouldKb = currentKBs > e.knockbackCount;

          if (nextHp <= 0) {
            const def = ENEMY_DEFINITIONS[e.defId];
            if (def) {
              moneyRef.current = Math.min(maxMoney, moneyRef.current + def.rewardMoney);
            }
          }

          if (shouldKb) {
            audio.playKnockback();
            e.knockbackCount = currentKBs;
            e.state = 'knockback';
            e.knockbackVelocityX = 180;
            e.knockbackTimer = 0.4;
            e.x = Math.min(enemyCastleX, e.x + 60);
            e.isWindupActive = false;
          }
        });
      } else {
        // ★ SINGLE TARGET ATTACK (単体攻撃): Hits ONLY the front-most enemy!
        audio.playHit(isCrit, false);
        const target = [...enemiesInReach].sort((a, b) => a.x - b.x)[0];
        spawnFx(target.x, 20, 'hit');
        spawnDamageNum(target.x, 25, dmg, isCrit, true);

        const nextHp = Math.max(0, target.hp - dmg);
        target.hp = nextHp;

        const kbThreshold = target.maxHp / target.maxKnockbacks;
        const currentKBs = Math.floor((target.maxHp - nextHp) / kbThreshold);
        const shouldKb = currentKBs > target.knockbackCount;

        if (nextHp <= 0) {
          const def = ENEMY_DEFINITIONS[target.defId];
          if (def) {
            moneyRef.current = Math.min(maxMoney, moneyRef.current + def.rewardMoney);
          }
        }

        if (shouldKb) {
          audio.playKnockback();
          target.knockbackCount = currentKBs;
          target.state = 'knockback';
          target.knockbackVelocityX = 180;
          target.knockbackTimer = 0.4;
          target.x = Math.min(enemyCastleX, target.x + 60);
          target.isWindupActive = false;
        }
      }
    } else {
      // Hit Enemy Castle if in reach
      if (enemyCastleX - cat.x <= cat.attackRange + 30) {
        audio.playHit(false, false);
        spawnFx(enemyCastleX, 40, isArea ? 'aoe_burst' : 'hit');
        spawnDamageNum(enemyCastleX, 40, dmg, isCrit, true);
        enemyCastleHpRef.current = Math.max(0, enemyCastleHpRef.current - dmg);
        if (enemyCastleHpRef.current <= 0 && !battleResult.ended) {
          handleMatchEnd(true);
        }
      }
    }
  };

  // Enemy Attacks: Single-target vs Area Attack!
  const executeEnemyAttack = (enemy: ActiveEntity) => {
    const isArea = enemy.attackType === 'area';
    const dmg = enemy.attackPower;

    // Find cats in reach (in front of enemy towards player castle)
    const catsInReach = catsRef.current.filter(
      (c) => c.hp > 0 && c.x <= enemy.x + 25 && c.x >= enemy.x - enemy.attackRange - 30
    );

    if (catsInReach.length > 0) {
      if (isArea) {
        audio.playHit(false, true);
        spawnFx(enemy.x - enemy.attackRange * 0.5, 20, 'aoe_burst');

        catsInReach.forEach((c) => {
          const nextHp = Math.max(0, c.hp - dmg);
          c.hp = nextHp;
          spawnDamageNum(c.x, 25, dmg, false, false);

          const kbThreshold = c.maxHp / c.maxKnockbacks;
          const currentKBs = Math.floor((c.maxHp - nextHp) / kbThreshold);
          const shouldKb = currentKBs > c.knockbackCount;

          if (shouldKb) {
            audio.playKnockback();
            c.knockbackCount = currentKBs;
            c.state = 'knockback';
            c.knockbackVelocityX = 180;
            c.knockbackTimer = 0.4;
            c.x = Math.max(playerCastleX, c.x - 60);
            c.isWindupActive = false;
          }
        });
      } else {
        audio.playHit(false, false);
        // Frontmost cat is closest to enemy base (largest x)
        const target = [...catsInReach].sort((a, b) => b.x - a.x)[0];
        spawnFx(target.x, 20, 'hit');
        spawnDamageNum(target.x, 25, dmg, false, false);

        const nextHp = Math.max(0, target.hp - dmg);
        target.hp = nextHp;

        const kbThreshold = target.maxHp / target.maxKnockbacks;
        const currentKBs = Math.floor((target.maxHp - nextHp) / kbThreshold);
        const shouldKb = currentKBs > target.knockbackCount;

        if (shouldKb) {
          audio.playKnockback();
          target.knockbackCount = currentKBs;
          target.state = 'knockback';
          target.knockbackVelocityX = 180;
          target.knockbackTimer = 0.4;
          target.x = Math.max(playerCastleX, target.x - 60);
          target.isWindupActive = false;
        }
      }
    } else {
      // Hit Player Castle
      if (enemy.x - playerCastleX <= enemy.attackRange + 30) {
        audio.playHit(false, false);
        audio.playCastleDamage();
        spawnFx(playerCastleX, 40, 'hit');
        spawnDamageNum(playerCastleX, 40, dmg, false, false);
        playerCastleHpRef.current = Math.max(0, playerCastleHpRef.current - dmg);
        if (playerCastleHpRef.current <= 0 && !battleResult.ended) {
          handleMatchEnd(false);
        }
      }
    }
  };

  // Match Complete Handler
  const handleMatchEnd = (victory: boolean) => {
    isTerminatedRef.current = true;

    if (victory) {
      audio.playVictory();
    } else {
      audio.playDefeat();
    }

    // Treasure drop roll if victory
    let treasureDrop: { name: string; quality: TreasureQuality; description: string } | null = null;
    let treasureQuality: TreasureQuality = 'none';

    if (victory) {
      const trDef = TREASURES[stage.id];
      if (trDef) {
        if (activeItems.treasureRadar) {
          // Guaranteed Gold Treasure with Radar!
          treasureQuality = 'gold';
        } else {
          const isFestival = !!stage.treasureFestival;
          const roll = Math.random();
          if (isFestival) {
            if (roll < 0.65) {
              treasureQuality = 'gold';
            } else if (roll < 0.90) {
              treasureQuality = 'silver';
            } else {
              treasureQuality = 'bronze';
            }
          } else {
            if (roll < 0.35) {
              treasureQuality = 'gold';
            } else if (roll < 0.65) {
              treasureQuality = 'silver';
            } else if (roll < 0.88) {
              treasureQuality = 'bronze';
            }
          }
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

    let baseXp = victory ? stage.baseRewardXp : Math.floor(stage.baseRewardXp * 0.2);
    if (activeItems.catJobs && victory) {
      baseXp = Math.round(baseXp * 1.5);
    }
    const xpEarned = baseXp;
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
      >
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
      </BattleHud>

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
