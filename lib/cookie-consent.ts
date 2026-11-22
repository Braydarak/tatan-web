/**
 * Preferencias de cookies del visitante (lo que eligió en el aviso).
 *
 * Se guardan en el navegador y valen 12 meses; después se vuelve a
 * preguntar. Las categorías opcionales (estadísticas y marketing) hoy no se
 * usan: si en el futuro se suma, por ejemplo, Google Analytics o el píxel
 * de Meta, se cargan solo si `getCookieConsent()?.analytics` (o
 * `.marketing`) es true, y escuchando el evento CONSENT_EVENT para
 * activarlas cuando el visitante las acepte.
 */

export type CookieConsent = {
  /** Necesarias: siempre true (carrito, checkout, seguridad del pago) */
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  /** Cuándo eligió (ISO) */
  at: string;
  v: 1;
};

const KEY = "tatan:cookies";
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

/** Se dispara al guardar una elección (detail: CookieConsent) */
export const CONSENT_EVENT = "tatan:cookie-consent";
/** Para abrir el aviso de nuevo (p. ej. desde "Configurar cookies") */
export const OPEN_SETTINGS_EVENT = "tatan:cookie-settings";

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as CookieConsent;
    if (c?.v !== 1 || !c.at || Date.now() - Date.parse(c.at) > MAX_AGE_MS) return null;
    return c;
  } catch {
    return null;
  }
}

export function saveCookieConsent(choice: { analytics: boolean; marketing: boolean }): CookieConsent {
  const c: CookieConsent = { necessary: true, ...choice, at: new Date().toISOString(), v: 1 };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* modo privado sin almacenamiento: se vuelve a preguntar la próxima vez */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: c }));
  return c;
}

export function openCookieSettings(): void {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}
