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

// .htaccess de la carpeta de subidas:
//  - bloquea la ejecución de scripts,
//  - cachea las fotos 1 año: cada archivo tiene nombre único (fecha + hash) y
//    nunca se pisa, así que el navegador/CDN no necesita volver a pedirlas.
// Se reescribe si es de la versión vieja (sin caché).
$htaccess = $dir . '/.htaccess';
$htaccessBody = <<<'HT'
Options -Indexes
<FilesMatch "\.(php|phtml|phar|pl|py|cgi|sh)$">
  Require all denied
</FilesMatch>
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
</IfModule>
<IfModule mod_headers.c>
  <FilesMatch "\.(jpe?g|png|webp|gif)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
</IfModule>

HT;
$current = is_file($htaccess) ? (string) @file_get_contents($htaccess) : '';
if (!str_contains($current, 'max-age=31536000')) {
    @file_put_contents($htaccess, $htaccessBody);
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

/**
 * Nombre original del archivo, en minúsculas, sin acentos ni símbolos y sin
 * extensión. Si ya es un nombre de esta API (al re-encuadrar una foto ya
 * subida), se toma el nombre original que tenía guardado.
 */
function original_name_slug(string $name): string
{
    $name = preg_replace('/\.[a-z0-9]{2,5}$/i', '', basename($name)) ?? '';
    if (preg_match('/^\d{8}-[0-9a-f]{16}(?:--(.+?))?(?:-w)?$/i', $name, $m)) {
        $name = $m[1] ?? '';
    }
    $name = strtr($name, [
        'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n',
        'Á' => 'A', 'É' => 'E', 'Í' => 'I', 'Ó' => 'O', 'Ú' => 'U', 'Ü' => 'U', 'Ñ' => 'N',
    ]);
    $slug = strtolower((string)preg_replace('/[^a-z0-9]+/i', '-', $name));
    $slug = trim((string)preg_replace('/-+/', '-', $slug), '-');
    // Sin el "-w" final (lo usa la API para avisar que hay WebP)
    $slug = (string)preg_replace('/-w$/', '', $slug);
    // Nombres genéricos (los pone el navegador): no sirven para reconocer la foto
    if (in_array($slug, ['image', 'imagen', 'foto', 'photo', 'blob', 'file', 'archivo'], true)) return '';
    return substr($slug, 0, 60);
}

$base = gmdate('Ymd') . '-' . bin2hex(random_bytes(8));
// Se guarda también el nombre original del archivo (limpio): la tienda lo usa
// para no mostrar dos veces la misma foto (p. ej. en la galería y en un color).
//   body-celeste.jpg  →  20261113-a1b2c3d4e5f6a7b8--body-celeste-w.jpg
$origName = original_name_slug((string)($file['name'] ?? ''));
if ($origName !== '') $base .= '--' . $origName;
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
