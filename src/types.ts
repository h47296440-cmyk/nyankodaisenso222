export type AttackType = 'single' | 'area';

export type Rarity = 'normal' | 'rare' | 'super_rare' | 'uber_rare';

export type EnemyTrait =
  | 'white'
  | 'red'
  | 'floating'
  | 'black'
  | 'alien'
  | 'star_alien'
  | 'angel'
  | 'metal'
  | 'zombie'
  | 'ancient'
  | 'aku'
  | 'boss';

export interface AbilityDefinition {
  freeze?: { chance: number; duration: number; traits?: EnemyTrait[] };
  slow?: { chance: number; duration: number; traits?: EnemyTrait[] };
  weaken?: { chance: number; duration: number; mult: number; traits?: EnemyTrait[] };
  knockback?: { chance: number; traits?: EnemyTrait[] };
  massiveDamage?: { mult: number; traits?: EnemyTrait[] };
  strong?: { mult?: number; traits?: EnemyTrait[] };
  resist?: { traits?: EnemyTrait[] };
  zombieKiller?: boolean;
  barrier?: { hp: number }; // スターエイリアンのバリア耐久値 (単発ダメージがこれ以上で破壊)
  warp?: { chance: number; distance: number; duration?: number }; // ワープ能力 (味方を後方にテレポート)
  barrierBreaker?: { chance: number }; // バリアブレイカー能力 (バリアを即座に粉砕)
  shield?: { hp: number }; // 悪魔シールド (耐久値分のダメージを完全に無効化＆破壊時ノックバック)
  shieldPiercer?: { chance: number }; // シールドブレイカー能力 (悪魔シールドを即座に破壊)
  savageBlow?: { chance: number; mult: number }; // 渾身の一撃 (確率で3倍などの超大ダメージ+赤エフェクト)
  surge?: { level: number; chance?: number; minDistance?: number; maxDistance?: number }; // 烈波 (足元に立ち上る連続ダメージ柱)
  deathSurge?: { level: number; chance?: number; minDistance?: number; maxDistance?: number }; // 遺志の烈波 (撃破時に烈波発生)
  chargeAttack?: { chargeTime: number; isOneHitKill?: boolean }; // フィリバスター等の大溜め即死攻撃
  burrow?: { count: number; distance: number };
  revive?: { count: number; hpPercent: number; delaySeconds: number };
  criticalChance?: number;
  wave?: { level: number; chance?: number };
}

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
    effect?: 'strong' | 'massive_damage' | 'resist' | 'knockback' | 'freeze' | 'slow' | 'weaken' | 'zombie_killer';
  };
  abilities?: AbilityDefinition;
}

export interface CatDefinition {
  id: string;
  rarity: Rarity;
  forms: UnitForm[]; // Form 1, Form 2 (Evolved), and optional Form 3 (True Form)
  unlockedAtStart?: boolean;
  unlockCostXp?: number;
  unlockCostCatFood?: number;
  unlockMethod?: 'start' | 'xp' | 'gacha' | 'stage_reward' | 'stage' | 'code' | 'story';
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
  abilities?: AbilityDefinition;
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
  abilities?: AbilityDefinition;
  
  // Status condition effects
  freezeTimer?: number;
  slowTimer?: number;
  weakenTimer?: number;
  weakenMultiplier?: number;

  // Zombie mechanics
  burrowRemaining?: number;
  isBurrowing?: boolean;
  burrowDistanceLeft?: number;
  reviveCountRemaining?: number;
  isReviving?: boolean;
  reviveTimer?: number;
  reviveHpPercent?: number;
  isPermadead?: boolean;

  // Star Alien & Filibuster mechanics
  barrierHp?: number; // 残りバリア耐久値 (0以上ならダメージ無効化、単発威力>=barrierHpで破壊)
  maxBarrierHp?: number;
  isCharging?: boolean; // フィリバスター等のチャージ中フラグ
  chargeTimer?: number; // チャージ残り時間
  maxChargeTime?: number;
  isWarping?: boolean; // ワープ移動中フラグ
  warpDistanceLeft?: number;

  // 悪魔シールド (Aku Shield) mechanics
  shieldHp?: number; // 残り悪魔シールド耐久値 (ダメージをシールドが肩代わり。0になると破壊)
  maxShieldHp?: number;

  // Animation states
  state: 'walk' | 'attack' | 'knockback' | 'die' | 'burrow' | 'revive' | 'charge';
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
  isBarrierBlock?: boolean; // バリアで防がれた
  lifetime: number;
  maxLifetime: number;
}

