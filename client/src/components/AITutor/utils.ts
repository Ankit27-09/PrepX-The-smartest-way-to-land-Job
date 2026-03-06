import { cn } from '@/lib/utils';
import { Room } from 'livekit-client';
import type { ReceivedChatMessage, TextStreamData } from '@livekit/components-react';
import type { TutorConfig } from './types';

export { cn };

export function transcriptionToChatMessage(
    textStream: TextStreamData,
    room: Room
): ReceivedChatMessage {
    return {
        id: textStream.streamInfo.id,
        timestamp: textStream.streamInfo.timestamp,
        message: textStream.text,
        from:
            textStream.participantInfo.identity === room.localParticipant.identity
                ? room.localParticipant
                : Array.from(room.remoteParticipants.values()).find(
                    (p) => p.identity === textStream.participantInfo.identity
                ),
    };
}

export const TUTOR_CONFIG: TutorConfig = {
    pageTitle: 'AI Tutor - PrepX',
    pageDescription: 'Your personal AI tutor for code, documents, and learning',
    supportsChatInput: true,
    supportsVideoInput: true,
    supportsScreenShare: true,
    isPreConnectBufferEnabled: true,
    startButtonText: 'Start Session',
};
