import {
  GoogleGenerativeAI,
  SchemaType,
  type Schema,
} from "@google/generative-ai";
import prisma from "../config/db";
import { env } from "../config/env";

// ── Gemini client ───────────────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// ── Types ───────────────────────────────────────────────────────────────────

export interface CreateCourseInput {
  topic: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  goal: string;
  tone: "professional" | "casual" | "technical";
  targetAudience?: string;
  prerequisites?: string;
  sectionCount: number;
  timeCommitment: string;
  startDate?: Date;
  endDate?: Date;
}

interface GeneratedSection {
  sectionTitle: string;
  article: {
    pages: Array<{ pageTitle: string; content: string }>;
  };
  studyMaterial: {
    mindMap: {
      label: string;
      children?: Array<{
        label: string;
        children?: Array<{ label: string }>;
      }>;
    };
    flashcards: Array<{ front: string; back: string }>;
  };
  quiz: {
    mcqs: Array<{ question: string; options: string[]; answer: string }>;
    trueFalse: Array<{
      question: string;
      answer: boolean;
      explanation: string;
    }>;
    fillUps: Array<{ sentence: string; missingWord: string }>;
  };
}

// ── Gemini structured-output schema ─────────────────────────────────────────

const courseGenerationSchema: Schema = {
  description:
    "Complete course section with article, study materials, and quizzes",
  type: SchemaType.OBJECT,
  properties: {
    sectionTitle: {
      type: SchemaType.STRING,
      description: "Clear, descriptive title for this section",
    },
    article: {
      type: SchemaType.OBJECT,
      description: "Educational article content split into pages",
      properties: {
        pages: {
          type: SchemaType.ARRAY,
          description: "Article pages (3 pages recommended)",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              pageTitle: {
                type: SchemaType.STRING,
                description: "Title for this page",
              },
              content: {
                type: SchemaType.STRING,
                description: "Full markdown content",
              },
            },
            required: ["pageTitle", "content"],
          },
        },
      },
      required: ["pages"],
    },
    studyMaterial: {
      type: SchemaType.OBJECT,
      description: "Study materials for reinforcement",
      properties: {
        mindMap: {
          type: SchemaType.OBJECT,
          description: "Hierarchical mind map structure",
          properties: {
            label: {
              type: SchemaType.STRING,
              description: "Root node label",
            },
            children: {
              type: SchemaType.ARRAY,
              description: "Child concept nodes",
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  label: { type: SchemaType.STRING },
                  children: {
                    type: SchemaType.ARRAY,
                    items: {
                      type: SchemaType.OBJECT,
                      properties: { label: { type: SchemaType.STRING } },
                      required: ["label"],
                    },
                  },
                },
                required: ["label"],
              },
            },
          },
          required: ["label"],
        },
        flashcards: {
          type: SchemaType.ARRAY,
          description: "5-8 flashcards for key concepts",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              front: {
                type: SchemaType.STRING,
                description: "Question or prompt",
              },
              back: {
                type: SchemaType.STRING,
                description: "Answer or explanation",
              },
            },
            required: ["front", "back"],
          },
        },
      },
      required: ["mindMap", "flashcards"],
    },
    quiz: {
      type: SchemaType.OBJECT,
      description: "Quiz questions for assessment",
      properties: {
        mcqs: {
          type: SchemaType.ARRAY,
          description: "5 multiple choice questions",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              question: { type: SchemaType.STRING },
              options: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
              },
              answer: { type: SchemaType.STRING },
            },
            required: ["question", "options", "answer"],
          },
        },
        trueFalse: {
          type: SchemaType.ARRAY,
          description: "5 true/false questions",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              question: { type: SchemaType.STRING },
              answer: { type: SchemaType.BOOLEAN },
              explanation: { type: SchemaType.STRING },
            },
            required: ["question", "answer", "explanation"],
          },
        },
        fillUps: {
          type: SchemaType.ARRAY,
          description: "5 fill-in-the-blank questions",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              sentence: { type: SchemaType.STRING },
              missingWord: { type: SchemaType.STRING },
            },
            required: ["sentence", "missingWord"],
          },
        },
      },
      required: ["mcqs", "trueFalse", "fillUps"],
    },
  },
  required: ["sectionTitle", "article", "studyMaterial", "quiz"],
};

