import type { InterviewFormData } from "../CreateInterviewPage";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, X, Loader2, CheckCircle2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface Props {
    data: InterviewFormData;
    updateData: (partial: Partial<InterviewFormData>) => void;
    interviewId: string | null;
}

const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || "http://localhost:8000/api";
const API_BASE = `${FASTAPI_URL}/interviews`;

const focusAreaOptions = [
    "Technical Skills",
    "Problem Solving",
    "System Design",
    "Behavioral",
    "Communication",
    "Leadership",
    "Cultural Fit",
    "Domain Knowledge",
];

export default function StepInterviewContext({ data, updateData, interviewId }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const uploadResume = async (file: File) => {
        if (!interviewId) {
            setUploadError("Please complete Step 1 first.");
            return;
        }

        setIsUploading(true);
        setUploadError(null);
        setUploadStatus(null);
        updateData({ resumeFile: file });

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(`${API_BASE}/${interviewId}/upload-resume`, {
                method: "POST",
                credentials: 'include',
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.detail || "Failed to upload resume.");
            }

            const result = await res.json();
            setUploadStatus(result.message);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Upload failed";
            setUploadError(msg);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);
            const file = e.dataTransfer.files[0];
            if (
                file &&
                (file.type === "application/pdf" ||
                    file.name.endsWith(".pdf"))
            ) {
                uploadResume(file);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [interviewId]
    );

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadResume(file);
        }
    };

    const toggleFocusArea = (area: string) => {
        const current = data.focusAreas;
        if (current.includes(area)) {
            updateData({ focusAreas: current.filter((a) => a !== area) });
        } else {
            updateData({ focusAreas: [...current, area] });
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-1">Interview Context</h2>
                <p className="text-sm text-muted-foreground">
                    Provide additional context for a more tailored interview experience.
                </p>
            </div>

            <div className="space-y-6">
                {/* Resume Upload */}
                <div>
                    <Label className="text-sm font-medium mb-2 block">
                        Candidate Resume (Optional)
                    </Label>
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragOver(true);
                        }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300 ${isDragOver
                                ? "border-cyan-500 bg-cyan-500/10"
                                : data.resumeFile
                                    ? "border-emerald-500/50 bg-emerald-500/5"
                                    : "border-border hover:border-cyan-500/50 hover:bg-cyan-500/5"
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
                                <p className="text-sm text-cyan-400 font-medium">
                                    Parsing resume...
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Extracting text from your resume
                                </p>
                            </div>
                        ) : data.resumeFile ? (
                            <div className="flex items-center justify-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                                    <FileText className="h-5 w-5 text-emerald-400" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-emerald-400">
                                        {data.resumeFile.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {(data.resumeFile.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        updateData({ resumeFile: null });
                                        setUploadStatus(null);
                                        setUploadError(null);
                                        if (fileInputRef.current) fileInputRef.current.value = "";
                                    }}
                                    className="ml-2 p-1.5 rounded-md hover:bg-destructive/10 transition-colors cursor-pointer"
                                >
                                    <X className="h-4 w-4 text-destructive" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                                    <Upload className="h-5 w-5 text-cyan-400" />
                                </div>
                                <p className="text-sm">
                                    <span className="text-cyan-400 font-medium">
                                        Upload resume
                                    </span>{" "}
                                    or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    PDF (max 5MB)
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Upload Status */}
                    {uploadStatus && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {uploadStatus}
                        </div>
                    )}
                    {uploadError && (
                        <div className="mt-2 text-xs text-destructive">
                            {uploadError}
                        </div>
                    )}
                </div>

                {/* Difficulty Level */}
                <div>
                    <Label className="text-sm font-medium mb-2 block">
                        Difficulty Level
                    </Label>
                    <Select
                        value={data.difficultyLevel}
                        onValueChange={(val) => updateData({ difficultyLevel: val })}
                    >
                        <SelectTrigger className="bg-background/50 border-border/60 w-full sm:w-64">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="easy">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    Easy — Fundamental concepts
                                </div>
                            </SelectItem>
                            <SelectItem value="medium">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                                    Medium — Practical application
                                </div>
                            </SelectItem>
                            <SelectItem value="hard">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                                    Hard — Advanced problem-solving
                                </div>
                            </SelectItem>
                            <SelectItem value="expert">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-red-500" />
                                    Expert — System design & architecture
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Coding Question Platform */}
                <div>
                    <Label className="text-sm font-medium mb-2 block">
                        Coding Question Platform
                    </Label>
                    <p className="text-xs text-muted-foreground mb-3">
                        Choose where coding questions will be sourced from during the interview.
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:w-96">
                        {([
                            {
                                value: "leetcode",
                                label: "LeetCode",
                                description: "Popular DSA problems",
                                color: "amber",
                                logo: "/logo/LeetCode_logo.png",
                            },
                            {
                                value: "codeforces",
                                label: "Codeforces",
                                description: "Competitive programming",
                                color: "blue",
                                logo: "/logo/CodeForces_logo.png",
                            },
                        ] as const).map((platform) => {
                            const selected = data.codingPlatform === platform.value;
                            return (
                                <button
                                    key={platform.value}
                                    type="button"
                                    onClick={() => updateData({ codingPlatform: platform.value })}
                                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                                        selected
                                            ? platform.color === "amber"
                                                ? "border-amber-500/60 bg-amber-500/10"
                                                : "border-blue-500/60 bg-blue-500/10"
                                            : "border-border/50 hover:border-cyan-500/30 hover:bg-cyan-500/5"
                                    }`}
                                >
                                    <img
                                        src={platform.logo}
                                        alt={platform.label}
                                        className="h-9 w-9 rounded-lg object-contain"
                                    />
                                    <div>
                                        <p
                                            className={`text-sm font-medium ${
                                                selected
                                                    ? platform.color === "amber"
                                                        ? "text-amber-300"
                                                        : "text-blue-300"
                                                    : ""
                                            }`}
                                        >
                                            {platform.label}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {platform.description}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Focus Areas */}
                <div>
                    <Label className="text-sm font-medium mb-3 block">
                        Interview Focus Areas
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {focusAreaOptions.map((area) => {
                            const checked = data.focusAreas.includes(area);
                            return (
                                <label
                                    key={area}
                                    className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${checked
                                            ? "border-cyan-500/50 bg-cyan-500/10"
                                            : "border-border/50 hover:border-cyan-500/30 hover:bg-cyan-500/5"
                                        }`}
                                >
                                    <Checkbox
                                        checked={checked}
                                        onCheckedChange={() => toggleFocusArea(area)}
                                        className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                                    />
                                    <span className="text-sm">{area}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                {/* Additional Context */}
                <div>
                    <Label
                        htmlFor="additional-context"
                        className="text-sm font-medium mb-1.5 block"
                    >
                        Additional Context
                    </Label>
                    <Textarea
                        id="additional-context"
                        placeholder="Any additional instructions or context for the AI interviewer...&#10;&#10;e.g. Focus on React and TypeScript, include questions about state management patterns."
                        value={data.additionalContext}
                        onChange={(e) => updateData({ additionalContext: e.target.value })}
                        rows={4}
                        className="resize-none bg-background/50 border-border/60 focus:border-cyan-500/50"
                    />
                </div>
            </div>
        </div>
    );
}
