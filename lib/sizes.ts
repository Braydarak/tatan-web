/**
 * Talles de bebé y su referencia (lo que significa cada número).
 * Los de niños son la edad en años y no necesitan referencia.
 */
export const BABY_SIZES: { label: string; hint: string }[] = [
  { label: "0", hint: "Recién nacido (3,5 a 4,5 kg)" },
  { label: "1", hint: "1 a 3 meses" },
  { label: "2", hint: "3 a 6 meses" },
  { label: "3", hint: "6 a 9 meses" },
  { label: "4", hint: "9 a 12 meses" },
];

/** Referencia de un talle (solo bebé), p. ej. "2" → "3 a 6 meses". */
export function sizeHint(
  sizeGroup: string | undefined | null,
  label: string,
): string | undefined {
  if (sizeGroup !== "bebe") return undefined;
  return BABY_SIZES.find((s) => s.label === label.trim())?.hint;
}
