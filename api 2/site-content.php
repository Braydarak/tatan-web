<?php
/**
 * GET  /api/site-content.php                → todas las keys (home_hero, envios)
 * GET  /api/site-content.php?key=home_hero  → una sola key
 * PUT  /api/site-content.php?key=home_hero  → guardar / versionar  (requiere sesión CRM)
 *   JSON body: { data: { ... } }  (o el objeto directo)
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

$VALID = ['home_hero', 'envios'];
$method = method();
$key    = input('key', null);

if ($method === 'GET') {
    if ($key !== null) {
        if (!in_array($key, $VALID, true)) {
            send_json(['ok' => false, 'error' => 'INVALID_KEY'], 400);
        }
        $stmt = pdo()->prepare("SELECT content_key, data, version, updated_at FROM site_content WHERE content_key = ?");
        $stmt->execute([$key]);
        $row = $stmt->fetch();
        if (!$row) send_json(['ok' => false, 'error' => 'NOT_FOUND'], 404);
        send_json([
            'ok'        => true,
            'key'       => $row['content_key'],
            'data'      => json_decode((string)$row['data'], true),
            'version'   => (int)$row['version'],
            'updatedAt' => $row['updated_at'],
        ]);
    }

    $rows = pdo()->query("SELECT content_key, data, version, updated_at FROM site_content")->fetchAll();
    $byKey = [];
    foreach ($rows as $r) {
        $byKey[$r['content_key']] = [
            'data'      => json_decode((string)$r['data'], true),
            'version'   => (int)$r['version'],
            'updatedAt' => $r['updated_at'],
        ];
    }
    send_json(['ok' => true, 'count' => count($rows), 'byKey' => (object)$byKey]);
}

if ($method === 'PUT') {
    $admin = require_crm_auth();
    if ($key === null || !in_array($key, $VALID, true)) {
        send_json(['ok' => false, 'error' => 'INVALID_KEY'], 400);
    }

    $body = read_json_body();
    $data = array_key_exists('data', $body) ? $body['data'] : $body;
    if ($data === null) send_json(['ok' => false, 'error' => 'INVALID_JSON'], 400);

    $jsonData = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($jsonData === false) send_json(['ok' => false, 'error' => 'JSON_ENCODE_FAILED'], 400);

    $pdo = pdo();
    $chk = $pdo->prepare("SELECT COUNT(*) AS c FROM site_content WHERE content_key = ?");
    $chk->execute([$key]);
    $existe = (int)$chk->fetchColumn() > 0;

    if ($existe) {
        $upd = $pdo->prepare("UPDATE site_content SET data = ?, version = version + 1, updated_by = ?, updated_at = NOW() WHERE content_key = ?");
        $upd->execute([$jsonData, (int)$admin['id'], $key]);
    } else {
        $ins = $pdo->prepare("INSERT INTO site_content (content_key, data, version, updated_by) VALUES (?,?,1,?)");
        $ins->execute([$key, $jsonData, (int)$admin['id']]);
    }

    $row = $pdo->prepare("SELECT data, version, updated_at FROM site_content WHERE content_key = ?");
    $row->execute([$key]);
    $r = $row->fetch();

    send_json([
        'ok'        => true,
        'key'       => $key,
        'data'      => $r ? json_decode((string)$r['data'], true) : null,
        'version'   => $r ? (int)$r['version'] : null,
        'updatedAt' => $r ? $r['updated_at'] : null,
    ]);
}

send_json(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED'], 405);
