<?php
/**
 * ============================================================
 *   TATAN API PHP · shipping.php  (envíos con Enviopack)
 * ============================================================
 *
 *   GET shipping.php?action=quote&cp=1425&units=3
 *     → { ok: true, data: ShippingQuote[] }   (tarifas, de la más barata)
 *
 *   GET shipping.php?action=branches&cp=1425&carrier=oca
 *     → { ok: true, data: Branch[] }          (sucursales más cercanas)
 *
 *   Las claves están en secrets.php (no va a git). El token de Enviopack
 *   dura ~4 h y se guarda en la carpeta temporal del servidor; las listas de
 *   sucursales se guardan 24 h.
 *
 *   ⚠️ El navegador usa esto solo para MOSTRAR precios. Al cobrar, el
 *   servidor tiene que volver a cotizar (no confiar en el precio que mande
 *   el navegador).
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
if (is_file(__DIR__ . '/secrets.php')) {
    require_once __DIR__ . '/secrets.php';
}

const EP_API = 'https://api.enviopack.com';
/** Caja estándar (cm). Prendas de bebé: entra casi todo en una caja chica. */
const EP_BOX_SMALL = '30x20x10';
const EP_BOX_LARGE = '40x30x15';
/** A partir de cuántas prendas se usa la caja grande */
const EP_LARGE_FROM = 8;

if (!defined('ENVIOPACK_API_KEY') || ENVIOPACK_API_KEY === '' || !defined('ENVIOPACK_SECRET_KEY')) {
    send_json(['ok' => false, 'error' => 'NOT_CONFIGURED', 'message' => 'Los envíos todavía no están configurados'], 503);
}
if (method() !== 'GET') {
    send_json(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED'], 405);
}

// ---------------------------------------------------------------- helpers

function ep_cache_path(string $name): string
{
    return rtrim(sys_get_temp_dir(), '/') . '/tatan-enviopack-' . preg_replace('/[^a-z0-9_-]/i', '', $name) . '.json';
}

function ep_cache_get(string $name, int $maxAge): mixed
{
    $f = ep_cache_path($name);
    if (!is_file($f) || filemtime($f) < time() - $maxAge) return null;
    $data = json_decode((string)@file_get_contents($f), true);
    return $data ?? null;
}

function ep_cache_set(string $name, mixed $data): void
{
    @file_put_contents(ep_cache_path($name), json_encode($data), LOCK_EX);
}

/** @return array{0:int,1:mixed} [status, json] */
function ep_http(string $method, string $url, array $form = []): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
    ]);
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($form));
    }
    $body = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($body === false) return [0, null];
    return [$status, json_decode((string)$body, true)];
}

/** Token de Enviopack (cacheado hasta 5 min antes de que venza). */
function ep_token(bool $fresh = false): string
{
    if (!$fresh) {
        $c = ep_cache_get('token', 4 * 3600);
        if (is_array($c) && ($c['exp'] ?? 0) > time() + 300 && !empty($c['token'])) {
            return $c['token'];
        }
    }
    [$status, $json] = ep_http('POST', EP_API . '/auth', [
        'api-key' => ENVIOPACK_API_KEY,
        'secret-key' => ENVIOPACK_SECRET_KEY,
    ]);
    $token = is_array($json) ? (string)($json['token'] ?? '') : '';
    if ($status !== 200 || $token === '') {
        send_json(['ok' => false, 'error' => 'ENVIOPACK_AUTH', 'message' => 'No pudimos conectar con el servicio de envíos'], 502);
    }
    // Vencimiento: lo dice el propio token (JWT); si no, 3,5 h
    $exp = time() + 12600;
    $parts = explode('.', $token);
    if (count($parts) === 3) {
        $payload = json_decode((string)base64_decode(strtr($parts[1], '-_', '+/')), true);
        if (is_array($payload) && !empty($payload['exp'])) $exp = (int)$payload['exp'];
    }
    ep_cache_set('token', ['token' => $token, 'exp' => $exp]);
    return $token;
}

/** GET a la API con el token (si vence en el medio, reintenta una vez). */
function ep_get(string $path, array $query): mixed
{
    foreach ([false, true] as $fresh) {
        $q = http_build_query($query + ['access_token' => ep_token($fresh)]);
        [$status, $json] = ep_http('GET', EP_API . $path . '?' . $q);
        if ($status === 401 && !$fresh) continue;
        if ($status < 200 || $status >= 300) {
            send_json(['ok' => false, 'error' => 'ENVIOPACK_ERROR', 'message' => 'No pudimos calcular el envío. Probá de nuevo en un momento.'], 502);
        }
        return $json;
    }
    return null;
}

function cp_param(): string
{
    $cp = strtoupper(trim((string)($_GET['cp'] ?? '')));
    if (!preg_match('/^[A-Z]?(\d{4})[A-Z]{0,3}$/', $cp, $m)) {
        send_json(['ok' => false, 'error' => 'INVALID_CP', 'message' => 'Revisá el código postal'], 400);
    }
    return $m[1];
}

