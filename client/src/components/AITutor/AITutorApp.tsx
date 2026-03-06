import { useEffect, useMemo, useState } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { motion } from 'motion/react';
import { RoomAudioRenderer, RoomContext, StartAudio } from '@livekit/components-react';
import toast from 'react-hot-toast';
import { TutorSessionView } from './TutorSessionView';
import { TutorWelcome } from './TutorWelcome';
import { RpcHandler } from './RpcHandler';
import useConnectionDetails from './hooks/useConnectionDetails';
import { TUTOR_CONFIG } from './utils';
import Navbar from '@/components/layout/Navbar';

const MotionWelcome = motion.create(TutorWelcome);
const MotionSessionView = motion.create(TutorSessionView);

export function AITutorApp() {
    const room = useMemo(() => new Room(), []);
    const [sessionStarted, setSessionStarted] = useState(false);
    const { refreshConnectionDetails, existingOrRefreshConnectionDetails } = useConnectionDetails();

    useEffect(() => {
        const onDisconnected = () => {
            setSessionStarted(false);
            refreshConnectionDetails();
            toast('Session ended', { icon: '👋' });
        };

        const onMediaDevicesError = (error: Error) => {
            toast.error(`Media device error: ${error.message}`);
        };

        room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);
        room.on(RoomEvent.Disconnected, onDisconnected);

        return () => {
            room.off(RoomEvent.Disconnected, onDisconnected);
            room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
        };
    }, [room, refreshConnectionDetails]);

    useEffect(() => {
        let aborted = false;

        if (sessionStarted && room.state === 'disconnected') {
            Promise.all([
                room.localParticipant.setMicrophoneEnabled(true, undefined, {
                    preConnectBuffer: TUTOR_CONFIG.isPreConnectBufferEnabled,
                }),
                existingOrRefreshConnectionDetails().then((connectionDetails) =>
                    room.connect(connectionDetails.serverUrl, connectionDetails.participantToken)
                ),
            ]).catch((error) => {
                if (aborted) return;

                toast.error(`Connection error: ${error.message}`);
                setSessionStarted(false);
            });
        }

        return () => {
            aborted = true;
            if (room.state !== 'disconnected') {
                room.disconnect();
            }
        };
    }, [room, sessionStarted, existingOrRefreshConnectionDetails]);

    return (
        <div className="relative min-h-screen bg-black">
            <Navbar />
            {/* Welcome Screen */}
            <MotionWelcome
                key="welcome"
                startButtonText={TUTOR_CONFIG.startButtonText}
                onStartCall={() => setSessionStarted(true)}
                disabled={sessionStarted}
                initial={{ opacity: 1 }}
                animate={{ opacity: sessionStarted ? 0 : 1 }}
                transition={{ duration: 0.4 }}
                style={{ pointerEvents: sessionStarted ? 'none' : 'auto' }}
            />

            {/* Session View */}
            <RoomContext.Provider value={room}>
                <RoomAudioRenderer />
                <StartAudio label="Start Audio" />

                <MotionSessionView
                    key="session-view"
                    config={TUTOR_CONFIG}
                    disabled={!sessionStarted}
                    sessionStarted={sessionStarted}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: sessionStarted ? 1 : 0 }}
                    transition={{ duration: 0.4, delay: sessionStarted ? 0.3 : 0 }}
                />

                <RpcHandler />
            </RoomContext.Provider>
        </div>
    );
}