export interface VisualEffect {
  id: string;
  x: number;
  y: number;
  type:
    | 'hit'
    | 'aoe_burst'
    | 'cannon_beam'
    | 'cannon_charge'
    | 'smoke'
    | 'sparkle'
    | 'crit_flash'
    | 'boss_roar'
    | 'wave_blast'
    | 'boss_shockwave'
    | 'cat_soul'
    | 'dust_puff'
    | 'freeze_fx'
    | 'slow_fx'
    | 'weaken_fx'
    | 'zombie_burrow'
    | 'zombie_revive'
    | 'zombie_killer_fx'
    | 'barrier_hit'
    | 'barrier_break'
    | 'shield_hit'
    | 'shield_break'
    | 'savage_blow'
    | 'surge_burst'
    | 'warp_portal'
    | 'warp_fx'
    | 'filibuster_charge'
    | 'filibuster_oblivion'
    | 'metal_spark';
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
  multiplier?: number; // 敵の強化倍率 (1.0 = 100%, 3.0 = 300%)
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
  | 'legend_4'
  | 'legend_5'
  | 'legend_6'
  | 'legend_7'
  | 'legend_8'
  | 'legend_9'
  | 'legend_10'
  | 'legend_11'
  | 'legend_12'
  | 'legend_13'
  | 'legend_14'
  | 'legend_15'
  | 'legend_16'
  | 'legend_17'
  | 'legend_18'
  | 'legend_19'
  | 'legend_20'
  | 'legend_21'
  | 'real_legend_1'
  | 'real_legend_2'
  | 'real_legend_3'
  | 'real_legend_4'
  | 'real_legend_5'
  | 'real_legend_6'
  | 'real_legend_7'
  | 'real_legend_8'
  | 'real_legend_9'
  | 'real_legend_10'
  | 'real_legend_11'
  | 'real_legend_12'
  | 'real_legend_13'
  | 'matatabi_stages'
  | 'catseye_stages'
  | 'manic_crazed_stages'
  | 'aku_realm'
  | 'aku_realm_1'
  | 'aku_realm_2'
  | 'aku_realm_3'
  | 'crazed_event'
  | 'special_event'
  | 'advent_clionel'
  | 'advent_hannya'
  | 'advent_hedgehog'
  | 'advent_red_cyclone'
  | 'advent_black_cyclone'
  | 'advent_alien_cyclone'
  | 'advent_zombie_cyclone'
  | 'advent_ancient_cyclone'
  | 'advent_aku_cyclone'
  | 'advent_all_cyclone'
  | 'challenge_score_attack'
  | 'advent'
  | 'zombie_future'
  | 'zombie_cosmos'
  | 'japan'
  | 'future'
  | 'cosmos'
  | 'legend'
  | 'real_legend'
  | 'crazed'
  | 'special';

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
    | 'japan_zombie'
    | 'japan_standard'
    | 'future_neon'
    | 'future_space'
    | 'future_zombie'
    | 'cosmos_galaxy'
    | 'cosmos_dimension'
    | 'cosmos_zombie'
    | 'legend_ancient'
    | 'legend_cave'
    | 'legend_passion'
    | 'legend_street'
    | 'legend_volcano'
    | 'legend_ice'
    | 'legend_sky'
    | 'legend_ruins'
    | 'legend_desert'
    | 'crazed_hell'
    | 'advent_heaven'
    | 'advent_hell'
    | 'aku_dimension'
    | 'aku_volcano'
    | 'aku_realm'
    | 'aku_inferno'
    | 'aku_temple'
    | 'volcano_magma'
    | 'real_legend_ancient'
    | 'primal_forest'
    | 'squirrel_panic'
    | 'extreme_dimension';
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
  isExtreme?: boolean; // エクストリームモード（1.5倍）フラグ
  extremeBossTrigger?: boolean; // エクストリーム太古の力の裏ボス降臨フラグ
  rewardCatUnlockId?: string; // 狂乱ステージクリア時のキャラ報酬アンロックID
  isZombieStage?: boolean; // ゾンビ襲来モードフラグ
  zombieRewardBonus?: boolean;
  difficultyLabel?: string; // e.g. "初級", "上級", "超激ムズ", "極ムズ"
  timeRemaining?: string; // e.g. "のこり 01時間09分"
  stageLoreTip?: string; // 特殊アドバイス・セリフ
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
  category: 'japan' | 'future' | 'cosmos' | 'legend' | 'crazed' | 'special' | 'advent' | 'real_legend' | 'matatabi' | 'catseye' | 'manic';
  chapterNumber: number;
  name: string;
  jpName: string;
  subtitle: string;
  bannerBg: string;
  bossName: string;
  bossSprite: string;
  unlockRequirement?: string;
  stages: StageDefinition[];
  zombieStages?: StageDefinition[];
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
  level: number; // 1 to 40
  unlocked: boolean;
  activeForm: number; // 0: 1st, 1: 2nd, 2: 3rd (True Form)
  maxLevelUnlocked?: number; // 30 by default, up to 40 via Catseyes!
}

export interface DevModeSettings {
  unlocked: boolean;
  infiniteEnergy: boolean;
  infiniteXp: boolean;
  infiniteCatFood: boolean;
}

export type GiftRewardType = 'infinite_energy_1day' | 'unlock_cat' | 'cat_food' | 'xp' | 'items' | 'special_pack';

export interface GiftCodeReward {
  type: GiftRewardType;
  catId?: string;
  catFood?: number;
  xp?: number;
  items?: {
    speedUp?: number;
    catCpu?: number;
    treasureRadar?: number;
    richCat?: number;
    catJobs?: number;
    sniper?: number;
  };
  infiniteEnergyDurationHours?: number; // e.g. 24 hours
  description: string;
}