/** Sucursales de un correo (todo el país), cacheadas 24 h. */
function carrier_branches(string $carrier): array
{
    $carrier = preg_replace('/[^a-z0-9_-]/i', '', $carrier);
    $cached = ep_cache_get('branches-' . $carrier, 86400);
    if (is_array($cached)) return $cached;
    $list = ep_get('/sucursales', ['id_correo' => $carrier]);
    $list = is_array($list) ? array_values(array_filter($list, 'is_array')) : [];
    ep_cache_set('branches-' . $carrier, $list);
    return $list;
}

// ---------------------------------------------------------------- acciones

$action = (string)($_GET['action'] ?? 'quote');

if ($action === 'quote') {
    $cp = cp_param();
    $units = max(1, min(200, (int)($_GET['units'] ?? 1)));
    // Peso estimado: ~150 g por prenda + caja
    $kg = max(0.5, round(0.2 + $units * 0.15, 1));
    $raw = ep_get('/cotizar/costo', [
        'codigo_postal' => $cp,
        'peso' => $kg,
        'paquetes' => $units >= EP_LARGE_FROM ? EP_BOX_LARGE : EP_BOX_SMALL,
    ]);
    $raw = is_array($raw) ? $raw : [];
    $despacho = defined('ENVIOPACK_DESPACHO') ? ENVIOPACK_DESPACHO : 'D';

    // Una tarifa por correo + modalidad + servicio, con el despacho de Tatan
    $byKey = [];
    foreach ($raw as $q) {
        if (!is_array($q) || !isset($q['correo']['id'], $q['valor'])) continue;
        $key = $q['correo']['id'] . '|' . ($q['modalidad'] ?? 'D') . '|' . ($q['servicio'] ?? 'N');
        $prev = $byKey[$key] ?? null;
        $isPreferred = ($q['despacho'] ?? '') === $despacho;
        $prevPreferred = $prev && ($prev['despacho'] ?? '') === $despacho;
        if (!$prev || ($isPreferred && !$prevPreferred) || ($isPreferred === $prevPreferred && $q['valor'] < $prev['valor'])) {
            $byKey[$key] = $q;
        }
    }

    $out = [];
    foreach ($byKey as $q) {
        $carrierId = (string)$q['correo']['id'];
        $mode = ($q['modalidad'] ?? 'D') === 'S' ? 'sucursal' : 'domicilio';
        // A sucursal solo si el correo tiene sucursales cargadas para elegir
        if ($mode === 'sucursal' && !carrier_branches($carrierId)) continue;
        $days = max(1, (int)ceil(((int)($q['horas_entrega'] ?? 72)) / 24));
        $service = ($q['servicio'] ?? 'N') === 'P' ? 'prioritario' : 'estandar';
        $out[] = [
            'id' => "{$carrierId}-{$service}-{$mode}",
            'carrierId' => $carrierId,
            'carrier' => (string)($q['correo']['nombre'] ?? $carrierId),
            'service' => $service,
            'mode' => $mode,
            'price' => (int)round((float)$q['valor']),
            'days' => ['min' => $days, 'max' => $days],
        ];
    }
    usort($out, fn($a, $b) => $a['price'] <=> $b['price']);
    send_json(['ok' => true, 'data' => $out]);
}

if ($action === 'branches') {
    $cp = (int)cp_param();
    $carrier = (string)($_GET['carrier'] ?? '');
    if ($carrier === '') send_json(['ok' => false, 'error' => 'MISSING_CARRIER'], 400);
    $list = carrier_branches($carrier);
    // Las más cercanas: mismo código postal primero, después los más parecidos
    usort($list, fn($a, $b) => abs((int)($a['codigo_postal'] ?? 0) - $cp) <=> abs((int)($b['codigo_postal'] ?? 0) - $cp));
    // Solo de la provincia de la más cercana (no sirve una de otra provincia)
    $prov0 = $list[0]['localidad']['provincia']['id'] ?? null;
    if ($prov0 !== null) {
        $list = array_values(array_filter($list, fn($s) => ($s['localidad']['provincia']['id'] ?? null) === $prov0));
    }
    $out = [];
    foreach (array_slice($list, 0, 5) as $s) {
        $loc = is_array($s['localidad'] ?? null) ? $s['localidad'] : [];
        $city = trim((string)($loc['nombre'] ?? ''));
        $prov = trim((string)($loc['provincia']['nombre'] ?? ''));
        $out[] = [
            'id' => (string)($s['id'] ?? ''),
            'carrierId' => $carrier,
            'name' => (string)($s['nombre'] ?? 'Sucursal'),
            'address' => trim(($s['calle'] ?? '') . ' ' . ($s['numero'] ?? '')),
            'city' => trim($city . ($prov && $prov !== $city ? ", {$prov}" : '') . ' (CP ' . ($s['codigo_postal'] ?? '') . ')'),
            'hours' => $s['horario'] ?? null,
        ];
    }
    send_json(['ok' => true, 'data' => $out]);
}

send_json(['ok' => false, 'error' => 'UNKNOWN_ACTION'], 400);
