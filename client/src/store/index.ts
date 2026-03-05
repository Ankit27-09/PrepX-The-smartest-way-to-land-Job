import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth/authSlice";
import coursesReducer from "./courses/coursesSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: coursesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
