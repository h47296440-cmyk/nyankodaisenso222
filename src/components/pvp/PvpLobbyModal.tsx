import React, { useState, useEffect, useRef } from 'react';
import { PlayerProfile } from '../../types';
import { CAT_DEFINITIONS } from '../../data/units';
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
} from 'lucide-react';

export interface PvpPlayerInfo {
  name: string;
  rank: number;
  deck: {
    catId: string;
    formIndex: number;
    level: number;
    name: string;
    cost: number;
    hp: number;
    attackPower: number;
    attackRange: number;
    attackSpeed: number;
    speed: number;
    spriteType: string;
  }[];
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
  onStartPvpBattle: (payload: PvpConnectionPayload) => void;
}

export const PvpLobbyModal: React.FC<PvpLobbyModalProps> = ({
  isOpen,
  profile,
  onClose,
  onStartPvpBattle,
}) => {
  const [mode, setMode] = useState<'select' | 'host' | 'join'>('select');
  const [roomId, setRoomId] = useState<string>('');
  const [inputRoomId, setInputRoomId] = useState<string>('');
  const [statusText, setStatusText] = useState<string>('対戦相手の接続を待機中...');
  const [copied, setCopied] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);

  // Build local player payload
  const buildLocalPlayerInfo = (): PvpPlayerInfo => {
    let totalCatLevels = 0;
    if (profile.cats) {
      for (const catProg of Object.values(profile.cats)) {
        const prog = catProg as { unlocked?: boolean; level?: number };
        if (prog && prog.unlocked) {
          totalCatLevels += prog.level || 1;
        }
      }
    }
    const deckUnits = profile.deck.slice(0, 10).map((catId) => {
      const def = CAT_DEFINITIONS.find((c) => c.id === catId) || CAT_DEFINITIONS[0];
      const prog = (profile.cats && profile.cats[catId]) || { level: 1, activeForm: 0, unlocked: true };
      const form = def.forms[prog.activeForm || 0] || def.forms[0];
      return {
        catId: def.id,
        formIndex: prog.activeForm || 0,
        level: prog.level || 1,
        name: form.name,
        cost: form.cost,
        hp: Math.round(form.hp * (1 + (prog.level - 1) * 0.15)),
        attackPower: Math.round(form.attackPower * (1 + (prog.level - 1) * 0.15)),
        attackRange: form.attackRange,
        attackSpeed: form.attackSpeed,
        speed: form.speed,
        spriteType: form.spriteType,
      };
    });

    return {
      name: 'にゃんこ司令官',
      rank: totalCatLevels,
      deck: deckUnits,
    };
  };

  // Clean up peer connection on modal close
  useEffect(() => {
    return () => {
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
      const peer = new Peer(generatedId, {
        debug: 1,
      });

      peerRef.current = peer;

      peer.on('open', (id) => {
        setRoomId(id);
        setIsConnecting(false);
        setStatusText('部屋を作成しました！相手にルームIDを共有してください');
      });

      peer.on('connection', (conn) => {
        connRef.current = conn;
        setStatusText('対戦相手が参加しました！データ同期中...');

        conn.on('open', () => {
          const localInfo = buildLocalPlayerInfo();
          conn.send({ type: 'PLAYER_INFO', data: localInfo });
        });

        conn.on('data', (data: any) => {
          if (data && data.type === 'PLAYER_INFO') {
            audio.playVictory();
            const localInfo = buildLocalPlayerInfo();
            onStartPvpBattle({
              peer,
              conn,
              isHost: true,
              localPlayer: localInfo,
              remotePlayer: data.data,
            });
          }
        });

        conn.on('error', (err) => {
          setErrorMessage(`通信エラー: ${err.message || '接続が切断されました'}`);
        });
      });

      peer.on('error', (err) => {
        setIsConnecting(false);
        if (err.type === 'unavailable-id') {
          // Retry with new ID
          handleStartHosting();
        } else {
          setErrorMessage(`Peerエラー: ${err.message}`);
        }
      });
    } catch (e: any) {
      setIsConnecting(false);
      setErrorMessage(`初期化失敗: ${e.message}`);
    }
  };

  // Join existing Room
  const handleJoinRoom = () => {
    const targetId = inputRoomId.trim();
    if (!targetId) {
      setErrorMessage('ルームIDを入力してください');
      return;
    }

    audio.playClick();
    setErrorMessage(null);
    setIsConnecting(true);
    setMode('join');

    try {
      const peer = new Peer();
      peerRef.current = peer;

      peer.on('open', () => {
        const conn = peer.connect(targetId);
        connRef.current = conn;

        conn.on('open', () => {
          setStatusText('相手に接続成功！デッキ情報を交換中...');
          const localInfo = buildLocalPlayerInfo();
          conn.send({ type: 'PLAYER_INFO', data: localInfo });
        });

        conn.on('data', (data: any) => {
          if (data && data.type === 'PLAYER_INFO') {
            audio.playVictory();
            const localInfo = buildLocalPlayerInfo();
            onStartPvpBattle({
              peer,
              conn,
              isHost: false,
              localPlayer: localInfo,
              remotePlayer: data.data,
            });
          }
        });

        conn.on('error', (err) => {
          setIsConnecting(false);
          setErrorMessage(`接続エラー: ${err.message || '相手の部屋が見つかりません'}`);
        });
      });

      peer.on('error', (err) => {
        setIsConnecting(false);
        setErrorMessage(`通信エラー: ${err.message}`);
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
        className="w-full max-w-xl bg-stone-900 border-3 border-amber-500 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 via-amber-600 to-red-800 px-5 py-3.5 flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-black/40 border border-yellow-300/60 flex items-center justify-center text-2xl shadow-inner">
              ⚔️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wider drop-shadow">
                  P2P ネコ軍団 リアルタイム対戦
                </h2>
                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded border border-white animate-pulse">
                  P2P PvP
                </span>
              </div>
              <p className="text-[11px] text-amber-200 font-bold">
                友達とPeer-to-Peerで直接つながり、自慢の編成で激突！
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

        {/* PvP Stats Banner */}
        <div className="bg-stone-950 px-5 py-2.5 border-b border-stone-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-amber-400 font-black">
              <Trophy size={15} />
              <span>対戦戦績:</span>
              <span className="text-white text-sm font-mono">{profile.pvpWins || 0}勝</span>
              <span className="text-stone-500 text-sm font-mono">/</span>
              <span className="text-stone-400 text-sm font-mono">{profile.pvpLosses || 0}敗</span>
            </div>
          </div>
          <div className="text-[11px] text-stone-400 font-bold">
            出撃デッキ: {profile.deck.length}体編成
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 space-y-4">
          {errorMessage && (
            <div className="bg-rose-950/80 border-2 border-rose-500/80 text-rose-200 p-3 rounded-2xl text-xs font-bold flex items-start gap-2 animate-fade-in">
              <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {mode === 'select' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
              {/* Option 1: Create Room (Host) */}
              <button
                id="btn-pvp-create-room"
                onClick={handleStartHosting}
                className="group relative bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 border-3 border-yellow-300 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">
                  👑
                </div>
                <h3 className="text-base font-black text-stone-950 mb-1">部屋を作って対戦</h3>
                <p className="text-xs font-bold text-amber-950">
                  ルームIDを発行して友達を招待！あなたがホストとして対戦を開始します
                </p>
              </button>

              {/* Option 2: Join Room (Guest) */}
              <div className="bg-stone-950 border-3 border-stone-700 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🚪</span>
                    <h3 className="text-base font-black text-white">部屋に参加する</h3>
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
                  onClick={handleJoinRoom}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs border-2 border-indigo-400 shadow active:scale-95 transition-all flex items-center justify-center gap-1.5"
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
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs border border-yellow-200 shadow flex items-center gap-1 active:scale-95 transition-all"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'コピー完了！' : 'IDコピー'}</span>
                  </button>
                </div>
              )}

              <p className="text-[11px] text-stone-400">
                友達がこのIDを入力して参加すると、自動的にバトル画面へ遷移します！
              </p>

              <button
                onClick={() => {
                  if (peerRef.current) peerRef.current.destroy();
                  setMode('select');
                }}
                className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-black border border-stone-600"
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
                className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-black border border-stone-600"
              >
                キャンセルして戻る
              </button>
            </div>
          )}

          {/* Current Deck Preview */}
          <div className="bg-stone-950/80 rounded-2xl border border-stone-800 p-3">
            <div className="text-[11px] font-black text-amber-400 mb-2 flex items-center justify-between">
              <span>出撃デッキ（全10体）</span>
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
        </div>

        {/* Footer */}
        <div className="bg-stone-950 px-5 py-3 border-t border-stone-800 flex justify-end">
          <button
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
