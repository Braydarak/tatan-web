<?php
/**
 * POST /api/contact.php
 *   Guarda el mensaje de contacto en la tabla `contact_messages` y lo manda
 *   por mail a la tienda (con "Responder" a quien escribió) y una
 *   confirmación a quien escribió. Los mails salen por SMTP (orders-lib.php).
 *
 * Campos aceptados (form o JSON): name, email, phone, reason, message
 *   website: campo trampa (los bots lo completan; las personas no lo ven)
 */
declare(strict_types=1);
require __DIR__ . '/config.php';
require_once __DIR__ . '/orders-lib.php';

if (method() !== 'POST') {
    send_json(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED'], 405);
}

$name    = trim((string)input('name', ''));
$email   = trim((string)input('email', ''));
$phone   = trim((string)input('phone', ''));
$reason  = strtolower(trim((string)input('reason', 'general')));
$message = trim((string)input('message', ''));

// Campo trampa: si viene completo es un bot; se responde OK sin guardar ni mandar nada
if (trim((string)input('website', '')) !== '') {
    send_json(['ok' => true, 'id' => 0, 'receivedAt' => gmdate('c')], 201);
}

$validReasons = ['general', 'pedido', 'cambios', 'mayorista', 'otro'];
if (!in_array($reason, $validReasons, true)) $reason = 'otro';

$errors = [];
if (mb_strlen($name) < 2)             $errors[] = 'NAME_TOO_SHORT';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'INVALID_EMAIL';
if (mb_strlen($message) < 5)          $errors[] = 'MESSAGE_TOO_SHORT';

if ($errors) {
    send_json(['ok' => false, 'errors' => $errors], 400);
}

// IP y user agent (sin warnings)
$ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? null;
if ($ip !== null) {
    $ip = explode(',', $ip)[0];
    $ip = trim($ip);
}
$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
if (mb_strlen($ua) > 500) $ua = mb_substr($ua, 0, 500);
if (mb_strlen((string)$ip) > 45) $ip = mb_substr((string)$ip, 0, 45);

// Límite simple contra abusos: 5 mensajes por mail y 15 por conexión por hora
$lim = pdo()->prepare('SELECT
    SUM(email = ?) AS by_email, SUM(ip = ?) AS by_ip
  FROM contact_messages WHERE created_at > NOW() - INTERVAL 1 HOUR');
$lim->execute([mb_substr($email, 0, 150), $ip]);
$counts = $lim->fetch() ?: [];
if ((int)($counts['by_email'] ?? 0) >= 5 || (int)($counts['by_ip'] ?? 0) >= 15) {
    send_json(['ok' => false, 'errors' => ['TOO_MANY']], 429);
}

$sql = "INSERT INTO contact_messages
  (name, email, phone, reason, message, ip, user_agent)
  VALUES (?,?,?,?,?,?,?)";
$stmt = pdo()->prepare($sql);
$stmt->execute([
    mb_substr($name, 0, 150),
    mb_substr($email, 0, 150),
    $phone !== '' ? mb_substr($phone, 0, 50) : null,
    $reason,
    $message,
    $ip,
    $ua,
]);

$insertId = (int)pdo()->lastInsertId();

// --- Mails (si fallan, el mensaje ya quedó guardado)
$reasonLabels = [
    'general'   => 'Consulta general',
    'pedido'    => 'Seguimiento de pedido',
    'cambios'   => 'Cambios y devoluciones',
    'mayorista' => 'Ventas mayoristas',
    'otro'      => 'Otro',
];
$reasonLabel = $reasonLabels[$reason] ?? 'Consulta';
$msgHtml = nl2br(e($message));
$mailed = false;
try {
    $storeHtml = order_mail_layout(
        "{$name} te escribió desde la web: {$reasonLabel}",
        'Nuevo mensaje de contacto 💌',
        '<strong>' . e($name) . '</strong> te escribió desde el formulario de la web.',
        $reasonLabel,
        mail_section('👶', 'Quién escribió', '#F3F8F5',
            '<strong>' . e($name) . '</strong><br><a href="mailto:' . e($email) . '" style="color:#3F3F46">' . e($email) . '</a>'
            . ($phone !== '' ? '<br>Tel: ' . e($phone) : ''))
        . mail_section('💬', 'Mensaje', '#FEF6EC', $msgHtml)
        . mail_button('mailto:' . rawurlencode($email) . '?subject=' . rawurlencode('Re: tu consulta en Tatan Kids'), 'Responder')
    );
    order_send_mail(order_notify_to(), "💌 Contacto · {$reasonLabel} · {$name}", $storeHtml, $email);

    $first = explode(' ', $name)[0] ?? '';
    $buyerHtml = order_mail_layout(
        'Recibimos tu mensaje. Te respondemos lo antes posible.',
        '¡Recibimos tu mensaje' . ($first !== '' ? ', ' . e($first) : '') . '!',
        'Gracias por escribirnos. Te respondemos a este mail lo antes posible.',
        $reasonLabel,
        mail_section('💬', 'Tu mensaje', '#FEF6EC', $msgHtml)
        . mail_button(MAIL_SITE . '/productos', 'Ver productos')
    );
    $mailed = order_send_mail($email, 'Recibimos tu mensaje · Tatan Kids 🧸', $buyerHtml, order_notify_to());
} catch (Throwable $e) {
    error_log('[contact] mails: ' . $e->getMessage());
}

send_json([
    'ok'         => true,
    'id'         => $insertId,
    'receivedAt' => gmdate('c'),
    'mailed'     => $mailed,
], 201);
