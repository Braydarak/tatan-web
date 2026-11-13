<?php
/**
 * ============================================================
 *   TATAN API PHP · checkout.php  (crear el pago con Mercado Pago)
 * ============================================================
 *
 *   El pago se hace dentro de la web (Payment Brick de Mercado Pago), en
 *   dos pasos:
 *
 *   1) POST checkout.php?action=create
 *        body: {
 *          buyer:    { email, firstName, lastName, phone, dni },
 *          items:    [{ productId, size, colorName?, quantity }],
 *          shipping: { quoteId, postalCode, address?: {...}, branchId? }
 *        }
 *        → { ok: true, data: { orderNumber, total, subtotal, shipping } }
 *
 *      No se confía en nada de precios que mande el navegador: el servidor
 *      lee precios y stock de la base, vuelve a cotizar el envío en
 *      Enviopack y guarda el pedido como "pending".
 *
 *   2) POST checkout.php?action=pay
 *        body: { orderNumber, formData }   (formData = lo que da el Brick)
 *        → { ok: true, data: { orderNumber, status, statusDetail, ticketUrl? } }
 *
 *      Cobra con /v1/payments por el total guardado en el pedido (no por lo
 *      que diga el navegador). Si el pago se aprueba, el pedido pasa a
 *      "paid" y se descuenta el stock. mp-webhook.php confirma los cambios
 *      posteriores (p. ej. un pago en efectivo que se acredita después).
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/mercadopago.php';
require_once __DIR__ . '/enviopack.php';

// Para comprobar qué versión está subida: GET checkout.php?action=version
const CHECKOUT_VERSION = '2026-11-13-brick-2';
if (method() === 'GET' && ($_GET['action'] ?? '') === 'version') {
    send_json(['ok' => true, 'version' => CHECKOUT_VERSION]);
}

if (method() !== 'POST') {
    send_json(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED', 'message' => 'checkout.php solo acepta POST'], 405);
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
$action = (string)($_GET['action'] ?? 'create');

if ($action === 'pay') {
    pay_order($body);
}
if ($action !== 'create') {
    bad('UNKNOWN_ACTION', 'Acción desconocida');
}

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

send_json(['ok' => true, 'data' => [
    'orderNumber' => $orderNumber,
    'subtotal'    => $subtotal,
    'shipping'    => $shippingCost,
    'total'       => $total,
]]);

// ---------------------------------------------------------------- cobrar

/** Mensaje para el comprador según por qué Mercado Pago rechazó el pago. */
function rejection_message(string $detail): string
{
    return match ($detail) {
        'cc_rejected_insufficient_amount'      => 'La tarjeta no tiene saldo suficiente. Probá con otra.',
        'cc_rejected_bad_filled_security_code' => 'Revisá el código de seguridad de la tarjeta.',
        'cc_rejected_bad_filled_date'          => 'Revisá la fecha de vencimiento de la tarjeta.',
        'cc_rejected_bad_filled_card_number',
        'cc_rejected_bad_filled_other'         => 'Revisá los datos de la tarjeta.',
        'cc_rejected_call_for_authorize'       => 'Tu banco tiene que autorizar el pago: llamalo y volvé a intentar, o usá otra tarjeta.',
        'cc_rejected_card_disabled'            => 'La tarjeta está deshabilitada: activala con tu banco o usá otra.',
        'cc_rejected_duplicated_payment'       => 'Ya hiciste un pago por este monto. Si necesitás pagar de nuevo, usá otra tarjeta.',
        'cc_rejected_high_risk',
        'rejected_high_risk'                   => 'Mercado Pago rechazó el pago por seguridad. Probá con otro medio de pago.',
        'cc_rejected_max_attempts'             => 'Llegaste al límite de intentos con esta tarjeta. Probá con otra.',
        'cc_rejected_invalid_installments'     => 'La tarjeta no acepta esa cantidad de cuotas.',
        default                                 => 'El pago fue rechazado. Probá con otra tarjeta u otro medio de pago.',
    };
}