export interface GiftCodeDefinition {
  code: string;
  title: string;
  description: string;
  validFrom: string; // YYYY-MM-DD
  validTo: string; // YYYY-MM-DD
  reward: GiftCodeReward;
  isDevOnlyPreview?: boolean;
}

export type MissionCategory = 'daily' | 'main' | 'event';

export interface MissionDefinition {
  id: string;
  category: MissionCategory;
  title: string;
  description: string;
  targetCount: number;
  targetType:
    | 'clear_any_stage'
    | 'clear_legend_stage'
    | 'clear_crazed_stage'
    | 'upgrade_cat_level'
    | 'upgrade_base_skill'
    | 'draw_gacha'
    | 'collect_treasures'
    | 'reach_user_rank'
    | 'send_gamatoto'
    | 'defeat_bosses';
  reward: {
    catFood?: number;
    xp?: number;
    items?: {
      speedUp?: number;
      catCpu?: number;
      treasureRadar?: number;
      richCat?: number;
      catJobs?: number;
      sniper?: number;
    };
  };
}

export interface AchievementDefinition {
  id: string;
  title: string;
  subtitle: string;
  category: 'progress' | 'battle' | 'collection' | 'special';
  icon: string;
  targetCount: number;
  targetType:
    | 'total_cleared_stages'
    | 'legend_cleared_stages'
    | 'unlocked_cats_count'
    | 'gold_treasures_count'
    | 'user_rank_reached'
    | 'max_level_cats_count'
    | 'defeat_filibuster'
    | 'gacha_pulls_count';
  reward: {
    catFood: number;
    xp?: number;
    badgeTitle?: string;
  };
}

export interface PlayerStats {
  totalBattles: number;
  totalVictories: number;
  totalGachaPulls: number;
  totalCatsUpgraded: number;
  totalBaseUpgrades: number;
  totalGamatotoSent: number;
  playTimeSeconds?: number; // 累計プレイ時間（秒）
  totalMoneySpent?: number; // 戦闘中の累計使用金額（円）
  totalCatsSpawned?: number; // 累計にゃんこ生産回数
  totalEnemiesDefeated?: number; // 累計敵撃破数
  totalCatFoodUsed?: number; // 累計消費ネコカン数
}

export interface PvpDeckUnitSummary {
  catId: string;
  name: string;
  jpName?: string;
  level: number;
  formIndex: number;
  cost: number;
  spriteType: string;
  hp: number;
  attackPower: number;
  attackRange: number;
  attackSpeed: number;
  speed: number;
  attackType?: 'single' | 'area';
  rarity?: string;
}

export interface PvpFriendRecord {
  peerId: string;
  name: string;
  userRank: number;
  lastPlayed: number;
  wins: number;
  losses: number;
  scoreAttackHighScore?: number;
  deck: PvpDeckUnitSummary[];
}

export interface PlayerProfile {
  playerName?: string; // プレイヤー名（司令官ネーム）
  xp: number;
  catFood: number;
  energy: number;
  maxEnergy: number;
  lastEnergyRefillTime: number;
  deck: string[]; // 10 cat IDs
  cats: Record<string, PlayerCatProgress>;
  upgrades: PlayerUpgrades;
  clearedStages: Record<string, { stars: number; highscore: number }>;
  clearedExtremeStages?: Record<string, boolean>; // エクストリームモードクリア記録
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
  hasClearedFilibuster?: boolean; // 宇宙編3章フィリバスター撃破フラグ (Lv.25解放＆レジェンド9章以降解放)
  unlockedValkyrieTrueForm?: boolean; // 未来編ゾンビ最終決戦クリアでネコヴァルキリー第3形態解放
  unlockedClionelDrop?: boolean; // 断罪天使クオリネル降臨クリア特典
  unlockedHannyaDrop?: boolean; // 般若我王降臨クリア特典
  unlockedCycloneDrop?: boolean; // レッドサイクロン降臨クリア特典 (ネコラガー / ネコタイフーン)
  scoreAttackHighScore?: number; // スコアアタック最高スコア
  pvpWins?: number;
  pvpLosses?: number;
  pvpFriends?: Record<string, PvpFriendRecord>; // 接続した相手の編成・スコアアタック記録
  devMode?: DevModeSettings;
  redeemedCodes?: Record<string, number>; // code -> redeemedTimestamp
  infiniteEnergyUntil?: number; // timestamp in ms until infinite energy expires
  claimedMissions?: Record<string, number>; // missionId -> claimedTimestamp
  claimedAchievements?: Record<string, number>; // achievementId -> claimedTimestamp
  stats?: PlayerStats;
  catseyes?: Record<string, number>; // ex, rare, super_rare, uber_rare, legend_rare
  catfruits?: Record<string, number>; // green, purple, red, blue, yellow, rainbow, ancient, aku, seeds
  unlockedTrueForms?: Record<string, boolean>; // catId -> boolean (マタタビ進化・大狂乱進化)
  inputMode?: 'touch' | 'gamepad';
}


