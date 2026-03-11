import { forwardRef } from 'react';
import { BookOpen, Monitor, Mail} from 'lucide-react';

interface TutorWelcomeProps {
    disabled: boolean;
    startButtonText: string;
    onStartCall: () => void;
}

export const TutorWelcome = forwardRef<HTMLDivElement, TutorWelcomeProps>(
    ({ disabled, startButtonText, onStartCall }, ref) => {
        return (
            <div
                ref={ref}
                className="fixed inset-0 z-10 flex flex-col items-center justify-center bg-black px-4 text-center"
                style={{ pointerEvents: disabled ? 'none' : 'auto' }}
            >
                {/* Background glow */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-125 w-125 rounded-full bg-cyan-500/10 blur-[120px]" />
                </div>

                {/* Logo / Title */}
                <div className="relative mb-8">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <h1 className="text-5xl font-bold tracking-tight text-white">
                            AI <span className="text-cyan-400">Tutor</span>
                        </h1>
                    </div>
                    <p className="mt-2 text-lg text-zinc-400">Your personal learning companion</p>
                </div>

                {/* Feature Cards */}
                <div className="relative mb-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 backdrop-blur-sm transition-all hover:border-cyan-500/30 hover:bg-zinc-900/80">
                        <BookOpen className="mx-auto mb-2 h-8 w-8 text-cyan-400" />
                        <h3 className="font-semibold text-white">Code Explanation</h3>
                        <p className="mt-1 text-sm text-zinc-400">Get help understanding any code</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 backdrop-blur-sm transition-all hover:border-cyan-500/30 hover:bg-zinc-900/80">
                        <Monitor className="mx-auto mb-2 h-8 w-8 text-cyan-400" />
                        <h3 className="font-semibold text-white">Screen Sharing</h3>
                        <p className="mt-1 text-sm text-zinc-400">Share your screen for guidance</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 backdrop-blur-sm transition-all hover:border-cyan-500/30 hover:bg-zinc-900/80">
                        <Mail className="mx-auto mb-2 h-8 w-8 text-cyan-400" />
                        <h3 className="font-semibold text-white">Session Summary</h3>
                        <p className="mt-1 text-sm text-zinc-400">Get notes emailed to you</p>
                    </div>
                </div>

                {/* Start Button */}
                <button
                    onClick={onStartCall}
                    disabled={disabled}
                    className="group relative overflow-hidden rounded-full bg-cyan-500 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 hover:bg-cyan-400 hover:shadow-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <span className="relative z-10">{startButtonText}</span>
                </button>

                <p className="mt-6 max-w-md text-sm text-zinc-500">
                    Start a session to connect with your AI Tutor. Share your screen to get help with code, documents, or any learning material.
                </p>
            </div>
        );
    }
);

TutorWelcome.displayName = 'TutorWelcome';
