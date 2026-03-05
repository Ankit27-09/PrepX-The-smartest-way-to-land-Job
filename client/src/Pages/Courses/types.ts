// ── Course Types — aligned with API responses ───────────────────────────────

export type ViewMode = "home" | "eagle";
export type ContentType =
  | "article"
  | "mindmap"
  | "flashcards"
  | "mcq"
  | "truefalse"
  | "fillups";

// ── Section summary (returned in course list / detail) ──────────────────────

export interface SectionSummary {
  id: string;
  sectionNumber: number;
  title: string;
  isCompleted: boolean;
}

// ── Full section content (fetched separately) ───────────────────────────────

export interface ArticlePage {
  id: string;
  sectionId: string;
  pageNumber: number;
  pageTitle: string;
  content: string;
  isRead: boolean;
  readAt: string | null;
}

export interface Flashcard {
  id: string;
  sectionId: string;
  front: string;
  back: string;
  difficulty: number;
  reviewCount: number;
  correctCount: number;
  nextReviewAt: string | null;
}

export interface MindMap {
  id: string;
  sectionId: string;
  data: unknown;
}

export interface McqQuestion {
  id: string;
  sectionId: string;
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
  isAttempted: boolean;
  userAnswer: string | null;
  isCorrect: boolean | null;
}

export interface TrueFalseQuestion {
  id: string;
  sectionId: string;
  question: string;
  answer: boolean;
  explanation: string;
  isAttempted: boolean;
  userAnswer: boolean | null;
  isCorrect: boolean | null;
}

export interface FillUpQuestion {
  id: string;
  sectionId: string;
  question: string;
  missingWord: string;
  hint?: string | null;
  isAttempted: boolean;
  userAnswer: string | null;
  isCorrect: boolean | null;
}

export interface SectionContent {
  id: string;
  courseId: string;
  sectionNumber: number;
  title: string;
  isCompleted: boolean;
  course: { userId: string; title: string; topic: string };
  articlePages: ArticlePage[];
  flashcards: Flashcard[];
  mindMaps: MindMap[];
  mcqQuestions: McqQuestion[];
  trueFalseQuestions: TrueFalseQuestion[];
  fillUpQuestions: FillUpQuestion[];
}

// ── Course stats (from getCourseById) ───────────────────────────────────────

export interface CourseStats {
  articles: { read: number; total: number };
  flashcards: { reviewed: number; total: number };
  quizzes: { attempted: number; total: number };
}

// ── Course (list item) ──────────────────────────────────────────────────────

export interface Course {
  id: string;
  userId: string;
  title: string;
  topic: string;
  description: string;
  level: string;
  goal: string;
  tone: string;
  sectionCount: number;
  status: string;
  completedSections: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
  sections: SectionSummary[];
}

// ── Course with stats (detail view) ─────────────────────────────────────────

export interface CourseDetail extends Course {
  stats: CourseStats;
}
