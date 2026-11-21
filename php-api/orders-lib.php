<?php
/**
 * ============================================================
 *   TATAN API PHP · orders-lib.php  (pedidos: datos y mails)
 * ============================================================
 *
 *   Lo usan orders.php (la lista de ventas del CRM) y mercadopago.php
 *   (cuando un pedido pasa a "pagado" se avisa por mail a la tienda y al
 *   comprador). No es un endpoint: si se pide por el navegador no hace nada.
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
if (is_file(__DIR__ . '/secrets.php')) {
    require_once __DIR__ . '/secrets.php';
}

/** A dónde llegan los avisos de venta (se puede cambiar en secrets.php) */
function order_notify_to(): string
{
    return defined('ORDER_NOTIFY_EMAIL') && ORDER_NOTIFY_EMAIL !== '' ? ORDER_NOTIFY_EMAIL : 'contacto@tatankids.com.ar';
}

/** Remitente de los mails (una casilla del dominio, para que no caigan en spam) */
function order_mail_from(): string
{
    return defined('MAIL_FROM') && MAIL_FROM !== '' ? MAIL_FROM : 'contacto@tatankids.com.ar';
}

/**
 * Pedido completo: datos, productos, entrega, pago e historial.
 * @return array<string,mixed>|null
 */
function order_full(int $orderId): ?array
{
    $st = pdo()->prepare(
        'SELECT id, order_number, guest_email, guest_name, guest_phone, status, payment_method, payment_id,
                shipping_method, shipping_cost, subtotal, discount, total, currency, shipping_snapshot, notes,
                tracking_number, paid_at, shipped_at, delivered_at, cancelled_at, created_at
         FROM orders WHERE id = ?'
    );
    $st->execute([$orderId]);
    $o = $st->fetch();
    if (!$o) return null;

    $it = pdo()->prepare('SELECT product_id, product_name, variant_name, size, unit_price, quantity, subtotal_line FROM order_items WHERE order_id = ? ORDER BY id');
    $it->execute([$orderId]);
    $ev = pdo()->prepare('SELECT status, note, created_at FROM order_events WHERE order_id = ? ORDER BY id');
    $ev->execute([$orderId]);
    $events = array_map(fn($e) => [
        'status' => (string)$e['status'],
        'note'   => $e['note'] === null ? null : (string)$e['note'],
        'at'     => (string)$e['created_at'],
    ], $ev->fetchAll());

    $snap = json_decode((string)($o['shipping_snapshot'] ?? ''), true) ?: [];
    $dest = is_array($snap['destination'] ?? null) ? $snap['destination'] : [];
    $quote = is_array($snap['quote'] ?? null) ? $snap['quote'] : [];

    // Medio de pago: queda anotado en el historial ("Mercado Pago: order … · visa")
    $paymentType = null;
    foreach (array_reverse($events) as $e) {
        if ($e['note'] && preg_match('/Mercado Pago: order \S+ \S+(?: \([^)]*\))? · ([a-z_]+)/', $e['note'], $m)) {
            $paymentType = $m[1];
            break;
        }
    }

    return [
        'id'          => (int)$o['id'],
        'orderNumber' => (string)$o['order_number'],
        'status'      => (string)$o['status'],
        'createdAt'   => (string)$o['created_at'],
        'paidAt'      => $o['paid_at'],
        'shippedAt'   => $o['shipped_at'],
        'deliveredAt' => $o['delivered_at'],
        'cancelledAt' => $o['cancelled_at'],
        'buyer' => [
            'name'  => (string)$o['guest_name'],
            'email' => (string)$o['guest_email'],
            'phone' => (string)$o['guest_phone'],
            'dni'   => (string)($snap['buyer']['dni'] ?? ''),
        ],
        'items' => array_map(fn($i) => [
            'productId' => (string)$i['product_id'],
            'name'      => (string)$i['product_name'],
            'color'     => $i['variant_name'] === null ? null : (string)$i['variant_name'],
            'size'      => $i['size'] === null ? null : (string)$i['size'],
            'unitPrice' => (float)$i['unit_price'],
            'quantity'  => (int)$i['quantity'],
            'subtotal'  => (float)$i['subtotal_line'],
        ], $it->fetchAll()),
        'amounts' => [
            'subtotal' => (float)$o['subtotal'],
            'shipping' => (float)$o['shipping_cost'],
            'discount' => (float)$o['discount'],
            'total'    => (float)$o['total'],
            'currency' => (string)$o['currency'],
        ],
        'shipping' => [
            'method'     => (string)($o['shipping_method'] ?? ''),
            'mode'       => (string)($quote['mode'] ?? ''),          // domicilio | sucursal
            'carrier'    => (string)($quote['carrier'] ?? ''),
            'postalCode' => (string)($dest['postalCode'] ?? ''),
            'street'     => (string)($dest['street'] ?? ''),
            'number'     => (string)($dest['number'] ?? ''),
            'floor'      => (string)($dest['floor'] ?? ''),
            'city'       => (string)($dest['city'] ?? ''),
            'province'   => (string)($dest['province'] ?? ''),
            'branch'     => is_array($dest['branch'] ?? null) ? $dest['branch'] : null,
            'notes'      => (string)($o['notes'] ?? ''),
            'tracking'   => $o['tracking_number'],
        ],
        'payment' => [
            'provider' => (string)($o['payment_method'] ?? ''),
            'type'     => $paymentType,
            'id'       => $o['payment_id'],
        ],
        'events' => $events,
    ];
}

