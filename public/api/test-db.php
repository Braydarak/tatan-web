<?php
/**
 * ============================================================
 *  Test rápido de conexión MySQL via PHP + localhost (Ferozo).
 *  Cómo usarlo:
 *    1) Subí esta carpeta /api/ a public_html/tuweb/ en Ferozo
 *    2) Desde el navegador → https://tatankids.com.ar/api/test-db.php
 *    3) Si todo está OK verás "✅ CONEXIÓN OK"
 *    4) Después de probar, BORRA test-db.php por seguridad.
 * ============================================================
 */
declare(strict_types=1);

$host  = 'localhost';
$port  = 3306;
$user  = 'a0190966_tatandb';
$pass  = 'Rag*dHtI*1KN3bC';
$db    = 'a0190966_tatandb';

header('Content-Type: text/plain; charset=utf-8');
echo "🧪 Probando MySQL (host={$host}, user={$user}, db={$db})...\n\n";

try {
    $pdo = new PDO(
        "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4",
        $user, $pass,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
    echo "✅ CONEXIÓN OK\n\n";

    // Versión MySQL
    $stmt = $pdo->query("SELECT VERSION() AS v, DATABASE() AS db, NOW() AS now");
    $r = $stmt->fetch();
    echo "  · MySQL versión: {$r['v']}\n";
    echo "  · Base actual:   {$r['db']}\n";
    echo "  · Hora servidor: {$r['now']} (UTC/GMT+0)\n\n";

    // Tablas del schema tatan
    $tables = $pdo->query("SHOW TABLES FROM `{$db}`")->fetchAll(PDO::FETCH_COLUMN);
    echo "🗂️  Tablas encontradas: " . count($tables) . "\n";
    foreach ($tables as $t) {
        $c = $pdo->query("SELECT COUNT(*) FROM `{$t}`")->fetchColumn();
        echo "   · {$t}  ({$c} filas)\n";
    }

    // Admin Darak existe con password_hash bueno?
    echo "\n👤 Admins:\n";
    foreach ($pdo->query("SELECT id, username, name, email, role, last_login_at, created_at FROM admins")->fetchAll() as $row) {
        echo "   · id={$row['id']} {$row['username']} ({$row['role']}) · {$row['name']} · {$row['email']} · last_login=" . ($row['last_login_at'] ?? '-') . "\n";
    }

    echo "\n🎉 Todo OK. Ya podés borrar este archivo test-db.php";
} catch (Throwable $e) {
    echo "❌ ERROR: " . get_class($e) . "\n";
    echo "   Código: " . $e->getCode() . "\n";
    echo "   Mensaje: " . $e->getMessage() . "\n";
    exit(1);
}
