/* ── Career Profile — Multi-Step Wizard Form ──────────────────────────── */
import { useState, useRef } from "react";
import { useCareerStore, type CareerProfile } from "@/lib/career-store";
import { uploadResume } from "@/lib/career-api";
import {
  GraduationCap,
  Target,
  Code2,
  Settings2,
  Rocket,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
} from "lucide-react";

/* ── Constants ────────────────────────────────────────────────────────── */

const EDUCATION_LEVELS = [
  "1st Year Undergraduate",
  "2nd Year Undergraduate",
  "3rd Year Undergraduate",
  "4th Year Undergraduate",
  "Recent Graduate",
  "Masters Student",
  "PhD Student",
  "Working Professional",
];

const CAREER_FIELDS = [
  "Technology",
  "AI/ML",
  "Data Science",
  "Finance",
  "Healthcare",
  "Design/UX",
  "Marketing",
  "Consulting",
  "Research",
  "Entrepreneurship",
  "Education",
  "Government",
  "Media",
  "Law",
];

const CAREER_GOALS = [
  "Technical Excellence",
  "Leadership/Management",
  "Entrepreneurship",
  "Research/Academia",
  "Work-Life Balance",
  "Financial Independence",
  "Social Impact",
  "Creative Fulfillment",
];

const ROLE_LEVELS = [
  "Entry Level",
  "Mid Level",
  "Senior IC",
  "Management",
  "Executive",
  "Freelance/Independent",
];

const WORK_ENVS = [
  "Startup",
  "Big Tech",
  "MNC",
  "Government",
  "Remote",
  "Hybrid",
  "Freelance",
  "Research Lab",
];

const WORK_STYLES = ["Analytical", "Creative", "Practical", "Social", "Investigative"];
const RISK_LEVELS = ["Low", "Medium", "High"];
const INVESTMENT_CAPS = [
  "< $1k",
  "$1k-$5k",
  "$5k-$20k",
  "$20k-$50k",
  "$50k+",
];
const AWARENESS_LEVELS = ["Low", "Medium", "High"];
const OPTIMISM_LEVELS = ["Conservative", "Balanced", "Optimistic"];
const CONCERNS = [
  "Competition",
  "Skill Relevance",
  "Job Security",
  "Salary Growth",
  "Work-Life Balance",
  "Career Stagnation",
  "Industry Disruption",
  "Burnout",
];

const GRADING_SCALES = ["4.0", "5.0", "10.0", "100"];

/* ── Form Steps ───────────────────────────────────────────────────────── */

const FORM_STEPS = [
  { key: "education", label: "Education", icon: GraduationCap },
  { key: "career", label: "Career Goals", icon: Target },
  { key: "skills", label: "Skills", icon: Code2 },
  { key: "preferences", label: "Preferences", icon: Settings2 },
  { key: "review", label: "Launch", icon: Rocket },
] as const;

/* ── Main Component ───────────────────────────────────────────────────── */

