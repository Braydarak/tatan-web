<?php
/**
 * POST /api/upload.php   (multipart/form-data)  → requiere sesión CRM
 *   - `file`: la imagen (JPEG/PNG/GIF/WEBP). El CRM ya la manda comprimida.
 *   - `webp` (opcional): la misma imagen en WebP, más liviana.
 *
 *   Si llega la WebP (o el servidor puede generarla con GD), se guardan las
 *   dos con el mismo nombre y sufijo "-w":  xxxx-w.jpg  +  xxxx-w.webp
 *   La tienda ve el "-w" y ofrece la WebP con <picture>, dejando la JPEG/PNG
 *   de respaldo para navegadores viejos.
 *
 *   Respuesta: { ok: true, url: ".../uploads/products/xxxx-w.jpg", webp: ".../xxxx-w.webp" | null }
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

$ext = $allowed[$type];

// WebP opcional enviada por el CRM (validada igual que la principal)
$webpTmp = null;
$webpFile = $_FILES['webp'] ?? null;
if ($ext !== 'webp' && $webpFile && is_array($webpFile) && !is_array($webpFile['error'])
    && $webpFile['error'] === UPLOAD_ERR_OK && $webpFile['size'] <= MAX_UPLOAD_BYTES) {
    $wt = @exif_imagetype($webpFile['tmp_name']);
    if ($wt === false) { $wi = @getimagesize($webpFile['tmp_name']); $wt = $wi[2] ?? false; }
    if ($wt === IMAGETYPE_WEBP) $webpTmp = $webpFile['tmp_name'];
}

$base = gmdate('Ymd') . '-' . bin2hex(random_bytes(8));
$canWebp = $ext !== 'webp' && ($webpTmp !== null || (function_exists('imagewebp') && ($ext === 'jpg' || $ext === 'png')));
if ($canWebp) $base .= '-w';

$filename = $base . '.' . $ext;
if (!move_uploaded_file($file['tmp_name'], $dir . '/' . $filename)) {
    send_json(['ok' => false, 'error' => 'UPLOAD_FAILED', 'message' => 'No se pudo guardar la imagen'], 500);
}
@chmod($dir . '/' . $filename, 0644);

// Guardar la WebP compañera: la del CRM, o generada acá con GD
$webpName = null;
if ($canWebp) {
    $webpPath = $dir . '/' . $base . '.webp';
    $saved = false;
    if ($webpTmp !== null) {
        $saved = move_uploaded_file($webpTmp, $webpPath);
    } else {
        $img = $ext === 'jpg' ? @imagecreatefromjpeg($dir . '/' . $filename) : @imagecreatefrompng($dir . '/' . $filename);
        if ($img) {
            if ($ext === 'png') { imagepalettetotruecolor($img); imagealphablending($img, true); imagesavealpha($img, true); }
            $saved = @imagewebp($img, $webpPath, 80);
            unset($img); // libera la memoria (imagedestroy está deprecado en PHP 8.5)
        }
    }
    if ($saved) {
        @chmod($webpPath, 0644);
        $webpName = $base . '.webp';
    } else {
        // Sin WebP: renombrar para sacar el "-w" (así la tienda no la busca)
        $plain = substr($base, 0, -2) . '.' . $ext;
        if (@rename($dir . '/' . $filename, $dir . '/' . $plain)) $filename = $plain;
    }
}

// URL absoluta: el front puede estar en otro dominio (Vercel) y la imagen vive en Ferozo.
$publicBase = rtrim(getenv('PUBLIC_API_URL') ?: 'https://tatankids.com.ar/api', '/');

send_json([
    'ok'   => true,
    'url'  => $publicBase . '/' . UPLOAD_SUBDIR . '/' . $filename,
    'webp' => $webpName ? $publicBase . '/' . UPLOAD_SUBDIR . '/' . $webpName : null,
], 201);
