# Subir la web a Ferozo (y dejar Vercel)

La web (Next.js) corre en el **hosting Node de Ferozo**, en el mismo dominio
que la API PHP (`tatankids.com.ar/api/*.php`).

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

Deja **`deploy/tatan-web.zip`** (~20 MB) con todo lo necesario: `server.js`,
`.next`, `public` y `node_modules`. No hay que instalar nada en el servidor.
El script:

- compila en una copia aparte con los paquetes en carpeta plana (sin los
  accesos directos de pnpm, que el administrador de archivos puede romper),
- agrega `sharp` para Linux (el que optimiza las fotos), bajado del
  registro de npm con la firma verificada.

> Las variables `NEXT_PUBLIC_*` quedan **dentro** de la web al compilar: si
> cambiás alguna (p. ej. la Public Key), hay que volver a correr el build y
> subirlo.

## 2. Subirlo

1. En el administrador de archivos de Ferozo, subí `tatan-web.zip` a una
   carpeta **fuera de `public_html`**, por ejemplo `/home/a0190966/tatan-web/`,
   y descomprimilo ahí. Tiene que quedar `/home/a0190966/tatan-web/server.js`.
2. En el panel → **Node.js** (aplicaciones Node), creá una aplicación:
   - **Versión de Node:** 20 o más nueva (Next 16 pide 20.9 como mínimo).
   - **Carpeta de la aplicación:** `/home/a0190966/tatan-web`
   - **URL / dominio:** `tatankids.com.ar` (la raíz)
   - **Archivo de inicio:** `server.js`
   - **Modo:** producción. Variable de entorno: `NODE_ENV=production`.
     El puerto (`PORT`) lo pone el panel; no hace falta nada más.
3. Iniciá (o reiniciá) la aplicación.

## 3. Que `/api` siga yendo a PHP

La web **no usa ninguna dirección bajo `/api`**: todo `/api/*` es de la API
PHP (la purga del caché del CRM está en `/revalidar`). Al apuntar el dominio a
la app de Node hay que revisar que `/api/*.php` siga llegando a PHP:

- Abrí `https://tatankids.com.ar/api/checkout.php?action=version`: tiene que
  responder el JSON con `"mercadoPago":"produccion"`.
- Si en cambio aparece la página "no encontrada" de la tienda, la app de Node
  se está quedando con `/api`. Si el panel usa Passenger (lo más común), se
  arregla creando `public_html/api/.htaccess` con:

  ```apache
  PassengerEnabled off
  ```

  (si el archivo ya existe, agregá esa línea al principio).

## 4. Sacar la página vieja

La página que se ve hoy en `tatankids.com.ar` es un `index.html` estático en
`public_html`. Renombralo (p. ej. `index.html.viejo`) para que no le gane a la
app de Node. **No toques la carpeta `public_html/api`.**

## 5. Comprobar

- [ ] `https://tatankids.com.ar/` muestra la tienda nueva.
- [ ] Las fotos de los productos cargan (si no, avisá: es `sharp`).
- [ ] `https://tatankids.com.ar/api/checkout.php?action=version` → JSON de PHP.
- [ ] `https://tatankids.com.ar/sitemap.xml` y `/robots.txt` responden.
- [ ] Entrar al CRM, cambiar un texto y ver que se actualiza en la tienda.
- [ ] Una compra chica real con Mercado Pago (y devolverla).
- [ ] Una dirección inventada muestra el osito tapándose los ojos.

## 6. Dejar Vercel

Cuando todo lo de arriba funcione en Ferozo:

1. En Vercel → el proyecto → **Settings → Git**: desconectá el repositorio
   (para que no siga compilando con cada cambio), o borrá el proyecto.
2. Si el dominio `tatankids.com.ar` figura en **Settings → Domains** de
   Vercel, sacalo. Los DNS ya apuntan a Ferozo (la API está ahí), así que no
   hay que tocarlos.

## Actualizar la web más adelante

1. `pnpm build:ferozo`
2. Subí el zip nuevo, reemplazá la carpeta `tatan-web` (conservá la carpeta
   `.next/cache` si querés mantener las fotos ya optimizadas).
3. Reiniciá la aplicación en el panel → Node.js.
