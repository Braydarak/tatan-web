/**
 * ============================================================
 *  TATAN — Cliente para la API PHP real alojada en Ferozo.
 * ============================================================
 *
 *  La API PHP corre en tatankids.com.ar/api/*.php  (con `localhost`
 *  de MySQL, por lo que funciona sin acceso remoto).
 *  Desde Next.js local o producción, usamos HTTPS a ese dominio,
 *  con `credentials: 'include'` para que la cookie PHP httpOnly
 *  (TATANCRMSESSID) se envíe y persista la sesión del CRM.
 *
 *  Si la URL base no está definida o falla, se puede hacer fallback
 *  a los endpoints Next internos, pero en producción se usa siempre la PHP.
 */

const DEFAULT_BASE_URL = "https://tatankids.com.ar/api";

export function apiBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.TATAN_API_BASE_URL ??
    "";
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  // Si estamos corriendo EN EL MISMO dominio (producción Node o static HTML),
  // usamos ruta relativa para evitar CORS.
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "tatankids.com.ar" || host === "www.tatankids.com.ar") {
      return "/api";
    }
  }
  return DEFAULT_BASE_URL;
}

function toQuery(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    sp.append(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
  /** Si es false, no envía credenciales (para endpoints públicos en navegadores anti-tracking) */
  credentials?: RequestCredentials;
  /** Si es true, devuelve la Response raw para manejo custom */
  raw?: boolean;
};

export async function apiFetch<T = unknown>(
  endpoint: string,
  opts: ApiOptions = {},
): Promise<T> {
  const method = opts.method ?? "GET";
  const base = apiBaseUrl();
  const ep = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  const url = `${base}/${ep}${toQuery(opts.query ?? {})}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.headers ?? {}),
  };

  const init: RequestInit = {
    method,
    headers,
    credentials: opts.credentials ?? "include",
    redirect: "follow",
  };

  if (opts.body !== undefined && method !== "GET") {
    if (opts.body instanceof FormData) {
      init.body = opts.body;
    } else {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(opts.body);
    }
  }

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    throw new Error(
      `[tatan-api] No se pudo conectar a ${url}: ${msg}. Verificá que el dominio esté online y que apiBaseUrl sea correcta.`,
    );
  }

  if (opts.raw) return res as unknown as T;

  const text = await res.text();
  let data: unknown;
  try {
    data = text.length ? JSON.parse(text) : null;
  } catch {
    data = { _rawText: text };
  }

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && !Array.isArray(data)
        ? String((data as any).message || (data as any).error || "")
        : "") ||
      `HTTP ${res.status}`;
    const err = new Error(`[tatan-api ${res.status}] ${endpoint} · ${msg}`);
    (err as any).status = res.status;
    (err as any).data = data;
    throw err;
  }

  return data as T;
}

/* ================================================================
 *  Endpoints tipados helpers (syntactic sugar)
 * ============================================================== */

export type Product = {
  id: string;
  slug: string | null;
  name: string;
  tagline: string | null;
  imageSrc: string;
  category: "body" | "remera" | "pijama" | "set" | "pantalon" | "buzo" | "accesorio";
  sizeGroup: "bebe" | "ninios";
  sizes: string[];
  stockBySize: Record<string, number>;
  colorHex: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  installments: number;
  taxFreePrice: number | null;
  showPointsBadge: boolean;
  rating: number;
  reviews: number;
  soldTotal: number;
  active: boolean;
  gallery: string[];
  colorVariants: { name: string; hex: string }[];
  features: string[];
  relatedIds: string[];
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminUser = {
  id?: number;
  username: string;
  name: string | null;
  email: string | null;
  role: "owner" | "admin" | "editor";
};

export type LoginResult =
  | { ok: true; admin: AdminUser }
  | { ok: false; userOk?: boolean; passwordOk?: boolean; error?: string };

export async function apiLogin(user: string, password: string): Promise<LoginResult> {
  try {
    const r = await apiFetch<{
      ok: boolean;
      admin?: AdminUser;
      userOk?: boolean;
      passwordOk?: boolean;
    }>("crm-login.php", {
      method: "POST",
      body: { user, password },
    });
    if (r.ok && r.admin) return { ok: true, admin: r.admin };
    return { ok: false, userOk: r.userOk, passwordOk: r.passwordOk };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "login failed" };
  }
}

export async function apiSession(): Promise<{
  authenticated: boolean;
  admin: AdminUser | null;
}> {
  return apiFetch<{ authenticated: boolean; admin: AdminUser | null }>("crm-session.php");
}

export async function apiLogout(): Promise<boolean> {
  try {
    await apiFetch<{ ok: boolean }>("crm-session.php", { method: "POST" });
    return true;
  } catch {
    return false;
  }
}

export async function apiProducts(): Promise<Product[]> {
  const r = await apiFetch<{ ok: boolean; count: number; data: Product[] }>("products.php");
  return r.data ?? [];
}

export async function apiProduct(id: string): Promise<Product | null> {
  try {
    const r = await apiFetch<{ ok: boolean; data: Product }>("products.php", {
      query: { id },
    });
    return r.ok ? r.data : null;
  } catch {
    return null;
  }
}

export async function apiProductSave(payload: Partial<Product> & { name: string; imageSrc: string; category: string }): Promise<{
  ok: boolean;
  error?: string;
  data?: Product;
  id?: string;
}> {
  const method = payload.id ? "PUT" : "POST";
  const query = payload.id ? { id: payload.id } : undefined;
  try {
    return await apiFetch<any>("products.php", { method, query, body: payload });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "save failed" };
  }
}

export async function apiProductDelete(id: string): Promise<boolean> {
  try {
    await apiFetch<any>("products.php", { method: "DELETE", query: { id } });
    return true;
  } catch {
    return false;
  }
}

export type SiteContentKey = "home_hero" | "envios";

export async function apiSiteContent<T = unknown>(key: SiteContentKey): Promise<{
  ok: boolean;
  key?: string;
  data?: T;
  version?: number;
  updatedAt?: string;
  error?: string;
}> {
  try {
    return await apiFetch<any>("site-content.php", { query: { key } });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "site-content failed" };
  }
}

export async function apiSiteContentSave<T = unknown>(key: SiteContentKey, data: T): Promise<{
  ok: boolean;
  data?: T;
  version?: number;
  updatedAt?: string;
  error?: string;
}> {
  try {
    return await apiFetch<any>("site-content.php", {
      method: "PUT",
      query: { key },
      body: { data },
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "save failed" };
  }
}

export async function apiContactSubmit(payload: {
  name: string;
  email: string;
  phone?: string;
  reason?: "general" | "pedido" | "cambios" | "mayorista" | "otro";
  message: string;
}): Promise<{ ok: boolean; id?: number; receivedAt?: string; errors?: string[] }> {
  try {
    return await apiFetch<any>("contact.php", { method: "POST", body: payload, credentials: "same-origin" });
  } catch (e) {
    const d = (e as any).data;
    if (d && Array.isArray(d.errors)) return { ok: false, errors: d.errors as string[] };
    return { ok: false, errors: ["UNKNOWN"] };
  }
}
