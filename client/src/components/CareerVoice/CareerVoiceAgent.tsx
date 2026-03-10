import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  Room,
  RoomEvent,
  Track,
  type Participant,
  type TranscriptionSegment,
} from "livekit-client";
import {
  RoomAudioRenderer,
  RoomContext,
  StartAudio,
  useRoomContext,
  useTracks,
} from "@livekit/components-react";
import { Phone, PhoneOff, X, Mic, MicOff } from "lucide-react";
import { useCareerConnectionDetails } from "./useCareerConnectionDetails";

/* ─── Types ─────────────────────────────────────────────────────────── */

type AgentState = "idle" | "connecting" | "connected" | "error";

interface TranscriptEntry {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

/* ─── Main component ────────────────────────────────────────────────── */

export default function CareerVoiceAgent() {
  const room = useMemo(() => new Room(), []);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<AgentState>("idle");
  const [muted, setMuted] = useState(false);
  const { fetchConnectionDetails, getOrRefresh } =
    useCareerConnectionDetails();

  /* connect / disconnect */
  const connect = useCallback(async () => {
    setState("connecting");
    try {
      const details = await getOrRefresh();
      await room.connect(details.serverUrl, details.participantToken);
      await room.localParticipant.setMicrophoneEnabled(true);
      setState("connected");
    } catch (err) {
      console.error("Career voice connect error:", err);
      setState("error");
    }
  }, [room, getOrRefresh]);

  const disconnect = useCallback(() => {
    if (room.state !== "disconnected") room.disconnect();
    setState("idle");
  }, [room]);

  /* room events */
  useEffect(() => {
    const onDisconnected = () => {
      setState("idle");
      fetchConnectionDetails();
    };
    room.on(RoomEvent.Disconnected, onDisconnected);
    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
    };
  }, [room, fetchConnectionDetails]);

  /* cleanup on unmount */
  useEffect(() => {
    return () => {
      if (room.state !== "disconnected") room.disconnect();
    };
  }, [room]);

  /* toggle mute */
  const toggleMute = useCallback(() => {
    room.localParticipant.setMicrophoneEnabled(muted);
    setMuted(!muted);
  }, [room, muted]);

  /* open popup → auto-connect */
  const handleOpen = useCallback(() => {
    setOpen(true);
    if (state === "idle" || state === "error") connect();
  }, [state, connect]);

  /* close popup → disconnect */
  const handleClose = useCallback(() => {
    setOpen(false);
    disconnect();
  }, [disconnect]);

  return (
    <>
      {/* ── Floating trigger button ─────────────────────────────────── */}
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 transition-all hover:scale-110 hover:bg-cyan-400 active:scale-95"
          title="Talk to Career Counselor"
        >
          <Phone className="h-6 w-6" />
        </button>
      )}

      {/* ── Popup ───────────────────────────────────────────────────── */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex w-95 flex-col overflow-hidden rounded-2xl border border-white/10 bg-gray-950/95 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
          {/* header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  state === "connected"
                    ? "bg-emerald-400 shadow-emerald-400/50 shadow-sm"
                    : state === "connecting"
                    ? "animate-pulse bg-amber-400"
                    : state === "error"
                    ? "bg-red-400"
                    : "bg-white/30"
                }`}
              />
              <span className="text-sm font-semibold text-white">
                Career Counselor
              </span>
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* body */}
          <RoomContext.Provider value={room}>
            <RoomAudioRenderer />
            <StartAudio label="Start Audio" />
            <PopupBody state={state} />
          </RoomContext.Provider>

          {/* footer controls */}
          <div className="flex items-center justify-center gap-3 border-t border-white/10 px-4 py-3">
            {state === "connected" && (
              <>
                <button
                  onClick={toggleMute}
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                    muted
                      ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                  }`}
                  title={muted ? "Unmute" : "Mute"}
                >
                  {muted ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={handleClose}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600"
                  title="End Call"
                >
                  <PhoneOff className="h-4 w-4" />
                </button>
              </>
            )}
            {state === "connecting" && (
              <p className="text-sm text-white/50">Connecting…</p>
            )}
            {state === "idle" && (
              <button
                onClick={connect}
                className="flex items-center gap-2 rounded-lg bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-400 transition hover:bg-cyan-500/30"
              >
                <Phone className="h-4 w-4" /> Start Call
              </button>
            )}
            {state === "error" && (
              <button
                onClick={connect}
                className="flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/30"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Popup body — avatar + transcript ──────────────────────────────── */

function PopupBody({ state }: { state: AgentState }) {
  const room = useRoomContext();
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* Capture video tracks for the avatar */
  const videoTracks = useTracks([Track.Source.Camera], {
    onlySubscribed: true,
  });

  const agentVideoTrack = videoTracks.find(
    (t) => t.participant.isAgent || t.participant.identity.includes("agent")
  );

  /* Transcription listener */
  useEffect(() => {
    if (!room) return;

    const handler = (
      segments: TranscriptionSegment[],
      participant?: Participant
    ) => {
      for (const seg of segments) {
        if (!seg.text?.trim()) continue;
        const isAgent =
          participant?.isAgent ||
          participant?.identity.includes("agent") ||
          false;

        setTranscripts((prev) => {
          const existing = prev.find((t) => t.id === seg.id);
          if (existing) {
            return prev.map((t) =>
              t.id === seg.id ? { ...t, text: seg.text } : t
            );
          }
          return [
            ...prev,
            {
              id: seg.id,
              role: isAgent ? "assistant" : "user",
              text: seg.text,
              timestamp: Date.now(),
            },
          ];
        });
      }
    };

    room.on(RoomEvent.TranscriptionReceived, handler);
    return () => {
      room.off(RoomEvent.TranscriptionReceived, handler);
    };
  }, [room]);

  /* auto-scroll */
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [transcripts]);

  if (state === "connecting") {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="text-sm text-white/50">Connecting to counselor…</p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-red-400">
          Failed to connect. Please try again.
        </p>
      </div>
    );
  }

  if (state === "idle") {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-center text-sm text-white/40">
          Talk to your AI career counselor about
          <br />
          your career roadmap &amp; goals.
        </p>
      </div>
    );
  }

  /* connected */
  return (
    <div className="flex flex-col" style={{ height: 320 }}>
      {/* Avatar area */}
      {agentVideoTrack ? (
        <div className="relative h-40 w-full overflow-hidden bg-black">
          <video
            ref={(el) => {
              if (el && agentVideoTrack.publication?.track) {
                agentVideoTrack.publication.track.attach(el);
              }
            }}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <AudioPulse />
      )}

      {/* Transcript */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-2 overflow-y-auto px-4 py-3"
      >
        {transcripts.length === 0 && (
          <p className="text-center text-xs text-white/30">
            Listening…
          </p>
        )}
        {transcripts.map((t) => (
          <div
            key={t.id}
            className={`text-xs leading-relaxed ${
              t.role === "assistant" ? "text-cyan-300" : "text-white/70"
            }`}
          >
            <span className="font-semibold">
              {t.role === "assistant" ? "Counselor" : "You"}:{" "}
            </span>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Audio pulse visualizer (fallback when no video) ────────────────── */

function AudioPulse() {
  const heights = useMemo(() => [18, 28, 14, 24, 20], []);

  return (
    <div className="flex h-28 items-center justify-center gap-1">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-cyan-400"
          style={{
            animation: `pulse-bar 1.2s ease-in-out ${i * 0.15}s infinite`,
            height: h,
          }}
        />
      ))}
      <style>{`
        @keyframes pulse-bar {
          0%, 100% { transform: scaleY(0.4); opacity: 0.3; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
