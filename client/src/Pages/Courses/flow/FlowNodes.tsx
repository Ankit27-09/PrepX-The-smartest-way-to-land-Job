import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import {
  GraduationCap,
  BookOpen,
  FileText,
  Layers,
  Gamepad2,
  Brain,
} from "lucide-react";

/* ── Shared styles ──────────────────────────────────────────────────────── */

const baseNode =
  "rounded-xl border px-4 py-3 shadow-lg backdrop-blur transition-transform duration-150 select-none";

const handleStyle = {
  width: 8,
  height: 8,
  border: "2px solid rgba(255,255,255,.25)",
  background: "#18181b",
};

/* ── Course Root Node (EagleView centre) ────────────────────────────────── */

interface CourseNodeData {
  label: string;
  subtitle?: string;
  [key: string]: unknown;
}

export const CourseNode = memo(({ data }: { data: CourseNodeData }) => (
  <div
    className={`${baseNode} min-w-50 border-violet-400/30 bg-linear-to-br from-violet-600/90 to-purple-700/90`}
  >
    <Handle type="source" position={Position.Bottom} style={handleStyle} />
    <div className="flex items-center gap-3">
      <GraduationCap className="h-6 w-6 shrink-0 text-white/90" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-white/60">
          Course
        </p>
        <p className="truncate text-sm font-bold text-white">{data.label}</p>
      </div>
    </div>
  </div>
));
CourseNode.displayName = "CourseNode";

/* ── Section Node ───────────────────────────────────────────────────────── */

interface SectionNodeData {
  label: string;
  order?: number;
  completed?: boolean;
  [key: string]: unknown;
}

export const SectionNode = memo(({ data }: { data: SectionNodeData }) => (
  <div
    className={`${baseNode} min-w-45 border-blue-400/30 bg-linear-to-br from-blue-500/90 to-blue-700/90`}
  >
    <Handle type="target" position={Position.Top} style={handleStyle} />
    <Handle type="source" position={Position.Bottom} style={handleStyle} />
    <div className="flex items-center gap-2.5">
      <BookOpen className="h-5 w-5 shrink-0 text-white/80" />
      <div className="min-w-0">
        {data.order != null && (
          <p className="text-[9px] uppercase tracking-wider text-white/50">
            Section {data.order}
          </p>
        )}
        <p className="truncate text-xs font-semibold text-white">
          {data.label}
        </p>
      </div>
      {data.completed && (
        <span className="ml-auto text-[10px] text-emerald-300">✓</span>
      )}
    </div>
  </div>
));
SectionNode.displayName = "SectionNode";

/* ── Content Leaf Node (Article / Flashcard / Quiz) ─────────────────────── */

const CONTENT_STYLES: Record<
  string,
  { icon: typeof FileText; gradient: string; border: string }
> = {
  article: {
    icon: FileText,
    gradient: "from-emerald-500/90 to-emerald-700/90",
    border: "border-emerald-400/30",
  },
  flashcards: {
    icon: Layers,
    gradient: "from-amber-500/90 to-amber-700/90",
    border: "border-amber-400/30",
  },
  mcq: {
    icon: Gamepad2,
    gradient: "from-rose-500/90 to-rose-700/90",
    border: "border-rose-400/30",
  },
};

interface ContentNodeData {
  label: string;
  contentType: string;
  sectionId?: string;
  onClick?: () => void;
  [key: string]: unknown;
}

export const ContentNode = memo(({ data }: { data: ContentNodeData }) => {
  const style = CONTENT_STYLES[data.contentType] ?? CONTENT_STYLES.article;
  const Icon = style.icon;

  return (
    <button
      onClick={data.onClick}
      className={`${baseNode} flex min-w-35 cursor-pointer items-center gap-2 bg-linear-to-br ${style.gradient} ${style.border} hover:scale-[1.04] active:scale-[0.97]`}
    >
      <Handle type="target" position={Position.Top} style={handleStyle} />
      <Icon className="h-4 w-4 shrink-0 text-white/80" />
      <span className="text-xs font-medium text-white">{data.label}</span>
    </button>
  );
});
ContentNode.displayName = "ContentNode";

/* ── Mind-map Root Node ─────────────────────────────────────────────────── */

interface MindMapRootData {
  label: string;
  [key: string]: unknown;
}

export const MindMapRootNode = memo(({ data }: { data: MindMapRootData }) => (
  <div
    className={`${baseNode} min-w-45 border-rose-400/30 bg-linear-to-br from-rose-500/90 to-rose-700/90 text-center`}
  >
    <Handle type="source" position={Position.Bottom} style={handleStyle} />
    <p className="text-sm font-bold text-white">{data.label}</p>
  </div>
));
MindMapRootNode.displayName = "MindMapRootNode";

/* ── Mind-map Branch Node ───────────────────────────────────────────────── */

const BRANCH_ICON: Record<string, typeof FileText> = {
  Articles: FileText,
  Flashcards: Layers,
  Quizzes: Gamepad2,
};

const BRANCH_STYLE: Record<string, { gradient: string; border: string }> = {
  Articles: {
    gradient: "from-teal-500/90 to-teal-700/90",
    border: "border-teal-400/30",
  },
  Flashcards: {
    gradient: "from-cyan-500/90 to-cyan-700/90",
    border: "border-cyan-400/30",
  },
  Quizzes: {
    gradient: "from-blue-500/90 to-blue-700/90",
    border: "border-blue-400/30",
  },
};

interface BranchNodeData {
  label: string;
  [key: string]: unknown;
}

export const BranchNode = memo(({ data }: { data: BranchNodeData }) => {
  const Icon = BRANCH_ICON[data.label] ?? Brain;
  const style = BRANCH_STYLE[data.label] ?? BRANCH_STYLE.Articles;

  return (
    <div
      className={`${baseNode} min-w-35 bg-linear-to-br ${style.gradient} ${style.border} text-center`}
    >
      <Handle type="target" position={Position.Top} style={handleStyle} />
      <Handle type="source" position={Position.Bottom} style={handleStyle} />
      <div className="flex items-center justify-center gap-2">
        <Icon className="h-4 w-4 text-white/80" />
        <span className="text-xs font-semibold text-white">{data.label}</span>
      </div>
    </div>
  );
});
BranchNode.displayName = "BranchNode";

/* ── Mind-map Leaf Node ─────────────────────────────────────────────────── */

interface LeafNodeData {
  label: string;
  [key: string]: unknown;
}

export const LeafNode = memo(({ data }: { data: LeafNodeData }) => (
  <div
    className={`${baseNode} max-w-50 border-white/10 bg-zinc-800/80`}
  >
    <Handle type="target" position={Position.Top} style={handleStyle} />
    <p className="text-[11px] leading-snug text-zinc-300">{data.label}</p>
  </div>
));
LeafNode.displayName = "LeafNode";


