import type { Request, Response, NextFunction } from "express";
import prisma from "../config/db";
import {
  createCourseSchema,
  generateSectionSchema,
  submitAnswerSchema,
  reviewFlashcardSchema,
} from "../validators/course.validator";
import {
  createCourseAndGenerateFirstSection,
  generateNextSection,
} from "../services/course.generator";
import { AppError } from "../services/auth.service";

// ── Helpers ─────────────────────────────────────────────────────────────────

/** MongoDB ObjectID is a 24-char hex string. */
const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function getUserId(req: Request): string {
  const user = (req as Request & { user: { id: string } }).user;
  if (!user?.id) throw new AppError(401, "Authentication required");
  return user.id;
}

/** Express 5 params are `string | string[]`; safely extract a single string. */
function param(req: Request, name: string): string {
  const v = req.params[name];
  if (Array.isArray(v)) return v[0];
  return v as string;
}

/** Extract a route param and validate it's a valid MongoDB ObjectID. */
function objectIdParam(req: Request, name: string): string {
  const v = param(req, name);
  if (!v || !OBJECT_ID_RE.test(v)) {
    throw new AppError(400, `Invalid ${name}: "${v}" is not a valid ObjectID`);
  }
  return v;
}

// ── COURSE CRUD ─────────────────────────────────────────────────────────────

