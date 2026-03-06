/* ── Career Fits View — Displays 3 career fit cards after Stage 1 ────── */
import { useCareerStore } from "@/lib/career-store";
import type { CareerFit } from "@/lib/career-api";
import {
  Trophy,
  TrendingUp,
  Brain,
  Target,
  Users,
  Clock,
  DollarSign,
  BarChart3,
  ChevronRight,
  Lightbulb,
  AlertTriangle,
  Zap,
} from "lucide-react";

/* ── Colour palette per rank ──────────────────────────────────────────── */

const RANK_THEME: Record<number, { border: string; bg: string; accent: string; badge: string }> = {
  1: {
    border: "border-cyan-500/40",
    bg: "bg-cyan-500/5",
    accent: "text-cyan-400",
    badge: "bg-cyan-500",
  },
  2: {
    border: "border-violet-500/40",
    bg: "bg-violet-500/5",
    accent: "text-violet-400",
    badge: "bg-violet-500",
  },
  3: {
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/5",
    accent: "text-emerald-400",
    badge: "bg-emerald-500",
  },
};

/* ── Score bar ────────────────────────────────────────────────────────── */

function ScoreBar({ label, score, icon: Icon, color }: {
  label: string;
  score: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className={`h-4 w-4 ${color} shrink-0`} />
      <span className="w-24 text-xs text-white/50">{label}</span>
      <div className="flex-1">
        <div className="h-2 rounded-full bg-white/10">
          <div
            className={`h-2 rounded-full transition-all ${color.replace("text-", "bg-")}`}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
      </div>
      <span className="w-10 text-right text-xs font-bold text-white/80">
        {score.toFixed(0)}%
      </span>
    </div>
  );
}

/* ── Single card ──────────────────────────────────────────────────────── */

function FitCard({ fit, onSelect }: { fit: CareerFit; onSelect: () => void }) {
  const theme = RANK_THEME[fit.rank] ?? RANK_THEME[3];

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border ${theme.border} ${theme.bg} p-6 backdrop-blur-xl transition hover:shadow-lg hover:shadow-cyan-500/5`}
    >
      {/* Rank badge */}
      <div
        className={`absolute -right-1 -top-1 rounded-bl-xl ${theme.badge} px-4 py-1.5 text-xs font-bold text-white`}
      >
        #{fit.rank}
      </div>

      {/* Title + tagline */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white">{fit.career_title}</h3>
        <p className="text-sm text-white/40">{fit.career_field}</p>
        <p className={`mt-1 text-sm italic ${theme.accent}`}>"{fit.tagline}"</p>
      </div>

      {/* Overall score ring */}
      <div className="mb-5 flex items-center gap-4">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${fit.overall_fit_score} ${100 - fit.overall_fit_score}`}
              className={theme.accent}
            />
          </svg>
          <span className="absolute text-lg font-bold text-white">{fit.overall_fit_score.toFixed(0)}</span>
        </div>
        <div>
          <p className="text-xs text-white/50">Overall Fit</p>
          <p className="text-sm font-semibold text-white">
            {fit.difficulty_level} · {fit.time_to_entry}
          </p>
          <p className="flex items-center gap-1 text-xs text-white/40">
            <DollarSign className="h-3 w-3" />
            {fit.typical_salary_range}
          </p>
        </div>
      </div>

      {/* Score bars */}
      <div className="mb-5 space-y-2">
        <ScoreBar label="Skill Fit" score={fit.skill_fit_score} icon={Brain} color="text-cyan-400" />
        <ScoreBar label="Interest" score={fit.interest_fit_score} icon={Target} color="text-violet-400" />
        <ScoreBar label="Market" score={fit.market_fit_score} icon={TrendingUp} color="text-emerald-400" />
        <ScoreBar label="Personality" score={fit.personality_fit_score} icon={Users} color="text-amber-400" />
      </div>

      {/* Top 3 reasons */}
      <div className="mb-5">
        <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/50">
          <Lightbulb className="h-3.5 w-3.5" /> Top Reasons
        </h4>
        <ul className="space-y-1.5">
          {fit.top_3_reasons.slice(0, 3).map((r, i) => (
            <li key={i} className="flex gap-2 text-xs text-white/70">
              <span className={`mt-0.5 ${theme.accent}`}>•</span>
              {r}
            </li>
          ))}
        </ul>
      </div>

      {/* Key skills needed */}
      <div className="mb-5">
        <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/50">
          <Zap className="h-3.5 w-3.5" /> Skills Needed
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {fit.key_skills_needed.slice(0, 6).map((s) => (
            <span key={s} className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/60">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Challenges preview */}
      {fit.reasoning.potential_challenges.length > 0 && (
        <div className="mb-5">
          <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/50">
            <AlertTriangle className="h-3.5 w-3.5" /> Challenges
          </h4>
          <ul className="space-y-1">
            {fit.reasoning.potential_challenges.slice(0, 2).map((c, i) => (
              <li key={i} className="text-xs text-amber-300/70">
                ⚠ {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Select CTA */}
      <button
        onClick={onSelect}
        className={`flex w-full items-center justify-center gap-2 rounded-xl ${theme.badge} py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-90`}
      >
        Simulate This Career <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────── */

export default function CareerFitsView() {
  const matchingData = useCareerStore((s) => s.matchingData);
  const selectCareer = useCareerStore((s) => s.selectCareer);

  if (!matchingData) return null;

  return (
    <div>
      {/* Summary header */}
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-white">
              <Trophy className="h-6 w-6 text-amber-400" />
              Your Top 3 Career Matches
            </h2>
            <p className="max-w-2xl text-sm text-white/60">
              {matchingData.analysis_summary}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2">
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-white/60">
              Confidence: <strong className="text-white">{matchingData.confidence_level}</strong>
            </span>
          </div>
        </div>

        {/* Profile highlights */}
        {matchingData.profile_highlights.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {matchingData.profile_highlights.map((h, i) => (
              <span key={i} className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                {h}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-1 text-xs text-white/40">
          <Clock className="h-3 w-3" />
          Analysed in {(matchingData.processing_time_ms / 1000).toFixed(1)}s
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {matchingData.career_fits.map((fit, idx) => (
          <FitCard key={fit.rank} fit={fit} onSelect={() => selectCareer(idx)} />
        ))}
      </div>

      {/* Methodology note */}
      <div className="mt-6 rounded-xl border border-white/5 bg-white/2 p-4 text-xs text-white/40">
        <strong className="text-white/60">Methodology:</strong>{" "}
        {matchingData.methodology_explanation}
      </div>
    </div>
  );
}
