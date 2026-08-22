import { MissionDefinition, AchievementDefinition, PlayerProfile } from '../types';
import { calculateUserRank } from '../utils/storage';
import { CAT_DEFINITIONS } from './units';

export const MISSIONS: MissionDefinition[] = [
  // --- DAILY MISSIONS ---
  {
    id: 'daily_clear_3_stages',
    category: 'daily',
    title: 'ステージを3回クリアしよう',
    description: '日本編・未来編・宇宙編・レジェンドなど、どのステージでも3回勝利するにゃ！',
    targetType: 'clear_any_stage',
    targetCount: 3,
    reward: {
      catFood: 10,
      xp: 15000,
    },
  },
  {
    id: 'daily_upgrade_cat',
    category: 'daily',
    title: 'にゃんこをパワーアップしよう',
    description: 'いずれかのにゃんこを1回以上レベルアップするにゃ！',
    targetType: 'upgrade_cat_level',
    targetCount: 1,
    reward: {
      catFood: 5,
      xp: 20000,
    },
  },
  {
    id: 'daily_gamatoto_expedition',
    category: 'daily',
    title: 'ガマトト探検隊を出発させよう',
    description: 'ガマトト探検隊を1回探検に出発させるにゃ！',
    targetType: 'send_gamatoto',
    targetCount: 1,
    reward: {
      catFood: 5,
      items: { speedUp: 2, catCpu: 2 },
    },
  },

  // --- MAIN MISSIONS ---
  {
    id: 'main_clear_japan_1',
    category: 'main',
    title: '日本編 第1章を完全制覇',
    description: '日本編第1章の最終ステージ（西表島）をクリアするにゃ！',
    targetType: 'clear_any_stage',
    targetCount: 12,
    reward: {
      catFood: 50,
      xp: 50000,
      items: { treasureRadar: 2 },
    },
  },
  {
    id: 'main_clear_legend_stage',
    category: 'main',
    title: 'レジェンドストーリーに挑戦',
    description: '古代の秘宝が眠るレジェンドストーリーのステージを5回クリアするにゃ！',
    targetType: 'clear_legend_stage',
    targetCount: 5,
    reward: {
      catFood: 40,
      xp: 100000,
      items: { richCat: 2, catJobs: 2 },
    },
  },
  {
    id: 'main_reach_user_rank_50',
    category: 'main',
    title: 'ユーザーランク50達成',
    description: 'キャラや基本施設を強化してユーザーランク50に到達するにゃ！',
    targetType: 'reach_user_rank',
    targetCount: 50,
    reward: {
      catFood: 30,
      xp: 80000,
      items: { sniper: 2 },
    },
  },
  {
    id: 'main_collect_10_treasures',
    category: 'main',
    title: 'お宝を10個集めよう',
    description: 'ステージを周回してお宝を合計10個獲得するにゃ！',
    targetType: 'collect_treasures',
    targetCount: 10,
    reward: {
      catFood: 30,
      xp: 60000,
      items: { treasureRadar: 1 },
    },
  },

  // --- EVENT MISSIONS ---
  {
    id: 'event_crazed_conquer',
    category: 'event',
    title: '狂乱降臨ステージを制覇しよう',
    description: '狂乱のネコ降臨または狂乱のタンク降臨などの極ムズステージに勝利するにゃ！',
    targetType: 'clear_crazed_stage',
    targetCount: 1,
    reward: {
      catFood: 50,
      xp: 200000,
      items: { treasureRadar: 2, richCat: 2 },
    },
  },
  {
    id: 'event_draw_gacha_5',
    category: 'event',
    title: 'ガチャを5回引いて戦力を強化',
    description: 'にゃんこガチャまたはレアガチャを合計5回まわすにゃ！',
    targetType: 'draw_gacha',
    targetCount: 5,
    reward: {
      catFood: 30,
      xp: 100000,
      items: { catCpu: 5 },
    },
  },
];

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'ach_stages_10',
    title: '初陣の勇者',
    subtitle: '通算10ステージをクリア',
    category: 'progress',
    icon: '🚩',
    targetType: 'total_cleared_stages',
    targetCount: 10,
    reward: { catFood: 20, xp: 30000, badgeTitle: 'かけだし軍団' },
  },
  {
    id: 'ach_stages_50',
    title: '百戦錬磨のにゃんこ',
    subtitle: '通算50ステージをクリア',
    category: 'progress',
    icon: '⚔️',
    targetType: 'total_cleared_stages',
    targetCount: 50,
    reward: { catFood: 50, xp: 100000, badgeTitle: '歴戦の指揮官' },
  },
  {
    id: 'ach_legend_10',
    title: '伝説の探検家',
    subtitle: 'レジェンドストーリーを10ステージクリア',
    category: 'battle',
    icon: '📜',
    targetType: 'legend_cleared_stages',
    targetCount: 10,
    reward: { catFood: 50, xp: 150000, badgeTitle: 'レジェンドシーカー' },
  },
  {
    id: 'ach_legend_30',
    title: '太古を制する覇者',
    subtitle: 'レジェンドストーリーを30ステージクリア',
    category: 'battle',
    icon: '👑',
    targetType: 'legend_cleared_stages',
    targetCount: 30,
    reward: { catFood: 100, xp: 300000, badgeTitle: '古代神の契約者' },
  },
  {
    id: 'ach_cats_15',
    title: 'にゃんこコレクター',
    subtitle: '15体以上のキャラクターを仲間にする',
    category: 'collection',
    icon: '🐱',
    targetType: 'unlocked_cats_count',
    targetCount: 15,
    reward: { catFood: 40, xp: 80000, badgeTitle: 'ネコ愛好家' },
  },
  {
    id: 'ach_gold_treasures_20',
    title: '黄金のコレクター',
    subtitle: '最高品質の【金のお宝】を20個集める',
    category: 'collection',
    icon: '🏆',
    targetType: 'gold_treasures_count',
    targetCount: 20,
    reward: { catFood: 60, xp: 120000, badgeTitle: 'ゴールドマスター' },
  },
  {
    id: 'ach_user_rank_100',
    title: '軍団長の威厳',
    subtitle: 'ユーザーランク100を突破する',
    category: 'special',
    icon: '⭐',
    targetType: 'user_rank_reached',
    targetCount: 100,
    reward: { catFood: 100, xp: 250000, badgeTitle: '大軍団総帥' },
  },
  {
    id: 'ach_defeat_filibuster',
    title: '終焉を告げし神の討伐者',
    subtitle: '宇宙編3章フィリバスターまたは太古の終焉を撃破',
    category: 'special',
    icon: '🌌',
    targetType: 'defeat_filibuster',
    targetCount: 1,
    reward: { catFood: 150, xp: 500000, badgeTitle: '時空の神殺し' },
  },
];

