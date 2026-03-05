import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import courseRoutes from "./routes/course.routes";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

// ── Global middleware ───────────────────────────────────────────────────────

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// ── Routes ──────────────────────────────────────────────────────────────────

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "PrepX API is running 🚀" });
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);

// ── Error handler (must be last) ────────────────────────────────────────────

app.use(errorHandler);

// ── Start ───────────────────────────────────────────────────────────────────

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});