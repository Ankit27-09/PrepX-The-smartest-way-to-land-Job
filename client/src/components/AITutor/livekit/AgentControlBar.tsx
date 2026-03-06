import { useState, useEffect } from 'react';
import { BarVisualizer, useRemoteParticipants } from '@livekit/components-react';
import { cn } from '../utils';
import type { TutorConfig } from '../types';
import { useAgentControlBar, type UseAgentControlBarProps } from '../hooks/useAgentControlBar';
import { ChatInput } from './chat/ChatInput';
import { Mic, MicOff, Video, VideoOff, Monitor, MessageSquare, PhoneOff } from 'lucide-react';

interface AgentControlBarProps extends UseAgentControlBarProps {
    capabilities: Pick<TutorConfig, 'supportsChatInput' | 'supportsVideoInput' | 'supportsScreenShare'>;
    onChatOpenChange?: (open: boolean) => void;
    onSendMessage?: (message: string) => Promise<void>;
    onDisconnect?: () => void;
    className?: string;
}

export function AgentControlBar({
    controls,
    saveUserChoices = true,
    capabilities,
    className,
    onSendMessage,
    onChatOpenChange,
    onDisconnect,
}: AgentControlBarProps) {
    const participants = useRemoteParticipants();
    const [chatOpen, setChatOpen] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);

    const isAgentAvailable = participants.some((p) => p.isAgent);
    const isInputDisabled = !chatOpen || !isAgentAvailable || isSendingMessage;

    const {
        micTrackRef,
        visibleControls,
        cameraToggle,
        microphoneToggle,
        screenShareToggle,
        handleDisconnect,
    } = useAgentControlBar({ controls, saveUserChoices });

    const handleSendMessage = async (message: string) => {
        setIsSendingMessage(true);
        try {
            await onSendMessage?.(message);
        } finally {
            setIsSendingMessage(false);
        }
    };

    const onLeave = async () => {
        setIsDisconnecting(true);
        await handleDisconnect();
        setIsDisconnecting(false);
        onDisconnect?.();
    };

    useEffect(() => {
        onChatOpenChange?.(chatOpen);
    }, [chatOpen, onChatOpenChange]);

    return (
        <div
            className={cn(
                'flex flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-900/80 p-4 shadow-lg backdrop-blur-xl',
                className
            )}
        >
            {/* Chat Input */}
            {capabilities.supportsChatInput && chatOpen && (
                <div className="border-b border-white/10 pb-3">
                    <ChatInput onSend={handleSendMessage} disabled={isInputDisabled} />
                </div>
            )}

            {/* Control Buttons */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    {/* Microphone */}
                    {visibleControls.microphone && (
                        <button
                            onClick={() => microphoneToggle.toggle()}
                            disabled={microphoneToggle.pending}
                            className={cn(
                                'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
                                microphoneToggle.enabled
                                    ? 'bg-zinc-800 text-cyan-400 hover:bg-zinc-700 border border-white/10'
                                    : 'bg-red-500 text-white hover:bg-red-600'
                            )}
                            title={microphoneToggle.enabled ? 'Mute microphone' : 'Unmute microphone'}
                        >
                            {microphoneToggle.enabled ? (
                                <div className="relative">
                                    <Mic className="h-5 w-5" />
                                    {micTrackRef && (
                                        <BarVisualizer
                                            barCount={3}
                                            trackRef={micTrackRef}
                                            options={{ minHeight: 3 }}
                                            className="absolute -right-1 -top-1 flex h-3 items-end gap-0.5"
                                        />
                                    )}
                                </div>
                            ) : (
                                <MicOff className="h-5 w-5" />
                            )}
                        </button>
                    )}

                    {/* Camera */}
                    {capabilities.supportsVideoInput && visibleControls.camera && (
                        <button
                            onClick={() => cameraToggle.toggle()}
                            disabled={cameraToggle.pending}
                            className={cn(
                                'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
                                cameraToggle.enabled
                                    ? 'bg-zinc-800 text-cyan-400 hover:bg-zinc-700 border border-white/10'
                                    : 'bg-red-500 text-white hover:bg-red-600'
                            )}
                            title={cameraToggle.enabled ? 'Turn off camera' : 'Turn on camera'}
                        >
                            {cameraToggle.enabled ? (
                                <Video className="h-5 w-5" />
                            ) : (
                                <VideoOff className="h-5 w-5" />
                            )}
                        </button>
                    )}

                    {/* Screen Share */}
                    {capabilities.supportsScreenShare && visibleControls.screenShare && (
                        <button
                            onClick={() => screenShareToggle.toggle()}
                            disabled={screenShareToggle.pending}
                            className={cn(
                                'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
                                screenShareToggle.enabled
                                    ? 'bg-cyan-500 text-white hover:bg-cyan-400'
                                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-white/10'
                            )}
                            title={screenShareToggle.enabled ? 'Stop sharing' : 'Share screen'}
                        >
                            <Monitor className="h-5 w-5" />
                        </button>
                    )}

                    {/* Chat Toggle */}
                    {visibleControls.chat && (
                        <button
                            onClick={() => setChatOpen(!chatOpen)}
                            disabled={!isAgentAvailable}
                            className={cn(
                                'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
                                chatOpen
                                    ? 'bg-cyan-500 text-white hover:bg-cyan-400'
                                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-white/10',
                                !isAgentAvailable && 'cursor-not-allowed opacity-50'
                            )}
                            title="Toggle chat"
                        >
                            <MessageSquare className="h-5 w-5" />
                        </button>
                    )}
                </div>

                {/* End Session Button */}
                {visibleControls.leave && (
                    <button
                        onClick={onLeave}
                        disabled={isDisconnecting}
                        className="flex h-12 items-center gap-2 rounded-full bg-red-500 px-5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                    >
                        <PhoneOff className="h-4 w-4" />
                        <span className="hidden sm:inline">End Session</span>
                    </button>
                )}
            </div>
        </div>
    );
}
