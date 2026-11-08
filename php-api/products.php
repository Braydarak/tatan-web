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
 * ¿Ya se corrió la migración del precio por mayor?
 * (migrations/2026-11-07-mayorista-y-combinaciones.sql). Mientras no exista
 * la columna, la API funciona igual que antes y simplemente no la usa.
 */
/** ¿Ya se corrió la migración de modelos (sku/foto por variante)? */
function has_variant_columns(): bool {
    static $has = null;
    if ($has === null) {
        try {
            $has = (bool)pdo()->query("SHOW COLUMNS FROM product_color_variants LIKE 'sku'")->fetch();
        } catch (Throwable $e) {
            $has = false;
        }
    }
    return $has;
}

/** ¿Ya se corrió la migración de stock por color (migrations/2026-11-08-stock-por-color.sql)? */
function has_stock_color_column(): bool {
    static $has = null;
    if ($has === null) {
        try {
            $has = (bool)pdo()->query("SHOW COLUMNS FROM product_sizes_stock LIKE 'color'")->fetch();
        } catch (Throwable $e) {
            $has = false;
        }
    }
    return $has;
}

function has_wholesale_columns(): bool {
    static $has = null;
    if ($has === null) {
        try {
            $has = (bool)pdo()->query("SHOW COLUMNS FROM products LIKE 'wholesale_price'")->fetch();
        } catch (Throwable $e) {
            $has = false;
        }
    }
    return $has;
}

/**
 * Carga un set de productos + joins (talles, galeria, colores, features, relacionados).
 * $whereSql con placeholders ?, $params array de valores.
 */
