import { useMemo } from 'react';
import { Track } from 'livekit-client';
import { AnimatePresence, motion } from 'motion/react';
import {
    type TrackReference,
    useLocalParticipant,
    useTracks,
    useVoiceAssistant,
} from '@livekit/components-react';
import { cn } from '../utils';
import { AgentTile } from './AgentTile';
import { AvatarTile } from './AvatarTile';
import { VideoTile } from './VideoTile';

function useLocalTrackRef(source: Track.Source) {
    const { localParticipant } = useLocalParticipant();
    const publication = localParticipant.getTrackPublication(source);
    const trackRef = useMemo<TrackReference | undefined>(
        () => (publication ? { source, participant: localParticipant, publication } : undefined),
        [source, publication, localParticipant]
    );
    return trackRef;
}

interface MediaTilesProps {
    chatOpen: boolean;
}

export function MediaTiles({ chatOpen }: MediaTilesProps) {
    const {
        state: agentState,
        audioTrack: agentAudioTrack,
        videoTrack: agentVideoTrack,
    } = useVoiceAssistant();
    const [screenShareTrack] = useTracks([Track.Source.ScreenShare]);
    const cameraTrack = useLocalTrackRef(Track.Source.Camera);

    const isCameraEnabled = cameraTrack && !cameraTrack.publication.isMuted;
    const isScreenShareEnabled = screenShareTrack && !screenShareTrack.publication.isMuted;
    const hasSecondTile = isCameraEnabled || isScreenShareEnabled;
    const isAvatar = agentVideoTrack !== undefined;

    const animationTransition = { type: 'spring' as const, stiffness: 500, damping: 50 };

    return (
        <div className="pointer-events-none fixed inset-x-0 top-20 bottom-36 z-40">
            <div className="relative mx-auto h-full max-w-4xl px-4">
                <div className="flex h-full flex-col items-center justify-center gap-4">
                    {/* Avatar / Agent Tile */}
                    <AnimatePresence mode="popLayout">
                        {isAvatar ? (
                            <motion.div
                                key="avatar"
                                layoutId="avatar"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={animationTransition}
                                className={cn(
                                    'transition-all duration-300',
                                    chatOpen ? 'h-24 w-auto' : 'h-auto max-h-[60vh] w-full max-w-2xl'
                                )}
                            >
                                <AvatarTile videoTrack={agentVideoTrack} className="h-full w-full rounded-2xl border border-white/10 shadow-lg" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="agent"
                                layoutId="agent"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={animationTransition}
                                className={cn(
                                    'transition-all duration-300',
                                    chatOpen ? 'h-24 w-24' : 'h-48 w-48'
                                )}
                            >
                                <AgentTile state={agentState} audioTrack={agentAudioTrack} className="h-full w-full" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Camera / Screen Share Tiles */}
                    {hasSecondTile && (
                        <div className="flex gap-4">
                            <AnimatePresence>
                                {isCameraEnabled && cameraTrack && (
                                    <motion.div
                                        key="camera"
                                        layoutId="camera"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={animationTransition}
                                    >
                                        <VideoTile
                                            trackRef={cameraTrack}
                                            className="h-24 w-32 rounded-lg border border-white/10"
                                        />
                                    </motion.div>
                                )}
                                {isScreenShareEnabled && screenShareTrack && (
                                    <motion.div
                                        key="screen"
                                        layoutId="screen"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={animationTransition}
                                    >
                                        <VideoTile
                                            trackRef={screenShareTrack}
                                            className="h-24 w-32 rounded-lg border border-cyan-500/50"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
