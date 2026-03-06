import type { ReceivedChatMessage } from '@livekit/components-react';
import { cn } from '../../utils';

interface ChatEntryProps {
    entry: ReceivedChatMessage;
    hideName?: boolean;
    hideTimestamp?: boolean;
}

export const ChatEntry = ({ entry, hideName, hideTimestamp }: ChatEntryProps) => {
    const isUser = entry.from?.isLocal ?? false;
    const time = new Date(entry.timestamp);
    const name = entry.from?.name || entry.from?.identity || (isUser ? 'You' : 'AI Tutor');

    return (
        <li className={cn('group flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
            {!hideName && (
                <span className="text-xs font-medium text-zinc-400">
                    {name}
                    {!hideTimestamp && (
                        <span className="ml-2 font-mono text-[10px] text-zinc-500">
                            {time.toLocaleTimeString(undefined, { timeStyle: 'short' })}
                        </span>
                    )}
                </span>
            )}
            <span
                className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
                    isUser
                        ? 'bg-cyan-500 text-white'
                        : 'bg-zinc-800 text-zinc-200 border border-white/10'
                )}
            >
                {entry.message}
            </span>
        </li>
    );
};