// ── Retry helpers ───────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("429") ||
      error.message.includes("Too Many Requests")
    );
  }
  return false;
}

function getRetryDelay(error: unknown, attempt: number): number {
  if (error instanceof Error) {
    const match = error.message.match(/retry in (\d+(?:\.\d+)?)/i);
    if (match) return Math.ceil(parseFloat(match[1]) * 1000) + 1000;
  }
  return Math.min(10_000 * Math.pow(2, attempt), 120_000);
}

// ── Section generation via Gemini ───────────────────────────────────────────

async function generateSectionContent(
  input: CreateCourseInput,
  sectionNumber: number,
  totalSections: number,
  previousContext: string,
  maxRetries = 5
): Promise<GeneratedSection> {
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: courseGenerationSchema,
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  });

  const prompt = `You are an expert educator creating a comprehensive online course. Generate Section ${sectionNumber} of ${totalSections} for a course on "${input.topic}".

## Course Configuration:
- **Topic**: ${input.topic}
- **Target Level**: ${input.level}
- **Learning Goal**: ${input.goal}
- **Teaching Tone**: ${input.tone}
${input.targetAudience ? `- **Target Audience**: ${input.targetAudience}` : ""}
${input.prerequisites ? `- **Prerequisites**: ${input.prerequisites}` : ""}
- **Daily Time Commitment**: ${input.timeCommitment}

## Section Context:
${previousContext ? `**Previous Sections Summary**: ${previousContext}` : "This is the first section - introduce the topic fundamentals."}

## Requirements:
1. **Article**: Create 3 comprehensive pages in Markdown format with clear headings, code examples where relevant, bullet points, bold/italic for key terms, and practical examples.
2. **Mind Map**: Hierarchical concept map — root node + 3-4 main branches + 2-3 sub-concepts each.
3. **Flashcards**: 5-8 flashcards covering key definitions and concepts.
4. **Quiz**: 5 MCQs (4 options each), 5 True/False (with explanations), 5 Fill-in-the-blanks.

## Critical Rules:
- Content must be educational, accurate, and engaging
- Match the specified tone (${input.tone})
- Ensure proper difficulty for ${input.level} level
- No duplicate content from previous sections
- All quiz answers must be unambiguous and correct`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text) as GeneratedSection;

      if (
        !parsed.sectionTitle ||
        !parsed.article?.pages ||
        !parsed.studyMaterial ||
        !parsed.quiz
      ) {
        throw new Error("Invalid response structure from Gemini");
      }

      return parsed;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (isRateLimitError(error)) {
        const delay = getRetryDelay(error, attempt);
        console.log(
          `Rate limit hit. Waiting ${Math.round(delay / 1000)}s before retry…`
        );
        await sleep(delay);
        continue;
      }

      if (error instanceof SyntaxError && attempt < maxRetries - 1) {
        await sleep(2000);
        continue;
      }

      throw new Error(
        `Failed to generate section ${sectionNumber}: ${lastError.message}`
      );
    }
  }

  throw new Error(
    `Failed to generate section ${sectionNumber} after ${maxRetries} attempts. Last error: ${lastError?.message ?? "Unknown"}`
  );
}

// ── Persist section to database ─────────────────────────────────────────────

