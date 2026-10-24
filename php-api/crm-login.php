<?php
/**
 * POST /api/crm-login.php
 *   Form fields  : user, password
 *   JSON body    : {"user":"...","password":"..."}
 *
 * Cookie HTTP-only TATANCRMSESSID se setea al loguear OK.
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

if (method() !== 'POST') {
    send_json(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED'], 405);
}

$user     = trim((string)input('user', ''));
$password = (string)input('password', '');

$userOk     = mb_strlen($user) >= 2;
$passwordOk = mb_strlen($password) >= 4;

if (!$userOk || !$passwordOk) {
    send_json(['ok' => false, 'userOk' => $userOk, 'passwordOk' => $passwordOk], 401);
}

$sql = "SELECT id, username, password_hash, name, email, role
        FROM admins
        WHERE username = ?
        LIMIT 1";
$stmt = pdo()->prepare($sql);
$stmt->execute([$user]);
$admin = $stmt->fetch();

if (!$admin) {
    send_json(['ok' => false, 'userOk' => false, 'passwordOk' => true], 401);
}

if (!password_verify($password, (string)$admin['password_hash'])) {
    send_json(['ok' => false, 'userOk' => true, 'passwordOk' => false], 401);
}

// Actualizar último login
$upd = pdo()->prepare("UPDATE admins SET last_login_at = NOW() WHERE id = ?");
$upd->execute([(int)$admin['id']]);

crm_login($admin);

send_json([
    'ok'    => true,
    'admin' => [
        'username' => $admin['username'],
        'name'     => $admin['name']  ?? null,
        'email'    => $admin['email'] ?? null,
        'role'     => $admin['role']  ?? 'editor',
    ],
]);
