<?php
/**
 * DailyNews Router
 * Routes requests to the PHP API, uploaded media files, or the compiled React frontend.
 */

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// 1. Route API requests
if (preg_match('/^\/api\.php/', $uri)) {
    require_once __DIR__ . '/api.php';
    exit();
}

// 2. Serve files from the uploads directory
if (strpos($uri, '/uploads/') === 0) {
    $filePath = __DIR__ . $uri;
    if (file_exists($filePath) && is_file($filePath)) {
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mimeTypes = [
            'png'  => 'image/png',
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif'  => 'image/gif',
            'webp' => 'image/webp',
            'mp4'  => 'video/mp4',
            'webm' => 'video/webm',
            'ogg'  => 'video/ogg',
            'mov'  => 'video/quicktime',
            'avi'  => 'video/x-msvideo'
        ];
        
        $contentType = $mimeTypes[$ext] ?? 'application/octet-stream';
        header("Content-Type: $contentType");
        header("Content-Length: " . filesize($filePath));
        readfile($filePath);
        exit();
    } else {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Uploaded file not found']);
        exit();
    }
}

// 3. Serve static assets under the dist directory
if ($uri !== '/' && file_exists(__DIR__ . '/dist' . $uri)) {
    $filePath = __DIR__ . '/dist' . $uri;
    if (is_file($filePath)) {
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mimeTypes = [
            'css'  => 'text/css',
            'js'   => 'application/javascript',
            'png'  => 'image/png',
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif'  => 'image/gif',
            'webp' => 'image/webp',
            'svg'  => 'image/svg+xml',
            'ico'  => 'image/x-icon',
            'json' => 'application/json'
        ];
        $contentType = $mimeTypes[$ext] ?? 'application/octet-stream';
        header("Content-Type: $contentType");
        header("Content-Length: " . filesize($filePath));
        readfile($filePath);
        exit();
    }
}

// 4. Default: Serve the compiled index.html
$indexFile = __DIR__ . '/dist/index.html';
if (file_exists($indexFile)) {
    readfile($indexFile);
} else {
    // If not built yet, guide the user
    header("Content-Type: text/html; charset=UTF-8");
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <title>DailyNews - Setup</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;700&family=Inter:wght@400&display=swap" rel="stylesheet">
        <style>
            body {
                font-family: 'Inter', sans-serif;
                background-color: #0f172a;
                color: #f8fafc;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
            }
            .card {
                background: rgba(30, 41, 59, 0.7);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 16px;
                padding: 40px;
                max-width: 500px;
                text-align: center;
                box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3);
            }
            h1 {
                font-family: 'Outfit', sans-serif;
                margin-top: 0;
                background: linear-gradient(135deg, #818cf8 0%, #c084fc 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            code {
                background: #1e293b;
                padding: 4px 8px;
                border-radius: 4px;
                font-family: monospace;
                color: #e2e8f0;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>DailyNews Frontend Ready</h1>
            <p>The backend PHP scripts are configured. To run the frontend, compile the React build by running:</p>
            <p><code>npm run build</code></p>
            <p>Or run the local development server with:</p>
            <p><code>npm run dev</code></p>
        </div>
    </body>
    </html>
    <?php
}
?>
