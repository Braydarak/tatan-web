import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  getSessionFromCookie,
} from "@/lib/auth";

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const sess = await getSessionFromCookie();
  if (!sess) {
    return NextResponse.json({ authenticated: false, admin: null });
  }
  return NextResponse.json({
    authenticated: true, admin: sess });
}
