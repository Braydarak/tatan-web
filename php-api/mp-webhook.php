<?php
/**
 * ============================================================
 *   TATAN API PHP · mp-webhook.php  (avisos de Mercado Pago)
 * ============================================================
 *
 *   Mercado Pago llama acá cada vez que cambia una order (Orders API):
 *     POST mp-webhook.php?type=order&data.id=ORD01...
 *     body: { "type": "order", "action": "order.processed", "data": { "id": "ORD01..." } }
 *
 *   Se configura en Mercado Pago → Tus integraciones → (la aplicación) →
 *   Webhooks: esta URL y el evento "Order (Mercado Pago)".
 *
 *   No se confía en lo que trae el aviso: se consulta la order a la API de
 *   Mercado Pago y se actualiza el pedido (external_reference = número de
 *   pedido). Es idempotente: si el mismo aviso llega varias veces, el stock
 *   se descuenta una sola vez.
 *
 *   También responde el estado para la página de resultado:
 *     GET mp-webhook.php?action=status&ref=TTN-2026-XXXXXXXX
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/mercadopago.php';

if (!mp_configured()) {
    send_json(['ok' => false, 'error' => 'NOT_CONFIGURED'], 503);
}

/** Valida la firma `x-signature` de Mercado Pago (si hay clave secreta). */
function mp_signature_ok(string $dataId): bool
{
    if (!defined('MP_WEBHOOK_SECRET') || MP_WEBHOOK_SECRET === '') return true;
    $sig = (string)($_SERVER['HTTP_X_SIGNATURE'] ?? '');
    $requestId = (string)($_SERVER['HTTP_X_REQUEST_ID'] ?? '');
    $ts = $v1 = '';
    foreach (explode(',', $sig) as $part) {
        [$k, $v] = array_map('trim', explode('=', $part, 2) + [1 => '']);
        if ($k === 'ts') $ts = $v;
        if ($k === 'v1') $v1 = $v;
    }
    if ($ts === '' || $v1 === '') return false;
    // Mercado Pago firma el id en minúsculas
    $manifest = 'id:' . strtolower($dataId) . ';';
    if ($requestId !== '') $manifest .= "request-id:{$requestId};";
    $manifest .= "ts:{$ts};";
    return hash_equals(hash_hmac('sha256', $manifest, MP_WEBHOOK_SECRET), $v1);
}

/** Consulta la order a Mercado Pago y actualiza el pedido. */
function sync_order(string $mpOrderId): ?array
{
    [$status, $o] = mp_http('GET', '/v1/orders/' . rawurlencode($mpOrderId));
    if ($status !== 200 || !is_array($o)) {
        error_log("[mp-webhook] no se pudo leer la order {$mpOrderId} (HTTP {$status})");
        return null;
    }
    return apply_order($o);
}

// ---------------------------------------------------------------- estado (página de resultado)
if (method() === 'GET' && ($_GET['action'] ?? '') === 'status') {
    $ref = trim((string)($_GET['ref'] ?? ''));
    if (!preg_match('/^TTN-\d{4}-[A-F0-9]{8}$/', $ref)) send_json(['ok' => false, 'error' => 'INVALID_REF'], 400);
    $st = pdo()->prepare('SELECT status, total, payment_id FROM orders WHERE order_number = ?');
    $st->execute([$ref]);
    $o = $st->fetch();
    if (!$o) send_json(['ok' => false, 'error' => 'NOT_FOUND'], 404);
    // Pendiente: se pregunta a Mercado Pago por si el aviso todavía no llegó
    if ($o['status'] === 'pending' && is_string($o['payment_id']) && str_starts_with($o['payment_id'], 'ORD')) {
        try {
            if ($res = sync_order($o['payment_id'])) $o['status'] = $res['status'];
        } catch (Throwable) {
        }
    }
    send_json(['ok' => true, 'data' => ['orderNumber' => $ref, 'status' => $o['status'], 'total' => (float)$o['total']]]);
}

// ---------------------------------------------------------------- aviso de Mercado Pago
$body = read_json_body();
$type = (string)($_GET['type'] ?? $_GET['topic'] ?? $body['type'] ?? $body['topic'] ?? '');
// PHP convierte "data.id" del query string en "data_id"
$dataId = (string)($_GET['data_id'] ?? $body['data']['id'] ?? $_GET['id'] ?? '');

// Avisos que no son de orders: se responde OK y listo (si no, Mercado Pago reintenta)
if ($type !== 'order' || !preg_match('/^[A-Za-z0-9]{8,64}$/', $dataId)) {
    send_json(['ok' => true, 'ignored' => true]);
}
if (!mp_signature_ok($dataId)) {
    send_json(['ok' => false, 'error' => 'INVALID_SIGNATURE'], 401);
}

try {
    $res = sync_order($dataId);
} catch (Throwable) {
    // 500: Mercado Pago reintenta el aviso más tarde
    send_json(['ok' => false, 'error' => 'SYNC_FAILED'], 500);
}
send_json(['ok' => true, 'data' => $res]);
