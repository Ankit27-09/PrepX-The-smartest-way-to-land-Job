import type { TranscriptionSegment } from 'livekit-client';

export interface CombinedTranscription extends TranscriptionSegment {
    role: 'assistant' | 'user';
    receivedAtMediaTimestamp: number;
    receivedAt: number;
}

export interface TutorConfig {
    pageTitle: string;
    pageDescription: string;

    supportsChatInput: boolean;
    supportsVideoInput: boolean;
    supportsScreenShare: boolean;
    isPreConnectBufferEnabled: boolean;

    startButtonText: string;
}

export interface ConnectionDetails {
    serverUrl: string;
    roomName: string;
    participantName: string;
    participantToken: string;
}
