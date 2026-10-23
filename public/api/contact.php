<?php
/**
 * POST /api/contact.php
 *   Guarda el mensaje de contacto en la tabla `contact_messages`.
 *
 * Campos aceptados (form o JSON): name, email, phone, reason, message
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

if (method() !== 'POST') {
    send_json(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED'], 405);
}

$name    = trim((string)input('name', ''));
$email   = trim((string)input('email', ''));
$phone   = trim((string)input('phone', ''));
$reason  = strtolower(trim((string)input('reason', 'general')));
$message = trim((string)input('message', ''));

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

send_json([
    'ok'         => true,
    'id'         => $insertId,
    'receivedAt' => gmdate('c'),
], 201);