/* ================================================================
 *  Mails
 * ============================================================== */

function money_ars(float $n): string
{
    return '$' . number_format($n, 0, ',', '.');
}

/** Dirección de entrega en una línea (domicilio o sucursal) */
function order_delivery_line(array $o): string
{
    $s = $o['shipping'];
    if ($s['mode'] === 'sucursal' && $s['branch']) {
        $b = $s['branch'];
        return trim('Retira en sucursal: ' . ($b['name'] ?? '') . ' · ' . ($b['address'] ?? '') . ', ' . ($b['city'] ?? ''), ' ,·');
    }
    $line = trim("{$s['street']} {$s['number']}" . ($s['floor'] !== '' ? ", {$s['floor']}" : ''));
    $line .= $s['city'] !== '' ? ", {$s['city']}" : '';
    $line .= $s['province'] !== '' ? ", {$s['province']}" : '';
    return $line . " (CP {$s['postalCode']})";
}

/** Nombre legible del medio de pago (visa → Visa, rapipago → Rapipago…) */
function order_payment_label(?string $type): string
{
    if (!$type) return 'Mercado Pago';
    $names = [
        'visa' => 'Visa', 'master' => 'Mastercard', 'amex' => 'American Express', 'naranja' => 'Naranja',
        'cabal' => 'Cabal', 'debvisa' => 'Visa Débito', 'debmaster' => 'Mastercard Débito', 'debcabal' => 'Cabal Débito',
        'maestro' => 'Maestro', 'argencard' => 'Argencard', 'diners' => 'Diners', 'rapipago' => 'Rapipago (efectivo)',
        'pagofacil' => 'Pago Fácil (efectivo)',
    ];
    return 'Mercado Pago · ' . ($names[$type] ?? $type);
}

