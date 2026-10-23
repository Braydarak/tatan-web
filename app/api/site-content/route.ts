import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { requireCrmAuth } from "@/lib/crm-guard";

type ValidKey = "home_hero" | "envios" | string;
const VALID_KEYS = new Set<string>(["home_hero", "envios"]);

/* ---------------------------------------------------------------- */
/*  GET /api/site-content?key=home_hero                              */
/*  GET /api/site-content  (todas)                                   */
/* ---------------------------------------------------------------- */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (key) {
    if (!VALID_KEYS.has(key)) {
      return NextResponse.json(
        { ok: false, error: "INVALID_KEY" },
        { status: 400 },
      );
    }
    const row = await queryOne<{
      content_key: string;
      data: string;
      version: number;
      updated_at: string;
    }>(
      `SELECT content_key, data, version, updated_at FROM site_content WHERE content_key = ?`,
      [key],
    );
    if (!row) {
      return NextResponse.json(
        { ok: false, error: "NOT_FOUND" },
        { status: 404 },
      );
    }
    return NextResponse.json({
      ok: true,
      key,
      data: parseJSON(row.data),
      version: row.version,
      updatedAt: row.updated_at,
    });
  }

  const [rows] = await query<
    Array<{ content_key: string; data: string; version: number; updated_at: string }>
  >(`SELECT content_key, data, version, updated_at FROM site_content`);

  const byKey: Record<string, unknown> = {};
  for (const r of rows) {
    byKey[r.content_key] = {
      data: parseJSON(r.data),
      version: r.version,
      updatedAt: r.updated_at,
    };
  }
  return NextResponse.json({ ok: true, count: rows.length, byKey });
}

/* ---------------------------------------------------------------- */
/*  PUT /api/site-content?key=home_hero   (guarda / versiona)       */
/* ---------------------------------------------------------------- */
export async function PUT(request: Request) {
  const auth = await requireCrmAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (!key || !VALID_KEYS.has(key)) {
    return NextResponse.json(
      { ok: false, error: "INVALID_KEY" },
      { status: 400 },
    );
  }

  let data: unknown;
  try {
    const raw = await request.json();
    data = raw.data !== undefined ? raw.data : raw; // acepta {data} o el data directo
    JSON.stringify(data);
  } catch {
    return NextResponse.json(
      { ok: false, error: "INVALID_JSON" },
      { status: 400 },
    );
  }

  const jsonData = JSON.stringify(data);

  const exists = await queryOne<{ v: number }>(
    `SELECT version AS v FROM site_content WHERE content_key = ?`,
    [key],
  );

  if (!exists) {
    await query(
      `INSERT INTO site_content (content_key, data, version, updated_by) VALUES (?, ?, 1, ?)`,
      [key, jsonData, auth.session.id],
    );
  } else {
    await query(
      `UPDATE site_content SET data=?, version=version+1, updated_by=?, updated_at=NOW() WHERE content_key=?`,
      [jsonData, auth.session.id, key],
    );
  }

  const row = await queryOne<{
    data: string;
    version: number;
    updated_at: string;
  }>(
    `SELECT data, version, updated_at FROM site_content WHERE content_key=?`,
    [key],
  );

  return NextResponse.json({
    ok: true,
    key,
    data: row ? parseJSON(row.data) : null,
    version: row?.version ?? null,
    updatedAt: row?.updated_at ?? null,
  });
}

/* ---------------------------------------------------------------- */
function parseJSON(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}
