import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { BiMicrophone, BiMicrophoneOff } from "react-icons/bi";
import { IoSend } from "react-icons/io5";
import { RiChat4Line, RiChatOffLine, RiVideoOnLine, RiVideoOffLine } from "react-icons/ri";
import "./Conference.scss";

import { useChatSocket, useAudioSocket, useVideoSocket } from "../../context/SocketContext";
import useAuthStore from "../../stores/useAuthStore";

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

interface PeerMetadata {
  username: string;
  isMicOn: boolean;
}

const VideoTile: React.FC<{ stream: MediaStream; username: string; isMicOn: boolean; isLocal?: boolean }> = ({ stream, username, isMicOn, isLocal }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="video-tile">
      <video
        ref={videoRef}
        autoPlay
        muted={isLocal} // Mute local video to prevent feedback
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <div className="video-tile-overlay">
        <span className="video-tile-name">{username} {isLocal && '(Tú)'}</span>
        <span className="video-tile-icon">
          {isMicOn ? <BiMicrophone /> : <BiMicrophoneOff color="red" />}
        </span>
      </div>
    </div>
  );
};

const Conference: React.FC = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();

  const chatSocket = useChatSocket();
  const audioSocket = useAudioSocket();
  const videoSocket = useVideoSocket();

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<RoomUser[]>([]);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  
  // State for remote streams and metadata
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [peerMetadata, setPeerMetadata] = useState<Record<string, PeerMetadata>>({});

  const videoPeerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const videoPeersSeenRef = useRef<Set<string>>(new Set());
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recorderIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorderStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recorderShouldRestartRef = useRef<boolean>(true);
  const remoteAudioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const pendingVideoCandidates = useRef<Record<string, RTCIceCandidateInit[]>>({});

  const { user: authUser } = useAuthStore();
  const user = authUser || JSON.parse(localStorage.getItem("user") || "{}");
  
  const rawName = user?.name || user?.displayName || user?.email?.split("@")[0] || "Usuario";
  // Shorten name to First + Last (max 2 words) for better display
  const username = rawName.trim().split(/\s+/).slice(0, 2).join(" ");

  // Refs for socket callbacks to access latest state
  const usernameRef = useRef(username);
  const isMicOnRef = useRef(isMicOn);

  useEffect(() => { usernameRef.current = username; }, [username]);
  useEffect(() => { isMicOnRef.current = isMicOn; }, [isMicOn]);

  // Broadcast updated user info whenever username changes (e.g. after auth loads)
  useEffect(() => {
    if (videoSocket && roomId && username && username !== "Usuario") {
      videoSocket.emit('signal', {
        roomId,
        data: {
          type: 'user-info',
          username,
          isMicOn: isMicOnRef.current
        }
      });
    }
  }, [username, videoSocket, roomId]);

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

    // Broadcast mic status change
    if (videoSocket && roomId) {
      videoSocket.emit('signal', {
        roomId,
        data: {
          type: 'mic-toggled',
          isMicOn: newEnabled
        }
      });
    }

    console.log("Mic:", audioTrack.enabled ? "ON" : "OFF");
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
          // Local video update handled by state/props now
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
    setShowLeaveModal(false);

    try {
      if (chatSocket && roomId) chatSocket.emit("leaveRoom", roomId);
    } catch (e) {}

    leaveVoiceRoom();

    try {
      const mySocketId = chatSocket?.id;
      if (mySocketId) setUsers(prev => prev.filter(u => u.socketId !== mySocketId));
    } catch (e) {}

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

    try {
      const VITE_BACKEND = (import.meta as any).env?.VITE_BACKEND_BASE || (import.meta as any).env?.VITE_API_BASE_URL || '';
      let backendBase = String(VITE_BACKEND || '').replace(/\/+$/,'');
      backendBase = backendBase.replace(/\/api$/i, '');
      if (backendBase && email) {
        const url = `${backendBase}/api/meetings/${encodeURIComponent(roomId || '')}/participants`;
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
  }, [chatSocket, roomId, username, user?.email, user?.id]);

  /** ───────────────────────
   * GET USER MEDIA (audio + video)
   * ───────────────────────*/
  useEffect(() => {
    // Eliminamos width/height fijos para permitir la resolución nativa (mejor para móviles)
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .then(stream => {
        setLocalStream(stream);
      })
      .catch(err => console.error("Error accessing microphone/camera:", err));
  }, []);

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
        } catch (e) {}
      }
      return '';
    })();

    if (!isMicOn) {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try { recorderRef.current.stop(); } catch (e) {}
      }
      recorderRef.current = null;
      return;
    }

    try {
      recorderShouldRestartRef.current = true;
      const audioTracks = localStream.getAudioTracks();
      if (!audioTracks || audioTracks.length === 0) {
        console.warn('[recorder] No audio tracks available on localStream; skipping recorder creation');
        return;
      }

      const track = audioTracks[0];
      if (track.readyState !== 'live') {
        console.warn('[recorder] Audio track not live', { readyState: track.readyState });
      }

      const recorderStream = new MediaStream([track]);

      let mediaRecorder: MediaRecorder | undefined;
      const optionsList: Array<MediaRecorderOptions | {}> = [];
      if (mimeType) optionsList.push({ mimeType, audioBitsPerSecond: 48000 } as MediaRecorderOptions);
      optionsList.push({ audioBitsPerSecond: 48000 } as MediaRecorderOptions);
      if (mimeType) optionsList.push({ mimeType } as MediaRecorderOptions);
      optionsList.push({} as {});

      let lastErr: any = null;
      for (const opts of optionsList) {
        try {
          mediaRecorder = Object.keys(opts as any).length ? new MediaRecorder(recorderStream as any, opts as any) : new MediaRecorder(recorderStream as any);
          break;
        } catch (e) {
          lastErr = e;
        }
      }

      if (!mediaRecorder) {
        console.error('[recorder] MediaRecorder not available after attempts', lastErr);
        return;
      }

      recorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (ev: BlobEvent) => {
        if (!isMicOn) return;
        if (!ev.data || ev.data.size === 0) return;

        if (ev.data.size < 4000) {
          return;
        }

        try {
          const arrayBuffer = await ev.data.arrayBuffer();
          const VITE_RESUME = (import.meta as any).env?.VITE_RESUME_API_BASE || (import.meta as any).env?.VITE_API_BASE_URL || (import.meta as any).env?.VITE_API_URL || '';
          const base = VITE_RESUME.replace(/\/+$/,'');
          const query = new URLSearchParams({
            roomId: roomId || '',
            userId: username || '',
          });
          if (user?.email) query.set('email', user.email);

          const endpoint = `${base}/audio/transcribe-chunk?${query.toString()}`;

          try {
            await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': ev.data.type || 'audio/webm' },
              body: arrayBuffer,
            });
          } catch (err) {}
        } catch (err) {}
      };

      mediaRecorder.onerror = (e) => console.warn('MediaRecorder error', e);

      try {
        try { if (mediaRecorder.state === 'recording') mediaRecorder.stop(); } catch (_) {}

        recorderStartTimeoutRef.current = window.setTimeout(() => {
          try {
            mediaRecorder.start();
          } catch (startErr) {
            console.warn('[recorder] mediaRecorder.start failed', startErr);
            return;
          }

              recorderStartTimeoutRef.current = window.setTimeout(() => {
                mediaRecorder.onstop = () => {
                  try {
                    if (!isMicOn) {
                      return;
                    }
                  } catch (e) {}

                  if (!recorderShouldRestartRef.current) return;

                  setTimeout(() => {
                    try {
                      if (mediaRecorder.state === 'inactive') {
                        mediaRecorder.start();
                      }
                    } catch (e) {}
                  }, 400);
                };

                recorderIntervalRef.current = window.setInterval(() => {
                  try {
                    if (mediaRecorder.state === 'recording') {
                      mediaRecorder.stop();
                    }
                  } catch (e) {}
                }, 12000) as unknown as ReturnType<typeof setInterval>;

              }, 500) as unknown as ReturnType<typeof setTimeout>;

        }, 3000) as unknown as ReturnType<typeof setTimeout>;
      } catch (err) {
        console.warn('Failed to start MediaRecorder', err);
      }

      return () => {
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
   * ───────────────────────*/
  const getOrCreatePeerConnection = (userId: string) => {
    if (peerConnections.current[userId]) return peerConnections.current[userId];

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
      try {
        audioSocket.emit("leave-voice-room", roomId);
      } catch (e) {}
      Object.values(peerConnections.current).forEach(pc => {
        try { pc.close(); } catch (e) {}
      });
      peerConnections.current = {};
      if (localStream) {
        localStream.getTracks().forEach(t => {
          try { t.stop(); } catch (e) {}
        });
      }
      Object.values(remoteAudioRefs.current).forEach(a => {
        try { a.pause(); a.srcObject = null; } catch (e) {}
      });
      remoteAudioRefs.current = {};
    };

  }, [audioSocket, roomId, localStream]);

  /**
   * Cleanup helper to leave voice room and free resources.
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
   * VIDEO: Get or Create Peer Connection
   * ───────────────────────*/
  const getOrCreateVideoPeerConnection = (peerId: string) => {
    if (videoPeerConnections.current[peerId]) {
      return videoPeerConnections.current[peerId];
    }

    let iceServers: RTCIceServer[] = [];
    const iceEnv = (import.meta as any).env?.VITE_ICE_SERVERS;
    if (iceEnv) {
      try {
        const parsed = JSON.parse(iceEnv as string) as RTCIceServer[];
        if (Array.isArray(parsed) && parsed.length) {
          iceServers = parsed;
          console.log('[video] using ICE servers from VITE_ICE_SERVERS');
        }
      } catch (e) {
        console.warn('[video] Failed to parse VITE_ICE_SERVERS', e);
      }
    }

    if (iceServers.length === 0) {
      const videoServerUrl = (import.meta as any).env?.VITE_VIDEO_SOCKET_URL || 'http://localhost:3000';
      fetch(`${videoServerUrl}/ice.json`, { signal: AbortSignal.timeout(3000) })
        .then(r => r.json())
        .then(data => {
          console.log('[video] fetched ICE servers from server', data.iceServers);
        })
        .catch(e => console.warn('[video] could not fetch ICE servers from server, using defaults', e?.message));
    }

    const pc = new RTCPeerConnection({ iceServers });

    if (localStream && isCamOn) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        const alreadyAdded = pc.getSenders().some(s => s.track?.kind === 'video');
        if (!alreadyAdded) {
          pc.addTrack(videoTrack, localStream);
        }
      }
    }

    pc.ontrack = (event) => {
      console.log('[video] ontrack received from', peerId);
      // Update state instead of DOM
      setRemoteStreams(prev => ({
        ...prev,
        [peerId]: event.streams[0]
      }));

      // If we don't have metadata for this peer yet, request it
      if (!peerMetadata[peerId]) {
        videoSocket?.emit('signal', {
          roomId,
          data: {
            type: 'request-user-info',
            to: peerId
          }
        });
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        videoSocket?.emit('signal', {
          roomId,
          data: {
            type: 'candidate',
            candidate: event.candidate,
            to: peerId
          }
        });
      }
    };

    videoPeerConnections.current[peerId] = pc;
    return pc;
  };

  /** ───────────────────────
   * VIDEO: Create Offer
   * ───────────────────────*/
  const createVideoOffer = async (peerId: string) => {
    const pc = getOrCreateVideoPeerConnection(peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    videoSocket?.emit('signal', {
      roomId,
      data: {
        type: 'offer',
        sdp: offer,
        to: peerId
      }
    });
  };

  /** ───────────────────────
   * VIDEO: Handle Offer
   * ───────────────────────*/
  const handleVideoOffer = async (from: string, sdp: RTCSessionDescriptionInit) => {
    const pc = getOrCreateVideoPeerConnection(from);

    try {
      if (pc.signalingState !== 'stable') {
        console.warn('[video] offer received in state', pc.signalingState, '- rolling back');
        try {
          await pc.setLocalDescription({ type: 'rollback' });
        } catch (e) {
          console.warn('[video] rollback failed', e);
        }
      }

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));

      const queued = pendingVideoCandidates.current[from];
      if (queued && queued.length) {
        for (const c of queued) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          } catch (e) {
            console.warn('[video] failed to add queued ICE candidate', e);
          }
        }
        delete pendingVideoCandidates.current[from];
      }
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      videoSocket?.emit('signal', {
        roomId,
        data: {
          type: 'answer',
          sdp: answer,
          to: from
        }
      });
    } catch (e) {
      console.error('[video] error handling offer', e);
    }
  };

  /** ───────────────────────
   * VIDEO: Handle Answer
   * ───────────────────────*/
  const handleVideoAnswer = async (from: string, sdp: RTCSessionDescriptionInit) => {
    const pc = videoPeerConnections.current[from];
    if (!pc) return;

    if (pc.signalingState === 'have-local-offer') {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));

      const queued = pendingVideoCandidates.current[from];
      if (queued && queued.length) {
        for (const c of queued) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          } catch (e) {
            console.warn('[video] failed to add queued ICE candidate', e);
          }
        }
        delete pendingVideoCandidates.current[from];
      }
    }
  };

  /** ───────────────────────
   * VIDEO: Handle ICE Candidate
   * ───────────────────────*/
  const handleVideoIceCandidate = (from: string, candidate: RTCIceCandidateInit) => {
    const pc = videoPeerConnections.current[from];
    if (!pc || !candidate) return;

    if (!pc.remoteDescription) {
      if (!pendingVideoCandidates.current[from]) {
        pendingVideoCandidates.current[from] = [];
      }
      pendingVideoCandidates.current[from].push(candidate);
      return;
    }

    pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => 
      console.warn('[video] failed to add ICE candidate', e)
    );
  };

  /** ───────────────────────
   * VIDEO: Handle Video Toggle (sync with isCamOn)
   * ───────────────────────*/
  useEffect(() => {
    if (!localStream) return;

    const videoTrack = localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    videoTrack.enabled = isCamOn;

    Object.values(videoPeerConnections.current).forEach(pc => {
      pc.getSenders().forEach(sender => {
        if (sender.track && sender.track.kind === 'video') {
          sender.track.enabled = isCamOn;
        }
      });
    });

    console.log('[video] toggled to', isCamOn ? 'ON' : 'OFF');
  }, [isCamOn, localStream]);

  /** ───────────────────────
   * VIDEO: Video Socket Events
   * ───────────────────────*/
  useEffect(() => {
    if (!videoSocket || !roomId || !localStream) return;

    videoSocket.emit('join', roomId);

    // Broadcast my info when I join
    // Note: We use refs here to get the current value at the moment of joining,
    // but the separate useEffect above handles updates if username changes later.
    videoSocket.emit('signal', {
      roomId,
      data: {
        type: 'user-info',
        username: usernameRef.current,
        isMicOn: isMicOnRef.current
      }
    });

    videoSocket.on('peer-joined', (peerId: string) => {
      if (videoPeersSeenRef.current.has(peerId)) {
        console.log('[video] ignoring duplicate peer-joined', peerId);
        return;
      }
      videoPeersSeenRef.current.add(peerId);
      console.log('[video] peer-joined', peerId);

      // Send my info to the new peer
      videoSocket.emit('signal', {
        roomId,
        data: {
          type: 'user-info',
          username: usernameRef.current,
          isMicOn: isMicOnRef.current,
          to: peerId
        }
      });

      if (videoSocket.id && videoSocket.id > peerId) {
        console.log('[video] creating offer to', peerId, '(I am initiator)');
        createVideoOffer(peerId);
      } else {
        console.log('[video] waiting for offer from', peerId, '(I am polite)');
      }

      // Request their info as well (handshake)
      videoSocket.emit('signal', {
        roomId,
        data: {
          type: 'request-user-info',
          to: peerId
        }
      });
    });

    videoSocket.on('signal', ({ from, data }: { from: string; data: any }) => {
      console.log('[video] signal received from', from, data.type);
      
      if (data.type === 'offer') {
        handleVideoOffer(from, data.sdp);
      } else if (data.type === 'answer') {
        handleVideoAnswer(from, data.sdp);
      } else if (data.type === 'candidate') {
        handleVideoIceCandidate(from, data.candidate);
      } else if (data.type === 'user-info') {
        setPeerMetadata(prev => ({
          ...prev,
          [from]: {
            username: data.username,
            isMicOn: data.isMicOn
          }
        }));
      } else if (data.type === 'request-user-info') {
        // Reply with my info
        videoSocket.emit('signal', {
          roomId,
          data: {
            type: 'user-info',
            username: usernameRef.current,
            isMicOn: isMicOnRef.current,
            to: from
          }
        });
      } else if (data.type === 'mic-toggled') {
        setPeerMetadata(prev => ({
          ...prev,
          [from]: {
            ...(prev[from] || { username: 'Usuario' }),
            isMicOn: data.isMicOn
          }
        }));
      }
    });

    videoSocket.on('peer-left', (peerId: string) => {
      console.log('[video] peer-left', peerId);
      videoPeersSeenRef.current.delete(peerId);
      if (videoPeerConnections.current[peerId]) {
        videoPeerConnections.current[peerId].close();
        delete videoPeerConnections.current[peerId];
      }
      
      // Remove from state
      setRemoteStreams(prev => {
        const next = { ...prev };
        delete next[peerId];
        return next;
      });
      setPeerMetadata(prev => {
        const next = { ...prev };
        delete next[peerId];
        return next;
      });
    });

    return () => {
      videoSocket.off('peer-joined');
      videoSocket.off('signal');
      videoSocket.off('peer-left');
      try {
        videoSocket.emit('leave', roomId);
      } catch (e) {}
      
      Object.keys(videoPeerConnections.current).forEach(peerId => {
        try {
          videoPeerConnections.current[peerId].close();
        } catch (e) {}
        delete videoPeerConnections.current[peerId];
      });
      videoPeersSeenRef.current.clear();
      setRemoteStreams({});
      setPeerMetadata({});
    };
  }, [videoSocket, roomId, localStream]);

  /** ───────────────────────
   * CHAT SCROLL LOGIC
   * ───────────────────────*/
  const handleChatScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      // Si la distancia al fondo es menor a 50px, consideramos que está "abajo" y activamos autoscroll
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      shouldAutoScrollRef.current = isAtBottom;
    }
  };

  useEffect(() => {
    if (isChatVisible && shouldAutoScrollRef.current && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isChatVisible]);

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
            {/* Local Video */}
            {localStream && (
              <VideoTile 
                stream={localStream} 
                username={username} 
                isMicOn={isMicOn} 
                isLocal={true} 
              />
            )}

            {/* Remote Videos */}
            {Object.entries(remoteStreams).map(([peerId, stream]) => (
              <VideoTile
                key={peerId}
                stream={stream}
                username={peerMetadata[peerId]?.username || 'Usuario'}
                isMicOn={peerMetadata[peerId]?.isMicOn ?? true} // Default to true if unknown
                isLocal={false}
              />
            ))}
          </div>
        </div>

        {isChatVisible && (
          <div className="conference-chat">
            <div className="chat-header"><h3>CHAT</h3></div>

            <div className="chat-messages" ref={chatContainerRef} onScroll={handleChatScroll}>
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
            {isCamOn ? <RiVideoOnLine /> : <RiVideoOffLine />}
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
