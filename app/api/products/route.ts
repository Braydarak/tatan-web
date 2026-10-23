import { NextResponse } from "next/server";
import type { PoolConnection } from "mysql2/promise";
import { query, queryOne } from "@/lib/db";
import { requireCrmAuth } from "@/lib/crm-guard";

/* ================================================================== */
/*  Types                                                             */
/* ================================================================== */

type CategoryRow = { id: number; key: string; label: string };
type SizeRow = { product_id: string; size: string; stock: number };
type GalleryRow = { product_id: string; image_src: string; sort_order: number };
type ColorRow = {
  product_id: string;
  name: string;
  hex: string;
  sort_order: number;
};
type FeatureRow = { product_id: string; feature: string; sort_order: number };
type RelatedRow = {
  product_id: string;
  related_product_id: string;
  sort_order: number;
};

export type ProductPayload = {
  id?: string;
  slug?: string | null;
  name: string;
  tagline?: string | null;
  imageSrc: string;
  category: string; // key de categoría (ej: "body")
  sizeGroup: "bebe" | "ninios";
  sizes: string[];
  stockBySize: Record<string, number>;
  colorHex: string;
  description?: string | null;
  price: number;
  originalPrice?: number | null;
  installments: number;
  taxFreePrice?: number | null;
  showPointsBadge?: boolean;
  rating?: number;
  reviews?: number;
  soldTotal?: number;
  gallery?: string[];
  colorVariants?: { name: string; hex: string }[];
  features?: string[];
  relatedIds?: string[];
  active?: boolean;
};

/* ================================================================== */
/*  Helpers para ensamblar el JSON completo por ID(s)                 */
/* ================================================================== */

async function getCategoriesByKey(): Promise<Record<string, CategoryRow>> {
  const [rows] = await query<CategoryRow[]>(
    `SELECT id, \`key\`, label FROM categories WHERE active = 1`,
  );
  const out: Record<string, CategoryRow> = {};
  for (const r of rows) out[r.key] = r;
  return out;
}

async function fetchJoined(whereSql: string, params: unknown[]) {
  const productsSql = `
    SELECT
      p.id, p.slug, p.name, p.tagline, p.image_src AS imageSrc,
      p.category_id, c.\`key\` AS category_key,
      p.size_group AS sizeGroup, p.color_hex AS colorHex,
      p.description, p.price, p.original_price AS originalPrice,
      p.installments, p.tax_free_price AS taxFreePrice,
      p.show_points_badge AS showPointsBadge, p.rating,
      p.reviews_count AS reviews, p.sold_total AS soldTotal,
      p.active, p.created_at AS createdAt, p.updated_at AS updatedAt
    FROM products p
    JOIN categories c ON c.id = p.category_id
    ${whereSql}
    ORDER BY FIELD(c.\`key\`, 'body','remera','pijama','set','pantalon','buzo','accesorio'),
             p.created_at DESC
  `;

  const [products] = await query<
    Array<{
      id: string;
      slug: string | null;
      name: string;
      tagline: string | null;
      imageSrc: string;
      category_id: number;
      category_key: string;
      sizeGroup: "bebe" | "ninios";
      colorHex: string;
      description: string | null;
      price: string;
      originalPrice: string | null;
      installments: number;
      taxFreePrice: string | null;
      showPointsBadge: number;
      rating: string;
      reviews: number;
      soldTotal: number;
      active: number;
      createdAt: string;
      updatedAt: string;
    }>
  >(productsSql, params);

  if (products.length === 0) return [];
  const ids = products.map((p) => p.id);
  const placeholders = ids.map(() => "?").join(",");

  const [sizes] = await query<SizeRow[]>(
    `SELECT product_id, size, stock FROM product_sizes_stock WHERE product_id IN (${placeholders})`,
    ids,
  );
  const [gallery] = await query<GalleryRow[]>(
    `SELECT product_id, image_src, sort_order FROM product_gallery_images WHERE product_id IN (${placeholders}) ORDER BY sort_order, id`,
    ids,
  );
  const [colors] = await query<ColorRow[]>(
    `SELECT product_id, name, hex, sort_order FROM product_color_variants WHERE product_id IN (${placeholders}) ORDER BY sort_order, id`,
    ids,
  );
  const [features] = await query<FeatureRow[]>(
    `SELECT product_id, feature, sort_order FROM product_features WHERE product_id IN (${placeholders}) ORDER BY sort_order, id`,
    ids,
  );
  const [related] = await query<RelatedRow[]>(
    `SELECT product_id, related_product_id, sort_order FROM product_related WHERE product_id IN (${placeholders}) ORDER BY sort_order`,
    ids,
  );

  const index = <T extends { product_id: string }>(arr: T[]) => {
    const out: Record<string, T[]> = {};
    for (const row of arr) {
      (out[row.product_id] ??= []).push(row);
    }
    return out;
  };
  const sizesByP = index(sizes);
  const galleryByP = index(gallery);
  const colorsByP = index(colors);
  const featuresByP = index(features);
  const relatedByP = index(related);

  return products.map((p) => {
    const sizeArr = sizesByP[p.id] ?? [];
    const stockBySize: Record<string, number> = {};
    for (const s of sizeArr) stockBySize[s.size] = s.stock;

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      tagline: p.tagline,
      imageSrc: p.imageSrc,
      category: p.category_key,
      sizeGroup: p.sizeGroup,
      sizes: sizeArr.map((s) => s.size),
      stockBySize,
      colorHex: p.colorHex,
      description: p.description,
      price: Number(p.price),
      originalPrice: p.originalPrice == null ? null : Number(p.originalPrice),
      installments: p.installments,
      taxFreePrice: p.taxFreePrice == null ? null : Number(p.taxFreePrice),
      showPointsBadge: Boolean(p.showPointsBadge),
      rating: Number(p.rating),
      reviews: p.reviews,
      soldTotal: p.soldTotal,
      active: Boolean(p.active),
      gallery: (galleryByP[p.id] ?? []).map((g) => g.image_src),
      colorVariants: (colorsByP[p.id] ?? []).map((c) => ({
        name: c.name,
        hex: c.hex,
      })),
      features: (featuresByP[p.id] ?? []).map((f) => f.feature),
      relatedIds: (relatedByP[p.id] ?? []).map((r) => r.related_product_id),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  });
}

