<?php
// Menangani sistem file Read-Only (Hanya-baca) milik Vercel
if (isset($_SERVER['VERCEL_URL']) || isset($_ENV['VERCEL_URL'])) {
    $dirs = [
        '/tmp/storage/framework/views',
        '/tmp/storage/framework/cache/data',
        '/tmp/storage/framework/sessions',
        '/tmp/storage/logs',
        '/tmp/storage/app',
        '/tmp/storage/bootstrap/cache',
    ];
    foreach ($dirs as $dir) {
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }
    }
    
    // Paksa Laravel menggunakan /tmp untuk penyimpanan sementara
    putenv('VIEW_COMPILED_PATH=/tmp/storage/framework/views');
    putenv('SESSION_DRIVER=cookie'); // Hindari file session di serverless
    putenv('LOG_CHANNEL=stderr');
    putenv('APP_SERVICES_CACHE=/tmp/storage/bootstrap/cache/services.php');
    putenv('APP_PACKAGES_CACHE=/tmp/storage/bootstrap/cache/packages.php');
    putenv('APP_CONFIG_CACHE=/tmp/storage/bootstrap/cache/config.php');
    putenv('APP_ROUTES_CACHE=/tmp/storage/bootstrap/cache/routes.php');
    putenv('APP_EVENTS_CACHE=/tmp/storage/bootstrap/cache/events.php');
}

// Meneruskan request dari Vercel ke index.php bawaan Laravel
require __DIR__ . '/../public/index.php';
