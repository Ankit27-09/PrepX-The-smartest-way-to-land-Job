import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  PreJoin,
  RoomContext,
} from '@livekit/components-react';
import type { LocalUserChoices } from '@livekit/components-react';
import {
  Room,
  VideoPresets,
  RoomEvent,
} from 'livekit-client';
import type {
  RoomOptions,
  RoomConnectOptions,
  TrackPublishDefaults,
  VideoCaptureOptions,
} from 'livekit-client';
import '@livekit/components-styles';
import { Toaster } from 'react-hot-toast';
import type { ConnectionDetails } from '@/lib/interview/livekit-types';
import { KeyboardShortcuts } from '@/lib/interview/KeyboardShortcuts';
import { SettingsMenu } from '@/lib/interview/SettingsMenu';
import { RecordingIndicator } from '@/lib/interview/RecordingIndicator';
import { useLowCPUOptimizer } from '@/lib/interview/usePerformanceOptimiser';
import { InterviewVideoConference } from '@/components/interview/InterviewVideoConference';
import { ProctorShield } from '@/components/interview/ProctorShield';
import '@/styles/InterviewRoom.css';

const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || "http://localhost:8000/api";
const CONNECTION_DETAILS_ENDPOINT = `${FASTAPI_URL}/livekit/connection-details`;

// ── Main page: PreJoin → VideoConference ─────────────────────────────────

export default function InterviewRoomPage() {
  const [searchParams] = useSearchParams();
  const interviewId = searchParams.get('id');
  const duration = parseInt(searchParams.get('duration') || '30', 10);

  const [preJoinChoices, setPreJoinChoices] = React.useState<LocalUserChoices | undefined>(
    undefined,
  );
  const [connectionDetails, setConnectionDetails] = React.useState<
    ConnectionDetails | undefined
  >(undefined);

  const preJoinDefaults = React.useMemo(
    () => ({
      username: '',
      videoEnabled: true,
      audioEnabled: true,
    }),
    [],
  );

  const handlePreJoinSubmit = React.useCallback(
    async (values: LocalUserChoices) => {
      setPreJoinChoices(values);

      // Enter browser fullscreen mode (hides tabs, address bar, title bar)
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        // Fullscreen may be blocked by browser — proceed anyway
      }

      try {
        const res = await fetch(CONNECTION_DETAILS_ENDPOINT, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interview_id: interviewId,
            participant_name: values.username || 'Candidate',
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.detail || `Failed to get connection details (${res.status})`);
        }

        const data = await res.json();
        setConnectionDetails({
          serverUrl: data.server_url,
          roomName: data.room_name,
          participantToken: data.participant_token,
          participantName: values.username || 'Candidate',
        });
      } catch (error) {
        console.error(error);
        alert(
          `Failed to join interview: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        setPreJoinChoices(undefined);
      }
    },
    [interviewId],
  );

  const handlePreJoinError = React.useCallback((e: any) => console.error(e), []);

  if (!interviewId) {
    return (
      <main className="interview-fullscreen dark">
        <div className="interview-error-screen">
          <div className="error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2>Missing Interview ID</h2>
          <p>No interview session found. Please go back and start from the interviews page.</p>
          <button className="btn-back-interviews" onClick={() => window.location.href = '/interviews'}>
            Back to Interviews
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="interview-fullscreen dark" data-lk-theme="default">
      <Toaster />
      {connectionDetails === undefined || preJoinChoices === undefined ? (
        <div className="prejoin-fullscreen">
          <div className="prejoin-container">
            <div className="prejoin-header">
              <div className="prejoin-logo">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#06b6d4" strokeWidth="2" />
                  <path d="M8 12l3 3 5-6" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>PrepX Interview</span>
              </div>
              <p className="prejoin-subtitle">Set up your camera and microphone before joining the session</p>
            </div>
            <PreJoin
              defaults={preJoinDefaults}
              onSubmit={handlePreJoinSubmit}
              onError={handlePreJoinError}
            />
          </div>
        </div>
      ) : (
        <VideoConferenceComponent
          connectionDetails={connectionDetails}
          userChoices={preJoinChoices}
          duration={duration}
        />
      )}
    </main>
  );
}

// ── VideoConference component ─────────────────────────────────────────────

function VideoConferenceComponent(props: {
  userChoices: LocalUserChoices;
  connectionDetails: ConnectionDetails;
  duration: number;
}) {
  const navigate = useNavigate();

  const roomOptions = React.useMemo((): RoomOptions => {
    const videoCaptureDefaults: VideoCaptureOptions = {
      deviceId: props.userChoices.videoDeviceId ?? undefined,
      resolution: VideoPresets.h720,
    };
    const publishDefaults: TrackPublishDefaults = {
      dtx: false,
      videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216],
      red: true,
      videoCodec: 'vp9',
    };
    return {
      videoCaptureDefaults,
      publishDefaults,
      audioCaptureDefaults: {
        deviceId: props.userChoices.audioDeviceId ?? undefined,
      },
      adaptiveStream: true,
      dynacast: true,
      singlePeerConnection: true,
    };
  }, [props.userChoices]);

  const room = React.useMemo(() => new Room(roomOptions), []);

  const connectOptions = React.useMemo(
    (): RoomConnectOptions => ({
      autoSubscribe: true,
    }),
    [],
  );

  const handleOnLeave = React.useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    navigate('/interviews');
  }, [navigate]);
  const handleError = React.useCallback((error: Error) => {
    console.error(error);
    alert(`Encountered an unexpected error, check the console logs for details: ${error.message}`);
  }, []);

  React.useEffect(() => {
    room.on(RoomEvent.Disconnected, handleOnLeave);
    room.on(RoomEvent.MediaDevicesError, handleError);

    room
      .connect(
        props.connectionDetails.serverUrl,
        props.connectionDetails.participantToken,
        connectOptions,
      )
      .catch((error) => {
        handleError(error);
      });

    if (props.userChoices.videoEnabled) {
      room.localParticipant.setCameraEnabled(true).catch((error) => {
        handleError(error);
      });
    }
    if (props.userChoices.audioEnabled) {
      room.localParticipant.setMicrophoneEnabled(true).catch((error) => {
        handleError(error);
      });
    }

    return () => {
      room.off(RoomEvent.Disconnected, handleOnLeave);
      room.off(RoomEvent.MediaDevicesError, handleError);
    };
  }, [room, props.connectionDetails, props.userChoices]);

  const lowPowerMode = useLowCPUOptimizer(room);

  // Keep fullscreen active — re-enter if browser exits (e.g. screen share picker)
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setTimeout(() => {
          document.documentElement.requestFullscreen().catch(() => {});
        }, 300);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  React.useEffect(() => {
    if (lowPowerMode) {
      console.warn('Low power mode enabled');
    }
  }, [lowPowerMode]);

  return (
    <div className="lk-room-container">
      <RoomContext.Provider value={room}>
        <KeyboardShortcuts />
        <ProctorShield />
        <InterviewVideoConference
          SettingsComponent={SettingsMenu}
          durationMinutes={props.duration}
        />
        <RecordingIndicator />
      </RoomContext.Provider>
    </div>
  );
}
