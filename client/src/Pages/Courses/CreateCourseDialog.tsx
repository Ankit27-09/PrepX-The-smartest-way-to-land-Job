import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Sparkles,
  GraduationCap,
  Target,
  BarChart3,
  Clock,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createCourse, fetchCourses } from "@/store/courses/coursesSlice";

interface CreateCourseDialogProps {
  open: boolean;
  onClose: () => void;
}

const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const TONES = ["Professional", "Casual", "Technical"];
const TIME_OPTIONS = ["15 min/day", "30 min/day", "1 hr/day", "Flexible"];

const TONE_MAP: Record<string, string> = {
  Professional: "professional",
  Casual: "casual",
  Technical: "technical",
};

export default function CreateCourseDialog({
  open,
  onClose,
}: CreateCourseDialogProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const creating = useAppSelector((s) => s.courses.creating);

  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Intermediate");
  const [goal, setGoal] = useState("");
  const [tone, setTone] = useState("Casual");
  const [sections, setSections] = useState(5);
  const [time, setTime] = useState("30 min/day");
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setError(null);
    try {
      const result = await dispatch(
        createCourse({
          topic: topic.trim(),
          level: level.toLowerCase(),
          goal: goal.trim() || `Learn ${topic.trim()}`,
          tone: TONE_MAP[tone] ?? "casual",
          sectionCount: sections,
          timeCommitment: time,
        })
      ).unwrap();

      // Refresh list and navigate to the new course
      dispatch(fetchCourses());
      onClose();
      navigate(`/courses/${result.courseId}`);
    } catch (err) {
      setError(typeof err === "string" ? err : "Failed to create course");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-cyan-500/5">
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1 text-zinc-500 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Title */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-blue-600">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Create New Course
                  </h2>
                  <p className="text-xs text-zinc-500">
                    AI will generate a personalised learning path
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="mt-6 space-y-5">
                {/* Topic */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-300">
                    <GraduationCap className="h-4 w-4 text-cyan-500" />
                    Topic
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Data Structures & Algorithms"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                  />
                </div>

                {/* Level */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-300">
                    <BarChart3 className="h-4 w-4 text-cyan-500" />
                    Level
                  </label>
                  <div className="flex gap-2">
                    {LEVELS.map((l) => (
                      <button
                        key={l}
                        onClick={() => setLevel(l)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                          level === l
                            ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                            : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-300"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Goal */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-300">
                    <Target className="h-4 w-4 text-cyan-500" />
                    Learning Goal
                  </label>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g. Crack FAANG interviews"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                  />
                </div>

                {/* Tone + Sections row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-300">
                      <MessageSquare className="h-4 w-4 text-cyan-500" />
                      Tone
                    </label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                    >
                      {TONES.map((t) => (
                        <option key={t} value={t} className="bg-zinc-900">
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-300">
                      <BarChart3 className="h-4 w-4 text-cyan-500" />
                      Sections
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={sections}
                      onChange={(e) => setSections(Number(e.target.value))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                    />
                  </div>
                </div>

                {/* Time commitment */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-300">
                    <Clock className="h-4 w-4 text-cyan-500" />
                    Time Commitment
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TIME_OPTIONS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTime(t)}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                          time === t
                            ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                            : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-300"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="mt-6 space-y-3">
                {error && (
                  <p className="text-xs text-rose-400 text-center">{error}</p>
                )}
                <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="rounded-xl px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!topic.trim() || creating}
                  className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2.5 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-cyan-500/40 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {creating ? "Generating…" : "Generate Course"}
                </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
