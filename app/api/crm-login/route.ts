import { NextResponse } from "next/server";

const MOCK_USER = "Darak";
const MOCK_PASSWORD = "CpJb8520";

type LoginResponse =
  | { ok: true }
  | { ok: false; userOk: boolean; passwordOk: boolean };

export async function POST(request: Request) {
  let user = "";
  let password = "";

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as {
      user?: unknown;
      password?: unknown;
    } | null;
    user = String(body?.user ?? "");
    password = String(body?.password ?? "");
  } else {
    const formData = await request.formData();
    user = String(formData.get("user") ?? "");
    password = String(formData.get("password") ?? "");
  }

  const normalizedUser = user.trim();
  const normalizedPassword = password.trim();
  const userOk = normalizedUser === MOCK_USER;
  const passwordOk = normalizedPassword === MOCK_PASSWORD;

  const response: LoginResponse =
    userOk && passwordOk ? { ok: true } : { ok: false, userOk, passwordOk };

  return NextResponse.json(response, {
    status: response.ok ? 200 : 401,
  });
}