/** Tabla HTML de productos para los mails */
function order_items_html(array $o): string
{
    $rows = '';
    foreach ($o['items'] as $i) {
        $detail = implode(' · ', array_filter([$i['color'] ? 'Color: ' . e($i['color']) : null, $i['size'] !== null ? 'Talle: ' . e($i['size']) : null]));
        $rows .= '<tr>'
            . '<td style="padding:8px 0;border-bottom:1px solid #eee">' . e($i['name']) . ($detail ? '<br><span style="color:#888;font-size:13px">' . $detail . '</span>' : '') . '</td>'
            . '<td style="padding:8px;border-bottom:1px solid #eee;text-align:center">' . (int)$i['quantity'] . '</td>'
            . '<td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">' . money_ars($i['subtotal']) . '</td>'
            . '</tr>';
    }
    $a = $o['amounts'];
    $rows .= '<tr><td colspan="2" style="padding:6px 0;color:#666">Subtotal</td><td style="text-align:right;color:#666">' . money_ars($a['subtotal']) . '</td></tr>';
    $rows .= '<tr><td colspan="2" style="padding:6px 0;color:#666">Envío (' . e($o['shipping']['method']) . ')</td><td style="text-align:right;color:#666">' . money_ars($a['shipping']) . '</td></tr>';
    $rows .= '<tr><td colspan="2" style="padding:8px 0;font-weight:bold;font-size:16px">Total</td><td style="text-align:right;font-weight:bold;font-size:16px">' . money_ars($a['total']) . '</td></tr>';
    return '<table style="width:100%;border-collapse:collapse;font-size:14px">'
        . '<tr><th style="text-align:left;padding-bottom:6px;color:#888;font-weight:normal">Producto</th><th style="color:#888;font-weight:normal">Cant.</th><th style="text-align:right;color:#888;font-weight:normal">Importe</th></tr>'
        . $rows . '</table>';
}

function order_mail_layout(string $title, string $inner): string
{
    return '<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#FEFDF8;font-family:Arial,Helvetica,sans-serif;color:#3f3f46">'
        . '<div style="max-width:560px;margin:0 auto;padding:24px">'
        . '<div style="background:#fff;border-radius:16px;padding:24px;border:1px solid #f0e6da">'
        . '<h1 style="margin:0 0 16px;font-size:20px;color:#3f3f46">' . $title . '</h1>'
        . $inner
        . '</div><p style="text-align:center;color:#b9a89b;font-size:12px;margin-top:16px">Tatan · tatankids.com.ar</p>'
        . '</div></body></html>';
}

/* ---------------------------------------------------------------- envío
 * Si en secrets.php está MAIL_SMTP_PASS, los mails salen por SMTP entrando
 * con la casilla (MAIL_SMTP_USER, por defecto el remitente): es lo que pide
 * el hosting y ayuda a que no caigan en spam. Si no, se usa mail() de PHP
 * (si el servidor la tiene habilitada).
 */

function smtp_configured(): bool
{
    return defined('MAIL_SMTP_PASS') && MAIL_SMTP_PASS !== '';
}

/** Lee una respuesta SMTP completa (varias líneas "250-…" hasta "250 …") */
function smtp_read($fp): array
{
    $text = '';
    while (($line = fgets($fp, 1024)) !== false) {
        $text .= $line;
        if (strlen($line) < 4 || $line[3] !== '-') break;
    }
    return [(int)substr($text, 0, 3), trim($text)];
}

/** Manda un comando y verifica el código esperado */
function smtp_cmd($fp, ?string $cmd, int $expect): void
{
    if ($cmd !== null) fwrite($fp, $cmd . "\r\n");
    [$code, $text] = smtp_read($fp);
    if ($code !== $expect) {
        $shown = $cmd !== null && str_starts_with($cmd, 'AUTH') ? 'AUTH' : (string)$cmd;
        throw new RuntimeException("SMTP: esperaba {$expect} y llegó {$code} ({$text}) después de \"{$shown}\"");
    }
}

