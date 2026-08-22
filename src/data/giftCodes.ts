import { GiftCodeDefinition, PlayerProfile } from '../types';
import { CAT_DEFINITIONS } from './units';

export const GIFT_CODES: GiftCodeDefinition[] = [
  {
    code: 'ENERGY2026',
    title: '【8/22〜8/25限定】統率力1日完全無限コード',
    description: '使用から24時間、統率力が減らなくなるスペシャルプレゼント！レジェンドストーリーや狂乱降臨を挑み放題！',
    validFrom: '2026-08-22',
    validTo: '2026-08-25',
    reward: {
      type: 'infinite_energy_1day',
      infiniteEnergyDurationHours: 24,
      description: '統率力24時間完全無限（出撃時消費ゼロ）',
    },
    isDevOnlyPreview: true,
  },
  {
    code: 'SUMMERCAT2026',
    title: '【2026年8月限定】夏キャット2026 獲得コード',
    description: '2026年サマーフェスティバル限定キャラクター「夏キャット2026」を即時獲得＆アンロック！',
    validFrom: '2026-08-01',
    validTo: '2026-08-31',
    reward: {
      type: 'unlock_cat',
      catId: 'cat_summer_2026',
      description: '限定超激レア「夏キャット2026」アンロック',
    },
    isDevOnlyPreview: true,
  },
  {
    code: 'NYANKO2026',
    title: 'ネコ軍団応援スペシャルコード',
    description: 'ネコカン150缶 + 経験値100,000XP + スピードアップ & ニャンピュータ各5個をプレゼント！',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    reward: {
      type: 'special_pack',
      catFood: 150,
      xp: 100000,
      items: {
        speedUp: 5,
        catCpu: 5,
        treasureRadar: 2,
        richCat: 2,
      },
      description: 'ネコカン150缶 + 100,000XP + アイテムセット',
    },
    isDevOnlyPreview: false,
  },
  {
    code: 'LEGEND2026',
    title: 'レジェンドストーリー開幕記念コード',
    description: 'ネコカン200缶 + 経験値300,000XP + トレジャーレーダー3個プレゼント！',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    reward: {
      type: 'special_pack',
      catFood: 200,
      xp: 300000,
      items: {
        treasureRadar: 3,
        richCat: 3,
        catJobs: 3,
        sniper: 3,
      },
      description: 'ネコカン200缶 + 300,000XP + トレジャーレーダーx3 他',
    },
    isDevOnlyPreview: false,
  },
];

/**
 * Validates a gift code and updates the player profile if valid.
 */
export function redeemGiftCode(
  inputCode: string,
  profile: PlayerProfile,
  testDateStr?: string
): { success: boolean; message: string; updatedProfile?: PlayerProfile; reward?: GiftCodeDefinition['reward'] } {
  const codeFormatted = inputCode.trim().toUpperCase();
  if (!codeFormatted) {
    return { success: false, message: 'プレゼントコードを入力してください' };
  }

  const gift = GIFT_CODES.find((g) => g.code === codeFormatted);
  if (!gift) {
    return { success: false, message: '無効なプレゼントコードです。入力内容をご確認ください' };
  }

  // Check if already redeemed
  if (profile.redeemedCodes && profile.redeemedCodes[gift.code]) {
    const date = new Date(profile.redeemedCodes[gift.code]).toLocaleString('ja-JP');
    return { success: false, message: `このプレゼントコードは既に使用済みです（使用日時: ${date}）` };
  }

  // Date validity check
  const now = testDateStr ? new Date(testDateStr) : new Date();
  const validStart = new Date(gift.validFrom + 'T00:00:00');
  const validEnd = new Date(gift.validTo + 'T23:59:59');

  if (now < validStart) {
    return {
      success: false,
      message: `このコードの有効期間前です（有効開始日: ${gift.validFrom}）`,
    };
  }

  if (now > validEnd) {
    return {
      success: false,
      message: `このコードの有効期限が切れています（有効期限: ${gift.validTo}まで）`,
    };
  }

  // Apply Rewards
  const nextProfile = { ...profile };
  nextProfile.redeemedCodes = {
    ...(nextProfile.redeemedCodes || {}),
    [gift.code]: Date.now(),
  };

  const { reward } = gift;

  if (reward.type === 'infinite_energy_1day' || reward.infiniteEnergyDurationHours) {
    const hours = reward.infiniteEnergyDurationHours || 24;
    const durationMs = hours * 60 * 60 * 1000;
    const currentExpiry = nextProfile.infiniteEnergyUntil || Date.now();
    nextProfile.infiniteEnergyUntil = Math.max(Date.now(), currentExpiry) + durationMs;
    nextProfile.energy = 9999;
  }

  if (reward.catId) {
    const nextCats = { ...nextProfile.cats };
    nextCats[reward.catId] = {
      catId: reward.catId,
      level: Math.max(1, nextCats[reward.catId]?.level || 1),
      unlocked: true,
      activeForm: nextCats[reward.catId]?.activeForm || 0,
    };
    nextProfile.cats = nextCats;
  }

  if (reward.catFood) {
    nextProfile.catFood += reward.catFood;
  }

  if (reward.xp) {
    nextProfile.xp += reward.xp;
  }

  if (reward.items) {
    const nextItems = { ...nextProfile.items };
    if (reward.items.speedUp) nextItems.speedUp = (nextItems.speedUp || 0) + reward.items.speedUp;
    if (reward.items.catCpu) nextItems.catCpu = (nextItems.catCpu || 0) + reward.items.catCpu;
    if (reward.items.treasureRadar) nextItems.treasureRadar = (nextItems.treasureRadar || 0) + reward.items.treasureRadar;
    if (reward.items.richCat) nextItems.richCat = (nextItems.richCat || 0) + reward.items.richCat;
    if (reward.items.catJobs) nextItems.catJobs = (nextItems.catJobs || 0) + reward.items.catJobs;
    if (reward.items.sniper) nextItems.sniper = (nextItems.sniper || 0) + reward.items.sniper;
    nextProfile.items = nextItems;
  }

  return {
    success: true,
    message: `「${gift.title}」を受け取りました！\n特典: ${reward.description}`,
    updatedProfile: nextProfile,
    reward,
  };
}
