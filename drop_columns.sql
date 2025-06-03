-- ==============================================
-- DROP COLUMNS FROM USERS TABLE
-- ==============================================

-- Drop the columns that are no longer needed
ALTER TABLE users 
DROP COLUMN full_name,
DROP COLUMN phone,
DROP COLUMN gender;

-- Verify the table structure after dropping columns
DESCRIBE users;

-- Optional: Check remaining data
SELECT * FROM users LIMIT 5; 