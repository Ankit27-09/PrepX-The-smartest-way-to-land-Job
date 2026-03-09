/* ── Career Path Simulator — Zustand Store ─────────────────────────────── */

import { create } from "zustand";
import {
  analyzeCareer,
  simulateSelected,
  type CareerMatchingResponse,
  type SimulationResponse,
} from "./career-api";

/* ── Types ──────────────────────────────────────────────────────────────── */

export type Step = "form" | "analyzing" | "fits" | "simulating" | "dashboard";

export interface CareerProfile {
  /* Personal */
  current_education_level: string;
  institution_name: string;
  current_major: string;
  current_gpa: number;
  grading_scale: string;
  expected_graduation_year: number;

  /* Career targets */
  target_career_fields: string[];
  specific_roles: string[];
  primary_career_goal: string;
  desired_role_level: string;
  preferred_work_env: string[];

  /* Skills */
  technical_skills: Record<string, string>;
  soft_skills: Record<string, number>;

  /* Preferences */
  work_style: string;
  risk_tolerance: string;
  investment_capacity: string;
  hours_per_week: number;
  current_country: string;
  market_awareness: string;
  career_concerns: string[];
  optimism_level: string;

  /* Resume */
  resume_text: string;
  resume_filename: string;
}

export const DEFAULT_PROFILE: CareerProfile = {
  current_education_level: "",
  institution_name: "",
  current_major: "",
  current_gpa: 0,
  grading_scale: "10.0",
  expected_graduation_year: new Date().getFullYear() + 2,
  target_career_fields: [],
  specific_roles: [],
  primary_career_goal: "",
  desired_role_level: "",
  preferred_work_env: [],
  technical_skills: {},
  soft_skills: {},
  work_style: "",
  risk_tolerance: "Medium",
  investment_capacity: "",
  hours_per_week: 20,
  current_country: "",
  market_awareness: "Medium",
  career_concerns: [],
  optimism_level: "Balanced",
  resume_text: "",
  resume_filename: "",
};

/* ── Store shape ────────────────────────────────────────────────────────── */

interface CareerStore {
  step: Step;
  profile: CareerProfile;
  sessionId: string | null;
  matchingData: CareerMatchingResponse | null;
  simulationData: SimulationResponse | null;
  error: string | null;

  setProfile: (partial: Partial<CareerProfile>) => void;
  resetProfile: () => void;
  analyze: () => Promise<void>;
  selectCareer: (index: number) => Promise<void>;
  reset: () => void;
}

/* ── Store implementation ───────────────────────────────────────────────── */

export const useCareerStore = create<CareerStore>((set, get) => ({
  step: "form",
  profile: { ...DEFAULT_PROFILE },
  sessionId: null,
  matchingData: null,
  simulationData: null,
  error: null,

  setProfile: (partial) =>
    set((s) => ({ profile: { ...s.profile, ...partial } })),

  resetProfile: () => set({ profile: { ...DEFAULT_PROFILE } }),

  /* Stage 1 — analyze profile → get 3 career fits */
  analyze: async () => {
    set({ step: "analyzing", error: null });
    try {
      const data = await analyzeCareer(get().profile as unknown as Record<string, unknown>);
      set({
        step: "fits",
        matchingData: data,
        sessionId: data.session_id,
      });
    } catch (e: unknown) {
      set({ step: "form", error: (e as Error).message ?? "Analysis failed" });
    }
  },

  /* Stage 2 — select career → full simulation */
  selectCareer: async (index: number) => {
    const sid = get().sessionId;
    if (!sid) return;
    set({ step: "simulating", error: null });
    try {
      const data = await simulateSelected(sid, index);
      set({ step: "dashboard", simulationData: data });
    } catch (e: unknown) {
      set({ step: "fits", error: (e as Error).message ?? "Simulation failed" });
    }
  },

  reset: () =>
    set({
      step: "form",
      profile: { ...DEFAULT_PROFILE },
      sessionId: null,
      matchingData: null,
      simulationData: null,
      error: null,
    }),
}));
