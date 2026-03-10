import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Play,
    BarChart3,
    Clock,
    Briefcase,
    Bot,
    Mic,
    Loader2,
    AlertCircle,
    FileText,
} from "lucide-react";

const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || "http://localhost:8000/api";
const API_BASE = `${FASTAPI_URL}/interviews`;

interface Interview {
    id: string;
    job_title: string;
    company: string;
    status: string;
    interview_mode: string;
    avatar_model: string;
    duration: string;
    difficulty_level: string;
    created_at: string;
    updated_at: string;
}

const statusConfig: Record<
    string,
    { label: string; color: string; bg: string }
> = {
    draft: {
        label: "Draft",
        color: "text-amber-300",
        bg: "bg-amber-500/10 border-amber-500/20",
    },
    published: {
        label: "Published",
        color: "text-emerald-300",
        bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    in_progress: {
        label: "In Progress",
        color: "text-blue-300",
        bg: "bg-blue-500/10 border-blue-500/20",
    },
    completed: {
        label: "Completed",
        color: "text-cyan-300",
        bg: "bg-cyan-500/10 border-cyan-500/20",
    },
    analyzed: {
        label: "Analyzed",
        color: "text-cyan-300",
        bg: "bg-cyan-500/10 border-cyan-500/20",
    },
};

const difficultyColors: Record<string, string> = {
    easy: "text-emerald-400",
    medium: "text-amber-400",
    hard: "text-orange-400",
    expert: "text-red-400",
};

const avatarModels: Record<string, { name: string; image: string }> = {
    michael: { name: "Michael", image: "/michael.jpg" },
    laura: { name: "Laura", image: "/laura.jpg" },
    nelly: { name: "Nelly", image: "/nelly.jpg" },
    fjolla: { name: "Fjolla", image: "/fjolla.jpg" },
    ege: { name: "Ege", image: "/ege.jpg" },
    zaid: { name: "Zaid", image: "/zaid.jpg" },
    awais: { name: "Awais", image: "/awais.jpg" },
    jerome: { name: "Jerome", image: "/jerome.jpg" },
};

function formatDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function timeAgo(isoString: string): string {
    const now = new Date();
    const date = new Date(isoString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

export default function InterviewsPage() {
    const navigate = useNavigate();
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchInterviews();
    }, []);

    const fetchInterviews = async () => {
        try {
            const res = await fetch(`${API_BASE}/`, { credentials: 'include' });
            if (!res.ok) throw new Error("Failed to fetch interviews");
            const data = await res.json();
            setInterviews(data);
        } catch {
            setError("Failed to load interviews. Make sure the backend is running.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading interviews...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)]">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                            Interviews
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage and monitor all your AI-powered interviews.
                        </p>
                    </div>
                    <Link to="/create-interview">
                        <Button className="gap-2 bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/25 cursor-pointer">
                            <Plus className="h-4 w-4" />
                            New Interview
                        </Button>
                    </Link>
                </div>

                {/* Stats Row */}
                {interviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
                        {[
                            {
                                label: "Total",
                                value: interviews.length,
                                color: "text-foreground",
                            },
                            {
                                label: "Draft",
                                value: interviews.filter((i) => i.status === "draft").length,
                                color: "text-amber-400",
                            },
                            {
                                label: "Published",
                                value: interviews.filter((i) => i.status === "published")
                                    .length,
                                color: "text-emerald-400",
                            },
                            {
                                label: "Completed",
                                value: interviews.filter((i) => i.status === "completed")
                                    .length,
                                color: "text-cyan-400",
                            },
                            {
                                label: "Analyzed",
                                value: interviews.filter((i) => i.status === "analyzed")
                                    .length,
                                color: "text-cyan-400",
                            },
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-4 text-center"
                            >
                                <p className={`text-2xl font-bold ${stat.color}`}>
                                    {stat.value}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}

                {/* Empty State */}
                {!error && interviews.length === 0 && (
                    <div className="rounded-2xl border border-border/50 bg-card/20 p-16 text-center">
                        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-cyan-500/10 mb-4">
                            <FileText className="h-8 w-8 text-cyan-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-1">
                            No interviews yet
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                            Create your first AI-powered interview to start screening
                            candidates with intelligent, automated conversations.
                        </p>
                        <Link to="/create-interview">
                            <Button className="gap-2 bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/25 cursor-pointer">
                                <Plus className="h-4 w-4" />
                                Create Your First Interview
                            </Button>
                        </Link>
                    </div>
                )}

                {/* Interview Cards */}
                <div className="space-y-4">
                    {interviews.map((interview) => {
                        const status =
                            statusConfig[interview.status] || statusConfig["draft"];
                        const avatar = avatarModels[interview.avatar_model];
                        const diffColor =
                            difficultyColors[interview.difficulty_level] || "text-foreground";

                        return (
                            <div
                                key={interview.id}
                                className="group rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden hover:border-cyan-500/30 transition-all duration-300"
                            >
                                <div className="p-5 sm:p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                        {/* Avatar preview */}
                                        {interview.interview_mode === "3d-avatar" && avatar && (
                                            <div className="shrink-0">
                                                <img
                                                    src={avatar.image}
                                                    alt={avatar.name}
                                                    className="h-14 w-14 rounded-xl object-cover border border-border/50"
                                                />
                                            </div>
                                        )}
                                        {interview.interview_mode === "voice-only" && (
                                            <div className="shrink-0 flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-500/10 border border-border/50">
                                                <Mic className="h-6 w-6 text-cyan-400" />
                                            </div>
                                        )}

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div>
                                                    <h3 className="text-lg font-semibold truncate">
                                                        {interview.job_title || "Untitled Interview"}
                                                    </h3>
                                                    <div className="flex items-center gap-3 mt-0.5">
                                                        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                                                            <Briefcase className="h-3.5 w-3.5" />
                                                            {interview.company || "—"}
                                                        </span>
                                                        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {interview.duration} min
                                                        </span>
                                                        <span
                                                            className={`text-sm flex items-center gap-1.5 ${diffColor}`}
                                                        >
                                                            {interview.difficulty_level
                                                                .charAt(0)
                                                                .toUpperCase() +
                                                                interview.difficulty_level.slice(1)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className={`shrink-0 ${status.bg} ${status.color}`}
                                                >
                                                    {status.label}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center justify-between mt-3">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>
                                                        Created {formatDate(interview.created_at)}
                                                    </span>
                                                    <span>·</span>
                                                    <span>
                                                        Updated {timeAgo(interview.updated_at)}
                                                    </span>
                                                    {interview.interview_mode === "3d-avatar" && avatar && (
                                                        <>
                                                            <span>·</span>
                                                            <span className="flex items-center gap-1">
                                                                <Bot className="h-3 w-3" />
                                                                {avatar.name}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-2">
                                                    {interview.status === "draft" && (
                                                        <Link to="/create-interview">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="gap-1.5 text-xs cursor-pointer"
                                                            >
                                                                <FileText className="h-3.5 w-3.5" />
                                                                Edit
                                                            </Button>
                                                        </Link>
                                                    )}
                                                    {interview.status === "published" && (
                                                        <Button
                                                            size="sm"
                                                            className="gap-1.5 text-xs bg-cyan-500 hover:bg-cyan-400 text-white cursor-pointer"
                                                            onClick={() =>
                                                                navigate(`/interview-room?id=${interview.id}`)
                                                            }
                                                        >
                                                            <Play className="h-3.5 w-3.5" />
                                                            Start Interview
                                                        </Button>
                                                    )}
                                                    {(interview.status === "completed" || interview.status === "analyzed") && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-1.5 text-xs cursor-pointer"
                                                            onClick={() =>
                                                                navigate(`/results?id=${interview.id}`)
                                                            }
                                                        >
                                                            <BarChart3 className="h-3.5 w-3.5" />
                                                            View Results
                                                        </Button>
                                                    )}
                                                    {(interview.status === "published" ||
                                                        interview.status === "completed" ||
                                                        interview.status === "analyzed") && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="gap-1.5 text-xs text-muted-foreground cursor-pointer"
                                                                onClick={() =>
                                                                    navigate(`/results?id=${interview.id}`)
                                                                }
                                                            >
                                                                <BarChart3 className="h-3.5 w-3.5" />
                                                                Analytics
                                                            </Button>
                                                        )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
