import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { store } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hydrateSession } from "@/store/auth/authSlice";
import { router } from "@/router";
import "./index.css";

/** Hydrates auth session on mount then renders the router. */
function AppShell() {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((s) => s.auth.loading);

  useEffect(() => {
    dispatch(hydrateSession());
  }, [dispatch]);
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <div className="dark min-h-screen overflow-x-hidden bg-black text-white antialiased">
          <AppShell />
        </div>
      </GoogleOAuthProvider>
    </Provider>
  </StrictMode>
);
