<?php
/**
 * ============================================================
 *   TATAN API PHP · img.php  (fotos achicadas para la web)
 * ============================================================
 *
 *   GET img.php?f=products/xxxx-w.jpg&w=384&q=75
 *
 *   La web es estática (sin Node), así que las fotos no se pueden achicar
 *   "al vuelo" como hacía Next. Este script lo hace con GD: toma la foto
 *   subida (solo dentro de uploads/), la achica al ancho pedido, la pasa a
 *   WebP (si el navegador lo acepta) y la guarda en uploads/.cache para no
 *   repetir el trabajo. La web la pide con el tamaño justo para cada
 *   pantalla (lib/image-loader.ts), así una tarjeta no baja una foto de 1600 px.
 *
 *   Los archivos subidos tienen nombre único y no cambian: se cachean un año.
 */

declare(strict_types=1);

const UPLOADS = __DIR__ . '/uploads';
const CACHE_DIR = UPLOADS . '/.cache';
// Los anchos que pide la web (deviceSizes + imageSizes de next.config.ts)
const WIDTHS = [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];

function fail(int $status): never
{
    http_response_code($status);
    header('Cache-Control: no-store');
    exit;
}

$f = (string)($_GET['f'] ?? '');
$w = (int)($_GET['w'] ?? 0);
$q = max(40, min(90, (int)($_GET['q'] ?? 75)));

// Solo archivos de imagen dentro de uploads/ (nada de "..", ni rutas absolutas)
if ($f === '' || !preg_match('#^[A-Za-z0-9._/-]+\.(jpe?g|png|webp)$#i', $f) || str_contains($f, '..')) fail(400);
if (!in_array($w, WIDTHS, true)) fail(400);
$src = realpath(UPLOADS . '/' . $f);
$base = realpath(UPLOADS);
if ($src === false || $base === false || !str_starts_with($src, $base . DIRECTORY_SEPARATOR) || !is_file($src)) fail(404);

$acceptsWebp = str_contains((string)($_SERVER['HTTP_ACCEPT'] ?? ''), 'image/webp') && function_exists('imagewebp');
$outExt = $acceptsWebp ? 'webp' : 'jpg';
$mime = $acceptsWebp ? 'image/webp' : 'image/jpeg';

header('Vary: Accept');
header('Cache-Control: public, max-age=31536000, immutable');
header('X-Content-Type-Options: nosniff');

$key = sha1($f . '|' . filemtime($src));
$cached = CACHE_DIR . "/{$key}-{$w}-{$q}.{$outExt}";
if (is_file($cached)) {
    header("Content-Type: {$mime}");
    header('Content-Length: ' . filesize($cached));
    readfile($cached);
    exit;
}

// Abrir la original
$ext = strtolower(pathinfo($src, PATHINFO_EXTENSION));
$img = match ($ext) {
    'jpg', 'jpeg' => @imagecreatefromjpeg($src),
    'png'         => @imagecreatefrompng($src),
    'webp'        => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($src) : false,
    default       => false,
};
if (!$img) {
    // No se pudo abrir con GD: se manda la original tal cual
    header('Content-Type: ' . (mime_content_type($src) ?: 'application/octet-stream'));
    readfile($src);
    exit;
}

$ow = imagesx($img);
$oh = imagesy($img);
// Nunca se agranda: si la original es más chica, se usa su ancho
$nw = min($w, $ow);
$nh = (int)max(1, round($oh * $nw / $ow));
$out = imagecreatetruecolor($nw, $nh);
if ($outExt === 'webp') {
    imagealphablending($out, false);
    imagesavealpha($out, true);
    imagefill($out, 0, 0, imagecolorallocatealpha($out, 0, 0, 0, 127));
} else {
    // JPG no tiene transparencia: fondo blanco
    imagefill($out, 0, 0, imagecolorallocate($out, 255, 255, 255));
}
imagecopyresampled($out, $img, 0, 0, 0, 0, $nw, $nh, $ow, $oh);
imagedestroy($img);

if (!is_dir(CACHE_DIR)) @mkdir(CACHE_DIR, 0755, true);
$tmp = $cached . '.' . bin2hex(random_bytes(4)) . '.tmp';
$ok = $outExt === 'webp' ? imagewebp($out, $tmp, $q) : imagejpeg($out, $tmp, $q);
imagedestroy($out);
if ($ok && @rename($tmp, $cached)) {
    header("Content-Type: {$mime}");
    header('Content-Length: ' . filesize($cached));
    readfile($cached);
    exit;
}
@unlink($tmp);
fail(500);
