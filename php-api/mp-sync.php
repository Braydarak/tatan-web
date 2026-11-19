<?php
/**
 * ============================================================
 *   TATAN API PHP · mp-sync.php  (revisar pagos pendientes)
 * ============================================================
 *
 *   Reemplaza al aviso de Mercado Pago (webhook) cuando no se puede
 *   configurar en el panel: le pregunta a Mercado Pago por cada pedido
 *   "pendiente" de los últimos días y lo actualiza (pagado, rechazado…).
 *   Sirve sobre todo para los pagos en efectivo (Rapipago / Pago Fácil),
 *   que se acreditan horas o días después de la compra. Los pagos con
 *   tarjeta ya se confirman al instante en checkout.php.
 *
 *   Se corre con una tarea programada (cron) de Ferozo cada 15 minutos:
 *
 *     php /home/USUARIO/public_html/api/mp-sync.php
 *
 *   (o, si el cron solo puede abrir direcciones web:
 *     curl -s "https://tatankids.com.ar/api/mp-sync.php?key=MP_SYNC_KEY"
 *    con MP_SYNC_KEY definida en secrets.php).
 *
 *   Es seguro correrlo muchas veces: el stock se descuenta una sola vez.
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/mercadopago.php';

const SYNC_DAYS = 10;   // los cupones de efectivo vencen antes
const SYNC_LIMIT = 100; // pedidos por corrida, como máximo

$cli = PHP_SAPI === 'cli';

// Por la web solo con la clave (si no, cualquiera podría dispararlo)
if (!$cli) {
    $key = (string)($_GET['key'] ?? '');
    if (!defined('MP_SYNC_KEY') || MP_SYNC_KEY === '' || !hash_equals(MP_SYNC_KEY, $key)) {
        send_json(['ok' => false, 'error' => 'FORBIDDEN'], 403);
    }
}

/** Resultado: texto en la consola (cron), JSON por la web */
function done(array $out, bool $cli): never
{
    if ($cli) {
        echo date('Y-m-d H:i:s') . ' · mp-sync: ' . ($out['ok'] ? 'ok' : 'error') . ' · '
            . json_encode($out, JSON_UNESCAPED_UNICODE) . PHP_EOL;
        exit($out['ok'] ? 0 : 1);
    }
    send_json($out, $out['ok'] ? 200 : 503);
}

if (!mp_configured()) {
    done(['ok' => false, 'error' => 'NOT_CONFIGURED'], $cli);
}

$st = pdo()->prepare(
    "SELECT order_number, payment_id FROM orders
     WHERE status = 'pending' AND payment_id LIKE 'ORD%'
       AND created_at >= NOW() - INTERVAL " . SYNC_DAYS . " DAY
     ORDER BY created_at DESC
     LIMIT " . SYNC_LIMIT
);
$st->execute();

$checked = 0;
$changed = [];
$failed = 0;
foreach ($st->fetchAll() as $row) {
    $checked++;
    try {
        $res = mp_sync_order((string)$row['payment_id']);
        if ($res === null) {
            $failed++;
        } elseif ($res['status'] !== 'pending') {
            $changed[] = "{$res['orderNumber']} → {$res['status']}";
        }
    } catch (Throwable $e) {
        $failed++;
        error_log('[mp-sync] ' . $row['order_number'] . ': ' . $e->getMessage());
    }
}

done(['ok' => true, 'revisados' => $checked, 'cambiaron' => $changed, 'errores' => $failed], $cli);
