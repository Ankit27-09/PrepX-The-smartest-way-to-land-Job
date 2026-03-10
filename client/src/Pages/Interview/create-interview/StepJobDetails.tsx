import type { InterviewFormData } from "../CreateInterviewPage";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { X, Plus, Sparkles } from "lucide-react";
import { useState } from "react";

interface Props {
    data: InterviewFormData;
    updateData: (partial: Partial<InterviewFormData>) => void;
}

export default function StepJobDetails({ data, updateData }: Props) {
    const [skillInput, setSkillInput] = useState("");

    const addSkill = () => {
        const skill = skillInput.trim();
        if (skill && !data.skills.includes(skill)) {
            updateData({ skills: [...data.skills, skill] });
            setSkillInput("");
        }
    };

    const removeSkill = (skill: string) => {
        updateData({ skills: data.skills.filter((s) => s !== skill) });
    };

    const handleSkillKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addSkill();
        }
    };

    return (
        <div>
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <h2 className="text-xl font-semibold mb-1">Job Details</h2>
                    <p className="text-sm text-muted-foreground">
                        Review and edit the extracted job details. These fields will be
                        auto-populated when backend is connected.
                    </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    <span className="text-xs font-medium text-amber-400">
                        AI Extracted
                    </span>
                </div>
            </div>

            <div className="space-y-5">
                {/* Row: Title + Company */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="jobTitle" className="text-sm font-medium mb-1.5 block">
                            Job Title
                        </Label>
                        <Input
                            id="jobTitle"
                            placeholder="e.g. Senior Frontend Engineer"
                            value={data.jobTitle}
                            onChange={(e) => updateData({ jobTitle: e.target.value })}
                            className="bg-background/50 border-border/60 focus:border-cyan-500/50"
                        />
                    </div>
                    <div>
                        <Label htmlFor="company" className="text-sm font-medium mb-1.5 block">
                            Company
                        </Label>
                        <Input
                            id="company"
                            placeholder="e.g. Acme Corp"
                            value={data.company}
                            onChange={(e) => updateData({ company: e.target.value })}
                            className="bg-background/50 border-border/60 focus:border-cyan-500/50"
                        />
                    </div>
                </div>

                {/* Row: Location + Employment Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="location" className="text-sm font-medium mb-1.5 block">
                            Location
                        </Label>
                        <Input
                            id="location"
                            placeholder="e.g. Remote, San Francisco, CA"
                            value={data.location}
                            onChange={(e) => updateData({ location: e.target.value })}
                            className="bg-background/50 border-border/60 focus:border-cyan-500/50"
                        />
                    </div>
                    <div>
                        <Label className="text-sm font-medium mb-1.5 block">
                            Employment Type
                        </Label>
                        <Select
                            value={data.employmentType}
                            onValueChange={(val) => updateData({ employmentType: val })}
                        >
                            <SelectTrigger className="bg-background/50 border-border/60">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="full-time">Full-time</SelectItem>
                                <SelectItem value="part-time">Part-time</SelectItem>
                                <SelectItem value="contract">Contract</SelectItem>
                                <SelectItem value="internship">Internship</SelectItem>
                                <SelectItem value="freelance">Freelance</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Row: Experience Level + Salary Range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Label className="text-sm font-medium mb-1.5 block">
                            Experience Level
                        </Label>
                        <Select
                            value={data.experienceLevel}
                            onValueChange={(val) => updateData({ experienceLevel: val })}
                        >
                            <SelectTrigger className="bg-background/50 border-border/60">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="entry">Entry Level (0-2 yrs)</SelectItem>
                                <SelectItem value="mid">Mid Level (2-5 yrs)</SelectItem>
                                <SelectItem value="senior">Senior (5-8 yrs)</SelectItem>
                                <SelectItem value="lead">Lead (8+ yrs)</SelectItem>
                                <SelectItem value="executive">Executive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="salary" className="text-sm font-medium mb-1.5 block">
                            Salary Range
                        </Label>
                        <Input
                            id="salary"
                            placeholder="e.g. $120K - $160K"
                            value={data.salaryRange}
                            onChange={(e) => updateData({ salaryRange: e.target.value })}
                            className="bg-background/50 border-border/60 focus:border-cyan-500/50"
                        />
                    </div>
                </div>

                {/* Skills */}
                <div>
                    <Label className="text-sm font-medium mb-1.5 block">
                        Required Skills
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Type a skill and press Enter"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={handleSkillKeyDown}
                            className="bg-background/50 border-border/60 focus:border-cyan-500/50"
                        />
                        <button
                            onClick={addSkill}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background/50 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-colors cursor-pointer"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                    {data.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {data.skills.map((skill) => (
                                <Badge
                                    key={skill}
                                    variant="secondary"
                                    className="gap-1 px-2.5 py-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20"
                                >
                                    {skill}
                                    <button
                                        onClick={() => removeSkill(skill)}
                                        className="ml-0.5 hover:text-foreground transition-colors cursor-pointer"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* Job Description */}
                <div>
                    <Label htmlFor="description" className="text-sm font-medium mb-1.5 block">
                        Job Description
                    </Label>
                    <Textarea
                        id="description"
                        placeholder="Detailed job description..."
                        value={data.jobDescription}
                        onChange={(e) => updateData({ jobDescription: e.target.value })}
                        rows={5}
                        className="resize-none bg-background/50 border-border/60 focus:border-cyan-500/50"
                    />
                </div>

                {/* Requirements */}
                <div>
                    <Label htmlFor="requirements" className="text-sm font-medium mb-1.5 block">
                        Requirements
                    </Label>
                    <Textarea
                        id="requirements"
                        placeholder="Key requirements and qualifications..."
                        value={data.requirements}
                        onChange={(e) => updateData({ requirements: e.target.value })}
                        rows={4}
                        className="resize-none bg-background/50 border-border/60 focus:border-cyan-500/50"
                    />
                </div>
            </div>
        </div>
    );
}