/** Envío por SMTP con usuario y contraseña. Lanza RuntimeException si falla. */
function smtp_send(string $to, string $subject, string $html, array $headers): void
{
    $host = defined('MAIL_SMTP_HOST') && MAIL_SMTP_HOST !== '' ? MAIL_SMTP_HOST : 'mail.tatankids.com.ar';
    $port = defined('MAIL_SMTP_PORT') && MAIL_SMTP_PORT ? (int)MAIL_SMTP_PORT : 465;
    // 'ssl' (465), 'tls' (587, STARTTLS) o 'none' (solo para pruebas locales)
    $secure = defined('MAIL_SMTP_SECURE') && MAIL_SMTP_SECURE !== '' ? MAIL_SMTP_SECURE : ($port === 587 ? 'tls' : 'ssl');
    $user = defined('MAIL_SMTP_USER') && MAIL_SMTP_USER !== '' ? MAIL_SMTP_USER : order_mail_from();
    $from = order_mail_from();

    $ctx = stream_context_create(['ssl' => [
        'verify_peer'      => !defined('MAIL_SMTP_VERIFY') || MAIL_SMTP_VERIFY,
        'verify_peer_name' => !defined('MAIL_SMTP_VERIFY') || MAIL_SMTP_VERIFY,
    ]]);
    $scheme = $secure === 'ssl' ? 'ssl' : 'tcp';
    $fp = @stream_socket_client("{$scheme}://{$host}:{$port}", $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $ctx);
    if (!$fp) throw new RuntimeException("SMTP: no se pudo conectar a {$host}:{$port} ({$errstr})");
    stream_set_timeout($fp, 20);
    try {
        smtp_cmd($fp, null, 220);
        smtp_cmd($fp, 'EHLO tatankids.com.ar', 250);
        if ($secure === 'tls') {
            smtp_cmd($fp, 'STARTTLS', 220);
            if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('SMTP: no se pudo activar TLS');
            }
            smtp_cmd($fp, 'EHLO tatankids.com.ar', 250);
        }
        smtp_cmd($fp, 'AUTH LOGIN', 334);
        smtp_cmd($fp, base64_encode($user), 334);
        smtp_cmd($fp, base64_encode(MAIL_SMTP_PASS), 235);
        smtp_cmd($fp, "MAIL FROM:<{$from}>", 250);
        smtp_cmd($fp, "RCPT TO:<{$to}>", 250);
        smtp_cmd($fp, 'DATA', 354);
        $domain = substr(strrchr($from, '@') ?: '@tatankids.com.ar', 1);
        $msg = implode("\r\n", array_merge([
            'Date: ' . date('r'),
            'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . $domain . '>',
            'To: ' . $to,
            'Subject: ' . $subject,
        ], $headers, ['Content-Transfer-Encoding: base64']))
            . "\r\n\r\n" . rtrim(chunk_split(base64_encode($html), 76, "\r\n")) . "\r\n.";
        smtp_cmd($fp, $msg, 250);
        fwrite($fp, "QUIT\r\n");
    } finally {
        fclose($fp);
    }
}

/** Manda un mail HTML. Devuelve si salió (por SMTP o por mail()). */
function order_send_mail(string $to, string $subject, string $html, ?string $replyTo = null): bool
{
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) return false;
    $from = order_mail_from();
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: Tatan <' . $from . '>',
    ];
    if ($replyTo && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) $headers[] = 'Reply-To: ' . $replyTo;
    $subject = mb_encode_mimeheader($subject, 'UTF-8', 'B', "\r\n");

    if (smtp_configured()) {
        try {
            smtp_send($to, $subject, $html, $headers);
            return true;
        } catch (Throwable $e) {
            error_log('[orders] ' . $e->getMessage());
            return false;
        }
    }
    // Sin SMTP: mail() de PHP, si el hosting no la deshabilitó
    if (!function_exists('mail')) {
        error_log('[orders] mail() está deshabilitada y no hay SMTP configurado (MAIL_SMTP_PASS en secrets.php)');
        return false;
    }
    try {
        return @mail($to, $subject, $html, implode("\r\n", $headers), '-f' . $from);
    } catch (Throwable $e) {
        error_log('[orders] mail(): ' . $e->getMessage());
        return false;
    }
}

