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

    $it = pdo()->prepare(
        'SELECT i.product_id, i.product_name, i.variant_name, i.size, i.unit_price, i.quantity, i.subtotal_line, p.image_src
         FROM order_items i LEFT JOIN products p ON p.id = i.product_id
         WHERE i.order_id = ? ORDER BY i.id'
    );
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
            'image'     => $i['image_src'] === null ? null : (string)$i['image_src'],
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

/* ---------------------------------------------------------------- diseño de los mails
 * Estilo Tatan: logo arriba, paleta pastel, tarjetas redondeadas y el
 * osito. Hecho con tablas y estilos en línea (es lo que muestran bien
 * Gmail, Outlook y los celulares). Las imágenes están en el sitio:
 * /email/logo.png, /email/osito-feliz.png y las fotos vía /api/img.php.
 */

const MAIL_SITE = 'https://tatankids.com.ar';
const MAIL_INSTAGRAM = 'https://www.instagram.com/tatankids26/';
// Tipografías de la web si el programa de correo las tiene; si no, parecidas
const MAIL_TITLE_FONT = "'Fredoka','Trebuchet MS',Verdana,Arial,sans-serif";
const MAIL_TEXT_FONT = "'Nunito','Segoe UI',Helvetica,Arial,sans-serif";

/** Foto de un producto, achicada por img.php (o null si no tiene) */
function mail_img_url(?string $src, int $w): ?string
{
    if (!$src) return null;
    if (preg_match('~/api/uploads/([^?#]+\.(?:jpe?g|png|webp))$~i', $src, $m)) {
        return MAIL_SITE . '/api/img.php?f=' . str_replace('%2F', '/', rawurlencode($m[1])) . "&w={$w}&q=80";
    }
    return preg_match('~^https?://~', $src) ? $src : MAIL_SITE . '/' . ltrim($src, '/');
}

/** El ticket: productos con foto, talle, color y cantidad, y los totales */
function order_items_html(array $o): string
{
    $rows = '';
    foreach ($o['items'] as $i) {
        $img = mail_img_url($i['image'] ?? null, 128);
        $thumb = $img
            ? '<img src="' . e($img) . '" width="56" height="56" alt="" style="display:block;width:56px;height:56px;border-radius:14px;background:#F6F1EA;object-fit:contain">'
            : '<div style="width:56px;height:56px;border-radius:14px;background:#F6F1EA"></div>';
        $detail = implode(' · ', array_filter([
            $i['color'] ? 'Color: ' . e($i['color']) : null,
            $i['size'] !== null ? 'Talle: ' . e($i['size']) : null,
            (int)$i['quantity'] . ' × ' . money_ars((float)$i['unitPrice']),
        ]));
        $rows .= '<tr>'
            . '<td width="64" style="padding:10px 0;vertical-align:middle">' . $thumb . '</td>'
            . '<td style="padding:10px 8px;vertical-align:middle;font-family:' . MAIL_TEXT_FONT . '">'
            . '<div style="font-size:15px;font-weight:bold;color:#3F3F46">' . e($i['name']) . '</div>'
            . '<div style="font-size:13px;color:#8A7F76;margin-top:3px">' . $detail . '</div></td>'
            . '<td align="right" style="padding:10px 0;vertical-align:middle;font-family:' . MAIL_TEXT_FONT . ';font-size:15px;font-weight:bold;color:#3F3F46;white-space:nowrap">' . money_ars((float)$i['subtotal']) . '</td>'
            . '</tr>';
    }
    $a = $o['amounts'];
    $line = fn(string $label, string $value, bool $strong = false) =>
        '<tr><td colspan="2" style="padding:' . ($strong ? '12px' : '4px') . ' 0 0;font-family:' . MAIL_TEXT_FONT . ';font-size:' . ($strong ? '17px' : '14px') . ';color:' . ($strong ? '#3F3F46' : '#8A7F76') . ';' . ($strong ? 'font-weight:bold' : '') . '">' . $label . '</td>'
        . '<td align="right" style="padding:' . ($strong ? '12px' : '4px') . ' 0 0;font-family:' . MAIL_TEXT_FONT . ';font-size:' . ($strong ? '20px' : '14px') . ';color:' . ($strong ? '#4DA96C' : '#8A7F76') . ';font-weight:bold;white-space:nowrap">' . $value . '</td></tr>';
    $totals = $line('Subtotal', money_ars($a['subtotal']))
        . $line('Envío · ' . e($o['shipping']['method']), money_ars($a['shipping']))
        . ($a['discount'] > 0 ? $line('Descuento', '−' . money_ars($a['discount'])) : '')
        . $line('Total', money_ars($a['total']), true);

    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #F0E6DA;border-radius:20px">'
        . '<tr><td style="padding:16px 20px 18px">'
        . '<div style="font-family:' . MAIL_TEXT_FONT . ';font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#B9A89B;padding-bottom:4px">🛍️ Tu pedido</div>'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:2px dashed #F0E6DA">' . $rows . '</table>'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' . $totals . '</table>'
        . '</td></tr></table>';
}

