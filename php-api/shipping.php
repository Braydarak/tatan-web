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

require_once __DIR__ . '/enviopack.php';

if (!ep_configured()) {
    send_json(['ok' => false, 'error' => 'NOT_CONFIGURED', 'message' => 'Los envíos todavía no están configurados'], 503);
}
if (method() !== 'GET') {
    send_json(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED'], 405);
}

function cp_param(): string
{
    $cp = ep_normalize_cp((string)($_GET['cp'] ?? ''));
    if ($cp === null) {
        send_json(['ok' => false, 'error' => 'INVALID_CP', 'message' => 'Revisá el código postal'], 400);
    }
    return $cp;
}

// ---------------------------------------------------------------- acciones

$action = (string)($_GET['action'] ?? 'quote');

if ($action === 'quote') {
    $cp = cp_param();
    send_json(['ok' => true, 'data' => ep_quotes($cp, (int)($_GET['units'] ?? 1))]);
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