/**
 * Avisos de un pedido pagado: a la tienda (con todo para despacharlo) y al
 * comprador (resumen). Nunca corta el pago: si un mail falla, se anota en
 * el historial del pedido.
 */
function order_notify_paid(int $orderId): void
{
    try {
        $o = order_full($orderId);
        if (!$o) return;
        $b = $o['buyer'];
        $num = $o['orderNumber'];
        $delivery = e(order_delivery_line($o));
        $pay = e(order_payment_label($o['payment']['type']));

        // --- A la tienda
        $storeHtml = order_mail_layout('🧸 ¡Nueva venta! ' . e($num),
            '<p style="margin:0 0 16px">Entró un pago aprobado por <strong>' . money_ars($o['amounts']['total']) . '</strong>.</p>'
            . order_items_html($o)
            . '<h2 style="font-size:15px;margin:20px 0 6px">Comprador</h2>'
            . '<p style="margin:0;line-height:1.6">' . e($b['name']) . '<br>'
            . '<a href="mailto:' . e($b['email']) . '">' . e($b['email']) . '</a><br>'
            . 'Tel: ' . e($b['phone']) . ($b['dni'] !== '' ? ' · DNI: ' . e($b['dni']) : '') . '</p>'
            . '<h2 style="font-size:15px;margin:20px 0 6px">Entrega</h2>'
            . '<p style="margin:0;line-height:1.6">' . e($o['shipping']['method']) . '<br>' . $delivery
            . ($o['shipping']['notes'] !== '' ? '<br>Notas: ' . e($o['shipping']['notes']) : '') . '</p>'
            . '<h2 style="font-size:15px;margin:20px 0 6px">Pago</h2>'
            . '<p style="margin:0;line-height:1.6">' . $pay . '<br><span style="color:#888;font-size:13px">ID: ' . e((string)$o['payment']['id']) . '</span></p>'
            . '<p style="margin:24px 0 0"><a href="' . e(site_url()) . '/crm#ventas" style="display:inline-block;background:#FCD1B1;color:#3f3f46;padding:10px 18px;border-radius:12px;text-decoration:none;font-weight:bold">Ver en el CRM</a></p>'
        );
        $okStore = order_send_mail(order_notify_to(), "🧸 Nueva venta {$num} · " . money_ars($o['amounts']['total']), $storeHtml, $b['email']);

        // --- Al comprador
        $first = explode(' ', trim($b['name']))[0] ?? '';
        $buyerHtml = order_mail_layout('¡Gracias por tu compra' . ($first !== '' ? ', ' . e($first) : '') . '!',
            '<p style="margin:0 0 16px">Recibimos tu pago. Tu pedido es el <strong>' . e($num) . '</strong>.</p>'
            . order_items_html($o)
            . '<h2 style="font-size:15px;margin:20px 0 6px">Entrega</h2>'
            . '<p style="margin:0;line-height:1.6">' . e($o['shipping']['method']) . '<br>' . $delivery . '</p>'
            . '<p style="margin:20px 0 0;line-height:1.6">Ya estamos preparando tu pedido. Cuando lo despachemos te mandamos el código de seguimiento.</p>'
            . '<p style="margin:12px 0 0;line-height:1.6;color:#666">¿Dudas? Respondé este mail o escribinos a ' . e(order_notify_to()) . '.</p>'
        );
        $okBuyer = order_send_mail($b['email'], "¡Gracias por tu compra! Pedido {$num}", $buyerHtml, order_notify_to());

        if (!$okStore || !$okBuyer) {
            order_event($orderId, 'paid', 'No se pudo mandar el mail ' . (!$okStore ? 'a la tienda' : '') . (!$okStore && !$okBuyer ? ' ni ' : '') . (!$okBuyer ? 'al comprador' : ''));
        }
    } catch (Throwable $e) {
        error_log('[orders] aviso de venta: ' . $e->getMessage());
    }
}
