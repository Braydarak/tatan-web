# Subir la web a Ferozo (archivos estáticos, sin Node)

Ferozo no tiene Node: la web se sube como **archivos estáticos** (HTML, JS,
CSS) a `public_html`, junto a la API PHP que ya está en `public_html/api`.
Igual que la web de Nuria.

## Cómo funciona

- `pnpm build` genera la carpeta **`out/`**: una página HTML por cada ruta
  (home, catálogo, cada categoría, cada producto, envíos, contacto…), ya
  armada con los datos de la base **del momento del build**. Eso es lo que
  lee Google.
- Al abrir cualquier página, el navegador vuelve a pedir los datos a la API
  PHP (`/api/products.php`, `/api/categories.php`, `/api/site-content.php`)
  y la página se actualiza sola: **los cambios del CRM (precios, stock,
  textos, productos nuevos) se ven al instante, sin recompilar.**
- Las fotos subidas las achica `/api/img.php` al tamaño justo (WebP).
- `public_html/.htaccess` (sale del build) da las URLs sin `.html`, las
  redirecciones de links viejos y la página 404.

### ¿Cuándo hay que recompilar?

Solo para que **Google** vea lo último (la tienda ya lo muestra en vivo):

- **Productos nuevos:** mientras no se recompile, se ven en
  `/producto?s=nombre` (el `.htaccess` manda ahí sus links). Después del
  build tienen su página propia, con título y datos para Google.
- **Categorías nuevas:** se ven como `/productos?c=clave` hasta el build.
- Cambios de precio o de nombre: el HTML que lee Google se actualiza en el
  próximo build.

Recomendado: recompilar y subir **cuando cargás productos nuevos**, o una
vez por semana.

## 1. Armar el build (en tu compu)

Necesitás `.env.production.local` en la raíz del proyecto (no está en git):

```bash
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-…   # Public Key de PRODUCCIÓN de Mercado Pago
NEXT_PUBLIC_PAYMENTS_DEMO=            # vacío = cobra de verdad
NEXT_PUBLIC_SITE_URL=https://tatankids.com.ar
```

Después:

```bash
pnpm build:ferozo
```

Deja **`deploy/tatan-web.zip`** (el contenido de `out/`, con el `.htaccess`).

## 2. La primera vez: preparar `public_html`

1. **Subí `php-api/img.php` a `public_html/api/img.php`** (achica las fotos).
   Sin este archivo las fotos de la tienda no se ven.
2. **Sacá la página vieja** de `public_html` (movela a una carpeta de
   respaldo fuera de `public_html`, no la borres): `index.html`,
   `styles.css`, `robots.txt`, `sitemap.xml`, `favicon.svg`,
   `TATAN-LOGO.svg`, `tatanLogo.png` y el `.htaccess` viejo (mirá antes qué
   tiene).
3. **No toques:** `api/` (la API, `secrets.php` y las fotos en
   `api/uploads/`), `.well-known/` (certificado HTTPS) ni `cgi-bin/`.

## 3. Subir

1. En el administrador de archivos, subí `tatan-web.zip` a `public_html` y
   descomprimilo **ahí mismo** (tiene que quedar `public_html/index.html`,
   `public_html/_next/`, `public_html/.htaccess`…).
2. Borrá el zip.

Para actualizar más adelante: `pnpm build:ferozo` y repetir el paso 3. Antes
de descomprimir conviene borrar la carpeta `public_html/_next` vieja (los
archivos viejos no molestan, pero ocupan lugar). **Nunca** borres `api/`.

## 4. Comprobar

- [ ] `https://tatankids.com.ar/` muestra la tienda.
- [ ] Las fotos de los productos cargan (si no: falta `api/img.php`).
- [ ] `https://tatankids.com.ar/api/checkout.php?action=version` → JSON
      con `"mercadoPago":"produccion"`.
- [ ] `/productos/body`, `/bebes`, `/product/body-manga-larga` abren.
- [ ] `/productos?c=body` redirige a `/productos/body`.
- [ ] Una dirección inventada muestra el osito tapándose los ojos.
- [ ] Cambiar un precio en el CRM y verlo en la tienda al recargar.
- [ ] Una compra chica real con Mercado Pago (y devolverla).

## 5. Dejar Vercel

Cuando todo funcione en Ferozo: en Vercel → el proyecto → **Settings → Git**
desconectá el repositorio (o borrá el proyecto), y si el dominio figura en
**Settings → Domains**, sacalo. Los DNS ya apuntan a Ferozo.
