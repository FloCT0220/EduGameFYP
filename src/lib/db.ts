import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

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
    await insertDefaultData();
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
      role ENUM('student', 'admin', 'instructor') DEFAULT 'student',
      avatar_url VARCHAR(255),
      bio TEXT,
      level INT DEFAULT 1,
      experience_points INT DEFAULT 0,
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
      category VARCHAR(100),
      thumbnail_url VARCHAR(255),
      is_published BOOLEAN DEFAULT FALSE,
      created_by INT,
      enrolled_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_difficulty (difficulty_level),
      INDEX idx_category (category),
      INDEX idx_published (is_published)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Topics/Lessons table
    `CREATE TABLE IF NOT EXISTS topics (
      id INT AUTO_INCREMENT PRIMARY KEY,
      course_id INT NOT NULL,
      title VARCHAR(200) NOT NULL,
      content TEXT,
      lesson_order INT NOT NULL,
      video_url VARCHAR(255),
      duration_minutes INT DEFAULT 15,
      points_reward INT DEFAULT 10,
      is_published BOOLEAN DEFAULT TRUE,
      parent_topic_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_topic_id) REFERENCES topics(id) ON DELETE SET NULL,
      INDEX idx_course_order (course_id, lesson_order),
      INDEX idx_published (is_published)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // User topic progress table
    `CREATE TABLE IF NOT EXISTS user_topic_progress (
      user_id INT NOT NULL,
      topic_id INT NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      completed_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, topic_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Quizzes table
    `CREATE TABLE IF NOT EXISTS quizzes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      topic_id INT,
      course_id INT,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      time_limit_minutes INT DEFAULT 30,
      passing_score INT DEFAULT 70,
      points_reward INT DEFAULT 20,
      attempts_allowed INT DEFAULT 3,
      is_published BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      INDEX idx_topic (topic_id),
      INDEX idx_course (course_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Quiz questions table
    `CREATE TABLE IF NOT EXISTS quiz_questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      quiz_id INT NOT NULL,
      question_text TEXT NOT NULL,
      question_type ENUM('multiple_choice', 'true_false', 'coding', 'short_answer') NOT NULL,
      correct_answer TEXT,
      options JSON,
      points INT DEFAULT 1,
      explanation TEXT,
      question_order INT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
      INDEX idx_quiz_order (quiz_id, question_order),
      INDEX idx_active (is_active)
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
      certificate_url VARCHAR(255),
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
      time_spent_minutes INT DEFAULT 0,
      points_earned INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
      UNIQUE KEY unique_user_topic (user_id, topic_id),
      INDEX idx_user_course (user_id, course_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // User quiz attempts table
    `CREATE TABLE IF NOT EXISTS user_quiz_attempts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      quiz_id INT NOT NULL,
      score DECIMAL(5,2),
      total_questions INT,
      correct_answers INT,
      time_taken_minutes INT,
      answers JSON,
      attempt_number INT DEFAULT 1,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
      INDEX idx_user_quiz (user_id, quiz_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Achievements table
    `CREATE TABLE IF NOT EXISTS achievements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      icon_url VARCHAR(255),
      badge_color VARCHAR(20) DEFAULT 'blue',
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

    // Skill tree nodes table
    `CREATE TABLE IF NOT EXISTS skill_tree_nodes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      course_id INT NOT NULL,
      topic_id INT NOT NULL,
      node_id VARCHAR(50) NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      lesson_order INT NOT NULL,
      points_reward INT DEFAULT 10,
      parent_node_id VARCHAR(50),
      left_child_id VARCHAR(50),
      right_child_id VARCHAR(50),
      is_root BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
      UNIQUE KEY unique_course_node (course_id, node_id),
      INDEX idx_course (course_id),
      INDEX idx_topic (topic_id),
      INDEX idx_parent (parent_node_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Daily activity log
    `CREATE TABLE IF NOT EXISTS daily_activity (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      activity_date DATE NOT NULL,
      points_earned INT DEFAULT 0,
      lessons_completed INT DEFAULT 0,
      quizzes_completed INT DEFAULT 0,
      time_spent_minutes INT DEFAULT 0,
      streak_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_user_date (user_id, activity_date),
      INDEX idx_user (user_id),
      INDEX idx_date (activity_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
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
};

// Insert default data
const insertDefaultData = async () => {
  const pool = createPool();

  try {
    // Check if admin user exists
    const [adminExists] = await pool.execute(
      'SELECT id FROM users WHERE role = "admin" LIMIT 1'
    );

    if ((adminExists as mysql.RowDataPacket[]).length === 0) {
      // Create default admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await pool.execute(
        'INSERT INTO users (username, email, password, role, level, experience_points, total_points) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['admin', 'admin@example.com', hashedPassword, 'admin', 10, 1000, 1000]
      );
      console.log('✅ Default admin user created');
    }

    // Insert default achievements
    const [achievementsExist] = await pool.execute(
      'SELECT id FROM achievements LIMIT 1'
    );

    if ((achievementsExist as mysql.RowDataPacket[]).length === 0) {
      const defaultAchievements = [
        ['First Steps', 'Complete your first lesson', '🎯', 'blue', 10, 'learning'],
        ['Quiz Master', 'Pass your first quiz', '🧠', 'green', 20, 'assessment'],
        ['Streak Starter', 'Study for 3 days in a row', '📅', 'purple', 30, 'habits'],
        ['Point Collector', 'Earn 100 total points', '💎', 'yellow', 100, 'points'],
        ['Course Finisher', 'Complete your first course', '🏆', 'gold', 200, 'completion'],
        ['Speed Learner', 'Complete 5 lessons in one day', '⚡', 'orange', 50, 'speed'],
        ['Persistent Learner', 'Study for 7 days in a row', '🔥', 'red', 100, 'habits'],
        ['Knowledge Seeker', 'Complete 10 quizzes', '📚', 'indigo', 150, 'assessment']
      ];

      for (const achievement of defaultAchievements) {
        await pool.execute(
          'INSERT INTO achievements (name, description, icon_url, badge_color, points_required, category) VALUES (?, ?, ?, ?, ?, ?)',
          achievement
        );
      }
      console.log('✅ Default achievements created');
    }

    // Insert sample courses if none exist
    const [coursesExist] = await pool.execute(
      'SELECT id FROM courses LIMIT 1'
    );

    if ((coursesExist as mysql.RowDataPacket[]).length === 0) {
      const sampleCourses = [
        [
          'Introduction to Programming',
          'Learn the fundamentals of programming with hands-on examples and interactive exercises.',
          'beginner',
          'Programming'
        ],
        [
          'Web Development Basics',
          'Master HTML, CSS, and JavaScript to build amazing websites from scratch.',
          'beginner',
          'Web Development'
        ],
        [
          'Database Design',
          'Learn how to design efficient and scalable database systems.',
          'intermediate',
          'Database'
        ]
      ];

      for (const course of sampleCourses) {
        await pool.execute(
          'INSERT INTO courses (title, description, difficulty_level, category, is_published) VALUES (?, ?, ?, ?, ?)',
          [...course, true]
        );
      }
      console.log('✅ Sample courses created');
    }

    console.log('✅ Default data inserted successfully');
  } catch (error) {
    console.error('❌ Error inserting default data:', error);
  }
};

// Enhanced query function with auto-initialization
export const query = async (sql: string, params?: (string | number | boolean | null | Date)[]) => {
  // Initialize database on first query
  if (!isInitialized) {
    await initializeDatabase();
  }

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
  // Initialize database if needed
  if (!isInitialized) {
    await initializeDatabase();
  }

  const pool = createPool();
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
};

// Manual database reset function (for development)
export const resetDatabase = async () => {
  console.log('🔄 Resetting database...');
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

export default { query, createPool, beginTransaction, initializeDatabase, resetDatabase, checkConnection }; 