import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import {
  verifyPassword,
  signSession,
  setSessionCookie,
  type AdminSession,
} from "@/lib/auth";

type LoginRequest = {
  user?: unknown;
  password?: unknown;
};

export const maxDuration = 15;

export async function POST(request: Request) {
  let user = "";
  let password = "";

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as
      | LoginRequest
      | null;
    user = String(body?.user ?? "");
    password = String(body?.password ?? "");
  } else {
    try {
      const formData = await request.formData();
      user = String(formData.get("user") ?? "");
      password = String(formData.get("password") ?? "");
    } catch {
      /* ignore */
    }
  }

  const normalizedUser = user.trim();
  const normalizedPassword = password; // no trim() en la pass;
  const userOk = normalizedUser.length >= 2;
  const passwordOk = normalizedPassword.length >= 4;

  if (!userOk || !passwordOk) {
    return NextResponse.json(
      { ok: false, userOk, passwordOk },
      { status: 401 },
    );
  }

  const admin = await queryOne<{
    id: number;
    username: string;
    password_hash: string;
    name: string | null;
    email: string | null;
    role: AdminSession["role"];
    active: number;
  }>(
    `SELECT id, username, password_hash, name, email, role, 1 AS active FROM admins WHERE username = ? LIMIT 1`,
    [normalizedUser],
  );

  if (!admin) {
    return NextResponse.json(
      { ok: false, userOk: false, passwordOk: true },
      { status: 401 },
    );
  }

  const match = await verifyPassword(normalizedPassword, admin.password_hash);
  if (!match) {
    return NextResponse.json(
      { ok: false, userOk: true, passwordOk: false },
      { status: 401 },
    );
  }

  // actualizar last_login_at
  await queryOne(`UPDATE admins SET last_login_at = NOW() WHERE id = ?`, [
    admin.id,
  ]).catch(() => null);

  const session: AdminSession = {
    id: admin.id,
    username: admin.username,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  };

  const token = await signSession(session);
  await setSessionCookie(token);

  return NextResponse.json({
    ok: true,
    admin: {
      username: session.username,
      name: session.name,
      email: session.email,
      role: session.role,
    },
  });
}
