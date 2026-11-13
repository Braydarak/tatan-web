<?php
/**
 * ============================================================
 *   TATAN API PHP · mp-webhook.php  (avisos de pago de Mercado Pago)
 * ============================================================
 *
 *   Mercado Pago llama acá cada vez que cambia un pago:
 *     POST mp-webhook.php?type=payment&data.id=123   (Webhooks)
 *     POST mp-webhook.php?topic=payment&id=123       (IPN, formato viejo)
 *
 *   No se confía en lo que trae el aviso: se consulta el pago a la API de
 *   Mercado Pago y se actualiza el pedido (external_reference = número de
 *   pedido). Es idempotente: si el mismo aviso llega varias veces, el stock
 *   se descuenta una sola vez.
 *
 *   También sirve para que la página de resultado confirme el estado:
 *     GET mp-webhook.php?action=status&ref=TTN-2026-XXXX&payment_id=123
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
    $manifest = 'id:' . strtolower($dataId) . ';';
    if ($requestId !== '') $manifest .= "request-id:{$requestId};";
    $manifest .= "ts:{$ts};";
    return hash_equals(hash_hmac('sha256', $manifest, MP_WEBHOOK_SECRET), $v1);
}

/**
 * Consulta el pago a Mercado Pago y actualiza el pedido.
 * @return array{orderNumber:string,status:string}|null
 */
function sync_payment(string $paymentId): ?array
{
    [$status, $pay] = mp_http('GET', '/v1/payments/' . rawurlencode($paymentId));
    if ($status !== 200 || !is_array($pay)) {
        error_log("[mp-webhook] no se pudo leer el pago {$paymentId} (HTTP {$status})");
        return null;
    }
    $ref = (string)($pay['external_reference'] ?? '');
    $mpStatus = (string)($pay['status'] ?? '');
    $detail = (string)($pay['status_detail'] ?? '');
    if ($ref === '') return null;

    $pdo = pdo();
    $pdo->beginTransaction();
    try {
        $st = $pdo->prepare('SELECT id, status, total FROM orders WHERE order_number = ? FOR UPDATE');
        $st->execute([$ref]);
        $order = $st->fetch();
        if (!$order) {
            $pdo->rollBack();
            error_log("[mp-webhook] pago {$paymentId} de un pedido que no existe: {$ref}");
            return null;
        }
        $orderId = (int)$order['id'];
        $current = (string)$order['status'];
        $note = "Mercado Pago: pago {$paymentId} {$mpStatus}" . ($detail !== '' ? " ({$detail})" : '');

        if ($mpStatus === 'approved') {
            if (!in_array($current, ['paid', 'shipped', 'delivered', 'refunded'], true)) {
                $paid = (float)($pay['transaction_amount'] ?? 0);
                if (abs($paid - (float)$order['total']) > 1) {
                    $note .= sprintf(' · ⚠️ pagó $%.2f y el pedido es de $%.2f', $paid, (float)$order['total']);
                }
                $pdo->prepare("UPDATE orders SET status = 'paid', payment_id = ?, paid_at = NOW(), cancelled_at = NULL WHERE id = ?")
                    ->execute([$paymentId, $orderId]);
                $short = order_discount_stock($orderId);
                if ($short) $note .= ' · ⚠️ sin stock suficiente: ' . implode('; ', $short);
                order_event($orderId, 'paid', $note);
                $current = 'paid';
            }
        } elseif (in_array($mpStatus, ['pending', 'in_process', 'authorized'], true)) {
            if ($current === 'pending' || $current === 'draft' || $current === 'cancelled') {
                $pdo->prepare("UPDATE orders SET status = 'pending', payment_id = ?, cancelled_at = NULL WHERE id = ?")
                    ->execute([$paymentId, $orderId]);
                order_event($orderId, 'pending', $note);
                $current = 'pending';
            }
        } elseif (in_array($mpStatus, ['rejected', 'cancelled'], true)) {
            // Un pago rechazado no cancela el pedido si después paga con otro medio
            if ($current === 'pending' || $current === 'draft') {
                $pdo->prepare("UPDATE orders SET status = 'cancelled', payment_id = ?, cancelled_at = NOW() WHERE id = ?")
                    ->execute([$paymentId, $orderId]);
                order_event($orderId, 'cancelled', $note);
                $current = 'cancelled';
            }
        } elseif (in_array($mpStatus, ['refunded', 'charged_back'], true)) {
            if ($current !== 'refunded') {
                $pdo->prepare("UPDATE orders SET status = 'refunded' WHERE id = ?")->execute([$orderId]);
                order_event($orderId, 'refunded', $note . ' · revisar el stock a mano');
                $current = 'refunded';
            }
        }
        $pdo->commit();
        return ['orderNumber' => $ref, 'status' => $current];
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('[mp-webhook] ' . $e->getMessage());
        throw $e;
    }
}

// ---------------------------------------------------------------- estado (página de resultado)
if (method() === 'GET' && ($_GET['action'] ?? '') === 'status') {
    $ref = trim((string)($_GET['ref'] ?? ''));
    if (!preg_match('/^TTN-\d{4}-[A-F0-9]{8}$/', $ref)) send_json(['ok' => false, 'error' => 'INVALID_REF'], 400);
    // Si vuelve con el id del pago, se sincroniza (por si el webhook todavía no llegó,
    // p. ej. en desarrollo sin dirección pública)
    $paymentId = preg_replace('/\D/', '', (string)($_GET['payment_id'] ?? ''));
    if ($paymentId !== '') {
        try {
            sync_payment($paymentId);
        } catch (Throwable) {
        }
    }
    $st = pdo()->prepare('SELECT status, total FROM orders WHERE order_number = ?');
    $st->execute([$ref]);
    $o = $st->fetch();
    if (!$o) send_json(['ok' => false, 'error' => 'NOT_FOUND'], 404);
    send_json(['ok' => true, 'data' => ['orderNumber' => $ref, 'status' => $o['status'], 'total' => (float)$o['total']]]);
}

// ---------------------------------------------------------------- aviso de Mercado Pago
$type = (string)($_GET['type'] ?? $_GET['topic'] ?? '');
$body = read_json_body();
if ($type === '') $type = (string)($body['type'] ?? $body['topic'] ?? '');
$dataId = (string)($_GET['data_id'] ?? $_GET['data.id'] ?? $_GET['id'] ?? ($body['data']['id'] ?? ''));

// Avisos que no son de pagos (merchant_order, etc.): se responde OK y listo
if ($type !== 'payment' || !preg_match('/^\d+$/', $dataId)) {
    send_json(['ok' => true, 'ignored' => true]);
}
if (!mp_signature_ok($dataId)) {
    send_json(['ok' => false, 'error' => 'INVALID_SIGNATURE'], 401);
}

try {
    $res = sync_payment($dataId);
} catch (Throwable) {
    // 500: Mercado Pago reintenta el aviso más tarde
    send_json(['ok' => false, 'error' => 'SYNC_FAILED'], 500);
}
send_json(['ok' => true, 'data' => $res]);
