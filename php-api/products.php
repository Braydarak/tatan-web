<?php
/**
 * GET    /api/products.php            → lista todos los productos activos
 * GET    /api/products.php?id=b-001   → producto único
 * POST   /api/products.php            → crear (requiere sesión CRM)
 * PUT    /api/products.php?id=b-001   → actualizar (requiere sesión CRM)
 * DELETE /api/products.php?id=b-001   → borrar   (requiere sesión CRM)
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

/* ============================================================
 *  Helpers de consulta
 * ========================================================== */

/**
 * Carga un set de productos + joins (talles, galeria, colores, features, relacionados).
 * $whereSql con placeholders ?, $params array de valores.
 */
function fetch_products(string $whereSql, array $params = []): array {
    $pdo = pdo();
    $sql = "SELECT
        p.id, p.slug, p.name, p.tagline,
        p.image_src AS imageSrc,
        c.`key`    AS category,
        p.size_group AS sizeGroup,
        p.color_hex  AS colorHex,
        p.description,
        p.price,
        p.original_price AS originalPrice,
        p.installments,
        p.tax_free_price AS taxFreePrice,
        p.show_points_badge AS showPointsBadge,
        p.rating,
        p.reviews_count AS reviews,
        p.sold_total    AS soldTotal,
        p.active,
        p.created_at    AS createdAt,
        p.updated_at    AS updatedAt
      FROM products p
      JOIN categories c ON c.id = p.category_id
      {$whereSql}
      ORDER BY
        FIELD(c.`key`,'body','remera','pijama','set','pantalon','buzo','accesorio'),
        p.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $products = $stmt->fetchAll();
    if (!$products) return [];

    $ids = array_values(array_unique(array_map(fn($r) => $r['id'], $products)));
    $in  = implode(',', array_fill(0, count($ids), '?'));

    // sizes + stock
    $s = $pdo->prepare("SELECT product_id, size, stock FROM product_sizes_stock WHERE product_id IN ($in)");
    $s->execute($ids);
    $sizesBy = [];
    foreach ($s->fetchAll() as $r) {
        $sizesBy[$r['product_id']][] = $r;
    }

    // galeria
    $g = $pdo->prepare("SELECT product_id, image_src, sort_order FROM product_gallery_images WHERE product_id IN ($in) ORDER BY sort_order, id");
    $g->execute($ids);
    $galleryBy = [];
    foreach ($g->fetchAll() as $r) {
        $galleryBy[$r['product_id']][] = $r['image_src'];
    }

    // colores
    $co = $pdo->prepare("SELECT product_id, name, hex, sort_order FROM product_color_variants WHERE product_id IN ($in) ORDER BY sort_order, id");
    $co->execute($ids);
    $colorsBy = [];
    foreach ($co->fetchAll() as $r) {
        $colorsBy[$r['product_id']][] = ['name' => $r['name'], 'hex' => $r['hex']];
    }

    // features
    $f = $pdo->prepare("SELECT product_id, feature, sort_order FROM product_features WHERE product_id IN ($in) ORDER BY sort_order, id");
    $f->execute($ids);
    $featuresBy = [];
    foreach ($f->fetchAll() as $r) {
        $featuresBy[$r['product_id']][] = $r['feature'];
    }

    // relacionados
    $rel = $pdo->prepare("SELECT product_id, related_product_id, sort_order FROM product_related WHERE product_id IN ($in) ORDER BY sort_order");
    $rel->execute($ids);
    $relatedBy = [];
    foreach ($rel->fetchAll() as $r) {
        $relatedBy[$r['product_id']][] = $r['related_product_id'];
    }

    $out = [];
    foreach ($products as $p) {
        $sizeRows = $sizesBy[$p['id']] ?? [];
        $stock = [];
        $sizes = [];
        foreach ($sizeRows as $r) {
            $sizes[] = $r['size'];
            $stock[$r['size']] = (int)$r['stock'];
        }
        $out[] = [
            'id'               => $p['id'],
            'slug'             => $p['slug'],
            'name'             => $p['name'],
            'tagline'          => $p['tagline'],
            'imageSrc'         => $p['imageSrc'],
            'category'         => $p['category'],
            'sizeGroup'        => $p['sizeGroup'],
            'sizes'            => $sizes,
            'stockBySize'      => (object)$stock,
            'colorHex'         => $p['colorHex'],
            'description'      => $p['description'],
            'price'            => (float)$p['price'],
            'originalPrice'    => $p['originalPrice'] === null ? null : (float)$p['originalPrice'],
            'installments'     => (int)$p['installments'],
            'taxFreePrice'     => $p['taxFreePrice'] === null ? null : (float)$p['taxFreePrice'],
            'showPointsBadge'  => (bool)$p['showPointsBadge'],
            'rating'           => (float)$p['rating'],
            'reviews'          => (int)$p['reviews'],
            'soldTotal'        => (int)$p['soldTotal'],
            'active'           => (bool)$p['active'],
            'gallery'          => $galleryBy[$p['id']]  ?? [],
            'colorVariants'    => $colorsBy[$p['id']]   ?? [],
            'features'         => $featuresBy[$p['id']] ?? [],
            'relatedIds'       => $relatedBy[$p['id']]  ?? [],
            'createdAt'        => $p['createdAt'],
            'updatedAt'        => $p['updatedAt'],
        ];
    }
    return $out;
}