/* ================================================================== */
/*  Rutas                                                             */
/* ================================================================== */

/**
 * GET /api/products           → lista completa
 * GET /api/products?id=b-001  → uno solo
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const where = id ? `WHERE p.id = ?` : `WHERE p.active = 1`;
  const params = id ? [id] : [];
  const data = await fetchJoined(where, params);
  if (id && data.length === 0) {
    return NextResponse.json(
      { ok: false, error: "NOT_FOUND" },
      { status: 404 },
    );
  }
  return NextResponse.json({
    ok: true,
    count: data.length,
    data: id ? data[0] : data,
  });
}

/**
 * POST /api/products  → crear producto
 * Body: ProductPayload
 * Requiere sesión CRM.
 */
export async function POST(request: Request) {
  const auth = await requireCrmAuth();
  if ("error" in auth) return auth.error;

  let body: ProductPayload;
  try {
    body = (await request.json()) as ProductPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "INVALID_JSON" },
      { status: 400 },
    );
  }

  const cats = await getCategoriesByKey();
  const category = cats[body.category];
  if (!category) {
    return NextResponse.json(
      { ok: false, error: "INVALID_CATEGORY" },
      { status: 400 },
    );
  }

  if (!body.name || !body.imageSrc || !body.price) {
    return NextResponse.json(
      { ok: false, error: "MISSING_FIELDS" },
      { status: 400 },
    );
  }

  const id = (body.id && body.id.trim()) || generateId(body.category);

  const exists = await queryOne<{ c: number }>(
    `SELECT COUNT(*) AS c FROM products WHERE id = ?`,
    [id],
  );
  if (exists && exists.c > 0) {
    return NextResponse.json(
      { ok: false, error: "DUPLICATE_ID", id },
      { status: 409 },
    );
  }

  const conn = await (await import("@/lib/db")).pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO products (
        id, slug, name, tagline, image_src, category_id, size_group, color_hex,
        description, price, original_price, installments, tax_free_price,
        show_points_badge, rating, reviews_count, sold_total, active
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        body.slug && body.slug.trim().length ? body.slug.trim() : null,
        body.name,
        body.tagline ?? null,
        body.imageSrc,
        category.id,
        body.sizeGroup,
        body.colorHex,
        body.description ?? null,
        Number(body.price),
        body.originalPrice ?? null,
        Number(body.installments ?? 1),
        body.taxFreePrice ?? null,
        body.showPointsBadge ? 1 : 0,
        Number(body.rating ?? 5),
        Number(body.reviews ?? 0),
        Number(body.soldTotal ?? 0),
        body.active !== false ? 1 : 0,
      ],
    );

    await insertChildRows(conn, id, body);

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  const [created] = await fetchJoined(`WHERE p.id = ?`, [id]);
  return NextResponse.json({ ok: true, data: created }, { status: 201 });
}

/**
 * PUT /api/products?id=b-001  → actualizar completo
 */
