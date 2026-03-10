import React from 'react';

interface InterviewTimerProps {
    durationMinutes: number;
    onTimeUp?: () => void;
}

export function InterviewTimer({ durationMinutes, onTimeUp }: InterviewTimerProps) {
    const [secondsLeft, setSecondsLeft] = React.useState(durationMinutes * 60);

    React.useEffect(() => {
        if (secondsLeft <= 0) {
            onTimeUp?.();
            return;
        }
        const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
        return () => clearInterval(id);
    }, [secondsLeft, onTimeUp]);

    const mins = Math.floor(Math.max(0, secondsLeft) / 60);
    const secs = Math.max(0, secondsLeft) % 60;
    const pad = (n: number) => String(n).padStart(2, '0');

    const cls =
        secondsLeft <= 0
            ? 'danger'
            : secondsLeft <= 300
                ? 'danger'
                : secondsLeft <= 600
                    ? 'warning'
                    : '';

    return (
        <div className={`interview-timer ${cls}`}>
            <svg className="timer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
            </svg>
            {pad(mins)}:{pad(secs)}
        </div>
    );
}
