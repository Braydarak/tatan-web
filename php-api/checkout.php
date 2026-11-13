<?php
/**
 * ============================================================
 *   TATAN API PHP · checkout.php  (crear el pago con Mercado Pago)
 * ============================================================
 *
 *   POST checkout.php
 *     body: {
 *       buyer:    { email, firstName, lastName, phone, dni },
 *       items:    [{ productId, size, colorName?, quantity }],
 *       shipping: { quoteId, postalCode, address?: {...}, branchId? }
 *     }
 *     → { ok: true, data: { orderNumber, redirectUrl } }
 *
 *   No se confía en nada de precios que mande el navegador: el servidor
 *   lee precios y stock de la base, vuelve a cotizar el envío en
 *   Enviopack, guarda el pedido como "pending" y crea la preferencia de
 *   Checkout Pro. El pago se confirma en mp-webhook.php.
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/mercadopago.php';
require_once __DIR__ . '/enviopack.php';

if (method() !== 'POST') {
    send_json(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED'], 405);
}
if (!mp_configured()) {
    send_json(['ok' => false, 'error' => 'NOT_CONFIGURED', 'message' => 'Los pagos todavía no están configurados'], 503);
}
if (!ep_configured()) {
    send_json(['ok' => false, 'error' => 'NOT_CONFIGURED', 'message' => 'Los envíos todavía no están configurados'], 503);
}

function bad(string $error, string $message, int $status = 400): never
{
    send_json(['ok' => false, 'error' => $error, 'message' => $message], $status);
}

function str_field(array $a, string $k, int $max): string
{
    return mb_substr(trim((string)($a[$k] ?? '')), 0, $max);
}

$body = read_json_body();

// ---------------------------------------------------------------- comprador
$b = is_array($body['buyer'] ?? null) ? $body['buyer'] : [];
$buyer = [
    'email'     => mb_strtolower(str_field($b, 'email', 150)),
    'firstName' => str_field($b, 'firstName', 80),
    'lastName'  => str_field($b, 'lastName', 80),
    'phone'     => preg_replace('/[^\d+]/', '', str_field($b, 'phone', 30)),
    'dni'       => preg_replace('/\D/', '', str_field($b, 'dni', 12)),
];
if (!filter_var($buyer['email'], FILTER_VALIDATE_EMAIL)) bad('INVALID_BUYER', 'Revisá el email');
if ($buyer['firstName'] === '' || $buyer['lastName'] === '') bad('INVALID_BUYER', 'Falta el nombre o el apellido');
if (strlen($buyer['phone']) < 8) bad('INVALID_BUYER', 'Revisá el teléfono');
if (strlen($buyer['dni']) < 7 || strlen($buyer['dni']) > 8) bad('INVALID_BUYER', 'Revisá el DNI');

// ---------------------------------------------------------------- productos
$rawItems = is_array($body['items'] ?? null) ? $body['items'] : [];
if (!$rawItems) bad('EMPTY_CART', 'Tu carrito está vacío');
if (count($rawItems) > 60) bad('TOO_MANY_ITEMS', 'El pedido tiene demasiados productos');

// Une líneas repetidas (mismo producto + talle + color)
$lines = [];
foreach ($rawItems as $it) {
    if (!is_array($it)) continue;
    $pid = str_field($it, 'productId', 30);
    $size = str_field($it, 'size', 15);
    $color = str_field($it, 'colorName', 80);
    $qty = (int)($it['quantity'] ?? 0);
    if ($pid === '' || $size === '' || $qty < 1 || $qty > 200) bad('INVALID_ITEM', 'Hay un producto inválido en el carrito');
    $k = "{$pid}|{$size}|{$color}";
    if (isset($lines[$k])) $lines[$k]['quantity'] += $qty;
    else $lines[$k] = ['productId' => $pid, 'size' => $size, 'color' => $color, 'quantity' => $qty];
}
$lines = array_values($lines);

$ids = array_values(array_unique(array_column($lines, 'productId')));
$in = implode(',', array_fill(0, count($ids), '?'));
$st = pdo()->prepare("SELECT id, name, image_src, price, wholesale_price, wholesale_min_qty, active FROM products WHERE id IN ($in)");
$st->execute($ids);
$products = [];
foreach ($st->fetchAll() as $p) $products[$p['id']] = $p;

// Modo del precio por mayor (CRM → opciones de la tienda)
$wholesaleMode = 'auto';
$sc = pdo()->prepare("SELECT data FROM site_content WHERE content_key = 'home_hero'");
$sc->execute();
if ($row = $sc->fetch()) {
    $data = json_decode((string)$row['data'], true);
    $m = $data['store']['wholesaleMode'] ?? 'auto';
    if (in_array($m, ['auto', 'info', 'off'], true)) $wholesaleMode = $m;
}
// Igual que lib/wholesale.ts: recargo sobre el precio por mayor cargado
const WHOLESALE_MARKUP = 0.1;

$qtyByProduct = [];
foreach ($lines as $l) $qtyByProduct[$l['productId']] = ($qtyByProduct[$l['productId']] ?? 0) + $l['quantity'];

// Stock pedido por cada "pozo" de stock (fila por color, o talle compartido)
$demand = [];
$subtotal = 0;
$units = 0;
foreach ($lines as &$l) {
    $p = $products[$l['productId']] ?? null;
    if (!$p || !(int)$p['active']) bad('PRODUCT_UNAVAILABLE', 'Uno de los productos ya no está disponible. Revisá tu carrito.', 409);

    $price = (float)$p['price'];
    $wsLoaded = (float)($p['wholesale_price'] ?? 0);
    if ($wholesaleMode === 'auto' && $wsLoaded > 0) {
        $ws = round($wsLoaded * (1 + WHOLESALE_MARKUP));
        $minQty = max(2, (int)($p['wholesale_min_qty'] ?? 2));
        if ($ws < $price && $qtyByProduct[$l['productId']] >= $minQty) $price = $ws;
    }
    $l['name'] = (string)$p['name'];
    $l['image'] = (string)$p['image_src'];
    $l['unitPrice'] = $price;
    $subtotal += $price * $l['quantity'];
    $units += $l['quantity'];

    $found = stock_rows_for($l['productId'], $l['color'], $l['size'], false);
    $poolKey = $found['perColor'] ? "{$l['productId']}|{$l['color']}|{$l['size']}" : "{$l['productId']}||{$l['size']}";
    $demand[$poolKey] ??= ['have' => array_sum(array_column($found['rows'], 'stock')), 'want' => 0, 'name' => $l['name'], 'size' => $l['size']];
    $demand[$poolKey]['want'] += $l['quantity'];
}
unset($l);
foreach ($demand as $d) {
    if ($d['want'] > $d['have']) {
        $left = max(0, $d['have']);
        bad('OUT_OF_STOCK', $left > 0
            ? "De \"{$d['name']}\" talle {$d['size']} quedan solo {$left}. Ajustá la cantidad en el carrito."
            : "\"{$d['name']}\" talle {$d['size']} se agotó. Sacalo del carrito para seguir.", 409);
    }
}

// ---------------------------------------------------------------- envío
$s = is_array($body['shipping'] ?? null) ? $body['shipping'] : [];
$cp = ep_normalize_cp((string)($s['postalCode'] ?? ''));
if ($cp === null) bad('INVALID_SHIPPING', 'Revisá el código postal');
$quoteId = str_field($s, 'quoteId', 80);
$quote = null;
foreach (ep_quotes($cp, $units) as $q) {
    if ($q['id'] === $quoteId) { $quote = $q; break; }
}
if (!$quote) bad('SHIPPING_CHANGED', 'La tarifa de envío cambió o ya no está disponible. Volvé a elegir el envío.', 409);

$destination = ['postalCode' => $cp];
if ($quote['mode'] === 'domicilio') {
    $a = is_array($s['address'] ?? null) ? $s['address'] : [];
    $destination += [
        'street'   => str_field($a, 'street', 150),
        'number'   => str_field($a, 'number', 20),
        'floor'    => str_field($a, 'floor', 40),
        'city'     => str_field($a, 'city', 100),
        'province' => str_field($a, 'province', 100),
        'notes'    => str_field($a, 'notes', 300),
    ];
    if ($destination['street'] === '' || $destination['number'] === '' || $destination['city'] === '' || $destination['province'] === '') {
        bad('INVALID_ADDRESS', 'Completá la dirección de entrega');
    }
} else {
    $branchId = str_field($s, 'branchId', 40);
    $branch = null;
    foreach (carrier_branches($quote['carrierId']) as $br) {
        if ((string)($br['id'] ?? '') === $branchId) { $branch = $br; break; }
    }
    if (!$branch) bad('INVALID_BRANCH', 'Elegí la sucursal donde vas a retirar');
    $destination['branch'] = [
        'id'      => $branchId,
        'name'    => (string)($branch['nombre'] ?? 'Sucursal'),
        'address' => trim(($branch['calle'] ?? '') . ' ' . ($branch['numero'] ?? '')),
        'city'    => (string)($branch['localidad']['nombre'] ?? ''),
    ];
}

$shippingCost = (float)$quote['price'];
$total = $subtotal + $shippingCost;

// ---------------------------------------------------------------- pedido
$orderNumber = 'TTN-' . date('Y') . '-' . strtoupper(bin2hex(random_bytes(4)));
$snapshot = [
    'buyer' => ['dni' => $buyer['dni']],
    'quote' => $quote,
    'destination' => $destination,
];
$shippingMethod = mb_substr($quote['carrier'] . ' · ' . ($quote['mode'] === 'sucursal' ? 'sucursal' : 'domicilio') . ($quote['service'] === 'prioritario' ? ' (prioritario)' : ''), 0, 80);

$pdo = pdo();
try {
    $pdo->beginTransaction();
    $pdo->prepare(
        'INSERT INTO orders (order_number, guest_email, guest_name, guest_phone, status, payment_method,
                             shipping_method, shipping_cost, subtotal, discount, total, currency, shipping_snapshot, notes)
         VALUES (?, ?, ?, ?, \'pending\', \'mercadopago\', ?, ?, ?, 0, ?, \'ARS\', ?, ?)'
    )->execute([
        $orderNumber,
        $buyer['email'],
        mb_substr($buyer['firstName'] . ' ' . $buyer['lastName'], 0, 160),
        $buyer['phone'],
        $shippingMethod,
        $shippingCost,
        $subtotal,
        $total,
        json_encode($snapshot, JSON_UNESCAPED_UNICODE),
        ($destination['notes'] ?? '') !== '' ? $destination['notes'] : null,
    ]);
    $orderId = (int)$pdo->lastInsertId();
    $ins = $pdo->prepare(
        'INSERT INTO order_items (order_id, product_id, product_name, variant_name, size, unit_price, quantity, subtotal_line)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    foreach ($lines as $l) {
        $ins->execute([
            $orderId, $l['productId'], $l['name'], $l['color'] !== '' ? $l['color'] : null, $l['size'],
            $l['unitPrice'], $l['quantity'], $l['unitPrice'] * $l['quantity'],
        ]);
    }
    order_event($orderId, 'pending', 'Pedido creado, esperando el pago en Mercado Pago');
    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('[checkout] ' . $e->getMessage());
    bad('DB_ERROR', 'No pudimos guardar tu pedido. Probá de nuevo en un momento.', 500);
}

// ---------------------------------------------------------------- Mercado Pago
$back = site_url() . '/checkout/resultado';
$mpItems = array_map(fn($l) => array_filter([
    'id'          => $l['productId'],
    'title'       => mb_substr(trim($l['name'] . ' · talle ' . $l['size'] . ($l['color'] !== '' ? ' · ' . $l['color'] : '')), 0, 250),
    'picture_url' => str_starts_with($l['image'], 'http') ? $l['image'] : null,
    'category_id' => 'fashion',
    'quantity'    => $l['quantity'],
    'currency_id' => 'ARS',
    'unit_price'  => (float)$l['unitPrice'],
], fn($v) => $v !== null), $lines);

$preference = [
    'items' => $mpItems,
    'payer' => [
        'name'           => $buyer['firstName'],
        'surname'        => $buyer['lastName'],
        'email'          => $buyer['email'],
        'identification' => ['type' => 'DNI', 'number' => $buyer['dni']],
    ],
    'shipments' => [
        'mode' => 'not_specified',
        'cost' => $shippingCost,
    ],
    'back_urls' => [
        'success' => $back,
        'pending' => $back,
        'failure' => $back,
    ],
    'external_reference'   => $orderNumber,
    'statement_descriptor' => 'TATAN KIDS',
    'notification_url'     => api_url() . '/mp-webhook.php',
    'metadata'             => ['order_number' => $orderNumber],
];
// Mercado Pago solo acepta volver solo (auto_return) a una dirección https
if (str_starts_with($back, 'https://')) $preference['auto_return'] = 'approved';
// El aviso de pago tiene que llegar a una dirección pública con https
if (!str_starts_with($preference['notification_url'], 'https://')) unset($preference['notification_url']);

[$status, $json] = mp_http('POST', '/checkout/preferences', $preference, $orderNumber);
$initPoint = is_array($json) ? (string)($json['init_point'] ?? '') : '';
if ($status < 200 || $status >= 300 || $initPoint === '') {
    error_log('[checkout] Mercado Pago ' . $status . ': ' . json_encode($json));
    $pdo->prepare("UPDATE orders SET status = 'cancelled', cancelled_at = NOW() WHERE id = ?")->execute([$orderId]);
    order_event($orderId, 'cancelled', 'No se pudo crear el pago en Mercado Pago (HTTP ' . $status . ')');
    bad('MP_ERROR', 'No pudimos conectar con Mercado Pago. Probá de nuevo en un momento.', 502);
}

order_event($orderId, 'pending', 'Preferencia de Mercado Pago: ' . (string)($json['id'] ?? ''));
send_json(['ok' => true, 'data' => [
    'orderNumber' => $orderNumber,
    'redirectUrl' => $initPoint,
    'total'       => $total,
]]);