function fetch_products(string $whereSql, array $params = []): array {
    $pdo = pdo();
    $wholesaleSql = has_wholesale_columns()
        ? "p.wholesale_price AS wholesalePrice, p.wholesale_min_qty AS wholesaleMinQty,"
        : "NULL AS wholesalePrice, NULL AS wholesaleMinQty,";
    $sql = "SELECT
        p.id, p.slug, p.name, p.tagline,
        p.image_src AS imageSrc,
        c.`key`    AS category,
        p.size_group AS sizeGroup,
        p.color_hex  AS colorHex,
        p.description,
        p.price,
        p.original_price AS originalPrice,
        {$wholesaleSql}
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
        c.sort_order, c.id,
        p.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $products = $stmt->fetchAll();
    if (!$products) return [];

    $ids = array_values(array_unique(array_map(fn($r) => $r['id'], $products)));
    $in  = implode(',', array_fill(0, count($ids), '?'));

    // sizes + stock (por color si la migración ya corrió)
    $colorCol = has_stock_color_column() ? "color" : "'' AS color";
    $s = $pdo->prepare("SELECT product_id, {$colorCol}, size, stock FROM product_sizes_stock WHERE product_id IN ($in) ORDER BY id");
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
    $variantCols = has_variant_columns() ? ", sku, image_src" : "";
    $co = $pdo->prepare("SELECT product_id, name, hex, sort_order{$variantCols} FROM product_color_variants WHERE product_id IN ($in) ORDER BY sort_order, id");
    $co->execute($ids);
    $colorsBy = [];
    foreach ($co->fetchAll() as $r) {
        $v = ['name' => $r['name'], 'hex' => $r['hex']];
        if (!empty($r['sku']))       $v['sku'] = $r['sku'];
        if (!empty($r['image_src'])) $v['imageSrc'] = $r['image_src'];
        $colorsBy[$r['product_id']][] = $v;
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
        // stockBySize = total del talle (todos los colores);
        // stockByColor = { "Rosa": { "3M": 4, … }, … } solo con stock por color.
        $sizeRows = $sizesBy[$p['id']] ?? [];
        $stock = [];
        $sizes = [];
        $byColor = [];
        foreach ($sizeRows as $r) {
            $sz = $r['size'];
            if (!in_array($sz, $sizes, true)) $sizes[] = $sz;
            $stock[$sz] = ($stock[$sz] ?? 0) + (int)$r['stock'];
            $color = (string)$r['color'];
            if ($color !== '') $byColor[$color][$sz] = (int)$r['stock'];
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
            'stockByColor'     => (object)array_map(fn($m) => (object)$m, $byColor),
            'colorHex'         => $p['colorHex'],
            'description'      => $p['description'],
            'price'            => (float)$p['price'],
            'originalPrice'    => $p['originalPrice'] === null ? null : (float)$p['originalPrice'],
            'wholesalePrice'   => $p['wholesalePrice'] === null ? null : (float)$p['wholesalePrice'],
            'wholesaleMinQty'  => $p['wholesaleMinQty'] === null ? null : (int)$p['wholesaleMinQty'],
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


/**
 * Genera el próximo ID secuencial para la categoría: b-001, b-002, …
 * (primera letra de la categoría + número de 3 dígitos).
 */
function generate_id(string $categoryKey): string {
    $prefix = $categoryKey !== '' ? $categoryKey[0] : 'p';
    $stmt = pdo()->prepare("SELECT id FROM products WHERE id LIKE ?");
    $stmt->execute([$prefix . '-%']);
    $max = 0;
    foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $existing) {
        if (preg_match('/^' . preg_quote($prefix, '/') . '-(\d+)$/', (string)$existing, $m)) {
            $max = max($max, (int)$m[1]);
        }
    }
    return sprintf('%s-%03d', $prefix, $max + 1);
}

function product_exists(string $id): bool {
    $chk = pdo()->prepare("SELECT COUNT(*) FROM products WHERE id = ?");
    $chk->execute([$id]);
    return (int)$chk->fetchColumn() > 0;
}

/** ¿El slug ya lo usa otro producto? (excluyendo $exceptId en updates) */
function slug_taken(string $slug, ?string $exceptId = null): bool {
    $stmt = pdo()->prepare("SELECT COUNT(*) FROM products WHERE slug = ? AND id <> ?");
    $stmt->execute([$slug, $exceptId ?? '']);
    return (int)$stmt->fetchColumn() > 0;
}

/** Strings a la medida de la columna (evita "Data too long" en modo estricto). */
function str_or_null(mixed $v, int $max): ?string {
    if ($v === null || is_array($v)) return null;
    $s = trim((string)$v);
    if ($s === '') return null;
    return mb_substr($s, 0, $max);
}

function valid_hex(mixed $v, string $default): string {
    $s = is_string($v) ? trim($v) : '';
    return preg_match('/^#[0-9a-f]{6}$/i', $s) ? $s : $default;
}

/**
 * Valida el body de POST/PUT y devuelve [categoría, columnas de products].
 * Corta con 400/409 si algo no es válido.
 */
function validate_product_body(array $body, ?string $exceptId = null): array {
    $cat = category_by_key((string)($body['category'] ?? ''));
    if (!$cat) send_json(['ok' => false, 'error' => 'INVALID_CATEGORY', 'message' => 'Categoría inválida'], 400);

    $name     = trim((string)($body['name'] ?? ''));
    $imageSrc = trim((string)($body['imageSrc'] ?? ''));
    if ($name === '' || $imageSrc === '' || !isset($body['price']) || !is_numeric($body['price'])) {
        send_json(['ok' => false, 'error' => 'MISSING_FIELDS', 'message' => 'Faltan nombre, imagen principal o precio'], 400);
    }

    // Las imágenes tienen que ser URLs (subidas con upload.php), no base64: image_src es VARCHAR(500).
    $images = array_merge([$imageSrc], array_values((array)($body['gallery'] ?? [])));
    foreach ($images as $src) {
        $src = (string)$src;
        if (str_starts_with($src, 'data:') || mb_strlen($src) > 500) {
            send_json([
                'ok'      => false,
                'error'   => 'INVALID_IMAGE',
                'message' => 'Las imágenes deben ser una URL (máx. 500 caracteres), no un archivo embebido',
            ], 400);
        }
    }

    $slug = str_or_null($body['slug'] ?? null, 150);
    if ($slug !== null && slug_taken($slug, $exceptId)) {
        send_json(['ok' => false, 'error' => 'DUPLICATE_SLUG', 'message' => "El número de artículo \"{$slug}\" ya lo usa otro producto"], 409);
    }

    $optPrice = fn(string $k): ?float =>
        isset($body[$k]) && is_numeric($body[$k]) && (float)$body[$k] > 0 ? (float)$body[$k] : null;

    $row = [
        'slug'              => $slug,
        'name'              => mb_substr($name, 0, 200),
        'tagline'           => str_or_null($body['tagline'] ?? null, 100),
        'image_src'         => $imageSrc,
        'category_id'       => (int)$cat['id'],
        'size_group'        => ($body['sizeGroup'] ?? 'ninios') === 'bebe' ? 'bebe' : 'ninios',
        'color_hex'         => valid_hex($body['colorHex'] ?? null, '#F5E6D3'),
        'description'       => isset($body['description']) ? (string)$body['description'] : null,
        'price'             => max(0, (float)$body['price']),
        'original_price'    => $optPrice('originalPrice'),
        'installments'      => min(255, max(1, (int)($body['installments'] ?? 1))),
        'tax_free_price'    => $optPrice('taxFreePrice'),
        'show_points_badge' => !empty($body['showPointsBadge']) ? 1 : 0,
        'rating'            => min(5, max(0, round((float)($body['rating'] ?? 5), 1))),
        'reviews_count'     => max(0, (int)($body['reviews'] ?? 0)),
        'sold_total'        => max(0, (int)($body['soldTotal'] ?? 0)),
        'active'            => !array_key_exists('active', $body) || !empty($body['active']) ? 1 : 0,
    ];

    // Precio por mayor: solo si la migración ya corrió y el pedido lo trae
    // (así un cliente viejo que no manda el campo no lo borra).
    if (has_wholesale_columns() && array_key_exists('wholesalePrice', $body)) {
        $wp  = $optPrice('wholesalePrice');
        $min = isset($body['wholesaleMinQty']) && is_numeric($body['wholesaleMinQty'])
            ? (int)$body['wholesaleMinQty'] : 0;
        $row['wholesale_price']   = $wp;
        $row['wholesale_min_qty'] = $wp !== null ? min(65535, max(2, $min ?: 2)) : null;
    }
    return [$cat, $row];
}

function insert_child_rows(string $id, array $body): void {
    $pdo = pdo();

    // sizes + stock (sin duplicados: hay UNIQUE (product_id, size))
    $sizes = array_values(array_unique(array_filter(
        array_map(fn($s) => mb_substr(trim((string)$s), 0, 15), (array)($body['sizes'] ?? [])),
        fn($s) => $s !== ''
    )));
    $stock = (array)($body['stockBySize'] ?? []);
    // Stock por color: { "Rosa": { "3M": 4 } }. Solo cuenta para colores que
    // existen en el producto (las claves son el nombre del modelo/color).
    $colorNames = array_map(
        fn($c) => is_array($c) ? (str_or_null($c['name'] ?? null, 80) ?? 'Modelo') : 'Modelo',
        array_values((array)($body['colorVariants'] ?? []))
    );
    $byColor = [];
    foreach ((array)($body['stockByColor'] ?? []) as $cName => $perSize) {
        $cName = mb_substr(trim((string)$cName), 0, 80);
        if ($cName === '' || !in_array($cName, $colorNames, true) || !is_array($perSize)) continue;
        $byColor[$cName] = $perSize;
    }
    if ($sizes) {
        if ($byColor && has_stock_color_column()) {
            $stmt = $pdo->prepare("INSERT INTO product_sizes_stock (product_id, color, size, stock) VALUES (?,?,?,?)");
            foreach ($byColor as $cName => $perSize) {
                foreach ($sizes as $sz) {
                    $stmt->execute([$id, $cName, $sz, max(0, (int)($perSize[$sz] ?? 0))]);
                }
            }
        } else {
            // Sin stock por color (o sin la migración): un total por talle.
            if ($byColor) {
                $stock = [];
                foreach ($byColor as $perSize) {
                    foreach ($sizes as $sz) $stock[$sz] = ($stock[$sz] ?? 0) + max(0, (int)($perSize[$sz] ?? 0));
                }
            }
            $stmt = $pdo->prepare("INSERT INTO product_sizes_stock (product_id, size, stock) VALUES (?,?,?)");
            foreach ($sizes as $sz) {
                $stmt->execute([$id, $sz, max(0, (int)($stock[$sz] ?? 0))]);
            }
        }
    }

    // galeria
    $gallery = array_values(array_filter(
        array_map(fn($s) => trim((string)$s), (array)($body['gallery'] ?? [])),
        fn($s) => $s !== ''
    ));
    if ($gallery) {
        $stmt = $pdo->prepare("INSERT INTO product_gallery_images (product_id, image_src, sort_order) VALUES (?,?,?)");
        foreach ($gallery as $i => $src) {
            $stmt->execute([$id, $src, $i]);
        }
    }

    // color variants
    // modelos / colores (con número de artículo y foto si la migración ya corrió)
    $colors = array_values((array)($body['colorVariants'] ?? []));
    if ($colors) {
        $withExtra = has_variant_columns();
        $stmt = $withExtra
            ? $pdo->prepare("INSERT INTO product_color_variants (product_id, name, hex, sku, image_src, sort_order) VALUES (?,?,?,?,?,?)")
            : $pdo->prepare("INSERT INTO product_color_variants (product_id, name, hex, sort_order) VALUES (?,?,?,?)");
        foreach ($colors as $i => $c) {
            $c = is_array($c) ? $c : [];
            $row = [
                $id,
                str_or_null($c['name'] ?? null, $withExtra ? 80 : 50) ?? 'Modelo',
                valid_hex($c['hex'] ?? null, '#ffffff'),
            ];
            if ($withExtra) {
                $img = isset($c['imageSrc']) ? trim((string)$c['imageSrc']) : '';
                // Igual que las fotos del producto: URL, no base64
                if ($img !== '' && (str_starts_with($img, 'data:') || mb_strlen($img) > 500)) $img = '';
                $row[] = str_or_null($c['sku'] ?? null, 60);
                $row[] = $img !== '' ? $img : null;
            }
            $row[] = min(255, $i);
            $stmt->execute($row);
        }
    }

    // features
    $features = array_values(array_filter(
        array_map(fn($f) => mb_substr(trim((string)$f), 0, 250), (array)($body['features'] ?? [])),
        fn($f) => $f !== ''
    ));
    if ($features) {
        $stmt = $pdo->prepare("INSERT INTO product_features (product_id, feature, sort_order) VALUES (?,?,?)");
        foreach ($features as $i => $f) {
            $stmt->execute([$id, $f, min(255, $i)]);
        }
    }

    // relacionados: solo los que existen (la FK lo exige) y distintos del propio producto
    $related = array_values(array_unique(array_filter(
        array_map(fn($r) => trim((string)$r), (array)($body['relatedIds'] ?? [])),
        fn($r) => $r !== '' && $r !== $id && product_exists($r)
    )));
    if ($related) {
        $stmt = $pdo->prepare("INSERT INTO product_related (product_id, related_product_id, sort_order) VALUES (?,?,?)");
        foreach ($related as $i => $r) {
            $stmt->execute([$id, $r, min(255, $i)]);
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

function db_error(Throwable $e): never {
    $pdo = pdo();
    if ($pdo->inTransaction()) $pdo->rollBack();
    send_json(['ok' => false, 'error' => 'DB_ERROR', 'message' => $e->getMessage()], 500);
}

/* ============================================================
 *  Ruteo
 * ========================================================== */

$method = method();
// El id del recurso sale solo de la query string (?id=…), nunca del body.
$id     = isset($_GET['id']) ? trim((string)$_GET['id']) : null;

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

    [$cat, $row] = validate_product_body($body);

    // ID opcional elegido por el cliente: tiene que entrar en VARCHAR(30).
    if (!empty($body['id'])) {
        $id = trim((string)$body['id']);
        if (!preg_match('/^[a-z0-9][a-z0-9_-]{0,29}$/i', $id)) {
            send_json(['ok' => false, 'error' => 'INVALID_ID', 'message' => 'ID inválido (máx. 30 caracteres: letras, números, - o _)'], 400);
        }
        if (product_exists($id)) {
            send_json(['ok' => false, 'error' => 'DUPLICATE_ID', 'message' => "Ya existe un producto con ID {$id}", 'id' => $id], 409);
        }
    } else {
        $id = generate_id((string)$cat['key']);
    }

    $pdo = pdo();
    try {
        $pdo->beginTransaction();
        $cols = array_keys($row);
        $ins = $pdo->prepare(sprintf(
            "INSERT INTO products (id, %s) VALUES (?%s)",
            implode(', ', $cols),
            str_repeat(',?', count($cols))
        ));
        $ins->execute(array_merge([$id], array_values($row)));

        insert_child_rows($id, $body);
        $pdo->commit();
    } catch (Throwable $e) {
        db_error($e);
    }

    $created = fetch_products("WHERE p.id = ?", [$id]);
    send_json(['ok' => true, 'id' => $id, 'data' => $created[0] ?? null], 201);
}

if ($method === 'PUT') {
    if ($id === null || $id === '') send_json(['ok' => false, 'error' => 'MISSING_ID'], 400);
    $body = read_json_body();
    if (!$body) send_json(['ok' => false, 'error' => 'INVALID_JSON'], 400);

    if (!product_exists($id)) send_json(['ok' => false, 'error' => 'NOT_FOUND', 'message' => "No existe el producto {$id}"], 404);

    [, $row] = validate_product_body($body, $id);

    $pdo = pdo();
    try {
        $pdo->beginTransaction();
        $sets = implode(', ', array_map(fn($c) => "{$c}=?", array_keys($row)));
        $upd = $pdo->prepare("UPDATE products SET {$sets}, updated_at=NOW() WHERE id=?");
        $upd->execute(array_merge(array_values($row), [$id]));

        delete_child_rows($id);
        insert_child_rows($id, $body);
        $pdo->commit();
    } catch (Throwable $e) {
        db_error($e);
    }

    $updated = fetch_products("WHERE p.id = ?", [$id]);
    send_json(['ok' => true, 'id' => $id, 'data' => $updated[0] ?? null]);
}

if ($method === 'DELETE') {
    if ($id === null || $id === '') send_json(['ok' => false, 'error' => 'MISSING_ID'], 400);
    if (!product_exists($id)) send_json(['ok' => false, 'error' => 'NOT_FOUND'], 404);

    try {
        pdo()->prepare("DELETE FROM products WHERE id = ?")->execute([$id]);
    } catch (Throwable $e) {
        // p. ej. FK de order_items (ON DELETE RESTRICT): el producto ya tiene pedidos.
        db_error($e);
    }
    send_json(['ok' => true, 'id' => $id]);
}

send_json(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED'], 405);
