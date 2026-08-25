import React, { useState, useEffect, useRef } from 'react';
import { PlayerProfile, PvpFriendRecord, PvpDeckUnitSummary } from '../../types';
import { CAT_DEFINITIONS } from '../../data/units';
import { TREASURES } from '../../data/stages';
import { UnitSpriteRenderer } from '../battle/UnitSpriteRenderer';
import { audio } from '../../utils/audio';
import Peer, { DataConnection } from 'peerjs';
import {
  X,
  Swords,
  Users,
  Copy,
  Check,
  Zap,
  Shield,
  Sparkles,
  RefreshCw,
  Trophy,
  AlertCircle,
  Clock,
  Eye,
  Flame,
  ArrowRight,
} from 'lucide-react';

export interface PvpPlayerInfo {
  name: string;
  rank: number;
  scoreAttackHighScore: number;
  clearedStagesCount: number;
  peerId?: string;
  deck: PvpDeckUnitSummary[];
  treasures?: Record<string, 'none' | 'bronze' | 'silver' | 'gold'>;
  facilities?: {
    workerEfficiency: number;
    workerWallet: number;
    castleHealth: number;
    cannonPower: number;
    cannonChargeRate: number;
    xpBonus: number;
  };
  profile?: PlayerProfile;
}

export interface PvpConnectionPayload {
  peer: Peer;
  conn: DataConnection;
  isHost: boolean;
  localPlayer: PvpPlayerInfo;
  remotePlayer: PvpPlayerInfo;
}

interface PvpLobbyModalProps {
  isOpen: boolean;
  profile: PlayerProfile;
  onClose: () => void;
  onUpdateProfile?: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
  onStartBattle: (payload: PvpConnectionPayload) => void;
}

// Optimized ICE servers to avoid NAT/P2P connection errors
const PEER_CONFIG = {
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
    ],
  },
};

const STORAGE_RIVALS_KEY = 'nyanko_p2p_saved_rivals';

