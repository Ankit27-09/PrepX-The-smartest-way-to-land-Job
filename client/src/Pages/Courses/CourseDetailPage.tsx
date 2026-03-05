import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Menu, X, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchCourseDetail,
  fetchSectionContent,
  clearCurrentCourse,
} from "@/store/courses/coursesSlice";
import type { ViewMode, ContentType, SectionContent } from "./types";
import CourseSidebar from "./CourseSidebar";
import CourseHomeView from "./CourseHomeView";
import EagleView from "./EagleView";
import ArticleView from "./ArticleView";
import FlashcardViewer from "./FlashcardViewer";
import QuizView from "./QuizView";
import MindMapView from "./MindMapView";

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const dispatch = useAppDispatch();

  const {
    currentCourse: course,
    courseLoading,
    sections: sectionCache,
    sectionLoading,
  } = useAppSelector((s) => s.courses);

  const [activeView, setActiveView] = useState<ViewMode>("home");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [activeContentType, setActiveContentType] =
    useState<ContentType | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch course detail
  useEffect(() => {
    if (courseId) dispatch(fetchCourseDetail(courseId));
    return () => {
      dispatch(clearCurrentCourse());
    };
  }, [courseId, dispatch]);

  // Fetch section content when a section is selected
  useEffect(() => {
    if (activeSectionId && !sectionCache[activeSectionId]) {
      dispatch(fetchSectionContent(activeSectionId));
    }
  }, [activeSectionId, sectionCache, dispatch]);

  const activeSection: SectionContent | undefined = useMemo(
    () => (activeSectionId ? sectionCache[activeSectionId] : undefined),
    [activeSectionId, sectionCache]
  );

  const handleContentSelect = useCallback(
    (sectionId: string, type: ContentType) => {
      setActiveSectionId(sectionId);
      setActiveContentType(type);
      setActiveView("home");
      setSidebarOpen(false);
    },
    []
  );

  const handleSectionClickFromHome = useCallback(
    (sectionId: string, type?: ContentType) => {
      setActiveSectionId(sectionId);
      setActiveContentType(type ?? "article");
      setActiveView("home");
      setSidebarOpen(false);
    },
    []
  );

  const handleEagleNodeClick = useCallback(
    (sectionId: string, type: ContentType) => {
      handleContentSelect(sectionId, type);
    },
    [handleContentSelect]
  );

  const handleViewChange = useCallback((view: ViewMode) => {
    setActiveView(view);
    if (view === "eagle") {
      setActiveSectionId(null);
      setActiveContentType(null);
    }
    // Re-fetch course detail when returning to home to get updated stats
    if (view === "home" && courseId) {
      dispatch(fetchCourseDetail(courseId));
    }
  }, [courseId, dispatch]);

  // Loading state
  if (courseLoading || !course) {
    if (courseLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-black">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      );
    }
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
        <p className="text-lg text-zinc-400">Course not found.</p>
        <Link
          to="/courses"
          className="mt-4 text-sm text-cyan-400 hover:underline"
        >
          ← Back to courses
        </Link>
      </div>
    );
  }

  // ── Determine what to render ──────────────────────────────────────────────

  function renderContent() {
    if (activeView === "eagle") {
      return <EagleView course={course!} onNodeClick={handleEagleNodeClick} />;
    }

    if (!activeSectionId || !activeContentType) {
      return (
        <CourseHomeView
          course={course!}
          onSectionClick={handleSectionClickFromHome}
        />
      );
    }

    // Section content is loading
    if (sectionLoading && !activeSection) {
      return (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
        </div>
      );
    }

    if (!activeSection) {
      return (
        <div className="flex h-64 items-center justify-center text-zinc-500">
          Section content not available yet. Generate this section first.
        </div>
      );
    }

    switch (activeContentType) {
      case "article":
        return (
          <ArticleView
            pages={activeSection.articlePages}
            sectionTitle={activeSection.title}
          />
        );
      case "mindmap":
        return <MindMapView sectionContent={activeSection} />;
      case "flashcards":
        return (
          <FlashcardViewer
            flashcards={activeSection.flashcards}
            sectionTitle={activeSection.title}
          />
        );
      case "mcq":
        return (
          <QuizView
            mcqs={activeSection.mcqQuestions}
            trueFalse={activeSection.trueFalseQuestions}
            fillUps={activeSection.fillUpQuestions}
            sectionTitle={activeSection.title}
            initialTab="mcq"
          />
        );
      case "truefalse":
        return (
          <QuizView
            mcqs={activeSection.mcqQuestions}
            trueFalse={activeSection.trueFalseQuestions}
            fillUps={activeSection.fillUpQuestions}
            sectionTitle={activeSection.title}
            initialTab="truefalse"
          />
        );
      case "fillups":
        return (
          <QuizView
            mcqs={activeSection.mcqQuestions}
            trueFalse={activeSection.trueFalseQuestions}
            fillUps={activeSection.fillUpQuestions}
            sectionTitle={activeSection.title}
            initialTab="fillup"
          />
        );
      default:
        return (
          <CourseHomeView
            course={course!}
            onSectionClick={handleSectionClickFromHome}
          />
        );
    }
  }

  const activeSectionTitle = activeSectionId
    ? (course.sections ?? []).find((s) => s.id === activeSectionId)?.title
    : undefined;

  return (
    <div className="flex min-h-screen bg-black">
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <div className="hidden lg:block">
        <CourseSidebar
          course={course}
          activeView={activeView}
          onViewChange={handleViewChange}
          activeSectionId={activeSectionId}
          activeContentType={activeContentType}
          onContentSelect={handleContentSelect}
        />
      </div>

      {/* ── Mobile sidebar overlay ──────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            />
            <motion.div
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <CourseSidebar
                course={course}
                activeView={activeView}
                onViewChange={handleViewChange}
                activeSectionId={activeSectionId}
                activeContentType={activeContentType}
                onContentSelect={handleContentSelect}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-black/80 px-4 py-3 backdrop-blur lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white lg:hidden"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          <Link
            to="/courses"
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-cyan-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Courses
          </Link>

          <span className="text-xs text-zinc-700">/</span>
          <span className="truncate text-xs font-medium text-zinc-300">
            {course.title}
          </span>

          {activeSectionTitle && (
            <>
              <span className="text-xs text-zinc-700">/</span>
              <span className="truncate text-xs text-zinc-400">
                {activeSectionTitle}
              </span>
            </>
          )}
        </div>

        {/* Content area */}
        <motion.div
          key={`${activeView}-${activeSectionId}-${activeContentType}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </div>
    </div>
  );
}
