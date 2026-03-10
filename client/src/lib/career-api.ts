/* ── Career Path Simulator — API Layer ──────────────────────────────────── */

const BASE = "/api/career";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? `Request failed (${res.status})`);
  return data as T;
}

/* ── Types ─────────────────────────────────────────────────────────────── */

export interface CareerFitReasoning {
  strengths_alignment: string[];
  interest_match: string[];
  skill_transferability: string[];
  growth_potential_reasons: string[];
  market_demand_reasons: string[];
  potential_challenges: string[];
  why_now: string;
}

export interface CareerFit {
  rank: number;
  career_title: string;
  career_field: string;
  overall_fit_score: number;
  skill_fit_score: number;
  interest_fit_score: number;
  market_fit_score: number;
  personality_fit_score: number;
  tagline: string;
  reasoning: CareerFitReasoning;
  typical_salary_range: string;
  time_to_entry: string;
  difficulty_level: string;
  top_3_reasons: string[];
  key_skills_needed: string[];
  immediate_next_steps: string[];
}

export interface CareerMatchingResponse {
  success: boolean;
  session_id: string;
  processing_time_ms: number;
  analysis_summary: string;
  profile_highlights: string[];
  career_fits: CareerFit[];
  methodology_explanation: string;
  confidence_level: string;
  confidence_reasoning: string;
  errors: string[];
}

export interface SimulationResponse {
  success: boolean;
  simulation_id: string;
  processing_time_ms: number;
  summary: Record<string, unknown>;
  dashboard_data: Record<string, unknown> | null;
  timeline: Record<string, unknown> | null;
  financial_analysis: Record<string, unknown> | null;
  risk_assessment: Record<string, unknown> | null;
  gap_analysis: Record<string, unknown> | null;
  warnings: string[];
  errors: string[];
}

/* ── API calls ─────────────────────────────────────────────────────────── */

/** Stage 1 — analyse the profile and return 3 career fits */
export function analyzeCareer(profile: Record<string, unknown>) {
  return post<CareerMatchingResponse>("/analyze", { profile });
}

/** Stage 2 — run full simulation for the selected career */
export function simulateSelected(sessionId: string, careerIndex: number) {
  return post<SimulationResponse>("/simulate/selected", {
    session_id: sessionId,
    career_index: careerIndex,
  });
}

/** Health check */
export async function careerHealth() {
  const res = await fetch(`${BASE}/health`);
  return res.json();
}

/** Upload resume PDF and extract text */
export async function uploadResume(
  file: File
): Promise<{ success: boolean; resume_text: string; filename: string; page_count: number }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/upload-resume`, {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? `Upload failed (${res.status})`);
  return data;
}
