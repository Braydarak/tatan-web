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
| Clave secreta del webhook (solo si el panel lo permite) | `MP_WEBHOOK_SECRET` en `/api/secrets.php` | **Sí** |
| Client ID / Client Secret | No se usan en esta integración | Sí (guardarlas igual) |

## 1. API PHP (`/api` en Ferozo)

1. Subir los archivos que cambiaron de `php-api/`: `checkout.php`,
   `mercadopago.php`, `mp-webhook.php` y el nuevo `mp-sync.php`.
2. Editar **en el servidor** `/api/secrets.php` y cambiar solo estas líneas
   (no reemplazar el archivo entero: tiene también las claves de Enviopack):

   ```php
   define('MP_ACCESS_TOKEN', 'APP_USR-…');   // Access Token de producción
   define('SITE_URL', 'https://tatankids.com.ar');
   ```

## 2. Confirmar los pagos que se acreditan después (cron)

Los pagos con tarjeta se confirman al instante. Los pagos en efectivo
(Rapipago / Pago Fácil) se acreditan horas o días después, y alguien tiene
que avisarle a la tienda.

En la API de Orders, Mercado Pago solo permite configurar su aviso
(webhook) desde el panel de la aplicación, y en esta cuenta el panel no lo
ofrece. Por eso la tienda pregunta sola: `php-api/mp-sync.php` revisa los
pedidos pendientes de los últimos 10 días y los actualiza (pagado,
rechazado, etc.).

**Configurarlo en Ferozo:** panel → **Cron Jobs** (Tareas programadas) →
nueva tarea:

- Frecuencia: cada 15 minutos (`*/15 * * * *`)
- Comando (cambiar `USUARIO` por el usuario de la cuenta; la ruta exacta de
  la carpeta `api` está en el administrador de archivos):

  ```bash
  php /home/USUARIO/public_html/api/mp-sync.php
  ```

Si el cron solo deja abrir una dirección web, definir una clave larga en
`/api/secrets.php` y usar esa:

```php
define('MP_SYNC_KEY', 'una-clave-larga-al-azar');
```

```bash
curl -s "https://tatankids.com.ar/api/mp-sync.php?key=una-clave-larga-al-azar"
```

Las devoluciones que se hagan desde Mercado Pago no se detectan solas (el
CRM todavía no tiene una sección de pedidos): cambiar el `status` del pedido
a `refunded` en la tabla `orders` desde phpMyAdmin.

**Si más adelante el panel muestra "Webhooks"** (Tus integraciones → la
aplicación → Webhooks → Modo productivo), se puede sumar el aviso además
del cron:

- URL: `https://tatankids.com.ar/api/mp-webhook.php`
- Evento: **Order (Mercado Pago)**
- La clave secreta que muestra al guardar va en `MP_WEBHOOK_SECRET`
  (`/api/secrets.php`).

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
   - `"siteUrl": "https://tatankids.com.ar"`.
2. Hacer **una compra real chica** con una tarjeta propia y verificar:
   - la página final de la compra dice que el pago se aprobó;
   - en phpMyAdmin, tabla `orders`, el pedido figura `paid` y el stock del
     producto bajó;
   - el pago aparece en la cuenta de Mercado Pago;
   - en el panel de Cron Jobs la tarea corre sin errores (Ferozo puede
     mandar la salida por mail: tiene que decir `mp-sync: ok`).
3. Devolver ese pago desde Mercado Pago (Actividad → el pago → Devolver) y
   pasar el pedido a `refunded` en phpMyAdmin (el stock se repone a mano).

## Ojo: la carpeta `/api` es compartida

Con la web en Ferozo, Next y la API PHP comparten el dominio. Las rutas
`/api/*.php` tienen que seguir yendo a PHP (Apache), no a la app de Node.
Next además usa dos direcciones bajo `/api`:

- `/api/revalidate` (el CRM la llama para que los cambios se vean al
  instante),
- `/api/php/*` (proxy de `next.config.ts`, hoy sin uso desde el navegador).

Al configurar la app de Node en Ferozo hay que revisar que `/api/revalidate`
llegue a Next y `/api/*.php` (incluido `mp-sync.php` si se usa por la web) a PHP (o mover la de Next a otra dirección).
