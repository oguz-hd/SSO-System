CREATE DATABASE IF NOT EXISTS admin_reports;
USE admin_reports;

CREATE TABLE IF NOT EXISTS activity_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    value JSON NOT NULL
);

INSERT INTO activity_reports (value) VALUES
    ('{"event": "system_init", "message": "MySQL arşiv veritabanı hazır"}');
