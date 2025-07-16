import mysql from 'mysql2/promise';

export interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
}

let pool: mysql.Pool | null = null;
let isInitialized = false;

export const createPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '0220',
      database: process.env.DATABASE_NAME || 'fyp',
      port: parseInt(process.env.DATABASE_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4'
    });
  }
  return pool;
};

// Initialize database tables and data
export const initializeDatabase = async () => {
  if (isInitialized) return;
  
  try {
    console.log('🔄 Initializing database...');
    await createTables();
    
    // Import and call the sample data function
    const { insertDefaultData } = await import('./sampleData');
    await insertDefaultData();
    
    // Create default achievements
    const { AchievementService } = await import('./services/achievementService');
    await AchievementService.createDefaultAchievements();
    
    isInitialized = true;
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Create all required tables
const createTables = async () => {
  const pool = createPool();
  
  const tables = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('student', 'admin') DEFAULT 'student',
      bio TEXT,
      total_points INT DEFAULT 0,
      current_streak INT DEFAULT 0,
      max_streak INT DEFAULT 0,
      last_login DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_username (username),
      INDEX idx_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Courses table
    `CREATE TABLE IF NOT EXISTS courses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      difficulty_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
      thumbnail_url VARCHAR(255),
      is_published BOOLEAN DEFAULT FALSE,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_difficulty (difficulty_level),
      INDEX idx_published (is_published)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Topics/Lessons table
    `CREATE TABLE IF NOT EXISTS topics (
      id INT AUTO_INCREMENT PRIMARY KEY,
      course_id INT NOT NULL,
      title VARCHAR(200) NOT NULL,
      content TEXT,
      structured_content JSON,
      lesson_order INT NOT NULL,
      points_reward INT DEFAULT 10,
      is_published BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      INDEX idx_course_order (course_id, lesson_order),
      INDEX idx_published (is_published),
      UNIQUE KEY unique_course_lesson_order (course_id, lesson_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // User topic progress table
    `CREATE TABLE IF NOT EXISTS user_topic_progress (
      user_id INT NOT NULL,
      course_id INT NOT NULL,
      topic_id INT NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      completed_at TIMESTAMP NULL,
      points_earned INT DEFAULT 0,
      attempts INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, course_id, topic_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
      INDEX idx_user_course (user_id, course_id),
      INDEX idx_completion (completed)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Quiz questions table
    `CREATE TABLE IF NOT EXISTS quiz_questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      subject_id INT NOT NULL,
      node_id INT,
      question TEXT NOT NULL,
      answers JSON NOT NULL,
      correct_answer INT NOT NULL CHECK (correct_answer BETWEEN 0 AND 3),
      points INT DEFAULT 10,
      difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'easy',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_subject_node (subject_id, node_id),
      INDEX idx_active (is_active),
      INDEX idx_difficulty (difficulty)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // User enrollments table
    `CREATE TABLE IF NOT EXISTS user_enrollments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      course_id INT NOT NULL,
      enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL,
      progress_percentage DECIMAL(5,2) DEFAULT 0.00,
      total_points_earned INT DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE KEY unique_enrollment (user_id, course_id),
      INDEX idx_user (user_id),
      INDEX idx_course (course_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // User progress table
    `CREATE TABLE IF NOT EXISTS user_progress (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      course_id INT NOT NULL,
      topic_id INT,
      completed_at TIMESTAMP,
      progress_percentage DECIMAL(5,2) DEFAULT 0.00,
      points_earned INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
      UNIQUE KEY unique_user_topic (user_id, topic_id),
      INDEX idx_user_course (user_id, course_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Quiz attempts table
    `CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      subject_id INT NOT NULL,
      node_id INT,
      questions_total INT NOT NULL,
      questions_correct INT NOT NULL,
      score_percentage DECIMAL(5,2) NOT NULL,
      total_points INT NOT NULL,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_quiz (user_id, subject_id, node_id),
      INDEX idx_user_attempts (user_id),
      INDEX idx_completed (completed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Quiz answers table
    `CREATE TABLE IF NOT EXISTS quiz_answers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      attempt_id INT NOT NULL,
      question_id INT NOT NULL,
      selected_answer INT,
      is_correct BOOLEAN NOT NULL,
      points_earned INT DEFAULT 0,
      FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
      INDEX idx_attempt (attempt_id),
      INDEX idx_question (question_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Achievements table
    `CREATE TABLE IF NOT EXISTS achievements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      icon_url VARCHAR(255),
      points_required INT DEFAULT 0,
      category VARCHAR(50),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_category (category),
      INDEX idx_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // User achievements table
    `CREATE TABLE IF NOT EXISTS user_achievements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      achievement_id INT NOT NULL,
      earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
      UNIQUE KEY unique_user_achievement (user_id, achievement_id),
      INDEX idx_user (user_id),
      INDEX idx_achievement (achievement_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,


    // Learning streaks table
    `CREATE TABLE IF NOT EXISTS learning_streaks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      streak_date DATE NOT NULL,
      activities_completed INT DEFAULT 0,
      points_earned INT DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_user_date (user_id, streak_date),
      INDEX idx_user (user_id),
      INDEX idx_date (streak_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Coding challenges table
    `CREATE TABLE IF NOT EXISTS coding_challenges (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      difficulty ENUM('easy', 'intermediate', 'hard') DEFAULT 'easy',
      points INT DEFAULT 10,
      supported_languages JSON,
      created_by INT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_difficulty (difficulty),
      INDEX idx_active (is_active),
      INDEX idx_created_by (created_by)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Coding challenge answers table
    `CREATE TABLE IF NOT EXISTS coding_challenge_answers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      challenge_id INT NOT NULL,
      programming_language VARCHAR(50) NOT NULL,
      code_snippets JSON NOT NULL,
      correct_answer JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (challenge_id) REFERENCES coding_challenges(id) ON DELETE CASCADE,
      INDEX idx_challenge (challenge_id),
      INDEX idx_language (programming_language),
      UNIQUE KEY unique_challenge_language (challenge_id, programming_language)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Challenge submissions table
    `CREATE TABLE IF NOT EXISTS coding_submissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      challenge_id INT NOT NULL,
      programming_language VARCHAR(50) NOT NULL,
      submitted_answer JSON NOT NULL,
      is_correct BOOLEAN NOT NULL,
      points_earned INT DEFAULT 0,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (challenge_id) REFERENCES coding_challenges(id) ON DELETE CASCADE,
      INDEX idx_user (user_id),
      INDEX idx_challenge (challenge_id),
      INDEX idx_correct (is_correct),
      INDEX idx_submitted_at (submitted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // User coding stats table
    `CREATE TABLE IF NOT EXISTS user_coding_stats (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      challenges_attempted INT DEFAULT 0,
      challenges_solved INT DEFAULT 0,
      total_submissions INT DEFAULT 0,
      easy_solved INT DEFAULT 0,
      intermediate_solved INT DEFAULT 0,
      hard_solved INT DEFAULT 0,
      total_coding_points INT DEFAULT 0,
      average_attempts DECIMAL(3,1) DEFAULT 0.0,
      best_streak INT DEFAULT 0,
      current_streak INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_user_stats (user_id),
      INDEX idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  ];

  for (const tableSQL of tables) {
    try {
      await pool.execute(tableSQL);
      console.log('✅ Table created/verified');
    } catch (error) {
      console.error('❌ Error creating table:', error);
      throw error;
    }
  }

  // Add missing columns to existing tables
  try {
    // Check if updated_at column exists in user_enrollments
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'fyp' 
        AND TABLE_NAME = 'user_enrollments' 
        AND COLUMN_NAME = 'updated_at'
    `);
    
    if ((columns as mysql.RowDataPacket[]).length === 0) {
      await pool.execute(`
        ALTER TABLE user_enrollments 
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      `);
      console.log('✅ Added updated_at column to user_enrollments');
    }

  } catch (error) {
    console.log('ℹ️ Error checking/adding columns:', error);
  }
};

// Enhanced query function (no auto-initialization)
export const query = async (sql: string, params?: (string | number | boolean | null | Date)[]) => {
  try {
    const pool = createPool();
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export const beginTransaction = async () => {
  const pool = createPool();
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
};

// Manual database reset function (for development)
export const resetDatabase = async () => {
  console.log('�� Resetting database...');
  isInitialized = false;
  await initializeDatabase();
  console.log('✅ Database reset complete');
};

// Check database connection
export const checkConnection = async () => {
  try {
    const pool = createPool();
    await pool.execute('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

const dbModule = { query, createPool, beginTransaction, initializeDatabase, resetDatabase, checkConnection };
export default dbModule;