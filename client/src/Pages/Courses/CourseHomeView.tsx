import { motion } from "motion/react";
import {
  BookOpen,
  Layers,
  Gamepad2,
  TrendingUp,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  generateSection,
  fetchCourseDetail,
} from "@/store/courses/coursesSlice";
import type { CourseDetail, ContentType } from "./types";

interface CourseHomeViewProps {
  course: CourseDetail;
  onSectionClick: (sectionId: string, type?: ContentType) => void;
}

export default function CourseHomeView({
  course,
  onSectionClick,
}: CourseHomeViewProps) {
  const { stats } = course;
  const dispatch = useAppDispatch();
  const generating = useAppSelector((s) => s.courses.generating);

  const sections = course.sections ?? [];
  const generatedCount = sections.length;
  const nextSectionNumber = generatedCount + 1;
  const canGenerateMore = nextSectionNumber <= course.sectionCount;
  const completedCount = sections.filter((s) => s.isCompleted).length;
  const overallProgress = course.progress ?? 0;

  const statCards = [
    {
      label: "Articles Read",
      value: `${stats.articles.read}/${stats.articles.total}`,
      icon: BookOpen,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      label: "Flashcards",
      value: `${stats.flashcards.reviewed}/${stats.flashcards.total}`,
      icon: Layers,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Quizzes",
      value: `${stats.quizzes.attempted}/${stats.quizzes.total}`,
      icon: Gamepad2,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
    },
    {
      label: "Sections",
      value: `${completedCount}/${course.sectionCount}`,
      icon: TrendingUp,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
  ];

  const getSectionStatus = (section: CourseDetail["sections"][number]) => {
    if (section.isCompleted) return "completed";
    // Without nested content data, we can't check partial progress —
    // but the section list from the API won't have articlePages here.
    return "not-started";
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div className={`inline-flex rounded-lg p-2 ${card.bg}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <p className="mt-3 text-2xl font-bold text-white">{card.value}</p>
            <p className="text-xs text-zinc-500">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Overall progress ring */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-6 rounded-xl border border-white/10 bg-white/5 p-6"
      >
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle
              cx={60}
              cy={60}
              r={52}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={10}
            />
            <motion.circle
              cx={60}
              cy={60}
              r={52}
              fill="none"
              stroke="url(#progress-gradient)"
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 52}
              initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
              animate={{
                strokeDashoffset:
                  2 * Math.PI * 52 * (1 - overallProgress / 100),
              }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            <defs>
              <linearGradient
                id="progress-gradient"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {overallProgress}%
            </span>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
            Overall Progress
          </h3>
          <p className="mt-1 text-sm text-zinc-400">
            Keep it up! Complete more sections to level up.
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-linear-to-r from-cyan-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>

      {/* Generate next section */}
      {canGenerateMore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex items-center justify-between rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5"
        >
          <div>
            <h3 className="text-sm font-semibold text-white">
              Section {nextSectionNumber} of {course.sectionCount}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-400">
              {generatedCount === 0
                ? "Generate the first section to get started."
                : "Ready to continue? Generate the next section."}
            </p>
          </div>
          <button
            disabled={generating}
            onClick={async () => {
              await dispatch(
                generateSection({
                  courseId: course.id,
                  sectionNumber: nextSectionNumber,
                })
              );
              dispatch(fetchCourseDetail(course.id));
            }}
            className="flex items-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-500 px-5 py-2.5 text-sm font-medium text-white transition-shadow hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Section {nextSectionNumber}
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Section list */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <BookOpen className="h-5 w-5 text-cyan-400" />
          Section Progress
        </h3>

        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {sections.map((section, index) => {
            const status = getSectionStatus(section);
            return (
              <button
                key={section.id}
                onClick={() => onSectionClick(section.id)}
                className="group flex w-full items-center gap-3 rounded-lg border border-transparent p-3 text-left transition-colors hover:border-white/10 hover:bg-white/5"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-300 group-hover:text-white">
                    {section.title}
                  </p>
                  <p className="text-xs text-zinc-600">
                    Section {section.sectionNumber}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    status === "completed"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-white/5 text-zinc-600"
                  }`}
                >
                  {status === "completed" ? "Completed" : "Not Started"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
