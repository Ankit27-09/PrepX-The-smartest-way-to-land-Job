import { useCallback, useMemo } from 'react';
import { Track } from 'livekit-client';
import {
    usePersistentUserChoices,
    useLocalParticipant,
    useRoomContext,
    useTrackMutedIndicator,
} from '@livekit/components-react';

export interface UseAgentControlBarProps {
    controls?: {
        microphone?: boolean;
        camera?: boolean;
        screenShare?: boolean;
        leave?: boolean;
        chat?: boolean;
    };
    saveUserChoices?: boolean;
}

export function useAgentControlBar({
    controls,
    saveUserChoices = true,
}: UseAgentControlBarProps = {}) {
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();

    const micMutedIndicator = useTrackMutedIndicator({
        source: Track.Source.Microphone,
        participant: localParticipant,
    });
    const cameraMutedIndicator = useTrackMutedIndicator({
        source: Track.Source.Camera,
        participant: localParticipant,
    });
    const screenShareMutedIndicator = useTrackMutedIndicator({
        source: Track.Source.ScreenShare,
        participant: localParticipant,
    });

    const micTrackRef = useMemo(
        () => ({
            participant: localParticipant,
            source: Track.Source.Microphone,
            publication: localParticipant.getTrackPublication(Track.Source.Microphone),
        }),
        [localParticipant]
    );

    const {
        saveAudioInputDeviceId,
        saveVideoInputDeviceId,
    } = usePersistentUserChoices({ preventSave: !saveUserChoices });

    const visibleControls = useMemo(
        () => ({
            microphone: controls?.microphone ?? true,
            camera: controls?.camera ?? true,
            screenShare: controls?.screenShare ?? true,
            leave: controls?.leave ?? true,
            chat: controls?.chat ?? true,
        }),
        [controls]
    );

    const handleAudioDeviceChange = useCallback(
        (deviceId: string) => {
            room.switchActiveDevice('audioinput', deviceId);
            saveAudioInputDeviceId(deviceId);
        },
        [room, saveAudioInputDeviceId]
    );

    const handleVideoDeviceChange = useCallback(
        (deviceId: string) => {
            room.switchActiveDevice('videoinput', deviceId);
            saveVideoInputDeviceId(deviceId);
        },
        [room, saveVideoInputDeviceId]
    );

    const handleDisconnect = useCallback(async () => {
        await room.disconnect();
    }, [room]);

    return {
        micTrackRef,
        visibleControls,
        cameraToggle: {
            enabled: !cameraMutedIndicator.isMuted,
            pending: false,
            toggle: async () => {
                await localParticipant.setCameraEnabled(cameraMutedIndicator.isMuted);
            },
        },
        microphoneToggle: {
            enabled: !micMutedIndicator.isMuted,
            pending: false,
            toggle: async () => {
                await localParticipant.setMicrophoneEnabled(micMutedIndicator.isMuted);
            },
        },
        screenShareToggle: {
            enabled: !screenShareMutedIndicator.isMuted,
            pending: false,
            toggle: async () => {
                await localParticipant.setScreenShareEnabled(screenShareMutedIndicator.isMuted);
            },
        },
        handleAudioDeviceChange,
        handleVideoDeviceChange,
        handleDisconnect,
    };
}