export default function SimulateForm() {
  const [formStep, setFormStep] = useState(0);
  const profile = useCareerStore((s) => s.profile);
  const setProfile = useCareerStore((s) => s.setProfile);
  const analyze = useCareerStore((s) => s.analyze);

  const next = () => setFormStep((s) => Math.min(s + 1, FORM_STEPS.length - 1));
  const prev = () => setFormStep((s) => Math.max(s - 1, 0));

  return (
    <div className="mx-auto max-w-3xl">
      {/* Step tabs */}
      <div className="mb-8 flex gap-2 overflow-x-auto">
        {FORM_STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === formStep;
          return (
            <button
              key={s.key}
              onClick={() => setFormStep(i)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/50"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
              }`}
            >
              <Icon className="h-4 w-4" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
        {formStep === 0 && (
          <EducationStep profile={profile} setProfile={setProfile} />
        )}
        {formStep === 1 && (
          <CareerStep profile={profile} setProfile={setProfile} />
        )}
        {formStep === 2 && (
          <SkillsStep profile={profile} setProfile={setProfile} />
        )}
        {formStep === 3 && (
          <PreferencesStep profile={profile} setProfile={setProfile} />
        )}
        {formStep === 4 && (
          <ReviewStep profile={profile} onSubmit={analyze} />
        )}

        {/* Nav buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={prev}
            disabled={formStep === 0}
            className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm text-white/60 transition hover:text-white disabled:invisible"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          {formStep < FORM_STEPS.length - 1 ? (
            <button
              onClick={next}
              className="flex items-center gap-1 rounded-lg bg-cyan-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-cyan-400"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={analyze}
              className="flex items-center gap-2 rounded-lg bg-linear-to-r from-cyan-500 to-violet-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-cyan-500/40"
            >
              <Rocket className="h-4 w-4" /> Analyze My Career
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Reusable primitives ──────────────────────────────────────────────── */

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-white/80">{children}</label>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/30 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
    />
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 [&>option]:bg-neutral-900"
    >
      <option value="">{placeholder ?? "Select…"}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function ChipSelect({
  selected,
  options,
  onChange,
}: {
  selected: string[];
  options: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              active
                ? "bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/50"
                : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

/* ── Step 1: Education ────────────────────────────────────────────────── */

type StepProps = {
  profile: CareerProfile;
  setProfile: (partial: Partial<CareerProfile>) => void;
};

function EducationStep({ profile, setProfile }: StepProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleResume = async (file: File) => {
    setUploadError("");
    setUploading(true);
    try {
      const res = await uploadResume(file);
      setProfile({ resume_text: res.resume_text, resume_filename: res.filename });
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") handleResume(file);
    else setUploadError("Please upload a PDF file");
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white">Education Background</h2>

      {/* Resume upload */}
      <div>
        <Label>Upload Resume (optional — for more accurate results)</Label>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 transition ${
            profile.resume_filename
              ? "border-emerald-500/40 bg-emerald-500/5"
              : "border-white/15 bg-white/5 hover:border-cyan-500/30 hover:bg-white/8"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleResume(f);
            }}
          />
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              <p className="text-sm text-white/60">Processing resume…</p>
            </>
          ) : profile.resume_filename ? (
            <>
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              <p className="text-sm font-medium text-emerald-300">
                <FileText className="mr-1 inline h-4 w-4" />
                {profile.resume_filename}
              </p>
              <p className="text-xs text-white/40">
                Click or drag to replace
              </p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-white/30" />
              <p className="text-sm text-white/50">
                Drag & drop your resume PDF here, or click to browse
              </p>
              <p className="text-xs text-white/30">
                Your resume helps AI provide more accurate career recommendations
              </p>
            </>
          )}
        </div>
        {uploadError && (
          <p className="mt-1 text-xs text-rose-400">{uploadError}</p>
        )}
      </div>

      <div>
        <Label>Education Level</Label>
        <Select
          value={profile.current_education_level}
          onChange={(v) => setProfile({ current_education_level: v })}
          options={EDUCATION_LEVELS}
          placeholder="Select your level…"
        />
      </div>

      <div>
        <Label>Institution</Label>
        <Input
          value={profile.institution_name}
          onChange={(e) => setProfile({ institution_name: e.target.value })}
          placeholder="e.g. IIT Delhi"
        />
      </div>

      <div>
        <Label>Major / Field of Study</Label>
        <Input
          value={profile.current_major}
          onChange={(e) => setProfile({ current_major: e.target.value })}
          placeholder="e.g. Computer Science"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>GPA</Label>
          <Input
            type="number"
            step="0.01"
            value={profile.current_gpa || ""}
            onChange={(e) => setProfile({ current_gpa: parseFloat(e.target.value) || 0 })}
            placeholder="8.5"
          />
        </div>
        <div>
          <Label>Scale</Label>
          <Select
            value={profile.grading_scale}
            onChange={(v) => setProfile({ grading_scale: v })}
            options={GRADING_SCALES}
          />
        </div>
        <div>
          <Label>Graduation Year</Label>
          <Input
            type="number"
            value={profile.expected_graduation_year || ""}
            onChange={(e) =>
              setProfile({ expected_graduation_year: parseInt(e.target.value) || 0 })
            }
            placeholder="2027"
          />
        </div>
      </div>

      <div>
        <Label>Country</Label>
        <Input
          value={profile.current_country}
          onChange={(e) => setProfile({ current_country: e.target.value })}
          placeholder="e.g. India, USA, UK"
        />
      </div>
    </div>
  );
}

/* ── Step 2: Career Goals ─────────────────────────────────────────────── */

function CareerStep({ profile, setProfile }: StepProps) {
  const [roleInput, setRoleInput] = useState("");

  const addRole = () => {
    const v = roleInput.trim();
    if (v && !profile.specific_roles.includes(v)) {
      setProfile({ specific_roles: [...profile.specific_roles, v] });
      setRoleInput("");
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white">Career Goals</h2>

      <div>
        <Label>Target Career Fields</Label>
        <ChipSelect
          selected={profile.target_career_fields}
          options={CAREER_FIELDS}
          onChange={(v) => setProfile({ target_career_fields: v })}
        />
      </div>

      <div>
        <Label>Specific Roles</Label>
        <div className="flex gap-2">
          <Input
            value={roleInput}
            onChange={(e) => setRoleInput(e.target.value)}
            placeholder="e.g. ML Engineer"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRole())}
          />
          <button
            type="button"
            onClick={addRole}
            className="rounded-lg bg-cyan-500/20 px-3 text-cyan-400 transition hover:bg-cyan-500/30"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {profile.specific_roles.map((r) => (
            <span
              key={r}
              className="flex items-center gap-1 rounded-full bg-violet-500/20 px-3 py-1 text-xs text-violet-300"
            >
              {r}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  setProfile({ specific_roles: profile.specific_roles.filter((x) => x !== r) })
                }
              />
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Primary Goal</Label>
          <Select
            value={profile.primary_career_goal}
            onChange={(v) => setProfile({ primary_career_goal: v })}
            options={CAREER_GOALS}
          />
        </div>
        <div>
          <Label>Desired Role Level</Label>
          <Select
            value={profile.desired_role_level}
            onChange={(v) => setProfile({ desired_role_level: v })}
            options={ROLE_LEVELS}
          />
        </div>
      </div>

      <div>
        <Label>Preferred Work Environment</Label>
        <ChipSelect
          selected={profile.preferred_work_env}
          options={WORK_ENVS}
          onChange={(v) => setProfile({ preferred_work_env: v })}
        />
      </div>
    </div>
  );
}

/* ── Step 3: Skills ───────────────────────────────────────────────────── */

function SkillsStep({ profile, setProfile }: StepProps) {
  const [skillName, setSkillName] = useState("");
  const [skillLevel, setSkillLevel] = useState("Intermediate");

  const addSkill = () => {
    const name = skillName.trim();
    if (name) {
      setProfile({ technical_skills: { ...profile.technical_skills, [name]: skillLevel } });
      setSkillName("");
    }
  };

  const removeSkill = (name: string) => {
    const copy = { ...profile.technical_skills };
    delete copy[name];
    setProfile({ technical_skills: copy });
  };

  const SOFT_SKILLS = [
    "Communication",
    "Problem Solving",
    "Teamwork",
    "Leadership",
    "Creativity",
    "Time Management",
    "Adaptability",
    "Critical Thinking",
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white">Skills &amp; Competencies</h2>

      {/* Technical skills */}
      <div>
        <Label>Technical Skills</Label>
        <div className="flex gap-2">
          <Input
            value={skillName}
            onChange={(e) => setSkillName(e.target.value)}
            placeholder="e.g. Python"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
          />
          <select
            value={skillLevel}
            onChange={(e) => setSkillLevel(e.target.value)}
            className="w-36 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none [&>option]:bg-neutral-900"
          >
            {["Beginner", "Basic", "Intermediate", "Advanced", "Expert"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={addSkill}
            className="rounded-lg bg-cyan-500/20 px-3 text-cyan-400 transition hover:bg-cyan-500/30"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(profile.technical_skills).map(([name, level]) => (
            <span
              key={name}
              className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300"
            >
              {name} ({level})
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill(name)} />
            </span>
          ))}
        </div>
      </div>

      {/* Soft skills */}
      <div>
        <Label>Soft Skills (rate 1-5)</Label>
        <div className="grid grid-cols-2 gap-3">
          {SOFT_SKILLS.map((skill) => (
            <div key={skill} className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-2">
              <span className="text-sm text-white/70">{skill}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() =>
                      setProfile({ soft_skills: { ...profile.soft_skills, [skill]: n } })
                    }
                    className={`h-7 w-7 rounded-md text-xs font-bold transition ${
                      (profile.soft_skills[skill] ?? 0) >= n
                        ? "bg-cyan-500 text-white"
                        : "bg-white/10 text-white/30 hover:bg-white/20"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Step 4: Preferences ──────────────────────────────────────────────── */

function PreferencesStep({ profile, setProfile }: StepProps) {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white">Preferences</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Work Style</Label>
          <Select
            value={profile.work_style}
            onChange={(v) => setProfile({ work_style: v })}
            options={WORK_STYLES}
          />
        </div>
        <div>
          <Label>Risk Tolerance</Label>
          <Select
            value={profile.risk_tolerance}
            onChange={(v) => setProfile({ risk_tolerance: v })}
            options={RISK_LEVELS}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Investment Capacity</Label>
          <Select
            value={profile.investment_capacity}
            onChange={(v) => setProfile({ investment_capacity: v })}
            options={INVESTMENT_CAPS}
          />
        </div>
        <div>
          <Label>Hours / Week Available</Label>
          <Input
            type="number"
            value={profile.hours_per_week || ""}
            onChange={(e) => setProfile({ hours_per_week: parseInt(e.target.value) || 0 })}
            placeholder="20"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Market Awareness</Label>
          <Select
            value={profile.market_awareness}
            onChange={(v) => setProfile({ market_awareness: v })}
            options={AWARENESS_LEVELS}
          />
        </div>
        <div>
          <Label>Optimism Level</Label>
          <Select
            value={profile.optimism_level}
            onChange={(v) => setProfile({ optimism_level: v })}
            options={OPTIMISM_LEVELS}
          />
        </div>
      </div>

      <div>
        <Label>Career Concerns</Label>
        <ChipSelect
          selected={profile.career_concerns}
          options={CONCERNS}
          onChange={(v) => setProfile({ career_concerns: v })}
        />
      </div>
    </div>
  );
}

/* ── Step 5: Review & Launch ──────────────────────────────────────────── */

function ReviewStep({
  profile,
  onSubmit,
}: {
  profile: CareerProfile;
  onSubmit: () => void;
}) {
  const field = (label: string, value: string | number | string[]) => {
    const display = Array.isArray(value)
      ? value.length
        ? value.join(", ")
        : "—"
      : value || "—";
    return (
      <div className="flex justify-between rounded-lg bg-white/5 px-4 py-2">
        <span className="text-sm text-white/50">{label}</span>
        <span className="text-sm font-medium text-white">{String(display)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white">Review &amp; Launch</h2>
      <p className="text-sm text-white/50">
        Please review your profile before we run the AI analysis.
      </p>

      <div className="space-y-2">
        {field("Education", profile.current_education_level)}
        {field("Institution", profile.institution_name)}
        {field("Major", profile.current_major)}
        {field("GPA", `${profile.current_gpa} / ${profile.grading_scale}`)}
        {field("Graduation Year", profile.expected_graduation_year)}
        {field("Country", profile.current_country)}
        {field("Resume", profile.resume_filename || "Not uploaded")}
        {field("Target Fields", profile.target_career_fields)}
        {field("Specific Roles", profile.specific_roles)}
        {field("Primary Goal", profile.primary_career_goal)}
        {field("Role Level", profile.desired_role_level)}
        {field("Work Env", profile.preferred_work_env)}
        {field(
          "Technical Skills",
          Object.entries(profile.technical_skills)
            .map(([k, v]) => `${k} (${v})`)
            .join(", ") || "—"
        )}
        {field("Work Style", profile.work_style)}
        {field("Risk Tolerance", profile.risk_tolerance)}
        {field("Investment Capacity", profile.investment_capacity)}
        {field("Hours / Week", profile.hours_per_week)}
        {field("Concerns", profile.career_concerns)}
      </div>

      <div className="pt-2 text-center">
        <button
          onClick={onSubmit}
          className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-violet-500 px-8 py-3 font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-cyan-500/40"
        >
          <Rocket className="h-5 w-5" /> Launch AI Career Analysis
        </button>
      </div>
    </div>
  );
}
