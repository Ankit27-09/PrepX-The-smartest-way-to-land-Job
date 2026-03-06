import type { AgentState } from '@livekit/components-react';
import { BarVisualizer, useVoiceAssistant } from '@livekit/components-react';
import { cn } from '../utils';
import { forwardRef } from 'react';

interface AgentTileProps {
    state: AgentState;
    audioTrack?: ReturnType<typeof useVoiceAssistant>['audioTrack'];
    className?: string;
}

export const AgentTile = forwardRef<HTMLDivElement, AgentTileProps>(
    ({ state, audioTrack, className }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'flex items-center justify-center rounded-2xl bg-zinc-900/80 border border-white/10 p-8 shadow-lg backdrop-blur-sm',
                    className
                )}
            >
                <div className="flex flex-col items-center gap-4">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-cyan-500 to-cyan-700">
                        {audioTrack && (
                            <BarVisualizer
                                barCount={5}
                                trackRef={audioTrack}
                                options={{ minHeight: 10 }}
                                className="flex h-12 items-end gap-1"
                            />
                        )}
                    </div>
                    <span className="text-sm font-medium capitalize text-zinc-400">
                        {state === 'speaking' ? 'Speaking...' : state === 'thinking' ? 'Thinking...' : 'Listening'}
                    </span>
                </div>
            </div>
        );
    }
);

AgentTile.displayName = 'AgentTile';
