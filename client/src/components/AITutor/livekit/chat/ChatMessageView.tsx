import { useEffect, useRef } from 'react';
import { cn } from '../../utils';

interface ChatMessageViewProps {
    children?: React.ReactNode;
    className?: string;
}

export const ChatMessageView = ({ className, children }: ChatMessageViewProps) => {
    const scrollContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const scrollToBottom = () => {
            if (scrollContentRef.current) {
                scrollContentRef.current.scrollTop = scrollContentRef.current.scrollHeight;
            }
        };

        if (scrollContentRef.current) {
            const resizeObserver = new ResizeObserver(scrollToBottom);
            resizeObserver.observe(scrollContentRef.current);
            scrollToBottom();
            return () => resizeObserver.disconnect();
        }
    }, []);

    return (
        <div
            ref={scrollContentRef}
            className={cn('flex flex-col overflow-y-auto', className)}
        >
            {children}
        </div>
    );
};
