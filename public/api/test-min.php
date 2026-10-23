<?php
/**
 * Test ultra-minimalista: sin PDO, sin dependencias.
 * Solo confirma que PHP funciona y que Ferozo ejecuta el archivo.
 * URL: https://tatankids.com.ar/api/test-min.php
 */
header('Content-Type: text/plain; charset=utf-8');
echo "=== Tatan PHP Test (minimal) ===\n";
echo "PHP versión: " . phpversion() . "\n";
echo "SAPI: " . php_sapi_name() . "\n";
echo "OS: " . PHP_OS . "\n";
echo "cwd: " . getcwd() . "\n";
echo "date: " . date('c') . "\n";
echo "memory_limit: " . ini_get('memory_limit') . "\n";

echo "\nExtensiones: ";
echo extension_loaded('pdo') ? '[pdo OK] ' : '[pdo NO] ';
echo extension_loaded('pdo_mysql') ? '[pdo_mysql OK] ' : '[pdo_mysql NO] ';
echo extension_loaded('mysqli') ? '[mysqli OK] ' : '[mysqli NO] ';
echo extension_loaded('json') ? '[json OK] ' : '[json NO] ';
echo "\n";

echo "\n📝 Si ves este texto hasta acá, el servidor ejecuta PHP OK y el error 500 era el .htaccess o algún archivo PHP con errores.\n";
echo "\nAhora probamos MySQL via localhost (credenciales hardcodeadas del test):\n";

$host = 'localhost';
$user = 'a0190966_tatandb';
$pass = 'Rag*dHtI*1KN3bC';
$db   = 'a0190966_tatandb';

if (!extension_loaded('mysqli')) {
    echo "⚠️  Falta mysqli. Probá con PDO.\n";
} else {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    try {
        $m = new mysqli($host, $user, $pass, $db, 3306);
        $m->set_charset('utf8mb4');
        $r = $m->query("SELECT VERSION() AS v, DATABASE() AS db, NOW() AS now");
        $row = $r->fetch_assoc();
        echo "✅ MySQL (mysqli) OK\n";
        echo "   Versión: " . $row['v'] . "\n";
        echo "   Base:    " . $row['db'] . "\n";
        echo "   Hora:    " . $row['now'] . "\n";

        $c = $m->query("SHOW TABLES");
        echo "\nTablas en la BD (" . $c->num_rows . "):\n";
        while ($t = $c->fetch_row()) {
            echo "   · " . $t[0] . "\n";
        }
    } catch (Throwable $e) {
        echo "❌ MySQL falló: " . get_class($e) . " - " . $e->getMessage() . "\n";
    }
}
echo "\nFin del test.";
