/**
 * URL de un producto en la tienda: /product/<nombre-del-producto>.
 *
 * El nombre se pasa a minúsculas, sin acentos y con guiones
 * ("Body manga larga alg pima" → "body-manga-larga-alg-pima"). Los links
 * viejos con el ID (/product/b-001) siguen funcionando: la página redirige
 * a la URL con el nombre.
 *
 * La API PHP no deja guardar dos productos que den la misma URL
 * (ver name_url_taken en php-api/products.php, misma regla que acá).
 */

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // acentos y diéresis (ñ → n)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function productSlug(p: { id: string; name?: string | null }): string {
  return slugify(p.name ?? "") || p.id;
}

export function productHref(p: { id: string; name?: string | null }): string {
  return `/product/${productSlug(p)}`;
}
