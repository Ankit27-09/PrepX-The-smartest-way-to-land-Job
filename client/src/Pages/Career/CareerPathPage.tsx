/* ── Career Path Simulator — Main Page ────────────────────────────────── */
import { useCareerStore } from "@/lib/career-store";
import SimulateForm from "./SimulateForm";
import CareerFitsView from "./CareerFitsView";
import DashboardView from "./DashboardView";
import { Loader2, RotateCcw } from "lucide-react";

export default function CareerPathPage() {
  const step = useCareerStore((s) => s.step);
  const error = useCareerStore((s) => s.error);
  const reset = useCareerStore((s) => s.reset);

  return (
    <div className="min-h-screen bg-black pt-20 pb-16">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-white sm:text-4xl">
              Career Path Simulator
            </h1>
            <p className="mt-2 text-white/60">
              AI-powered multi-agent system to map your ideal career trajectory
            </p>
          </div>
          {step !== "form" && (
            <button
              onClick={reset}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <RotateCcw className="h-4 w-4" /> Start Over
            </button>
          )}
        </div>

        {/* Progress bar */}
        <ProgressBar step={step} />

        {/* Error banner */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {/* Step views */}
        {step === "form" && <SimulateForm />}

        {step === "analyzing" && (
          <LoadingState
            title="Analyzing Your Profile"
            subtitle="Our AI agents are parsing your profile and finding the best career matches…"
          />
        )}

        {step === "fits" && <CareerFitsView />}

        {step === "simulating" && (
          <LoadingState
            title="Running Full Simulation"
            subtitle="8 specialised AI agents are building your career roadmap, financial analysis, risk assessment, and interactive dashboard…"
          />
        )}

        {step === "dashboard" && <DashboardView />}
      </div>
    </div>
  );
}

/* ── Progress Bar ─────────────────────────────────────────────────────── */

const STEPS = [
  { key: "form", label: "Profile" },
  { key: "analyzing", label: "Analysis" },
  { key: "fits", label: "Career Fits" },
  { key: "simulating", label: "Simulation" },
  { key: "dashboard", label: "Dashboard" },
] as const;

function ProgressBar({ step }: { step: string }) {
  const idx = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => {
          const done = i < idx;
          const active = i === idx;
          return (
            <div key={s.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    done
                      ? "bg-cyan-500 text-white"
                      : active
                      ? "bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-500"
                      : "bg-white/5 text-white/30"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span
                  className={`mt-1 text-[11px] ${
                    active ? "text-cyan-400" : done ? "text-white/60" : "text-white/30"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 rounded-full ${
                    done ? "bg-cyan-500" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Loading placeholder ──────────────────────────────────────────────── */

function LoadingState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <Loader2 className="mb-6 h-12 w-12 animate-spin text-cyan-400" />
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="mt-3 max-w-md text-white/50">{subtitle}</p>
    </div>
  );
}
