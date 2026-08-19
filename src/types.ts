export type AttackType = 'single' | 'area';

export type Rarity = 'normal' | 'rare' | 'super_rare' | 'uber_rare';

export type EnemyTrait = 'white' | 'red' | 'floating' | 'black' | 'alien' | 'angel' | 'metal' | 'boss';

export interface UnitForm {
  name: string;
  jpName: string;
  description: string;
  hp: number;
  attackPower: number;
  attackRange: number; // in px
  attackSpeed: number; // attacks per second
  attackWindup: number; // seconds before damage registers
  speed: number; // movement speed px/s
  knockbacks: number; // total KB count
  attackType: AttackType;
  cost: number;
  cooldown: number; // in seconds
  scale?: number;
  colorTheme?: string;
  spriteType: string;
  waveLevel?: number; // 波動レベル
  traitBonus?: {
    trait: EnemyTrait;
    multiplier: number;
    effect?: 'strong' | 'massive_damage' | 'resist' | 'knockback' | 'freeze';
  };
}

export interface CatDefinition {
  id: string;
  rarity: Rarity;
  forms: [UnitForm, UnitForm]; // Form 1 and Form 2 (Evolved)
  unlockedAtStart?: boolean;
  unlockCostXp?: number;
  unlockCostCatFood?: number;
  unlockMethod?: 'start' | 'xp' | 'gacha' | 'stage_reward';
  requiredStageId?: string;
  unlockHint?: string;
}

export interface EnemyDefinition {
  id: string;
  name: string;
  description: string;
  hp: number;
  attackPower: number;
  attackRange: number;
  attackSpeed: number;
  attackWindup: number;
  speed: number;
  knockbacks: number;
  attackType: AttackType;
  rewardMoney: number;
  rewardXp: number;
  traits: EnemyTrait[];
  spriteType: string;
  scale?: number;
  isBoss?: boolean;
  waveLevel?: number; // 波動レベル (e.g. 1 to 4)
}

export interface ActiveEntity {
  instanceId: string;
  defId: string;
  name: string;
  isCat: boolean;
  x: number; // 0 to battleFieldWidth (e.g. 1800)
  y: number; // baseline
  hp: number;
  maxHp: number;
  attackPower: number;
  attackRange: number;
  attackInterval: number; // seconds between attacks
  attackTimer: number; // cooldown until next attack
  attackWindupTimer: number; // timer during swing/charge
  isWindupActive: boolean;
  speed: number;
  knockbackCount: number;
  maxKnockbacks: number;
  attackType: AttackType;
  cost?: number;
  traits?: EnemyTrait[];
  spriteType: string;
  scale: number;
  formIndex: number; // 0 or 1 for cats
  isBoss?: boolean;
  waveLevel?: number; // 波動レベル
  
  // Animation states
  state: 'walk' | 'attack' | 'knockback' | 'die';
  animTimer: number;
  knockbackVelocityX: number;
  knockbackTimer: number;
  hitFlashTimer: number;
}

export interface DamageNumber {
  id: string;
  x: number;
  y: number;
  value: number;
  isCritical?: boolean;
  isCatDamage: boolean;
  lifetime: number;
  maxLifetime: number;
}

export interface VisualEffect {
  id: string;
  x: number;
  y: number;
  type: 'hit' | 'aoe_burst' | 'cannon_beam' | 'cannon_charge' | 'smoke' | 'sparkle' | 'crit_flash' | 'boss_roar' | 'wave_blast' | 'boss_shockwave' | 'cat_soul' | 'dust_puff' | 'freeze_fx' | 'metal_spark';
  lifetime: number;
  maxLifetime: number;
  scale?: number;
  color?: string;
  text?: string;
}

export type TreasureQuality = 'none' | 'bronze' | 'silver' | 'gold';

export interface Treasure {
  id: string;
  stageId: string;
  name: string;
  effectDescription: string;
  quality: TreasureQuality;
  buffType: 'money_rate' | 'money_cap' | 'cat_hp' | 'cat_atk' | 'cannon_power' | 'cannon_charge' | 'xp_bonus' | 'speed_bonus';
  buffValue: number; // percentage boost (e.g. 0.1 for 10%)
}

