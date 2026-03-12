const API_BASE = "/api";

/* ── Typed API response ──────────────────────────────────────────────────── */

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  provider: "LOCAL" | "GOOGLE";
  createdAt: string;
}

interface ApiSuccess {
  success: true;
  user: ApiUser;
  token: string;
}

interface ApiError {
  success: false;
  message: string;
  errors?: string[];
}

type ApiResponse = ApiSuccess | ApiError;

/* ── Helper ──────────────────────────────────────────────────────────────── */

async function request<T = ApiResponse>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      (data as { message?: string }).message ??
        `Request failed (${res.status})`
    );
  }

  return data as T;
}

/* ── Auth endpoints ──────────────────────────────────────────────────────── */

export async function apiSignup(body: {
  name: string;
  email: string;
  password: string;
}): Promise<ApiResponse> {
  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiLogin(body: {
  email: string;
  password: string;
}): Promise<ApiResponse> {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiGoogleLogin(credential: string): Promise<ApiResponse> {
  return request("/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
}

export async function apiGetMe(): Promise<ApiResponse> {
  return request("/auth/me");
}

export async function apiLogout(): Promise<{ success: boolean }> {
  return request("/auth/logout", { method: "POST" });
}

/* ── Course endpoints ────────────────────────────────────────────────────── */

import type {
  Course,
  CourseDetail,
  SectionContent,
} from "@/Pages/Courses/types";

export async function apiGetCourses(): Promise<Course[]> {
  const courses = await request<Course[]>("/courses");
  return courses.map((c) => ({ ...c, sections: c.sections ?? [] }));
}

export async function apiGetCourse(id: string): Promise<CourseDetail> {
  const course = await request<CourseDetail>(`/courses/${id}`);
  return { ...course, sections: course.sections ?? [] };
}

export interface CreateCourseInput {
  topic: string;
  level: string;
  goal: string;
  tone: string;
  sectionCount: number;
  timeCommitment: string;
}

export async function apiCreateCourse(
  input: CreateCourseInput
): Promise<{ courseId: string }> {
  return request<{ courseId: string }>("/courses", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function apiGenerateSection(
  courseId: string,
  sectionNumber: number
): Promise<{ sectionId: string }> {
  return request<{ sectionId: string }>(
    `/courses/${courseId}/generate-section`,
    { method: "POST", body: JSON.stringify({ sectionNumber }) }
  );
}

export async function apiDeleteCourse(
  id: string
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/courses/${id}`, { method: "DELETE" });
}

export async function apiGetSection(
  sectionId: string
): Promise<SectionContent> {
  return request<SectionContent>(`/courses/sections/${sectionId}`);
}

export async function apiMarkSectionComplete(
  sectionId: string
): Promise<unknown> {
  return request(`/courses/sections/${sectionId}/complete`, { method: "POST" });
}

export async function apiMarkArticleRead(
  articleId: string
): Promise<unknown> {
  return request(`/courses/articles/${articleId}/read`, { method: "POST" });
}

export async function apiSubmitMcqAnswer(
  questionId: string,
  answer: string
): Promise<{ isCorrect: boolean; correctAnswer: string }> {
  return request(`/courses/mcq/${questionId}/answer`, {
    method: "POST",
    body: JSON.stringify({ answer }),
  });
}

export async function apiSubmitTrueFalseAnswer(
  questionId: string,
  answer: boolean
): Promise<{ isCorrect: boolean; correctAnswer: boolean; explanation: string }> {
  return request(`/courses/truefalse/${questionId}/answer`, {
    method: "POST",
    body: JSON.stringify({ answer }),
  });
}

export async function apiSubmitFillUpAnswer(
  questionId: string,
  answer: string
): Promise<{ isCorrect: boolean; correctAnswer: string }> {
  return request(`/courses/fillup/${questionId}/answer`, {
    method: "POST",
    body: JSON.stringify({ answer }),
  });
}

export async function apiReviewFlashcard(
  flashcardId: string,
  isCorrect: boolean
): Promise<unknown> {
  return request(`/courses/flashcards/${flashcardId}/review`, {
    method: "POST",
    body: JSON.stringify({ isCorrect }),
  });
}

/* ── PDF Chat endpoints ──────────────────────────────────────────────────── */

export interface PdfChatImageInfo {
  filename: string;
  pdf_source: string;
  page_number: number;
  image_index: number;
  preview_url: string;
  base64_preview?: string;
}

interface PdfChatUploadResponse {
  message: string;
  text_chunks: number;
  images_uploaded: number;
  images_extracted_from_pdf: number;
  total_images: number;
  images: PdfChatImageInfo[];
}

interface PdfChatQueryResponse {
  answer: string;
  relevant_docs_count: number;
  relevant_images: PdfChatImageInfo[];
}

export async function apiUploadPdfFiles(
  files: File[]
): Promise<PdfChatUploadResponse> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));

  const res = await fetch(`${API_BASE}/pdf-chat/upload`, {
    method: "POST",
    credentials: "include",
    body: form,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      (data as { detail?: string }).detail ?? `Upload failed (${res.status})`
    );
  }
  return data as PdfChatUploadResponse;
}

export async function apiQueryPdfChat(
  query: string
): Promise<PdfChatQueryResponse> {
  const res = await fetch(`${API_BASE}/pdf-chat/query`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      (data as { detail?: string }).detail ?? `Query failed (${res.status})`
    );
  }
  return data as PdfChatQueryResponse;
}
