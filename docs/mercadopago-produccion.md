# Mercado Pago en producción (todo en Ferozo)

Cómo pasar el cobro con Mercado Pago de prueba a producción con la web y la
API PHP en Ferozo.

> **El repositorio es público.** Ninguna credencial va en git. El Access
> Token va solo en `/api/secrets.php` del servidor y la Public Key en
> `.env.production.local` (los dos están en `.gitignore`).

## Qué credencial va dónde

| Credencial (Mercado Pago → Tus integraciones → Credenciales de producción) | Dónde va | ¿Secreta? |
| --- | --- | --- |
| **Access Token** (`APP_USR-…` largo) | `MP_ACCESS_TOKEN` en `/api/secrets.php` (Ferozo) | **Sí** |
| **Public Key** (`APP_USR-…` corto) | `NEXT_PUBLIC_MP_PUBLIC_KEY` en `.env.production.local` (web) | No (va en el navegador) |
| Clave secreta del webhook | `MP_WEBHOOK_SECRET` en `/api/secrets.php` | **Sí** |
| Client ID / Client Secret | No se usan en esta integración | Sí (guardarlas igual) |

## 1. API PHP (`/api` en Ferozo)

1. Subir los archivos que cambiaron de `php-api/`: `checkout.php` y
   `mercadopago.php`.
2. Editar **en el servidor** `/api/secrets.php` y cambiar solo estas líneas
   (no reemplazar el archivo entero: tiene también las claves de Enviopack):

   ```php
   define('MP_ACCESS_TOKEN', 'APP_USR-…');   // Access Token de producción
   define('SITE_URL', 'https://tatankids.com.ar');
   ```

## 2. Webhook (avisos de pago)

Mercado Pago → Tus integraciones → (la aplicación) → **Webhooks → Modo
productivo**:

- URL: `https://tatankids.com.ar/api/mp-webhook.php`
- Evento: **Order (Mercado Pago)**

Al guardar, Mercado Pago muestra una **clave secreta**: pegarla en
`/api/secrets.php`:

```php
define('MP_WEBHOOK_SECRET', '…');
```

Sin el webhook, los pagos con tarjeta igual se confirman al instante, pero los
pagos en efectivo (Rapipago / Pago Fácil) quedan "pendientes" hasta que el
comprador abre la página del pedido.

## 3. Web (Next.js en el hosting Node de Ferozo)

En la carpeta de la app en el servidor, crear `.env.production.local` (hay un
ejemplo con estos nombres en la copia local, que no se sube a git):

```bash
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-…   # Public Key de producción
NEXT_PUBLIC_PAYMENTS_DEMO=            # vacío = cobra de verdad
NEXT_PUBLIC_SITE_URL=https://tatankids.com.ar
```

Después **volver a compilar** (`pnpm build`) y reiniciar la app: Next mete la
Public Key en la web al compilar, así que cambiarla sin compilar no tiene
efecto.

## 4. Comprobar antes de vender

1. Abrir `https://tatankids.com.ar/api/checkout.php?action=version`. Tiene que
   decir:
   - `"mercadoPago": "produccion"` (si dice `"prueba"` quedó el token de
     prueba; si dice `"invalido"`, el token está mal copiado),
   - `"webhookFirmado": true`,
   - `"siteUrl": "https://tatankids.com.ar"`.
2. Hacer **una compra real chica** con una tarjeta propia y verificar:
   - el pedido pasa a **pagado** en el CRM y se descuenta el stock;
   - el pago aparece en la cuenta de Mercado Pago.
3. Devolver ese pago desde Mercado Pago (Actividad → el pago → Devolver). El
   webhook marca el pedido como **devuelto** (el stock se repone a mano).

## Ojo: la carpeta `/api` es compartida

Con la web en Ferozo, Next y la API PHP comparten el dominio. Las rutas
`/api/*.php` tienen que seguir yendo a PHP (Apache), no a la app de Node.
Next además usa dos direcciones bajo `/api`:

- `/api/revalidate` (el CRM la llama para que los cambios se vean al
  instante),
- `/api/php/*` (proxy de `next.config.ts`, hoy sin uso desde el navegador).

Al configurar la app de Node en Ferozo hay que revisar que `/api/revalidate`
llegue a Next y `/api/*.php` a PHP (o mover la de Next a otra dirección).
