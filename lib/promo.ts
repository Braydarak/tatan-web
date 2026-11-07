/** Fin de la promo: último segundo del día elegido, hora de Argentina. */
export function promoEndsAtMs(endsAt: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endsAt)) return null;
  const t = Date.parse(`${endsAt}T23:59:59-03:00`);
  return Number.isFinite(t) ? t : null;
}

/** La promo sigue vigente (sin fecha de fin = siempre). */
export function isPromoOpen(endsAt: string, now = Date.now()): boolean {
  const end = promoEndsAtMs(endsAt);
  return end === null || end > now;
}
