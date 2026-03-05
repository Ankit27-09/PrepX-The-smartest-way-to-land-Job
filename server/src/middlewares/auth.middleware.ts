import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { findUserById, AppError } from "../services/auth.service";

/**
 * Middleware that guards protected routes.
 * Reads the JWT from the `token` cookie or the `Authorization: Bearer <token>` header.
 * Attaches the user to `req.user`.
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null);

    if (!token) {
      throw new AppError(401, "Authentication required");
    }

    const { userId } = verifyToken(token);
    const user = await findUserById(userId);

    if (!user) {
      throw new AppError(401, "User no longer exists");
    }

    // Attach to request for downstream handlers
    (req as Request & { user: typeof user }).user = user;

    next();
  } catch (err) {
    next(err);
  }
}
