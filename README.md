# DailyNews - Task
Thank you for the opportunity to showcase my skills. Please go through the source code and implementation.

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

#### Development Server
1. Start the Vite React development server:
   ```bash
   npm run dev
   ```
2. Set up a PHP local server inside the root directory to route API requests (on another terminal):
   ```bash
   php -S localhost:8000
   ```
3. Update Vite's proxy settings or API endpoints in React if accessing via different ports (standard routing in Vite routes `/api.php` to target port).

<img width="1918" height="1132" alt="image" src="https://github.com/user-attachments/assets/5c575e06-2670-4205-af5e-291dadf5f52e" />


<img width="1918" height="1127" alt="image" src="https://github.com/user-attachments/assets/16f2bc3a-c96f-43bc-8fe3-150980fb45394" />


<img width="1918" height="1140" alt="image" src="https://github.com/user-attachments/assets/f70edcb5-20b6-4f02-9321-c5f8d52abfb0" />


<img width="843" height="540" alt="image" src="https://github.com/user-attachments/assets/011eed0d-fb28-4c88-829b-87ae033f2e40" />


<img width="1918" height="1138" alt="image" src="https://github.com/user-attachments/assets/8d3fef95-5bb8-44cb-861d-e8dfd71b85eb" />