/** GET /api/courses — list all courses for the current user */
export async function getAllCourses(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getUserId(req);

    const courses = await prisma.aiCourse.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        sections: {
          select: {
            id: true,
            sectionNumber: true,
            title: true,
            isCompleted: true,
          },
          orderBy: { sectionNumber: "asc" },
        },
      },
    });

    // Compute content-based progress for each course
    const progressMap = new Map<string, number>();
    await Promise.all(
      courses.map(async (course) => {
        const cid = course.id;
        const [
          readArticles, totalArticles,
          reviewedFlashcards, totalFlashcards,
          attemptedMcq, totalMcq,
          attemptedTf, totalTf,
          attemptedFill, totalFill,
        ] = await Promise.all([
          prisma.aiArticlePage.count({ where: { section: { courseId: cid }, isRead: true } }),
          prisma.aiArticlePage.count({ where: { section: { courseId: cid } } }),
          prisma.aiFlashcard.count({ where: { section: { courseId: cid }, reviewCount: { gt: 0 } } }),
          prisma.aiFlashcard.count({ where: { section: { courseId: cid } } }),
          prisma.aiMcqQuestion.count({ where: { section: { courseId: cid }, isAttempted: true } }),
          prisma.aiMcqQuestion.count({ where: { section: { courseId: cid } } }),
          prisma.aiTrueFalseQuestion.count({ where: { section: { courseId: cid }, isAttempted: true } }),
          prisma.aiTrueFalseQuestion.count({ where: { section: { courseId: cid } } }),
          prisma.aiFillUpQuestion.count({ where: { section: { courseId: cid }, isAttempted: true } }),
          prisma.aiFillUpQuestion.count({ where: { section: { courseId: cid } } }),
        ]);

        const completedItems = readArticles + reviewedFlashcards + attemptedMcq + attemptedTf + attemptedFill;
        const totalItems = totalArticles + totalFlashcards + totalMcq + totalTf + totalFill;
        const generatedRatio = course.sectionCount > 0 ? course.sections.length / course.sectionCount : 0;

        const progress =
          totalItems > 0
            ? Math.round((completedItems / totalItems) * generatedRatio * 100)
            : 0;

        progressMap.set(cid, progress);
      })
    );

    const result = courses.map((c) => ({
      ...c,
      progress: progressMap.get(c.id) ?? 0,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
}

/** GET /api/courses/:id — single course with sections + progress stats */
export async function getCourseById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getUserId(req);
    const id = objectIdParam(req, "id");

    const course = await prisma.aiCourse.findFirst({
      where: { id, userId },
      include: {
        sections: { orderBy: { sectionNumber: "asc" } },
      },
    });

    if (!course) throw new AppError(404, "Course not found");

    // Aggregate progress stats
    const [
      articlesRead,
      totalArticles,
      flashcardsReviewed,
      totalFlashcards,
      mcqAttempted,
      totalMcq,
      tfAttempted,
      totalTf,
      fillAttempted,
      totalFill,
    ] = await Promise.all([
      prisma.aiArticlePage.count({
        where: { section: { courseId: id }, isRead: true },
      }),
      prisma.aiArticlePage.count({
        where: { section: { courseId: id } },
      }),
      prisma.aiFlashcard.count({
        where: { section: { courseId: id }, reviewCount: { gt: 0 } },
      }),
      prisma.aiFlashcard.count({
        where: { section: { courseId: id } },
      }),
      prisma.aiMcqQuestion.count({
        where: { section: { courseId: id }, isAttempted: true },
      }),
      prisma.aiMcqQuestion.count({
        where: { section: { courseId: id } },
      }),
      prisma.aiTrueFalseQuestion.count({
        where: { section: { courseId: id }, isAttempted: true },
      }),
      prisma.aiTrueFalseQuestion.count({
        where: { section: { courseId: id } },
      }),
      prisma.aiFillUpQuestion.count({
        where: { section: { courseId: id }, isAttempted: true },
      }),
      prisma.aiFillUpQuestion.count({
        where: { section: { courseId: id } },
      }),
    ]);

    const totalQuizAttempted = mcqAttempted + tfAttempted + fillAttempted;
    const totalQuiz = totalMcq + totalTf + totalFill;
    const completedItems = articlesRead + flashcardsReviewed + totalQuizAttempted;
    const totalItems = totalArticles + totalFlashcards + totalQuiz;
    const generatedRatio = course.sectionCount > 0 ? course.sections.length / course.sectionCount : 0;
    const progress =
      totalItems > 0
        ? Math.round((completedItems / totalItems) * generatedRatio * 100)
        : 0;

    res.json({
      ...course,
      progress,
      stats: {
        articles: { read: articlesRead, total: totalArticles },
        flashcards: { reviewed: flashcardsReviewed, total: totalFlashcards },
        quizzes: {
          attempted: totalQuizAttempted,
          total: totalQuiz,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/courses — create a course + generate first section */
export async function createCourse(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getUserId(req);
    const input = createCourseSchema.parse(req.body);

    const result = await createCourseAndGenerateFirstSection(userId, input);

    if (!result.success) {
      throw new AppError(500, result.error ?? "Course generation failed");
    }

    res.status(201).json({ courseId: result.courseId });
  } catch (err) {
    next(err);
  }
}

/** POST /api/courses/:id/generate-section — generate next section */
export async function generateSection(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getUserId(req);
    const id = objectIdParam(req, "id");
    const { sectionNumber } = generateSectionSchema.parse(req.body);

    // Verify ownership
    const course = await prisma.aiCourse.findFirst({
      where: { id, userId },
    });
    if (!course) throw new AppError(404, "Course not found");

    const result = await generateNextSection(id, sectionNumber);

    if (!result.success) {
      throw new AppError(500, result.error ?? "Section generation failed");
    }

    res.json({ sectionId: result.sectionId });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/courses/:id */
export async function deleteCourse(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getUserId(req);
    const id = objectIdParam(req, "id");

    const course = await prisma.aiCourse.findFirst({
      where: { id, userId },
    });
    if (!course) throw new AppError(404, "Course not found");

    await prisma.aiCourse.delete({ where: { id } });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ── SECTION ─────────────────────────────────────────────────────────────────

/** GET /api/courses/sections/:sectionId — full section content */
export async function getSectionWithContent(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getUserId(req);
    const sectionId = objectIdParam(req, "sectionId");

    const section = await prisma.aiCourseSection.findUnique({
      where: { id: sectionId },
      include: {
        course: { select: { userId: true, title: true, topic: true } },
        articlePages: { orderBy: { pageNumber: "asc" } },
        flashcards: true,
        mindMaps: true,
        mcqQuestions: true,
        trueFalseQuestions: true,
        fillUpQuestions: true,
      },
    });

    if (!section) throw new AppError(404, "Section not found");
    if (section.course.userId !== userId)
      throw new AppError(403, "Access denied");

    // Transform data for the frontend
    const transformed = {
      ...section,
      mcqQuestions: section.mcqQuestions.map((q) => ({
        ...q,
        options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
      })),
      fillUpQuestions: section.fillUpQuestions.map((q) => ({
        ...q,
        question: q.sentence,
      })),
    };

    res.json(transformed);
  } catch (err) {
    next(err);
  }
}

/** POST /api/courses/sections/:sectionId/complete */
export async function markSectionComplete(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getUserId(req);
    const sectionId = objectIdParam(req, "sectionId");

    const section = await prisma.aiCourseSection.findUnique({
      where: { id: sectionId },
      include: { course: { select: { userId: true } } },
    });

    if (!section) throw new AppError(404, "Section not found");
    if (section.course.userId !== userId)
      throw new AppError(403, "Access denied");

    if (section.isCompleted) {
      res.json(section);
      return;
    }

    const updated = await prisma.aiCourseSection.update({
      where: { id: sectionId },
      data: { isCompleted: true, completedAt: new Date() },
    });

    const completedCount = await prisma.aiCourseSection.count({
      where: { courseId: section.courseId, isCompleted: true },
    });

    await prisma.aiCourse.update({
      where: { id: section.courseId },
      data: { completedSections: completedCount },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// ── ARTICLE ─────────────────────────────────────────────────────────────────

/** POST /api/courses/articles/:articleId/read */
export async function markArticleRead(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getUserId(req);
    const articleId = objectIdParam(req, "articleId");

    const article = await prisma.aiArticlePage.findUnique({
      where: { id: articleId },
    });
    if (!article) throw new AppError(404, "Article not found");

    const section = await prisma.aiCourseSection.findUnique({
      where: { id: article.sectionId },
      include: { course: { select: { userId: true } } },
    });
    if (!section || section.course.userId !== userId)
      throw new AppError(403, "Access denied");

    const updated = await prisma.aiArticlePage.update({
      where: { id: articleId },
      data: { isRead: true, readAt: new Date() },
    });

    // Auto-complete section when all articles in it are read
    const unreadCount = await prisma.aiArticlePage.count({
      where: { sectionId: article.sectionId, isRead: false },
    });

    if (unreadCount === 0 && !section.isCompleted) {
      await prisma.aiCourseSection.update({
        where: { id: section.id },
        data: { isCompleted: true, completedAt: new Date() },
      });

      const completedSections = await prisma.aiCourseSection.count({
        where: { courseId: section.courseId, isCompleted: true },
      });

      await prisma.aiCourse.update({
        where: { id: section.courseId },
        data: { completedSections },
      });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// ── QUIZ SUBMISSIONS ────────────────────────────────────────────────────────

/** POST /api/courses/mcq/:questionId/answer */
export async function submitMcqAnswer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getUserId(req);
    const questionId = objectIdParam(req, "questionId");
    const { answer } = submitAnswerSchema.parse(req.body);

    const question = await prisma.aiMcqQuestion.findUnique({
      where: { id: questionId },
    });
    if (!question) throw new AppError(404, "Question not found");

    const section = await prisma.aiCourseSection.findUnique({
      where: { id: question.sectionId },
      include: { course: { select: { userId: true } } },
    });
    if (!section || section.course.userId !== userId)
      throw new AppError(403, "Access denied");

    const isCorrect = question.answer === answer;

    await prisma.aiMcqQuestion.update({
      where: { id: questionId },
      data: {
        isAttempted: true,
        userAnswer: answer,
        isCorrect,
        attemptedAt: new Date(),
      },
    });

    res.json({ isCorrect, correctAnswer: question.answer });
  } catch (err) {
    next(err);
  }
}

/** POST /api/courses/truefalse/:questionId/answer */
export async function submitTrueFalseAnswer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getUserId(req);
    const questionId = objectIdParam(req, "questionId");
    const { answer } = req.body;

    const question = await prisma.aiTrueFalseQuestion.findUnique({
      where: { id: questionId },
    });
    if (!question) throw new AppError(404, "Question not found");

    const section = await prisma.aiCourseSection.findUnique({
      where: { id: question.sectionId },
      include: { course: { select: { userId: true } } },
    });
    if (!section || section.course.userId !== userId)
      throw new AppError(403, "Access denied");

    const isCorrect = question.answer === answer;

    await prisma.aiTrueFalseQuestion.update({
      where: { id: questionId },
      data: {
        isAttempted: true,
        userAnswer: answer,
        isCorrect,
        attemptedAt: new Date(),
      },
    });

    res.json({
      isCorrect,
      correctAnswer: question.answer,
      explanation: question.explanation,
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/courses/fillup/:questionId/answer */
export async function submitFillUpAnswer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getUserId(req);
    const questionId = objectIdParam(req, "questionId");
    const { answer } = submitAnswerSchema.parse(req.body);

    const question = await prisma.aiFillUpQuestion.findUnique({
      where: { id: questionId },
    });
    if (!question) throw new AppError(404, "Question not found");

    const section = await prisma.aiCourseSection.findUnique({
      where: { id: question.sectionId },
      include: { course: { select: { userId: true } } },
    });
    if (!section || section.course.userId !== userId)
      throw new AppError(403, "Access denied");

    const isCorrect =
      question.missingWord.toLowerCase().trim() ===
      answer.toLowerCase().trim();

    await prisma.aiFillUpQuestion.update({
      where: { id: questionId },
      data: {
        isAttempted: true,
        userAnswer: answer,
        isCorrect,
        attemptedAt: new Date(),
      },
    });

    res.json({ isCorrect, correctAnswer: question.missingWord });
  } catch (err) {
    next(err);
  }
}

// ── FLASHCARD REVIEW ────────────────────────────────────────────────────────

/** POST /api/courses/flashcards/:flashcardId/review */
export async function reviewFlashcard(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getUserId(req);
    const flashcardId = objectIdParam(req, "flashcardId");
    const { isCorrect } = reviewFlashcardSchema.parse(req.body);

    const flashcard = await prisma.aiFlashcard.findUnique({
      where: { id: flashcardId },
    });
    if (!flashcard) throw new AppError(404, "Flashcard not found");

    const section = await prisma.aiCourseSection.findUnique({
      where: { id: flashcard.sectionId },
      include: { course: { select: { userId: true } } },
    });
    if (!section || section.course.userId !== userId)
      throw new AppError(403, "Access denied");

    // Simple spaced repetition
    const newDifficulty = isCorrect
      ? Math.max(0, flashcard.difficulty - 1)
      : Math.min(5, flashcard.difficulty + 1);

    const daysUntilReview = Math.pow(2, 5 - newDifficulty);
    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + daysUntilReview);

    const updated = await prisma.aiFlashcard.update({
      where: { id: flashcardId },
      data: {
        reviewCount: { increment: 1 },
        correctCount: isCorrect ? { increment: 1 } : undefined,
        difficulty: newDifficulty,
        nextReviewAt,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}
