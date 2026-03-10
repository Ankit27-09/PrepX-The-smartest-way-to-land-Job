import type { InterviewFormData } from "../CreateInterviewPage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Upload,
    FileText,
    X,
    FileUp,
    Pencil,
    Sparkles,
    Loader2,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || "http://localhost:8000/api";
const API_BASE = `${FASTAPI_URL}/interviews`;

interface Props {
    data: InterviewFormData;
    updateData: (partial: Partial<InterviewFormData>) => void;
    onNext: () => void;
    isExtracting: boolean;
    setIsExtracting: (v: boolean) => void;
}

export default function StepJobDescription({
    data,
    updateData,
    onNext,
    isExtracting,
    setIsExtracting,
}: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file && file.type === "application/pdf") {
                updateData({ jdFile: file, jdMode: "upload" });
                setError(null);
            }
        },
        [updateData]
    );

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            updateData({ jdFile: file, jdMode: "upload" });
            setError(null);
        }
    };

    const removeFile = () => {
        updateData({ jdFile: null });
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleExtractAndContinue = async () => {
        setError(null);
        setIsExtracting(true);

        try {
            let response: Response;

            if (data.jdMode === "upload") {
                if (!data.jdFile) {
                    setError("Please upload a PDF file first.");
                    setIsExtracting(false);
                    return;
                }
                const formData = new FormData();
                formData.append("file", data.jdFile);

                response = await fetch(`${API_BASE}/upload-jd`, {
                    method: "POST",
                    credentials: 'include',
                    body: formData,
                });
            } else {
                if (!data.jdText.trim() || data.jdText.trim().length < 10) {
                    setError("Please enter at least 10 characters of job description.");
                    setIsExtracting(false);
                    return;
                }

                response = await fetch(`${API_BASE}/manual-jd`, {
                    method: "POST",
                    credentials: 'include',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ jd_text: data.jdText }),
                });
            }

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(
                    errData?.detail || `Server error (${response.status})`
                );
            }

            const result = await response.json();

            const details = result.job_details;
            updateData({
                interviewId: result.interview_id,
                jdText: result.jd_text || data.jdText,
                jobTitle: details.job_title || "",
                company: details.company || "",
                location: details.location || "",
                employmentType: details.employment_type || "full-time",
                experienceLevel: details.experience_level || "mid",
                salaryRange: details.salary_range || "",
                skills: details.skills || [],
                jobDescription: details.job_description || "",
                requirements: details.requirements || "",
            });

            onNext();
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Something went wrong";
            setError(message);
        } finally {
            setIsExtracting(false);
        }
    };

    const canExtract =
        data.jdMode === "upload"
            ? data.jdFile !== null
            : data.jdText.trim().length >= 10;

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-1">Add Job Description</h2>
                <p className="text-sm text-muted-foreground">
                    Upload a PDF or write the job description manually. AI will extract
                    the key details for you.
                </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6">
                <Button
                    variant={data.jdMode === "upload" ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateData({ jdMode: "upload" })}
                    disabled={isExtracting}
                    className={`gap-2 cursor-pointer ${data.jdMode === "upload"
                            ? "bg-cyan-500 hover:bg-cyan-400 text-white"
                            : ""
                        }`}
                >
                    <FileUp className="h-4 w-4" />
                    Upload PDF
                </Button>
                <Button
                    variant={data.jdMode === "manual" ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateData({ jdMode: "manual" })}
                    disabled={isExtracting}
                    className={`gap-2 cursor-pointer ${data.jdMode === "manual"
                            ? "bg-cyan-500 hover:bg-cyan-400 text-white"
                            : ""
                        }`}
                >
                    <Pencil className="h-4 w-4" />
                    Write Manually
                </Button>
            </div>

            {data.jdMode === "upload" ? (
                <div>
                    {/* Drag & Drop Zone */}
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragOver(true);
                        }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => !isExtracting && fileInputRef.current?.click()}
                        className={`relative rounded-xl border-2 border-dashed p-12 text-center transition-all duration-300 ${isExtracting
                                ? "opacity-60 pointer-events-none"
                                : "cursor-pointer"
                            } ${isDragOver
                                ? "border-cyan-500 bg-cyan-500/10"
                                : data.jdFile
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
                        {data.jdFile ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20">
                                    <FileText className="h-7 w-7 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-emerald-400">
                                        {data.jdFile.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {(data.jdFile.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile();
                                    }}
                                    disabled={isExtracting}
                                    className="gap-1.5 text-destructive hover:text-destructive cursor-pointer"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Remove
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10">
                                    <Upload className="h-7 w-7 text-cyan-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">
                                        <span className="text-cyan-400">Click to upload</span> or
                                        drag and drop
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        PDF files only (max 10MB)
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div>
                    <Label htmlFor="jd-text" className="text-sm font-medium mb-2 block">
                        Job Description
                    </Label>
                    <Textarea
                        id="jd-text"
                        placeholder="Paste or type the full job description here...&#10;&#10;Include details like:&#10;• Job title and role overview&#10;• Key responsibilities&#10;• Required qualifications&#10;• Preferred skills&#10;• Company information"
                        value={data.jdText}
                        onChange={(e) => updateData({ jdText: e.target.value })}
                        rows={14}
                        disabled={isExtracting}
                        className="resize-none bg-background/50 border-border/60 focus:border-cyan-500/50 transition-colors"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                        {data.jdText.length} characters
                    </p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                    {error}
                </div>
            )}

            {/* Extract Button */}
            <div className="mt-6 flex justify-end">
                <Button
                    onClick={handleExtractAndContinue}
                    disabled={!canExtract || isExtracting}
                    className="gap-2 bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/25 cursor-pointer"
                >
                    {isExtracting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Extracting with AI...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4" />
                            Extract Details & Continue
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
