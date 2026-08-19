import { PlayerProfile, PlayerUpgrades, TreasureQuality } from '../types';
import { CAT_DEFINITIONS } from '../data/units';

const STORAGE_KEY = 'battle_cats_web_save_v1';

const DEFAULT_UPGRADES: PlayerUpgrades = {
  workerCatRate: 1,
  workerCatWallet: 1,
  cannonPower: 1,
  cannonCharge: 1,
  cannonRange: 1,
  castleHealth: 1,
  researchSpeed: 1,
  accounting: 1,
  leadershipCap: 1,
};

export function getDefaultPlayerProfile(): PlayerProfile {
  const cats: PlayerProfile['cats'] = {};

  CAT_DEFINITIONS.forEach((cat) => {
    cats[cat.id] = {
      catId: cat.id,
      level: 1,
      unlocked: !!cat.unlockedAtStart,
      activeForm: 0,
    };
  });

  return {
    xp: 2500, // starting XP bonus for player to try upgrades
    catFood: 150, // 1 free rare gacha roll at start!
    energy: 100,
    maxEnergy: 100,
    lastEnergyRefillTime: Date.now(),
    deck: [
      'cat_basic',
      'cat_tank',
      'cat_axe',
      'cat_gross',
      'cat_cow',
      'cat_bird',
      'cat_fish',
      'cat_lizard',
      'cat_titan',
      'cat_salon',
    ],
    cats,
    upgrades: { ...DEFAULT_UPGRADES },
    clearedStages: {},
    treasures: {},
    items: {
      speedUp: 3,
      catCpu: 3,
      treasureRadar: 2,
      richCat: 2,
      catJobs: 3,
      sniper: 2,
    },
    gachaPityCounter: 0,
    devMode: {
      unlocked: false,
      infiniteEnergy: false,
      infiniteXp: false,
      infiniteCatFood: false,
    },
  };
}

export function loadPlayerProfile(): PlayerProfile {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed: PlayerProfile = JSON.parse(data);
      // Merge with default to handle new cats/upgrades
      const defaultProf = getDefaultPlayerProfile();
      
      const mergedCats = { ...defaultProf.cats, ...(parsed.cats || {}) };
      // Ensure all definitions exist in cats
      CAT_DEFINITIONS.forEach((cat) => {
        if (!mergedCats[cat.id]) {
          mergedCats[cat.id] = {
            catId: cat.id,
            level: 1,
            unlocked: !!cat.unlockedAtStart,
            activeForm: 0,
          };
        }
      });

      // Energy recovery calculation (1 energy per 30 seconds)
      const now = Date.now();
      const elapsedSec = (now - (parsed.lastEnergyRefillTime || now)) / 1000;
      const energyGain = Math.floor(elapsedSec / 30);
      const maxEnergy = 100 + ((parsed.upgrades?.leadershipCap || 1) - 1) * 20;
      const currentEnergy = Math.min(maxEnergy, (parsed.energy || 100) + energyGain);

      return {
        ...defaultProf,
        ...parsed,
        cats: mergedCats,
        upgrades: { ...defaultProf.upgrades, ...(parsed.upgrades || {}) },
        energy: currentEnergy,
        maxEnergy,
        lastEnergyRefillTime: now,
      };
    }
  } catch (e) {
    console.error('Failed to load profile from localStorage:', e);
  }
  return getDefaultPlayerProfile();
}

export function savePlayerProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile to localStorage:', e);
  }
}

export const loadProfile = loadPlayerProfile;
export const saveProfile = savePlayerProfile;
export function resetProfile(): PlayerProfile {
  localStorage.removeItem(STORAGE_KEY);
  return getDefaultPlayerProfile();
}

// XP cost formula for leveling cats
export function getCatLevelUpCost(catRarity: string, currentLevel: number): number {
  const baseMultiplier = catRarity === 'uber_rare' ? 3.5 : catRarity === 'super_rare' ? 2.5 : catRarity === 'rare' ? 1.8 : 1.0;
  return Math.floor(100 * Math.pow(currentLevel, 1.45) * baseMultiplier);
}

// Upgrade cost formula for base skills
export function getBaseUpgradeCost(currentLevel: number): number {
  return Math.floor(200 * Math.pow(currentLevel, 1.5));
}

// Calculate User Rank = Sum of all character levels + all base upgrade levels (ユーザーランクはレベルの合計)
export function calculateUserRank(profile: PlayerProfile): number {
  let rank = 0;
  if (profile.cats) {
    Object.values(profile.cats).forEach((cat) => {
      if (cat.unlocked) {
        rank += cat.level || 1;
      }
    });
  }
  if (profile.upgrades) {
    Object.values(profile.upgrades).forEach((lv) => {
      rank += lv || 1;
    });
  }
  return rank;
}

