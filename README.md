# PulseNews — Daily News Management Module

A full-stack **Daily News Management** application with a React frontend and PHP backend, featuring complete **CRUD** operations, AJAX updates (no page reload), drag-and-drop file uploads, and a responsive dashboard with filters and pagination.

---

## ✨ Features

### Dashboard
- **Grid / List view** toggle with live switch
- **Stats bar** — total articles, active news, languages, categories
- **Search** across title, description, city, country
- **Filters** — Category, Status, Language, Region (drop-downs)
- **Manual pagination** with configurable rows-per-page (3 / 6 / 9 / 12)
- **Skeleton loaders** during AJAX fetch
- **Empty state** with prompt to add first record
- **News Detail Modal** with image carousel and video player

### News Master Entry Form
- **Create / Edit / Delete** news records
- **Client-side validation** with inline error messages
- **LocalStorage draft autosave** — restores unsaved form between sessions
- **Drag-and-drop file upload** for Banner Images and Videos
  - Allowed image types: JPG, JPEG, PNG, GIF, WEBP
  - Allowed video types: MP4, WEBM, OGG, AVI, MOV
  - **Max file size: 5 MB per file**
  - Live file previews with individual remove buttons
  - Retained file management during edits
- **Floating labels** for all form fields
- **Date picker** for News Date

### Technical Features
- **AJAX via jQuery** — all operations update the page **without reload**
- **Dark/Light mode toggle** — preference saved to LocalStorage
- **PHP backend** auto-creates `news_db` database and `daily_news` table on first run
- **Glassmorphism UI** with smooth animations
- **Bootstrap 5** responsive layout
- **Outfit + Inter** Google Fonts

---

## 🗂️ Project Structure

```
News/
├── api.php              # PHP backend — all CRUD endpoints
├── index.php            # PHP router (serves dist/ + proxies API)
├── index.html           # Vite entry point (dev mode)
├── schema.sql           # Database schema reference
├── uploads/             # Uploaded media files (auto-created)
├── dist/                # Production React build (npm run build)
├── src/
│   ├── main.jsx         # React entry point
│   ├── App.jsx          # Main app — all components & AJAX logic
│   ├── App.css          # Animations, utilities
│   └── index.css        # Design system (glassmorphism, theme vars)
└── vite.config.js       # Vite config with dev proxy to PHP
```

---

## 🚀 Quick Start

### Prerequisites
- **XAMPP** with PHP 8.x and MySQL (MariaDB)
- **Node.js** v18+

### Step 1 — Start the MySQL Server
```
Start XAMPP Control Panel → Start MySQL
```
or run: `Start-Process C:\xampp\mysql\bin\mysqld.exe`

### Step 2 — Install Frontend Dependencies
```bash
npm install
```

### Step 3 — Start the PHP Backend Server
```bash
C:\xampp\php\php.exe -S localhost:8000 index.php
```
> ⚠️ The PHP server **must run** on port 8000 (Vite proxies to it).

### Step 4 — Run in Development Mode (Hot Reload)
```bash
npm run dev
```
App runs at: **http://localhost:5173**

### Step 4 (Alternative) — Run Production Build
```bash
npm run build
```
Then visit **http://localhost:8000** to use the compiled frontend.

---

## 🗃️ Database

The PHP backend automatically creates the database and table on first request. No manual SQL import needed.

| Column | Type | Notes |
|---|---|---|
| `News_Id` | INT AUTO_INCREMENT | Primary Key |
| `News_Title` | VARCHAR(255) | Required |
| `News_Description` | TEXT | Required |
| `News_Banner_Image` | TEXT (JSON) | Array of file objects |
| `News_Videos` | TEXT (JSON) | Array of file objects |
| `Category` | VARCHAR(100) | Required |
| `News_Date` | DATE | Required |
| `Region` | VARCHAR(100) | Optional |
| `Status` | VARCHAR(20) | Active / Inactive |
| `Language` | VARCHAR(100) | Optional |
| `City` | VARCHAR(100) | Optional |
| `Country` | VARCHAR(100) | Optional |
| `CreatedOn` | TIMESTAMP | Auto-set |
| `CreatedBy` | VARCHAR(100) | Optional |
| `UpdatedOn` | TIMESTAMP | Auto-updated |
| `UpdatedBy` | VARCHAR(100) | Optional |

---

## 🔌 API Endpoints

All endpoints use `/api.php?action=<ACTION>`:

| Action | Method | Description |
|---|---|---|
| `list` | GET | Paginated, filtered list of news |
| `get` | GET | Single record by `?id=<id>` |
| `create` | POST | Create new news record (multipart/form-data) |
| `update` | POST | Update existing record by `News_Id` |
| `delete` | GET | Delete record and files by `?id=<id>` |

---

## 🎨 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8 |
| Styling | Bootstrap 5, Vanilla CSS |
| HTTP Client | jQuery AJAX |
| Backend | PHP 8.0 |
| Database | MySQL / MariaDB (via XAMPP) |
| Fonts | Google Fonts (Outfit, Inter) |
| Icons | Bootstrap Icons 1.11 |
