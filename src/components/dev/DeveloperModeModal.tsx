import React, { useState, useEffect } from 'react';
import { PlayerProfile, DevModeSettings, TreasureQuality } from '../../types';
import { CAT_DEFINITIONS } from '../../data/units';
import { CHAPTERS, TREASURES } from '../../data/stages';
import { GIFT_CODES, redeemGiftCode } from '../../data/giftCodes';
import { audio } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  Wrench,
  Lock,
  Unlock,
  Zap,
  Sparkles,
  Coins,
  Check,
  X,
  ShieldAlert,
  Award,
  Cat,
  Package,
  RotateCcw,
  KeyRound,
  Gift,
  Copy,
  CheckCheck,
  Clock,
  Calendar,
  Sparkle,
} from 'lucide-react';

interface DeveloperModeModalProps {
  isOpen: boolean;
  profile: PlayerProfile;
  onClose: () => void;
  onUpdateProfile: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
}

// Valid 4-character unlock codes
const VALID_CODES = ['NYAN', '9999', '7777', 'CAT9', '0000', 'NEKO', 'CATS', 'BOSS', 'MEOW', 'DEV9'];

export const DeveloperModeModal: React.FC<DeveloperModeModalProps> = ({
  isOpen,
  profile,
  onClose,
  onUpdateProfile,
}) => {
  const isUnlocked = !!profile.devMode?.unlocked;
  const [activeTab, setActiveTab] = useState<'debug' | 'gift_codes'>('debug');
  const [codeInput, setCodeInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccessShake, setIsSuccessShake] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const hiddenInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !isUnlocked) {
      setCodeInput('');
      setErrorMessage('');
      setTimeout(() => {
        hiddenInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isUnlocked]);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => {
      setSuccessNotice(null);
    }, 2500);
  };

  const handleCopyCode = (code: string) => {
    audio.playClick();
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    showNotification(`コード「${code}」をコピーしました！`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleTestRedeem = (code: string) => {
    audio.playClick();
    const result = redeemGiftCode(code, profile);
    if (result.success && result.updatedProfile) {
      audio.playVictory();
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      onUpdateProfile(() => result.updatedProfile!);
      showNotification(`コード「${code}」を適用しました！`);
    } else {
      audio.playHit(false, true);
      showNotification(result.message);
    }
  };

  // Handle 4-character passcode verification
  const handleVerifyCode = (codeToVerify?: string) => {
    const formatted = (codeToVerify || codeInput).trim().toUpperCase();

    if (VALID_CODES.includes(formatted)) {
      audio.playVictory();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      setErrorMessage('');
      setCodeInput('');

      onUpdateProfile((prev) => ({
        ...prev,
        devMode: {
          ...(prev.devMode || {
            infiniteEnergy: false,
            infiniteXp: false,
            infiniteCatFood: false,
          }),
          unlocked: true,
        },
      }));
      showNotification('開発者モードの認証に成功しました！');
    } else {
      audio.playHit(false, true);
      setErrorMessage('パスコードが正しくありません');
      setIsSuccessShake(true);
      setTimeout(() => setIsSuccessShake(false), 500);
    }
  };

  // Keypad press handler
  const handleKeypadPress = (char: string) => {
    audio.playClick();
    setErrorMessage('');
    if (char === 'BACK') {
      setCodeInput((prev) => prev.slice(0, -1));
    } else if (char === 'CLEAR') {
      setCodeInput('');
    } else {
      setCodeInput((prev) => {
        if (prev.length >= 4) return prev;
        const next = (prev + char).toUpperCase();
        if (next.length === 4) {
          // Auto submit when 4 chars are entered
          setTimeout(() => handleVerifyCode(next), 150);
        }
        return next;
      });
    }
  };

  // Toggle Dev Feature (Infinite Energy / XP / Cat Food)
  const handleToggleFeature = (key: keyof Omit<DevModeSettings, 'unlocked'>) => {
    audio.playClick();
    onUpdateProfile((prev) => {
      const currentDev = prev.devMode || {
        unlocked: true,
        infiniteEnergy: false,
        infiniteXp: false,
        infiniteCatFood: false,
      };

      const nextVal = !currentDev[key];
      const nextDev = {
        ...currentDev,
        [key]: nextVal,
      };

      let nextXp = prev.xp;
      let nextCatFood = prev.catFood;
      let nextEnergy = prev.energy;

      if (key === 'infiniteXp' && nextVal) {
        nextXp = Math.max(prev.xp, 99999999);
      }
      if (key === 'infiniteCatFood' && nextVal) {
        nextCatFood = Math.max(prev.catFood, 99999);
      }
      if (key === 'infiniteEnergy' && nextVal) {
        nextEnergy = 9999;
      }

      return {
        ...prev,
        xp: nextXp,
        catFood: nextCatFood,
        energy: nextEnergy,
        devMode: nextDev,
      };
    });
  };

  // Quick Action: Unlock All Cats to Lv 20
  const handleUnlockAllCats = () => {
    audio.playWorkerLevelUp();
    onUpdateProfile((prev) => {
      const nextCats = { ...prev.cats };
      CAT_DEFINITIONS.forEach((cat) => {
        nextCats[cat.id] = {
          catId: cat.id,
          level: 20,
          unlocked: true,
          activeForm: 1, // Evolved form
        };
      });
      return {
        ...prev,
        cats: nextCats,
      };
    });
    showNotification('全にゃんこを Lv20(第2形態) で全開放しました！');
  };

  // Quick Action: Complete All Treasures with Gold
  const handleCompleteAllTreasures = () => {
    audio.playVictory();
    onUpdateProfile((prev) => {
      const nextTreasures: Record<string, TreasureQuality> = {};
      Object.keys(TREASURES).forEach((stageId) => {
        nextTreasures[stageId] = 'gold';
      });
      return {
        ...prev,
        treasures: nextTreasures,
      };
    });
    showNotification('全ステージのお宝を【最高品質: 金】で全取得しました！');
  };

  // Quick Action: Unlock All Stages
  const handleUnlockAllStages = () => {
    audio.playVictory();
    onUpdateProfile((prev) => {
      const nextCleared = { ...prev.clearedStages };
      CHAPTERS.forEach((ch) => {
        ch.stages.forEach((st) => {
          nextCleared[st.id] = { stars: 1, highscore: 99999 };
        });
      });
      return {
        ...prev,
        clearedStages: nextCleared,
      };
    });
    showNotification('日本・未来・宇宙編の全ステージを解放・クリアしました！');
  };

  // Quick Action: Max Battle Items
  const handleMaxBattleItems = () => {
    audio.playWorkerLevelUp();
    onUpdateProfile((prev) => ({
      ...prev,
      items: {
        speedUp: 99,
        catCpu: 99,
        treasureRadar: 99,
        richCat: 99,
        catJobs: 99,
        sniper: 99,
      },
    }));
    showNotification('全バトルアイテムを各99個補充しました！');
  };

  // Lock Dev Mode again
  const handleLockDevMode = () => {
    audio.playClick();
    onUpdateProfile((prev) => ({
      ...prev,
      devMode: {
        unlocked: false,
        infiniteEnergy: false,
        infiniteXp: false,
        infiniteCatFood: false,
      },
    }));
    showNotification('開発者モードをロックしました');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className={`relative w-full max-w-lg bg-stone-900 border-4 border-amber-500 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white font-['M_PLUS_Rounded_1c'] ${
          isSuccessShake ? 'animate-shake' : ''
        }`}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 border-b-2 border-amber-500/80 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Wrench size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-1.5">
                <span>開発者モード (DEV PANEL)</span>
                {isUnlocked ? (
                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded">
                    認証済
                  </span>
                ) : (
                  <span className="text-[10px] bg-stone-700 text-stone-300 font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                    <Lock size={10} /> ロック中
                  </span>
                )}
              </h2>
              <p className="text-[10px] text-stone-400">デバッグ・各種リソース無制限設定</p>
            </div>
          </div>

          <button
            id="btn-close-dev-modal"
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 active:scale-95 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Notification Toast inside Modal */}
        {successNotice && (
          <div className="bg-emerald-600 text-white text-xs font-black py-1.5 px-4 text-center shadow animate-bounce">
            {successNotice}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {!isUnlocked ? (
            /* 1. CODE ENTRY STATE */
            <div className="flex flex-col items-center justify-center py-2 text-center space-y-3.5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-inner">
                <KeyRound size={28} />
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-black text-white">4文字のコードを入力</h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  開発者パスコードを入力してください
                </p>
              </div>

              {/* 4 Discrete Passcode Cells */}
              <div
                onClick={() => hiddenInputRef.current?.focus()}
                className="flex items-center justify-center gap-3 cursor-pointer py-1"
              >
                {[0, 1, 2, 3].map((idx) => {
                  const char = codeInput[idx] || '';
                  const isCurrent = codeInput.length === idx;
                  return (
                    <div
                      key={idx}
                      className={`w-12 h-14 sm:w-14 sm:h-16 rounded-xl flex items-center justify-center text-2xl sm:text-3xl font-mono font-black transition-all ${
                        char
                          ? 'bg-amber-950/80 border-2 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)] scale-105'
                          : isCurrent
                          ? 'bg-stone-950 border-2 border-amber-500/80 text-amber-400/50 animate-pulse'
                          : 'bg-stone-950 border-2 border-stone-800 text-stone-600'
                      }`}
                    >
                      {char || (isCurrent ? '•' : '')}
                    </div>
                  );
                })}
              </div>

              {/* Hidden master input for hardware / mobile keyboards */}
              <input
                ref={hiddenInputRef}
                id="input-dev-hidden"
                type="text"
                maxLength={4}
                value={codeInput}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().slice(0, 4);
                  setCodeInput(val);
                  setErrorMessage('');
                  if (val.length === 4) {
                    setTimeout(() => handleVerifyCode(val), 150);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleVerifyCode();
                  }
                }}
                autoComplete="off"
                className="opacity-0 absolute -z-10 pointer-events-none w-0 h-0"
              />

              {errorMessage && (
                <p className="text-xs font-bold text-red-400 bg-red-950/60 py-1 px-3 rounded-lg border border-red-800 animate-shake">
                  {errorMessage}
                </p>
              )}

              {/* Compact On-Screen Keypad for Touch / Mouse Ease */}
              <div className="w-full max-w-xs space-y-1.5 pt-1">
                <div className="grid grid-cols-4 gap-1.5 text-sm font-bold font-mono">
                  {['N', 'Y', 'A', '9', 'C', 'T', 'E', '7', 'K', 'O', 'B', '0'].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleKeypadPress(key)}
                      className="py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 active:bg-amber-600 active:text-white text-stone-200 border border-stone-700 active:scale-95 transition-all"
                    >
                      {key}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs font-bold font-mono pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('CLEAR')}
                    className="py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 border border-stone-800 active:scale-95"
                  >
                    クリア (Clear)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('BACK')}
                    className="py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-400 border border-stone-800 active:scale-95"
                  >
                    ⌫ 1文字削除
                  </button>
                </div>
              </div>

              <button
                id="btn-submit-dev-code"
                type="button"
                onClick={() => handleVerifyCode()}
                disabled={codeInput.length < 4}
                className={`w-full max-w-xs py-2.5 rounded-xl font-black text-sm border-2 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                  codeInput.length >= 4
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 border-yellow-200 shadow-amber-500/20 cursor-pointer'
                    : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed opacity-60'
                }`}
              >
                <Unlock size={16} />
                <span>認証して解除</span>
              </button>
            </div>
          ) : (
            /* 2. UNLOCKED DEV CONTROL PANEL */
            <div className="space-y-4">
              {/* Tab Navigation */}
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <div className="flex gap-2">
                  <button
                    id="tab-dev-debug"
                    onClick={() => {
                      audio.playClick();
                      setActiveTab('debug');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors flex items-center gap-1.5 ${
                      activeTab === 'debug'
                        ? 'bg-amber-500 text-stone-950 shadow-md'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    <Wrench size={13} /> デバッグ機能
                  </button>
                  <button
                    id="tab-dev-gift-codes"
                    onClick={() => {
                      audio.playClick();
                      setActiveTab('gift_codes');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors flex items-center gap-1.5 ${
                      activeTab === 'gift_codes'
                        ? 'bg-amber-500 text-stone-950 shadow-md'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    <Gift size={13} /> 配布用コード管理
                  </button>
                </div>

                <button
                  id="btn-relock-dev"
                  onClick={handleLockDevMode}
                  className="text-[10px] text-stone-400 hover:text-red-400 flex items-center gap-1 bg-stone-800 hover:bg-stone-700 px-2 py-1 rounded border border-stone-700 active:scale-95"
                >
                  <Lock size={10} /> ロック
                </button>
              </div>

              {activeTab === 'debug' ? (
                <>
                  {/* Infinites Section Title */}
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={14} /> 無限リソース設定 (ON / OFF)
                  </span>

                  {/* Toggles Container */}
                  <div className="space-y-2.5">
                    {/* 1. INFINITE ENERGY */}
                    <div className="bg-stone-950/80 p-3 rounded-xl border border-stone-800 flex items-center justify-between hover:border-cyan-500/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
                          <Zap size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-black text-cyan-300 flex items-center gap-1.5">
                            <span>統率力 無限</span>
                            {profile.devMode?.infiniteEnergy && (
                              <span className="text-[10px] bg-cyan-500 text-stone-950 font-black px-1.5 rounded">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-400 mt-0.5">
                            統率力が常に全快(9999)・出撃時の消費なし
                          </p>
                        </div>
                      </div>

                      <button
                        id="toggle-infinite-energy"
                        onClick={() => handleToggleFeature('infiniteEnergy')}
                        className={`relative w-14 h-7 rounded-full transition-colors border-2 ${
                          profile.devMode?.infiniteEnergy
                            ? 'bg-cyan-500 border-cyan-300'
                            : 'bg-stone-800 border-stone-600'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                            profile.devMode?.infiniteEnergy ? 'left-7' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {/* 2. INFINITE XP */}
                    <div className="bg-stone-950/80 p-3 rounded-xl border border-stone-800 flex items-center justify-between hover:border-emerald-500/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                          <Sparkles size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-black text-emerald-300 flex items-center gap-1.5">
                            <span>XP 無限</span>
                            {profile.devMode?.infiniteXp && (
                              <span className="text-[10px] bg-emerald-500 text-stone-950 font-black px-1.5 rounded">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-400 mt-0.5">
                            所持XPが99,999,999になりキャラ強化し放題
                          </p>
                        </div>
                      </div>

                      <button
                        id="toggle-infinite-xp"
                        onClick={() => handleToggleFeature('infiniteXp')}
                        className={`relative w-14 h-7 rounded-full transition-colors border-2 ${
                          profile.devMode?.infiniteXp
                            ? 'bg-emerald-500 border-emerald-300'
                            : 'bg-stone-800 border-stone-600'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                            profile.devMode?.infiniteXp ? 'left-7' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {/* 3. INFINITE CAT FOOD */}
                    <div className="bg-stone-950/80 p-3 rounded-xl border border-stone-800 flex items-center justify-between hover:border-amber-500/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                          <Coins size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                            <span>ネコカン 無限</span>
                            {profile.devMode?.infiniteCatFood && (
                              <span className="text-[10px] bg-amber-500 text-stone-950 font-black px-1.5 rounded">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-400 mt-0.5">
                            所持ネコカンが99,999缶になりガチャ回し放題
                          </p>
                        </div>
                      </div>

                      <button
                        id="toggle-infinite-catfood"
                        onClick={() => handleToggleFeature('infiniteCatFood')}
                        className={`relative w-14 h-7 rounded-full transition-colors border-2 ${
                          profile.devMode?.infiniteCatFood
                            ? 'bg-amber-500 border-amber-300'
                            : 'bg-stone-800 border-stone-600'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                            profile.devMode?.infiniteCatFood ? 'left-7' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Dev Quick Actions Section */}
                  <div className="border-t border-stone-800 pt-3">
                    <span className="text-xs font-black text-stone-400 uppercase tracking-wider mb-2 block">
                      🛠️ 一括アシスト・ショートカット機能
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        id="btn-dev-unlock-cats"
                        onClick={handleUnlockAllCats}
                        className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-left flex items-center gap-2 active:scale-95 transition-all group"
                      >
                        <Cat size={18} className="text-amber-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="text-xs font-black text-stone-200">全キャラLv20開放</div>
                          <div className="text-[10px] text-stone-400">第2形態含む全キャラ</div>
                        </div>
                      </button>

                      <button
                        id="btn-dev-unlock-treasures"
                        onClick={handleCompleteAllTreasures}
                        className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-left flex items-center gap-2 active:scale-95 transition-all group"
                      >
                        <Award size={18} className="text-yellow-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="text-xs font-black text-stone-200">全お宝 金コンプ</div>
                          <div className="text-[10px] text-stone-400">全章のお宝MAX</div>
                        </div>
                      </button>

                      <button
                        id="btn-dev-unlock-stages"
                        onClick={handleUnlockAllStages}
                        className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-left flex items-center gap-2 active:scale-95 transition-all group"
                      >
                        <ShieldAlert size={18} className="text-rose-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="text-xs font-black text-stone-200">全ステージ解放</div>
                          <div className="text-[10px] text-stone-400">日本・未来・宇宙</div>
                        </div>
                      </button>

                      <button
                        id="btn-dev-max-items"
                        onClick={handleMaxBattleItems}
                        className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-left flex items-center gap-2 active:scale-95 transition-all group"
                      >
                        <Package size={18} className="text-purple-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="text-xs font-black text-stone-200">全アイテム x99</div>
                          <div className="text-[10px] text-stone-400">戦闘アイテム全補充</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* GIFT CODES MANAGER TAB */
                <div className="space-y-3">
                  <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-xl">
                    <div className="text-xs font-black text-amber-300 flex items-center gap-1.5 mb-1">
                      <Gift size={14} /> 開発者専用 プレゼントコード配布・確認
                    </div>
                    <p className="text-[11px] text-stone-300 leading-relaxed">
                      開発者コードを知っている管理者のみが閲覧・配布できるプレゼントコード一覧です。コードをコピーしてユーザーに配ったり、テスト適用が可能です。
                    </p>
                  </div>

                  {/* Infinite Energy Status if active */}
                  {profile.infiniteEnergyUntil && profile.infiniteEnergyUntil > Date.now() && (
                    <div className="bg-cyan-950/60 border border-cyan-500/50 p-2.5 rounded-xl flex items-center justify-between text-xs text-cyan-300">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Zap size={14} className="text-cyan-400 animate-pulse" /> 統率力1日無限 適用中
                      </span>
                      <span className="font-mono text-[11px] bg-cyan-900/60 px-2 py-0.5 rounded border border-cyan-500/30">
                        期限: {new Date(profile.infiniteEnergyUntil).toLocaleString('ja-JP')}
                      </span>
                    </div>
                  )}

                  {/* Gift Code Cards */}
                  <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                    {GIFT_CODES.map((g) => {
                      const isRedeemed = !!(profile.redeemedCodes && profile.redeemedCodes[g.code]);
                      return (
                        <div
                          key={g.code}
                          className={`p-3 rounded-xl border transition-all ${
                            g.code === 'ENERGY2026'
                              ? 'bg-cyan-950/40 border-cyan-500/40'
                              : g.code === 'SUMMERCAT2026'
                              ? 'bg-rose-950/40 border-rose-500/40'
                              : 'bg-stone-900 border-stone-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div>
                              <div className="text-xs font-black text-stone-100 flex items-center gap-1.5">
                                <span>{g.title}</span>
                                {isRedeemed && (
                                  <span className="text-[9px] bg-stone-700 text-stone-300 font-bold px-1.5 py-0.2 rounded">
                                    適用済
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-stone-400 flex items-center gap-2 mt-0.5">
                                <span className="flex items-center gap-0.5">
                                  <Calendar size={10} /> 有効期間: {g.validFrom} 〜 {g.validTo}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                id={`btn-copy-${g.code}`}
                                onClick={() => handleCopyCode(g.code)}
                                className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                                title="コードをコピー"
                              >
                                {copiedCode === g.code ? (
                                  <>
                                    <CheckCheck size={11} className="text-emerald-400" />
                                    <span className="text-emerald-400">コピー済</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={11} />
                                    <span>コピー</span>
                                  </>
                                )}
                              </button>

                              <button
                                id={`btn-test-redeem-${g.code}`}
                                onClick={() => handleTestRedeem(g.code)}
                                className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 text-[10px] font-black flex items-center gap-0.5 active:scale-95 transition-all"
                              >
                                <Sparkle size={10} />
                                <span>テスト適用</span>
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-stone-950/80 px-2.5 py-1.5 rounded-lg border border-stone-800/80 font-mono text-xs text-amber-400 font-bold">
                            <span>CODE: {g.code}</span>
                            <span className="text-[10px] text-stone-400 font-sans">{g.reward.description}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-950 px-4 py-3 border-t border-stone-800 flex justify-end">
          <button
            id="btn-close-dev-footer"
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs sm:text-sm font-black border border-stone-700 active:scale-95 transition-all"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
