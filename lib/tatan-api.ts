/**
 * ============================================================
 *  TATAN — Cliente para la API PHP real alojada en Ferozo.
 * ============================================================
 *
 *  La API PHP corre en tatankids.com.ar/api/*.php  (con `localhost`
 *  de MySQL, por lo que funciona sin acceso remoto).
 *
 *  IMPORTANTE — desde el NAVEGADOR nunca llamamos al dominio de Ferozo:
 *  usamos el proxy same-origin `/api/php/*` definido en next.config.ts.
 *  Así no hay CORS y la cookie de sesión del CRM (TATANCRMSESSID) es
 *  first-party (Safari/Brave no la bloquean).
 *
 *  Desde el SERVIDOR (SSR/RSC/build) el fetch va directo y absoluto a la
 *  API PHP, que no está sujeto a CORS porque no lo aplica un navegador.
 */

const DEFAULT_BASE_URL = "https://tatankids.com.ar/api";
/** Ruta del proxy same-origin (ver `rewrites` en next.config.ts). */
const PROXY_PATH = "/api/php";

export function apiBaseUrl(): string {
  // Navegador → proxy same-origin. Se ignora NEXT_PUBLIC_API_BASE_URL a
  // propósito: apuntar directo a Ferozo reintroduciría CORS y cookies de terceros.
  if (typeof window !== "undefined") {
    // En un subdominio de tatankids.com.ar (develop., www., …) la API es
    // del mismo sitio: se llama directo y la cookie de sesión es first-party.
    // Así se evitan el firewall de Vercel y el anti-bot del hosting.
    const host = window.location.hostname;
    if (host === "tatankids.com.ar" || host.endsWith(".tatankids.com.ar")) {
      return DEFAULT_BASE_URL;
    }
    return PROXY_PATH;
  }
  // Servidor → URL absoluta directa a la API PHP.
  const fromEnv =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.TATAN_API_BASE_URL ??
    "";
  if (fromEnv) return fromEnv.replace(/\/$/, "");
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

/** Error de la API con el status HTTP y el payload devuelto por el servidor. */
export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/** Reintentos ante la página "One moment, please…" del anti-bot del hosting. */
const CHALLENGE_RETRIES = 4;

function isHostingChallenge(res: Response, text: string): boolean {
  const ct = res.headers.get("content-type") ?? "";
  return ct.includes("text/html") && text.includes("One moment, please");
}

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
  let text = "";
  for (let attempt = 1; ; attempt++) {
    try {
      res = await fetch(url, init);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      throw new Error(
        `[tatan-api] No se pudo conectar a ${url}: ${msg}. Verificá que el dominio esté online y que apiBaseUrl sea correcta.`,
      );
    }

    if (opts.raw) return res as unknown as T;

    // Firewall de Vercel: un fetch no puede resolver el desafío, reintentar no sirve.
    if (res.headers.get("x-vercel-mitigated")) {
      throw new ApiError(
        `[tatan-api ${res.status}] ${endpoint} · Bloqueado por el firewall de Vercel (Security Checkpoint)`,
        res.status,
        null,
      );
    }

    text = await res.text();

    // Anti-bot del hosting: devuelve una página HTML antes de ejecutar el PHP,
    // así que reintentar es seguro también para POST/PUT/DELETE.
    if (!isHostingChallenge(res, text)) break;
    if (attempt >= CHALLENGE_RETRIES) {
      throw new ApiError(
        `[tatan-api] ${endpoint} · El anti-bot del hosting bloqueó la petición`,
        res.status,
        null,
      );
    }
    await new Promise((r) => setTimeout(r, 400 * attempt));
  }

  let data: unknown;
  try {
    data = text.length ? JSON.parse(text) : null;
  } catch {
    data = { _rawText: text };
  }

  if (!res.ok) {
    const obj =
      data && typeof data === "object" && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : null;
    const serverMsg =
      typeof obj?.message === "string"
        ? obj.message
        : typeof obj?.error === "string"
          ? obj.error
          : "";
    const msg = serverMsg || `HTTP ${res.status}`;
    throw new ApiError(
      `[tatan-api ${res.status}] ${endpoint} · ${msg}`,
      res.status,
      data,
    );
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
  category:
    | "body"
    | "remera"
    | "pijama"
    | "set"
    | "pantalon"
    | "buzo"
    | "accesorio";
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

export async function apiLogin(
  user: string,
  password: string,
): Promise<LoginResult> {
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
    return {
      ok: false,
      error: e instanceof Error ? e.message : "login failed",
    };
  }
}

export async function apiSession(): Promise<{
  authenticated: boolean;
  admin: AdminUser | null;
}> {
  return apiFetch<{ authenticated: boolean; admin: AdminUser | null }>(
    "crm-session.php",
  );
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
  const r = await apiFetch<{ ok: boolean; count: number; data: Product[] }>(
    "products.php",
  );
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

export async function apiProductSave(
  payload: Partial<Product> & {
    name: string;
    imageSrc: string;
    category: string;
  },
): Promise<{
  ok: boolean;
  error?: string;
  data?: Product;
  id?: string;
}> {
  const method = payload.id ? "PUT" : "POST";
  const query = payload.id ? { id: payload.id } : undefined;
  try {
    return await apiFetch<{
      ok: boolean;
      error?: string;
      data?: Product;
      id?: string;
    }>("products.php", {
      method,
      query,
      body: payload,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "save failed" };
  }
}

/**
 * Sube una imagen a la API PHP (requiere sesión CRM) y devuelve su URL pública.
 * Lanza Error con el mensaje del servidor si falla.
 */
export async function apiUploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const r = await apiFetch<{ ok: boolean; url?: string }>("upload.php", {
    method: "POST",
    body: form,
  });
  if (!r.ok || !r.url) throw new Error("No se pudo subir la imagen");
  return r.url;
}

export async function apiProductDelete(id: string): Promise<boolean> {
  try {
    await apiFetch<{ ok: boolean }>("products.php", {
      method: "DELETE",
      query: { id },
    });
    return true;
  } catch {
    return false;
  }
}

export type SiteContentKey = "home_hero" | "envios";

export async function apiSiteContent<T = unknown>(
  key: SiteContentKey,
): Promise<{
  ok: boolean;
  key?: string;
  data?: T;
  version?: number;
  updatedAt?: string;
  error?: string;
}> {
  try {
    return await apiFetch<{
      ok: boolean;
      key?: string;
      data?: T;
      version?: number;
      updatedAt?: string;
      error?: string;
    }>("site-content.php", { query: { key } });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "site-content failed",
    };
  }
}

export async function apiSiteContentSave<T = unknown>(
  key: SiteContentKey,
  data: T,
): Promise<{
  ok: boolean;
  data?: T;
  version?: number;
  updatedAt?: string;
  error?: string;
}> {
  try {
    return await apiFetch<{
      ok: boolean;
      data?: T;
      version?: number;
      updatedAt?: string;
      error?: string;
    }>("site-content.php", {
      method: "PUT",
      query: { key },
      body: { data },
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "save failed" };
  }
}

/** Tags de caché ISR del sitio que el CRM puede purgar on-demand. */
export type RevalidateTag =
  | "tatan-site-content"
  | "tatan-products"
  | "tatan-product-detail"
  | "tatan-home-products";

/**
 * Pide a Next que purgue el caché ISR de un tag.
 * Best-effort: si falla, queda el `revalidate` periódico como respaldo.
 */
export async function apiRevalidateTag(tag: RevalidateTag): Promise<void> {
  try {
    await fetch(`/api/revalidate?tag=${encodeURIComponent(tag)}`, {
      method: "POST",
      credentials: "same-origin",
    });
  } catch {
    /* ignore */
  }
}

export async function apiContactSubmit(payload: {
  name: string;
  email: string;
  phone?: string;
  reason?: "general" | "pedido" | "cambios" | "mayorista" | "otro";
  message: string;
}): Promise<{
  ok: boolean;
  id?: number;
  receivedAt?: string;
  errors?: string[];
}> {
  try {
    return await apiFetch<{
      ok: boolean;
      id?: number;
      receivedAt?: string;
      errors?: string[];
    }>("contact.php", {
      method: "POST",
      body: payload,
      credentials: "same-origin",
    });
  } catch (e) {
    const d = e instanceof ApiError ? e.data : null;
    if (d && typeof d === "object" && !Array.isArray(d)) {
      const errors = (d as { errors?: unknown }).errors;
      if (Array.isArray(errors))
        return { ok: false, errors: errors as string[] };
    }
    return { ok: false, errors: ["UNKNOWN"] };
  }
}
