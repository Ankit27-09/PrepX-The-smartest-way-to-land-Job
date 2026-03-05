import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../services/auth.service";

/**
 * Central error handler — catches all errors thrown in route handlers.
 *  - Zod validation errors → 400
 *  - AppError (custom)     → custom status
 *  - JWT errors            → 401
 *  - Everything else       → 500
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Zod validation
  if (err instanceof ZodError) {
    const messages = err.issues.map((e: { message: string }) => e.message);
    res.status(400).json({
      success: false,
      message: messages[0],
      errors: messages,
    });
    return;
  }

  // Custom app error
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // JWT errors
  if (
    err instanceof Error &&
    (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError")
  ) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
    return;
  }

  // Unknown
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}
