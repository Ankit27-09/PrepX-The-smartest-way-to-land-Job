import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  Eye,
  ChevronDown,
  ChevronRight,
  FileText,
  Brain,
  Layers,
  Gamepad2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import type { Course, CourseDetail, ViewMode, ContentType } from "./types";

interface CourseSidebarProps {
  course: Course | CourseDetail;
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  activeSectionId: string | null;
  activeContentType: ContentType | null;
  onContentSelect: (sectionId: string, type: ContentType) => void;
}

export default function CourseSidebar({
  course,
  activeView,
  onViewChange,
  activeSectionId,
  activeContentType,
  onContentSelect,
}: CourseSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(activeSectionId ? [activeSectionId] : [])
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const isActive = (sectionId: string, type: ContentType) =>
    activeSectionId === sectionId && activeContentType === type;

  const sections = course.sections ?? [];

  return (
    <aside className="flex h-full w-72 flex-col border-r border-white/10 bg-zinc-950">
      {/* Course title */}
      <div className="border-b border-white/10 p-4">
        <h2 className="text-sm font-semibold text-white leading-tight line-clamp-2">
          {course.title}
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          {sections.length} sections •{" "}
          {course.sectionCount > 0
            ? Math.round(
                (sections.filter((s) => s.isCompleted).length /
                  course.sectionCount) *
                  100
              )
            : 0}
          % complete
        </p>
      </div>

      {/* View toggle */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => onViewChange("home")}
          className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-medium transition-colors ${
            activeView === "home"
              ? "border-b-2 border-cyan-500 text-cyan-400"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Home className="h-4 w-4" />
          Home
        </button>
        <button
          onClick={() => onViewChange("eagle")}
          className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-medium transition-colors ${
            activeView === "eagle"
              ? "border-b-2 border-cyan-500 text-cyan-400"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Eye className="h-4 w-4" />
          Eagle View
        </button>
      </div>

      {/* Curriculum */}
      <nav className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
          Curriculum
        </p>

        <div className="space-y-1">
          {sections.map((section, idx) => {
            const isExpanded = expandedSections.has(section.id);

            return (
              <div key={section.id}>
                {/* Section header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/5"
                >
                  {section.isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-zinc-600" />
                  )}
                  <span className="flex-1 text-xs font-medium text-zinc-300 group-hover:text-white truncate">
                    {idx + 1}. {section.title}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-zinc-600" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
                  )}
                </button>

                {/* Children */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-6 space-y-0.5 border-l border-white/5 py-1 pl-3">
                        <SidebarLink
                          icon={<FileText className="h-3.5 w-3.5" />}
                          label="Article"
                          active={isActive(section.id, "article")}
                          onClick={() =>
                            onContentSelect(section.id, "article")
                          }
                        />

                        <p className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                          Study Material
                        </p>
                        <SidebarLink
                          icon={<Brain className="h-3.5 w-3.5" />}
                          label="Mind Map"
                          active={isActive(section.id, "mindmap")}
                          onClick={() =>
                            onContentSelect(section.id, "mindmap")
                          }
                        />
                        <SidebarLink
                          icon={<Layers className="h-3.5 w-3.5" />}
                          label="Flashcards"
                          active={isActive(section.id, "flashcards")}
                          onClick={() =>
                            onContentSelect(section.id, "flashcards")
                          }
                        />

                        <p className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                          Quiz
                        </p>
                        <SidebarLink
                          icon={<Gamepad2 className="h-3.5 w-3.5" />}
                          label="MCQ"
                          active={isActive(section.id, "mcq")}
                          onClick={() => onContentSelect(section.id, "mcq")}
                        />
                        <SidebarLink
                          icon={<Gamepad2 className="h-3.5 w-3.5" />}
                          label="True / False"
                          active={isActive(section.id, "truefalse")}
                          onClick={() =>
                            onContentSelect(section.id, "truefalse")
                          }
                        />
                        <SidebarLink
                          icon={<Gamepad2 className="h-3.5 w-3.5" />}
                          label="Fill in the Blanks"
                          active={isActive(section.id, "fillups")}
                          onClick={() =>
                            onContentSelect(section.id, "fillups")
                          }
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}

// ── Small helper ────────────────────────────────────────────────────────────

function SidebarLink({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
        active
          ? "bg-cyan-500/10 text-cyan-400"
          : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