export async function PUT(request: Request) {
  const auth = await requireCrmAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "MISSING_ID" },
      { status: 400 },
    );
  }

  let body: ProductPayload;
  try {
    body = (await request.json()) as ProductPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "INVALID_JSON" },
      { status: 400 },
    );
  }

  const cats = await getCategoriesByKey();
  const category = cats[body.category];
  if (!category) {
    return NextResponse.json(
      { ok: false, error: "INVALID_CATEGORY" },
      { status: 400 },
    );
  }

  const exists = await queryOne<{ c: number }>(
    `SELECT COUNT(*) AS c FROM products WHERE id = ?`,
    [id],
  );
  if (!exists || exists.c === 0) {
    return NextResponse.json(
      { ok: false, error: "NOT_FOUND" },
      { status: 404 },
    );
  }

  const conn = await (await import("@/lib/db")).pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE products SET
        slug=?, name=?, tagline=?, image_src=?, category_id=?, size_group=?,
        color_hex=?, description=?, price=?, original_price=?, installments=?,
        tax_free_price=?, show_points_badge=?, rating=?, reviews_count=?,
        sold_total=?, active=?, updated_at=NOW()
      WHERE id=?`,
      [
        body.slug && body.slug.trim().length ? body.slug.trim() : null,
        body.name,
        body.tagline ?? null,
        body.imageSrc,
        category.id,
        body.sizeGroup,
        body.colorHex,
        body.description ?? null,
        Number(body.price),
        body.originalPrice ?? null,
        Number(body.installments ?? 1),
        body.taxFreePrice ?? null,
        body.showPointsBadge ? 1 : 0,
        Number(body.rating ?? 5),
        Number(body.reviews ?? 0),
        Number(body.soldTotal ?? 0),
        body.active !== false ? 1 : 0,
        id,
      ],
    );

    await conn.query(`DELETE FROM product_sizes_stock WHERE product_id = ?`, [
      id,
    ]);
    await conn.query(
      `DELETE FROM product_gallery_images WHERE product_id = ?`,
      [id],
    );
    await conn.query(
      `DELETE FROM product_color_variants WHERE product_id = ?`,
      [id],
    );
    await conn.query(`DELETE FROM product_features WHERE product_id = ?`, [id]);
    await conn.query(`DELETE FROM product_related WHERE product_id = ?`, [id]);

    await insertChildRows(conn, id, body);

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  const [updated] = await fetchJoined(`WHERE p.id = ?`, [id]);
  return NextResponse.json({ ok: true, data: updated });
}

/**
 * DELETE /api/products?id=b-001
 */
export async function DELETE(request: Request) {
  const auth = await requireCrmAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "MISSING_ID" },
      { status: 400 },
    );
  }

  const exists = await queryOne<{ c: number }>(
    `SELECT COUNT(*) AS c FROM products WHERE id = ?`,
    [id],
  );
  if (!exists || exists.c === 0) {
    return NextResponse.json(
      { ok: false, error: "NOT_FOUND" },
      { status: 404 },
    );
  }

  await query(`DELETE FROM products WHERE id = ?`, [id]);
  return NextResponse.json({ ok: true, id });
}

/* ================================================================== */
/*  Helpers internos                                                  */
/* ================================================================== */

function generateId(categoryKey: string): string {
  const prefix = categoryKey[0] ?? "p";
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${rand}`;
}

async function insertChildRows(
  conn: PoolConnection,
  id: string,
  body: ProductPayload,
) {
  const sizes = body.sizes ?? [];
  const stockBy = body.stockBySize ?? {};
  if (sizes.length) {
    await conn.query(
      `INSERT INTO product_sizes_stock (product_id, size, stock) VALUES ` +
        sizes.map(() => "(?,?,?)").join(","),
      sizes.flatMap((s) => [id, s, Number(stockBy[s] ?? 0)]),
    );
  }

  const gallery = body.gallery ?? [];
  if (gallery.length) {
    await conn.query(
      `INSERT INTO product_gallery_images (product_id, image_src, sort_order) VALUES ` +
        gallery.map(() => "(?,?,?)").join(","),
      gallery.flatMap((src, i) => [id, src, i]),
    );
  }

  const colors = body.colorVariants ?? [];
  if (colors.length) {
    await conn.query(
      `INSERT INTO product_color_variants (product_id, name, hex, sort_order) VALUES ` +
        colors.map(() => "(?,?,?,?)").join(","),
      colors.flatMap((c, i) => [id, c.name, c.hex, i]),
    );
  }

  const features = body.features ?? [];
  if (features.length) {
    await conn.query(
      `INSERT INTO product_features (product_id, feature, sort_order) VALUES ` +
        features.map(() => "(?,?,?)").join(","),
      features.flatMap((f, i) => [id, f, i]),
    );
  }

  const related = body.relatedIds ?? [];
  if (related.length) {
    await conn.query(
      `INSERT IGNORE INTO product_related (product_id, related_product_id, sort_order) VALUES ` +
        related.map(() => "(?,?,?)").join(","),
      related.flatMap((r, i) => [id, r, i]),
    );
  }
}