/**
 * Calculates current progress value for a given mission target type.
 */
export function getMissionProgress(mission: MissionDefinition, profile: PlayerProfile): number {
  switch (mission.targetType) {
    case 'clear_any_stage':
      return Object.keys(profile.clearedStages || {}).length;
    case 'clear_legend_stage':
      return Object.keys(profile.clearedStages || {}).filter((k) => k.startsWith('legend_')).length;
    case 'clear_crazed_stage':
      return Object.keys(profile.clearedStages || {}).filter((k) => k.startsWith('crazed_')).length;
    case 'upgrade_cat_level':
      return profile.stats?.totalCatsUpgraded || Object.values(profile.cats || {}).filter((c) => c.level > 1).length;
    case 'reach_user_rank':
      return calculateUserRank(profile);
    case 'collect_treasures':
      return Object.values(profile.treasures || {}).filter((q) => q !== 'none').length;
    case 'draw_gacha':
      return profile.stats?.totalGachaPulls || 0;
    case 'send_gamatoto':
      return profile.stats?.totalGamatotoSent || 0;
    default:
      return 0;
  }
}

/**
 * Calculates current progress value for an achievement.
 */
export function getAchievementProgress(achievement: AchievementDefinition, profile: PlayerProfile): number {
  switch (achievement.targetType) {
    case 'total_cleared_stages':
      return Object.keys(profile.clearedStages || {}).length;
    case 'legend_cleared_stages':
      return Object.keys(profile.clearedStages || {}).filter((k) => k.startsWith('legend_')).length;
    case 'unlocked_cats_count':
      return Object.values(profile.cats || {}).filter((c) => c.unlocked).length;
    case 'gold_treasures_count':
      return Object.values(profile.treasures || {}).filter((q) => q === 'gold').length;
    case 'user_rank_reached':
      return calculateUserRank(profile);
    case 'defeat_filibuster':
      return profile.hasClearedFilibuster ? 1 : (profile.clearedStages?.['cosmos_3_filibuster'] || profile.clearedStages?.['legend_12_3'] ? 1 : 0);
    case 'gacha_pulls_count':
      return profile.stats?.totalGachaPulls || 0;
    default:
      return 0;
  }
}
