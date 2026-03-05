import type { Response } from "express";

/**
 * Attach the JWT as an httpOnly cookie on the response.
 * The cookie is secure in production, SameSite=Lax for CSRF protection.
 */
export function setAuthCookie(res: Response, token: string): void {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
}

/** Remove the auth cookie. */
export function clearAuthCookie(res: Response): void {
  res.clearCookie("token", { path: "/" });
}
