<?php
/**
 * ============================================================
 *   TATAN API PHP · orders.php  (ventas para el CRM)
 * ============================================================
 *
 *   GET orders.php                    → pedidos (los más nuevos primero)
 *   GET orders.php?status=paid        → solo un estado
 *                                       (pending, paid, shipped, delivered,
 *                                        cancelled, refunded)
 *
 *   Cada pedido trae: quién compró, qué compró (talle, color, cantidad,
 *   precio), cuándo, cuánto pagó, la entrega y el historial.
 *   Solo con sesión del CRM: tiene datos personales de los compradores.
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/orders-lib.php';

if (method() !== 'GET') {
    send_json(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED'], 405);
}
require_crm_auth();

$status = (string)($_GET['status'] ?? '');
$valid = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];
$limit = max(1, min(500, (int)($_GET['limit'] ?? 300)));

// Los "draft" son carritos que nunca llegaron a pagarse: no se muestran
if (in_array($status, $valid, true)) {
    $st = pdo()->prepare("SELECT id FROM orders WHERE status = ? ORDER BY created_at DESC, id DESC LIMIT {$limit}");
    $st->execute([$status]);
} else {
    $st = pdo()->prepare("SELECT id FROM orders WHERE status <> 'draft' ORDER BY created_at DESC, id DESC LIMIT {$limit}");
    $st->execute();
}

$orders = [];
foreach ($st->fetchAll() as $row) {
    if ($o = order_full((int)$row['id'])) $orders[] = $o;
}

send_json(['ok' => true, 'count' => count($orders), 'data' => $orders]);
