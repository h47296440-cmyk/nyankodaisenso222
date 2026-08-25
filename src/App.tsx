import React, { useState, useEffect } from 'react';
import { PlayerProfile, StageDefinition, TreasureQuality, BattleActiveItems } from './types';
import { loadProfile, saveProfile, resetProfile } from './utils/storage';
import { CHAPTERS } from './data/stages';
import { TitleScreen } from './components/title/TitleScreen';
import { CatBaseScreen } from './components/base/CatBaseScreen';
import { StageSelectScreen } from './components/map/StageSelectScreen';
import { BattleScreen } from './components/battle/BattleScreen';
import { PowerUpScreen } from './components/upgrade/PowerUpScreen';
import { GachaScreen } from './components/gacha/GachaScreen';
import { TreasuresScreen } from './components/treasures/TreasuresScreen';
import { CatEncyclopediaScreen } from './components/encyclopedia/CatEncyclopediaScreen';
import { UpdateHistoryModal } from './components/updates/UpdateHistoryModal';
import { DeveloperModeModal } from './components/dev/DeveloperModeModal';
import { ChapterStoryModal } from './components/story/ChapterStoryModal';
import { StorySelectModal } from './components/story/StorySelectModal';
import { ItemShopModal } from './components/base/ItemShopModal';
import { UserRankRewardsModal } from './components/base/UserRankRewardsModal';
import { GamatotoModal } from './components/base/GamatotoModal';
import { StorageModal } from './components/base/StorageModal';
import { MenuModal } from './components/base/MenuModal';
import { DeckFormationModal } from './components/upgrade/DeckFormationModal';
import { GiftCodeModal } from './components/gift/GiftCodeModal';
import { MissionsAchievementsModal } from './components/missions/MissionsAchievementsModal';
import { AnnouncementsModal } from './components/announcements/AnnouncementsModal';
import { PvpLobbyModal, PvpConnectionPayload } from './components/pvp/PvpLobbyModal';
import { PvpBattleScreen } from './components/pvp/PvpBattleScreen';
import { audio } from './utils/audio';

