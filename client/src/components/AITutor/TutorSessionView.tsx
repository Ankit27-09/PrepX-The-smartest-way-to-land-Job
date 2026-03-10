import { useEffect, useState, forwardRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
    type AgentState,
    type ReceivedChatMessage,
    useRoomContext,
    useVoiceAssistant,
} from '@livekit/components-react';
import toast from 'react-hot-toast';
import { cn } from './utils';
import type { TutorConfig } from './types';
import useChatAndTranscription from './hooks/useChatAndTranscription';
import { AgentControlBar } from './livekit/AgentControlBar';
import { ChatEntry } from './livekit/chat/ChatEntry';
import { ChatMessageView } from './livekit/chat/ChatMessageView';
import { MediaTiles } from './livekit/MediaTiles';

function isAgentAvailable(agentState: AgentState) {
    return agentState === 'listening' || agentState === 'thinking' || agentState === 'speaking';
}

interface TutorSessionViewProps {
    config: TutorConfig;
    disabled: boolean;
    sessionStarted: boolean;
}

export const TutorSessionView = forwardRef<HTMLDivElement, TutorSessionViewProps>(
    ({ config, disabled, sessionStarted }, ref) => {
        const { state: agentState } = useVoiceAssistant();
        const [chatOpen, setChatOpen] = useState(false);
        const { messages, send } = useChatAndTranscription();
        const room = useRoomContext();

        async function handleSendMessage(message: string) {
            await send(message);
        }

        useEffect(() => {
            if (sessionStarted) {
                const timeout = setTimeout(() => {
                    if (!isAgentAvailable(agentState)) {
                        const reason =
                            agentState === 'connecting'
                                ? 'Tutor is taking longer than expected to connect...'
                                : 'Tutor connected but is still initializing...';

                        toast.error(reason, { duration: 5000 });
                    }
                }, 15_000);

                return () => clearTimeout(timeout);
            }
        }, [agentState, sessionStarted]);

        const capabilities = {
            supportsChatInput: config.supportsChatInput,
            supportsVideoInput: config.supportsVideoInput,
            supportsScreenShare: config.supportsScreenShare,
        };

        return (
            <main
                ref={ref}
                className={cn(
                    'min-h-screen bg-black',
                    disabled && 'pointer-events-none'
                )}
            >
                {/* Media Tiles (Avatar, Camera, Screen Share) */}
                <MediaTiles chatOpen={chatOpen} />

                {/* Chat Messages */}
                <ChatMessageView
                    className={cn(
                        'fixed inset-x-0 top-20 bottom-36 z-30 mx-auto w-full max-w-2xl overflow-y-auto px-4 py-6 transition-all duration-300',
                        chatOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    )}
                >
                    <ul className="space-y-4">
                        <AnimatePresence>
                            {messages.map((message: ReceivedChatMessage) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <ChatEntry hideName={false} entry={message} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </ul>
                </ChatMessageView>

                {/* Control Bar */}
                <div className="fixed right-0 bottom-0 left-0 z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{
                            opacity: sessionStarted ? 1 : 0,
                            y: sessionStarted ? 0 : 50,
                        }}
                        transition={{ duration: 0.3, delay: sessionStarted ? 0.3 : 0 }}
                        className="mx-auto max-w-2xl"
                    >
                        {/* Helper Text */}
                        {sessionStarted && messages.length === 0 && config.isPreConnectBufferEnabled && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="mb-3 text-center text-sm text-zinc-400"
                            >
                                {isAgentAvailable(agentState)
                                    ? 'AI Tutor is listening. Ask anything or share your screen!'
                                    : 'Connecting to your AI Tutor...'}
                            </motion.p>
                        )}

                        <AgentControlBar
                            capabilities={capabilities}
                            onChatOpenChange={setChatOpen}
                            onSendMessage={handleSendMessage}
                            onDisconnect={() => room.disconnect()}
                        />
                    </motion.div>
                </div>
            </main>
        );
    }
);

TutorSessionView.displayName = 'TutorSessionView';
