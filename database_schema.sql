-- EduQuest Database Schema for MySQL
-- This schema supports the gamified learning platform with subjects, skill trees, and progress tracking

CREATE DATABASE IF NOT EXISTS eduquest;
USE eduquest;

-- Users table (students and teachers)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    role ENUM('student', 'teacher') NOT NULL DEFAULT 'student',
    avatar_url VARCHAR(500),
    total_points INT DEFAULT 0,
    current_streak INT DEFAULT 0,
    max_streak INT DEFAULT 0,
    level INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Subjects table (replaces courses)
CREATE TABLE subjects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_id INT,
    difficulty ENUM('foundation', 'intermediate', 'advanced') DEFAULT 'foundation',
    estimated_duration INT, -- in hours
    icon VARCHAR(100), -- emoji or icon class
    color_theme VARCHAR(50), -- CSS color theme
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Skill trees within subjects
CREATE TABLE skill_trees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    subject_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100), -- emoji or icon class
    order_index INT DEFAULT 0, -- for ordering skill trees within a subject
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Skill tree nodes (lessons, quizzes, projects)
CREATE TABLE skill_nodes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    skill_tree_id INT NOT NULL,
    node_id VARCHAR(50) NOT NULL, -- unique identifier like 'react-1', 'js-1'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    level INT NOT NULL, -- skill level (1-5, where 1 is foundation, 5 is mastery)
    position_x DECIMAL(5,2) NOT NULL, -- for skill tree positioning
    position_y DECIMAL(5,2) NOT NULL,
    points INT DEFAULT 0,
    difficulty ENUM('foundation', 'intermediate', 'advanced') DEFAULT 'foundation',
    estimated_time VARCHAR(50), -- e.g., "30 min", "1 hour"
    type ENUM('lesson', 'quiz', 'project') NOT NULL,
    content_url VARCHAR(500), -- link to lesson content
    icon VARCHAR(100), -- emoji or icon class
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (skill_tree_id) REFERENCES skill_trees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_node_per_tree (skill_tree_id, node_id)
);

-- Prerequisites for nodes (many-to-many relationship)
CREATE TABLE node_prerequisites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    node_id INT NOT NULL,
    prerequisite_node_id INT NOT NULL,
    FOREIGN KEY (node_id) REFERENCES skill_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (prerequisite_node_id) REFERENCES skill_nodes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_prerequisite (node_id, prerequisite_node_id)
);

-- Quiz questions
CREATE TABLE quiz_questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    question_id VARCHAR(50) NOT NULL, -- unique identifier like 'react-1-q1'
    skill_tree_id INT NOT NULL,
    node_id VARCHAR(50) NOT NULL,
    question TEXT NOT NULL,
    option_a VARCHAR(500) NOT NULL,
    option_b VARCHAR(500) NOT NULL,
    option_c VARCHAR(500) NOT NULL,
    option_d VARCHAR(500) NOT NULL,
    correct_answer INT NOT NULL CHECK (correct_answer BETWEEN 0 AND 3),
    points INT DEFAULT 10,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'easy',
    explanation TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (skill_tree_id) REFERENCES skill_trees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_question_id (question_id)
);

-- User subject enrollments
CREATE TABLE user_enrollments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    subject_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    total_points_earned INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (user_id, subject_id)
);

-- User progress on individual nodes
CREATE TABLE user_node_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    skill_tree_id INT NOT NULL,
    node_id VARCHAR(50) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    points_earned INT DEFAULT 0,
    attempts INT DEFAULT 0,
    best_score DECIMAL(5,2) DEFAULT 0.00, -- percentage for quizzes
    time_spent INT DEFAULT 0, -- in minutes
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_tree_id) REFERENCES skill_trees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_node (user_id, skill_tree_id, node_id)
);

-- Quiz attempts and results
CREATE TABLE quiz_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    skill_tree_id INT NOT NULL,
    node_id VARCHAR(50) NOT NULL,
    questions_total INT NOT NULL,
    questions_correct INT NOT NULL,
    score_percentage DECIMAL(5,2) NOT NULL,
    points_earned INT NOT NULL,
    time_bonus INT DEFAULT 0,
    streak_bonus INT DEFAULT 0,
    total_points INT NOT NULL,
    max_streak INT DEFAULT 0,
    time_taken INT, -- in seconds
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_tree_id) REFERENCES skill_trees(id) ON DELETE CASCADE
);

-- Individual question answers within quiz attempts
CREATE TABLE quiz_answers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    attempt_id INT NOT NULL,
    question_id VARCHAR(50) NOT NULL,
    selected_answer INT, -- 0-3 or NULL if not answered
    is_correct BOOLEAN NOT NULL,
    points_earned INT DEFAULT 0,
    time_taken INT, -- seconds for this question
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES quiz_questions(question_id)
);

-- Achievements/Badges system
CREATE TABLE achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100), -- emoji or icon class
    type ENUM('streak', 'points', 'completion', 'speed', 'accuracy', 'level') NOT NULL,
    requirement_value INT, -- threshold value for earning
    points_reward INT DEFAULT 0,
    rarity ENUM('common', 'rare', 'epic', 'legendary') DEFAULT 'common',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User achievements (earned badges)
CREATE TABLE user_achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress_value INT, -- current progress towards achievement
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id)
);

-- Learning streaks tracking
CREATE TABLE learning_streaks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    streak_date DATE NOT NULL,
    activities_completed INT DEFAULT 0,
    points_earned INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, streak_date)
);

-- System settings/configuration
CREATE TABLE system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert some initial achievements
INSERT INTO achievements (title, description, icon, type, requirement_value, points_reward, rarity) VALUES
('First Steps', 'Complete your first lesson', '🌟', 'completion', 1, 10, 'common'),
('Quiz Master', 'Score 100% on any quiz', '🎯', 'accuracy', 100, 25, 'rare'),
('Speed Demon', 'Complete a quiz in under 2 minutes', '⚡', 'speed', 120, 30, 'rare'),
('Streak Starter', 'Maintain a 3-day learning streak', '🔥', 'streak', 3, 15, 'common'),
('Streak Master', 'Maintain a 7-day learning streak', '🚀', 'streak', 7, 50, 'epic'),
('Point Collector', 'Earn 1000 total points', '💎', 'points', 1000, 100, 'epic'),
('Course Conqueror', 'Complete an entire course', '🏆', 'completion', 1, 200, 'legendary'),
('Perfect Student', 'Achieve 100% completion with perfect scores', '👑', 'accuracy', 100, 500, 'legendary');

-- Insert some initial system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('daily_streak_requirement', '1', 'Minimum activities to maintain daily streak'),
('quiz_time_limit', '30', 'Default time limit per quiz question in seconds'),
('points_per_streak_day', '5', 'Bonus points awarded per day in streak'),
('max_quiz_attempts', '3', 'Maximum attempts allowed per quiz');

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_user_enrollments_user ON user_enrollments(user_id);
CREATE INDEX idx_user_enrollments_subject ON user_enrollments(subject_id);
CREATE INDEX idx_user_node_progress_user ON user_node_progress(user_id);
CREATE INDEX idx_user_node_progress_tree ON user_node_progress(skill_tree_id);
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_tree ON quiz_attempts(skill_tree_id);
CREATE INDEX idx_quiz_questions_tree ON quiz_questions(skill_tree_id);
CREATE INDEX idx_skill_nodes_tree ON skill_nodes(skill_tree_id);
CREATE INDEX idx_skill_trees_subject ON skill_trees(subject_id);
CREATE INDEX idx_learning_streaks_user_date ON learning_streaks(user_id, streak_date); 