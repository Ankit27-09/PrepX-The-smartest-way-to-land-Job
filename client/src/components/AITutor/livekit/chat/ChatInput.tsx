import { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils';

interface ChatInputProps {
    onSend?: (message: string) => void;
    disabled?: boolean;
    className?: string;
}

export function ChatInput({ onSend, className, disabled }: ChatInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [message, setMessage] = useState<string>('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (message.trim()) {
            onSend?.(message);
            setMessage('');
        }
    };

    const isDisabled = disabled || message.trim().length === 0;

    useEffect(() => {
        if (!disabled) {
            inputRef.current?.focus();
        }
    }, [disabled]);

    return (
        <form
            onSubmit={handleSubmit}
            className={cn('flex items-center gap-2 rounded-full bg-zinc-800 border border-white/10 px-4 py-2', className)}
        >
            <input
                autoFocus
                ref={inputRef}
                type="text"
                value={message}
                disabled={disabled}
                placeholder="Type a message..."
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
                type="submit"
                disabled={isDisabled}
                className={cn(
                    'rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors',
                    isDisabled
                        ? 'cursor-not-allowed bg-zinc-700 text-zinc-500'
                        : 'bg-cyan-500 text-white hover:bg-cyan-400'
                )}
            >
                Send
            </button>
        </form>
    );
}
