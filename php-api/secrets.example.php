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

// Mercado Pago → Tus integraciones → (tu aplicación) → Credenciales.
// Para probar usá las credenciales DE PRUEBA (el Access Token empieza con
// "APP_USR-" en cuentas de prueba o "TEST-" en las viejas). En producción,
// las de producción.
define('MP_ACCESS_TOKEN', '');

// Mercado Pago → (tu aplicación) → Webhooks → "Clave secreta". Con esto se
// verifica que los avisos de pago vengan de verdad de Mercado Pago. Si queda
// vacío no se verifica la firma (igual se consulta el pago a la API de MP).
define('MP_WEBHOOK_SECRET', '');

// Dirección pública de la tienda (a donde vuelve el comprador después de
// pagar). Sin barra al final. En desarrollo: http://localhost:3000
define('SITE_URL', 'https://tatankids.com.ar');
