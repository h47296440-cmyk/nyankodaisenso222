import React, { useState } from 'react';
import { PlayerProfile, MissionDefinition, AchievementDefinition } from '../../types';
import { MISSIONS, ACHIEVEMENTS, getMissionProgress, getAchievementProgress } from '../../data/missions';
import { audio } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  X,
  Target,
  Trophy,
  CheckCircle2,
  Gift,
  Coins,
  Sparkles,
  Award,
  ChevronRight,
  Flame,
  Star,
  Check,
  Clock,
  Swords,
  Users,
  Skull,
  BarChart3,
} from 'lucide-react';

interface MissionsAchievementsModalProps {
  isOpen: boolean;
  profile: PlayerProfile;
  onClose: () => void;
  onUpdateProfile: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
  defaultTab?: 'missions' | 'achievements' | 'records';
}

export const MissionsAchievementsModal: React.FC<MissionsAchievementsModalProps> = ({
  isOpen,
  profile,
  onClose,
  onUpdateProfile,
  defaultTab = 'missions',
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'missions' | 'achievements' | 'records'>(defaultTab);
  const [missionCategory, setMissionCategory] = useState<'daily' | 'main' | 'event'>('daily');
  const [claimedNotice, setClaimedNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setClaimedNotice(msg);
    setTimeout(() => setClaimedNotice(null), 2500);
  };

  const filteredMissions = MISSIONS.filter((m) => m.category === missionCategory);

  // Claim single mission
  const handleClaimMission = (mission: MissionDefinition) => {
    audio.playVictory();
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });

    onUpdateProfile((prev) => {
      const nextProfile = { ...prev };
      nextProfile.claimedMissions = {
        ...(nextProfile.claimedMissions || {}),
        [mission.id]: Date.now(),
      };

      if (mission.reward.catFood) nextProfile.catFood += mission.reward.catFood;
      if (mission.reward.xp) nextProfile.xp += mission.reward.xp;
      if (mission.reward.items) {
        const nextItems = { ...nextProfile.items };
        if (mission.reward.items.speedUp) nextItems.speedUp = (nextItems.speedUp || 0) + mission.reward.items.speedUp;
        if (mission.reward.items.catCpu) nextItems.catCpu = (nextItems.catCpu || 0) + mission.reward.items.catCpu;
        if (mission.reward.items.treasureRadar) nextItems.treasureRadar = (nextItems.treasureRadar || 0) + mission.reward.items.treasureRadar;
        if (mission.reward.items.richCat) nextItems.richCat = (nextItems.richCat || 0) + mission.reward.items.richCat;
        if (mission.reward.items.catJobs) nextItems.catJobs = (nextItems.catJobs || 0) + mission.reward.items.catJobs;
        if (mission.reward.items.sniper) nextItems.sniper = (nextItems.sniper || 0) + mission.reward.items.sniper;
        nextProfile.items = nextItems;
      }
      return nextProfile;
    });

    showNotification(`ミッション報酬を受け取りました！`);
  };

  // Claim single achievement
  const handleClaimAchievement = (ach: AchievementDefinition) => {
    audio.playVictory();
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });

    onUpdateProfile((prev) => {
      const nextProfile = { ...prev };
      nextProfile.claimedAchievements = {
        ...(nextProfile.claimedAchievements || {}),
        [ach.id]: Date.now(),
      };

      if (ach.reward.catFood) nextProfile.catFood += ach.reward.catFood;
      if (ach.reward.xp) nextProfile.xp += ach.reward.xp;
      return nextProfile;
    });

    showNotification(`実績「${ach.title}」の報酬を獲得！`);
  };

  // Claim All completed missions in current view
  const handleClaimAllCompleted = () => {
    let totalCatFood = 0;
    let totalXp = 0;
    const newClaimedMissions = { ...(profile.claimedMissions || {}) };

    filteredMissions.forEach((m) => {
      const progress = getMissionProgress(m, profile);
      const isComplete = progress >= m.targetCount;
      const isClaimed = !!newClaimedMissions[m.id];

      if (isComplete && !isClaimed) {
        newClaimedMissions[m.id] = Date.now();
        if (m.reward.catFood) totalCatFood += m.reward.catFood;
        if (m.reward.xp) totalXp += m.reward.xp;
      }
    });

    if (totalCatFood === 0 && totalXp === 0) {
      audio.playHit(false, true);
      showNotification('受け取り可能なミッションはありません');
      return;
    }

    audio.playVictory();
    confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });

    onUpdateProfile((prev) => ({
      ...prev,
      catFood: prev.catFood + totalCatFood,
      xp: prev.xp + totalXp,
      claimedMissions: newClaimedMissions,
    }));

    showNotification(`一括受け取り完了！ +${totalCatFood}缶 / +${totalXp.toLocaleString()} XP`);
  };

  // Count unclaimed completed items
  const unclaimedMissionsCount = MISSIONS.filter((m) => {
    const p = getMissionProgress(m, profile);
    return p >= m.targetCount && !(profile.claimedMissions && profile.claimedMissions[m.id]);
  }).length;

  const unclaimedAchievementsCount = ACHIEVEMENTS.filter((a) => {
    const p = getAchievementProgress(a, profile);
    return p >= a.targetCount && !(profile.claimedAchievements && profile.claimedAchievements[a.id]);
  }).length;

  return (
    <div
      id="missions-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="missions-modal-card"
        className="w-full max-w-2xl bg-stone-900 border-2 border-stone-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 px-4 py-3 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5 p-1 bg-stone-950 rounded-xl border border-stone-800">
              <button
                id="tab-btn-missions"
                onClick={() => {
                  audio.playClick();
                  setActiveMainTab('missions');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                  activeMainTab === 'missions'
                    ? 'bg-amber-500 text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Target size={14} />
                <span>ミッション</span>
                {unclaimedMissionsCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                    {unclaimedMissionsCount}
                  </span>
                )}
              </button>

              <button
                id="tab-btn-achievements"
                onClick={() => {
                  audio.playClick();
                  setActiveMainTab('achievements');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                  activeMainTab === 'achievements'
                    ? 'bg-amber-500 text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Trophy size={14} />
                <span>実績・トロフィー</span>
                {unclaimedAchievementsCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                    {unclaimedAchievementsCount}
                  </span>
                )}
              </button>

              <button
                id="tab-btn-records"
                onClick={() => {
                  audio.playClick();
                  setActiveMainTab('records');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                  activeMainTab === 'records'
                    ? 'bg-emerald-500 text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <BarChart3 size={14} />
                <span>📊 戦歴・記録</span>
              </button>
            </div>
          </div>

          <button
            id="btn-close-missions-modal"
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-all active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sub-Header / Notification bar */}
        {claimedNotice && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/50 px-4 py-1.5 text-xs text-emerald-300 font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span>{claimedNotice}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {activeMainTab === 'missions' ? (
            <>
              {/* Mission Categories */}
              <div className="flex items-center justify-between gap-2 border-b border-stone-800 pb-2.5">
                <div className="flex gap-2">
                  <button
                    id="subtab-daily-missions"
                    onClick={() => {
                      audio.playClick();
                      setMissionCategory('daily');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      missionCategory === 'daily'
                        ? 'bg-stone-700 text-amber-300 border border-amber-500/40'
                        : 'bg-stone-800/60 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    デイリー
                  </button>
                  <button
                    id="subtab-main-missions"
                    onClick={() => {
                      audio.playClick();
                      setMissionCategory('main');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      missionCategory === 'main'
                        ? 'bg-stone-700 text-amber-300 border border-amber-500/40'
                        : 'bg-stone-800/60 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    メイン
                  </button>
                  <button
                    id="subtab-event-missions"
                    onClick={() => {
                      audio.playClick();
                      setMissionCategory('event');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      missionCategory === 'event'
                        ? 'bg-stone-700 text-amber-300 border border-amber-500/40'
                        : 'bg-stone-800/60 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    イベント
                  </button>
                </div>

                <button
                  id="btn-claim-all-missions"
                  onClick={handleClaimAllCompleted}
                  className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs active:scale-95 transition-all shadow"
                >
                  一括受け取り
                </button>
              </div>

              {/* Missions List */}
              <div className="space-y-2.5">
                {filteredMissions.map((m) => {
                  const progress = getMissionProgress(m, profile);
                  const isComplete = progress >= m.targetCount;
                  const isClaimed = !!(profile.claimedMissions && profile.claimedMissions[m.id]);
                  const percent = Math.min(100, Math.floor((progress / m.targetCount) * 100));

                  return (
                    <div
                      key={m.id}
                      className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isClaimed
                          ? 'bg-stone-950/40 border-stone-800/60 opacity-60'
                          : isComplete
                          ? 'bg-amber-950/30 border-amber-500/50 shadow-lg shadow-amber-500/10'
                          : 'bg-stone-950/80 border-stone-800'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs sm:text-sm font-black text-stone-100">{m.title}</span>
                          {isClaimed ? (
                            <span className="text-[10px] bg-stone-800 text-stone-400 px-1.5 py-0.2 rounded font-bold">
                              受取済
                            </span>
                          ) : isComplete ? (
                            <span className="text-[10px] bg-amber-500 text-stone-950 px-1.5 py-0.2 rounded font-black animate-pulse">
                              達成！
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-stone-400 line-clamp-1 mb-2">{m.description}</p>

                        {/* Progress bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-stone-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                isComplete ? 'bg-amber-400' : 'bg-cyan-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-stone-400">
                            {progress} / {m.targetCount}
                          </span>
                        </div>
                      </div>

                      {/* Reward & Button */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 border-stone-800/80 pt-2 sm:pt-0">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                          {m.reward.catFood && (
                            <span className="flex items-center gap-1 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                              <Coins size={12} /> +{m.reward.catFood}缶
                            </span>
                          )}
                          {m.reward.xp && (
                            <span className="flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-300">
                              <Sparkles size={12} /> +{m.reward.xp.toLocaleString()}XP
                            </span>
                          )}
                        </div>

                        <button
                          id={`btn-claim-mission-${m.id}`}
                          onClick={() => handleClaimMission(m)}
                          disabled={!isComplete || isClaimed}
                          className={`px-4 py-1.5 rounded-xl font-black text-xs transition-all active:scale-95 ${
                            isClaimed
                              ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                              : isComplete
                              ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 border-2 border-yellow-200 shadow-md animate-bounce'
                              : 'bg-stone-800 text-stone-500 cursor-not-allowed opacity-60'
                          }`}
                        >
                          {isClaimed ? '受取済' : isComplete ? '受け取る' : '進行中'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : activeMainTab === 'achievements' ? (
            /* ACHIEVEMENTS TAB */
            <div className="space-y-2.5">
              {ACHIEVEMENTS.map((ach) => {
                const progress = getAchievementProgress(ach, profile);
                const isComplete = progress >= ach.targetCount;
                const isClaimed = !!(profile.claimedAchievements && profile.claimedAchievements[ach.id]);
                const percent = Math.min(100, Math.floor((progress / ach.targetCount) * 100));

                return (
                  <div
                    key={ach.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isClaimed
                        ? 'bg-stone-950/40 border-stone-800/60 opacity-60'
                        : isComplete
                        ? 'bg-gradient-to-r from-amber-950/40 via-stone-900 to-amber-950/40 border-amber-500/60 shadow-lg'
                        : 'bg-stone-950/80 border-stone-800'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-xl shrink-0">
                        {ach.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs sm:text-sm font-black text-stone-100">{ach.title}</span>
                          {ach.reward.badgeTitle && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 rounded font-bold">
                              称号: {ach.reward.badgeTitle}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-400 mb-1.5">{ach.subtitle}</p>

                        {/* Progress */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-stone-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                isComplete ? 'bg-amber-400' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-stone-400">
                            {progress} / {ach.targetCount}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Reward & Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 border-stone-800/80 pt-2 sm:pt-0">
                      <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-500/30">
                        <Coins size={13} />
                        <span>+{ach.reward.catFood}缶</span>
                        {ach.reward.xp && (
                          <span className="text-emerald-300 font-normal text-[10px] ml-1">
                            +{ach.reward.xp.toLocaleString()}XP
                          </span>
                        )}
                      </div>

                      <button
                        id={`btn-claim-ach-${ach.id}`}
                        onClick={() => handleClaimAchievement(ach)}
                        disabled={!isComplete || isClaimed}
                        className={`px-4 py-1.5 rounded-xl font-black text-xs transition-all active:scale-95 ${
                          isClaimed
                            ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                            : isComplete
                            ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 border-2 border-yellow-200 shadow-md animate-bounce'
                            : 'bg-stone-800 text-stone-500 cursor-not-allowed opacity-60'
                        }`}
                      >
                        {isClaimed ? '受取済' : isComplete ? '受け取る' : '未達成'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Records / 戦歴 tab */
            <div className="space-y-3 animate-fade-in">
              <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-stone-400 font-bold">司令官ステータス</div>
                  <div className="text-base sm:text-lg font-black text-amber-300">
                    UR {profile.userRank} （ユーザーランク）
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-stone-400 font-bold">総プレイ時間</div>
                  <div className="text-xs sm:text-sm font-mono font-black text-cyan-300">
                    {Math.floor((profile.stats?.playTimeSeconds || 0) / 3600)}時間{' '}
                    {Math.floor(((profile.stats?.playTimeSeconds || 0) % 3600) / 60)}分{' '}
                    {(profile.stats?.playTimeSeconds || 0) % 60}秒
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-stone-950/80 p-3 rounded-xl border border-amber-500/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-500/40 flex items-center justify-center shrink-0">
                    <Coins className="text-amber-400" size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-stone-400 font-bold">使ったお金の総額 (戦闘中)</div>
                    <div className="text-sm font-black text-amber-300 font-mono">
                      ¥{(profile.stats?.totalMoneySpent || 0).toLocaleString()} 円
                    </div>
                  </div>
                </div>

                <div className="bg-stone-950/80 p-3 rounded-xl border border-emerald-500/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <Users className="text-emerald-400" size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-stone-400 font-bold">生産したにゃんこ総数</div>
                    <div className="text-sm font-black text-emerald-300 font-mono">
                      {(profile.stats?.totalCatsSpawned || 0).toLocaleString()} 体
                    </div>
                  </div>
                </div>

                <div className="bg-stone-950/80 p-3 rounded-xl border border-rose-500/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-500/40 flex items-center justify-center shrink-0">
                    <Swords className="text-rose-400" size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-stone-400 font-bold">総出撃回数（バトル）</div>
                    <div className="text-sm font-black text-rose-300 font-mono">
                      {(profile.stats?.battlesFought || 0).toLocaleString()} 回{' '}
                      <span className="text-[11px] font-normal text-stone-400">
                        (勝利: {(profile.stats?.battlesWon || 0).toLocaleString()}回)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-stone-950/80 p-3 rounded-xl border border-purple-500/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center shrink-0">
                    <Skull className="text-purple-400" size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-stone-400 font-bold">撃破した敵の総数</div>
                    <div className="text-sm font-black text-purple-300 font-mono">
                      {(profile.stats?.totalEnemiesDefeated || 0).toLocaleString()} 体
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-950 px-4 py-2.5 border-t border-stone-800 flex justify-end">
          <button
            id="btn-close-missions-footer"
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="px-5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-black border border-stone-700 active:scale-95 transition-all"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
