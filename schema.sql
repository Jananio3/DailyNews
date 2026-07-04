-- Database Schema for Daily News Management Module
-- Automatically created by api.php, but provided here for reference.

CREATE DATABASE IF NOT EXISTS `news_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `news_db`;

CREATE TABLE IF NOT EXISTS `daily_news` (
    `News_Id` INT AUTO_INCREMENT PRIMARY KEY,
    `News_Title` VARCHAR(255) NOT NULL,
    `News_Description` TEXT NOT NULL,
    `News_Banner_Image` TEXT NULL, -- Stores JSON string array of uploaded images with name, path, size, type
    `News_Videos` TEXT NULL, -- Stores JSON string array of uploaded videos with name, path, size, type
    `Category` VARCHAR(100) NOT NULL,
    `News_Date` DATE NOT NULL,
    `Region` VARCHAR(100) NULL,
    `Status` VARCHAR(20) DEFAULT 'Active', -- 'Active' or 'Inactive'
    `Language` VARCHAR(100) NULL,
    `City` VARCHAR(100) NULL,
    `Country` VARCHAR(100) NULL,
    `CreatedOn` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `CreatedBy` VARCHAR(100) NULL,
    `UpdatedOn` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `UpdatedBy` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
