import bcrypt from "bcryptjs";
import prisma from "../config/db";
import type { SignupInput, LoginInput } from "../validators/auth.validator";

// ── Signup (local) ──────────────────────────────────────────────────────────

export async function createLocalUser(input: SignupInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new AppError(409, "An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashedPassword,
      provider: "LOCAL",
    },
  });

  return user;
}

// ── Login (local) ───────────────────────────────────────────────────────────

export async function authenticateLocal(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user || !user.password) {
    throw new AppError(401, "Invalid email or password");
  }

  const isMatch = await bcrypt.compare(input.password, user.password);

  if (!isMatch) {
    throw new AppError(401, "Invalid email or password");
  }

  return user;
}

// ── Google OAuth ────────────────────────────────────────────────────────────

interface GooglePayload {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

export async function authenticateGoogle(payload: GooglePayload) {
  let user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    // First-time Google login → create account
    user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        avatar: payload.picture ?? null,
        provider: "GOOGLE",
      },
    });
  }

  return user;
}

// ── Find by ID ──────────────────────────────────────────────────────────────

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

// ── AppError helper ─────────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}
