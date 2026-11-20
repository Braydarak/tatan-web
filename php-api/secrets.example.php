<?php
/**
 * Claves secretas de la API. Copiar este archivo como `secrets.php` en la
 * misma carpeta (en Ferozo: /api/secrets.php) y completar los valores.
 *
 * `secrets.php` NO se sube a git (está en .gitignore): el repositorio es
 * público. Si alguien lo pide por el navegador, PHP lo ejecuta y no muestra
 * nada.
 */

// Enviopack → Configuración → API
define('ENVIOPACK_API_KEY', '');
define('ENVIOPACK_SECRET_KEY', '');

// Cómo despacha Tatan los paquetes:
//   'D' = Enviopack los retira (colecta, tiene costo)
//   'S' = Tatan los lleva a una sucursal del correo
define('ENVIOPACK_DESPACHO', 'D');

// ---------------------------------------------------------------- Mercado Pago
// Mercado Pago → Tus integraciones → (tu aplicación) → Credenciales de
// PRODUCCIÓN → "Access Token" (empieza con "APP_USR-"). Es secreto: va solo
// acá, nunca en la web ni en git. La "Public Key" NO va acá: va en la web
// (NEXT_PUBLIC_MP_PUBLIC_KEY, ver docs/mercadopago-produccion.md). El Client ID y el Client
// Secret no se usan en esta integración.
//
// Para probar sin cobrar: el Access Token de un usuario de prueba.
// Para ver qué quedó cargado: /api/checkout.php?action=version
//   → "mercadoPago": "produccion" (cobra de verdad) o "prueba".
define('MP_ACCESS_TOKEN', '');

// Pagos que se acreditan después (efectivo): los revisa mp-sync.php con un
// cron de Ferozo cada 15 minutos (ver docs/mercadopago-produccion.md). Esta
// clave solo hace falta si el cron abre la dirección web
// (mp-sync.php?key=...); con "php .../mp-sync.php" no se usa.
define('MP_SYNC_KEY', '');

// Opcional, si el panel de Mercado Pago lo permite:
// Mercado Pago → (tu aplicación) → Webhooks → Modo productivo:
//   URL:     https://tatankids.com.ar/api/mp-webhook.php
//   Evento:  "Order (Mercado Pago)"
// Al guardar, Mercado Pago muestra una "Clave secreta": pegala acá. Con eso
// se verifica que los avisos de pago vengan de verdad de Mercado Pago. Si
// queda vacío no se verifica la firma (igual se consulta el pago a la API).
define('MP_WEBHOOK_SECRET', '');

// ---------------------------------------------------------------- Avisos de venta
// Cuando se paga un pedido llega un mail con todo el detalle (orders-lib.php).
// Opcionales: si quedan vacíos se usa contacto@tatankids.com.ar.
define('ORDER_NOTIFY_EMAIL', '');  // a dónde llegan los avisos
define('MAIL_FROM', '');           // remitente (una casilla del dominio)

// Dirección pública de la tienda (a donde vuelve el comprador después de
// pagar). Sin barra al final. En desarrollo: http://localhost:3000
define('SITE_URL', 'https://tatankids.com.ar');