/** Cobra un pedido "pending" con los datos del Payment Brick. */
function pay_order(array $body): never
{
    $orderNumber = trim((string)($body['orderNumber'] ?? ''));
    $form = is_array($body['formData'] ?? null) ? $body['formData'] : [];
    if (!preg_match('/^TTN-\d{4}-[A-F0-9]{8}$/', $orderNumber)) bad('INVALID_ORDER', 'Pedido inválido');

    $st = pdo()->prepare('SELECT id, status, total, guest_email, guest_name, shipping_snapshot FROM orders WHERE order_number = ?');
    $st->execute([$orderNumber]);
    $order = $st->fetch();
    if (!$order) bad('INVALID_ORDER', 'No encontramos tu pedido. Volvé a empezar la compra.', 404);
    if (in_array($order['status'], ['paid', 'shipped', 'delivered'], true)) {
        send_json(['ok' => true, 'data' => ['orderNumber' => $orderNumber, 'status' => 'approved', 'statusDetail' => 'already_paid']]);
    }
    // "cancelled" = un intento anterior fue rechazado: se puede volver a intentar
    if (!in_array($order['status'], ['pending', 'cancelled'], true)) {
        bad('ORDER_CLOSED', 'Este pedido ya no se puede pagar. Volvé a empezar la compra.', 409);
    }

    $methodId = preg_replace('/[^a-z0-9_]/i', '', (string)($form['payment_method_id'] ?? ''));
    if ($methodId === '') bad('INVALID_PAYMENT', 'Elegí un medio de pago');
    // Sin "dinero en cuenta": ese medio lleva a la página de Mercado Pago
    if ($methodId === 'account_money') bad('INVALID_PAYMENT', 'Ese medio de pago no está disponible');

    $snapshot = json_decode((string)($order['shipping_snapshot'] ?? ''), true) ?: [];
    $formPayer = is_array($form['payer'] ?? null) ? $form['payer'] : [];
    $idType = preg_replace('/[^A-Z]/', '', strtoupper((string)($formPayer['identification']['type'] ?? 'DNI'))) ?: 'DNI';
    $idNumber = preg_replace('/\D/', '', (string)($formPayer['identification']['number'] ?? '')) ?: (string)($snapshot['buyer']['dni'] ?? '');
    $names = explode(' ', (string)$order['guest_name'], 2);

    $payment = [
        // El monto sale del pedido guardado, no del navegador
        'transaction_amount' => round((float)$order['total'], 2),
        'payment_method_id'  => $methodId,
        'description'        => "Pedido {$orderNumber} · Tatan Kids",
        'external_reference' => $orderNumber,
        'statement_descriptor' => 'TATAN KIDS',
        'payer' => [
            // El email lo puede cambiar en el Brick (p. ej. para el cupón); si no, el del pedido
            'email' => filter_var($formPayer['email'] ?? '', FILTER_VALIDATE_EMAIL) ?: (string)$order['guest_email'],
            'first_name' => (string)($formPayer['first_name'] ?? $names[0] ?? ''),
            'last_name'  => (string)($formPayer['last_name'] ?? $names[1] ?? ''),
            'identification' => ['type' => $idType, 'number' => $idNumber],
        ],
        'metadata' => ['order_number' => $orderNumber],
    ];
    $token = (string)($form['token'] ?? '');
    if ($token !== '') {
        $payment['token'] = $token;
        $payment['installments'] = max(1, (int)($form['installments'] ?? 1));
        // Mercado Pago espera un número
        if (!empty($form['issuer_id']) && ctype_digit((string)$form['issuer_id'])) $payment['issuer_id'] = (int)$form['issuer_id'];
    }
    $notify = api_url() . '/mp-webhook.php';
    if (str_starts_with($notify, 'https://')) $payment['notification_url'] = $notify;

    // Una clave por intento: si el navegador reintenta el mismo envío, no se cobra dos veces
    $attempt = preg_replace('/[^a-zA-Z0-9-]/', '', (string)($body['attemptId'] ?? '')) ?: bin2hex(random_bytes(8));
    [$status, $pay] = mp_http('POST', '/v1/payments', $payment, "{$orderNumber}-{$attempt}");
    if ($status < 200 || $status >= 300 || !is_array($pay) || empty($pay['id'])) {
        error_log('[checkout] /v1/payments ' . $status . ': ' . json_encode($pay));
        $msg = is_array($pay) ? (string)($pay['message'] ?? '') : '';
        $causes = is_array($pay['cause'] ?? null) ? $pay['cause'] : [];
        $codes = array_values(array_filter(array_map(fn($c) => is_array($c) ? (string)($c['code'] ?? '') : '', $causes)));
        order_event((int)$order['id'], (string)$order['status'], 'Mercado Pago no aceptó el pago (HTTP ' . $status . ') ' . mb_substr($msg . ' ' . implode(',', $codes), 0, 200));
        $userMsg = 'No pudimos procesar el pago. Revisá los datos o probá con otro medio de pago.';
        // Credenciales de prueba + email de una cuenta real (o de la vendedora)
        if (stripos($msg, 'live credentials') !== false || in_array('7', $codes, true)) {
            $userMsg = 'Pago de prueba rechazado: con las credenciales de prueba, el email del comprador tiene que ser el de una cuenta COMPRADORA de prueba de Mercado Pago.';
        }
        send_json([
            'ok'      => false,
            'error'   => 'PAYMENT_ERROR',
            'message' => $userMsg,
            // Motivo que da Mercado Pago (para diagnosticar; no tiene datos de la tarjeta)
            'mp'      => ['status' => $status, 'message' => $msg, 'codes' => $codes],
        ], 502);
    }

    $res = apply_payment($pay);
    $mpStatus = (string)($pay['status'] ?? '');
    $detail = (string)($pay['status_detail'] ?? '');
    $out = [
        'orderNumber'  => $orderNumber,
        'status'       => $mpStatus === 'approved' ? 'approved' : (in_array($mpStatus, ['pending', 'in_process', 'authorized'], true) ? 'pending' : 'rejected'),
        'statusDetail' => $detail,
        'orderStatus'  => $res['status'] ?? null,
    ];
    if ($out['status'] === 'rejected') $out['message'] = rejection_message($detail);
    // Efectivo (Rapipago / Pago Fácil): link al cupón para imprimir o mostrar
    $ticket = (string)($pay['transaction_details']['external_resource_url'] ?? '');
    if ($ticket !== '') $out['ticketUrl'] = $ticket;
    send_json(['ok' => true, 'data' => $out]);
}