function category_by_key(string $key): ?array {
    static $cache = null;
    if ($cache === null) {
        $rows = pdo()->query("SELECT id, `key`, label FROM categories WHERE active = 1")->fetchAll();
        $cache = [];
        foreach ($rows as $r) $cache[$r['key']] = $r;
    }
    return $cache[$key] ?? null;
}

function generate_id(string $categoryKey): string {
    $prefix = $categoryKey[0] ?? 'p';
    return sprintf('%s-%04d', $prefix, random_int(1000, 9999));
}

function insert_child_rows(string $id, array $body): void {
    $pdo = pdo();

    // sizes + stock
    $sizes = $body['sizes'] ?? [];
    $stock = (array)($body['stockBySize'] ?? []);
    if ($sizes) {
        $stmt = $pdo->prepare("INSERT INTO product_sizes_stock (product_id, size, stock) VALUES (?,?,?)");
        foreach ($sizes as $sz) {
            $stmt->execute([$id, $sz, (int)($stock[$sz] ?? 0)]);
        }
    }

    // galeria
    $gallery = $body['gallery'] ?? [];
    if ($gallery) {
        $stmt = $pdo->prepare("INSERT INTO product_gallery_images (product_id, image_src, sort_order) VALUES (?,?,?)");
        foreach (array_values($gallery) as $i => $src) {
            $stmt->execute([$id, $src, $i]);
        }
    }

    // color variants
    $colors = $body['colorVariants'] ?? [];
    if ($colors) {
        $stmt = $pdo->prepare("INSERT INTO product_color_variants (product_id, name, hex, sort_order) VALUES (?,?,?,?)");
        foreach (array_values($colors) as $i => $c) {
            $stmt->execute([
                $id,
                is_array($c) ? ($c['name'] ?? 'Color') : 'Color',
                is_array($c) ? ($c['hex']  ?? '#ffffff') : '#ffffff',
                $i,
            ]);
        }
    }

    // features
    $features = $body['features'] ?? [];
    if ($features) {
        $stmt = $pdo->prepare("INSERT INTO product_features (product_id, feature, sort_order) VALUES (?,?,?)");
        foreach (array_values($features) as $i => $f) {
            $stmt->execute([$id, $f, $i]);
        }
    }

    // relacionados (INSERT IGNORE para no fallar si un producto destino aún no existe - FK lo atrapará o lo saltará)
    $related = $body['relatedIds'] ?? [];
    if ($related) {
        $stmt = $pdo->prepare("INSERT IGNORE INTO product_related (product_id, related_product_id, sort_order) VALUES (?,?,?)");
        foreach (array_values($related) as $i => $r) {
            $stmt->execute([$id, $r, $i]);
        }
    }
}

function delete_child_rows(string $id): void {
    $pdo = pdo();
    $pdo->prepare("DELETE FROM product_sizes_stock WHERE product_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM product_gallery_images WHERE product_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM product_color_variants   WHERE product_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM product_features        WHERE product_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM product_related         WHERE product_id = ?")->execute([$id]);
}

/* ============================================================
 *  Ruteo
 * ========================================================== */

$method = method();
$id     = input('id', null);

if ($method === 'GET') {
    if ($id !== null) {
        $data = fetch_products("WHERE p.id = ?", [$id]);
        if (!$data) send_json(['ok' => false, 'error' => 'NOT_FOUND'], 404);
        send_json(['ok' => true, 'count' => 1, 'data' => $data[0]]);
    }
    $data = fetch_products("WHERE p.active = 1");
    send_json(['ok' => true, 'count' => count($data), 'data' => $data]);
}

if ($method === 'POST' || $method === 'PUT' || $method === 'DELETE') {
    require_crm_auth();
}

