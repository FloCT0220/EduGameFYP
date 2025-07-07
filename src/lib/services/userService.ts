import { query } from '../db';

export interface User {
  id: number;
  email: string;
  username: string;
  role: 'student' | 'admin';
  avatar_url?: string;
  total_points: number;
  current_streak: number;
  max_streak: number;
  level: number;
  created_at: Date;
  last_login?: Date;
}

export interface UserProgress {
  user_id: number;
  course_id: number;
  topic_id: number;
  completed_at?: Date;
  points_earned: number;
  time_spent_minutes: number;
  progress_percentage: number;
}

export interface UserEnrollment {
  id: number;
  user_id: number;
  course_id: number;
  enrolled_at: Date;
  completed_at?: Date;
  progress_percentage: number;
  total_points_earned: number;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon_url: string;
  badge_color: string;
  points_required: number;
  category: string;
  is_active: boolean;
  earned?: boolean;
  earned_at?: Date;
}

export class UserService {
  // Get user by ID
  static async getUserById(userId: number): Promise<User | null> {
    const users = await query(`
      SELECT * FROM users WHERE id = ?
    `, [userId]) as User[];
    return users[0] || null;
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<User | null> {
    const users = await query(`
      SELECT * FROM users WHERE email = ?
    `, [email]) as User[];
    return users[0] || null;
  }

  // Get user dashboard data
  static async getUserDashboardData(userId: number) {
    const user = await this.getUserById(userId);
    if (!user) return null;

    // Get course progress
    const enrollments = await query(`
      SELECT 
        ue.*,
        c.title as course_title,
        c.description as course_description,
        COUNT(t.id) as total_topics,
        COUNT(CASE WHEN up.completed_at IS NOT NULL THEN 1 END) as completed_topics
      FROM user_enrollments ue
      JOIN courses c ON ue.course_id = c.id
      LEFT JOIN topics t ON c.id = t.course_id AND t.is_published = true
      LEFT JOIN user_progress up ON ue.user_id = up.user_id 
        AND t.id = up.topic_id AND up.course_id = c.id
      WHERE ue.user_id = ?
      GROUP BY ue.id, c.id
    `, [userId]) as UserEnrollment[];

    // Get recent achievements
    const achievements = await query(`
      SELECT a.*, ua.earned_at
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
      ORDER BY ua.earned_at DESC, a.created_at DESC
    `, [userId]) as Achievement[];

    // Get quiz statistics
    const quizStats = await query(`
      SELECT 
        COUNT(*) as total_attempts,
        AVG(score_percentage) as avg_score,
        SUM(total_points) as total_quiz_points
      FROM quiz_attempts 
      WHERE user_id = ?
    `, [userId]) as { total_attempts: number; avg_score: number; total_quiz_points: number }[];

    return {
      user,
      enrollments,
      achievements,
      quizStats: quizStats[0] || { total_attempts: 0, avg_score: 0, total_quiz_points: 0 }
    };
  }

  // Get user's course enrollments
  static async getUserEnrollments(userId: number): Promise<UserEnrollment[]> {
    return await query(`
      SELECT 
        ue.*,
        c.title,
        c.description,
        c.difficulty_level as difficulty,
        COUNT(t.id) as total_lessons,
        COUNT(CASE WHEN up.completed_at IS NOT NULL THEN 1 END) as completed_lessons
      FROM user_enrollments ue
      JOIN courses c ON ue.course_id = c.id
      LEFT JOIN topics t ON c.id = t.course_id AND t.is_published = true
      LEFT JOIN user_progress up ON ue.user_id = up.user_id 
        AND t.id = up.topic_id AND up.course_id = c.id
      WHERE ue.user_id = ?
      GROUP BY ue.id
      ORDER BY ue.enrolled_at DESC
    `, [userId]) as UserEnrollment[];
  }

  // Update user progress on a topic
  static async updateTopicProgress(
    userId: number, 
    courseId: number, 
    topicId: number, 
    progressData: {
      completed: boolean;
      pointsEarned: number;
      timeSpent: number;
    }
  ): Promise<void> {
    await query(`
      INSERT INTO user_progress 
      (user_id, course_id, topic_id, completed_at, points_earned, time_spent_minutes)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        completed_at = CASE WHEN ? = true THEN NOW() ELSE completed_at END,
        points_earned = GREATEST(points_earned, VALUES(points_earned)),
        time_spent_minutes = time_spent_minutes + VALUES(time_spent_minutes)
    `, [
      userId, 
      courseId, 
      topicId, 
      progressData.completed ? new Date() : null,
      progressData.pointsEarned,
      progressData.timeSpent,
      progressData.completed
    ]);
  }

  // Update user's overall game stats
  static async updateUserGameStats(userId: number, pointsEarned: number, currentStreak: number): Promise<void> {
    await query(`
      UPDATE users 
      SET 
        total_points = total_points + ?,
        current_streak = ?,
        max_streak = GREATEST(max_streak, ?),
        level = FLOOR((total_points + ?) / 1000) + 1
      WHERE id = ?
    `, [pointsEarned, currentStreak, currentStreak, pointsEarned, userId]);
  }

  // Update course progress percentage
  static async updateCourseProgress(userId: number, courseId: number): Promise<void> {
    await query(`
      UPDATE user_enrollments ue
      SET 
        progress_percentage = (
          SELECT 
            CASE 
              WHEN COUNT(t.id) = 0 THEN 0
              ELSE (COUNT(CASE WHEN up.completed_at IS NOT NULL THEN 1 END) * 100.0 / COUNT(t.id))
            END
          FROM topics t
          LEFT JOIN user_progress up ON t.id = up.topic_id AND up.user_id = ? AND up.course_id = ?
          WHERE t.course_id = ? AND t.is_published = true
        ),
        total_points_earned = (
          SELECT COALESCE(SUM(up.points_earned), 0)
          FROM user_progress up
          WHERE up.user_id = ? AND up.course_id = ?
        ),
        completed_at = CASE 
          WHEN (
            SELECT COUNT(CASE WHEN up.completed_at IS NOT NULL THEN 1 END) 
            FROM topics t
            LEFT JOIN user_progress up ON t.id = up.topic_id AND up.user_id = ? AND up.course_id = ?
            WHERE t.course_id = ? AND t.is_published = true
          ) = (
            SELECT COUNT(*) 
            FROM topics t
            WHERE t.course_id = ? AND t.is_published = true
          ) THEN NOW()
          ELSE completed_at
        END
      WHERE user_id = ? AND course_id = ?
    `, [userId, courseId, courseId, userId, courseId, userId, courseId, courseId, courseId, userId, courseId]);
  }

  // Get user achievements
  static async getUserAchievements(userId: number): Promise<Achievement[]> {
    return await query(`
      SELECT 
        a.*,
        ua.earned_at,
        CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as earned
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
      WHERE a.is_active = true
      ORDER BY ua.earned_at DESC, a.points_required DESC
    `, [userId]) as Achievement[];
  }

  // Award achievement to user
  static async awardAchievement(userId: number, achievementId: number): Promise<void> {
    await query(`
      INSERT IGNORE INTO user_achievements (user_id, achievement_id)
      VALUES (?, ?)
    `, [userId, achievementId]);
  }

  // Get leaderboard
  static async getLeaderboard(limit: number = 10): Promise<User[]> {
    return await query(`
      SELECT 
        id, 
        username as name,
        total_points,
        level,
        current_streak,
        max_streak
      FROM users 
      WHERE role = 'student'
      ORDER BY total_points DESC, max_streak DESC 
      LIMIT ${limit}
    `) as User[];
  }

  // Record daily learning activity
  static async recordDailyActivity(userId: number, pointsEarned: number): Promise<void> {
    await query(`
      INSERT INTO daily_activity (user_id, activity_date, points_earned, lessons_completed)
      VALUES (?, CURDATE(), ?, 1)
      ON DUPLICATE KEY UPDATE
        lessons_completed = lessons_completed + 1,
        points_earned = points_earned + ?
    `, [userId, pointsEarned, pointsEarned]);
  }

  // Enroll user in course
  static async enrollUserInCourse(userId: number, courseId: number): Promise<void> {
    await query(`
      INSERT IGNORE INTO user_enrollments (user_id, course_id)
      VALUES (?, ?)
    `, [userId, courseId]);
  }
} 