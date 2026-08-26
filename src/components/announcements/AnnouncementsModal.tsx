import React, { useState } from 'react';
import { PlayerProfile } from '../../types';
import { audio } from '../../utils/audio';
import { X, Bell, Sparkles, Flame, ShieldAlert, Gift, CheckCircle2 } from 'lucide-react';

interface AnnouncementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: PlayerProfile;
  onUpdateProfile?: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
}

export const AnnouncementsModal: React.FC<AnnouncementsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'apology' | 'event' | 'update'>('all');

  if (!isOpen) return null;

  const isApologyClaimed = !!profile?.claimedApologies?.['bug_apology_750'];

  const handleClaimApology = () => {
    if (isApologyClaimed) return;
    audio.playVictory();
    if (onUpdateProfile) {
      onUpdateProfile((prev) => ({
        ...prev,
        catFood: prev.catFood + 750,
        claimedApologies: {
          ...(prev.claimedApologies || {}),
          bug_apology_750: true,
        },
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-stone-900 border-4 border-amber-500 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-white font-['M_PLUS_Rounded_1c']">
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-950 via-amber-950/80 to-stone-950 p-4 border-b-2 border-amber-500/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-stone-950 flex items-center justify-center shadow-lg">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-amber-200 tracking-wider flex items-center gap-2">
                <span>お知らせ (NEWS)</span>
                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold shadow">
                  特報
                </span>
              </h2>
              <p className="text-xs text-stone-400">最新イベント・魔界編＆真レジェンドストーリー情報</p>
            </div>
          </div>
          <button
            id="btn-close-announcements"
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 flex items-center justify-center text-stone-300 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="bg-stone-950/80 px-4 py-2 border-b border-stone-800 flex gap-2 overflow-x-auto">
          <button
            onClick={() => {
              audio.playClick();
              setSelectedCategory('all');
            }}
            className={`px-3 py-1 rounded-full text-xs font-black transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            すべて
          </button>
          <button
            onClick={() => {
              audio.playClick();
              setSelectedCategory('apology');
            }}
            className={`px-3 py-1 rounded-full text-xs font-black transition-all whitespace-nowrap ${
              selectedCategory === 'apology'
                ? 'bg-rose-600 text-white shadow ring-2 ring-rose-400'
                : 'bg-rose-950/60 text-rose-300 border border-rose-600/50 hover:bg-rose-900/60'
            }`}
          >
            🎁 不具合のお詫び (750缶)
          </button>
          <button
            onClick={() => {
              audio.playClick();
              setSelectedCategory('event');
            }}
            className={`px-3 py-1 rounded-full text-xs font-black transition-all whitespace-nowrap ${
              selectedCategory === 'event'
                ? 'bg-red-600 text-white shadow'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            🔥 特報・ストーリー
          </button>
          <button
            onClick={() => {
              audio.playClick();
              setSelectedCategory('update');
            }}
            className={`px-3 py-1 rounded-full text-xs font-black transition-all whitespace-nowrap ${
              selectedCategory === 'update'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            ✨ アップデート
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* ========================================================
              APOLOGY NOTICE SECTION (750 Cat Food Distribution)
             ======================================================== */}
          {(selectedCategory === 'all' || selectedCategory === 'apology') && (
            <div
              id="notice-bug-apology"
              className="relative rounded-2xl overflow-hidden border-2 border-rose-500 bg-gradient-to-br from-rose-950 via-stone-900 to-black p-4 sm:p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-rose-600/30 border border-rose-500 text-rose-400 flex items-center justify-center font-black shrink-0">
                    <Gift className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded font-black">
                        重要・お詫び
                      </span>
                      <span className="text-xs text-rose-300 font-mono">2026.08.26</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-rose-200">
                      多数のバグを引き起こしてしまい申し訳ございませんでした
                    </h3>
                  </div>
                </div>
              </div>

              <div className="bg-black/60 rounded-xl p-3.5 border border-rose-900/60 mb-4 text-xs sm:text-sm text-stone-200 leading-relaxed space-y-2">
                <p className="font-bold text-rose-300">
                  プレイヤーの皆様へ
                </p>
                <p>
                  この度は、大狂乱ステージでボスが出現しない不具合、第3形態のテクスチャ表示不具合、記録欄オープン時のクラッシュ、マタタビ・キャッツアイ消費判定、およびステージ分類の誤りなど、多数の不具合によりご迷惑をおかけしてしまい大変申し訳ございませんでした。
                </p>
                <p>
                  本不具合は最新アップデート（v3.8）にてすべて修正完了いたしました。
                  お詫びといたしまして、全プレイヤーの皆様へ<strong className="text-yellow-300 text-base">【ネコカン 750個】</strong>をお贈りいたします。
                </p>
              </div>

              {/* Claim Button */}
              <div className="flex items-center justify-between flex-wrap gap-3 bg-stone-950/80 rounded-xl p-3 border border-rose-500/40">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🐱🥫</span>
                  <div>
                    <div className="text-xs text-stone-400 font-bold">お詫び配布アイテム</div>
                    <div className="text-sm font-black text-yellow-300">ネコカン × 750個</div>
                  </div>
                </div>

                {isApologyClaimed ? (
                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-400 text-xs sm:text-sm font-black">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>受取済み</span>
                  </div>
                ) : (
                  <button
                    id="btn-claim-bug-apology"
                    onClick={handleClaimApology}
                    className="px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 text-stone-950 font-black text-xs sm:text-sm shadow-[0_0_15px_rgba(245,158,11,0.5),0_3px_0_#b45309] active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer animate-bounce"
                  >
                    <span>🎁</span>
                    <span>お詫びを受け取る</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              FEATURED ARTWORK: レジェンドストーリー終結 記念イラストSVG
             ======================================================== */}
          <div className="relative rounded-2xl overflow-hidden border-3 border-yellow-500/80 shadow-2xl bg-gradient-to-b from-amber-950 via-stone-900 to-black">
            {/* SVG Artwork: Legend Story Finale */}
            <div className="relative w-full aspect-[21/9] min-h-[220px] sm:min-h-[260px] overflow-hidden">
              <svg
                viewBox="0 0 800 340"
                className="w-full h-full"
                preserveAspectRatio="xMidYMid slice"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Sky Gradient */}
                  <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1a0904" />
                    <stop offset="35%" stopColor="#4a1508" />
                    <stop offset="70%" stopColor="#8c2e0b" />
                    <stop offset="90%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#fef08a" />
                  </linearGradient>

                  {/* Sun Glow */}
                  <radialGradient id="sunGlow" cx="50%" cy="60%" r="50%">
                    <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
                    <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.8" />
                    <stop offset="80%" stopColor="#dc2626" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#450a0a" stopOpacity="0" />
                  </radialGradient>

                  {/* Mist/Fog Gradient */}
                  <linearGradient id="mistGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d97706" stopOpacity="0" />
                    <stop offset="100%" stopColor="#1c1917" stopOpacity="0.9" />
                  </linearGradient>
                </defs>

                {/* Sky Background */}
                <rect width="800" height="340" fill="url(#skyGrad)" />

                {/* Giant Setting Sun / Ancient Core */}
                <circle cx="400" cy="180" r="160" fill="url(#sunGlow)" />
                <circle cx="400" cy="180" r="45" fill="#fef08a" opacity="0.9" filter="drop-shadow(0 0 20px #f59e0b)" />

                {/* Distant Ancient Ruins & Collapsing Temples */}
                <path
                  d="M 50 240 L 90 160 L 140 160 L 150 240 L 220 240 L 250 140 L 300 140 L 310 180 L 340 130 L 380 130 L 400 240 Z"
                  fill="#290f05"
                  opacity="0.7"
                />
                <path
                  d="M 450 240 L 480 120 L 530 120 L 550 240 L 610 240 L 640 150 L 690 150 L 710 240 L 780 240 Z"
                  fill="#290f05"
                  opacity="0.7"
                />

                {/* Legend Bun Bun Huge Shadowy Wings & Horns Silhouette in Distance */}
                <g transform="translate(400, 160)" opacity="0.45">
                  <path
                    d="M 0 -70 C -40 -110, -110 -130, -180 -100 C -150 -60, -90 -40, -50 -30 C -90 10, -130 50, -140 110 C -90 80, -40 40, 0 20 C 40 40, 90 80, 140 110 C 130 50, 90 10, 50 -30 C 90 -40, 150 -60, 180 -100 C 110 -130, 40 -110, 0 -70 Z"
                    fill="#180702"
                  />
                  {/* Glowing Ancient Eyes */}
                  <circle cx="-25" cy="-25" r="4" fill="#fbbf24" filter="drop-shadow(0 0 6px #f59e0b)" />
                  <circle cx="25" cy="-25" r="4" fill="#fbbf24" filter="drop-shadow(0 0 6px #f59e0b)" />
                </g>

                {/* Midground Broken Mountain Crags (荒廃した大地) */}
                <polygon
                  points="0,340 0,260 80,220 140,250 210,210 320,270 410,230 520,280 620,220 710,260 800,210 800,340"
                  fill="#1c0d06"
                />
                <polygon
                  points="0,340 0,285 110,260 190,290 280,250 370,300 480,260 580,310 690,265 800,295 800,340"
                  fill="#0c0704"
                />

                {/* Foreground Cliff & Rubble Silhouette (下が荒れた岩場・残骸) */}
                <path
                  d="M 0 340 L 0 300 L 40 295 L 70 310 L 120 290 L 160 305 L 220 285 L 270 315 L 340 290 L 410 320 L 480 295 L 560 315 L 630 288 L 700 310 L 760 292 L 800 305 L 800 340 Z"
                  fill="#050302"
                />

                {/* Victorious Cats Standing on the Rugged Cliff in Silhouette */}
                {/* 1. Basic Cat */}
                <g transform="translate(380, 270) scale(0.9)">
                  <circle cx="0" cy="0" r="16" fill="#f8fafc" stroke="#000" strokeWidth="2.5" />
                  <polygon points="-12,-12 -6,-22 0,-14" fill="#f8fafc" stroke="#000" strokeWidth="2" />
                  <polygon points="12,-12 6,-22 0,-14" fill="#f8fafc" stroke="#000" strokeWidth="2" />
                  <circle cx="-5" cy="-2" r="2" fill="#000" />
                  <circle cx="5" cy="-2" r="2" fill="#000" />
                  <path d="M -3 3 Q 0 6 3 3" fill="none" stroke="#000" strokeWidth="1.5" />
                </g>

                {/* 2. Tank Cat */}
                <g transform="translate(340, 260) scale(0.9)">
                  <rect x="-14" y="-28" width="28" height="40" rx="8" fill="#f8fafc" stroke="#000" strokeWidth="2.5" />
                  <polygon points="-10,-28 -5,-36 0,-28" fill="#f8fafc" stroke="#000" strokeWidth="2" />
                  <polygon points="10,-28 5,-36 0,-28" fill="#f8fafc" stroke="#000" strokeWidth="2" />
                  <circle cx="-5" cy="-14" r="2" fill="#000" />
                  <circle cx="5" cy="-14" r="2" fill="#000" />
                </g>

                {/* 3. Mythical Ururun Wolf Silhouette with Cat riding */}
                <g transform="translate(450, 255) scale(0.85)">
                  {/* Wolf silhouette */}
                  <path
                    d="M -35 20 C -25 -10, 0 -20, 25 -10 C 45 -5, 55 10, 60 25 L 50 35 L -30 35 Z"
                    fill="#334155"
                    stroke="#000"
                    strokeWidth="2"
                  />
                  {/* Wolf head & ears */}
                  <polygon points="40,0 65,-15 50,10" fill="#334155" stroke="#000" strokeWidth="2" />
                  {/* Cat Rider */}
                  <circle cx="10" cy="-22" r="13" fill="#f8fafc" stroke="#000" strokeWidth="2" />
                  <polygon points="2,-32 6,-40 12,-33" fill="#f8fafc" stroke="#000" strokeWidth="1.5" />
                  <polygon points="14,-33 18,-40 22,-32" fill="#f8fafc" stroke="#000" strokeWidth="1.5" />
                </g>

                {/* 4. Giant Staff / Ancient Spear Planted in Rock */}
                <g transform="translate(290, 250)">
                  <line x1="0" y1="40" x2="0" y2="-50" stroke="#f59e0b" strokeWidth="4" />
                  <circle cx="0" cy="-55" r="8" fill="#ef4444" stroke="#f59e0b" strokeWidth="2" />
                  {/* Tattered Banner */}
                  <path d="M 0 -48 L 45 -35 L 0 -22 Z" fill="#b91c1c" opacity="0.9" />
                </g>

                {/* Floating Embers / Sparks */}
                {Array.from({ length: 25 }).map((_, i) => (
                  <circle
                    key={i}
                    cx={(i * 37) % 800}
                    cy={150 + ((i * 23) % 150)}
                    r={(i % 3) + 1}
                    fill={i % 2 === 0 ? '#fde047' : '#f97316'}
                    opacity={0.7}
                  />
                ))}

                {/* Dramatic Calligraphic Style Text: レジェンドストーリー 終結 */}
                <g transform="translate(400, 75)">
                  {/* Japanese Calligraphy Main Banner */}
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    fill="#fef08a"
                    stroke="#451a03"
                    strokeWidth="8"
                    paintOrder="stroke fill"
                    fontSize="36"
                    fontWeight="900"
                    letterSpacing="6"
                    style={{
                      fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif',
                      filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.9))',
                    }}
                  >
                    レジェンドストーリー
                  </text>
                  <text
                    x="0"
                    y="46"
                    textAnchor="middle"
                    fill="#fbbf24"
                    stroke="#7f1d1d"
                    strokeWidth="10"
                    paintOrder="stroke fill"
                    fontSize="48"
                    fontWeight="900"
                    letterSpacing="12"
                    style={{
                      fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif',
                      filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.95))',
                    }}
                  >
                    終　結
                  </text>
                </g>

                {/* Subtitle Badge */}
                <g transform="translate(400, 142)">
                  <rect x="-130" y="-12" width="260" height="24" rx="12" fill="#000000" opacity="0.75" />
                  <text
                    x="0"
                    y="5"
                    textAnchor="middle"
                    fill="#fed7aa"
                    fontSize="12"
                    fontWeight="bold"
                    letterSpacing="2"
                  >
                    古代の記憶、そして真の伝説へ――
                  </text>
                </g>
              </svg>
            </div>

            {/* Banner Description Bar */}
            <div className="p-4 bg-gradient-to-r from-stone-950 via-amber-950/60 to-stone-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-amber-500/40">
              <div>
                <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider">
                  伝説の完結 ＆ 新章開幕
                </span>
                <h3 className="text-base font-black text-amber-100">
                  全49章「レジェンドストーリー」堂々終結！
                </h3>
              </div>
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full font-bold self-start sm:self-auto">
                2026.08.24 RELEASE
              </span>
            </div>
          </div>

          {/* ========================================================
              NEWS ITEM 1: 真・レジェンドストーリー始動
             ======================================================== */}
          <div className="bg-stone-950 border-2 border-emerald-500/70 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center font-black">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-black">
                    新ストーリー
                  </span>
                  <span className="text-xs text-stone-400 font-bold">全5章追加実装</span>
                </div>
                <h4 className="text-base font-black text-emerald-300">
                  『真・レジェンドストーリー』始動！ 古代種猛威！
                </h4>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mb-3">
              古代研究所を突破した先、原始の記憶が蘇る「真・レジェンドストーリー」が遂に開幕！
              超俊足の古代リス「オールド・リー」、空の支配者「古我王」、そして古代の呪いを放つ古代種たちが立ち塞がる！
              昔の敵たちも超強化倍率で押し寄せる超絶難易度に挑め！
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-stone-900 border border-emerald-500/40 rounded-xl p-2">
                <div className="text-emerald-400 font-black">第1章</div>
                <div className="text-[11px] text-stone-300 truncate">はじまりの場所</div>
              </div>
              <div className="bg-stone-900 border border-emerald-500/40 rounded-xl p-2">
                <div className="text-emerald-400 font-black">第2章</div>
                <div className="text-[11px] text-stone-300 truncate">原始の息吹</div>
              </div>
              <div className="bg-stone-900 border border-emerald-500/40 rounded-xl p-2">
                <div className="text-emerald-400 font-black">第3章</div>
                <div className="text-[11px] text-stone-300 truncate">古代の神殿</div>
              </div>
              <div className="bg-stone-900 border border-emerald-500/40 rounded-xl p-2">
                <div className="text-emerald-400 font-black">第4〜5章</div>
                <div className="text-[11px] text-stone-300 truncate">古神覚醒</div>
              </div>
            </div>
          </div>

          {/* ========================================================
              NEWS ITEM 2: 魔界編 解放！ 悪魔軍団＆ヘルゴリラー
             ======================================================== */}
          <div className="bg-stone-950 border-2 border-red-500/70 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500 text-red-400 flex items-center justify-center font-black">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-black">
                    新属性
                  </span>
                  <span className="text-xs text-stone-400 font-bold">悪魔属性 & シールド</span>
                </div>
                <h4 className="text-base font-black text-red-300">
                  『魔界編』解放！ 悪魔シールド＆ヘルゴリラー登場！
                </h4>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mb-3">
              ダメージを無効化・肩代わりする超耐久「悪魔シールド」を持つ悪魔の敵が登場！
              50%の確率で攻撃力3倍の渾身の一撃を叩き込む「ヘルゴリラー」、
              古代リスの5倍のスピードで突撃する悪魔リス「デビル・ワン」、
              撃破時に死の烈波を放つ「ギルティ・ペン」など、凶悪な悪魔たちを浄化せよ！
            </p>

            <div className="flex flex-wrap gap-2 text-[11px] font-bold">
              <span className="bg-purple-950/80 border border-purple-500 text-purple-200 px-2.5 py-1 rounded-lg">
                😈 悪魔シールド
              </span>
              <span className="bg-red-950/80 border border-red-500 text-red-200 px-2.5 py-1 rounded-lg">
                💥 渾身の一撃 (3倍撃)
              </span>
              <span className="bg-indigo-950/80 border border-indigo-500 text-indigo-200 px-2.5 py-1 rounded-lg">
                ⚡ 遺志の烈波
              </span>
            </div>
          </div>

          {/* ========================================================
              NEWS ITEM 3: 降臨ボス エンシェントサイクロン降臨
             ======================================================== */}
          <div className="bg-stone-950 border-2 border-amber-500/70 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500 text-amber-400 flex items-center justify-center font-black">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded font-black">
                    超極ムズ降臨
                  </span>
                </div>
                <h4 className="text-base font-black text-amber-300">
                  降臨ボス『エンシェントサイクロン』襲来！
                </h4>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              足が超高速で攻撃力も鬼高く、体力も破格の「エンシェントサイクロン」が降臨ステージに登場！
              古代の呪いと連続攻撃の前に並大抵のにゃんこでは太刀打ちできない！
              古代種対策キャラを育成して立ち向かえ！
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-950 p-4 border-t border-stone-800 flex justify-end">
          <button
            id="btn-announcements-confirm"
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-stone-950 font-black text-sm shadow-lg active:scale-95 transition-all"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