export const PvpLobbyModal: React.FC<PvpLobbyModalProps> = ({
  isOpen,
  profile,
  onClose,
  onUpdateProfile,
  onStartBattle,
}) => {
  const [tab, setTab] = useState<'lobby' | 'rivals'>('lobby');
  const [mode, setMode] = useState<'select' | 'host' | 'join'>('select');
  const [roomId, setRoomId] = useState<string>('');
  const [inputRoomId, setInputRoomId] = useState<string>('');
  const [statusText, setStatusText] = useState<string>('対戦相手の接続を待機中...');
  const [copied, setCopied] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected rival for detailed formation/score inspection
  const [selectedRival, setSelectedRival] = useState<PvpFriendRecord | null>(null);

  // Saved rivals list from localStorage & profile
  const [savedRivals, setSavedRivals] = useState<PvpFriendRecord[]>([]);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const connectionTimeoutRef = useRef<number | null>(null);

  // Load saved rivals on open
  useEffect(() => {
    if (!isOpen) return;
    try {
      const fromLocal = localStorage.getItem(STORAGE_RIVALS_KEY);
      let rivalsList: PvpFriendRecord[] = [];
      if (fromLocal) {
        rivalsList = JSON.parse(fromLocal);
      }
      if (profile.pvpFriends) {
        for (const [id, r] of Object.entries(profile.pvpFriends)) {
          const record = r as PvpFriendRecord;
          if (!rivalsList.some((x) => x.peerId === id)) {
            rivalsList.push(record);
          }
        }
      }
      setSavedRivals(rivalsList);
    } catch (e) {
      console.warn('Failed to load saved rivals', e);
    }
  }, [isOpen, profile.pvpFriends]);

  // Save rival helper
  const saveRivalRecord = (rivalInfo: PvpPlayerInfo, rivalPeerId: string) => {
    const record: PvpFriendRecord = {
      peerId: rivalPeerId,
      name: rivalInfo.name || 'ライバル司令官',
      userRank: rivalInfo.rank || 10,
      lastPlayed: Date.now(),
      wins: 0,
      losses: 0,
      scoreAttackHighScore: rivalInfo.scoreAttackHighScore || 0,
      deck: rivalInfo.deck || [],
    };

    setSavedRivals((prev) => {
      const filtered = prev.filter((r) => r.peerId !== rivalPeerId);
      const updated = [record, ...filtered].slice(0, 30);
      try {
        localStorage.setItem(STORAGE_RIVALS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });

    if (onUpdateProfile) {
      onUpdateProfile((prev) => ({
        ...prev,
        pvpFriends: {
          ...(prev.pvpFriends || {}),
          [rivalPeerId]: record,
        },
      }));
    }
  };

  // Build local player payload
  const buildLocalPlayerInfo = (myPeerId?: string): PvpPlayerInfo => {
    let totalCatLevels = 0;
    if (profile.cats) {
      for (const catProg of Object.values(profile.cats)) {
        const prog = catProg as { unlocked?: boolean; level?: number };
        if (prog && prog.unlocked) {
          totalCatLevels += prog.level || 1;
        }
      }
    }

    let treasureCatHpMult = 1.0;
    let treasureCatAtkMult = 1.0;

    Object.entries(profile.treasures || {}).forEach(([stageKey, quality]) => {
      const tr = TREASURES[stageKey];
      if (tr && quality !== 'none') {
        const qMult = quality === 'gold' ? 1.0 : quality === 'silver' ? 0.7 : 0.4;
        const boost = tr.buffValue * qMult;
        if (tr.buffType === 'cat_hp') treasureCatHpMult += boost;
        if (tr.buffType === 'cat_atk') treasureCatAtkMult += boost;
      }
    });

    const deckUnits: PvpDeckUnitSummary[] = profile.deck.slice(0, 10).map((catId) => {
      const def = CAT_DEFINITIONS.find((c) => c.id === catId) || CAT_DEFINITIONS[0];
      const prog = (profile.cats && profile.cats[catId]) || { level: 1, activeForm: 0, unlocked: true };
      const form = def.forms[prog.activeForm || 0] || def.forms[0];
      const lvl = prog.level || 1;
      const levelMult = 1 + (lvl - 1) * 0.1;
      const hp = Math.round(form.hp * levelMult * treasureCatHpMult);
      const attackPower = Math.round(form.attackPower * levelMult * treasureCatAtkMult);
      return {
        catId: def.id,
        formIndex: prog.activeForm || 0,
        level: lvl,
        name: form.name,
        jpName: form.jpName,
        cost: form.cost,
        hp,
        attackPower,
        attackRange: form.attackRange,
        attackSpeed: form.attackSpeed,
        speed: form.speed,
        spriteType: form.spriteType,
      };
    });

    const clearedCount = Object.keys(profile.clearedStages || {}).length;

    return {
      name: profile.playerName || 'にゃんこ司令官',
      rank: totalCatLevels,
      scoreAttackHighScore: profile.scoreAttackHighScore || 0,
      clearedStagesCount: clearedCount,
      peerId: myPeerId,
      deck: deckUnits,
      treasures: profile.treasures,
      facilities: profile.facilities,
      profile: profile,
    };
  };

  // Helper to strip heavy profile properties for lightweight WebRTC DataChannel transfer (< 2KB)
  const toTransferableInfo = (info: PvpPlayerInfo) => {
    return {
      name: info.name,
      rank: info.rank,
      scoreAttackHighScore: info.scoreAttackHighScore,
      clearedStagesCount: info.clearedStagesCount,
      peerId: info.peerId,
      deck: info.deck,
      treasures: info.treasures,
      facilities: info.facilities,
    };
  };

  // Clean up peer connection on unmount / modal close
  useEffect(() => {
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (connRef.current) {
        connRef.current.close();
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  if (!isOpen) return null;

  // Start Hosting
  const handleStartHosting = () => {
    audio.playClick();
    setErrorMessage(null);
    setIsConnecting(true);
    setMode('host');

    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    const generatedId = `nyanko-battle-${randomSuffix}`;

    try {
      if (peerRef.current) {
        peerRef.current.destroy();
      }

      const peer = new Peer(generatedId, {
        debug: 1,
        ...PEER_CONFIG,
      });

      peerRef.current = peer;

      peer.on('open', (id) => {
        setRoomId(id);
        setIsConnecting(false);
        setStatusText('部屋を作成しました！相手にルームIDを共有してください');
      });

      peer.on('connection', (conn) => {
        connRef.current = conn;
        setStatusText('対戦相手が参加しました！デッキ＆スコア情報同期中...');

        let hasStarted = false;
        let syncInterval: number | null = null;

        const launchBattle = (remotePlayerInfo: PvpPlayerInfo) => {
          if (hasStarted) return;
          hasStarted = true;
          if (syncInterval) clearInterval(syncInterval);
          saveRivalRecord(remotePlayerInfo, conn.peer);
          const localInfo = buildLocalPlayerInfo(peer.id);
          const transferInfo = toTransferableInfo(localInfo);
          try {
            conn.send({ type: 'START_MATCH', data: transferInfo });
          } catch (e) {}
          audio.playVictory();
          onStartBattle({
            peer,
            conn,
            isHost: true,
            localPlayer: localInfo,
            remotePlayer: remotePlayerInfo,
          });
        };

        const sendLocalInfo = () => {
          try {
            const localInfo = buildLocalPlayerInfo(peer.id);
            conn.send({ type: 'PLAYER_INFO', data: toTransferableInfo(localInfo) });
          } catch (e) {}
        };

        if (conn.open) {
          sendLocalInfo();
        } else {
          conn.on('open', sendLocalInfo);
        }

        // 高速ハートビート送信して確実に同期 (250ms)
        syncInterval = window.setInterval(() => {
          if (!hasStarted && conn.open) {
            sendLocalInfo();
          }
        }, 250);

        conn.on('data', (data: any) => {
          if (!data) return;
          if (data.type === 'PLAYER_INFO' || data.type === 'PLAYER_INFO_ACK' || data.type === 'START_MATCH') {
            const remoteInfo = data.data as PvpPlayerInfo;
            launchBattle(remoteInfo);
          }
        });

        conn.on('error', (err) => {
          if (syncInterval) clearInterval(syncInterval);
          setErrorMessage(`通信エラー: ${err?.message || '接続が切断されました'}`);
        });
      });

      peer.on('error', (err) => {
        setIsConnecting(false);
        if (err.type === 'unavailable-id') {
          handleStartHosting();
        } else {
          setErrorMessage(`通信確立エラー: ${err.message || 'P2Pシグナリングに失敗しました'}`);
        }
      });
    } catch (e: any) {
      setIsConnecting(false);
      setErrorMessage(`初期化失敗: ${e.message}`);
    }
  };

  // Join existing Room
  const handleJoinRoom = (targetRoomId?: string) => {
    const targetId = (targetRoomId || inputRoomId).trim();
    if (!targetId) {
      setErrorMessage('ルームIDを入力してください');
      return;
    }

    audio.playClick();
    setErrorMessage(null);
    setIsConnecting(true);
    setMode('join');

    try {
      if (peerRef.current) {
        peerRef.current.destroy();
      }

      const peer = new Peer({
        debug: 1,
        ...PEER_CONFIG,
      });
      peerRef.current = peer;

      // Timeout watchdog
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = window.setTimeout(() => {
        if (isConnecting) {
          setIsConnecting(false);
          setErrorMessage('接続がタイムアウトしました。ホストが部屋を開いているか確認してください。');
        }
      }, 15000);

      peer.on('open', () => {
        const conn = peer.connect(targetId, {
          reliable: true,
        });
        connRef.current = conn;

        let hasStarted = false;
        let guestSyncInterval: number | null = null;

        const launchGuestBattle = (remoteInfo: PvpPlayerInfo) => {
          if (hasStarted) return;
          hasStarted = true;
          if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
          if (guestSyncInterval) clearInterval(guestSyncInterval);
          saveRivalRecord(remoteInfo, targetId);
          const localInfo = buildLocalPlayerInfo(peer.id);
          try {
            conn.send({ type: 'PLAYER_INFO_ACK', data: toTransferableInfo(localInfo) });
          } catch (e) {}
          audio.playVictory();
          onStartBattle({
            peer,
            conn,
            isHost: false,
            localPlayer: localInfo,
            remotePlayer: remoteInfo,
          });
        };

        const sendGuestInfo = () => {
          try {
            const localInfo = buildLocalPlayerInfo(peer.id);
            conn.send({ type: 'PLAYER_INFO', data: toTransferableInfo(localInfo) });
          } catch (e) {}
        };

        conn.on('open', () => {
          setStatusText('ホストに接続成功！編成＆スコア情報を交換中...');
          sendGuestInfo();
          guestSyncInterval = window.setInterval(() => {
            if (!hasStarted && conn.open) {
              sendGuestInfo();
            }
          }, 250);
        });

        conn.on('data', (data: any) => {
          if (!data) return;
          if (data.type === 'PLAYER_INFO' || data.type === 'PLAYER_INFO_ACK' || data.type === 'START_MATCH') {
            const remoteInfo = data.data as PvpPlayerInfo;
            launchGuestBattle(remoteInfo);
          }
        });

        conn.on('error', (err) => {
          if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
          if (guestSyncInterval) clearInterval(guestSyncInterval);
          setIsConnecting(false);
          setErrorMessage(`接続エラー: ${err.message || '相手の部屋が見つからないか、満員です'}`);
        });
      });

      peer.on('error', (err) => {
        if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
        setIsConnecting(false);
        setErrorMessage(`Peer通信エラー: ${err.message}`);
      });
    } catch (e: any) {
      setIsConnecting(false);
      setErrorMessage(`接続開始失敗: ${e.message}`);
    }
  };

  const handleCopyRoomId = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    audio.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="pvp-lobby-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        id="pvp-lobby-modal-card"
        className="w-full max-w-2xl bg-stone-900 border-3 border-amber-500 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 via-amber-600 to-red-800 px-5 py-3.5 flex items-center justify-between border-b-2 border-amber-400 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-black/40 border border-yellow-300/60 flex items-center justify-center text-2xl shadow-inner">
              ⚔️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wider drop-shadow">
                  P2P ネコ軍団 リアルタイム対戦
                </h2>
                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded border border-white animate-pulse">
                  P2P PvP
                </span>
              </div>
              <p className="text-[11px] text-amber-200 font-bold">
                友達と直接通信で激突！一度対戦した相手の編成やハイスコアも閲覧可能！
              </p>
            </div>
          </div>

          <button
            id="btn-close-pvp-lobby"
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition-all active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher: 対戦ロビー vs 対戦ライバル一覧 */}
        <div className="bg-stone-950 px-4 py-2 border-b border-stone-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex gap-2">
            <button
              id="tab-pvp-lobby"
              onClick={() => {
                audio.playClick();
                setTab('lobby');
                setSelectedRival(null);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                tab === 'lobby'
                  ? 'bg-amber-500 text-stone-950 shadow font-black'
                  : 'bg-stone-800 text-stone-400 hover:text-white'
              }`}
            >
              <Swords size={14} />
              <span>対戦ロビー</span>
            </button>
            <button
              id="tab-pvp-rivals"
              onClick={() => {
                audio.playClick();
                setTab('rivals');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                tab === 'rivals'
                  ? 'bg-amber-500 text-stone-950 shadow font-black'
                  : 'bg-stone-800 text-stone-400 hover:text-white'
              }`}
            >
              <Users size={14} />
              <span>対戦相手の履歴・編成閲覧 ({savedRivals.length}人)</span>
            </button>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-stone-400">
            <span className="text-amber-400 font-black">戦績:</span>
            <span className="text-white">{profile.pvpWins || 0}勝</span>
            <span>/</span>
            <span>{profile.pvpLosses || 0}敗</span>
            <span className="ml-2 text-amber-300 font-mono text-[11px]">
              スコア最高: {(profile.scoreAttackHighScore || 0).toLocaleString()}点
            </span>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto min-h-0 flex-1">
          {errorMessage && (
            <div className="bg-rose-950/80 border-2 border-rose-500/80 text-rose-200 p-3 rounded-2xl text-xs font-bold flex items-start gap-2 animate-fade-in">
              <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-black text-rose-300 mb-0.5">通信エラーが発生しました</div>
                <div>{errorMessage}</div>
                <div className="text-[10px] text-rose-300/80 mt-1">
                  ※ WebRTC P2P通信のため、同一ネットワークまたは安定した通信環境をおすすめします。
                </div>
              </div>
            </div>
          )}

          {tab === 'lobby' && (
            <>
              {mode === 'select' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-1">
                  {/* Option 1: Create Room (Host) */}
                  <button
                    id="btn-pvp-create-room"
                    onClick={handleStartHosting}
                    className="group relative bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 border-3 border-yellow-300 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">
                      👑
                    </div>
                    <h3 className="text-base font-black text-stone-950 mb-1">部屋を作って対戦 (ホスト)</h3>
                    <p className="text-xs font-bold text-amber-950">
                      ルームIDを発行して友達を招待！STUN高速回線で自動マッチングします
                    </p>
                  </button>

                  {/* Option 2: Join Room (Guest) */}
                  <div className="bg-stone-950 border-3 border-stone-700 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🚪</span>
                        <h3 className="text-base font-black text-white">部屋に参加する (ゲスト)</h3>
                      </div>
                      <p className="text-xs text-stone-400 font-bold mb-3">
                        友達から共有されたルームIDを入力して接続します
                      </p>
                      <input
                        id="input-pvp-room-id"
                        type="text"
                        value={inputRoomId}
                        onChange={(e) => setInputRoomId(e.target.value)}
                        placeholder="例: nyanko-battle-1234"
                        className="w-full bg-stone-900 border-2 border-stone-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300 placeholder:text-stone-600 focus:outline-none mb-3"
                      />
                    </div>

                    <button
                      id="btn-pvp-join-room"
                      onClick={() => handleJoinRoom()}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs border-2 border-indigo-400 shadow active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Users size={14} />
                      <span>接続して参加</span>
                    </button>
                  </div>
                </div>
              )}

              {mode === 'host' && (
                <div className="bg-stone-950 border-2 border-amber-500/60 rounded-2xl p-5 text-center space-y-4">
                  <div className="inline-flex p-3 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 animate-pulse">
                    <RefreshCw size={28} className="animate-spin" />
                  </div>

                  <div>
                    <h3 className="text-base font-black text-white mb-1">友達の参加を待機中...</h3>
                    <p className="text-xs text-amber-300 font-bold">{statusText}</p>
                  </div>

                  {roomId && (
                    <div className="bg-stone-900 border-2 border-amber-400/80 rounded-2xl p-3.5 flex items-center justify-between gap-2 max-w-md mx-auto">
                      <div className="text-left font-mono">
                        <span className="text-[10px] text-stone-400 block">あなたのルームID</span>
                        <span className="text-sm sm:text-base font-black text-yellow-400 tracking-wider">
                          {roomId}
                        </span>
                      </div>

                      <button
                        id="btn-copy-room-id"
                        onClick={handleCopyRoomId}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs border border-yellow-200 shadow flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copied ? 'コピー完了！' : 'IDコピー'}</span>
                      </button>
                    </div>
                  )}

                  <p className="text-[11px] text-stone-400">
                    友達がこのIDを入力して接続すると、自動的にデータ交換＆バトル画面へ遷移します！
                  </p>

                  <button
                    onClick={() => {
                      if (peerRef.current) peerRef.current.destroy();
                      setMode('select');
                    }}
                    className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-black border border-stone-600 cursor-pointer"
                  >
                    キャンセルして戻る
                  </button>
                </div>
              )}

              {mode === 'join' && (
                <div className="bg-stone-950 border-2 border-indigo-500/60 rounded-2xl p-5 text-center space-y-4">
                  <div className="inline-flex p-3 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 animate-pulse">
                    <RefreshCw size={28} className="animate-spin" />
                  </div>

                  <div>
                    <h3 className="text-base font-black text-white mb-1">相手の部屋に接続中...</h3>
                    <p className="text-xs text-indigo-300 font-bold">{statusText}</p>
                  </div>

                  <button
                    onClick={() => {
                      if (peerRef.current) peerRef.current.destroy();
                      setMode('select');
                    }}
                    className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-black border border-stone-600 cursor-pointer"
                  >
                    キャンセルして戻る
                  </button>
                </div>
              )}

              {/* Current Deck Preview */}
              <div className="bg-stone-950/80 rounded-2xl border border-stone-800 p-3">
                <div className="text-[11px] font-black text-amber-400 mb-2 flex items-center justify-between">
                  <span>あなたの出撃デッキ（全10体）</span>
                  <span className="text-stone-400 text-[10px]">※ キャラクター編成で変更可能</span>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                  {profile.deck.slice(0, 10).map((catId, idx) => {
                    const def = CAT_DEFINITIONS.find((c) => c.id === catId);
                    const prog = profile.cats[catId];
                    if (!def) return null;
                    const form = def.forms[prog?.activeForm || 0] || def.forms[0];

                    return (
                      <div
                        key={idx}
                        className="bg-stone-900 border border-stone-700 rounded-xl p-1 flex flex-col items-center text-center overflow-hidden"
                      >
                        <div className="h-8 flex items-center justify-center scale-75">
                          <UnitSpriteRenderer
                            spriteType={form.spriteType}
                            isCat={true}
                            state="walk"
                            animTimer={0.5}
                            scale={0.6}
                          />
                        </div>
                        <div className="text-[8px] font-black text-white truncate w-full mt-0.5">
                          {form.name}
                        </div>
                        <div className="text-[7px] text-yellow-400 font-mono">¥{form.cost}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {tab === 'rivals' && (
            <div className="space-y-4">
              {/* Selected Rival Detail Modal / Drawer */}
              {selectedRival && (
                <div className="bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-amber-400 rounded-2xl p-4 space-y-3 shadow-xl animate-fade-in">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-lg">
                        🐱
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                          <span>{selectedRival.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-stone-800 text-amber-300 rounded font-mono">
                            ランク {selectedRival.userRank}
                          </span>
                        </h4>
                        <span className="text-[10px] text-stone-400 font-mono">
                          ID: {selectedRival.peerId}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedRival(null)}
                      className="p-1 rounded-lg bg-stone-800 text-stone-400 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Rival Stats Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="bg-stone-900 p-2 rounded-xl border border-stone-800">
                      <div className="text-[10px] text-stone-400 font-bold flex items-center gap-1">
                        <Flame size={12} className="text-rose-400" /> スコアアタック最高スコア
                      </div>
                      <div className="text-sm font-black text-amber-300 font-mono mt-0.5">
                        {(selectedRival.scoreAttackHighScore || 0).toLocaleString()} 点
                      </div>
                    </div>
                    <div className="bg-stone-900 p-2 rounded-xl border border-stone-800">
                      <div className="text-[10px] text-stone-400 font-bold flex items-center gap-1">
                        <Clock size={12} className="text-cyan-400" /> 最終接続日時
                      </div>
                      <div className="text-xs font-bold text-stone-200 mt-0.5">
                        {new Date(selectedRival.lastPlayed).toLocaleDateString()}{' '}
                        {new Date(selectedRival.lastPlayed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="col-span-2 sm:col-span-1 bg-stone-900 p-2 rounded-xl border border-stone-800 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-stone-400 font-bold">クイック再戦</div>
                        <div className="text-[10px] text-amber-400">IDをセットして参加</div>
                      </div>
                      <button
                        onClick={() => {
                          setInputRoomId(selectedRival.peerId);
                          setTab('lobby');
                          handleJoinRoom(selectedRival.peerId);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] shadow flex items-center gap-1"
                      >
                        <span>対戦開始</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Rival 10-Unit Deck Details */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-black text-amber-400 flex items-center justify-between">
                      <span>相手のデッキ編成詳細 ({selectedRival.deck.length}体)</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {selectedRival.deck.map((unit, idx) => (
                        <div
                          key={idx}
                          className="bg-stone-950 border border-stone-800 hover:border-amber-500/50 rounded-xl p-2 flex flex-col items-center text-center transition-all shadow"
                        >
                          <div className="h-10 flex items-center justify-center scale-90">
                            <UnitSpriteRenderer
                              spriteType={unit.spriteType}
                              isCat={true}
                              state="walk"
                              animTimer={0.8}
                              scale={0.7}
                            />
                          </div>
                          <div className="text-[10px] font-black text-white truncate w-full mt-1">
                            {unit.name}
                          </div>
                          <div className="text-[9px] text-amber-400 font-mono font-bold">
                            Lv.{unit.level} (第{unit.formIndex + 1}形態)
                          </div>
                          <div className="w-full mt-1.5 pt-1.5 border-t border-stone-800 text-[8px] text-stone-400 grid grid-cols-2 gap-0.5">
                            <div>HP: <span className="text-stone-200 font-mono">{unit.hp}</span></div>
                            <div>攻: <span className="text-stone-200 font-mono">{unit.attackPower}</span></div>
                            <div>射程: <span className="text-stone-200 font-mono">{unit.attackRange}</span></div>
                            <div>コスト: <span className="text-yellow-300 font-mono">¥{unit.cost}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Rivals List Cards */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-stone-400 flex items-center justify-between">
                  <span>これまでに接続した相手の記録（いつでも編成・スコアを確認可能）</span>
                  <span>{savedRivals.length} 件</span>
                </div>

                {savedRivals.length === 0 ? (
                  <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-8 text-center space-y-2">
                    <div className="text-3xl">👥</div>
                    <h4 className="text-sm font-black text-stone-300">まだ対戦相手の記録がありません</h4>
                    <p className="text-xs text-stone-500">
                      P2P対戦で一度接続すると、相手のデッキ編成やスコアアタック記録がここに自動保存されます！
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {savedRivals.map((rival) => (
                      <div
                        key={rival.peerId}
                        className="bg-stone-950 border border-stone-800 hover:border-amber-500/60 rounded-2xl p-3 flex flex-col justify-between gap-2.5 transition-all shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-xl">
                              ⚔️
                            </div>
                            <div>
                              <div className="text-xs font-black text-white flex items-center gap-1.5">
                                <span>{rival.name}</span>
                                <span className="text-[9px] bg-stone-800 text-amber-300 px-1 py-0.2 rounded font-mono">
                                  Rank {rival.userRank}
                                </span>
                              </div>
                              <div className="text-[9px] text-stone-500 font-mono">
                                {new Date(rival.lastPlayed).toLocaleDateString()} 対戦
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-[9px] text-stone-400 font-bold">スコアアタック</div>
                            <div className="text-xs font-black text-amber-300 font-mono">
                              {(rival.scoreAttackHighScore || 0).toLocaleString()}点
                            </div>
                          </div>
                        </div>

                        {/* Deck Miniature avatars */}
                        <div className="flex items-center gap-1 bg-stone-900/60 p-1.5 rounded-xl border border-stone-800/80 overflow-x-auto">
                          {rival.deck.slice(0, 5).map((u, i) => (
                            <div
                              key={i}
                              className="w-6 h-6 rounded bg-stone-800 shrink-0 flex items-center justify-center overflow-hidden scale-75"
                              title={u.name}
                            >
                              <UnitSpriteRenderer
                                spriteType={u.spriteType}
                                isCat={true}
                                state="walk"
                                animTimer={0.5}
                                scale={0.5}
                              />
                            </div>
                          ))}
                          {rival.deck.length > 5 && (
                            <span className="text-[9px] text-stone-500 font-mono pl-1">
                              +{rival.deck.length - 5}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-stone-900">
                          <button
                            onClick={() => {
                              audio.playClick();
                              setSelectedRival(rival);
                            }}
                            className="flex-1 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-black text-[11px] border border-stone-700 flex items-center justify-center gap-1 active:scale-95 transition-all"
                          >
                            <Eye size={12} />
                            <span>編成＆スコア詳細</span>
                          </button>

                          <button
                            onClick={() => {
                              setInputRoomId(rival.peerId);
                              setTab('lobby');
                              handleJoinRoom(rival.peerId);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-[11px] shadow flex items-center justify-center gap-1 active:scale-95 transition-all"
                            title="この相手のIDで参加"
                          >
                            <Swords size={12} />
                            <span>対戦</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-950 px-5 py-3 border-t border-stone-800 flex justify-end shrink-0">
          <button
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="px-5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-black border border-stone-700 active:scale-95 transition-all cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