if ($method === 'POST') {
    $body = read_json_body();
    if (!$body) send_json(['ok' => false, 'error' => 'INVALID_JSON'], 400);

    $cat = category_by_key((string)($body['category'] ?? ''));
    if (!$cat) send_json(['ok' => false, 'error' => 'INVALID_CATEGORY'], 400);
    if (empty($body['name']) || empty($body['imageSrc']) || !isset($body['price'])) {
        send_json(['ok' => false, 'error' => 'MISSING_FIELDS'], 400);
    }
    $id = (!empty($body['id']) && is_string($body['id'])) ? trim($body['id']) : generate_id((string)$body['category']);

    // existencia
    $chk = pdo()->prepare("SELECT COUNT(*) AS c FROM products WHERE id = ?");
    $chk->execute([$id]);
    if ((int)$chk->fetchColumn() > 0) {
        send_json(['ok' => false, 'error' => 'DUPLICATE_ID', 'id' => $id], 409);
    }

    $pdo = pdo();
    $pdo->beginTransaction();
    try {
        $ins = $pdo->prepare("INSERT INTO products
            (id, slug, name, tagline, image_src, category_id, size_group, color_hex, description,
             price, original_price, installments, tax_free_price, show_points_badge, rating, reviews_count, sold_total, active)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
        $ins->execute([
            $id,
            !empty($body['slug']) ? trim((string)$body['slug']) : null,
            $body['name'],
            $body['tagline'] ?? null,
            $body['imageSrc'],
            (int)$cat['id'],
            ($body['sizeGroup'] ?? 'ninios') === 'bebe' ? 'bebe' : 'ninios',
            $body['colorHex'] ?? '#ffffff',
            $body['description'] ?? null,
            (float)$body['price'],
            array_key_exists('originalPrice', $body) && $body['originalPrice'] !== null ? (float)$body['originalPrice'] : null,
            (int)($body['installments'] ?? 1),
            array_key_exists('taxFreePrice', $body) && $body['taxFreePrice'] !== null ? (float)$body['taxFreePrice'] : null,
            !empty($body['showPointsBadge']) ? 1 : 0,
            (float)($body['rating'] ?? 5),
            (int)($body['reviews'] ?? 0),
            (int)($body['soldTotal'] ?? 0),
            !array_key_exists('active', $body) || !empty($body['active']) ? 1 : 0,
        ]);

        insert_child_rows($id, $body);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        send_json(['ok' => false, 'error' => 'DB_ERROR', 'msg' => $e->getMessage()], 500);
    }

    $created = fetch_products("WHERE p.id = ?", [$id]);
    send_json(['ok' => true, 'data' => $created[0] ?? null], 201);
}

if ($method === 'PUT') {
    if ($id === null) send_json(['ok' => false, 'error' => 'MISSING_ID'], 400);
    $body = read_json_body();
    if (!$body) send_json(['ok' => false, 'error' => 'INVALID_JSON'], 400);

    $cat = category_by_key((string)($body['category'] ?? ''));
    if (!$cat) send_json(['ok' => false, 'error' => 'INVALID_CATEGORY'], 400);

    $chk = pdo()->prepare("SELECT COUNT(*) AS c FROM products WHERE id = ?");
    $chk->execute([$id]);
    if ((int)$chk->fetchColumn() === 0) send_json(['ok' => false, 'error' => 'NOT_FOUND'], 404);

    $pdo = pdo();
    $pdo->beginTransaction();
    try {
        $upd = $pdo->prepare("UPDATE products SET
            slug=?, name=?, tagline=?, image_src=?, category_id=?, size_group=?, color_hex=?,
            description=?, price=?, original_price=?, installments=?, tax_free_price=?,
            show_points_badge=?, rating=?, reviews_count=?, sold_total=?, active=?,
            updated_at=NOW()
          WHERE id=?");
        $upd->execute([
            !empty($body['slug']) ? trim((string)$body['slug']) : null,
            $body['name'],
            $body['tagline'] ?? null,
            $body['imageSrc'],
            (int)$cat['id'],
            ($body['sizeGroup'] ?? 'ninios') === 'bebe' ? 'bebe' : 'ninios',
            $body['colorHex'] ?? '#ffffff',
            $body['description'] ?? null,
            (float)$body['price'],
            array_key_exists('originalPrice', $body) && $body['originalPrice'] !== null ? (float)$body['originalPrice'] : null,
            (int)($body['installments'] ?? 1),
            array_key_exists('taxFreePrice', $body) && $body['taxFreePrice'] !== null ? (float)$body['taxFreePrice'] : null,
            !empty($body['showPointsBadge']) ? 1 : 0,
            (float)($body['rating'] ?? 5),
            (int)($body['reviews'] ?? 0),
            (int)($body['soldTotal'] ?? 0),
            !array_key_exists('active', $body) || !empty($body['active']) ? 1 : 0,
            $id,
        ]);

        delete_child_rows($id);
        insert_child_rows($id, $body);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        send_json(['ok' => false, 'error' => 'DB_ERROR', 'msg' => $e->getMessage()], 500);
    }

    $updated = fetch_products("WHERE p.id = ?", [$id]);
    send_json(['ok' => true, 'data' => $updated[0] ?? null]);
}

if ($method === 'DELETE') {
    if ($id === null) send_json(['ok' => false, 'error' => 'MISSING_ID'], 400);

    $chk = pdo()->prepare("SELECT COUNT(*) AS c FROM products WHERE id = ?");
    $chk->execute([$id]);
    if ((int)$chk->fetchColumn() === 0) send_json(['ok' => false, 'error' => 'NOT_FOUND'], 404);

    pdo()->prepare("DELETE FROM products WHERE id = ?")->execute([$id]);
    send_json(['ok' => true, 'id' => $id]);
}

send_json(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED'], 405);
