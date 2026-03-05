import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  apiGetMe,
  apiLogin,
  apiSignup,
  apiGoogleLogin,
  apiLogout,
  type ApiUser,
} from "@/lib/api";

/* ── State ───────────────────────────────────────────────────────────────── */

interface AuthState {
  user: ApiUser | null;
  loading: boolean; // true only during initial session hydration
}

const initialState: AuthState = {
  user: null,
  loading: true,
};

/* ── Thunks ──────────────────────────────────────────────────────────────── */

/** Hydrate auth session on app mount (read cookie / token). */
export const hydrateSession = createAsyncThunk(
  "auth/hydrate",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiGetMe();
      if (res.success) return res.user;
      return rejectWithValue("Not authenticated");
    } catch {
      return rejectWithValue("Not authenticated");
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await apiLogin(payload);
      if (res.success) return res.user;
      return rejectWithValue(res.message);
    } catch (err) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Login failed"
      );
    }
  }
);

export const signup = createAsyncThunk(
  "auth/signup",
  async (
    payload: { name: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await apiSignup(payload);
      if (res.success) return res.user;
      return rejectWithValue(res.message);
    } catch (err) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Signup failed"
      );
    }
  }
);

export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async (accessToken: string, { rejectWithValue }) => {
    try {
      const res = await apiGoogleLogin(accessToken);
      if (res.success) return res.user;
      return rejectWithValue(res.message);
    } catch (err) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Google sign-in failed"
      );
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  await apiLogout();
});

/* ── Slice ───────────────────────────────────────────────────────────────── */

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Hydrate
      .addCase(hydrateSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(hydrateSession.rejected, (state) => {
        state.user = null;
        state.loading = false;
      })
      // Login
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      // Signup
      .addCase(signup.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      // Google
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export default authSlice.reducer;
