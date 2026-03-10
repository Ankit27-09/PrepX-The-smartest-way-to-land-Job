import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    FileText,
    Briefcase,
    MessageSquare,
    Settings,
    CheckCircle,
    ChevronRight,
    ChevronLeft,
    Loader2,
} from "lucide-react";
import StepJobDescription from "./create-interview/StepJobDescription";
import StepJobDetails from "./create-interview/StepJobDetails";
import StepInterviewContext from "./create-interview/StepInterviewContext";
import StepInterviewSettings from "./create-interview/StepInterviewSettings";
import StepReviewPublish from "./create-interview/StepReviewPublish";

export interface InterviewFormData {
    // Meta
    interviewId: string | null;

    // Step 1: Job Description
    jdMode: "upload" | "manual";
    jdFile: File | null;
    jdText: string;

    // Step 2: Job Details
    jobTitle: string;
    company: string;
    location: string;
    employmentType: string;
    experienceLevel: string;
    salaryRange: string;
    skills: string[];
    jobDescription: string;
    requirements: string;

    // Step 3: Interview Context
    resumeFile: File | null;
    difficultyLevel: string;
    focusAreas: string[];
    additionalContext: string;
    codingPlatform: string;

    // Step 4: Settings
    duration: string;
    interviewMode: string;
    avatarModel: string;
    notifyEmail: boolean;
    notifySms: boolean;
    language: string;
    maxRetakes: string;
}

const initialFormData: InterviewFormData = {
    interviewId: null,

    jdMode: "upload",
    jdFile: null,
    jdText: "",

    jobTitle: "",
    company: "",
    location: "",
    employmentType: "full-time",
    experienceLevel: "mid",
    salaryRange: "",
    skills: [],
    jobDescription: "",
    requirements: "",

    resumeFile: null,
    difficultyLevel: "medium",
    focusAreas: [],
    additionalContext: "",
    codingPlatform: "leetcode",

    duration: "30",
    interviewMode: "3d-avatar",
    avatarModel: "michael",
    notifyEmail: true,
    notifySms: false,
    language: "english",
    maxRetakes: "1",
};

const steps = [
    { id: 1, label: "Job Description", icon: FileText },
    { id: 2, label: "Job Details", icon: Briefcase },
    { id: 3, label: "Interview Context", icon: MessageSquare },
    { id: 4, label: "Settings", icon: Settings },
    { id: 5, label: "Review & Publish", icon: CheckCircle },
];

const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || "http://localhost:8000/api";
const API_BASE = `${FASTAPI_URL}/interviews`;

