<?php
/**
 * ============================================================
 *   TATAN API PHP · arrepentimiento.php  (botón de arrepentimiento)
 * ============================================================
 *
 *   POST arrepentimiento.php
 *     body: { name, email, phone?, orderNumber?, purchaseDate?, products?, comment?, website? }
 *     → { ok: true, code: "ARR-20261122-A1B2C3", mailed: bool }
 *
 *   Resolución SCI 424/2020: el consumidor pide la revocación de su compra
 *   (art. 34 Ley 24.240, art. 1110 CCyC) sin registrarse, y el proveedor le
 *   informa un código de identificación dentro de las 24 horas por el mismo
 *   medio. Acá el código se da al instante: en pantalla y por mail.
 *
 *   La solicitud se guarda en contact_messages (motivo "cambios", con el
 *   código al principio del mensaje) y se avisa por mail a la tienda.
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/orders-lib.php';

if (method() !== 'POST') {
    send_json(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED'], 405);
}

$b = read_json_body();
$f = fn(string $k, int $max) => mb_substr(trim((string)($b[$k] ?? '')), 0, $max);

// Campo trampa: los bots lo completan, las personas no lo ven
if ($f('website', 200) !== '') {
    send_json(['ok' => true, 'code' => 'ARR-' . date('Ymd') . '-000000', 'mailed' => false]);
}

$name = $f('name', 150);
$email = mb_strtolower($f('email', 150));
$phone = preg_replace('/[^\d+ ()-]/', '', $f('phone', 40));
$orderNumber = strtoupper($f('orderNumber', 40));
$purchaseDate = $f('purchaseDate', 20);
$products = $f('products', 500);
$comment = $f('comment', 1000);

$errors = [];
if (mb_strlen($name) < 2) $errors[] = 'NAME';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'EMAIL';
if ($errors) send_json(['ok' => false, 'errors' => $errors], 400);

// Límite simple: hasta 5 solicitudes por mail en 24 h
$st = pdo()->prepare("SELECT COUNT(*) FROM contact_messages WHERE email = ? AND message LIKE 'BOTÓN DE ARREPENTIMIENTO%' AND created_at > NOW() - INTERVAL 1 DAY");
$st->execute([$email]);
if ((int)$st->fetchColumn() >= 5) {
    send_json(['ok' => false, 'error' => 'TOO_MANY', 'message' => 'Ya recibimos varias solicitudes de este mail hoy. Escribinos a ' . order_notify_to()], 429);
}

$code = 'ARR-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));
$lines = array_filter([
    'BOTÓN DE ARREPENTIMIENTO',
    "Código: {$code}",
    $orderNumber !== '' ? "Pedido: {$orderNumber}" : 'Pedido: (no indicado)',
    $purchaseDate !== '' ? "Fecha de compra/entrega: {$purchaseDate}" : null,
    $products !== '' ? "Productos: {$products}" : null,
    $comment !== '' ? "Comentario: {$comment}" : null,
]);
$message = implode("\n", $lines);

$ip = trim(explode(',', (string)($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? ''))[0]);
pdo()->prepare('INSERT INTO contact_messages (name, email, phone, reason, message, ip, user_agent) VALUES (?,?,?,?,?,?,?)')
    ->execute([$name, $email, $phone !== '' ? $phone : null, 'cambios', $message, mb_substr($ip, 0, 45), mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500)]);

// --- Mails (si fallan, el código ya se mostró en pantalla y la solicitud quedó guardada)
$detail = '<strong>Código:</strong> ' . e($code)
    . '<br><strong>Pedido:</strong> ' . ($orderNumber !== '' ? e($orderNumber) : 'no indicado')
    . ($purchaseDate !== '' ? '<br><strong>Fecha de compra/entrega:</strong> ' . e($purchaseDate) : '')
    . ($products !== '' ? '<br><strong>Productos:</strong> ' . e($products) : '')
    . ($comment !== '' ? '<br><strong>Comentario:</strong> ' . nl2br(e($comment)) : '');

$storeHtml = order_mail_layout(
    "Solicitud de arrepentimiento {$code}",
    'Botón de arrepentimiento',
    'Un cliente pidió revocar su compra. <strong>Hay que responderle y coordinar la devolución.</strong>',
    $code,
    mail_section('👶', 'Cliente', '#F3F8F5', '<strong>' . e($name) . '</strong><br><a href="mailto:' . e($email) . '" style="color:#3F3F46">' . e($email) . '</a>' . ($phone !== '' ? '<br>Tel: ' . e($phone) : ''))
    . mail_section('↩️', 'Solicitud', '#FEF6EC', $detail)
    . mail_section('⚖️', 'Qué dice la ley', '#F2F6FB', 'Plazo de 10 días corridos desde la entrega (art. 34 Ley 24.240). Los gastos de devolución son a cargo de la tienda y se reintegra el total pagado.')
);
$okStore = order_send_mail(order_notify_to(), "↩️ Arrepentimiento {$code} · " . $name, $storeHtml, $email);

$first = explode(' ', $name)[0] ?? '';
$buyerHtml = order_mail_layout(
    "Recibimos tu solicitud. Código {$code}",
    'Recibimos tu solicitud' . ($first !== '' ? ', ' . e($first) : ''),
    'Registramos tu pedido de arrepentimiento. Guardá este código: es el número de tu trámite.',
    $code,
    mail_section('↩️', 'Tu solicitud', '#FEF6EC', $detail)
    . mail_section('✨', '¿Qué sigue?', '#F3F8F5',
        'Te escribimos a este mail para coordinar la devolución del producto. Los gastos de envío de la devolución están a nuestro cargo y te reintegramos el total pagado por el mismo medio de pago.')
    . mail_button(MAIL_SITE . '/legal/cambios', 'Ver cambios y devoluciones')
);
$okBuyer = order_send_mail($email, "Tu solicitud de arrepentimiento · Código {$code}", $buyerHtml, order_notify_to());

send_json(['ok' => true, 'code' => $code, 'mailed' => $okBuyer, 'notified' => $okStore], 201);
