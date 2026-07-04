<?php
// Set headers for CORS and JSON response
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Handle OPTIONS request for CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'news_db';

try {
    // Connect to MySQL
    $pdo = new PDO("mysql:host=$db_host", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Create database if not exists
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db_name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$db_name`");

    // Create Table if not exists
    $table_query = "
    CREATE TABLE IF NOT EXISTS daily_news (
        News_Id INT AUTO_INCREMENT PRIMARY KEY,
        News_Title VARCHAR(255) NOT NULL,
        News_Description TEXT NOT NULL,
        News_Banner_Image TEXT NULL,
        News_Videos TEXT NULL,
        Category VARCHAR(100) NOT NULL,
        News_Date DATE NOT NULL,
        Region VARCHAR(100) NULL,
        Status VARCHAR(20) DEFAULT 'Active',
        Language VARCHAR(100) NULL,
        City VARCHAR(100) NULL,
        Country VARCHAR(100) NULL,
        CreatedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CreatedBy VARCHAR(100) NULL,
        UpdatedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UpdatedBy VARCHAR(100) NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ";
    $pdo->exec($table_query);

} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit();
}

// Create uploads directory if not exists
$upload_dir = 'uploads/';
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

// Helper function to handle file uploads
function handleFileUpload($files_key, $allowed_types, $max_size = 5242880) { // 5MB in bytes
    if (!isset($_FILES[$files_key]) || empty($_FILES[$files_key]['name'][0])) {
        return [];
    }

    $uploaded_files = [];
    $files = $_FILES[$files_key];
    $count = is_array($files['name']) ? count($files['name']) : 1;

    for ($i = 0; $i < $count; $i++) {
        $name = is_array($files['name']) ? $files['name'][$i] : $files['name'];
        $tmp_name = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
        $size = is_array($files['size']) ? $files['size'][$i] : $files['size'];
        $error = is_array($files['error']) ? $files['error'][$i] : $files['error'];
        $type = is_array($files['type']) ? $files['type'][$i] : $files['type'];

        if ($error !== UPLOAD_ERR_OK) {
            continue;
        }

        // Validate size
        if ($size > $max_size) {
            throw new Exception("File '$name' exceeds the maximum allowed size of 5MB.");
        }

        // Validate extension / MIME type
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        if (!in_array($ext, $allowed_types)) {
            throw new Exception("File '$name' has an invalid extension. Allowed extensions: " . implode(', ', $allowed_types));
        }

        // Create unique name
        $unique_name = uniqid() . '_' . preg_replace("/[^a-zA-Z0-9\._-]/", "_", $name);
        $target_path = 'uploads/' . $unique_name;

        if (move_uploaded_file($tmp_name, $target_path)) {
            $uploaded_files[] = [
                'name' => $name,
                'path' => $target_path,
                'size' => $size,
                'type' => $type
            ];
        } else {
            throw new Exception("Failed to save uploaded file '$name'.");
        }
    }

    return $uploaded_files;
}

// Handle request routing
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'list':
        try {
            // Filters
            $search = $_GET['search'] ?? '';
            $category = $_GET['category'] ?? '';
            $status = $_GET['status'] ?? '';
            $language = $_GET['language'] ?? '';
            $region = $_GET['region'] ?? '';
            
            // Pagination
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 5;
            if ($page < 1) $page = 1;
            if ($limit < 1) $limit = 5;
            $offset = ($page - 1) * $limit;

            $where_clauses = [];
            $params = [];

            if ($search !== '') {
                $where_clauses[] = "(News_Title LIKE :search OR News_Description LIKE :search OR City LIKE :search OR Country LIKE :search)";
                $params['search'] = "%$search%";
            }
            if ($category !== '') {
                $where_clauses[] = "Category = :category";
                $params['category'] = $category;
            }
            if ($status !== '') {
                $where_clauses[] = "Status = :status";
                $params['status'] = $status;
            }
            if ($language !== '') {
                $where_clauses[] = "Language = :language";
                $params['language'] = $language;
            }
            if ($region !== '') {
                $where_clauses[] = "Region = :region";
                $params['region'] = $region;
            }

            $where_sql = '';
            if (count($where_clauses) > 0) {
                $where_sql = "WHERE " . implode(" AND ", $where_clauses);
            }

            // Total count query
            $count_stmt = $pdo->prepare("SELECT COUNT(*) FROM daily_news $where_sql");
            $count_stmt->execute($params);
            $total_records = (int)$count_stmt->fetchColumn();
            $total_pages = ceil($total_records / $limit);

            // Fetch records query
            $select_query = "SELECT * FROM daily_news $where_sql ORDER BY CreatedOn DESC LIMIT :limit OFFSET :offset";
            $stmt = $pdo->prepare($select_query);
            
            // Bind value for offset and limit (must bind as integer)
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            
            $records = $stmt->fetchAll();

            // Decode JSON fields
            foreach ($records as &$record) {
                $record['News_Banner_Image'] = json_decode($record['News_Banner_Image'] ?? '[]', true);
                $record['News_Videos'] = json_decode($record['News_Videos'] ?? '[]', true);
            }

            echo json_encode([
                'status' => 'success',
                'data' => $records,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total_records' => $total_records,
                    'total_pages' => $total_pages
                ]
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'get':
        try {
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            $stmt = $pdo->prepare("SELECT * FROM daily_news WHERE News_Id = ?");
            $stmt->execute([$id]);
            $record = $stmt->fetch();

            if ($record) {
                $record['News_Banner_Image'] = json_decode($record['News_Banner_Image'] ?? '[]', true);
                $record['News_Videos'] = json_decode($record['News_Videos'] ?? '[]', true);
                echo json_encode(['status' => 'success', 'data' => $record]);
            } else {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'Record not found']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'create':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
            exit();
        }

        try {
            // Validation of required fields
            $title = $_POST['News_Title'] ?? '';
            $description = $_POST['News_Description'] ?? '';
            $category = $_POST['Category'] ?? '';
            $date = $_POST['News_Date'] ?? '';

            if (empty($title) || empty($description) || empty($category) || empty($date)) {
                throw new Exception("Title, Description, Category, and Date are required.");
            }

            // File uploads
            $allowed_img_exts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            $allowed_vid_exts = ['mp4', 'webm', 'ogg', 'avi', 'mov'];

            $uploaded_images = handleFileUpload('News_Banner_Image', $allowed_img_exts);
            $uploaded_videos = handleFileUpload('News_Videos', $allowed_vid_exts);

            // Optional fields
            $region = $_POST['Region'] ?? null;
            $status = $_POST['Status'] ?? 'Active';
            $language = $_POST['Language'] ?? null;
            $city = $_POST['City'] ?? null;
            $country = $_POST['Country'] ?? null;
            $createdBy = $_POST['CreatedBy'] ?? 'Admin';

            // Save to database
            $insert_query = "
            INSERT INTO daily_news (
                News_Title, News_Description, News_Banner_Image, News_Videos, 
                Category, News_Date, Region, Status, Language, City, Country, CreatedBy
            ) VALUES (
                :title, :description, :banner_image, :videos, 
                :category, :news_date, :region, :status, :language, :city, :country, :createdBy
            )
            ";

            $stmt = $pdo->prepare($insert_query);
            $stmt->execute([
                'title' => $title,
                'description' => $description,
                'banner_image' => json_encode($uploaded_images),
                'videos' => json_encode($uploaded_videos),
                'category' => $category,
                'news_date' => $date,
                'region' => $region,
                'status' => $status,
                'language' => $language,
                'city' => $city,
                'country' => $country,
                'createdBy' => $createdBy
            ]);

            $new_id = $pdo->lastInsertId();

            echo json_encode([
                'status' => 'success',
                'message' => 'News record created successfully.',
                'id' => $new_id
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'update':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
            exit();
        }

        try {
            $id = isset($_POST['News_Id']) ? (int)$_POST['News_Id'] : 0;
            if ($id <= 0) {
                throw new Exception("Invalid News ID.");
            }

            // Verify record exists
            $check_stmt = $pdo->prepare("SELECT * FROM daily_news WHERE News_Id = ?");
            $check_stmt->execute([$id]);
            $existing_record = $check_stmt->fetch();
            if (!$existing_record) {
                throw new Exception("Record not found.");
            }

            $existing_images = json_decode($existing_record['News_Banner_Image'] ?? '[]', true);
            $existing_videos = json_decode($existing_record['News_Videos'] ?? '[]', true);

            // Validation of required fields
            $title = $_POST['News_Title'] ?? '';
            $description = $_POST['News_Description'] ?? '';
            $category = $_POST['Category'] ?? '';
            $date = $_POST['News_Date'] ?? '';

            if (empty($title) || empty($description) || empty($category) || empty($date)) {
                throw new Exception("Title, Description, Category, and Date are required.");
            }

            // File uploads
            $allowed_img_exts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            $allowed_vid_exts = ['mp4', 'webm', 'ogg', 'avi', 'mov'];

            $new_images = handleFileUpload('News_Banner_Image', $allowed_img_exts);
            $new_videos = handleFileUpload('News_Videos', $allowed_vid_exts);

            // Handle file retention vs overwrite.
            // If new files are uploaded, we can merge them or replace them.
            // Let's replace the images/videos only if new files are uploaded, or if specified.
            // To make it simple: if new images are uploaded, append them to the existing ones.
            // If the user deleted an image in the frontend, we can handle that via a parameter,
            // or if a new file is uploaded, we can replace or append. Let's merge them!
            // Wait, we can also check if a list of retained files is sent.
            $retained_images_json = $_POST['Retained_Banner_Images'] ?? null;
            if ($retained_images_json !== null) {
                $retained_images = json_decode($retained_images_json, true);
                if (is_array($retained_images)) {
                    $existing_images = $retained_images;
                }
            }
            $retained_videos_json = $_POST['Retained_Videos'] ?? null;
            if ($retained_videos_json !== null) {
                $retained_videos = json_decode($retained_videos_json, true);
                if (is_array($retained_videos)) {
                    $existing_videos = $retained_videos;
                }
            }

            $final_images = array_merge($existing_images, $new_images);
            $final_videos = array_merge($existing_videos, $new_videos);

            // Optional fields
            $region = $_POST['Region'] ?? null;
            $status = $_POST['Status'] ?? 'Active';
            $language = $_POST['Language'] ?? null;
            $city = $_POST['City'] ?? null;
            $country = $_POST['Country'] ?? null;
            $updatedBy = $_POST['UpdatedBy'] ?? 'Admin';

            // Save to database
            $update_query = "
            UPDATE daily_news SET 
                News_Title = :title, 
                News_Description = :description, 
                News_Banner_Image = :banner_image, 
                News_Videos = :videos, 
                Category = :category, 
                News_Date = :news_date, 
                Region = :region, 
                Status = :status, 
                Language = :language, 
                City = :city, 
                Country = :country, 
                UpdatedBy = :updatedBy
            WHERE News_Id = :id
            ";

            $stmt = $pdo->prepare($update_query);
            $stmt->execute([
                'title' => $title,
                'description' => $description,
                'banner_image' => json_encode($final_images),
                'videos' => json_encode($final_videos),
                'category' => $category,
                'news_date' => $date,
                'region' => $region,
                'status' => $status,
                'language' => $language,
                'city' => $city,
                'country' => $country,
                'updatedBy' => $updatedBy,
                'id' => $id
            ]);

            echo json_encode([
                'status' => 'success',
                'message' => 'News record updated successfully.'
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'delete':
        try {
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            if ($id <= 0) {
                throw new Exception("Invalid News ID.");
            }

            // Retrieve files first to delete them from disk
            $stmt = $pdo->prepare("SELECT News_Banner_Image, News_Videos FROM daily_news WHERE News_Id = ?");
            $stmt->execute([$id]);
            $record = $stmt->fetch();

            if ($record) {
                $images = json_decode($record['News_Banner_Image'] ?? '[]', true);
                $videos = json_decode($record['News_Videos'] ?? '[]', true);

                // Delete images
                foreach ($images as $img) {
                    if (isset($img['path']) && file_exists($img['path'])) {
                        unlink($img['path']);
                    }
                }

                // Delete videos
                foreach ($videos as $vid) {
                    if (isset($vid['path']) && file_exists($vid['path'])) {
                        unlink($vid['path']);
                    }
                }

                // Delete database record
                $delete_stmt = $pdo->prepare("DELETE FROM daily_news WHERE News_Id = ?");
                $delete_stmt->execute([$id]);

                echo json_encode([
                    'status' => 'success',
                    'message' => 'News record and associated files deleted successfully.'
                ]);
            } else {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'Record not found']);
            }

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Action not found']);
        break;
}
?>