/** Una tarjeta de información con su color (comprador, entrega, pago…) */
function mail_section(string $emoji, string $title, string $bg, string $body): string
{
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;background:' . $bg . ';border-radius:18px">'
        . '<tr><td style="padding:14px 18px;font-family:' . MAIL_TEXT_FONT . ';font-size:14px;line-height:1.6;color:#3F3F46">'
        . '<div style="font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#8A7F76;padding-bottom:2px">' . $emoji . ' ' . $title . '</div>'
        . $body . '</td></tr></table>';
}

function mail_button(string $href, string $label): string
{
    return '<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:22px auto 4px"><tr>'
        . '<td style="background:#FCD1B1;border-radius:16px">'
        . '<a href="' . e($href) . '" style="display:inline-block;padding:13px 26px;font-family:' . MAIL_TITLE_FONT . ';font-size:15px;font-weight:bold;color:#3F3F46;text-decoration:none">' . $label . '</a>'
        . '</td></tr></table>';
}

/**
 * El mail completo: franja con el logo, el osito con el título, el número
 * de pedido, el contenido y el pie con Instagram y la web.
 */
function order_mail_layout(string $preheader, string $title, string $subtitle, ?string $pill, string $inner): string
{
    $t = MAIL_TITLE_FONT;
    $x = MAIL_TEXT_FONT;
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        . '<title>' . e($title) . '</title></head>'
        . '<body style="margin:0;padding:0;background:#FEFDF8">'
        // Texto de vista previa (lo que se ve en la bandeja antes de abrir)
        . '<div style="display:none;max-height:0;overflow:hidden;opacity:0">' . e($preheader) . '</div>'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FEFDF8"><tr><td align="center" style="padding:24px 12px">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">'
        // Logo
        . '<tr><td align="center" style="background:#FDE7D6;border-radius:24px 24px 0 0;padding:22px 20px 18px">'
        . '<a href="' . MAIL_SITE . '"><img src="' . MAIL_SITE . '/email/logo.png" width="170" alt="Tatan Kids" style="display:block;width:170px;height:auto;border:0"></a>'
        . '</td></tr>'
        // Osito + título
        . '<tr><td align="center" style="background:#FFFFFF;padding:22px 24px 6px;border-left:1px solid #F0E6DA;border-right:1px solid #F0E6DA">'
        . '<img src="' . MAIL_SITE . '/email/osito-feliz.png" width="120" alt="" style="display:block;width:120px;height:auto;border:0">'
        . '<h1 style="margin:10px 0 6px;font-family:' . $t . ';font-size:26px;line-height:1.2;color:#3F3F46">' . $title . '</h1>'
        . '<p style="margin:0;font-family:' . $x . ';font-size:15px;line-height:1.6;color:#6B6159">' . $subtitle . '</p>'
        . ($pill ? '<div style="display:inline-block;margin-top:12px;padding:6px 14px;border-radius:999px;background:#C7E2D6;font-family:' . $x . ';font-size:13px;font-weight:bold;color:#3F5F52">Pedido ' . e($pill) . '</div>' : '')
        . '</td></tr>'
        // Contenido
        . '<tr><td style="background:#FFFFFF;padding:18px 20px 24px;border-left:1px solid #F0E6DA;border-right:1px solid #F0E6DA;border-bottom:1px solid #F0E6DA;border-radius:0 0 24px 24px">'
        . $inner . '</td></tr>'
        // Pie
        . '<tr><td align="center" style="padding:20px 10px 4px;font-family:' . $x . ';font-size:12px;line-height:1.8;color:#B9A89B">'
        . 'Hecho con 💛 en Argentina<br>'
        . '<a href="' . MAIL_INSTAGRAM . '" style="color:#B9A89B;font-weight:bold;text-decoration:none">Instagram @tatankids26</a>'
        . ' &nbsp;·&nbsp; <a href="' . MAIL_SITE . '" style="color:#B9A89B;font-weight:bold;text-decoration:none">tatankids.com.ar</a>'
        . '</td></tr>'
        . '</table></td></tr></table></body></html>';
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
    // El nombre tiene que coincidir con el certificado del servidor (*.ferozo.com)
    $host = defined('MAIL_SMTP_HOST') && MAIL_SMTP_HOST !== '' ? MAIL_SMTP_HOST : 'a0190966.ferozo.com';
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

        // --- A la tienda: todo para preparar y despachar el pedido
        $total = money_ars($o['amounts']['total']);
        $storeInner = order_items_html($o)
            . mail_section('👶', 'Quién compró', '#F3F8F5',
                '<strong>' . e($b['name']) . '</strong><br>'
                . '<a href="mailto:' . e($b['email']) . '" style="color:#3F3F46">' . e($b['email']) . '</a><br>'
                . 'Tel: ' . e($b['phone']) . ($b['dni'] !== '' ? ' · DNI ' . e($b['dni']) : ''))
            . mail_section('🚚', 'Entrega', '#FEF6EC',
                '<strong>' . e($o['shipping']['method']) . '</strong><br>' . $delivery
                . ($o['shipping']['notes'] !== '' ? '<br><span style="color:#8A7F76">Notas: ' . e($o['shipping']['notes']) . '</span>' : ''))
            . mail_section('💳', 'Pago', '#F2F6FB',
                $pay . '<br><span style="color:#8A7F76;font-size:12px">ID ' . e((string)$o['payment']['id']) . '</span>')
            . mail_button(MAIL_SITE . '/crm#ventas', 'Ver en el CRM →');
        $storeHtml = order_mail_layout(
            "Nueva venta {$num} por {$total}",
            '¡Nueva venta! 🎉',
            'Entró un pago aprobado por <strong>' . $total . '</strong>. Acá tenés todo para prepararlo.',
            $num,
            $storeInner
        );
        $okStore = order_send_mail(order_notify_to(), "🧸 Nueva venta {$num} · {$total}", $storeHtml, $b['email']);

        // --- Al comprador: resumen y qué sigue
        $first = explode(' ', trim($b['name']))[0] ?? '';
        $buyerInner = order_items_html($o)
            . mail_section('🚚', 'Entrega', '#FEF6EC', '<strong>' . e($o['shipping']['method']) . '</strong><br>' . $delivery)
            . mail_section('✨', '¿Qué sigue?', '#F3F8F5',
                'Ya estamos preparando tu pedido con mucho cariño. Cuando lo despachemos te mandamos el código de seguimiento para que sepas dónde está.')
            . mail_button(MAIL_SITE . '/productos', 'Seguir comprando')
            . '<p style="margin:14px 0 0;text-align:center;font-family:' . MAIL_TEXT_FONT . ';font-size:13px;line-height:1.6;color:#8A7F76">'
            . '¿Dudas? Respondé este mail o escribinos a <a href="mailto:' . e(order_notify_to()) . '" style="color:#8A7F76">' . e(order_notify_to()) . '</a></p>';
        $buyerHtml = order_mail_layout(
            "Recibimos tu pago. Tu pedido es el {$num}",
            '¡Gracias por tu compra' . ($first !== '' ? ', ' . e($first) : '') . '!',
            'Recibimos tu pago y tu pedido ya está en camino a prepararse. 💛',
            $num,
            $buyerInner
        );
        $okBuyer = order_send_mail($b['email'], "¡Gracias por tu compra! Pedido {$num} 🧸", $buyerHtml, order_notify_to());

        if (!$okStore || !$okBuyer) {
            order_event($orderId, 'paid', 'No se pudo mandar el mail ' . (!$okStore ? 'a la tienda' : '') . (!$okStore && !$okBuyer ? ' ni ' : '') . (!$okBuyer ? 'al comprador' : ''));
        }
    } catch (Throwable $e) {
        error_log('[orders] aviso de venta: ' . $e->getMessage());
    }
}
