import type { Request, Response, NextFunction } from "express";
import {
  signupSchema,
  loginSchema,
  googleAuthSchema,
} from "../validators/auth.validator";
import {
  createLocalUser,
  authenticateLocal,
  authenticateGoogle,
  findUserById,
  AppError,
} from "../services/auth.service";
import { signToken, verifyToken } from "../utils/jwt";
import { setAuthCookie, clearAuthCookie } from "../utils/cookie";
import { sanitizeUser } from "../utils/sanitize";

// ── POST /api/auth/signup ───────────────────────────────────────────────────

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const data = signupSchema.parse(req.body);
    const user = await createLocalUser(data);
    const token = signToken(user.id);

    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      user: sanitizeUser(user),
      token,
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/login ────────────────────────────────────────────────────

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);
    const user = await authenticateLocal(data);
    const token = signToken(user.id);

    setAuthCookie(res, token);

    res.json({
      success: true,
      user: sanitizeUser(user),
      token,
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/google ───────────────────────────────────────────────────

export async function googleLogin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { credential } = googleAuthSchema.parse(req.body);

    // Verify the access-token via Google's userinfo endpoint
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${credential}` } }
    );

    if (!response.ok) {
      throw new AppError(401, "Invalid Google token");
    }

    const payload = (await response.json()) as {
      sub: string;
      email: string;
      name: string;
      picture?: string;
    };

    if (!payload.email) {
      throw new AppError(401, "Google account missing email");
    }

    const user = await authenticateGoogle(payload);
    const token = signToken(user.id);

    setAuthCookie(res, token);

    res.json({
      success: true,
      user: sanitizeUser(user),
      token,
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/auth/me ────────────────────────────────────────────────────────

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null);

    if (!token) {
      res.json({ success: false, user: null });
      return;
    }

    const { userId } = verifyToken(token);
    const user = await findUserById(userId);

    if (!user) {
      res.json({ success: false, user: null });
      return;
    }

    res.json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (err) {
    // Invalid/expired token → treat as not authenticated
    res.json({ success: false, user: null });
  }
}

// ── POST /api/auth/logout ───────────────────────────────────────────────────

export async function logout(_req: Request, res: Response) {
  clearAuthCookie(res);
  res.json({ success: true, message: "Logged out" });
}
