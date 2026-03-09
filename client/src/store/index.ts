import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth/authSlice";
import coursesReducer from "./courses/coursesSlice";
import jobEnrichmentsReducer from "./Job/jobEnrichmentsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: coursesReducer,
    jobEnrichments: jobEnrichmentsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
