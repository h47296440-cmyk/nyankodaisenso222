import React, { useState } from 'react';
import { PlayerProfile } from '../../types';
import { calculateUserRank } from '../../utils/storage';
import { audio } from '../../utils/audio';

interface CatBaseScreenProps {
  profile: PlayerProfile;
  onStartBattle: () => void;
  onOpenPowerUp: () => void;
  onOpenDeckFormation: () => void;
  onOpenPvp?: () => void;
  onOpenGacha: () => void;
  onOpenTreasures: () => void;
  onOpenEncyclopedia: () => void;
  onOpenItemShop: () => void;
  onOpenUserRankRewards: () => void;
  onOpenGamatoto: () => void;
  onOpenStorage: () => void;
  onOpenMissions: () => void;
  onOpenGiftCode: () => void;
  onOpenMenu: () => void;
  onBackToTitle: () => void;
}

const CAT_TIPS = [
  'アイテムのネコボンを使えば働きネコのレベルが最大の状態でステージを開始できるにゃ！詰まっているステージがあれば使ってみるといいにゃ！',
  'ユーザーランクは全キャラとお城強化の合計レベルだにゃ！たくさんパワーアップして報酬をもらうにゃ！',
  '壁役の「ネコ」や「タンクネコ」を連続生産して前線を維持するのが基本戦術だにゃ！',
  'エリザベスの鼻息から放たれる「波動」は前線を貫通して後衛まで吹き飛ばすから注意するにゃ！',
  'ボスが出現するときは強力な衝撃波で味方全員が押し戻されるにゃ！お城の前で待ち受けるのも手だにゃ！',
  '赤い敵には「バトルネコ」、浮いてる敵には「ネコノトリ」が超強力にゃ！',
  'にゃんこ砲は敵の攻撃タイミングに合わせて撃つと攻撃をキャンセルできるにゃ！',
  '各ステージの「最高のお宝」を集めると、にゃんこ軍団が劇的にパワーアップするにゃ！',
];

