import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import {
  apiGetCourses,
  apiGetCourse,
  apiCreateCourse,
  apiDeleteCourse,
  apiGetSection,
  apiGenerateSection,
  type CreateCourseInput,
} from "@/lib/api";
import type { Course, CourseDetail, SectionContent } from "@/pages/Courses/types";

/* ── State ───────────────────────────────────────────────────────────────── */

interface CoursesState {
  list: Course[];
  listLoading: boolean;
  listError: string | null;

  /** Currently-viewed course detail (with stats). */
  currentCourse: CourseDetail | null;
  courseLoading: boolean;
  courseError: string | null;

  /** Section content cache keyed by sectionId. */
  sections: Record<string, SectionContent>;
  sectionLoading: boolean;
  sectionError: string | null;

  /** Flags for create / generate actions. */
  creating: boolean;
  generating: boolean;
}

const initialState: CoursesState = {
  list: [],
  listLoading: false,
  listError: null,

  currentCourse: null,
  courseLoading: false,
  courseError: null,

  sections: {},
  sectionLoading: false,
  sectionError: null,

  creating: false,
  generating: false,
};

/* ── Thunks ──────────────────────────────────────────────────────────────── */

export const fetchCourses = createAsyncThunk(
  "courses/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await apiGetCourses();
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const fetchCourseDetail = createAsyncThunk(
  "courses/fetchDetail",
  async (courseId: string, { rejectWithValue }) => {
    try {
      return await apiGetCourse(courseId);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const createCourse = createAsyncThunk(
  "courses/create",
  async (input: CreateCourseInput, { rejectWithValue }) => {
    try {
      return await apiCreateCourse(input);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const deleteCourse = createAsyncThunk(
  "courses/delete",
  async (courseId: string, { rejectWithValue }) => {
    try {
      await apiDeleteCourse(courseId);
      return courseId;
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const fetchSectionContent = createAsyncThunk(
  "courses/fetchSection",
  async (sectionId: string, { rejectWithValue }) => {
    try {
      return await apiGetSection(sectionId);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const generateSection = createAsyncThunk(
  "courses/generateSection",
  async (
    { courseId, sectionNumber }: { courseId: string; sectionNumber: number },
    { rejectWithValue }
  ) => {
    try {
      return await apiGenerateSection(courseId, sectionNumber);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

/* ── Slice ───────────────────────────────────────────────────────────────── */

const coursesSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    clearCurrentCourse(state) {
      state.currentCourse = null;
      state.courseError = null;
    },
    /** Optimistically update section content in cache after an interaction. */
    updateSectionInCache(
      state,
      action: PayloadAction<{ sectionId: string; section: SectionContent }>
    ) {
      state.sections[action.payload.sectionId] = action.payload.section;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── List ────────────────────────────────────────────────────────
      .addCase(fetchCourses.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.list = action.payload;
        state.listLoading = false;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload as string;
      })

      // ── Detail ──────────────────────────────────────────────────────
      .addCase(fetchCourseDetail.pending, (state) => {
        state.courseLoading = true;
        state.courseError = null;
      })
      .addCase(fetchCourseDetail.fulfilled, (state, action) => {
        state.currentCourse = action.payload;
        state.courseLoading = false;
      })
      .addCase(fetchCourseDetail.rejected, (state, action) => {
        state.courseLoading = false;
        state.courseError = action.payload as string;
      })

      // ── Create ──────────────────────────────────────────────────────
      .addCase(createCourse.pending, (state) => {
        state.creating = true;
      })
      .addCase(createCourse.fulfilled, (state) => {
        state.creating = false;
      })
      .addCase(createCourse.rejected, (state) => {
        state.creating = false;
      })

      // ── Delete ──────────────────────────────────────────────────────
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.list = state.list.filter((c) => c.id !== action.payload);
        if (state.currentCourse?.id === action.payload) {
          state.currentCourse = null;
        }
      })

      // ── Section content ─────────────────────────────────────────────
      .addCase(fetchSectionContent.pending, (state) => {
        state.sectionLoading = true;
        state.sectionError = null;
      })
      .addCase(fetchSectionContent.fulfilled, (state, action) => {
        state.sections[action.payload.id] = action.payload;
        state.sectionLoading = false;
      })
      .addCase(fetchSectionContent.rejected, (state, action) => {
        state.sectionLoading = false;
        state.sectionError = action.payload as string;
      })

      // ── Generate section ────────────────────────────────────────────
      .addCase(generateSection.pending, (state) => {
        state.generating = true;
      })
      .addCase(generateSection.fulfilled, (state) => {
        state.generating = false;
      })
      .addCase(generateSection.rejected, (state) => {
        state.generating = false;
      });
  },
});

export const { clearCurrentCourse, updateSectionInCache } = coursesSlice.actions;
export default coursesSlice.reducer;
