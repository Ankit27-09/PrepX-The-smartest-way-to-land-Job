import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Cell,
} from "recharts";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Loader2,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Eye,
    ShieldAlert,
    TrendingUp,
    BarChart3,
    FileText,
    User,
    Briefcase,
    Target,
    Brain,
    MessageSquare,
    Zap,
    AlertTriangle,
    ThumbsUp,
    ThumbsDown,
} from "lucide-react";

const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || "http://localhost:8000/api";
const API_BASE = FASTAPI_URL;

/* ── Types ─────────────────────────────────────────────────────────────── */

interface SkillAssessment {
    skill: string;
    score: number;
    comment: string;
}

interface Proctoring {
    eye_contact_score: number;
    attention_score: number;
    posture_score: number;
    background_noise_level: string;
    face_visibility_percentage: number;
    observations: string[];
}

interface MalpracticeFlag {
    type: string;
    severity: string;
    timestamp_approx: string;
    description: string;
}

interface TimelinePhase {
    phase: string;
    duration_pct: number;
    performance: number;
}

interface PreciseResult {
    overall_score: number;
    job_fit_score: number;
    communication_score: number;
    technical_score: number;
    behavioral_score: number;
    problem_solving_score: number;
    confidence_score: number;
    summary: string;
    recommendation: string;
    skill_assessments: SkillAssessment[];
    proctoring: Proctoring;
    malpractice_flags: MalpracticeFlag[];
    strengths: string[];
    weaknesses: string[];
    graph_data: {
        radar: { labels: string[]; values: number[] };
        timeline: TimelinePhase[];
        skill_bars: { skill: string; score: number }[];
    };
}

interface ResultsData {
    interview_id: string;
    status: string;
    precise: PreciseResult | null;
    detailed: string | null;
    created_at: string | null;
}

/* ── Helpers ───────────────────────────────────────────────────────────── */

const scoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
};

const scoreBg = (score: number) => {
    if (score >= 80) return "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30";
    if (score >= 60) return "from-amber-500/20 to-amber-500/5 border-amber-500/30";
    if (score >= 40) return "from-orange-500/20 to-orange-500/5 border-orange-500/30";
    return "from-red-500/20 to-red-500/5 border-red-500/30";
};

const barColor = (score: number) => {
    if (score >= 80) return "#34d399";
    if (score >= 60) return "#fbbf24";
    if (score >= 40) return "#fb923c";
    return "#f87171";
};

const recommendationConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
    strong_hire: { label: "Strong Hire", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
    hire: { label: "Hire", color: "text-green-400 bg-green-500/10 border-green-500/20", icon: CheckCircle2 },
    maybe: { label: "Maybe", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: AlertTriangle },
    no_hire: { label: "No Hire", color: "text-red-400 bg-red-500/10 border-red-500/20", icon: XCircle },
};

const severityColor: Record<string, string> = {
    low: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    medium: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    high: "bg-red-500/10 text-red-400 border-red-500/20",
};

/* ── Score Ring ────────────────────────────────────────────────────────── */

function ScoreRing({ score, size = 120, label }: { score: number; size?: number; label: string }) {
    const radius = (size - 12) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;
    const color = score >= 80 ? "#34d399" : score >= 60 ? "#fbbf24" : score >= 40 ? "#fb923c" : "#f87171";

    return (
        <div className="flex flex-col items-center gap-2">
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-border/30" strokeWidth={6} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={6}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - progress}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
                <span className={`text-2xl font-bold ${scoreColor(score)}`}>{score}</span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">{label}</span>
        </div>
    );
}

/* ── Score Card ────────────────────────────────────────────────────────── */

