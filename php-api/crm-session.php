<?php
/**
 * GET  /api/crm-session.php  → estado de la sesión actual
 * POST /api/crm-session.php  → cerrar sesión (logout)
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

$method = method();

if ($method === 'POST') {
    crm_logout();
    send_json(['ok' => true]);
}

if ($method === 'GET') {
    $admin = crm_current();
    if (!$admin) {
        send_json(['authenticated' => false, 'admin' => null]);
    }
    send_json([
        'authenticated' => true,
        'admin'         => [
            'id'       => $admin['id'],
            'username' => $admin['username'],
            'name'     => $admin['name']  ?? null,
            'email'    => $admin['email'] ?? null,
            'role'     => $admin['role']  ?? 'editor',
        ],
    ]);
}

send_json(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED'], 405);
