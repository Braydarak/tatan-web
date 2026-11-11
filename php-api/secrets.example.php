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
