import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Plus, Search, BookOpen, BarChart3, Clock, Sparkles, Loader2, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCourses, deleteCourse } from "@/store/courses/coursesSlice";
import type { Course } from "./types";
import CreateCourseDialog from "./CreateCourseDialog";

function CourseCard({ course, onDelete }: { course: Course; onDelete: (id: string) => void }) {
  const levelColor =
    course.level === "advanced"
      ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
      : course.level === "intermediate"
        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
        : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";

  const progress = course.progress ?? 0;

  const displayLevel =
    course.level.charAt(0).toUpperCase() + course.level.slice(1);

  return (
    <Link to={`/courses/${course.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className="group relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:border-cyan-500/30 hover:bg-white/8"
      >
        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100 bg-[radial-gradient(200px_at_50%_0%,rgba(6,182,212,0.12),transparent)]" />

        <span
          className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${levelColor}`}
        >
          {displayLevel}
        </span>

        <h3 className="mt-4 text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
          {course.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
          {course.description}
        </p>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {course.sectionCount} sections
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {new Date(course.createdAt).toLocaleDateString()}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (window.confirm("Delete this course? This cannot be undone.")) {
                onDelete(course.id);
              }
            }}
            className="relative z-10 rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
            title="Delete course"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-zinc-400">Progress</span>
            <span className="font-medium text-cyan-400">{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-linear-to-r from-cyan-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default function CoursesPage() {
  const dispatch = useAppDispatch();
  const { list: courses, listLoading } = useAppSelector((s) => s.courses);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  const handleDelete = (courseId: string) => {
    dispatch(deleteCourse(courseId));
  };

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="min-h-screen bg-black px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              My Courses
            </h1>
            <p className="mt-2 text-zinc-400">
              AI-generated courses tailored to your learning goals
            </p>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="group flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2.5 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-cyan-500/40"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            New Course
          </button>
        </motion.div>

        {/* Search & stats bar */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search courses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            />
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-cyan-500" />
              {courses.length} courses
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-cyan-500" />
              AI-powered
            </span>
          </div>
        </div>

        {/* Loading */}
        {listLoading && courses.length === 0 && (
          <div className="mt-20 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
          </div>
        )}

        {/* Course grid */}
        {!listLoading && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <CourseCard course={course} onDelete={handleDelete} />
              </motion.div>
            ))}
          </div>
        )}

        {!listLoading && filtered.length === 0 && courses.length > 0 && (
          <div className="mt-20 text-center">
            <p className="text-zinc-500">No courses match your search.</p>
          </div>
        )}

        {!listLoading && courses.length === 0 && (
          <div className="mt-20 text-center">
            <p className="text-zinc-500">
              No courses yet. Create your first AI-generated course!
            </p>
          </div>
        )}
      </div>

      <CreateCourseDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </section>
  );
}
