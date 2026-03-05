import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import {
  getAllCourses,
  getCourseById,
  createCourse,
  generateSection,
  deleteCourse,
  getSectionWithContent,
  markSectionComplete,
  markArticleRead,
  submitMcqAnswer,
  submitTrueFalseAnswer,
  submitFillUpAnswer,
  reviewFlashcard,
} from "../controllers/course.controller";

const router = Router();

// ── Course CRUD ─────────────────────────────────────────────────────────────

router.get("/", requireAuth, getAllCourses);
router.get("/:id", requireAuth, getCourseById);
router.post("/", requireAuth, createCourse);
router.post("/:id/generate-section", requireAuth, generateSection);
router.delete("/:id", requireAuth, deleteCourse);

// ── Sections ────────────────────────────────────────────────────────────────

router.get("/sections/:sectionId", requireAuth, getSectionWithContent);
router.post("/sections/:sectionId/complete", requireAuth, markSectionComplete);

// ── Articles ────────────────────────────────────────────────────────────────

router.post("/articles/:articleId/read", requireAuth, markArticleRead);

// ── Quizzes ─────────────────────────────────────────────────────────────────

router.post("/mcq/:questionId/answer", requireAuth, submitMcqAnswer);
router.post("/truefalse/:questionId/answer", requireAuth, submitTrueFalseAnswer);
router.post("/fillup/:questionId/answer", requireAuth, submitFillUpAnswer);

// ── Flashcards ──────────────────────────────────────────────────────────────

router.post("/flashcards/:flashcardId/review", requireAuth, reviewFlashcard);

export default router;
