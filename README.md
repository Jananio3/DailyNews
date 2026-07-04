# DailyNews - Task

## Setup & Installation Instructions

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
