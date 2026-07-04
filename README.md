# Daily News Management Module

A modern, responsive **Daily News Management Module** built using a hybrid stack of **React 19**, **Bootstrap 5**, **jQuery**, and **PHP**. The application supports full CRUD operations, live search and multi-criteria filtering, manual database-driven pagination, media uploading with strict validation, layout/theme customization, and client-side persistence via LocalStorage.

---

## 🌟 Key Technology Stack
- **Frontend Framework**: [React 19](https://react.dev/) (Vite-powered for rapid development and build optimization)
- **Styling**: [Bootstrap 5.3](https://getbootstrap.com/) (Modified with custom premium glassmorphism and gradient accents)
- **HTTP/AJAX Layer**: [jQuery 4.0](https://jquery.com/) (Utilized inside React component lifecycle for asynchronous API communication)
- **Backend API**: [PHP (PDO & MySQL)](https://www.php.net/) (Handles RESTful actions, handles file uploads, validates inputs, and manages disk storage)
- **Database**: MySQL (Self-creating schema on application startup)

---

## 📋 Interviewer Implementation Guide

Here is a point-by-point breakdown of how the requirements listed in the task description were implemented in the codebase:

### 1. Dashboard Development
*   **Data Representation (Grid & List Layouts)**: 
    *   Designed a responsive dashboard using Bootstrap 5 grid columns (`row g-4` and `col-12 col-md-6 col-lg-4`).
    *   Added a layout toggle in the dashboard header allowing users to switch between a visual **Grid View** (showing image cards and category badges) and a structured **List View** (compact rows, ideal for quick scanning).
*   **Manual Pagination**: 
    *   **Backend Implementation**: The `api.php` endpoint accepts `page` and `limit` query parameters, calculates the query offset (`$offset = ($page - 1) * $limit`), and executes a MySQL statement using `LIMIT :limit OFFSET :offset`. The database also counts total matching records to return `total_pages` and `total_records` in the response JSON.
    *   **Frontend Implementation**: The UI displays manual page numbers and "Prev/Next" buttons. Changing pages adjusts the React state `page`, triggering a fresh AJAX request to fetch records for that specific page.
*   **Search & Filters**:
    *   **Live Search**: An input box queries fields (`News_Title`, `News_Description`, `City`, `Country`) dynamically via SQL `LIKE` clauses.
    *   **Multi-Criteria Filters**: Dropdowns for Category, Status, Language, and Region build dynamic SQL `WHERE` clauses on the backend, allowing interviewers to test complex filtering scenarios.
    *   Filters reset instantly through a single-click "Reset Filters" action.

---

### 2. Daily News Master (Entry Screen)
*   **Unified Entry Form**: 
    *   Developed a dynamic form supporting **Add** and **Edit** actions. Clicking "Edit" on a dashboard item populates the form with existing record data, changes the entry screen context, and caches existing media for possible updates.
*   **Input Validation**:
    *   **Client-Side**: Prior to submission, React validates that required fields (`News_Title`, `News_Description`, `Category`, `News_Date`) are non-empty. File sizes and extensions are also checked before upload.
    *   **Server-Side**: The PHP script verifies that required fields are present in the `$_POST` array and returns a `400 Bad Request` JSON error response if any are missing.
*   **Error & Success Notification Handlers**:
    *   Success and error states are managed by React hooks. When an operation succeeds or fails, a custom-designed Bootstrap alert appears with automatic dismiss timers (success alerts clear in 5 seconds, errors in 7 seconds).
*   **LocalStorage Integrations**:
    *   **Form Draft Autosave**: A `useEffect` hook monitors the creation form fields. If a user starts writing a news entry and accidentally navigates away or reloads the browser, the inputs are serialized and stored in `news_form_draft`. When they return, a dialog prompts them to **Restore Draft** or **Clear Draft**.
    *   **Presentation Settings**: User configurations (preferred visual theme `dark`/`light`, layout mode `grid`/`list`, and page limit) are saved in `news_presentation_settings` to preserve user settings across sessions.

---

### 3. AJAX Integration (React + jQuery)
*   **Dynamic Operations (No Reloads)**: 
    *   All database interactions (listing, creating, updating, and deleting) are executed asynchronously. Page reloads are fully avoided, ensuring a single-page application (SPA) experience.
*   **AJAX Call Structures**:
    *   Instead of standard `fetch` or `axios`, the application imports `$` from `jquery` and calls `$.ajax()`.
    *   For file uploads (Create/Update), the application constructs a JavaScript `FormData` object containing files and texts, setting `processData: false` and `contentType: false` within jQuery to allow multipart form handling:
      ```javascript
      $.ajax({
        url: '/api.php?action=create',
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        success: (res) => { ... }
      });
      ```
    *   Upon successful response, state hooks (`setNewsList`, `setTotalRecords`, etc.) trigger a re-render, showing updated records immediately on the dashboard.

---

### 4. Database & Table Structure
The database structure is designed to house structured news feeds, support multi-lingual/regional sorting, and track administrative audit fields.

*   **Table Name**: `daily_news`
*   **Schema Details**:
    *   `News_Id` (INT, Primary Key, Auto Increment)
    *   `News_Title` (VARCHAR(255), Required)
    *   `News_Description` (TEXT, Required)
    *   `News_Banner_Image` (TEXT, Nullable) &mdash; *Stores a JSON string array of uploaded images metadata (name, path, size, type).*
    *   `News_Videos` (TEXT, Nullable) &mdash; *Stores a JSON string array of uploaded videos metadata.*
    *   `Category` (VARCHAR(100), Required) &mdash; *Politics, Sports, Business, etc.*
    *   `News_Date` (DATE, Required)
    *   `Region` (VARCHAR(100), Nullable)
    *   `Status` (VARCHAR(20), Default: 'Active') &mdash; *Active / Inactive*
    *   `Language` (VARCHAR(100), Nullable)
    *   `City` (VARCHAR(100), Nullable)
    *   `Country` (VARCHAR(100), Nullable)
    *   `CreatedOn` (TIMESTAMP, Default: CURRENT_TIMESTAMP)
    *   `CreatedBy` (VARCHAR(100), Nullable)
    *   `UpdatedOn` (TIMESTAMP, Default: CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)
    *   `UpdatedBy` (VARCHAR(100), Nullable)

---

### 5. Technical Requirements & File Handling
*   **Image & Video Upload Handling**:
    *   Supports multiple file selections for both news banners and videos.
*   **Size and Type Validations**:
    *   **Size Limit**: Strictly capped at **5 MB** per file. Validated in frontend JS using `file.size` and checked server-side in PHP by inspecting the `$_FILES` size attribute.
    *   **Allowed Formats**:
        *   *Images*: `jpg`, `jpeg`, `png`, `gif`, `webp`
        *   *Videos*: `mp4`, `webm`, `ogg`, `avi`, `mov`
*   **File Deletion & Storage Management**:
    *   Uploaded files are assigned a unique, sanitized name using `uniqid()` to prevent file collision in the server's `uploads/` directory.
    *   **Media Lifecycle Cleanup**: When a news article is deleted, the backend reads the stored JSON strings for images and videos, maps their path strings, and removes the physical files from the disk using PHP's `unlink()`, preventing orphaned assets.

---

## 📂 Project Directory Structure

```bash
├── api.php                 # PHP REST API (CORS, CRUD actions, file validations)
├── index.php               # Routing entry point (serves API, uploads, or react static build)
├── schema.sql              # Database schema definition for MySQL
├── index.html              # Main HTML frame containing font imports & root mount point
├── package.json            # Vite, React 19, Bootstrap, & jQuery dependencies config
├── vite.config.js          # Vite configuration
├── uploads/                # Directory containing uploaded media files (created automatically)
├── dist/                   # Production build directory (generated by Vite)
└── src/
    ├── main.jsx            # React mounting script
    ├── App.jsx             # Main Application component (Dashboard UI, Entry Form, AJAX logic)
    ├── App.css             # Main stylesheet (Glassmorphism design, scrollbars, layouts)
    └── index.css           # Global typography, color schemes, and skeleton styling
```

---

## 🚀 Setup & Installation Instructions

Follow these steps to run this project locally:

### 1. Database Configuration
1. Start your local server stack (e.g., **XAMPP**, **WAMP**, or **MAMP**).
2. Open **phpMyAdmin** or your preferred MySQL manager.
3. Import the `schema.sql` file, or simply ensure your MySQL server is running.
4. *Note: `api.php` is configured to automatically create the database `news_db` and table `daily_news` if they do not exist when the API is first hit.*

### 2. Configure Backend Credentials
1. Open [api.php](file:///c:/Users/Janani/OneDrive/Desktop/News/api.php).
2. Adjust the connection variables to match your local setup:
   ```php
   $db_host = 'localhost';
   $db_user = 'root';
   $db_pass = ''; // Add your password if any
   $db_name = 'news_db';
   ```

### 3. Frontend Installation
Navigate to the root directory and install dependencies:
```bash
npm install
```

### 4. Running the Project
You can run the project in two ways:

#### Option A: Development Server (Recommended)
1. Start the Vite React development server:
   ```bash
   npm run dev
   ```
2. Set up a PHP local server inside the root directory to route API requests (on another terminal):
   ```bash
   php -S localhost:8000
   ```
3. Update Vite's proxy settings or API endpoints in React if accessing via different ports (standard routing in Vite routes `/api.php` to target port).

#### Option B: Production Build (Single Server Deployment)
1. Build the production version of the frontend:
   ```bash
   npm run build
   ```
2. Move the entire folder directory to your web server host folder (e.g., `xampp/htdocs/news/`).
3. Open your browser and navigate to `http://localhost/news/index.php`. The router will serve the production-ready React assets from the `dist/` directory and handle API queries seamlessly on a single port.