type AppView = 'title' | 'base' | 'map' | 'battle' | 'upgrade' | 'gacha' | 'treasures' | 'encyclopedia';

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(loadProfile);
  const [currentView, setCurrentView] = useState<AppView>('title');
  const [activeStage, setActiveStage] = useState<StageDefinition | null>(null);
  const [battleActiveItems, setBattleActiveItems] = useState<BattleActiveItems>({});
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [showUpdateHistory, setShowUpdateHistory] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);
  const [showStorySelectModal, setShowStorySelectModal] = useState(false);
  const [showItemShopModal, setShowItemShopModal] = useState(false);
  const [showUserRankRewardsModal, setShowUserRankRewardsModal] = useState(false);
  const [showGamatotoModal, setShowGamatotoModal] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showDeckFormationModal, setShowDeckFormationModal] = useState(false);
  const [showGiftCodeModal, setShowGiftCodeModal] = useState(false);
  const [showMissionsModal, setShowMissionsModal] = useState(false);
  const [showPvpLobbyModal, setShowPvpLobbyModal] = useState(false);
  const [pvpPayload, setPvpPayload] = useState<PvpConnectionPayload | null>(null);
  const [activeStoryKey, setActiveStoryKey] = useState<string | null>(null);

  // Sync BGM with current view
  useEffect(() => {
    if (currentView === 'title') {
      audio.switchBgm('title');
    } else if (currentView === 'battle') {
      // Handled inside BattleScreen based on stage
    } else {
      audio.switchBgm('map');
    }
  }, [currentView]);

  // Sync profile to localStorage whenever it changes
  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  // Periodic energy regeneration (1 energy every 30 seconds up to maxEnergy)
  useEffect(() => {
    const timer = setInterval(() => {
      setProfile((prev) => {
        if (prev.devMode?.infiniteEnergy) {
          return {
            ...prev,
            energy: 9999,
          };
        }
        const leadershipBonus = (prev.upgrades?.leadershipCap || 1) * 20;
        const maxE = 100 + leadershipBonus;
        if (prev.energy < maxE) {
          return {
            ...prev,
            maxEnergy: maxE,
            energy: Math.min(maxE, prev.energy + 1),
          };
        }
        return prev;
      });
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  // Update profile helper
  const handleUpdateProfile = (updater: (prev: PlayerProfile) => PlayerProfile) => {
    setProfile((prev) => updater(prev));
  };

  // Launch battle with selected stage & items
  const handleSelectStage = (stage: StageDefinition, activeItems?: BattleActiveItems) => {
    const isInfiniteEnergy = !!profile.devMode?.infiniteEnergy;
    if (!isInfiniteEnergy && profile.energy < stage.energyCost) return;

    const itemsToUse = activeItems || {};

    // Deduct items if used
    const updatedItems = { ...profile.items };
    if (itemsToUse.speedUp) updatedItems.speedUp = Math.max(0, (updatedItems.speedUp || 0) - 1);
    if (itemsToUse.treasureRadar) updatedItems.treasureRadar = Math.max(0, (updatedItems.treasureRadar || 0) - 1);
    if (itemsToUse.richCat) updatedItems.richCat = Math.max(0, (updatedItems.richCat || 0) - 1);
    if (itemsToUse.catCpu) updatedItems.catCpu = Math.max(0, (updatedItems.catCpu || 0) - 1);
    if (itemsToUse.catJobs) updatedItems.catJobs = Math.max(0, (updatedItems.catJobs || 0) - 1);
    if (itemsToUse.sniper) updatedItems.sniper = Math.max(0, (updatedItems.sniper || 0) - 1);

    // Deduct energy & update items
    setProfile((prev) => ({
      ...prev,
      energy: isInfiniteEnergy ? 9999 : Math.max(0, prev.energy - stage.energyCost),
      items: updatedItems,
    }));

    setActiveStage(stage);
    setBattleActiveItems(itemsToUse);
    setCurrentView('battle');
  };

  // Handle battle completion (rewards & progression)
  const handleBattleEnd = (result: {
    victory: boolean;
    xpEarned: number;
    catFoodEarned: number;
    treasureQuality?: TreasureQuality;
    scoreAttackScore?: number;
  }) => {
    if (!activeStage) return;

    setProfile((prev) => {
      const nextTreasures = { ...prev.treasures };
      if (result.treasureQuality && result.treasureQuality !== 'none') {
        const currentQ = nextTreasures[activeStage.id] || 'none';
        const rank = { none: 0, bronze: 1, silver: 2, gold: 3 };
        if (rank[result.treasureQuality] > rank[currentQ]) {
          nextTreasures[activeStage.id] = result.treasureQuality;
        }
      }

      const nextClearedStages = { ...prev.clearedStages };
      const nextCats = { ...prev.cats };

      if (result.victory) {
        nextClearedStages[activeStage.id] = true;

        // Unlock stage-specific reward characters (e.g. Crazed Series)
        if (activeStage.rewardCatUnlockId) {
          const unlockId = activeStage.rewardCatUnlockId;
          if (!nextCats[unlockId]) {
            nextCats[unlockId] = {
              unlocked: true,
              level: 1,
              plusLevel: 0,
              activeForm: 0,
            };
          }
        }

        // Unlock Valkyrie True Form upon clearing future zombie final boss
        if (activeStage.id === 'future_zombie_3' || activeStage.rewardCatUnlockId === 'valkyrie_true_form') {
          if (!nextCats['cat_valkyrie']) {
            nextCats['cat_valkyrie'] = {
              unlocked: true,
              level: 20,
              plusLevel: 0,
              activeForm: 2,
            };
          } else {
            nextCats['cat_valkyrie'].activeForm = 2;
          }
        }

        // Check if clearing final stage of a chapter to trigger Ending cutscene
        if (activeStage.id === 'japan_12' || activeStage.id === 'japan_6' || activeStage.id === 'japan_1_5' || activeStage.id === 'japan_3_3') {
          setTimeout(() => setActiveStoryKey('japan_ending'), 600);
        } else if (activeStage.id === 'future_3' || activeStage.id === 'future_3_3') {
          setTimeout(() => setActiveStoryKey('future_ending'), 600);
        } else if (activeStage.id === 'cosmos_3' || activeStage.id === 'cosmos_3_3') {
          setTimeout(() => setActiveStoryKey('cosmos_ending'), 600);
        } else if (activeStage.id === 'legend_21_2' || activeStage.id === 'legend_49_1') {
          setTimeout(() => setActiveStoryKey('legend_ending'), 600);
        } else if (activeStage.id === 'aku_realm_3_5' || activeStage.id === 'aku_realm_5') {
          setTimeout(() => setActiveStoryKey('aku_ending'), 600);
        }
      }

      const isFilibusterCleared =
        prev.hasClearedFilibuster ||
        (result.victory && (activeStage.id === 'cosmos_3_filibuster' || activeStage.id === 'legend_12_3'));

      const isValkyrieTrueUnlocked =
        prev.unlockedValkyrieTrueForm ||
        (result.victory && (activeStage.id === 'future_zombie_3' || activeStage.rewardCatUnlockId === 'valkyrie_true_form'));

      const isClionelDropUnlocked =
        prev.unlockedClionelDrop ||
        (result.victory && activeStage.id === 'advent_stage_clionel');

      const isHannyaDropUnlocked =
        prev.unlockedHannyaDrop ||
        (result.victory && activeStage.id === 'advent_stage_hannya');

      const isCycloneDropUnlocked =
        prev.unlockedCycloneDrop ||
        (result.victory && (activeStage.id === 'advent_stage_red_cyclone' || activeStage.id === 'advent_stage_black_cyclone' || activeStage.id === 'advent_stage_alien_cyclone' || activeStage.id === 'advent_stage_zombie_cyclone'));

      const isScoreAttack =
        activeStage.chapterId === 'challenge_score_attack' ||
        activeStage.id?.includes('score_attack') ||
        activeStage.difficultyLabel?.includes('スコアアタック');

      let nextScoreAttackHighScore = prev.scoreAttackHighScore || 0;
      if (isScoreAttack && result.victory && result.scoreAttackScore) {
        nextScoreAttackHighScore = Math.max(nextScoreAttackHighScore, result.scoreAttackScore);
      }

      return {
        ...prev,
        xp: prev.xp + result.xpEarned,
        catFood: prev.catFood + result.catFoodEarned,
        clearedStages: nextClearedStages,
        treasures: nextTreasures,
        cats: nextCats,
        hasClearedFilibuster: isFilibusterCleared,
        unlockedValkyrieTrueForm: isValkyrieTrueUnlocked,
        unlockedClionelDrop: isClionelDropUnlocked,
        unlockedHannyaDrop: isHannyaDropUnlocked,
        unlockedCycloneDrop: isCycloneDropUnlocked,
        scoreAttackHighScore: nextScoreAttackHighScore,
      };
    });
  };

  const handlePvpBattleEnd = (result?: { victory: boolean; xpEarned: number; catFoodEarned: number }) => {
    if (result) {
      setProfile((prev) => ({
        ...prev,
        xp: prev.xp + result.xpEarned,
        catFood: prev.catFood + result.catFoodEarned,
        pvpWins: (prev.pvpWins || 0) + (result.victory ? 1 : 0),
        pvpLosses: (prev.pvpLosses || 0) + (result.victory ? 0 : 1),
      }));
    }
    setPvpPayload(null);
  };

  // Find next stage in sequence if available
  const getNextStage = (): StageDefinition | null => {
    if (!activeStage) return null;
    for (const ch of CHAPTERS) {
      const idx = ch.stages.findIndex((s) => s.id === activeStage.id);
      if (idx !== -1 && idx < ch.stages.length - 1) {
        return ch.stages[idx + 1];
      }
    }
    return null;
  };

  const nextStage = getNextStage();

  const handleNextStage = () => {
    if (nextStage) {
      handleSelectStage(nextStage);
    } else {
      setCurrentView('map');
    }
  };

  const handleResetData = () => {
    const fresh = resetProfile();
    setProfile(fresh);
    setCurrentView('title');
  };

  return (
    <div className="w-full h-[100dvh] fixed inset-0 overflow-hidden bg-black select-none flex flex-col items-center justify-center">
      {/* Responsive 100dvh viewport wrapper */}
      <div className="relative w-full h-full max-w-[1920px] bg-stone-950 overflow-hidden shadow-2xl flex flex-col">
        {/* P2P PvP Battle View */}
        {pvpPayload ? (
          <PvpBattleScreen
            payload={pvpPayload}
            onExit={handlePvpBattleEnd}
          />
        ) : (
          <>
            {currentView === 'title' && (
              <TitleScreen
                onStartGame={() => setCurrentView('base')}
                onResetData={handleResetData}
                onOpenUpdateHistory={() => setShowUpdateHistory(true)}
                onOpenDevMode={() => setShowDevModal(true)}
                isLegendCleared={
                  !!profile.hasClearedFilibuster ||
                  !!profile.clearedStages['legend_21_2'] ||
                  !!profile.clearedStages['legend_49_1'] ||
                  !!profile.clearedStages['legend_12_3']
                }
              />
            )}

            {currentView === 'base' && (
              <CatBaseScreen
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                onStartBattle={() => setCurrentView('map')}
                onOpenPowerUp={() => setCurrentView('upgrade')}
                onOpenDeckFormation={() => setShowDeckFormationModal(true)}
                onOpenPvp={() => setShowPvpLobbyModal(true)}
                onOpenGacha={() => setCurrentView('gacha')}
                onOpenTreasures={() => setCurrentView('treasures')}
                onOpenEncyclopedia={() => setCurrentView('encyclopedia')}
                onOpenItemShop={() => setShowItemShopModal(true)}
                onOpenUserRankRewards={() => setShowUserRankRewardsModal(true)}
                onOpenGamatoto={() => setShowGamatotoModal(true)}
                onOpenStorage={() => setShowStorageModal(true)}
                onOpenMissions={() => setShowMissionsModal(true)}
                onOpenGiftCode={() => setShowGiftCodeModal(true)}
                onOpenAnnouncements={() => setShowAnnouncementsModal(true)}
                onOpenMenu={() => setShowMenuModal(true)}
                onBackToTitle={() => setCurrentView('title')}
              />
            )}

            {currentView === 'map' && (
              <StageSelectScreen
                profile={profile}
                onSelectStage={handleSelectStage}
                onOpenUpgrade={() => setCurrentView('upgrade')}
                onOpenGacha={() => setCurrentView('gacha')}
                onOpenTreasures={() => setCurrentView('treasures')}
                onOpenEncyclopedia={() => setCurrentView('encyclopedia')}
                onOpenUpdateHistory={() => setShowUpdateHistory(true)}
                onOpenDevMode={() => setShowDevModal(true)}
                onOpenStorySelect={() => setShowStorySelectModal(true)}
                onBackToTitle={() => setCurrentView('base')}
              />
            )}

            {currentView === 'battle' && activeStage && (
              <BattleScreen
                stage={activeStage}
                profile={profile}
                activeItems={battleActiveItems}
                onBattleEnd={handleBattleEnd}
                onExit={() => setCurrentView('map')}
                onNextStage={nextStage ? handleNextStage : undefined}
                hasNextStage={!!nextStage}
              />
            )}

            {currentView === 'upgrade' && (
              <PowerUpScreen
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                onBack={() => setCurrentView('base')}
              />
            )}

            {currentView === 'gacha' && (
              <GachaScreen
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                onBack={() => setCurrentView('base')}
              />
            )}

            {currentView === 'treasures' && (
              <TreasuresScreen
                profile={profile}
                onBack={() => setCurrentView('base')}
              />
            )}

            {currentView === 'encyclopedia' && (
              <CatEncyclopediaScreen
                onBack={() => setCurrentView('base')}
              />
            )}
          </>
        )}

        {/* Global Update History Modal */}
        {showUpdateHistory && (
          <UpdateHistoryModal onClose={() => setShowUpdateHistory(false)} />
        )}

        {/* Story Selection Gallery Modal */}
        <StorySelectModal
          isOpen={showStorySelectModal}
          profile={profile}
          onClose={() => setShowStorySelectModal(false)}
          onSelectStory={(storyKey) => {
            setShowStorySelectModal(false);
            setActiveStoryKey(storyKey);
          }}
        />

        {/* Chapter Story Scroll Player Modal */}
        <ChapterStoryModal
          storyKey={activeStoryKey}
          onClose={() => setActiveStoryKey(null)}
        />

        {/* Developer Mode Modal */}
        <DeveloperModeModal
          isOpen={showDevModal}
          profile={profile}
          onClose={() => setShowDevModal(false)}
          onUpdateProfile={handleUpdateProfile}
        />

        {/* Item Shop Modal */}
        <ItemShopModal
          isOpen={showItemShopModal}
          profile={profile}
          onClose={() => setShowItemShopModal(false)}
          onUpdateProfile={handleUpdateProfile}
        />

        {/* User Rank Rewards Modal */}
        <UserRankRewardsModal
          isOpen={showUserRankRewardsModal}
          profile={profile}
          onClose={() => setShowUserRankRewardsModal(false)}
          onUpdateProfile={handleUpdateProfile}
        />

        {/* Gamatoto Expedition Modal */}
        <GamatotoModal
          isOpen={showGamatotoModal}
          profile={profile}
          onClose={() => setShowGamatotoModal(false)}
          onUpdateProfile={handleUpdateProfile}
        />

        {/* Storage / Refrigerator Modal */}
        <StorageModal
          isOpen={showStorageModal}
          profile={profile}
          onClose={() => setShowStorageModal(false)}
          onOpenGacha={() => {
            setShowStorageModal(false);
            setCurrentView('gacha');
          }}
        />

        {/* Base Menu Modal */}
        <MenuModal
          isOpen={showMenuModal}
          onClose={() => setShowMenuModal(false)}
          onOpenAnnouncements={() => {
            setShowMenuModal(false);
            setShowAnnouncementsModal(true);
          }}
          onOpenMissions={() => {
            setShowMenuModal(false);
            setShowMissionsModal(true);
          }}
          onOpenGiftCode={() => {
            setShowMenuModal(false);
            setShowGiftCodeModal(true);
          }}
          onOpenTreasures={() => {
            setShowMenuModal(false);
            setCurrentView('treasures');
          }}
          onOpenEncyclopedia={() => {
            setShowMenuModal(false);
            setCurrentView('encyclopedia');
          }}
          onOpenStorySelect={() => {
            setShowMenuModal(false);
            setShowStorySelectModal(true);
          }}
          onOpenUpdateHistory={() => {
            setShowMenuModal(false);
            setShowUpdateHistory(true);
          }}
          onOpenDevMode={() => {
            setShowMenuModal(false);
            setShowDevModal(true);
          }}
          onBackToTitle={() => {
            setShowMenuModal(false);
            setCurrentView('title');
          }}
        />

        {/* Announcements / News Modal */}
        <AnnouncementsModal
          isOpen={showAnnouncementsModal}
          onClose={() => setShowAnnouncementsModal(false)}
        />

        {/* Character Deck Formation Modal */}
        <DeckFormationModal
          isOpen={showDeckFormationModal}
          profile={profile}
          onClose={() => setShowDeckFormationModal(false)}
          onUpdateProfile={handleUpdateProfile}
        />

        {/* Gift Code Redemption Modal */}
        <GiftCodeModal
          isOpen={showGiftCodeModal}
          profile={profile}
          onClose={() => setShowGiftCodeModal(false)}
          onUpdateProfile={handleUpdateProfile}
        />

        {/* Missions & Achievements Modal */}
        <MissionsAchievementsModal
          isOpen={showMissionsModal}
          profile={profile}
          onClose={() => setShowMissionsModal(false)}
          onUpdateProfile={handleUpdateProfile}
        />

        {/* P2P PvP Lobby Modal */}
        <PvpLobbyModal
          isOpen={showPvpLobbyModal}
          profile={profile}
          onClose={() => setShowPvpLobbyModal(false)}
          onUpdateProfile={handleUpdateProfile}
          onStartBattle={(payload) => {
            setShowPvpLobbyModal(false);
            setPvpPayload(payload);
          }}
        />
      </div>
    </div>
  );
}
