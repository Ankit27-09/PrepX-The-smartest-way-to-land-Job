import type { InterviewFormData } from "../CreateInterviewPage";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Clock,
    Bot,
    Mic,
    Mail,
    Smartphone,
    Globe,
    RotateCcw,
    User,
} from "lucide-react";

interface Props {
    data: InterviewFormData;
    updateData: (partial: Partial<InterviewFormData>) => void;
}

const avatarModels = [
    { id: "michael", name: "Michael", image: "/michael.jpg" },
    { id: "laura", name: "Laura", image: "/laura.jpg" },
    { id: "nelly", name: "Nelly", image: "/nelly.jpg" },
    { id: "fjolla", name: "Fjolla", image: "/fjolla.jpg" },
    { id: "ege", name: "Ege", image: "/ege.jpg" },
    { id: "zaid", name: "Zaid", image: "/zaid.jpg" },
    { id: "awais", name: "Awais", image: "/awais.jpg" },
    { id: "jerome", name: "Jerome", image: "/jerome.jpg" },
];

export default function StepInterviewSettings({ data, updateData }: Props) {
    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-1">Interview Settings</h2>
                <p className="text-sm text-muted-foreground">
                    Configure interview parameters and preferences.
                </p>
            </div>

            <div className="space-y-8">
                {/* Duration & General */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="h-4 w-4 text-cyan-400" />
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            General
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <Label className="text-sm font-medium mb-1.5 block">
                                Duration
                            </Label>
                            <Select
                                value={data.duration}
                                onValueChange={(val) => updateData({ duration: val })}
                            >
                                <SelectTrigger className="bg-background/50 border-border/60">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="15">15 minutes</SelectItem>
                                    <SelectItem value="30">30 minutes</SelectItem>
                                    <SelectItem value="45">45 minutes</SelectItem>
                                    <SelectItem value="60">60 minutes</SelectItem>
                                    <SelectItem value="90">90 minutes</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-sm font-medium mb-1.5 block">
                                <div className="flex items-center gap-1.5">
                                    <Globe className="h-3.5 w-3.5" />
                                    Language
                                </div>
                            </Label>
                            <Select
                                value={data.language}
                                onValueChange={(val) => updateData({ language: val })}
                            >
                                <SelectTrigger className="bg-background/50 border-border/60">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="english">English</SelectItem>
                                    <SelectItem value="spanish">Spanish</SelectItem>
                                    <SelectItem value="french">French</SelectItem>
                                    <SelectItem value="german">German</SelectItem>
                                    <SelectItem value="hindi">Hindi</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-sm font-medium mb-1.5 block">
                                <div className="flex items-center gap-1.5">
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    Max Retakes
                                </div>
                            </Label>
                            <Select
                                value={data.maxRetakes}
                                onValueChange={(val) => updateData({ maxRetakes: val })}
                            >
                                <SelectTrigger className="bg-background/50 border-border/60">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">No retakes</SelectItem>
                                    <SelectItem value="1">1 retake</SelectItem>
                                    <SelectItem value="2">2 retakes</SelectItem>
                                    <SelectItem value="3">3 retakes</SelectItem>
                                    <SelectItem value="unlimited">Unlimited</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Interview Mode */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Bot className="h-4 w-4 text-cyan-400" />
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Interview Mode
                        </h3>
                    </div>
                    <RadioGroup
                        value={data.interviewMode}
                        onValueChange={(val) => updateData({ interviewMode: val })}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                        <label
                            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${data.interviewMode === "3d-avatar"
                                ? "border-cyan-500/50 bg-cyan-500/10"
                                : "border-border/50 hover:border-cyan-500/30"
                                }`}
                        >
                            <RadioGroupItem value="3d-avatar" className="mt-0.5" />
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Bot className="h-4 w-4 text-cyan-400" />
                                    <span className="text-sm font-medium">3D Avatar</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Lifelike 3D avatar conducts the interview with realistic
                                    facial expressions and natural conversation flow.
                                </p>
                            </div>
                        </label>
                        <label
                            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${data.interviewMode === "voice-only"
                                ? "border-cyan-500/50 bg-cyan-500/10"
                                : "border-border/50 hover:border-cyan-500/30"
                                }`}
                        >
                            <RadioGroupItem value="voice-only" className="mt-0.5" />
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Mic className="h-4 w-4 text-cyan-400" />
                                    <span className="text-sm font-medium">Voice Only</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Audio-only interview with AI voice. Lightweight and ideal for
                                    phone-style screening interviews.
                                </p>
                            </div>
                        </label>
                    </RadioGroup>
                </div>

                {/* 3D Avatar Model Selector */}
                {data.interviewMode === "3d-avatar" && (
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <User className="h-4 w-4 text-cyan-400" />
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                Select Avatar Model
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {avatarModels.map((model) => {
                                const isSelected = data.avatarModel === model.id;
                                return (
                                    <button
                                        key={model.id}
                                        onClick={() => updateData({ avatarModel: model.id })}
                                        className={`group relative rounded-xl border-2 overflow-hidden transition-all duration-300 cursor-pointer ${isSelected
                                            ? "border-cyan-500 shadow-lg shadow-cyan-500/20 scale-[1.02]"
                                            : "border-border/50 hover:border-cyan-500/40 hover:shadow-md hover:shadow-cyan-500/10"
                                            }`}
                                    >
                                        <div className="aspect-square overflow-hidden bg-card">
                                            <img
                                                src={model.image}
                                                alt={model.name}
                                                className={`w-full h-full object-cover transition-all duration-300 ${isSelected
                                                    ? "scale-105"
                                                    : "grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105"
                                                    }`}
                                            />
                                        </div>
                                        <div
                                            className={`px-3 py-2.5 text-center transition-colors ${isSelected
                                                ? "bg-cyan-500/15"
                                                : "bg-card/80 group-hover:bg-cyan-500/5"
                                                }`}
                                        >
                                            <span
                                                className={`text-sm font-medium ${isSelected
                                                    ? "text-cyan-300"
                                                    : "text-muted-foreground group-hover:text-foreground"
                                                    }`}
                                            >
                                                {model.name}
                                            </span>
                                        </div>
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 shadow-lg">
                                                <svg
                                                    className="h-3.5 w-3.5 text-white"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={3}
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Notifications */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Mail className="h-4 w-4 text-cyan-400" />
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Notifications
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {[
                            {
                                key: "notifyEmail" as const,
                                icon: Mail,
                                label: "Email Notifications",
                                description:
                                    "Receive email when a candidate completes the interview",
                            },
                            {
                                key: "notifySms" as const,
                                icon: Smartphone,
                                label: "SMS Notifications",
                                description:
                                    "Get SMS alerts for interview completions and important events",
                            },
                        ].map((item) => (
                            <div
                                key={item.key}
                                className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/30 hover:border-cyan-500/20 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10">
                                        <item.icon className="h-4 w-4 text-cyan-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{item.label}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={data[item.key]}
                                    onCheckedChange={(checked) =>
                                        updateData({ [item.key]: checked })
                                    }
                                    className="data-[state=checked]:bg-cyan-500"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
