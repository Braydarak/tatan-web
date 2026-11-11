/**
 * Validación de email y teléfono del checkout.
 *
 * Email: formato válido y, además, detecta errores de tipeo en el dominio
 * ("gmial.com", "hotmal.com", "gmail.con", "gmail.com.ar") y sugiere la
 * corrección ("¿Quisiste decir sofia@gmail.com?").
 *
 * Teléfono (Argentina): acepta como lo escribe la gente (+54 9 11…, 011 15…,
 * 11-2345-6789) y verifica que queden 10 números: código de área + número.
 */

const DOMAINS = [
  "gmail.com",
  "hotmail.com",
  "hotmail.com.ar",
  "outlook.com",
  "outlook.com.ar",
  "live.com",
  "live.com.ar",
  "yahoo.com",
  "yahoo.com.ar",
  "icloud.com",
  "me.com",
  "msn.com",
  "fibertel.com.ar",
  "speedy.com.ar",
  "arnet.com.ar",
];

/** Dominios que no existen y su versión correcta */
const FIXES: Record<string, string> = {
  "gmail.com.ar": "gmail.com",
  "icloud.com.ar": "icloud.com",
  "gmail.co": "gmail.com",
  "hotmail.co": "hotmail.com",
};

/** Terminaciones mal escritas → la correcta */
const TLD_FIXES: [RegExp, string][] = [
  [/\.(con|cmo|comm|cpm|xom|vom|om|cm|ocm)$/, ".com"],
  [/\.com\.(ra|ar\.)$/, ".com.ar"],
  [/\.(con|cmo)\.ar$/, ".com.ar"],
];

function distance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      // letras cambiadas de lugar (gmial → gmail) cuentan como un error
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[a.length][b.length];
}

export type EmailCheck = {
  /** Mensaje de error (formato inválido) */
  error?: string;
  /** Email corregido sugerido (el formato es válido pero parece un error de tipeo) */
  suggestion?: string;
};

export function checkEmail(input: string): EmailCheck {
  const email = input.trim().toLowerCase();
  if (!email) return { error: "Ingresá tu email" };
  if (/\s/.test(email)) return { error: "El email no puede tener espacios" };
  const m = email.match(/^([^@]+)@([^@]+)$/);
  if (!m) return { error: email.includes("@") ? "El email tiene más de una @" : "Al email le falta la @" };
  const [, user, domain] = m;
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(user) || user.startsWith(".") || user.endsWith(".") || user.includes("..")) {
    return { error: "Revisá lo que está antes de la @" };
  }
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain) || /(^|\.)-|-(\.|$)/.test(domain)) {
    return { error: "Revisá lo que está después de la @ (por ejemplo gmail.com)" };
  }
  if (DOMAINS.includes(domain)) return {};

  // Errores de tipeo: dominio inexistente conocido, terminación o nombre parecido
  let fixed = FIXES[domain] ?? domain;
  for (const [re, rep] of TLD_FIXES) fixed = fixed.replace(re, rep);
  if (!DOMAINS.includes(fixed)) {
    let best: string | null = null;
    let bestD = Infinity;
    for (const d of DOMAINS) {
      const dd = distance(fixed, d);
      if (dd < bestD) {
        bestD = dd;
        best = d;
      }
    }
    // Hasta 2 letras de diferencia (y no un dominio corto cualquiera)
    if (best && bestD <= 2 && fixed.length >= 6) fixed = best;
  }
  return fixed !== domain && DOMAINS.includes(fixed)
    ? { suggestion: `${user}@${fixed}` }
    : {};
}

export type PhoneCheck = {
  error?: string;
  /** 10 números: código de área + número (sin 0, sin 15) */
  national?: string;
};

export function checkPhoneAR(input: string): PhoneCheck {
  if (/[a-z]/i.test(input)) return { error: "El teléfono solo puede tener números" };
  let d = input.replace(/\D/g, "");
  if (!d) return { error: "Ingresá tu teléfono" };
  // +54 / 54, el 9 de celulares desde el exterior y el 0 de larga distancia
  if (d.startsWith("54") && d.length >= 12) d = d.slice(2);
  if (d.startsWith("9") && d.length === 11) d = d.slice(1);
  if (d.startsWith("0")) d = d.slice(1);
  // El 15 de los celulares después del código de área (2 a 4 números)
  if (d.length === 12) {
    for (const area of [2, 3, 4]) {
      if (d.slice(area, area + 2) === "15") {
        d = d.slice(0, area) + d.slice(area + 2);
        break;
      }
    }
  }
  if (d.length < 10) {
    return { error: "Faltan números: poné el código de área y el número (ej: 11 2345 6789)" };
  }
  if (d.length > 10) {
    return { error: "Sobran números: poné el código de área y el número, sin 0 ni 15" };
  }
  if (/^(\d)\1+$/.test(d)) return { error: "Revisá el teléfono" };
  // Los códigos de área argentinos empiezan con 11, 2 o 3
  if (d.startsWith("15")) {
    return { error: "Falta el código de área (ej: 11 para Buenos Aires, 351 para Córdoba)" };
  }
  if (!/^(11|2|3)/.test(d)) return { error: "Revisá el código de área" };
  return { national: d };
}

export function checkDni(input: string): string | undefined {
  const d = input.replace(/[.\s-]/g, "");
  if (!d) return "Ingresá tu DNI";
  if (!/^\d+$/.test(d)) return "El DNI solo puede tener números";
  if (d.length < 7 || d.length > 8) return "El DNI tiene 7 u 8 números";
  return undefined;
}
