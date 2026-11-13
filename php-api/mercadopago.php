<?php
/**
 * ============================================================
 *   TATAN API PHP · mercadopago.php  (funciones de Mercado Pago)
 * ============================================================
 *
 *   Lo usan checkout.php (crear el pago) y mp-webhook.php (confirmarlo).
 *   No es un endpoint: si se pide por el navegador no hace nada.
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
if (is_file(__DIR__ . '/secrets.php')) {
    require_once __DIR__ . '/secrets.php';
}

const MP_API = 'https://api.mercadopago.com';

function mp_configured(): bool
{
    return defined('MP_ACCESS_TOKEN') && MP_ACCESS_TOKEN !== '';
}

/** Dirección pública de la tienda, sin barra final. */
function site_url(): string
{
    $url = defined('SITE_URL') && SITE_URL !== '' ? SITE_URL : (getenv('NEXT_PUBLIC_SITE_URL') ?: 'https://tatankids.com.ar');
    return rtrim($url, '/');
}

/** URL pública de esta API (para el webhook), sin barra final. */
function api_url(): string
{
    $scheme = is_https() ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'tatankids.com.ar';
    $dir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/api/x.php')), '/');
    return "{$scheme}://{$host}{$dir}";
}

/**
 * Llamada a la API de Mercado Pago.
 * @return array{0:int,1:mixed} [status, json]
 */
function mp_http(string $method, string $path, ?array $body = null, ?string $idempotencyKey = null): array
{
    $headers = [
        'Accept: application/json',
        'Authorization: Bearer ' . MP_ACCESS_TOKEN,
    ];
    if ($body !== null) $headers[] = 'Content-Type: application/json';
    if ($idempotencyKey !== null) $headers[] = 'X-Idempotency-Key: ' . $idempotencyKey;

    $ch = curl_init(MP_API . $path);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 25,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }
    $raw = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($raw === false) return [0, null];
    return [$status, json_decode((string)$raw, true)];
}

/** Registra un cambio en el historial del pedido. */
function order_event(int $orderId, string $status, ?string $note = null): void
{
    pdo()->prepare('INSERT INTO order_events (order_id, status, note) VALUES (?, ?, ?)')
        ->execute([$orderId, $status, $note === null ? null : mb_substr($note, 0, 500)]);
}

/**
 * Filas de stock que cubren una línea del pedido, bloqueadas para escribir
 * (llamar dentro de una transacción).
 *
 * Si el producto tiene stock por color para ese color, es esa sola fila; si
 * no, el stock del talle se comparte entre todas sus filas (todos los
 * colores), igual que en el carrito.
 *
 * @return array{perColor:bool, rows:list<array{id:int,stock:int}>}
 */
function stock_rows_for(string $productId, string $color, string $size, bool $lock): array
{
    $forUpdate = $lock ? ' FOR UPDATE' : '';
    if ($color !== '') {
        $st = pdo()->prepare("SELECT id, stock FROM product_sizes_stock WHERE product_id = ? AND color = ? AND size = ?{$forUpdate}");
        $st->execute([$productId, $color, $size]);
        $row = $st->fetch();
        if ($row) return ['perColor' => true, 'rows' => [['id' => (int)$row['id'], 'stock' => (int)$row['stock']]]];
    }
    $st = pdo()->prepare("SELECT id, stock FROM product_sizes_stock WHERE product_id = ? AND size = ? ORDER BY stock DESC, id{$forUpdate}");
    $st->execute([$productId, $size]);
    $rows = array_map(fn($r) => ['id' => (int)$r['id'], 'stock' => (int)$r['stock']], $st->fetchAll());
    return ['perColor' => false, 'rows' => $rows];
}

/**
 * Descuenta del stock y suma a vendidos las líneas de un pedido pagado.
 * Llamar dentro de una transacción. Devuelve las líneas que no alcanzaron
 * (se vendió igual: hay que avisarle al comprador o reponer).
 *
 * @return list<string>
 */
function order_discount_stock(int $orderId): array
{
    $st = pdo()->prepare('SELECT product_id, product_name, variant_name, size, quantity FROM order_items WHERE order_id = ?');
    $st->execute([$orderId]);
    $short = [];
    $upd = pdo()->prepare('UPDATE product_sizes_stock SET stock = ? WHERE id = ?');
    $sold = pdo()->prepare('UPDATE products SET sold_total = sold_total + ? WHERE id = ?');
    foreach ($st->fetchAll() as $it) {
        $need = (int)$it['quantity'];
        $found = stock_rows_for((string)$it['product_id'], (string)($it['variant_name'] ?? ''), (string)($it['size'] ?? ''), true);
        foreach ($found['rows'] as $row) {
            if ($need <= 0) break;
            $take = min($need, $row['stock']);
            if ($take <= 0) continue;
            $upd->execute([$row['stock'] - $take, $row['id']]);
            $need -= $take;
        }
        if ($need > 0) {
            $label = trim($it['product_name'] . ' ' . ($it['variant_name'] ?? '') . ' talle ' . ($it['size'] ?? ''));
            $short[] = "{$label} (faltaron {$need})";
        }
        $sold->execute([(int)$it['quantity'], (string)$it['product_id']]);
    }
    return $short;
}