export interface StageWave {
  timeSeconds: number; // seconds after match starts
  enemyId: string;
  count: number;
  interval: number;
  castleHpThreshold?: number; // spawns when enemy castle HP drops below this %
  boss?: boolean;
}

export type ChapterId =
  | 'japan_1'
  | 'japan_2'
  | 'japan_3'
  | 'future_1'
  | 'future_2'
  | 'future_3'
  | 'cosmos_1'
  | 'cosmos_2'
  | 'cosmos_3'
  | 'legend_1'
  | 'legend_2'
  | 'legend_3'
  | 'crazed_event'
  | 'japan'
  | 'future'
  | 'cosmos'
  | 'legend'
  | 'crazed';

export interface StageDefinition {
  id: string;
  chapterId: ChapterId;
  stageNumber: number;
  name: string;
  jpName: string;
  energyCost: number;
  castleHp: number;
  enemyCastleSprite: string;
  bgType:
    | 'japan_grass'
    | 'japan_city'
    | 'japan_volcano'
    | 'future_neon'
    | 'future_space'
    | 'cosmos_galaxy'
    | 'cosmos_dimension'
    | 'legend_ancient'
    | 'legend_cave'
    | 'crazed_hell';
  battlefieldWidth: number;
  baseRewardXp: number;
  baseRewardCatFood: number;
  waves: StageWave[];
  bossAlert?: string;
  mapX?: number; // 0-100 percentage on chapter map
  mapY?: number; // 0-100 percentage on chapter map
  treasureFestival?: boolean; // お宝出現率 超UP!!
  isBossStage?: boolean;
  isFinalBossStage?: boolean;
  rewardCatUnlockId?: string; // 狂乱ステージクリア時のキャラ報酬アンロックID
}

export interface BattleActiveItems {
  speedUp?: boolean;
  treasureRadar?: boolean;
  richCat?: boolean;
  catCpu?: boolean;
  catJobs?: boolean;
  sniper?: boolean;
}

export interface ChapterDefinition {
  id: ChapterId;
  category: 'japan' | 'future' | 'cosmos' | 'legend' | 'crazed';
  chapterNumber: number;
  name: string;
  jpName: string;
  subtitle: string;
  bannerBg: string;
  bossName: string;
  bossSprite: string;
  unlockRequirement?: string;
  stages: StageDefinition[];
}

export interface PlayerUpgrades {
  workerCatRate: number; // 働きネコ仕事効率 (Lv 1-10)
  workerCatWallet: number; // 働きネコお財布 (Lv 1-10)
  cannonPower: number; // にゃんこ砲攻撃力 (Lv 1-10)
  cannonCharge: number; // にゃんこ砲チャージ (Lv 1-10)
  cannonRange: number; // にゃんこ砲射程 (Lv 1-10)
  castleHealth: number; // お城体力 (Lv 1-10)
  researchSpeed: number; // 研究力 (Lv 1-10)
  accounting: number; // 会計力 (Lv 1-10)
  leadershipCap: number; // 統率力上限 (Lv 1-10)
}

export interface PlayerCatProgress {
  catId: string;
  level: number; // 1 to 20
  unlocked: boolean;
  activeForm: number; // 0 or 1
}

export interface DevModeSettings {
  unlocked: boolean;
  infiniteEnergy: boolean;
  infiniteXp: boolean;
  infiniteCatFood: boolean;
}

export interface PlayerProfile {
  xp: number;
  catFood: number;
  energy: number;
  maxEnergy: number;
  lastEnergyRefillTime: number;
  deck: string[]; // 10 cat IDs
  cats: Record<string, PlayerCatProgress>;
  upgrades: PlayerUpgrades;
  clearedStages: Record<string, { stars: number; highscore: number }>;
  treasures: Record<string, TreasureQuality>;
  items: {
    speedUp: number;
    catCpu: number;
    treasureRadar: number;
    richCat: number;
    catJobs?: number; // おかめはちもく (XP 1.5倍)
    sniper?: number; // スニャイパー (定期狙撃)
  };
  gachaPityCounter: number;
  devMode?: DevModeSettings;
}

