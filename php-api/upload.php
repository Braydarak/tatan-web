<?php
/**
 * POST /api/upload.php   (multipart/form-data, campo `file`)  → requiere sesión CRM
 *   Guarda la imagen en /api/uploads/products/ y devuelve su URL pública.
 *
 *   Respuesta: { ok: true, url: "https://tatankids.com.ar/api/uploads/products/xxxx.jpg" }
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

if (method() !== 'POST') {
    send_json(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED'], 405);
}
require_crm_auth();

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB
const UPLOAD_SUBDIR    = 'uploads/products';

$file = $_FILES['file'] ?? null;
if (!$file || !is_array($file) || is_array($file['error'])) {
    // Si el archivo supera post_max_size, PHP descarta todo el body y $_FILES llega vacío.
    send_json(['ok' => false, 'error' => 'NO_FILE', 'message' => 'No se recibió ninguna imagen (¿supera el tamaño máximo del servidor?)'], 400);
}
if ($file['error'] !== UPLOAD_ERR_OK) {
    $tooBig = in_array($file['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true);
    send_json([
        'ok'      => false,
        'error'   => $tooBig ? 'FILE_TOO_LARGE' : 'UPLOAD_FAILED',
        'message' => $tooBig ? 'La imagen supera el tamaño máximo permitido por el servidor' : 'Error al subir la imagen',
    ], 400);
}
if ($file['size'] > MAX_UPLOAD_BYTES) {
    send_json(['ok' => false, 'error' => 'FILE_TOO_LARGE', 'message' => 'La imagen supera los 8 MB'], 400);
}

// Tipo real según el contenido (no confiar en el nombre ni en el MIME del navegador).
$allowed = [
    IMAGETYPE_JPEG => 'jpg',
    IMAGETYPE_PNG  => 'png',
    IMAGETYPE_GIF  => 'gif',
    IMAGETYPE_WEBP => 'webp',
];
$type = @exif_imagetype($file['tmp_name']);
if ($type === false) {
    $info = @getimagesize($file['tmp_name']);
    $type = $info[2] ?? false;
}
if ($type === false || !isset($allowed[$type])) {
    send_json(['ok' => false, 'error' => 'INVALID_TYPE', 'message' => 'Formato no soportado (usá JPG, PNG, WEBP o GIF)'], 400);
}

$dir = __DIR__ . '/' . UPLOAD_SUBDIR;
if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
    send_json(['ok' => false, 'error' => 'UPLOAD_DIR_FAILED', 'message' => 'No se pudo crear la carpeta de subidas'], 500);
}

// Bloquea la ejecución de scripts dentro de la carpeta de subidas.
$htaccess = $dir . '/.htaccess';
if (!is_file($htaccess)) {
    @file_put_contents($htaccess, "Options -Indexes\n<FilesMatch \"\\.(php|phtml|phar|pl|py|cgi|sh)$\">\n  Require all denied\n</FilesMatch>\n");
}

$filename = gmdate('Ymd') . '-' . bin2hex(random_bytes(8)) . '.' . $allowed[$type];
if (!move_uploaded_file($file['tmp_name'], $dir . '/' . $filename)) {
    send_json(['ok' => false, 'error' => 'UPLOAD_FAILED', 'message' => 'No se pudo guardar la imagen'], 500);
}
@chmod($dir . '/' . $filename, 0644);

// URL absoluta: el front puede estar en otro dominio (Vercel) y la imagen vive en Ferozo.
$publicBase = rtrim(getenv('PUBLIC_API_URL') ?: 'https://tatankids.com.ar/api', '/');

send_json([
    'ok'  => true,
    'url' => $publicBase . '/' . UPLOAD_SUBDIR . '/' . $filename,
], 201);
