<?php
/**
 * Categorías de productos (tabla `categories`).
 *
 * GET    /api/categories.php            → categorías visibles (públicas), en orden
 * GET    /api/categories.php?all=1      → todas, incluidas las ocultas (requiere sesión CRM)
 * POST   /api/categories.php            → crear      { label }                     (sesión CRM)
 * PUT    /api/categories.php?key=body   → modificar  { label?, active?, sortOrder? } (sesión CRM)
 * DELETE /api/categories.php?key=body   → borrar (solo si no tiene productos)       (sesión CRM)
 *
 * Cada categoría: { key, label, sortOrder, active, productCount }
 * La `key` se arma sola a partir del nombre y no cambia (se usa en las URLs:
 * /productos?c=body). Si se renombra, cambia solo el `label`.
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

function list_categories(bool $includeHidden): array {
    $where = $includeHidden ? '' : 'WHERE c.active = 1';
    $rows = pdo()->query(
        "SELECT c.`key`, c.label, c.sort_order AS sortOrder, c.active,
                (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.active = 1) AS productCount
         FROM categories c {$where}
         ORDER BY c.sort_order, c.id"
    )->fetchAll();
    return array_map(fn($r) => [
        'key'          => $r['key'],
        'label'        => $r['label'],
        'sortOrder'    => (int)$r['sortOrder'],
        'active'       => (bool)$r['active'],
        'productCount' => (int)$r['productCount'],
    ], $rows);
}

/** "Bodys de algodón" → "bodys-de-algodon" (máx. 30, solo a-z 0-9 y guiones). */
function slugify_key(string $label): string {
    $s = mb_strtolower(trim($label), 'UTF-8');
    $s = strtr($s, ['á'=>'a','é'=>'e','í'=>'i','ó'=>'o','ú'=>'u','ü'=>'u','ñ'=>'n','à'=>'a','è'=>'e','ì'=>'i','ò'=>'o','ù'=>'u']);
    $s = preg_replace('/[^a-z0-9]+/', '-', $s) ?? '';
    $s = trim($s, '-');
    return substr($s, 0, 30) ?: 'categoria';
}

function find_category(string $key): ?array {
    $st = pdo()->prepare("SELECT id, `key`, label, sort_order, active FROM categories WHERE `key` = ? LIMIT 1");
    $st->execute([$key]);
    $r = $st->fetch();
    return $r ?: null;
}

$method = method();

if ($method === 'GET') {
    $all = !empty($_GET['all']);
    if ($all) require_crm_auth();
    send_json(['ok' => true, 'data' => list_categories($all)]);
}

require_crm_auth();
$pdo = pdo();

if ($method === 'POST') {
    $label = trim((string)input('label', ''));
    if (mb_strlen($label) < 2 || mb_strlen($label) > 50) {
        send_json(['ok' => false, 'error' => 'INVALID_LABEL', 'message' => 'El nombre tiene que tener entre 2 y 50 letras'], 400);
    }
    $dup = $pdo->prepare("SELECT COUNT(*) FROM categories WHERE LOWER(label) = LOWER(?)");
    $dup->execute([$label]);
    if ((int)$dup->fetchColumn() > 0) {
        send_json(['ok' => false, 'error' => 'DUPLICATE', 'message' => 'Ya existe una categoría con ese nombre'], 409);
    }
    $base = slugify_key($label);
    $key = $base;
    for ($i = 2; find_category($key) !== null; $i++) {
        $key = substr($base, 0, 27) . '-' . $i;
    }
    $count = (int)$pdo->query("SELECT COUNT(*) FROM categories")->fetchColumn();
    if ($count >= 250) {
        send_json(['ok' => false, 'error' => 'TOO_MANY', 'message' => 'Llegaste al máximo de categorías'], 400);
    }
    $next = (int)$pdo->query("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories")->fetchColumn();
    $ins = $pdo->prepare("INSERT INTO categories (`key`, label, sort_order, active) VALUES (?, ?, ?, 1)");
    $ins->execute([$key, $label, min(255, $next)]);
    send_json(['ok' => true, 'key' => $key, 'data' => list_categories(true)], 201);
}

$key = isset($_GET['key']) ? trim((string)$_GET['key']) : '';
$cat = $key !== '' ? find_category($key) : null;
if (!$cat) send_json(['ok' => false, 'error' => 'NOT_FOUND', 'message' => 'No existe esa categoría'], 404);

if ($method === 'PUT') {
    $body = read_json_body();
    $sets = [];
    $vals = [];
    if (array_key_exists('label', $body)) {
        $label = trim((string)$body['label']);
        if (mb_strlen($label) < 2 || mb_strlen($label) > 50) {
            send_json(['ok' => false, 'error' => 'INVALID_LABEL', 'message' => 'El nombre tiene que tener entre 2 y 50 letras'], 400);
        }
        $sets[] = 'label = ?';
        $vals[] = $label;
    }
    if (array_key_exists('active', $body)) {
        $sets[] = 'active = ?';
        $vals[] = !empty($body['active']) ? 1 : 0;
    }
    if (array_key_exists('sortOrder', $body)) {
        $sets[] = 'sort_order = ?';
        $vals[] = min(255, max(0, (int)$body['sortOrder']));
    }
    if ($sets) {
        $vals[] = (int)$cat['id'];
        $pdo->prepare("UPDATE categories SET " . implode(', ', $sets) . " WHERE id = ?")->execute($vals);
    }
    send_json(['ok' => true, 'data' => list_categories(true)]);
}

if ($method === 'DELETE') {
    $st = $pdo->prepare("SELECT COUNT(*) FROM products WHERE category_id = ?");
    $st->execute([(int)$cat['id']]);
    $n = (int)$st->fetchColumn();
    if ($n > 0) {
        send_json([
            'ok'      => false,
            'error'   => 'HAS_PRODUCTS',
            'message' => "No se puede borrar: tiene {$n} producto(s). Movelos a otra categoría u ocultala.",
            'count'   => $n,
        ], 409);
    }
    $pdo->prepare("DELETE FROM categories WHERE id = ?")->execute([(int)$cat['id']]);
    send_json(['ok' => true, 'data' => list_categories(true)]);
}

send_json(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED'], 405);
