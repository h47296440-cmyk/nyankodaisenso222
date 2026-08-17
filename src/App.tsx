import React, { useState, useEffect } from 'react';
import { PlayerProfile, StageDefinition, TreasureQuality } from './types';
import { loadProfile, saveProfile, resetProfile } from './utils/storage';
import { CHAPTERS } from './data/stages';
import { TitleScreen } from './components/title/TitleScreen';
import { StageSelectScreen } from './components/map/StageSelectScreen';
import { BattleScreen } from './components/battle/BattleScreen';
import { PowerUpScreen } from './components/upgrade/PowerUpScreen';
import { GachaScreen } from './components/gacha/GachaScreen';
import { TreasuresScreen } from './components/treasures/TreasuresScreen';
import { CatEncyclopediaScreen } from './components/encyclopedia/CatEncyclopediaScreen';

type AppView = 'title' | 'map' | 'battle' | 'upgrade' | 'gacha' | 'treasures' | 'encyclopedia';

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(loadProfile);
  const [currentView, setCurrentView] = useState<AppView>('title');
  const [activeStage, setActiveStage] = useState<StageDefinition | null>(null);

  // Sync profile to localStorage whenever it changes
  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  // Periodic energy regeneration (1 energy every 30 seconds up to maxEnergy)
  useEffect(() => {
    const timer = setInterval(() => {
      setProfile((prev) => {
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

  // Launch battle with selected stage
  const handleSelectStage = (stage: StageDefinition) => {
    if (profile.energy < stage.energyCost) return;

    // Deduct energy
    setProfile((prev) => ({
      ...prev,
      energy: Math.max(0, prev.energy - stage.energyCost),
    }));

    setActiveStage(stage);
    setCurrentView('battle');
  };

  // Handle battle completion (rewards & progression)
  const handleBattleEnd = (result: {
    victory: boolean;
    xpEarned: number;
    catFoodEarned: number;
    treasureQuality?: TreasureQuality;
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
      if (result.victory) {
        nextClearedStages[activeStage.id] = true;
      }

      return {
        ...prev,
        xp: prev.xp + result.xpEarned,
        catFood: prev.catFood + result.catFoodEarned,
        clearedStages: nextClearedStages,
        treasures: nextTreasures,
      };
    });
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
    <div className="w-screen h-screen overflow-hidden bg-black select-none flex flex-col items-center justify-center">
      {/* 16:9 or responsive viewport wrapper */}
      <div className="relative w-full h-full max-w-[1920px] max-h-[1080px] bg-stone-950 overflow-hidden shadow-2xl flex flex-col">
        {currentView === 'title' && (
          <TitleScreen
            onStartGame={() => setCurrentView('map')}
            onResetData={handleResetData}
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
            onBackToTitle={() => setCurrentView('title')}
          />
        )}

        {currentView === 'battle' && activeStage && (
          <BattleScreen
            stage={activeStage}
            profile={profile}
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
            onBack={() => setCurrentView('map')}
          />
        )}

        {currentView === 'gacha' && (
          <GachaScreen
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onBack={() => setCurrentView('map')}
          />
        )}

        {currentView === 'treasures' && (
          <TreasuresScreen
            profile={profile}
            onBack={() => setCurrentView('map')}
          />
        )}

        {currentView === 'encyclopedia' && (
          <CatEncyclopediaScreen
            onBack={() => setCurrentView('map')}
          />
        )}
      </div>
    </div>
  );
}
