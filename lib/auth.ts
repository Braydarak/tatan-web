import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "tatan.crm.session";

export type AdminSession = {
  id: number;
  username: string;
  name: string | null;
  email: string | null;
  role: "owner" | "admin" | "editor";
};

type JwtPayload = {
  sub: string;
  username: string;
  name?: string | null;
  email?: string | null;
  role: string;
};

function getAuthSecret(): Uint8Array {
  const raw = process.env.AUTH_SECRET;
  if (!raw || raw.length < 16) {
    throw new Error(
      "[auth] AUTH_SECRET faltante o muy corto. Generalo con crypto.randomBytes(48).toString('base64url')",
    );
  }
  return new TextEncoder().encode(raw);
}

function getMaxAge(): number {
  return Number(process.env.AUTH_MAX_AGE ?? 60 * 60 * 24 * 7); // 7 días
}

function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}

/* ---------------------------------------------------------------- */
/*  Passwords                                                       */
/* ---------------------------------------------------------------- */

export function hashPassword(plain: string, rounds = 10): Promise<string> {
  return bcrypt.hash(plain, rounds);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/* ---------------------------------------------------------------- */
/*  JWT Session (firmada, sin cifrar — va en cookie httpOnly)       */
/* ---------------------------------------------------------------- */

export async function signSession(admin: AdminSession): Promise<string> {
  const secret = getAuthSecret();
  const iat = nowUnix();
  const exp = iat + getMaxAge();
  return new SignJWT({
    username: admin.username,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  } as JwtPayload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(String(admin.id))
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .setIssuer("tatan.crm")
    .sign(secret);
}

export async function verifySession(
  token: string,
): Promise<AdminSession | null> {
  try {
    const secret = getAuthSecret();
    const { payload } = await jwtVerify<JwtPayload>(token, secret, {
      issuer: "tatan.crm",
      algorithms: ["HS256"],
    });
    if (!payload.sub) return null;
    return {
      id: Number(payload.sub),
      username: payload.username,
      name: payload.name ?? null,
      email: payload.email ?? null,
      role: (payload.role as AdminSession["role"]) ?? "editor",
    };
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------- */
/*  Cookie helpers (para route handlers / server actions)           */
/* ---------------------------------------------------------------- */

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  const maxAge = getMaxAge();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
    priority: "high",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionFromCookie(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return verifySession(raw);
}

export { COOKIE_NAME as CRM_SESSION_COOKIE };
