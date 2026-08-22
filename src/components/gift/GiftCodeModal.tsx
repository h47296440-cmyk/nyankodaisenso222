import React, { useState } from 'react';
import { PlayerProfile } from '../../types';
import { redeemGiftCode } from '../../data/giftCodes';
import { audio } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Gift, X, Check, Sparkles, AlertCircle, Clock, Zap, Cat, Award } from 'lucide-react';

interface GiftCodeModalProps {
  isOpen: boolean;
  profile: PlayerProfile;
  onClose: () => void;
  onUpdateProfile: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
}

export const GiftCodeModal: React.FC<GiftCodeModalProps> = ({
  isOpen,
  profile,
  onClose,
  onUpdateProfile,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const handleRedeem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputCode.trim().toUpperCase();
    if (!trimmed) {
      setStatusMessage({ text: 'プレゼントコードを入力してください', isError: true });
      audio.playHit(false, true);
      return;
    }

    const result = redeemGiftCode(trimmed, profile);

    if (result.success && result.updatedProfile) {
      audio.playVictory();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      onUpdateProfile(() => result.updatedProfile!);
      setStatusMessage({ text: result.message, isError: false });
      setInputCode('');
    } else {
      audio.playHit(false, true);
      setStatusMessage({ text: result.message, isError: true });
    }
  };

  const isInfiniteActive = profile.infiniteEnergyUntil && profile.infiniteEnergyUntil > Date.now();

  return (
    <div
      id="gift-code-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="gift-code-modal-card"
        className="w-full max-w-md bg-stone-900 border-2 border-amber-500/60 rounded-2xl shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 px-4 py-3.5 flex items-center justify-between border-b border-amber-400/40 text-stone-950">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/40 shadow-inner">
              <Gift size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide drop-shadow-md">
                プレゼントコード入力
              </h2>
              <p className="text-[10px] text-amber-100 font-bold">公式コードを入力して限定特典をGET！</p>
            </div>
          </div>

          <button
            id="btn-close-gift-code-modal"
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-all active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Active Buff Info */}
          {isInfiniteActive && (
            <div className="bg-cyan-950/70 border border-cyan-500/50 p-3 rounded-xl flex items-center justify-between text-xs text-cyan-300 shadow-md">
              <div className="flex items-center gap-2 font-bold">
                <Zap size={16} className="text-cyan-400 animate-pulse" />
                <span>統率力24時間完全無限 発動中！</span>
              </div>
              <span className="text-[10px] font-mono bg-cyan-900/60 px-2 py-0.5 rounded border border-cyan-500/30">
                〜{new Date(profile.infiniteEnergyUntil!).toLocaleDateString('ja-JP')}
              </span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRedeem} className="space-y-3">
            <div>
              <label htmlFor="gift-code-input" className="text-xs font-black text-stone-300 block mb-1.5">
                シリアルコードを入力 (大文字・小文字不問)
              </label>
              <div className="relative">
                <input
                  id="gift-code-input"
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="シリアルコードを入力"
                  maxLength={20}
                  className="w-full bg-stone-950 border-2 border-stone-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm sm:text-base font-mono font-bold text-amber-300 tracking-wider placeholder:text-stone-600 focus:outline-none transition-colors"
                />
                {inputCode && (
                  <button
                    type="button"
                    onClick={() => setInputCode('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 text-xs"
                  >
                    クリア
                  </button>
                )}
              </div>
            </div>

            {/* Status Feedback */}
            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-bold whitespace-pre-line flex items-start gap-2 animate-fade-in ${
                  statusMessage.isError
                    ? 'bg-rose-950/60 border border-rose-500/50 text-rose-300'
                    : 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                }`}
              >
                {statusMessage.isError ? (
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                ) : (
                  <Check size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <button
              id="btn-submit-gift-code"
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-sm border-2 border-yellow-200 shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              <span>コードを送信して受け取る</span>
            </button>
          </form>

          {/* Code Information Notice */}
          <div className="bg-stone-950/60 p-3 rounded-xl border border-stone-800 text-[11px] text-stone-400 space-y-1">
            <div className="font-bold text-stone-300 flex items-center gap-1">
              <Clock size={12} className="text-amber-400" /> プレゼントコードについての注意事項
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-stone-400 text-[10px]">
              <li>各プレゼントコードは1プレイヤーアカウントにつき1回のみ使用可能です。</li>
              <li>期間限定コードは指定の有効期限内のみ受け取り可能です。</li>
              <li>開発者限定コードは開発者画面（パスコード認証後）にて確認できます。</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-950 px-4 py-3 border-t border-stone-800 flex justify-end">
          <button
            id="btn-close-gift-footer"
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