export const CatBaseScreen: React.FC<CatBaseScreenProps> = ({
  profile,
  onStartBattle,
  onOpenPowerUp,
  onOpenDeckFormation,
  onOpenPvp,
  onOpenGacha,
  onOpenTreasures,
  onOpenEncyclopedia,
  onOpenItemShop,
  onOpenUserRankRewards,
  onOpenGamatoto,
  onOpenStorage,
  onOpenMissions,
  onOpenGiftCode,
  onOpenMenu,
  onBackToTitle,
}) => {
  const [tipIndex, setTipIndex] = useState(0);
  const [isCatClicked, setIsCatClicked] = useState(false);

  const userRank = calculateUserRank(profile);
  const isInfiniteXp = !!profile.devMode?.infiniteXp;
  const isInfiniteCatFood = !!profile.devMode?.infiniteCatFood;

  const displayXp = isInfiniteXp ? 99999999 : profile.xp;
  const displayCatFood = isInfiniteCatFood ? 99999 : profile.catFood;

  const handleCatClick = () => {
    audio.playCatSpawn(1.2);
    setIsCatClicked(true);
    setTimeout(() => setIsCatClicked(false), 300);
    setTipIndex((prev) => (prev + 1) % CAT_TIPS.length);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden select-none bg-stone-900 font-sans">
      {/* ========================================================
          BACKGROUND: Traditional Green Karasuka Sliding Doors (襖)
         ======================================================== */}
      <div className="absolute inset-0 z-0 bg-[#284a3c] overflow-hidden">
        {/* Karasuka / Scroll Wave Traditional Japanese Pattern SVG */}
        <svg className="w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="karakusaPattern" width="120" height="120" patternUnits="userSpaceOnUse">
              <path
                d="M 60 0 C 40 20, 20 20, 20 40 C 20 60, 40 60, 40 80 C 40 100, 20 100, 0 120 M 60 120 C 80 100, 100 100, 100 80 C 100 60, 80 60, 80 40 C 80 20, 100 20, 120 0 M 0 60 C 20 40, 20 20, 40 20 C 60 20, 60 40, 80 40 C 100 40, 100 20, 120 20"
                fill="none"
                stroke="#4e7c69"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <circle cx="20" cy="40" r="6" fill="#4e7c69" />
              <circle cx="80" cy="40" r="6" fill="#4e7c69" />
              <circle cx="40" cy="80" r="6" fill="#4e7c69" />
              <circle cx="100" cy="80" r="6" fill="#4e7c69" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#karakusaPattern)" />
        </svg>

        {/* Traditional Sliding Door Center Seam */}
        <div className="absolute top-0 bottom-0 left-[48%] w-4 bg-[#14231c] shadow-2xl border-x border-[#0e1914] flex flex-col justify-around items-center">
          {/* Metallic Door Pull Ornament with Cat Paw Print (引き手金具) */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-stone-600 via-stone-800 to-stone-950 border-2 border-stone-500 shadow-inner flex items-center justify-center -ml-3 cursor-pointer hover:scale-105 transition-transform">
            <div className="w-6 h-6 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center">
              {/* Paw Relief */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#a8a29e">
                <ellipse cx="12" cy="15" rx="5" ry="4" />
                <circle cx="6" cy="9" r="2.2" />
                <circle cx="10" cy="6" r="2.2" />
                <circle cx="14" cy="6" r="2.2" />
                <circle cx="18" cy="9" r="2.2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Ambient Top & Bottom Wood Shadows */}
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
      </div>

      {/* ========================================================
          TOP HEADER BAR
         ======================================================== */}
      <div className="relative z-20 w-full bg-gradient-to-b from-[#8a4e1d] via-[#63330f] to-[#432007] border-b-[3px] border-[#291102] px-3 sm:px-6 py-1.5 flex items-center justify-between shadow-lg">
        {/* Title: ネコ基地 */}
        <div className="flex items-center gap-2">
          <h1
            className="text-2xl sm:text-3xl font-black text-amber-100 tracking-wider"
            style={{
              fontFamily: '"Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
              textShadow:
                '3px 3px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000, 0px 4px 6px rgba(0,0,0,0.8)',
            }}
          >
            ネコ基地
          </h1>
        </div>

        {/* Right Info: Promo Banner & XP Counter */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Platinum Ticket Promo Badge */}
          <div className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-pink-600 to-rose-700 border-2 border-pink-300 px-2.5 py-0.5 rounded-full shadow-md text-white text-[11px] font-black">
            <span className="bg-yellow-300 text-pink-900 text-[9px] px-1 py-0.2 rounded font-extrabold">いまだけ!!</span>
            <span>期間限定★プラチナチケット</span>
            <span className="bg-black/40 text-yellow-300 text-[9px] px-1 rounded">のこり 2日</span>
          </div>

          {/* 経験値 XP Counter */}
          <div className="flex items-center bg-black/70 border-2 border-amber-800/80 rounded-lg px-2.5 py-0.5 shadow-inner">
            <span className="text-stone-300 text-[10px] sm:text-xs font-black mr-1">経験値</span>
            <span className="text-cyan-400 font-black text-xs sm:text-sm mr-1 tracking-tighter">XP+</span>
            <span
              className="text-amber-400 font-black text-base sm:text-lg tracking-widest"
              style={{
                fontFamily: '"Courier New", Courier, monospace',
                textShadow: '1px 1px 0px #000, -1px -1px 0px #000',
              }}
            >
              {displayXp.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          MAIN BODY AREA
         ======================================================== */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-3 sm:p-6">
        {/* TOP ROW: User Rank Plaque & Quick Status */}
        <div className="flex items-start justify-between">
          {/* ユーザーランク Plaque (Level Sum) */}
          <div
            id="btn-user-rank"
            onClick={() => {
              audio.playClick();
              onOpenUserRankRewards();
            }}
            className="group flex items-center bg-gradient-to-r from-[#5a3212] to-[#381c07] border-2 border-amber-500/80 rounded-xl p-1 sm:p-1.5 shadow-2xl cursor-pointer hover:scale-105 transition-transform"
          >
            {/* Left label capsule */}
            <div className="bg-[#1f1005] border border-amber-600/60 rounded-lg px-2 py-0.5 flex flex-col items-center justify-center mr-1.5">
              <span className="text-[10px] font-black text-amber-200 leading-tight">ユーザー</span>
              <span className="text-[11px] font-black text-amber-100 leading-tight">ランク</span>
            </div>

            {/* User Rank Digital Number */}
            <div className="bg-black/85 border border-amber-700/80 rounded-md px-3 py-0.5 mx-1 flex items-center justify-center">
              <span
                className="text-yellow-400 text-lg sm:text-2xl font-black tracking-wider"
                style={{
                  fontFamily: '"Courier New", Courier, monospace',
                  textShadow: '2px 2px 0px #000, -1px -1px 0px #000',
                }}
              >
                {userRank}
              </span>
            </div>

            {/* Info (i) Icon */}
            <div className="w-5 h-5 rounded-full bg-amber-500 text-[#1f1005] font-black text-[11px] flex items-center justify-center ml-1 shadow">
              i
            </div>

            {/* Scroll Certificate with Red Stamp */}
            <div className="ml-1.5 bg-amber-100 border border-amber-800 rounded px-1 py-0.5 flex items-center shadow">
              <div className="w-4 h-5 bg-stone-100 border-x border-amber-800 relative flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full border border-rose-600 bg-rose-600/20 flex items-center justify-center">
                  <span className="text-[6px] text-rose-600 font-black">済</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER CONTENT: Left Menu 3D Buttons & Right Mascot Cat with Speech Bubble */}
        <div className="flex-1 flex flex-col md:flex-row items-center md:items-end justify-between gap-4 mt-2 mb-2">
          {/* LEFT 3D GOLDEN MENU BUTTONS */}
          <div className="flex flex-col gap-3 w-full max-w-[280px] sm:max-w-[320px]">
            {/* 1. 戦闘開始!! */}
            <button
              id="btn-cat-base-battle"
              onClick={() => {
                audio.playClick();
                onStartBattle();
              }}
              className="group relative w-full h-14 sm:h-16 rounded-2xl bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-500 border-[3.5px] border-[#1f1005] shadow-[0_6px_0_#6c3905,0_10px_12px_rgba(0,0,0,0.6)] active:translate-y-1 active:shadow-[0_2px_0_#6c3905] transition-all flex items-center justify-center cursor-pointer hover:brightness-110"
            >
              <div className="absolute inset-x-2 top-1 h-3 rounded-t-xl bg-white/40 pointer-events-none" />
              <span
                className="text-2xl sm:text-3xl font-black text-[#150a02] tracking-wider"
                style={{
                  fontFamily: '"Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
                  textShadow: '0 1px 1px rgba(255,255,255,0.7)',
                }}
              >
                戦闘開始!!
              </span>
            </button>

            {/* 2. パワーアップ */}
            <button
              id="btn-cat-base-upgrade"
              onClick={() => {
                audio.playClick();
                onOpenPowerUp();
              }}
              className="group relative w-full h-13 sm:h-15 rounded-2xl bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-500 border-[3.5px] border-[#1f1005] shadow-[0_6px_0_#6c3905,0_10px_12px_rgba(0,0,0,0.6)] active:translate-y-1 active:shadow-[0_2px_0_#6c3905] transition-all flex items-center justify-center cursor-pointer hover:brightness-110"
            >
              <div className="absolute inset-x-2 top-1 h-3 rounded-t-xl bg-white/40 pointer-events-none" />
              <span
                className="text-xl sm:text-2xl font-black text-[#150a02] tracking-wider"
                style={{
                  fontFamily: '"Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
                  textShadow: '0 1px 1px rgba(255,255,255,0.7)',
                }}
              >
                パワーアップ
              </span>
            </button>

            {/* 3. キャラクター編成 */}
            <button
              id="btn-cat-base-formation"
              onClick={() => {
                audio.playClick();
                onOpenDeckFormation();
              }}
              className="group relative w-full h-13 sm:h-15 rounded-2xl bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-500 border-[3.5px] border-[#1f1005] shadow-[0_6px_0_#6c3905,0_10px_12px_rgba(0,0,0,0.6)] active:translate-y-1 active:shadow-[0_2px_0_#6c3905] transition-all flex items-center justify-center cursor-pointer hover:brightness-110"
            >
              <div className="absolute inset-x-2 top-1 h-3 rounded-t-xl bg-white/40 pointer-events-none" />
              <span
                className="text-lg sm:text-xl font-black text-[#150a02] tracking-wider"
                style={{
                  fontFamily: '"Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
                  textShadow: '0 1px 1px rgba(255,255,255,0.7)',
                }}
              >
                キャラクター編成
              </span>
            </button>

            {/* Bottom-Left Quick Icons: メニュー, ミッション, プレゼント, ガマトト, ネコ道場 */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-1.5">
              {/* メニュー (Menu) with Orange '!' badge */}
              <button
                id="btn-sub-menu"
                onClick={() => {
                  audio.playClick();
                  onOpenMenu();
                }}
                className="relative flex flex-col items-center justify-center p-0.5 hover:scale-110 transition-transform group"
              >
                <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-b from-stone-100 to-stone-300 border-2 border-stone-800 shadow-md flex items-center justify-center">
                  <span className="text-xl sm:text-2xl">📖</span>
                  {/* Orange '!' badge */}
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-orange-500 border-2 border-white text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                    !
                  </div>
                </div>
                <span className="text-[9px] sm:text-[10px] font-black text-amber-100 tracking-tighter mt-0.5 drop-shadow">
                  メニュー
                </span>
              </button>

              {/* ミッション (Missions) */}
              <button
                id="btn-sub-missions"
                onClick={() => {
                  audio.playClick();
                  onOpenMissions();
                }}
                className="relative flex flex-col items-center justify-center p-0.5 hover:scale-110 transition-transform group"
              >
                <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-b from-yellow-100 to-amber-200 border-2 border-amber-800 shadow-md flex items-center justify-center">
                  <span className="text-xl sm:text-2xl animate-pulse">🎯</span>
                  <div className="absolute -top-1.5 -right-1.5 px-1 py-0.2 rounded-full bg-red-600 border border-white text-white text-[8px] font-black shadow">
                    報酬
                  </div>
                </div>
                <span className="text-[9px] sm:text-[10px] font-black text-amber-100 tracking-tighter mt-0.5 drop-shadow">
                  ミッション
                </span>
              </button>

              {/* プレゼントコード (Gift Code) */}
              <button
                id="btn-sub-gift"
                onClick={() => {
                  audio.playClick();
                  onOpenGiftCode();
                }}
                className="relative flex flex-col items-center justify-center p-0.5 hover:scale-110 transition-transform group"
              >
                <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-b from-pink-100 to-rose-200 border-2 border-rose-800 shadow-md flex items-center justify-center">
                  <span className="text-xl sm:text-2xl">🎁</span>
                  <div className="absolute -top-1.5 -right-1.5 px-1 py-0.2 rounded-full bg-pink-600 border border-white text-white text-[8px] font-black shadow">
                    配布
                  </div>
                </div>
                <span className="text-[9px] sm:text-[10px] font-black text-amber-100 tracking-tighter mt-0.5 drop-shadow">
                  コード
                </span>
              </button>

              {/* ガマトト (Gamatoto Expedition) */}
              <button
                id="btn-sub-gamatoto"
                onClick={() => {
                  audio.playClick();
                  onOpenGamatoto();
                }}
                className="relative flex flex-col items-center justify-center p-0.5 hover:scale-110 transition-transform group"
              >
                <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-b from-stone-100 to-stone-300 border-2 border-stone-800 shadow-md flex items-center justify-center">
                  <span className="text-xl sm:text-2xl">⛏️</span>
                </div>
                <span className="text-[9px] sm:text-[10px] font-black text-amber-100 tracking-tighter mt-0.5 drop-shadow">
                  ガマトト
                </span>
              </button>

              {/* ネコ道場 / 図鑑 / お宝 (Cat Dojo) */}
              <button
                id="btn-sub-dojo"
                onClick={() => {
                  audio.playClick();
                  onOpenEncyclopedia();
                }}
                className="relative flex flex-col items-center justify-center p-0.5 hover:scale-110 transition-transform group"
              >
                <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-b from-stone-100 to-stone-300 border-2 border-stone-800 shadow-md flex items-center justify-center">
                  <span className="text-xl sm:text-2xl">⛩️</span>
                </div>
                <span className="text-[9px] sm:text-[10px] font-black text-amber-100 tracking-tighter mt-0.5 drop-shadow">
                  図鑑
                </span>
              </button>

              {/* P2P 対戦 (PvP) */}
              {onOpenPvp && (
                <button
                  id="btn-sub-pvp"
                  onClick={() => {
                    audio.playClick();
                    onOpenPvp();
                  }}
                  className="relative flex flex-col items-center justify-center p-0.5 hover:scale-110 transition-transform group"
                >
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-b from-red-500 to-amber-600 border-2 border-yellow-300 shadow-md flex items-center justify-center animate-pulse">
                    <span className="text-xl sm:text-2xl">⚔️</span>
                    <div className="absolute -top-1.5 -right-1.5 px-1 py-0.2 rounded-full bg-red-700 border border-yellow-200 text-yellow-200 text-[8px] font-black shadow">
                      P2P
                    </div>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-black text-yellow-300 tracking-tighter mt-0.5 drop-shadow">
                    対戦
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: Speech Bubble & Giant Mascot Cat */}
          <div className="flex-1 flex flex-col md:flex-row items-center md:items-end justify-end max-w-[620px]">
            {/* Speech Bubble */}
            <div
              onClick={handleCatClick}
              className="relative bg-stone-850/95 border-[2.5px] border-stone-300 rounded-3xl p-4 sm:p-5 shadow-2xl max-w-[420px] cursor-pointer hover:border-amber-400 transition-colors mb-2 md:mb-12"
            >
              {/* Pointer Triangle */}
              <div className="hidden md:block absolute -right-3.5 bottom-10 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[14px] border-l-stone-300" />
              <div className="hidden md:block absolute -right-2 bottom-10.5 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-stone-850" />

              <p className="text-white text-sm sm:text-base font-bold leading-relaxed tracking-wide">
                {CAT_TIPS[tipIndex]}
              </p>
              <div className="mt-2 text-right text-[10px] text-stone-400 font-bold">
                （タップで次のヒントを聞くにゃ）
              </div>
            </div>

            {/* Giant Mascot Cat Head */}
            <div
              onClick={handleCatClick}
              className={`relative cursor-pointer transition-transform duration-200 ${
                isCatClicked ? 'scale-110 -rotate-3' : 'hover:scale-105'
              }`}
            >
              <svg width="220" height="200" viewBox="0 0 220 200" className="drop-shadow-2xl">
                {/* Ears */}
                <polygon points="50,75 65,15 105,60" fill="#ffffff" stroke="#000000" strokeWidth="9" strokeLinejoin="round" />
                <polygon points="125,60 165,15 180,75" fill="#ffffff" stroke="#000000" strokeWidth="9" strokeLinejoin="round" />
                {/* Giant Head */}
                <ellipse cx="115" cy="115" rx="85" ry="80" fill="#ffffff" stroke="#000000" strokeWidth="9" />
                {/* Big Oval Eyes */}
                <ellipse cx="80" cy="95" rx="10" ry="12" fill="#000000" />
                <ellipse cx="150" cy="95" rx="10" ry="12" fill="#000000" />
                {/* Nose line & W-shaped mouth */}
                <path
                  d="M 115 102 L 115 116 M 92 116 Q 104 130 115 116 Q 126 130 138 116"
                  fill="none"
                  stroke="#000000"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Open tongue smiling mouth */}
                <path
                  d="M 103 121 Q 115 145 127 121 Z"
                  fill="#fb7185"
                  stroke="#000000"
                  strokeWidth="6"
                  strokeLinejoin="round"
                />
                {/* Whiskers */}
                <line x1="30" y1="105" x2="65" y2="112" stroke="#000000" strokeWidth="7" strokeLinecap="round" />
                <line x1="30" y1="126" x2="65" y2="124" stroke="#000000" strokeWidth="7" strokeLinecap="round" />
                <line x1="200" y1="105" x2="165" y2="112" stroke="#000000" strokeWidth="7" strokeLinecap="round" />
                <line x1="200" y1="126" x2="165" y2="124" stroke="#000000" strokeWidth="7" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* BOTTOM CENTER: Wooden Gacha & Storage Counter */}
        <div className="flex items-center justify-center my-1">
          <div className="bg-gradient-to-b from-[#8a4e1d] to-[#432007] border-2 border-amber-900 rounded-2xl px-4 py-1.5 shadow-2xl flex items-center gap-4 sm:gap-6">
            {/* 貯蔵庫 (Storage / Refrigerator) */}
            <button
              id="btn-storage"
              onClick={() => {
                audio.playClick();
                onOpenStorage();
              }}
              className="flex flex-col items-center justify-center hover:scale-110 transition-transform cursor-pointer"
            >
              <div className="w-10 h-10 bg-stone-100 border-2 border-stone-800 rounded-lg flex items-center justify-center shadow">
                <span className="text-xl">🧊</span>
              </div>
              <span className="text-[10px] font-black text-amber-200 mt-0.5">貯蔵庫</span>
            </button>

            {/* にゃんこガチャ (Normal Gacha Green Cat) */}
            <button
              id="btn-cat-gacha"
              onClick={() => {
                audio.playClick();
                onOpenGacha();
              }}
              className="relative flex flex-col items-center justify-center hover:scale-110 transition-transform cursor-pointer"
            >
              <div className="w-12 h-12 bg-gradient-to-b from-emerald-400 to-green-600 border-2 border-emerald-900 rounded-2xl flex flex-col items-center justify-center shadow">
                <span className="text-xs font-black text-white leading-none">にゃんこ</span>
                <span className="text-xs font-black text-white leading-none">ガチャ</span>
              </div>
              {/* Badge 99 */}
              <div className="absolute -top-1.5 -right-2 bg-red-600 border-2 border-white text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow">
                99
              </div>
            </button>

            {/* レアガチャ (Rare Gacha Gold Cat) */}
            <button
              id="btn-rare-gacha"
              onClick={() => {
                audio.playClick();
                onOpenGacha();
              }}
              className="relative flex flex-col items-center justify-center hover:scale-110 transition-transform cursor-pointer"
            >
              <div className="w-12 h-12 bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600 border-2 border-amber-900 rounded-2xl flex flex-col items-center justify-center shadow">
                <span className="text-xs font-black text-stone-900 leading-none">レア</span>
                <span className="text-xs font-black text-stone-900 leading-none">ガチャ</span>
              </div>
              {/* Badge 99 */}
              <div className="absolute -top-1.5 -right-2 bg-red-600 border-2 border-white text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow">
                99
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          BOTTOM CONTROL BAR
         ======================================================== */}
      <div className="relative z-20 w-full bg-gradient-to-t from-[#361a05] via-[#522909] to-[#6d3910] border-t-[3px] border-[#291102] px-3 sm:px-6 py-2 flex items-center justify-between shadow-2xl">
        {/* Left: Back Arrow Button (Golden round button) */}
        <button
          id="btn-base-back"
          onClick={() => {
            audio.playClick();
            onBackToTitle();
          }}
          className="w-11 h-11 rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 border-3 border-stone-900 shadow-[0_3px_0_#78350f] active:translate-y-0.5 flex items-center justify-center hover:scale-105 transition-transform"
        >
          <span className="text-stone-900 font-black text-2xl">↰</span>
        </button>

        {/* Center: アイテムショップ (Item Shop Pill Button) */}
        <button
          id="btn-item-shop"
          onClick={() => {
            audio.playClick();
            onOpenItemShop();
          }}
          className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 border-[3px] border-stone-900 rounded-full px-4 sm:px-6 py-1 shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <span className="text-lg">🛒</span>
          <span className="text-stone-950 font-black text-sm sm:text-base tracking-wider">
            アイテムショップ
          </span>
        </button>

        {/* Right: ネコカン Counter & (+) Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-black/80 border-2 border-amber-700/80 rounded-lg px-2.5 py-0.5 shadow-inner">
            <span className="text-amber-100 text-xs font-black mr-1">ネコカン</span>
            <span className="text-base mr-1">🥫</span>
            <span
              className="text-yellow-400 font-black text-base sm:text-lg tracking-widest"
              style={{
                fontFamily: '"Courier New", Courier, monospace',
                textShadow: '1px 1px 0px #000, -1px -1px 0px #000',
              }}
            >
              {displayCatFood}
            </span>
          </div>

          <button
            id="btn-buy-catfood"
            onClick={() => {
              audio.playClick();
              onOpenItemShop();
            }}
            className="w-7 h-7 rounded-full bg-yellow-400 border-2 border-stone-900 font-black text-stone-900 text-sm flex items-center justify-center hover:scale-110 active:scale-95 shadow"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};