async function persistSection(
  courseId: string,
  sectionNumber: number,
  content: GeneratedSection,
  previousContext: string
): Promise<string> {
  const section = await prisma.aiCourseSection.create({
    data: {
      courseId,
      sectionNumber,
      title: content.sectionTitle,
      previousContext,
      isCompleted: false,
    },
  });

  // Article pages
  if (content.article.pages.length > 0) {
    await prisma.aiArticlePage.createMany({
      data: content.article.pages.map((page, i) => ({
        sectionId: section.id,
        pageNumber: i + 1,
        pageTitle: page.pageTitle,
        content: page.content,
      })),
    });
  }

  // Mind map
  if (content.studyMaterial.mindMap) {
    await prisma.aiMindMap.create({
      data: {
        sectionId: section.id,
        data: JSON.stringify(content.studyMaterial.mindMap),
      },
    });
  }

  // Flashcards
  if (content.studyMaterial.flashcards.length > 0) {
    await prisma.aiFlashcard.createMany({
      data: content.studyMaterial.flashcards.map((card) => ({
        sectionId: section.id,
        front: card.front,
        back: card.back,
      })),
    });
  }

  // MCQs
  if (content.quiz.mcqs.length > 0) {
    await prisma.aiMcqQuestion.createMany({
      data: content.quiz.mcqs.map((mcq) => ({
        sectionId: section.id,
        question: mcq.question,
        options: JSON.stringify(mcq.options),
        answer: mcq.answer,
      })),
    });
  }

  // True/False
  if (content.quiz.trueFalse.length > 0) {
    await prisma.aiTrueFalseQuestion.createMany({
      data: content.quiz.trueFalse.map((tf) => ({
        sectionId: section.id,
        question: tf.question,
        answer: tf.answer,
        explanation: tf.explanation,
      })),
    });
  }

  // Fill-ups
  if (content.quiz.fillUps.length > 0) {
    await prisma.aiFillUpQuestion.createMany({
      data: content.quiz.fillUps.map((f) => ({
        sectionId: section.id,
        sentence: f.sentence,
        missingWord: f.missingWord,
      })),
    });
  }

  return `Section ${sectionNumber}: ${content.sectionTitle} — Covered: ${content.article.pages.map((p) => p.pageTitle).join(", ")}`;
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function createCourseAndGenerateFirstSection(
  userId: string,
  input: CreateCourseInput
): Promise<{ success: boolean; courseId?: string; error?: string }> {
  let courseId: string | undefined;

  try {
    const course = await prisma.aiCourse.create({
      data: {
        userId,
        title: input.topic,
        topic: input.topic,
        description: `A ${input.level} level course on ${input.topic} designed to help you ${input.goal}.`,
        level: input.level,
        goal: input.goal,
        tone: input.tone,
        targetAudience: input.targetAudience ?? null,
        prerequisites: input.prerequisites ?? null,
        sectionCount: input.sectionCount,
        timeCommitment: input.timeCommitment,
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        status: "generating",
      },
    });
    courseId = course.id;

    console.log(`Generating section 1 of ${input.sectionCount}…`);
    const sectionContent = await generateSectionContent(
      input,
      1,
      input.sectionCount,
      ""
    );
    await persistSection(courseId, 1, sectionContent, "");

    await prisma.aiCourse.update({
      where: { id: courseId },
      data: { status: "active" },
    });

    console.log(`Course ${courseId} — first section generated ✓`);
    return { success: true, courseId };
  } catch (error) {
    console.error("Course generation failed:", error);

    if (courseId) {
      await prisma.aiCourse.update({
        where: { id: courseId },
        data: { status: "draft" },
      });
    }

    return {
      success: false,
      courseId,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function generateNextSection(
  courseId: string,
  sectionNumber: number
): Promise<{ success: boolean; sectionId?: string; error?: string }> {
  try {
    const course = await prisma.aiCourse.findUnique({
      where: { id: courseId },
    });
    if (!course) return { success: false, error: "Course not found" };

    const sections = await prisma.aiCourseSection.findMany({
      where: { courseId },
      orderBy: { sectionNumber: "asc" },
    });

    const previousContext = sections
      .filter((s) => s.sectionNumber < sectionNumber)
      .map((s) => `Section ${s.sectionNumber}: ${s.title}`)
      .join("\n");

    const input: CreateCourseInput = {
      topic: course.topic,
      level: course.level as CreateCourseInput["level"],
      goal: course.goal,
      tone: course.tone as CreateCourseInput["tone"],
      targetAudience: course.targetAudience ?? undefined,
      prerequisites: course.prerequisites ?? undefined,
      sectionCount: course.sectionCount,
      timeCommitment: course.timeCommitment,
    };

    console.log(`Generating section ${sectionNumber} of ${course.sectionCount}…`);
    const sectionContent = await generateSectionContent(
      input,
      sectionNumber,
      course.sectionCount,
      previousContext
    );
    await persistSection(courseId, sectionNumber, sectionContent, previousContext);

    // Mark course complete if final section
    if (sectionNumber >= course.sectionCount) {
      await prisma.aiCourse.update({
        where: { id: courseId },
        data: { status: "completed", isComplete: true },
      });
    }

    const newSection = await prisma.aiCourseSection.findFirst({
      where: { courseId, sectionNumber },
    });

    return { success: true, sectionId: newSection?.id };
  } catch (error) {
    console.error("Section generation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