export default function CreateInterviewPage() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<InterviewFormData>(initialFormData);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishError, setPublishError] = useState<string | null>(null);

    const handlePublish = async () => {
        if (!formData.interviewId) {
            setPublishError("Please complete Step 1 first to create an interview.");
            return;
        }

        setIsPublishing(true);
        setPublishError(null);

        try {
            const updateRes = await fetch(`${API_BASE}/${formData.interviewId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    job_details: {
                        job_title: formData.jobTitle,
                        company: formData.company,
                        location: formData.location,
                        employment_type: formData.employmentType,
                        experience_level: formData.experienceLevel,
                        salary_range: formData.salaryRange,
                        skills: formData.skills,
                        job_description: formData.jobDescription,
                        requirements: formData.requirements,
                    },
                    interview_context: {
                        difficulty_level: formData.difficultyLevel,
                        focus_areas: formData.focusAreas,
                        additional_context: formData.additionalContext,
                        coding_platform: formData.codingPlatform,
                    },
                    interview_settings: {
                        duration: formData.duration,
                        interview_mode: formData.interviewMode,
                        avatar_model: formData.avatarModel,
                        notify_email: formData.notifyEmail,
                        notify_sms: formData.notifySms,
                        language: formData.language,
                        max_retakes: formData.maxRetakes,
                    },
                }),
            });

            if (!updateRes.ok) {
                const err = await updateRes.json().catch(() => null);
                throw new Error(err?.detail || "Failed to save interview data.");
            }

            const publishRes = await fetch(`${API_BASE}/${formData.interviewId}/publish`, {
                method: "POST",
            });

            if (!publishRes.ok) {
                const err = await publishRes.json().catch(() => null);
                throw new Error(err?.detail || "Failed to publish interview.");
            }

            navigate("/interviews");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Something went wrong";
            setPublishError(message);
        } finally {
            setIsPublishing(false);
        }
    };

    const updateFormData = (partial: Partial<InterviewFormData>) => {
        setFormData((prev) => ({ ...prev, ...partial }));
    };

    const nextStep = () => setCurrentStep((s) => Math.min(s + 1, 5));
    const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));
    const goToStep = (step: number) => setCurrentStep(step);

    const renderStep = (): ReactNode => {
        switch (currentStep) {
            case 1:
                return (
                    <StepJobDescription
                        data={formData}
                        updateData={updateFormData}
                        onNext={nextStep}
                        isExtracting={isExtracting}
                        setIsExtracting={setIsExtracting}
                    />
                );
            case 2:
                return <StepJobDetails data={formData} updateData={updateFormData} />;
            case 3:
                return (
                    <StepInterviewContext data={formData} updateData={updateFormData} interviewId={formData.interviewId} />
                );
            case 4:
                return (
                    <StepInterviewSettings data={formData} updateData={updateFormData} />
                );
            case 5:
                return <StepReviewPublish data={formData} goToStep={goToStep} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)]">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                        Create New Interview
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Set up your AI-powered interview in a few simple steps.
                    </p>
                </div>

                {/* Stepper */}
                <div className="mb-10">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center flex-1 last:flex-none">
                                <button
                                    onClick={() => goToStep(step.id)}
                                    className={`flex items-center gap-2 sm:gap-3 group cursor-pointer transition-all ${currentStep === step.id
                                        ? ""
                                        : currentStep > step.id
                                            ? "opacity-80 hover:opacity-100"
                                            : "opacity-40 hover:opacity-60"
                                        }`}
                                >
                                    <div
                                        className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${currentStep === step.id
                                            ? "border-cyan-500 bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20"
                                            : currentStep > step.id
                                                ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                                                : "border-border bg-card text-muted-foreground"
                                            }`}
                                    >
                                        {currentStep > step.id ? (
                                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                        ) : (
                                            <step.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                        )}
                                    </div>
                                    <span
                                        className={`hidden lg:block text-sm font-medium transition-colors ${currentStep === step.id
                                            ? "text-cyan-400"
                                            : currentStep > step.id
                                                ? "text-emerald-400"
                                                : "text-muted-foreground"
                                            }`}
                                    >
                                        {step.label}
                                    </span>
                                </button>
                                {index < steps.length - 1 && (
                                    <div className="flex-1 mx-2 sm:mx-4">
                                        <div
                                            className={`h-px transition-colors duration-300 ${currentStep > step.id
                                                ? "bg-emerald-500/50"
                                                : "bg-border"
                                                }`}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step Content */}
                <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-6 sm:p-8">
                    {renderStep()}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-6">
                    <Button
                        variant="outline"
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className="gap-2 cursor-pointer"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>

                    {currentStep < 5 ? (
                        <Button
                            onClick={nextStep}
                            className="gap-2 bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/25 cursor-pointer"
                        >
                            Next Step
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            className="gap-2 bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/25 cursor-pointer"
                            onClick={handlePublish}
                            disabled={isPublishing}
                        >
                            {isPublishing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Publishing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4" />
                                    Publish Interview
                                </>
                            )}
                        </Button>
                    )}
                </div>

                {/* Publish Error */}
                {publishError && (
                    <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                        {publishError}
                    </div>
                )}
            </div>
        </div>
    );
}
