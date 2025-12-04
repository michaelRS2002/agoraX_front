import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { BiMicrophone, BiMicrophoneOff } from "react-icons/bi";
import { IoSend } from "react-icons/io5";
import { RiChat4Line, RiChatOffLine, RiVideoLine, RiVideoOffLine } from "react-icons/ri";
import "./Conference.scss";

import { useChatSocket, useAudioSocket } from "../../context/SocketContext";

interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: Date;
}

interface RoomUser {
  socketId: string;
  username: string;
}

const Conference: React.FC = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();

  const chatSocket = useChatSocket();
  const audioSocket = useAudioSocket();

  const [isMicOn, setIsMicOn] = useState(true);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<RoomUser[]>([]);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isCamOn, setIsCamOn] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recorderIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorderStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recorderShouldRestartRef = useRef<boolean>(true);
  const remoteAudioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const username = user?.name || user?.email?.split("@")[0] || "Usuario";

  /** ───────────────────────
   *  MIC TOGGLE FIX
   * ───────────────────────*/
  const toggleMic = () => {
  if (!localStream) return;

  const audioTrack = localStream.getAudioTracks()[0];
  if (!audioTrack) return;

  // Cambiar estado local
  const newEnabled = !audioTrack.enabled;
  audioTrack.enabled = newEnabled;
  setIsMicOn(newEnabled);

  // Aplicar a TODOS los peer connections 💡
  Object.values(peerConnections.current).forEach(pc => {
    pc.getSenders().forEach(sender => {
      if (sender.track && sender.track.kind === "audio") {
        sender.track.enabled = audioTrack.enabled;
      }
    });
  });

  console.log("Mic:", audioTrack.enabled ? "ON" : "OFF");
  // NOTE: do NOT auto-finalize when toggling mic. Finalize is triggered when the room is empty
  // by the signaling server, or can be called explicitly by the user via a dedicated action.
};

  /** Camera toggle */
  const toggleCamera = async () => {
    if (!localStream) return;
    let videoTrack = localStream.getVideoTracks()[0];

    // If no video track present, try requesting it
    if (!videoTrack) {
      try {
        const vStream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoTrack = vStream.getVideoTracks()[0];
        if (videoTrack) {
          localStream.addTrack(videoTrack);
          // add to existing peer connections once
          Object.values(peerConnections.current).forEach(pc => {
            const alreadyAdded = pc.getSenders().some(s => s.track?.kind === "video");
            if (!alreadyAdded) pc.addTrack(videoTrack!, localStream);
          });
          if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
        }
      } catch (e) {
        console.error("Error requesting camera:", e);
        return;
      }
    }

    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    setIsCamOn(videoTrack.enabled);

    // reflect change in senders
    Object.values(peerConnections.current).forEach(pc => {
      pc.getSenders().forEach(sender => {
        if (sender.track && sender.track.kind === "video") {
          sender.track.enabled = videoTrack!.enabled;
        }
      });
    });
  };

  /** Chat toggle */
  const toggleChat = () => setIsChatVisible(!isChatVisible);

  const handleLeaveCall = () => setShowLeaveModal(true);
  const confirmLeaveCall = () => {
    // cleanup audio and peer connections before leaving
    // Close the leave modal immediately so the UI updates
    setShowLeaveModal(false);

    // Emit chat leave immediately so the server broadcasts updated room users
    try {
      if (chatSocket && roomId) chatSocket.emit("leaveRoom", roomId);
    } catch (e) {
      // ignore
    }

    // cleanup audio and peer connections before leaving (audioSocket leave is inside)
    leaveVoiceRoom();

    // Optimistically remove this client from the local users list so UI reflects the leave
    try {
      const mySocketId = chatSocket?.id;
      if (mySocketId) setUsers(prev => prev.filter(u => u.socketId !== mySocketId));
    } catch (e) {}

    // Navigate home
    navigate("/home");
  };
  const cancelLeaveCall = () => setShowLeaveModal(false);

  /** ───────────────────────
   * CHAT SOCKET LOGIC
   * ───────────────────────*/
  useEffect(() => {
    if (!chatSocket || !roomId) return;

    const email = user?.email;
    const userId = user?.id || user?.uid || null;

    chatSocket.emit("joinRoom", { roomId, username, email, userId });

    // Also notify backend to persist participant email for this meeting (so resume can fetch it later)
    try {
      const VITE_BACKEND = (import.meta as any).env?.VITE_BACKEND_BASE || (import.meta as any).env?.VITE_API_BASE_URL || '';
      // Normalize backend base: remove trailing slashes and any trailing '/api' to avoid '/api/api' duplication
      let backendBase = String(VITE_BACKEND || '').replace(/\/+$/,'');
      backendBase = backendBase.replace(/\/api$/i, '');
      if (backendBase && email) {
        const url = `${backendBase}/api/meetings/${encodeURIComponent(roomId || '')}/participants`;
        // fire-and-forget; backend will idempotently add email if not present
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: String(email).toLowerCase(), userId: userId || undefined, name: username })
        }).then(async (r) => {
          if (!r.ok) {
            console.warn('[client] backend participant POST failed', { status: r.status, url });
          } else {
            try { const j = await r.json(); console.log('[client] backend participant POST ok', j); } catch(e) {}
          }
        }).catch(e => console.warn('[client] backend participant POST error', e));
      }
    } catch (e) {
      console.warn('[client] failed to notify backend of participant', e);
    }

    chatSocket.on("roomUsers", (users: RoomUser[]) => setUsers(users));
    chatSocket.on("message", (msg) => setMessages(prev => [...prev, msg]));

    return () => {
      chatSocket.emit("leaveRoom", roomId);
      chatSocket.off("roomUsers");
      chatSocket.off("message");
    };
  }, [chatSocket, roomId]);

  /** ───────────────────────
   * GET USER MEDIA
   * ───────────────────────*/
  useEffect(() => {
    const initMedia = async () => {
      try {
        // Intento conjunto primero
        const combined = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setLocalStream(combined);
        if (localVideoRef.current && combined.getVideoTracks().length > 0) {
          localVideoRef.current.srcObject = combined;
        }
        return;
      } catch (e) {
        // Fallback: solicitar por separado y combinar
        let video: MediaStream | null = null;
        let audio: MediaStream | null = null;
        try { video = await navigator.mediaDevices.getUserMedia({ video: true }); } catch {}
        try { audio = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch {}
        if (!video && !audio) {
          console.error("No se pudo acceder ni a cámara ni a micrófono");
          return;
        }
        const stream = new MediaStream();
        if (video) {
          const vt = video.getVideoTracks()[0];
          if (vt) stream.addTrack(vt);
        }
        if (audio) {
          const at = audio.getAudioTracks()[0];
          if (at) stream.addTrack(at);
        }
        setLocalStream(stream);
        if (localVideoRef.current && stream.getVideoTracks().length > 0) {
          localVideoRef.current.srcObject = stream;
        }
      }
    };
    initMedia();
  }, []);

  // Reasigna el stream al elemento de video cuando cambia el estado de la cámara
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [isCamOn, localStream]);
  /** MEDIARECORDER: capture local mic and send 4s chunks to backend for transcription */
  useEffect(() => {
    if (!localStream) return;

    const mimeType = (() => {
      const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
      ];
      for (const t of candidates) {
        try {
          if (MediaRecorder.isTypeSupported(t)) return t;
        } catch (e) {
          // Some environments may throw on isTypeSupported; ignore and continue
        }
      }
      // If none matched, return empty to let the browser choose a default
      return '';
    })();

    // If mic is off, ensure recorder is stopped and do not start
    if (!isMicOn) {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try { recorderRef.current.stop(); } catch (e) {}
      }
      recorderRef.current = null;
      return;
    }

    try {
      // Ensure recorder will restart after onstop when we (re)create it
      recorderShouldRestartRef.current = true;
      // Verify we have an active audio track before creating MediaRecorder
      const audioTracks = localStream.getAudioTracks();
      if (!audioTracks || audioTracks.length === 0) {
        console.warn('[recorder] No audio tracks available on localStream; skipping recorder creation');
        return;
      }

      const track = audioTracks[0];
      if (track.readyState !== 'live') {
        console.warn('[recorder] Audio track not live', { readyState: track.readyState });
        // still attempt to create recorder, but log for debugging
      }

      let mediaRecorder: MediaRecorder | undefined;
      // Try a few option permutations: prefer specifying both mimeType and audioBitsPerSecond,
      // then fallback to audioBitsPerSecond only, then mimeType only, then default.
      const optionsList: Array<MediaRecorderOptions | {}> = [];
      if (mimeType) optionsList.push({ mimeType, audioBitsPerSecond: 48000 } as MediaRecorderOptions);
      optionsList.push({ audioBitsPerSecond: 48000 } as MediaRecorderOptions);
      if (mimeType) optionsList.push({ mimeType } as MediaRecorderOptions);
      optionsList.push({} as {});

      let lastErr: any = null;
      for (const opts of optionsList) {
        try {
          // Some environments are strict about the options shape; cast to any to be flexible.
          mediaRecorder = Object.keys(opts as any).length ? new MediaRecorder(localStream as any, opts as any) : new MediaRecorder(localStream as any);
          console.log('[recorder] MediaRecorder created with options', opts);
          break;
        } catch (e) {
          lastErr = e;
          console.warn('[recorder] MediaRecorder constructor failed for options', opts, e);
        }
      }

      if (!mediaRecorder) {
        console.error('[recorder] MediaRecorder not available after attempts', lastErr);
        return;
      }

      recorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (ev: BlobEvent) => {
        // Do not send when mic has been turned off (safety)
        if (!isMicOn) return;
        if (!ev.data || ev.data.size === 0) return;

        // Skip very small blobs which produce Groq "audio too short" errors
        if (ev.data.size < 4000) {
          console.warn('[client] skipping tiny audio chunk', { size: ev.data.size });
          return;
        }

        try {
          const arrayBuffer = await ev.data.arrayBuffer();
          try {
            const u8 = new Uint8Array(arrayBuffer);
            const headSlice = Array.from(u8.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ');
            console.log('[client] chunk first 20 bytes (hex):', headSlice);
            if (u8.length >= 4) {
              const hasEbml = u8[0] === 0x1a && u8[1] === 0x45 && u8[2] === 0xdf && u8[3] === 0xa3;
              if (!hasEbml) console.warn('[client] EBML header missing in chunk (may be corrupt)', headSlice.split(' ').slice(0,4).join(' '));
            }
            const allZero = u8.slice(0, 8).every(v => v === 0);
            if (allZero) console.warn('[client] chunk begins with zeros — likely empty or corrupted');
          } catch (e) {
            console.warn('[client] failed to inspect chunk bytes', e);
          }
          // Support multiple env names; prefer a dedicated resume service if configured
          const VITE_RESUME = (import.meta as any).env?.VITE_RESUME_API_BASE || (import.meta as any).env?.VITE_API_BASE_URL || (import.meta as any).env?.VITE_API_URL || '';
          const base = VITE_RESUME.replace(/\/+$/,'');
          const query = new URLSearchParams({
            roomId: roomId || '',
            userId: username || '',
          });
          // include email if available
          if (user?.email) query.set('email', user.email);

          const endpoint = `${base}/audio/transcribe-chunk?${query.toString()}`;
          console.log('[client] sending audio chunk', { endpoint, size: ev.data.size, type: ev.data.type });

          try {
            const resp = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': ev.data.type || 'audio/webm' },
              body: arrayBuffer,
            });

            try {
              const text = await resp.text();
              if (!text) {
                console.warn('[client] transcribe response empty', { status: resp.status });
              } else {
                try {
                  const json = JSON.parse(text);
                  console.log('[client] transcribe response', json);
                } catch (e) {
                  console.warn('[client] transcribe response not JSON', { status: resp.status, text });
                }
              }
            } catch (e) {
              console.warn('[client] failed to read transcribe response', e);
            }
          } catch (err) {
            console.warn('Failed to send audio chunk', err);
          }
        } catch (err) {
          console.warn('Failed to send audio chunk', err);
        }
      };

      mediaRecorder.onerror = (e) => console.warn('MediaRecorder error', e);
      mediaRecorder.onstart = () => console.log('[recorder] onstart fired');

      // Start recording using a safer manual interval approach
      try {
        // 1) Detén por si acaso (solo si ya está recording)
        try { if (mediaRecorder.state === 'recording') mediaRecorder.stop(); } catch (_) {}

        // 2) Espera un poco y luego inicia. We'll use onstart to attach interval reliably.
        // Start recorder with a warm-up and stabilized chunking interval
        recorderStartTimeoutRef.current = window.setTimeout(() => {
          console.log("Recorder warming up...");

          try {
            mediaRecorder.start();
          } catch (startErr) {
            console.warn('[recorder] mediaRecorder.start failed', startErr);
            return;
          }

              // Wait a short moment after start (700ms) then begin stop/start chunking every 12s
              recorderStartTimeoutRef.current = window.setTimeout(() => {
                console.log("Recorder now stable. Starting stop/start chunking...");

                // onstop handler must restart recorder after a small delay to ensure the file is flushed
                mediaRecorder.onstop = () => {
                  console.log('[recorder] onstop fired');
                  try {
                    if (!isMicOn) {
                      console.log('[recorder] mic off, not restarting');
                      return;
                    }
                  } catch (e) {}

                  // Only restart if allowed (not unmounting/cleanup)
                  if (!recorderShouldRestartRef.current) return;

                  setTimeout(() => {
                    try {
                      if (mediaRecorder.state === 'inactive') {
                        mediaRecorder.start();
                        console.log('[recorder] restarted after stop');
                      }
                    } catch (e) {
                      console.warn('[recorder] restart failed', e);
                    }
                  }, 400);
                };

                // Begin periodic stop calls which finalize chunks safely
                recorderIntervalRef.current = window.setInterval(() => {
                  try {
                    if (mediaRecorder.state === 'recording') {
                      console.log('[recorder] calling stop() to finalize chunk');
                      mediaRecorder.stop();
                    }
                  } catch (e) {
                    console.warn('[recorder] stop() failed', e);
                  }
                }, 12000) as unknown as ReturnType<typeof setInterval>;

              }, 500) as unknown as ReturnType<typeof setTimeout>;

        }, 3000) as unknown as ReturnType<typeof setTimeout>;
      } catch (err) {
        console.warn('Failed to start MediaRecorder', err);
      }

      return () => {
        // Prevent onstop from restarting
        recorderShouldRestartRef.current = false;
        try {
          if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
        } catch (e) {}
        if (recorderIntervalRef.current) { clearInterval(recorderIntervalRef.current); recorderIntervalRef.current = null; }
        if (recorderStartTimeoutRef.current) { clearTimeout(recorderStartTimeoutRef.current); recorderStartTimeoutRef.current = null; }
        recorderRef.current = null;
      };
    } catch (err) {
      console.warn('MediaRecorder not available or failed:', err);
    }

  }, [localStream, roomId, username, isMicOn]);

  /** ───────────────────────
   * CREATE OR GET PEER
   * (fix: avoid duplicates & mute breaking)
   * ───────────────────────*/
  const getOrCreatePeerConnection = (userId: string) => {
    if (peerConnections.current[userId]) return peerConnections.current[userId];

    // Build ICE servers from environment (supports VITE_ICE_SERVERS JSON, STUN and TURN)
    let iceServers: RTCIceServer[] = [];

    const iceEnv = (import.meta as any).env?.VITE_ICE_SERVERS;
    if (iceEnv) {
      try {
        const parsed = JSON.parse(iceEnv as string) as RTCIceServer[];
        if (Array.isArray(parsed) && parsed.length) {
          iceServers = parsed;
        }
      } catch (e) {
        console.warn('Failed to parse VITE_ICE_SERVERS, falling back to individual vars', e);
      }
    }

    if (!iceServers.length) {
      const env = (import.meta as any).env ?? {};
      const stunUrl = env.VITE_STUN_URL ?? env.VITE_STUN_SERVER;
      const turnUrl = env.VITE_TURN_URL;
      const turnUser = env.VITE_TURN_USER;
      const turnPass = env.VITE_TURN_PASS;

      if (stunUrl) iceServers.push({ urls: stunUrl });
      if (turnUrl) {
        const turnServer: RTCIceServer = { urls: turnUrl } as RTCIceServer;
        if (turnUser) (turnServer as any).username = turnUser;
        if (turnPass) (turnServer as any).credential = turnPass;
        iceServers.push(turnServer);
      }
    }

    const pc = new RTCPeerConnection({ iceServers });

    /** Add tracks only ONCE (audio + video) */
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      const videoTrack = localStream.getVideoTracks()[0];

      const audioAdded = pc.getSenders().some(s => s.track?.kind === "audio");
      const videoAdded = pc.getSenders().some(s => s.track?.kind === "video");

      if (audioTrack && !audioAdded) {
        pc.addTrack(audioTrack, localStream);
      }
      if (videoTrack && !videoAdded) {
        pc.addTrack(videoTrack, localStream);
      }
    }

    pc.ontrack = (event) => {
      if (!remoteAudioRefs.current[userId]) {
        const audio = new Audio();
        audio.autoplay = true;
        remoteAudioRefs.current[userId] = audio;
      }
      remoteAudioRefs.current[userId].srcObject = event.streams[0];
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        audioSocket?.emit("ice-candidate", {
          to: userId,
          candidate: event.candidate
        });
      }
    };

    peerConnections.current[userId] = pc;
    return pc;
  };

  /** ───────────────────────
   * CREATE OFFER
   * ───────────────────────*/
  const createOffer = async (userId: string) => {
    const pc = getOrCreatePeerConnection(userId);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    audioSocket?.emit("voice-offer", { to: userId, offer });
  };

  /** ───────────────────────
   * RECEIVE OFFER
   * (Fix: avoid double setRemoteDescription)
   * ───────────────────────*/
  const handleReceiveOffer = async (from: string, offer: RTCSessionDescriptionInit) => {
    const pc = getOrCreatePeerConnection(from);

    if (pc.signalingState !== "stable") {
      console.warn("Offer received while not stable, resetting...");
      await pc.setLocalDescription({ type: "rollback" });
    }

    await pc.setRemoteDescription(offer);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    audioSocket?.emit("voice-answer", { to: from, answer });
  };

  /** ───────────────────────
   * RECEIVE ANSWER
   * ───────────────────────*/
  const handleReceiveAnswer = async (from: string, answer: RTCSessionDescriptionInit) => {
    const pc = peerConnections.current[from];
    if (!pc) return;

    if (pc.signalingState === "have-local-offer") {
      await pc.setRemoteDescription(answer);
    }
  };

  /** ───────────────────────
   * AUDIO SIGNALING EVENTS
   * ───────────────────────*/
  useEffect(() => {
    if (!audioSocket || !roomId || !localStream) return;

    audioSocket.emit("join-voice-room", roomId);

    audioSocket.on("user-joined", (userId: string) => {
      createOffer(userId);
    });

    audioSocket.on("voice-offer", async ({ from, offer }) => {
      await handleReceiveOffer(from, offer);
    });

    audioSocket.on("voice-answer", async ({ from, answer }) => {
      await handleReceiveAnswer(from, answer);
    });

    audioSocket.on("ice-candidate", ({ from, candidate }) => {
      const pc = peerConnections.current[from];
      if (pc && candidate) {
        pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    audioSocket.on("user-left", (userId: string) => {
      if (peerConnections.current[userId]) {
        peerConnections.current[userId].close();
        delete peerConnections.current[userId];
      }
      if (remoteAudioRefs.current[userId]) {
        delete remoteAudioRefs.current[userId];
      }
    });

    return () => {
      audioSocket.off("user-joined");
      audioSocket.off("voice-offer");
      audioSocket.off("voice-answer");
      audioSocket.off("ice-candidate");
      audioSocket.off("user-left");
      // Emit leave and cleanup on unmount
      try {
        audioSocket.emit("leave-voice-room", roomId);
      } catch (e) {
        // ignore
      }
      // Close peer connections and stop tracks
      Object.values(peerConnections.current).forEach(pc => {
        try { pc.close(); } catch (e) {}
      });
      peerConnections.current = {};
      if (localStream) {
        localStream.getTracks().forEach(t => {
          try { t.stop(); } catch (e) {}
        });
      }
      // cleanup remote audio elements
      Object.values(remoteAudioRefs.current).forEach(a => {
        try { a.pause(); a.srcObject = null; } catch (e) {}
      });
      remoteAudioRefs.current = {};
    };

  }, [audioSocket, roomId, localStream]);

  /**
   * Cleanup helper to leave voice room and free resources.
   * Called when user explicitly leaves or component unmounts.
   */
  const leaveVoiceRoom = () => {
    if (audioSocket && roomId) {
      try { audioSocket.emit("leave-voice-room", roomId); } catch (e) {}
    }

    Object.values(peerConnections.current).forEach(pc => {
      try { pc.close(); } catch (e) {}
    });
    peerConnections.current = {};

    if (localStream) {
      try { localStream.getTracks().forEach(t => t.stop()); } catch (e) {}
    }

    Object.values(remoteAudioRefs.current).forEach(a => {
      try { a.pause(); a.srcObject = null; } catch (e) {}
    });
    remoteAudioRefs.current = {};
  };

  /** ───────────────────────
   * CHAT SEND
   * ───────────────────────*/
  const handleSendMessage = () => {
    if (!chatSocket || !roomId || message.trim().length === 0) return;

    chatSocket.emit("sendMessage", {
      roomId,
      user: username,
      text: message.trim(),
    });

    setMessage("");
  };

  return (
    <div className="conference">
      <nav className="conference-navbar">
        <Link to="/home" className="conference-logo">
          <img src="/agorax_white.png" alt="AgoraX Logo" />
        </Link>
      </nav>

      <div className={`conference-content ${!isChatVisible ? "conference-content--full" : ""}`}>
        <div className="conference-video-section">
          <h2 style={{ color: "white", marginTop: "20px" }}>Sala: {roomId}</h2>

          <div className="video-grid">
            {isCamOn && localStream?.getVideoTracks().length ? (
              <div className="video-tile">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', background: '#000', objectFit: 'cover' }}
                />
                <p style={{ color: "white" }}>{username} (Tú)</p>
              </div>
            ) : (
              <div className="video-tile audio-only">
                <p style={{ color: "white" }}>{username} (Tú)</p>
              </div>
            )}

            {users.map(u => (
              u.socketId !== chatSocket?.id && (   
                <div key={u.socketId} className="video-tile audio-only">
                  <p style={{ color: "white" }}>{u.username}</p>
                </div>
              )
            ))}
          </div>
        </div>

        {isChatVisible && (
          <div className="conference-chat">
            <div className="chat-header"><h3>CHAT</h3></div>

            <div className="chat-messages">
              {messages.map(msg => (
                <div key={msg.id} className="chat-message">
                  <span className="chat-message-user">{msg.user}</span>
                  <p className="chat-message-text">{msg.text}</p>
                </div>
              ))}
            </div>

            <div className="chat-input">
              <input
                type="text"
                value={message}
                placeholder="Escribe un mensaje..."
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <button onClick={handleSendMessage}><IoSend /></button>
            </div>
          </div>
        )}
      </div>

      <footer className={`conference-footer ${isChatVisible ? "chat-visible" : ""}`}>
        <div className="conference-controls">

          <button
            className={`control-btn control-btn--mic ${!isMicOn ? "control-btn--off" : ""}`}
            onClick={toggleMic}
          >
            {isMicOn ? <BiMicrophone /> : <BiMicrophoneOff />}
          </button>
          <button
            className={`control-btn control-btn--cam ${!isCamOn ? "control-btn--off" : ""}`}
            onClick={toggleCamera}
          >
            {isCamOn ? <RiVideoLine /> : <RiVideoOffLine />}
          </button>

          <button className="control-btn control-btn--chat" onClick={toggleChat}>
            {isChatVisible ? <RiChatOffLine /> : <RiChat4Line />}
          </button>

          <button className="control-btn control-btn--leave" onClick={handleLeaveCall}>
            Dejar reunión
          </button>
        </div>
      </footer>

      {showLeaveModal && (
        <div className="modal-overlay" onClick={cancelLeaveCall}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">¿Salir de la reunión?</h3>
            <div className="modal-actions">
              <button className="modal-btn modal-btn--cancel" onClick={cancelLeaveCall}>
                Cancelar
              </button>
              <button className="modal-btn modal-btn--confirm" onClick={confirmLeaveCall}>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Conference;