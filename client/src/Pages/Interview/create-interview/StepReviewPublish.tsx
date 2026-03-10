import type { InterviewFormData } from "../CreateInterviewPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    FileText,
    Briefcase,
    MessageSquare,
    Settings,
    Pencil,
    CheckCircle2,
    Upload,
    Bot,
    Mic,
    Clock,
    Mail,
    Smartphone,
    Globe,
    RotateCcw,
    User,
    Code2,
} from "lucide-react";

interface Props {
    data: InterviewFormData;
    goToStep: (step: number) => void;
}

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

export default function StepReviewPublish({ data, goToStep }: Props) {
    const sections = [
        {
            step: 1,
            title: "Job Description",
            icon: FileText,
            content: () => (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="secondary"
                            className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                        >
                            {data.jdMode === "upload" ? "PDF Upload" : "Manual Entry"}
                        </Badge>
                    </div>
                    {data.jdMode === "upload" && data.jdFile ? (
                        <div className="flex items-center gap-2 text-sm">
                            <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{data.jdFile.name}</span>
                            <span className="text-muted-foreground">
                                ({(data.jdFile.size / 1024).toFixed(1)} KB)
                            </span>
                        </div>
                    ) : data.jdText ? (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                            {data.jdText}
                        </p>
                    ) : (
                        <p className="text-sm text-amber-400">
                            No job description provided
                        </p>
                    )}
                </div>
            ),
        },
        {
            step: 2,
            title: "Job Details",
            icon: Briefcase,
            content: () => (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                        {[
                            { label: "Title", value: data.jobTitle },
                            { label: "Company", value: data.company },
                            { label: "Location", value: data.location },
                            { label: "Type", value: data.employmentType },
                            { label: "Experience", value: data.experienceLevel },
                            { label: "Salary", value: data.salaryRange },
                        ].map((field) => (
                            <div key={field.label} className="flex items-baseline gap-2">
                                <span className="text-xs text-muted-foreground w-20 shrink-0">
                                    {field.label}:
                                </span>
                                <span className="text-sm">
                                    {field.value || (
                                        <span className="text-muted-foreground italic">—</span>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                    {data.skills.length > 0 && (
                        <div>
                            <span className="text-xs text-muted-foreground">Skills:</span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {data.skills.map((skill) => (
                                    <Badge
                                        key={skill}
                                        variant="secondary"
                                        className="text-xs bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                                    >
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ),
        },
        {
            step: 3,
            title: "Interview Context",
            icon: MessageSquare,
            content: () => (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-20 shrink-0">
                                Resume:
                            </span>
                            <span className="text-sm">
                                {data.resumeFile ? (
                                    <span className="flex items-center gap-1.5">
                                        <FileText className="h-3.5 w-3.5 text-emerald-400" />
                                        {data.resumeFile.name}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground italic">None</span>
                                )}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-20 shrink-0">
                                Difficulty:
                            </span>
                            <Badge
                                variant="secondary"
                                className={`text-xs ${data.difficultyLevel === "easy"
                                    ? "bg-emerald-500/10 text-emerald-300"
                                    : data.difficultyLevel === "medium"
                                        ? "bg-amber-500/10 text-amber-300"
                                        : data.difficultyLevel === "hard"
                                            ? "bg-orange-500/10 text-orange-300"
                                            : "bg-red-500/10 text-red-300"
                                    }`}
                            >
                                {data.difficultyLevel.charAt(0).toUpperCase() +
                                    data.difficultyLevel.slice(1)}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-20 shrink-0">
                                Platform:
                            </span>
                            <Badge
                                variant="secondary"
                                className={`text-xs flex items-center gap-1 ${
                                    data.codingPlatform === "leetcode"
                                        ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                                        : "bg-blue-500/10 text-blue-300 border-blue-500/20"
                                }`}
                            >
                                <Code2 className="h-3 w-3" />
                                {data.codingPlatform === "leetcode" ? "LeetCode" : "Codeforces"}
                            </Badge>
                        </div>
                    </div>
                    {data.focusAreas.length > 0 && (
                        <div>
                            <span className="text-xs text-muted-foreground">
                                Focus Areas:
                            </span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {data.focusAreas.map((area) => (
                                    <Badge
                                        key={area}
                                        variant="outline"
                                        className="text-xs border-border/60"
                                    >
                                        {area}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                    {data.additionalContext && (
                        <div>
                            <span className="text-xs text-muted-foreground">Context:</span>
                            <p className="text-sm mt-0.5 text-muted-foreground line-clamp-2">
                                {data.additionalContext}
                            </p>
                        </div>
                    )}
                </div>
            ),
        },
        {
            step: 4,
            title: "Interview Settings",
            icon: Settings,
            content: () => {
                const selectedAvatar = avatarModels[data.avatarModel];
                return (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2">
                            {[
                                {
                                    icon: Clock,
                                    label: "Duration",
                                    value: `${data.duration} min`,
                                },
                                {
                                    icon: Globe,
                                    label: "Language",
                                    value:
                                        data.language.charAt(0).toUpperCase() +
                                        data.language.slice(1),
                                },
                                {
                                    icon: RotateCcw,
                                    label: "Retakes",
                                    value:
                                        data.maxRetakes === "unlimited"
                                            ? "Unlimited"
                                            : data.maxRetakes,
                                },
                                {
                                    icon: data.interviewMode === "3d-avatar" ? Bot : Mic,
                                    label: "Mode",
                                    value:
                                        data.interviewMode === "3d-avatar"
                                            ? "3D Avatar"
                                            : "Voice Only",
                                },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center gap-2">
                                    <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                        {item.label}:
                                    </span>
                                    <span className="text-sm font-medium">{item.value}</span>
                                </div>
                            ))}
                        </div>

                        {data.interviewMode === "3d-avatar" && selectedAvatar && (
                            <>
                                <Separator className="bg-border/30" />
                                <div className="flex items-center gap-3">
                                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                        Avatar:
                                    </span>
                                    <div className="flex items-center gap-2.5">
                                        <img
                                            src={selectedAvatar.image}
                                            alt={selectedAvatar.name}
                                            className="h-8 w-8 rounded-full object-cover border border-cyan-500/30"
                                        />
                                        <span className="text-sm font-medium text-cyan-300">
                                            {selectedAvatar.name}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}

                        <Separator className="bg-border/30" />

                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs">Email:</span>
                                {data.notifyEmail ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                    <span className="text-xs text-muted-foreground">Off</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs">SMS:</span>
                                {data.notifySms ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                    <span className="text-xs text-muted-foreground">Off</span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            },
        },
    ];

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-1">Review & Publish</h2>
                <p className="text-sm text-muted-foreground">
                    Review all details before publishing your interview.
                </p>
            </div>

            <div className="space-y-4">
                {sections.map((section) => (
                    <div
                        key={section.step}
                        className="rounded-xl border border-border/50 bg-background/30 overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-5 py-3 bg-background/50">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10">
                                    <section.icon className="h-3.5 w-3.5 text-cyan-400" />
                                </div>
                                <h3 className="text-sm font-semibold">{section.title}</h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => goToStep(section.step)}
                                className="gap-1.5 text-xs text-muted-foreground hover:text-cyan-400 cursor-pointer"
                            >
                                <Pencil className="h-3 w-3" />
                                Edit
                            </Button>
                        </div>
                        <div className="px-5 py-4">{section.content()}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
