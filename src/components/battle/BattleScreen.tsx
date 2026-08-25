import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { useGamepad } from '../../hooks/useGamepad';

interface BattleScreenProps {
  stage: StageDefinition;
  profile: PlayerProfile;
  activeItems?: BattleActiveItems;
  onBattleEnd: (result: {
    victory: boolean;
    xpEarned: number;
    catFoodEarned: number;
    treasureQuality?: TreasureQuality;
    scoreAttackScore?: number;
    moneySpent?: number;
    catsSpawned?: number;
    enemiesDefeated?: number;
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

  // Score Attack flags
  const isScoreAttack =
    stage.chapterId === 'challenge_score_attack' ||
    stage.id?.includes('score_attack') ||
    stage.difficultyLabel?.includes('スコアアタック');

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

  // Allies on Left (x = 140), Enemies on Right (x = battlefieldWidth - 140)
  const playerCastleX = 140;
  const enemyCastleX = battlefieldWidth - 140;

  // Initial Rich Cat item setup
  const initWorkerLvl = activeItems.richCat ? 8 : 1;
  const initBaseCap = 500 + initWorkerLvl * 250 + (workerWalletLevel - 1) * 150;
  const initMoney = activeItems.richCat ? Math.round(initBaseCap * treasureMoneyCapMult) : 100;

  // Timers & Waves tracking
  const battleTimeRef = useRef(0);
  const sniperTimerRef = useRef(0);
  const defeatedEnemiesCountRef = useRef(0);
  const bossSpawnedCountRef = useRef(0);
  const matchMoneySpentRef = useRef(0);
  const matchCatsSpawnedRef = useRef(0);
  const spawnedWaveIndicesRef = useRef<Set<number>>(new Set());
  const spawnedThresholdWavesRef = useRef<Set<number>>(new Set());
  const secretBossSpawnedRef = useRef(false);
  const isTerminatedRef = useRef(false);

  // Authoritative Simulation Refs
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
  const [cameraX, setCameraX] = useState(0); // Start showing player base on the left
  const [bossAlert, setBossAlert] = useState<string | null>(null);
  const [currentScore, setCurrentScore] = useState(700000);

  // Entities & visual fx for UI
  const [cats, setCats] = useState<ActiveEntity[]>([]);
  const [enemies, setEnemies] = useState<ActiveEntity[]>([]);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [visualEffects, setVisualEffects] = useState<VisualEffect[]>([]);
  const [deckCooldowns, setDeckCooldowns] = useState<Record<string, number>>({});
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);

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
  const deckSlotDefs = (profile.deck || []).slice(0, 10).map((catId) => {
    const def = CAT_DEFINITIONS.find((c) => c.id === catId) || CAT_DEFINITIONS[0];
    const catProg = profile.cats ? profile.cats[catId] : undefined;
    const activeFormIndex = catProg ? (catProg.activeForm || 0) : 0;
    const form = def?.forms?.[activeFormIndex] || def?.forms?.[0] || CAT_DEFINITIONS[0].forms[0];
    const cdReduction = (researchLevel - 1) * 0.05;
    const maxCooldown = Math.max(1.0, (form?.cooldown || 2.0) * (1 - cdReduction));
    return {
      def,
      activeFormIndex,
      cooldownRemaining: deckCooldowns[catId] || 0,
      maxCooldown,
      cost: form?.cost || 100,
    };
  });

  // Start Battle Music on Mount
  useEffect(() => {
    audio.unlockAudio();
    audio.startBattleBgm(stage.chapterId || stage.chapter, false, stage.isFinalBossStage, stage.id, stage.bgType);

    return () => {
      audio.stopBattleBgm();
    };
  }, [stage.chapter, stage.chapterId, stage.isFinalBossStage, stage.id, stage.bgType]);

  // Main 60FPS Game Loop
  useEffect(() => {
    let lastTime = performance.now();
    let animationFrameId: number;

    const gameTick = (currentTime: number) => {
      const rawDelta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const dt = Math.min(0.1, rawDelta) * gameSpeed;

      if (!isPaused && !battleResult.ended && !isTerminatedRef.current) {
        battleTimeRef.current += dt;

        // 1. Money Generation
        const ratePerSec = (15 + workerLevelRef.current * 10 + (workerRateLevel - 1) * 4) * treasureMoneyRateMult;
        moneyRef.current = Math.min(maxMoney, moneyRef.current + ratePerSec * dt);

        // 2. Cat Cannon Charging
        const cannonSecsToFull = Math.max(15, (60 - (cannonChargeLevel - 1) * 3) / treasureCannonChargeMult);
        cannonProgressRef.current = Math.min(100, cannonProgressRef.current + (100 / cannonSecsToFull) * dt);

        // 3. Update Deck Cooldowns
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
          if (wave.timeSeconds > 0 && battleTimeRef.current >= wave.timeSeconds && !spawnedWaveIndicesRef.current.has(idx)) {
            spawnedWaveIndicesRef.current.add(idx);
            spawnEnemy(wave.enemyId, wave.boss, wave.multiplier);
            if (wave.boss) {
              audio.playBossAppear();
              if (stage.id === 'legend_21_2' || stage.id?.includes('ancient_power') || stage.chapterId?.includes('legend_21')) {
                audio.switchBgm('ancient_power');
              } else if (stage.isFinalBossStage) {
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

          if (wave.castleHpThreshold && !spawnedThresholdWavesRef.current.has(idx)) {
            const hpPercent = (enemyCastleHpRef.current / stage.castleHp) * 100;
            if (hpPercent <= wave.castleHpThreshold) {
              spawnedThresholdWavesRef.current.add(idx);
              spawnEnemy(wave.enemyId, wave.boss, wave.multiplier);
              if (wave.boss) {
                audio.playBossAppear();
                if (stage.id === 'legend_21_2' || stage.id?.includes('ancient_power') || stage.chapterId?.includes('legend_21')) {
                  audio.switchBgm('ancient_power');
                } else if (stage.isFinalBossStage) {
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

        // 4b. Extreme Secret Boss Trigger (太古の力 エクストリーム裏ボス降臨)
        const isExtremeAncientPower =
          (stage.id === 'legend_21_2' && stage.isExtreme) ||
          (stage.chapterId === 'legend_21' && stage.isExtreme && stage.stageNumber === 2) ||
          stage.extremeBossTrigger;

        if (isExtremeAncientPower && !secretBossSpawnedRef.current) {
          const castleHpPercent = (enemyCastleHpRef.current / stage.castleHp) * 100;
          if (castleHpPercent <= 80 || battleTimeRef.current >= 45) {
            secretBossSpawnedRef.current = true;
            spawnEnemy('enemy_ancient_zero', true, 1.0);
            audio.playBossAppear();
            audio.switchBgm('boss_secret_god');
            setBossAlert('⚠️ EXTREME SECRET BOSS ⚠️ 太古の絶対支配者【真・古代神エンシェント・ゼロ】降臨！');
            setTimeout(() => setBossAlert(null), 6000);
          }
        }

        // 5. Update Active Units Physics & Attacks
        updateEntities(dt);

        // 5b. Live Score Attack Calculation
        if (isScoreAttack) {
          const timePenalty = Math.floor(battleTimeRef.current * 750);
          const killBonus = defeatedEnemiesCountRef.current * 4500;
          const castleDamage = Math.max(0, stage.castleHp - enemyCastleHpRef.current);
          const castleBonus = Math.floor((castleDamage / stage.castleHp) * 300000);
          const liveScore = Math.max(100, Math.min(999999, 700000 - timePenalty + killBonus + castleBonus));
          setCurrentScore(liveScore);
        }

        // 6. Update Visual Effects & Damage Numbers
        damageNumbersRef.current = damageNumbersRef.current
          .map((d) => ({ ...d, lifetime: d.lifetime + dt }))
          .filter((d) => d.lifetime < d.maxLifetime);

        visualEffectsRef.current = visualEffectsRef.current
          .map((fx) => ({ ...fx, lifetime: fx.lifetime + dt }))
          .filter((fx) => fx.lifetime < fx.maxLifetime);

        // Cap arrays to prevent unbounded growth and lag
        if (damageNumbersRef.current.length > 20) {
          damageNumbersRef.current = damageNumbersRef.current.slice(-20);
        }
        if (visualEffectsRef.current.length > 25) {
          visualEffectsRef.current = visualEffectsRef.current.slice(-25);
        }

        // 7. Sniper Item Automatic Support
        if (activeItems.sniper && enemiesRef.current.length > 0) {
          sniperTimerRef.current += dt;
          if (sniperTimerRef.current >= 8.0) {
            sniperTimerRef.current = 0;
            // Foremost enemy closest to player base (smallest X)
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
              target.knockbackVelocityX = 90;
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

        // 9. Synchronize ref state to React state
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
    if (workerLevelRef.current < maxWorkerLevel && moneyRef.current >= workerUpgradeCost) {
      handleUpgradeWorker();
      return;
    }

    if (cannonProgressRef.current >= 100 && enemiesRef.current.length > 2) {
      handleFireCannon();
      return;
    }

    for (const slot of deckSlotDefs) {
      if (moneyRef.current >= slot.cost && (deckCooldownsRef.current[slot.def.id] || 0) <= 0) {
        handleSpawnCat(slot.def.id);
        break;
      }
    }
  };

  // Spawn Cat Handler (Spawns at playerCastleX on the Left)
  const handleSpawnCat = (catId: string) => {
    const slot = deckSlotDefs.find((s) => s.def.id === catId);
    if (!slot || moneyRef.current < slot.cost || (deckCooldownsRef.current[catId] || 0) > 0) return;

    const form = slot.def.forms[slot.activeFormIndex];
    const catLevel = profile.cats[catId]?.level || 1;
    const levelMult = 1 + (catLevel - 1) * 0.1;

    const newCat: ActiveEntity = {
      instanceId: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      defId: catId,
      name: form.name,
      isCat: true,
      x: playerCastleX,
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
      abilities: form.abilities,
      state: 'walk',
      animTimer: 0,
      knockbackVelocityX: 0,
      knockbackTimer: 0,
      hitFlashTimer: 0,
    };

    moneyRef.current -= form.cost;
    matchMoneySpentRef.current += form.cost;
    matchCatsSpawnedRef.current += 1;
    deckCooldownsRef.current[catId] = slot.maxCooldown;
    catsRef.current.push(newCat);

    audio.playCatSpawn(1.0, slot.def.rarity);
  };

  // Spawn Enemy Helper (Spawns at enemyCastleX on the Right)
  const spawnEnemy = (enemyId: string, isBoss: boolean = false, customMultiplier?: number) => {
    const def = ENEMY_DEFINITIONS[enemyId] || ENEMY_DEFINITIONS.enemy_doge;
    
    // Check if a boss has already spawned in this match to prevent multiple bosses appearing
    const isStageBossCandidate = isBoss || def.isBoss;
    const canSpawnAsBoss = isStageBossCandidate && bossSpawnedCountRef.current === 0;
    if (isStageBossCandidate && canSpawnAsBoss) {
      bossSpawnedCountRef.current += 1;
    }
    const isBossEntity = canSpawnAsBoss;

    // Calculate stage multiplier (真レジェンドや魔界編では昔の敵のステータス倍率が上昇、真レジェ最新ボスや古代種・悪魔種は1.0倍)
    let multiplier = customMultiplier || 1.0;
    if (!customMultiplier) {
      const isRealLegend = stage.chapterId?.startsWith('real_legend');
      const isAkuRealm = stage.chapterId?.startsWith('aku_realm');
      const isLateLegend = stage.chapterId?.startsWith('legend_') && parseInt(stage.chapterId.replace('legend_', ''), 10) >= 10;
      
      const isNewOrSpecialEnemy = 
        def.traits?.includes('ancient') || 
        def.traits?.includes('aku') || 
        enemyId.includes('ancient') || 
        enemyId.includes('relic') || 
        enemyId.includes('aku') || 
        enemyId.startsWith('enemy_real_ancient') ||
        enemyId.startsWith('enemy_hell_') ||
        enemyId.startsWith('enemy_sister_') ||
        enemyId.startsWith('enemy_mamomo') ||
        enemyId.startsWith('enemy_guilty_') ||
        enemyId.startsWith('enemy_midnight_') ||
        enemyId.startsWith('enemy_demon_lord_') ||
        enemyId.startsWith('enemy_filibuster') ||
        enemyId.includes('cyclone') ||
        enemyId.includes('clionel') ||
        enemyId.includes('hannya');

      if (isRealLegend) {
        // 真レジェンド: 昔の敵(初期キャラ)だけ 3.0倍〜3.5倍、最新ボスや古代種は等倍(1.0)
        if (!isNewOrSpecialEnemy) {
          multiplier = 3.5;
        } else {
          multiplier = 1.0;
        }
      } else if (isAkuRealm) {
        // 魔界編: 昔の敵は 2.5倍、悪魔種・ボスは等倍(1.0)
        if (!isNewOrSpecialEnemy) {
          multiplier = 2.5;
        } else {
          multiplier = 1.0;
        }
      } else if (isLateLegend) {
        // 後半レジェンド
        if (!isNewOrSpecialEnemy) {
          multiplier = 1.8;
        }
      }
    }

    // エクストリームモード: 全敵倍率 1.5倍！
    if (stage.isExtreme) {
      multiplier *= 1.5;
    }

    const calculatedHp = Math.round(def.hp * multiplier);
    const calculatedAtk = Math.round(def.attackPower * multiplier);
    const calculatedBarrier = def.abilities?.barrier?.hp ? Math.round(def.abilities.barrier.hp * multiplier) : undefined;
    const calculatedShield = def.abilities?.shield?.hp ? Math.round(def.abilities.shield.hp * multiplier) : undefined;

    const newEnemy: ActiveEntity = {
      instanceId: `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      defId: enemyId,
      name: def.name,
      isCat: false,
      x: enemyCastleX,
      y: 0,
      hp: calculatedHp,
      maxHp: calculatedHp,
      attackPower: calculatedAtk,
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
      isBoss: isBossEntity,
      waveLevel: def.waveLevel,
      abilities: def.abilities,
      burrowRemaining: def.abilities?.burrow?.count,
      reviveCountRemaining: def.abilities?.revive?.count,
      barrierHp: calculatedBarrier,
      maxBarrierHp: calculatedBarrier,
      shieldHp: calculatedShield,
      maxShieldHp: calculatedShield,
      isCharging: false,
      chargeTimer: def.abilities?.chargeAttack?.chargeTime,
      maxChargeTime: def.abilities?.chargeAttack?.chargeTime,
      state: 'walk',
      animTimer: 0,
      knockbackVelocityX: 0,
      knockbackTimer: 0,
      hitFlashTimer: 0,
    };

    enemiesRef.current.push(newEnemy);

    // Boss Spawn Shockwave (Pushes allied cats leftwards towards player base)
    if (isBossEntity) {
      audio.playBossAppear();
      spawnFx(enemyCastleX - 60, 45, 'boss_shockwave');
      catsRef.current.forEach((c) => {
        c.state = 'knockback';
        c.knockbackVelocityX = 220;
        c.knockbackTimer = 0.55;
        c.x = Math.max(playerCastleX, c.x - 130);
        c.isWindupActive = false;
      });
    }
  };

  // Upgrade Worker Cat
  const handleUpgradeWorker = () => {
    if (workerLevelRef.current >= maxWorkerLevel || moneyRef.current < workerUpgradeCost) return;
    moneyRef.current -= workerUpgradeCost;
    workerLevelRef.current += 1;
    setWorkerLevel(workerLevelRef.current);
    audio.playWorkerUpgrade();
  };

  // Fire Cat Cannon (にゃんこ砲 - Shoots from Left Base to Right)
  const handleFireCannon = () => {
    if (cannonProgressRef.current < 100 || isCannonFiring) return;
    setIsCannonFiring(true);
    cannonProgressRef.current = 0;
    setCannonProgress(0);
    audio.playCannonFire();

    const cannonDmg = Math.round((400 + cannonPowerLevel * 180) * treasureCannonPowerMult);

    setTimeout(() => {
      enemiesRef.current.forEach((enemy) => {
        // Cannon can break barriers if damage >= barrierHp
        let damageToApply = cannonDmg;
        if (enemy.barrierHp && enemy.barrierHp > 0) {
          if (cannonDmg >= enemy.barrierHp) {
            enemy.barrierHp = 0;
            spawnFx(enemy.x, 30, 'barrier_break');
          } else {
            damageToApply = 0;
            spawnFx(enemy.x, 30, 'barrier_hit');
            spawnDamageNum(enemy.x, 30, 0, false, true, true);
          }
        }

        const nextHp = Math.max(0, enemy.hp - damageToApply);
        enemy.hp = nextHp;
        if (damageToApply > 0) {
          spawnDamageNum(enemy.x, 30, damageToApply, true, true);
        }

        // Cannon forces knockback & resets Filibuster charge
        enemy.state = 'knockback';
        enemy.knockbackVelocityX = 220;
        enemy.knockbackTimer = 0.5;
        enemy.x = Math.min(enemyCastleX, enemy.x + 80);
        enemy.isWindupActive = false;
        if (enemy.abilities?.chargeAttack) {
          enemy.chargeTimer = enemy.abilities.chargeAttack.chargeTime;
          enemy.isCharging = false;
        }
      });
      setIsCannonFiring(false);
    }, 450);
  };

  const spawnDamageNum = (x: number, y: number, value: number, isCritical: boolean, isCatDamage: boolean, isBarrierBlock?: boolean) => {
    const newDmg: DamageNumber = {
      id: `dmg_${Date.now()}_${Math.random()}`,
      x,
      y,
      value,
      isCritical,
      isCatDamage,
      isBarrierBlock,
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
      maxLifetime: type === 'filibuster_oblivion' ? 2.5 : type === 'warp_portal' ? 0.6 : 0.35,
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

    // 1. UPDATE CATS (Moving Rightwards: x increases)
    for (let i = 0; i < catsRef.current.length; i++) {
      const cat = catsRef.current[i];
      cat.animTimer += dt;

      // Status timers
      if (cat.freezeTimer && cat.freezeTimer > 0) {
        cat.freezeTimer -= dt;
      }
      if (cat.slowTimer && cat.slowTimer > 0) {
        cat.slowTimer -= dt;
      }
      if (cat.weakenTimer && cat.weakenTimer > 0) {
        cat.weakenTimer -= dt;
      }

      // Knockback pushes cat leftwards towards player base
      if (cat.state === 'knockback') {
        cat.knockbackTimer -= dt;
        cat.x = Math.max(playerCastleX, cat.x - cat.knockbackVelocityX * dt);
        if (cat.knockbackTimer <= 0) {
          cat.state = 'walk';
        }
        continue;
      }

      // Frozen units cannot walk or attack
      if (cat.freezeTimer && cat.freezeTimer > 0) {
        cat.isWindupActive = false;
        continue;
      }

      if (cat.attackTimer > 0) {
        cat.attackTimer -= dt;
      }

      // Enemies in front of cat are to the right (targetable if not burrowing and not reviving)
      const enemiesInFront = enemiesRef.current.filter(
        (e) => e.hp > 0 && e.state !== 'burrow' && e.state !== 'revive' && e.x >= cat.x - 15
      );
      const closestEnemyX = enemiesInFront.length > 0 ? Math.min(...enemiesInFront.map((e) => e.x)) : enemyCastleX;
      const targetDistance = Math.max(0, closestEnemyX - cat.x);

      // Clamp so cat never passes enemy frontline
      if (cat.x > closestEnemyX - 5) {
        cat.x = Math.max(playerCastleX, closestEnemyX - 5);
      }

      if (targetDistance <= cat.attackRange) {
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
        cat.state = 'walk';
        cat.isWindupActive = false;
        const currentSpeed = (cat.slowTimer && cat.slowTimer > 0) ? cat.speed * 0.25 : cat.speed;
        const nextX = cat.x + currentSpeed * dt;
        cat.x = Math.min(closestEnemyX - 5, Math.min(enemyCastleX, nextX));
      }
    }

    // 2. UPDATE ENEMIES (Moving Leftwards: x decreases)
    for (let i = 0; i < enemiesRef.current.length; i++) {
      const enemy = enemiesRef.current[i];
      enemy.animTimer += dt;

      // Status timers
      if (enemy.freezeTimer && enemy.freezeTimer > 0) {
        enemy.freezeTimer -= dt;
      }
      if (enemy.slowTimer && enemy.slowTimer > 0) {
        enemy.slowTimer -= dt;
      }
      if (enemy.weakenTimer && enemy.weakenTimer > 0) {
        enemy.weakenTimer -= dt;
      }

      // Handle Zombie Reviving Corpse State
      if (enemy.state === 'revive') {
        if (enemy.reviveTimer !== undefined) {
          enemy.reviveTimer -= dt;
          if (enemy.reviveTimer <= 0) {
            enemy.hp = Math.round(enemy.maxHp * ((enemy.reviveHpPercent || 100) / 100));
            enemy.state = 'walk';
            enemy.isReviving = false;
            spawnFx(enemy.x, 25, 'aoe_burst');
            audio.playBossAppear();
          }
        }
        continue;
      }

      // Knockback pushes enemy rightwards towards enemy castle
      if (enemy.state === 'knockback') {
        enemy.knockbackTimer -= dt;
        enemy.x = Math.min(enemyCastleX, enemy.x + enemy.knockbackVelocityX * dt);
        // Reset charge on knockback
        if (enemy.abilities?.chargeAttack) {
          enemy.chargeTimer = enemy.abilities.chargeAttack.chargeTime;
          enemy.isCharging = false;
        }
        if (enemy.knockbackTimer <= 0) {
          enemy.state = 'walk';
        }
        continue;
      }

      // Handle Filibuster / Charge Attack Boss Mechanics
      if (enemy.abilities?.chargeAttack && enemy.state !== 'burrow' && enemy.state !== 'revive') {
        if (enemy.state === 'knockback') {
          // Being knocked back interrupts and cancels the current charge!
          enemy.chargeTimer = enemy.abilities.chargeAttack.chargeTime;
          enemy.isCharging = false;
        } else {
          enemy.isCharging = true;
          enemy.chargeTimer = (enemy.chargeTimer ?? enemy.abilities.chargeAttack.chargeTime) - dt;

          // Visual charge aura & audio pulsing
          if (Math.random() < 0.22) {
            spawnFx(enemy.x, 50, 'filibuster_charge');
          }

          // Charge completed -> TRIGGER 9,999,999 OBLIVION / GAME OVER
          if (enemy.chargeTimer <= 0) {
            enemy.chargeTimer = enemy.abilities.chargeAttack.chargeTime;
            audio.playBossAppear();
            audio.playCastleDamage();
            spawnFx(playerCastleX + 300, 60, 'filibuster_oblivion');

            // Obliterate all allied cats on field
            catsRef.current.forEach((c) => {
              c.hp = 0;
              spawnDamageNum(c.x, 35, 9999999, true, false);
              spawnFx(c.x, 30, 'cat_soul');
            });

            // Instantly destroy player castle -> Game Over
            playerCastleHpRef.current = 0;
            setPlayerCastleHp(0);
            handleMatchEnd(false);
            return;
          }

          // Filibuster slowly advances or hovers in charging posture, but NEVER triggers normal attacks!
          enemy.state = 'attack';
          const currentSpeed = (enemy.slowTimer && enemy.slowTimer > 0) ? enemy.speed * 0.25 : enemy.speed;
          const nextX = enemy.x - currentSpeed * dt;
          enemy.x = Math.max(playerCastleX + 160, nextX);
          continue;
        }
      }

      // Handle Zombie Burrow State
      if (enemy.state === 'burrow') {
        const undergroundSpeed = enemy.speed * 2.2;
        enemy.x = Math.max(playerCastleX + 60, enemy.x - undergroundSpeed * dt);
        if (enemy.burrowDistanceLeft !== undefined) {
          enemy.burrowDistanceLeft -= undergroundSpeed * dt;
          if (enemy.burrowDistanceLeft <= 0 || enemy.x <= playerCastleX + 70) {
            enemy.state = 'walk';
            enemy.isBurrowing = false;
            spawnFx(enemy.x, 20, 'zombie_burrow');
          }
        }
        continue;
      }

      // Frozen units cannot walk or attack
      if (enemy.freezeTimer && enemy.freezeTimer > 0) {
        enemy.isWindupActive = false;
        continue;
      }

      if (enemy.attackTimer > 0) {
        enemy.attackTimer -= dt;
      }

      // Cats in front of enemy are to the left (c.x <= enemy.x + 15)
      const catsInFront = catsRef.current.filter((c) => c.hp > 0 && c.x <= enemy.x + 15);
      const closestCatX = catsInFront.length > 0 ? Math.max(...catsInFront.map((c) => c.x)) : playerCastleX;
      const targetDistance = Math.max(0, enemy.x - closestCatX);

      // Check Zombie Burrow Trigger
      if (
        enemy.abilities?.burrow &&
        (enemy.burrowRemaining ?? enemy.abilities.burrow.count) > 0 &&
        enemy.state === 'walk' &&
        targetDistance <= 120 &&
        enemy.x > playerCastleX + 160
      ) {
        enemy.burrowRemaining = (enemy.burrowRemaining ?? enemy.abilities.burrow.count) - 1;
        enemy.isBurrowing = true;
        enemy.state = 'burrow';
        enemy.burrowDistanceLeft = enemy.abilities.burrow.distance;
        spawnFx(enemy.x, 20, 'zombie_burrow');
        continue;
      }

      // Clamp so enemy never passes cat frontline
      if (enemy.x < closestCatX + 5) {
        enemy.x = Math.min(enemyCastleX, closestCatX + 5);
      }

      if (targetDistance <= enemy.attackRange) {
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
        enemy.state = 'walk';
        enemy.isWindupActive = false;
        const currentSpeed = (enemy.slowTimer && enemy.slowTimer > 0) ? enemy.speed * 0.25 : enemy.speed;
        const nextX = enemy.x - currentSpeed * dt;
        enemy.x = Math.max(closestCatX + 5, Math.max(playerCastleX, nextX));
      }
    }

    // Filter dead entities with soul ascension FX
    catsRef.current.forEach((c) => {
      if (c.hp <= 0) {
        spawnFx(c.x, 30, 'cat_soul');
      }
    });

    enemiesRef.current.forEach((e) => {
      if (e.hp <= 0 && e.state !== 'revive') {
        if (e.isPermadead) {
          spawnFx(e.x, 35, 'zombie_killer_fx');
        } else if (e.abilities?.revive && (e.reviveCountRemaining ?? e.abilities.revive.count) > 0) {
          // Transition into revive corpse state
          e.isReviving = true;
          e.state = 'revive';
          e.reviveCountRemaining = (e.reviveCountRemaining ?? e.abilities.revive.count) - 1;
          e.reviveTimer = e.abilities.revive.delaySeconds || 3.0;
          e.reviveHpPercent = e.abilities.revive.hpPercent || 100;
          spawnFx(e.x, 20, 'zombie_revive');
        } else {
          spawnFx(e.x, 25, 'aoe_burst');

          // 遺志の烈波 (Death Surge) Trigger
          if (e.abilities?.deathSurge && Math.random() < e.abilities.deathSurge.chance) {
            const deathSurgeLvl = e.abilities.deathSurge.level || 2;
            const surgeX = Math.max(playerCastleX, e.x - 30);
            audio.playSurge();
            spawnFx(surgeX, 50, 'surge_burst');

            // Surge damage to cats in area over time
            const surgeCats = catsRef.current.filter(
              (c) => c.hp > 0 && Math.abs(c.x - surgeX) <= 130
            );
            surgeCats.forEach((c) => {
              const surgeDmg = Math.round(e.attackPower * (deathSurgeLvl * 0.8));
              c.hp = Math.max(0, c.hp - surgeDmg);
              spawnDamageNum(c.x, 40, surgeDmg, false, false);
              c.state = 'knockback';
              c.knockbackVelocityX = 160;
              c.knockbackTimer = 0.35;
              c.x = Math.max(playerCastleX, c.x - 50);
            });
          }
        }
      }
    });

    catsRef.current = catsRef.current.filter((c) => c.hp > 0);
    enemiesRef.current = enemiesRef.current.filter((e) => e.hp > 0 || e.state === 'revive');
  };

  // Cat Attacks: Single-target vs Area Attack (Attacking Rightwards)
  const executeCatAttack = (cat: ActiveEntity) => {
    const isArea = cat.attackType === 'area';
    let critChance = 0.15;
    if (cat.defId === 'cat_jura') {
      critChance = cat.formIndex === 1 ? 0.75 : 0.5;
    }
    const isCrit = Math.random() < critChance;

    // Damage multiplier if cat is weakened
    const weakenMult = (cat.weakenTimer && cat.weakenTimer > 0) ? (cat.weakenMultiplier || 0.5) : 1.0;
    const baseAtkDmg = cat.attackPower * weakenMult;

    // Enemies within reach to the right of cat (excluding burrowing and dead/reviving)
    const enemiesInReach = enemiesRef.current.filter(
      (e) => e.hp > 0 && e.state !== 'burrow' && e.state !== 'revive' && e.x >= cat.x - 25 && e.x <= cat.x + cat.attackRange + 30
    );

    const applyAbilitiesToEnemy = (e: ActiveEntity, dmgGiven: number, willDie: boolean) => {
      const eTraits = e.traits || [];

      // Zombie Killer
      if (cat.abilities?.zombieKiller && eTraits.includes('zombie') && willDie) {
        e.isPermadead = true;
      }

      // Freeze ability
      if (cat.abilities?.freeze) {
        const { chance, duration, traits } = cat.abilities.freeze;
        const matchesTrait = !traits || traits.length === 0 || traits.some((t) => eTraits.includes(t));
        if (matchesTrait && Math.random() < chance) {
          e.freezeTimer = duration;
          spawnFx(e.x, 35, 'freeze_fx');
        }
      }

      // Slow ability
      if (cat.abilities?.slow) {
        const { chance, duration, traits } = cat.abilities.slow;
        const matchesTrait = !traits || traits.length === 0 || traits.some((t) => eTraits.includes(t));
        if (matchesTrait && Math.random() < chance) {
          e.slowTimer = duration;
          spawnFx(e.x, 35, 'slow_fx');
        }
      }

      // Weaken ability
      if (cat.abilities?.weaken) {
        const { chance, duration, mult, traits } = cat.abilities.weaken;
        const matchesTrait = !traits || traits.length === 0 || traits.some((t) => eTraits.includes(t));
        if (matchesTrait && Math.random() < chance) {
          e.weakenTimer = duration;
          e.weakenMultiplier = mult;
          spawnFx(e.x, 35, 'weaken_fx');
        }
      }

      // Knockback ability
      if (cat.abilities?.knockback) {
        const { chance, traits } = cat.abilities.knockback;
        const matchesTrait = !traits || traits.length === 0 || traits.some((t) => eTraits.includes(t));
        if (matchesTrait && Math.random() < chance) {
          audio.playKnockback();
          e.state = 'knockback';
          e.knockbackVelocityX = 220;
          e.knockbackTimer = 0.5;
          e.x = Math.min(enemyCastleX, e.x + 80);
          e.isWindupActive = false;
        }
      }

      // Special Surfer freeze fallback
      if (cat.defId === 'cat_surfer' && eTraits.includes('alien')) {
        if (Math.random() < 0.6) {
          e.freezeTimer = 2.5;
          spawnFx(e.x, 35, 'freeze_fx');
        }
      }
    };

    if (enemiesInReach.length > 0) {
      if (isArea) {
        audio.playHit(isCrit, true);
        spawnFx(cat.x + cat.attackRange * 0.5, 20, isCrit ? 'crit_flash' : 'aoe_burst');

        enemiesInReach.forEach((e) => {
          const isMetal = e.traits?.includes('metal');
          let dmgScale = isCrit ? 2.0 : 1.0;

          // Massive Damage ability
          if (cat.abilities?.massiveDamage) {
            const { mult, traits } = cat.abilities.massiveDamage;
            const matchesTrait = !traits || traits.length === 0 || traits.some((t) => e.traits?.includes(t));
            if (matchesTrait) {
              dmgScale *= mult;
            }
          }

          let actualDmg = Math.round(baseAtkDmg * dmgScale);
          if (isMetal) {
            if (isCrit) {
              actualDmg = Math.round(baseAtkDmg * 2.0);
              spawnFx(e.x, 25, 'crit_flash');
            } else {
              actualDmg = 1;
              spawnFx(e.x, 25, 'metal_spark');
            }
          }

          // Star Alien Barrier Logic
          if (e.barrierHp && e.barrierHp > 0) {
            const hasBreaker = cat.abilities?.barrierBreaker && Math.random() < cat.abilities.barrierBreaker.chance;
            if (hasBreaker || actualDmg >= e.barrierHp) {
              // Barrier shattered!
              e.barrierHp = 0;
              spawnFx(e.x, 35, 'barrier_break');
              audio.playKnockback();
            } else {
              // Damage completely absorbed by barrier
              actualDmg = 0;
              spawnFx(e.x, 30, 'barrier_hit');
              spawnDamageNum(e.x, 25, 0, false, true, true);
            }
          }

          // Aku Shield (悪魔シールド) Logic
          if (e.shieldHp && e.shieldHp > 0) {
            const hasPiercer = cat.abilities?.shieldPiercer && Math.random() < cat.abilities.shieldPiercer.chance;
            if (hasPiercer) {
              // Shield pierced and destroyed instantly!
              e.shieldHp = 0;
              spawnFx(e.x, 35, 'shield_break');
              audio.playShieldBreak();
            } else if (actualDmg >= e.shieldHp) {
              // Shield absorbs part of damage, then breaks
              actualDmg -= e.shieldHp;
              e.shieldHp = 0;
              spawnFx(e.x, 35, 'shield_break');
              audio.playShieldBreak();
            } else {
              // Damage entirely absorbed by shield
              e.shieldHp -= actualDmg;
              actualDmg = 0;
              spawnFx(e.x, 30, 'shield_hit');
              audio.playHit(false, true);
            }
          }

          const nextHp = Math.max(0, e.hp - actualDmg);
          const willDie = nextHp <= 0;

          applyAbilitiesToEnemy(e, actualDmg, willDie);

          e.hp = nextHp;
          if (actualDmg > 0) {
            spawnDamageNum(e.x, 25, actualDmg, isCrit, true);
          }

          const maxKbs = Math.max(1, e.maxKnockbacks || 1);
          const kbThreshold = e.maxHp / maxKbs;
          const currentKBs = Math.floor((e.maxHp - nextHp) / kbThreshold);
          const shouldKb = currentKBs > (e.knockbackCount || 0);

          if (willDie) {
            defeatedEnemiesCountRef.current += 1;
            const def = ENEMY_DEFINITIONS[e.defId];
            if (def) {
              moneyRef.current = Math.min(maxMoney, moneyRef.current + def.rewardMoney);
            }
          }

          if (shouldKb && e.state !== 'knockback') {
            audio.playKnockback();
            e.knockbackCount = currentKBs;
            e.state = 'knockback';
            e.knockbackVelocityX = 180;
            e.knockbackTimer = 0.4;
            e.x = Math.min(enemyCastleX, e.x + 60);
            e.isWindupActive = false;
            if (e.abilities?.chargeAttack) {
              e.chargeTimer = e.abilities.chargeAttack.chargeTime;
              e.isCharging = false;
            }
          }
        });
      } else {
        // Single target: closest enemy to cat (smallest x)
        audio.playHit(isCrit, false);
        const target = [...enemiesInReach].sort((a, b) => a.x - b.x)[0];

        const isMetal = target.traits?.includes('metal');
        let dmgScale = isCrit ? 2.0 : 1.0;

        if (cat.abilities?.massiveDamage) {
          const { mult, traits } = cat.abilities.massiveDamage;
          const matchesTrait = !traits || traits.length === 0 || traits.some((t) => target.traits?.includes(t));
          if (matchesTrait) {
            dmgScale *= mult;
          }
        }

        let actualDmg = Math.round(baseAtkDmg * dmgScale);
        if (isMetal) {
          if (isCrit) {
            actualDmg = Math.round(baseAtkDmg * 2.0);
            spawnFx(target.x, 25, 'crit_flash');
          } else {
            actualDmg = 1;
            spawnFx(target.x, 25, 'metal_spark');
          }
        } else {
          spawnFx(target.x, 20, isCrit ? 'crit_flash' : 'hit');
        }

        // Star Alien Barrier Logic (Single Target)
        if (target.barrierHp && target.barrierHp > 0) {
          const hasBreaker = cat.abilities?.barrierBreaker && Math.random() < cat.abilities.barrierBreaker.chance;
          if (hasBreaker || actualDmg >= target.barrierHp) {
            target.barrierHp = 0;
            spawnFx(target.x, 35, 'barrier_break');
            audio.playKnockback();
          } else {
            actualDmg = 0;
            spawnFx(target.x, 30, 'barrier_hit');
            spawnDamageNum(target.x, 25, 0, false, true, true);
          }
        }

        // Aku Shield (悪魔シールド) Logic (Single Target)
        if (target.shieldHp && target.shieldHp > 0) {
          const hasPiercer = cat.abilities?.shieldPiercer && Math.random() < cat.abilities.shieldPiercer.chance;
          if (hasPiercer) {
            target.shieldHp = 0;
            spawnFx(target.x, 35, 'shield_break');
            audio.playShieldBreak();
          } else if (actualDmg >= target.shieldHp) {
            actualDmg -= target.shieldHp;
            target.shieldHp = 0;
            spawnFx(target.x, 35, 'shield_break');
            audio.playShieldBreak();
          } else {
            target.shieldHp -= actualDmg;
            actualDmg = 0;
            spawnFx(target.x, 30, 'shield_hit');
            audio.playHit(false, true);
          }
        }

        const nextHp = Math.max(0, target.hp - actualDmg);
        const willDie = nextHp <= 0;

        applyAbilitiesToEnemy(target, actualDmg, willDie);

        if (actualDmg > 0) {
          spawnDamageNum(target.x, 25, actualDmg, isCrit, true);
        }
        target.hp = nextHp;

        const maxKbs = Math.max(1, target.maxKnockbacks || 1);
        const kbThreshold = target.maxHp / maxKbs;
        const currentKBs = Math.floor((target.maxHp - nextHp) / kbThreshold);
        const shouldKb = currentKBs > (target.knockbackCount || 0);

        if (willDie) {
          defeatedEnemiesCountRef.current += 1;
          const def = ENEMY_DEFINITIONS[target.defId];
          if (def) {
            moneyRef.current = Math.min(maxMoney, moneyRef.current + def.rewardMoney);
          }
        }

        if (shouldKb && target.state !== 'knockback') {
          audio.playKnockback();
          target.knockbackCount = currentKBs;
          target.state = 'knockback';
          target.knockbackVelocityX = 180;
          target.knockbackTimer = 0.4;
          target.x = Math.min(enemyCastleX, target.x + 60);
          target.isWindupActive = false;
          if (target.abilities?.chargeAttack) {
            target.chargeTimer = target.abilities.chargeAttack.chargeTime;
            target.isCharging = false;
          }
        }
      }
    } else {
      // Hit Enemy Castle on Right
      if (enemyCastleX - cat.x <= cat.attackRange + 30) {
        audio.playHit(false, false);
        spawnFx(enemyCastleX, 40, isArea ? 'aoe_burst' : 'hit');
        const dmg = Math.round(baseAtkDmg * (isCrit ? 2.0 : 1.0));
        spawnDamageNum(enemyCastleX, 40, dmg, isCrit, true);
        enemyCastleHpRef.current = Math.max(0, enemyCastleHpRef.current - dmg);
        if (enemyCastleHpRef.current <= 0 && !battleResult.ended) {
          handleMatchEnd(true);
        }
      }
    }
  };

  // Enemy Attacks: Single-target vs Area Attack (Attacking Leftwards)
  const executeEnemyAttack = (enemy: ActiveEntity) => {
    const isArea = enemy.attackType === 'area';
    const weakenMult = (enemy.weakenTimer && enemy.weakenTimer > 0) ? (enemy.weakenMultiplier || 0.5) : 1.0;

    // Savage Blow (渾身の一撃 - e.g. Hell Gorilla 50% 3x Damage)
    let isSavage = false;
    let savageMult = 1.0;
    if (enemy.abilities?.savageBlow && Math.random() < enemy.abilities.savageBlow.chance) {
      isSavage = true;
      savageMult = enemy.abilities.savageBlow.mult || 3.0;
      audio.playSavageBlow();
      spawnFx(enemy.x - 30, 40, 'savage_blow');
    }

    const dmg = Math.round(enemy.attackPower * weakenMult * savageMult);

    // Cats within reach to the left of enemy
    const catsInReach = catsRef.current.filter(
      (c) => c.hp > 0 && c.x <= enemy.x + 25 && c.x >= enemy.x - enemy.attackRange - 30
    );

    const applyEnemyAbilitiesToCat = (c: ActiveEntity) => {
      if (enemy.abilities?.freeze && Math.random() < enemy.abilities.freeze.chance) {
        c.freezeTimer = enemy.abilities.freeze.duration;
        spawnFx(c.x, 30, 'freeze_fx');
      }
      if (enemy.abilities?.slow && Math.random() < enemy.abilities.slow.chance) {
        c.slowTimer = enemy.abilities.slow.duration;
        spawnFx(c.x, 30, 'slow_fx');
      }
      if (enemy.abilities?.weaken && Math.random() < enemy.abilities.weaken.chance) {
        c.weakenTimer = enemy.abilities.weaken.duration;
        c.weakenMultiplier = enemy.abilities.weaken.mult;
        spawnFx(c.x, 30, 'weaken_fx');
      }
      if (enemy.abilities?.knockback && Math.random() < enemy.abilities.knockback.chance) {
        audio.playKnockback();
        c.state = 'knockback';
        c.knockbackVelocityX = 200;
        c.knockbackTimer = 0.45;
        c.x = Math.max(playerCastleX, c.x - 70);
        c.isWindupActive = false;
      }
      // Star Alien Warp Ability (Teleports cat leftwards towards player castle)
      if (enemy.abilities?.warp && Math.random() < enemy.abilities.warp.chance) {
        spawnFx(c.x, 25, 'warp_fx');
        const warpDistance = enemy.abilities.warp.distance || 120;
        c.x = Math.max(playerCastleX + 60, c.x - warpDistance);
        c.isWindupActive = false;
        c.state = 'walk';
        setTimeout(() => {
          spawnFx(c.x, 25, 'warp_fx');
        }, 120);
      }
    };

    if (catsInReach.length > 0) {
      if (isArea) {
        audio.playHit(isSavage, true);
        spawnFx(enemy.x - enemy.attackRange * 0.5, 20, isSavage ? 'savage_blow' : 'aoe_burst');

        catsInReach.forEach((c) => {
          applyEnemyAbilitiesToCat(c);
          const nextHp = Math.max(0, c.hp - dmg);
          c.hp = nextHp;
          spawnDamageNum(c.x, 25, dmg, isSavage, false);

          const maxKbs = Math.max(1, c.maxKnockbacks || 1);
          const kbThreshold = c.maxHp / maxKbs;
          const currentKBs = Math.floor((c.maxHp - nextHp) / kbThreshold);
          const shouldKb = currentKBs > (c.knockbackCount || 0);

          if (shouldKb && c.state !== 'knockback') {
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
        audio.playHit(isSavage, false);
        // Frontmost cat is closest to enemy (largest x)
        const target = [...catsInReach].sort((a, b) => b.x - a.x)[0];
        spawnFx(target.x, 20, isSavage ? 'savage_blow' : 'hit');
        applyEnemyAbilitiesToCat(target);
        spawnDamageNum(target.x, 25, dmg, isSavage, false);

        const nextHp = Math.max(0, target.hp - dmg);
        target.hp = nextHp;

        const maxKbs = Math.max(1, target.maxKnockbacks || 1);
        const kbThreshold = target.maxHp / maxKbs;
        const currentKBs = Math.floor((target.maxHp - nextHp) / kbThreshold);
        const shouldKb = currentKBs > (target.knockbackCount || 0);

        if (shouldKb && target.state !== 'knockback') {
          audio.playKnockback();
          target.knockbackCount = currentKBs;
          target.state = 'knockback';
          target.knockbackVelocityX = 180;
          target.knockbackTimer = 0.4;
          target.x = Math.max(playerCastleX, target.x - 60);
          target.isWindupActive = false;
        }
      }

      // Surge (烈波) Mechanics
      if (enemy.abilities?.surge && Math.random() < enemy.abilities.surge.chance) {
        const surgeLvl = enemy.abilities.surge.level || 2;
        const minSpawnX = Math.max(playerCastleX, enemy.x - (enemy.abilities.surge.maxDistance || 500));
        const maxSpawnX = Math.max(playerCastleX, enemy.x - (enemy.abilities.surge.minDistance || 200));
        const surgeX = minSpawnX + Math.random() * (maxSpawnX - minSpawnX);
        audio.playSurge();
        spawnFx(surgeX, 55, 'surge_burst');

        const surgeHitCats = catsRef.current.filter(
          (c) => c.hp > 0 && Math.abs(c.x - surgeX) <= 120
        );
        surgeHitCats.forEach((c) => {
          applyEnemyAbilitiesToCat(c);
          const surgeDmg = Math.round(enemy.attackPower * surgeLvl * 0.75);
          c.hp = Math.max(0, c.hp - surgeDmg);
          spawnDamageNum(c.x, 35, surgeDmg, false, false);
          c.state = 'knockback';
          c.knockbackVelocityX = 160;
          c.knockbackTimer = 0.35;
          c.x = Math.max(playerCastleX, c.x - 50);
        });
      }

      // Wave Attack Mechanics
      if (enemy.waveLevel && enemy.waveLevel > 0) {
        audio.playWaveAttack();
        const waveLvl = enemy.waveLevel;
        const waveReach = waveLvl * 220;
        const startWaveX = enemy.x - 20;

        for (let i = 1; i <= waveLvl; i++) {
          setTimeout(() => {
            const pulseX = Math.max(playerCastleX, startWaveX - i * 160);
            spawnFx(pulseX, 20, 'aoe_burst');
          }, (i - 1) * 110);
        }

        const waveHitCats = catsRef.current.filter(
          (c) => c.hp > 0 && c.x <= startWaveX && c.x >= startWaveX - waveReach
        );

        waveHitCats.forEach((c) => {
          applyEnemyAbilitiesToCat(c);
          const waveDmg = Math.round(dmg * 0.9);
          const nextHp = Math.max(0, c.hp - waveDmg);
          c.hp = nextHp;
          spawnDamageNum(c.x, 30, waveDmg, false, false);

          const maxKbs = Math.max(1, c.maxKnockbacks || 1);
          const kbThreshold = c.maxHp / maxKbs;
          const currentKBs = Math.floor((c.maxHp - nextHp) / kbThreshold);
          if (currentKBs > (c.knockbackCount || 0) && c.state !== 'knockback') {
            audio.playKnockback();
            c.knockbackCount = currentKBs;
            c.state = 'knockback';
            c.knockbackVelocityX = 190;
            c.knockbackTimer = 0.45;
            c.x = Math.max(playerCastleX, c.x - 70);
            c.isWindupActive = false;
          }
        });
      }
    } else {
      // Hit Player Castle on Left
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

    let treasureDrop: { name: string; quality: TreasureQuality; description: string } | null = null;
    let treasureQuality: TreasureQuality = 'none';

    if (victory) {
      const trDef = TREASURES[stage.id];
      if (trDef) {
        if (activeItems.treasureRadar) {
          treasureQuality = 'gold';
        } else {
          const isFestival = !!stage.treasureFestival;
          const roll = Math.random();
          if (isFestival) {
            if (roll < 0.65) treasureQuality = 'gold';
            else if (roll < 0.90) treasureQuality = 'silver';
            else treasureQuality = 'bronze';
          } else {
            if (roll < 0.35) treasureQuality = 'gold';
            else if (roll < 0.65) treasureQuality = 'silver';
            else if (roll < 0.88) treasureQuality = 'bronze';
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
    if (stage.isExtreme && victory) {
      baseXp = Math.round(baseXp * 1.5);
    }
    const xpEarned = baseXp;
    const catFoodEarned = victory ? (stage.isExtreme ? stage.baseRewardCatFood + 10 : stage.baseRewardCatFood) : 0;

    setBattleResult({
      ended: true,
      victory,
      xpEarned,
      catFoodEarned,
      treasureDropped: treasureDrop,
    });

    const scoreAttackScore = isScoreAttack && victory
      ? Math.max(100, Math.min(999999, 700000 - Math.floor(battleTimeRef.current * 750) + defeatedEnemiesCountRef.current * 4500 + 300000))
      : undefined;

    onBattleEnd({
      victory,
      xpEarned,
      catFoodEarned,
      treasureQuality,
      scoreAttackScore,
      moneySpent: matchMoneySpentRef.current,
      catsSpawned: matchCatsSpawnedRef.current,
      enemiesDefeated: defeatedEnemiesCountRef.current,
    });
  };

  const toggleSpeed = () => {
    setGameSpeed((prev) => (prev === 1 ? 2 : prev === 2 ? 3 : 1));
  };

  const toggleSound = () => {
    audio.toggleSound();
    audio.toggleBgm();
  };

  const handleTestSound = useCallback(() => {
    audio.unlockAudio();
    audio.playTestTone();
    audio.startBattleBgm(stage.chapterId || stage.chapter, false, stage.isFinalBossStage, stage.id, stage.bgType);
  }, [stage.chapter, stage.chapterId, stage.isFinalBossStage, stage.id, stage.bgType]);

  // Controller / Switch bindings
  const handleDeploySlotByIndex = useCallback(
    (slotIdx: number) => {
      const slot = deckSlotDefs[slotIdx];
      if (slot) {
        handleSpawnCat(slot.def.id);
      }
    },
    [deckSlotDefs]
  );

  const handlePanCamera = useCallback((deltaX: number) => {
    setCameraX((prev) => Math.max(0, Math.min(1000, prev + deltaX)));
  }, []);

  const gamepadState = useGamepad(
    {
      selectedSlotIndex,
      setSelectedSlotIndex,
      onDeploySlot: handleDeploySlotByIndex,
      onUpgradeWorkerCat: handleUpgradeWorker,
      onFireCannon: handleFireCannon,
      onToggleAuto: () => setIsAutoBattle((a) => !a),
      onToggleSpeed: toggleSpeed,
      onTogglePause: () => setIsPaused((p) => !p),
      onPanCamera: handlePanCamera,
    },
    !battleResult.ended
  );

  return (
    <div className="fixed inset-0 w-screen h-screen bg-stone-950 flex flex-col select-none overflow-hidden font-['M_PLUS_Rounded_1c'] z-50">
      <BattleHud
        stageName={stage.name}
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
        onTestSound={handleTestSound}
        gamepadConnected={gamepadState.isConnected}
        controllerName={gamepadState.controllerName}
        selectedSlotIndex={selectedSlotIndex}
        score={currentScore}
        isScoreAttack={isScoreAttack}
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
            audio.startBattleBgm(stage.chapter, false, stage.isFinalBossStage);
          }}
          hasNextStage={hasNextStage}
        />
      )}
    </div>
  );
};