/** Primer pago de una order de Mercado Pago (Orders API), o [] */
function mp_order_payment(array $o): array
{
    $p = $o['transactions']['payments'][0] ?? null;
    return is_array($p) ? $p : [];
}

/**
 * Estado de una order de Mercado Pago → qué le pasó al pago:
 * 'approved' | 'pending' | 'rejected' | 'cancelled' | 'refunded'
 */
function mp_order_outcome(array $o): string
{
    $status = (string)($o['status'] ?? '');
    return match (true) {
        $status === 'processed'                                       => 'approved',
        in_array($status, ['processing', 'action_required', 'created'], true) => 'pending',
        $status === 'failed'                                          => 'rejected',
        $status === 'canceled' || $status === 'cancelled'             => 'cancelled',
        in_array($status, ['refunded', 'charged_back'], true)         => 'refunded',
        default                                                       => 'pending',
    };
}

/**
 * Actualiza el pedido según una order de Mercado Pago (lo que devuelve
 * /v1/orders). Idempotente: el stock se descuenta una sola vez.
 * @return array{orderNumber:string,status:string}|null
 */
function apply_order(array $o): ?array
{
    $mpOrderId = (string)($o['id'] ?? '');
    $ref = (string)($o['external_reference'] ?? '');
    if ($ref === '' || $mpOrderId === '') return null;
    $outcome = mp_order_outcome($o);
    $pay = mp_order_payment($o);
    $detail = (string)($pay['status_detail'] ?? $o['status_detail'] ?? '');
    $method = (string)($pay['payment_method']['id'] ?? '');

    $pdo = pdo();
    $pdo->beginTransaction();
    try {
        $st = $pdo->prepare('SELECT id, status, total FROM orders WHERE order_number = ? FOR UPDATE');
        $st->execute([$ref]);
        $order = $st->fetch();
        if (!$order) {
            $pdo->rollBack();
            error_log("[mp] order {$mpOrderId} de un pedido que no existe: {$ref}");
            return null;
        }
        $orderId = (int)$order['id'];
        $current = (string)$order['status'];
        $note = "Mercado Pago: order {$mpOrderId} {$o['status']}" . ($detail !== '' ? " ({$detail})" : '') . ($method !== '' ? " · {$method}" : '');

        if ($outcome === 'approved') {
            if (!in_array($current, ['paid', 'shipped', 'delivered', 'refunded'], true)) {
                // Monto cobrado sin los intereses de las cuotas (esos los paga el comprador)
                $paid = (float)($o['total_amount'] ?? $pay['amount'] ?? 0);
                if ($paid > 0 && abs($paid - (float)$order['total']) > 1) {
                    $note .= sprintf(' · ⚠️ pagó $%.2f y el pedido es de $%.2f', $paid, (float)$order['total']);
                }
                $pdo->prepare("UPDATE orders SET status = 'paid', payment_id = ?, paid_at = NOW(), cancelled_at = NULL WHERE id = ?")
                    ->execute([$mpOrderId, $orderId]);
                $short = order_discount_stock($orderId);
                if ($short) $note .= ' · ⚠️ sin stock suficiente: ' . implode('; ', $short);
                order_event($orderId, 'paid', $note);
                $current = 'paid';
            }
        } elseif ($outcome === 'pending') {
            if (in_array($current, ['pending', 'draft', 'cancelled'], true)) {
                $pdo->prepare("UPDATE orders SET status = 'pending', payment_id = ?, cancelled_at = NULL WHERE id = ?")
                    ->execute([$mpOrderId, $orderId]);
                order_event($orderId, 'pending', $note);
                $current = 'pending';
            }
        } elseif ($outcome === 'rejected' || $outcome === 'cancelled') {
            // Un pago rechazado no cierra el pedido para siempre: se puede reintentar
            if ($current === 'pending' || $current === 'draft') {
                $pdo->prepare("UPDATE orders SET status = 'cancelled', payment_id = ?, cancelled_at = NOW() WHERE id = ?")
                    ->execute([$mpOrderId, $orderId]);
                order_event($orderId, 'cancelled', $note);
                $current = 'cancelled';
            }
        } elseif ($outcome === 'refunded') {
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
        error_log('[mp] ' . $e->getMessage());
        throw $e;
    }
}