function ScoreCard({ label, score, icon: Icon }: { label: string; score: number; icon: typeof Target }) {
    return (
        <div className={`rounded-xl border bg-gradient-to-b p-4 ${scoreBg(score)}`}>
            <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{label}</span>
            </div>
            <div className="flex items-end gap-1">
                <span className={`text-3xl font-bold ${scoreColor(score)}`}>{score}</span>
                <span className="text-sm text-muted-foreground mb-1">/100</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-border/30 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${score}%`, backgroundColor: barColor(score) }} />
            </div>
        </div>
    );
}

/* ── Main Page ─────────────────────────────────────────────────────────── */

export default function ResultsPage() {
    const [searchParams] = useSearchParams();
    const interviewId = searchParams.get("id") || "";
    const [tab, setTab] = useState<"precise" | "detailed">("precise");
    const [data, setData] = useState<ResultsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!interviewId) {
            setError("No interview ID provided.");
            setLoading(false);
            return;
        }
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/results/${interviewId}`, { credentials: 'include' });
                if (!res.ok) {
                    if (res.status === 404) {
                        setError("Results are not ready yet. The recording is still being analyzed.");
                    } else {
                        throw new Error("Failed to fetch results");
                    }
                    return;
                }
                setData(await res.json());
            } catch {
                setError("Failed to load results. Make sure the backend is running.");
            } finally {
                setLoading(false);
            }
        })();
    }, [interviewId]);

    /* Loading */
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading results…</span>
                </div>
            </div>
        );
    }

    /* Error */
    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md">
                    <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-amber-500/10">
                        <AlertCircle className="h-8 w-8 text-amber-400" />
                    </div>
                    <h2 className="text-xl font-semibold">{error || "No data"}</h2>
                    <Link to="/interviews">
                        <Button variant="outline" className="gap-2 mt-2">
                            <ArrowLeft className="h-4 w-4" /> Back to Interviews
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const p = data.precise;

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/interviews">
                            <Button variant="ghost" size="icon" className="rounded-xl">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Interview Results</h1>
                            <p className="text-sm text-muted-foreground">
                                Analysis completed {data.created_at ? new Date(data.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                            </p>
                        </div>
                    </div>
                    {p && (
                        <div className="flex items-center gap-3">
                            {(() => {
                                const rec = recommendationConfig[p.recommendation] || recommendationConfig["maybe"];
                                const RecIcon = rec.icon;
                                return (
                                    <Badge variant="outline" className={`px-4 py-2 text-sm font-semibold ${rec.color}`}>
                                        <RecIcon className="h-4 w-4 mr-1.5" />
                                        {rec.label}
                                    </Badge>
                                );
                            })()}
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8">
                    <Button
                        variant={tab === "precise" ? "default" : "outline"}
                        className={`gap-2 rounded-xl ${tab === "precise" ? "bg-cyan-500 text-white" : ""}`}
                        onClick={() => setTab("precise")}
                    >
                        <BarChart3 className="h-4 w-4" /> Precise Analysis
                    </Button>
                    <Button
                        variant={tab === "detailed" ? "default" : "outline"}
                        className={`gap-2 rounded-xl ${tab === "detailed" ? "bg-cyan-500 text-white" : ""}`}
                        onClick={() => setTab("detailed")}
                    >
                        <FileText className="h-4 w-4" /> Detailed Report
                    </Button>
                </div>

                {/* ── PRECISE TAB ──────────────────────────────────────────── */}
                {tab === "precise" && p && (
                    <div className="space-y-8">
                        {/* Summary */}
                        <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-6">
                            <p className="text-base text-foreground/90 leading-relaxed">{p.summary}</p>
                        </div>

                        {/* Overall Score + Radar */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-8 flex flex-col items-center justify-center relative">
                                <ScoreRing score={p.overall_score} size={160} label="Overall Score" />
                            </div>
                            <div className="lg:col-span-2 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-6">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" /> Performance Radar
                                </h3>
                                <ResponsiveContainer width="100%" height={320}>
                                    <RadarChart
                                        data={
                                            p.graph_data?.radar
                                                ? p.graph_data.radar.labels.map((l, i) => ({
                                                      subject: l,
                                                      score: p.graph_data.radar.values[i],
                                                  }))
                                                : []
                                        }
                                        cx="50%"
                                        cy="50%"
                                        outerRadius="75%"
                                    >
                                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 10 }} />
                                        <Radar name="Score" dataKey="score" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.25} strokeWidth={2} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Score cards grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                            <ScoreCard label="Job Fit" score={p.job_fit_score} icon={Briefcase} />
                            <ScoreCard label="Technical" score={p.technical_score} icon={Brain} />
                            <ScoreCard label="Communication" score={p.communication_score} icon={MessageSquare} />
                            <ScoreCard label="Behavioral" score={p.behavioral_score} icon={User} />
                            <ScoreCard label="Problem Solving" score={p.problem_solving_score} icon={Zap} />
                            <ScoreCard label="Confidence" score={p.confidence_score} icon={Target} />
                        </div>

                        {/* Skill bars chart */}
                        {p.graph_data?.skill_bars && p.graph_data.skill_bars.length > 0 && (
                            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-6">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4" /> Skill Breakdown
                                </h3>
                                <ResponsiveContainer width="100%" height={Math.max(200, p.graph_data.skill_bars.length * 45)}>
                                    <BarChart data={p.graph_data.skill_bars} layout="vertical" margin={{ left: 20 }}>
                                        <XAxis type="number" domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 11 }} />
                                        <YAxis dataKey="skill" type="category" width={120} tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "#1c1c1e", border: "1px solid #333", borderRadius: 8, color: "#fff" }}
                                        />
                                        <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={20}>
                                            {p.graph_data.skill_bars.map((entry, i) => (
                                                <Cell key={i} fill={barColor(entry.score)} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Skill Assessments detail */}
                        {p.skill_assessments && p.skill_assessments.length > 0 && (
                            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-6">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-4">Skill Assessments</h3>
                                <div className="space-y-3">
                                    {p.skill_assessments.map((sa, i) => (
                                        <div key={i} className="flex items-start gap-4 p-3 rounded-xl bg-background/50 border border-border/30">
                                            <div className="shrink-0 flex flex-col items-center">
                                                <span className={`text-xl font-bold ${scoreColor(sa.score)}`}>{sa.score}</span>
                                                <span className="text-[10px] text-muted-foreground">/100</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{sa.skill}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{sa.comment}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Interview timeline */}
                        {p.graph_data?.timeline && p.graph_data.timeline.length > 0 && (
                            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-6">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-4">Interview Timeline</h3>
                                <div className="flex rounded-xl overflow-hidden h-8 mb-4">
                                    {p.graph_data.timeline.map((phase, i) => {
                                        const colors = ["bg-cyan-500", "bg-cyan-600", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
                                        return (
                                            <div
                                                key={i}
                                                className={`${colors[i % colors.length]} flex items-center justify-center text-[10px] font-medium text-white`}
                                                style={{ width: `${phase.duration_pct}%` }}
                                                title={`${phase.phase}: ${phase.performance}/100`}
                                            >
                                                {phase.duration_pct > 12 ? phase.phase : ""}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {p.graph_data.timeline.map((phase, i) => {
                                        const colors = ["bg-cyan-500", "bg-cyan-600", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
                                        return (
                                            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <div className={`h-2.5 w-2.5 rounded-sm ${colors[i % colors.length]}`} />
                                                <span>{phase.phase}</span>
                                                <span className={scoreColor(phase.performance)}>{phase.performance}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Proctoring & Malpractice row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-6">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                                    <Eye className="h-4 w-4" /> Proctoring Analysis
                                </h3>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {[
                                        { label: "Eye Contact", value: p.proctoring.eye_contact_score },
                                        { label: "Attention", value: p.proctoring.attention_score },
                                        { label: "Posture", value: p.proctoring.posture_score },
                                        { label: "Face Visible", value: p.proctoring.face_visibility_percentage },
                                    ].map((item) => (
                                        <div key={item.label} className="p-3 rounded-xl bg-background/50 border border-border/30 text-center">
                                            <span className={`text-2xl font-bold ${scoreColor(item.value)}`}>{item.value}%</span>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">{item.label}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xs text-muted-foreground">Background Noise:</span>
                                    <Badge variant="outline" className="text-xs">
                                        {p.proctoring.background_noise_level}
                                    </Badge>
                                </div>
                                {p.proctoring.observations.length > 0 && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Observations:</p>
                                        <ul className="space-y-1">
                                            {p.proctoring.observations.map((obs, i) => (
                                                <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                                                    <span className="text-muted-foreground mt-0.5">·</span>
                                                    {obs}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-6">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4" /> Malpractice Flags
                                </h3>
                                {p.malpractice_flags.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2" />
                                        <p className="text-sm font-medium text-emerald-400">No Flags Detected</p>
                                        <p className="text-xs text-muted-foreground mt-1">The interview appears clean.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {p.malpractice_flags.map((flag, i) => (
                                            <div key={i} className="p-3 rounded-xl bg-background/50 border border-border/30">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className={`text-xs ${severityColor[flag.severity] || ""}`}>
                                                        {flag.severity}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">{flag.timestamp_approx}</span>
                                                </div>
                                                <p className="text-sm font-medium">{flag.type.replace(/_/g, " ")}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Strengths & Weaknesses */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-6">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                                    <ThumbsUp className="h-4 w-4 text-emerald-400" /> Strengths
                                </h3>
                                <ul className="space-y-2">
                                    {p.strengths.map((s, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-6">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                                    <ThumbsDown className="h-4 w-4 text-red-400" /> Areas for Improvement
                                </h3>
                                <ul className="space-y-2">
                                    {p.weaknesses.map((w, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                                            <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                                            {w}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {tab === "precise" && !p && (
                    <div className="rounded-2xl border border-border/50 bg-card/20 p-16 text-center">
                        <AlertCircle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
                        <p className="text-muted-foreground">Precise results are not available.</p>
                    </div>
                )}

                {/* ── DETAILED TAB ─────────────────────────────────────────── */}
                {tab === "detailed" && data.detailed && (
                    <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-8">
                        <article className="prose prose-invert prose-sm max-w-none prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-foreground/85 prose-li:text-foreground/85 prose-strong:text-foreground prose-table:text-sm prose-th:text-left prose-th:p-2 prose-td:p-2 prose-tr:border-b prose-tr:border-border/30">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {data.detailed}
                            </ReactMarkdown>
                        </article>
                    </div>
                )}

                {tab === "detailed" && !data.detailed && (
                    <div className="rounded-2xl border border-border/50 bg-card/20 p-16 text-center">
                        <AlertCircle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
                        <p className="text-muted-foreground">Detailed report is not available.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
