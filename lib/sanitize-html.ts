/**
 * Limpia el HTML de la descripción del producto (sale del editor del CRM)
 * para poder mostrarlo con formato sin riesgo: deja solo etiquetas de texto
 * básicas, saca todos los atributos menos href/src seguros, y elimina
 * scripts, estilos, iframes, etc. con su contenido.
 */

const ALLOWED = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "a",
  "img",
  "hr",
]);

const DROP_WITH_CONTENT =
  /<(script|style|iframe|object|embed|noscript|template|svg|math|form|textarea|select|button)\b[\s\S]*?<\/\1\s*>/gi;

function safeUrl(url: string, kind: "href" | "src"): string | null {
  const u = url.trim().replace(/[\u0000-\u001F\u007F\s]+/g, "");
  if (/^(https?:)?\/\//i.test(u) || u.startsWith("/")) return url.trim();
  if (kind === "href" && /^(mailto:|tel:|#)/i.test(u)) return url.trim();
  return null;
}

const escAttr = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return "";
  let html = String(input)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(DROP_WITH_CONTENT, "");

  html = html.replace(
    /<\s*(\/?)\s*([a-zA-Z0-9]+)([^>]*)>/g,
    (_m, slash: string, rawTag: string, attrs: string) => {
      const tag = rawTag.toLowerCase();
      if (!ALLOWED.has(tag)) return "";
      if (slash) return `</${tag}>`;
      if (tag === "a" || tag === "img") {
        const attr = tag === "a" ? "href" : "src";
        const m = attrs.match(
          new RegExp(`\\b${attr}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"),
        );
        const url = m ? safeUrl(m[2] ?? m[3] ?? m[4] ?? "", attr) : null;
        if (tag === "img") {
          if (!url) return "";
          const alt = attrs.match(/\balt\s*=\s*("([^"]*)"|'([^']*)')/i);
          return `<img src="${escAttr(url)}" alt="${escAttr(alt?.[2] ?? alt?.[3] ?? "")}" loading="lazy">`;
        }
        return url
          ? `<a href="${escAttr(url)}" rel="nofollow noopener" target="_blank">`
          : "<a>";
      }
      return `<${tag}>`;
    },
  );
  // Cualquier "<" suelto que quedó se escapa
  return html.replace(/<(?!\/?(?:p|br|strong|b|em|i|u|s|ul|ol|li|h2|h3|h4|blockquote|a|img|hr)\b)/gi, "&lt;");
}

/** ¿La descripción tiene texto real (no solo etiquetas vacías)? */
export function hasText(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length > 0;
}
