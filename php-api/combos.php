<?php
/**
 * Analítica "La gente también eligió combinar con".
 * Se arma SOLO con pedidos pagados (orders.status paid/shipped/delivered).
 *
 * GET  /api/combos.php?ids=b-001,r-002&limit=4
 *      → productos que más se compraron junto con esos (sin incluirlos).
 *        { ok, data: [{ productId, times }], source: "paid_orders" }
 *
 * POST /api/combos.php?action=rebuild        (requiere sesión CRM)
 *      → recalcula la tabla product_pair_stats desde los pedidos pagados.
 *        Es idempotente: se puede correr cuantas veces haga falta. Cuando
 *        se conecte Mercado Pago, el webhook de pago aprobado puede llamar
 *        a rebuild_pair_stats() después de marcar el pedido como pagado.
 *
 * Requiere la migración migrations/2026-11-07-mayorista-y-combinaciones.sql.
 * Si la tabla todavía no existe, GET devuelve una lista vacía.
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

const PAID_STATUSES = ['paid', 'shipped', 'delivered'];

function pair_table_exists(): bool {
    try {
        return (bool)pdo()->query("SHOW TABLES LIKE 'product_pair_stats'")->fetch();
    } catch (Throwable $e) {
        return false;
    }
}

/** Recalcula todos los pares desde cero a partir de los pedidos pagados. */
function rebuild_pair_stats(): int {
    $pdo = pdo();
    $in  = implode(',', array_fill(0, count(PAID_STATUSES), '?'));
    $pdo->beginTransaction();
    try {
        $pdo->exec("DELETE FROM product_pair_stats");
        // Un par por pedido (DISTINCT), en los dos sentidos, contando pedidos.
        $sql = "INSERT INTO product_pair_stats (product_id, paired_product_id, times_together, last_order_at)
                SELECT a.product_id, b.product_id, COUNT(DISTINCT o.id), MAX(COALESCE(o.paid_at, o.created_at))
                FROM orders o
                JOIN order_items a ON a.order_id = o.id
                JOIN order_items b ON b.order_id = o.id AND b.product_id <> a.product_id
                WHERE o.status IN ($in)
                GROUP BY a.product_id, b.product_id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(PAID_STATUSES);
        $rows = $stmt->rowCount();
        $pdo->commit();
        return $rows;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

$method = method();

if ($method === 'GET') {
    $raw = (string)($_GET['ids'] ?? '');
    $ids = array_values(array_unique(array_filter(
        array_map(fn($s) => trim($s), explode(',', $raw)),
        fn($s) => $s !== '' && preg_match('/^[a-z0-9][a-z0-9_-]{0,29}$/i', $s)
    )));
    $ids   = array_slice($ids, 0, 20);
    $limit = min(12, max(1, (int)($_GET['limit'] ?? 4)));

    if (!$ids || !pair_table_exists()) {
        send_json(['ok' => true, 'data' => [], 'source' => 'paid_orders']);
    }

    $in  = implode(',', array_fill(0, count($ids), '?'));
    $sql = "SELECT s.paired_product_id AS productId, SUM(s.times_together) AS times
            FROM product_pair_stats s
            JOIN products p ON p.id = s.paired_product_id AND p.active = 1
            WHERE s.product_id IN ($in) AND s.paired_product_id NOT IN ($in)
            GROUP BY s.paired_product_id
            ORDER BY times DESC, MAX(s.last_order_at) DESC
            LIMIT {$limit}";
    try {
        $stmt = pdo()->prepare($sql);
        $stmt->execute(array_merge($ids, $ids));
        $data = array_map(
            fn($r) => ['productId' => $r['productId'], 'times' => (int)$r['times']],
            $stmt->fetchAll()
        );
    } catch (Throwable $e) {
        $data = [];
    }
    send_json(['ok' => true, 'data' => $data, 'source' => 'paid_orders']);
}

if ($method === 'POST') {
    require_crm_auth();
    if ((string)input('action', '') !== 'rebuild') {
        send_json(['ok' => false, 'error' => 'INVALID_ACTION'], 400);
    }
    if (!pair_table_exists()) {
        send_json([
            'ok'      => false,
            'error'   => 'MIGRATION_PENDING',
            'message' => 'Falta correr la migración 2026-11-07-mayorista-y-combinaciones.sql',
        ], 409);
    }
    try {
        $pairs = rebuild_pair_stats();
    } catch (Throwable $e) {
        send_json(['ok' => false, 'error' => 'DB_ERROR', 'message' => $e->getMessage()], 500);
    }
    send_json(['ok' => true, 'pairs' => $pairs]);
}

send_json(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED'], 405);
