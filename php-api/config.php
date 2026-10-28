<?php

/**
 * ============================================================
 *   TATAN API PHP · config.php  (singleton PDO + helpers)
 * ============================================================
 *
 *   Este archivo lo importa TODOS los endpoints.
 *   - Conecta a MySQL via PDO usando localhost (mismo servidor Ferozo).
 *   - Envía headers CORS / JSON.
 *   - Expone funciones de auth (sesiones nativas PHP httpOnly).
 *
 *   ⚠️ NO subas credenciales hardcodeadas a git. En producción se puede
 *      sobrescribir via putenv o un .env manual.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: strict-origin-when-cross-origin');

// =========  CORS  =================================================
$allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://tatankids.com.ar',
    'https://www.tatankids.com.ar',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
// Deployments de preview de Vercel (p. ej. https://tatan-web-git-xyz-user.vercel.app)
$isVercelPreview = (bool) preg_match('#^https://[a-z0-9-]+\.vercel\.app$#i', $origin);
// Subdominios propios (p. ej. https://develop.tatankids.com.ar)
$isOwnSubdomain = (bool) preg_match('#^https://([a-z0-9-]+\.)+tatankids\.com\.ar$#i', $origin);

if ($origin !== '' && (in_array($origin, $allowedOrigins, true) || $isVercelPreview || $isOwnSubdomain)) {
    header("Access-Control-Allow-Origin: {$origin}");
} elseif ($origin === '') {
    // Sin Origin (same-origin o server-side): no se requiere CORS.
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $scheme = is_https() ? 'https' : 'http';
    header("Access-Control-Allow-Origin: {$scheme}://{$host}");
}
// La respuesta depende del Origin: evita que cachés compartidas mezclen CORS.
header('Vary: Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');

// Preflight CORS
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// =========  Credenciales  =========================================
define('DB_HOST', getenv('MYSQL_HOST') ?: 'localhost');
define('DB_PORT', (int)(getenv('MYSQL_PORT') ?: 3306));
define('DB_USER', getenv('MYSQL_USER') ?: 'a0190966_tatandb');
define('DB_PASS', getenv('MYSQL_PASSWORD') ?: 'Rag*dHtI*1KN3bC');
define('DB_NAME', getenv('MYSQL_DATABASE') ?: 'a0190966_tatandb');
define('DB_CHARSET', 'utf8mb4');

// =========  PDO Singleton  ========================================
function pdo(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;

    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        DB_HOST,
        DB_PORT,
        DB_NAME,
        DB_CHARSET
    );
    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci, time_zone = '+00:00'",
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'ok'    => false,
            'error' => 'DB_CONNECTION_FAILED',
            'msg'   => (ini_get('display_errors') ? $e->getMessage() : null),
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    return $pdo;
}

// =========  Helpers HTTP  =========================================
/**
 * ¿La petición original llegó por HTTPS? Tiene en cuenta el proxy
 * (Cloudflare delante de Ferozo termina TLS y reenvía por HTTP).
 */
function is_https(): bool
{
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') return true;
    return strtolower($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function input(string $key, mixed $default = null): mixed
{
    static $json = null;
    if ($json === null) $json = read_json_body();

    // 1) query string
    if (isset($_GET[$key])) return $_GET[$key];
    // 2) POST form
    if (isset($_POST[$key])) return $_POST[$key];
    // 3) JSON body
    if (is_array($json) && array_key_exists($key, $json)) return $json[$key];
    return $default;
}

function method(): string
{
    return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
}

function send_json(mixed $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// =========  Sesiones CRM (cookie httpOnly, sin JWT)  ==============
function tatan_session_start(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;

    $secure = is_https();

    // Si la petición viene de otro origen (p. ej. un deployment *.vercel.app),
    // la cookie debe viajar en contexto cross-site: SameSite=None + Secure.
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $originHost = $origin !== '' ? (parse_url($origin, PHP_URL_HOST) ?: '') : '';
    $crossSite = $originHost !== '' && $originHost !== $host;

    session_set_cookie_params([
        'lifetime' => 60 * 60 * 24 * 7, // 7 días
        'path'     => '/',
        'domain'   => '',
        'secure'   => $secure,
        'httponly' => true,
        'samesite' => ($crossSite && $secure) ? 'None' : 'Lax',
    ]);
    session_name('TATANCRMSESSID');
    session_start();
}

function crm_login(array $admin): void
{
    tatan_session_start();
    $_SESSION['crm_admin'] = [
        'id'       => (int)$admin['id'],
        'username' => $admin['username'],
        'name'     => $admin['name'] ?? null,
        'email'    => $admin['email'] ?? null,
        'role'     => $admin['role'] ?? 'editor',
    ];
    // regenerate para evitar fixation
    session_regenerate_id(true);
}

function crm_logout(): void
{
    tatan_session_start();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $p['path'],
            $p['domain'],
            $p['secure'],
            $p['httponly']
        );
    }
    session_destroy();
}

function crm_current(): ?array
{
    tatan_session_start();
    if (empty($_SESSION['crm_admin'])) return null;
    return $_SESSION['crm_admin'];
}

function require_crm_auth(): array
{
    $admin = crm_current();
    if (!$admin) {
        send_json([
            'ok'      => false,
            'error'   => 'UNAUTHENTICATED',
            'message' => 'Sesión inválida o expirada',
        ], 401);
    }
    return $admin;
}

// =========  Utiles  ===============================================
function e(mixed $v): string
{
    return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8');
}
