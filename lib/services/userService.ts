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
  subject_id: number;
  node_id: string;
  completed: boolean;
  completed_at?: Date;
  points_earned: number;
  attempts: number;
  best_score: number;
  time_spent: number;
}

export interface UserEnrollment {
  id: number;
  user_id: number;
  subject_id: number;
  enrolled_at: Date;
  completed_at?: Date;
  progress_percentage: number;
  total_points_earned: number;
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  type: 'streak' | 'points' | 'completion' | 'speed' | 'accuracy' | 'level';
  requirement_value: number;
  points_reward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
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

    // Get subject progress
    const enrollments = await query(`
      SELECT 
        ue.*,
        s.title as subject_title,
        s.description as subject_description,
        COUNT(sn.id) as total_nodes,
        COUNT(CASE WHEN unp.completed = true THEN 1 END) as completed_nodes
      FROM user_enrollments ue
      JOIN subjects s ON ue.subject_id = s.id
      LEFT JOIN skill_nodes sn ON s.id = sn.subject_id AND sn.is_active = true
      LEFT JOIN user_node_progress unp ON ue.user_id = unp.user_id 
        AND sn.node_id = unp.node_id AND unp.subject_id = s.id
      WHERE ue.user_id = ?
      GROUP BY ue.id, s.id
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

  // Get user's subject enrollments
  static async getUserEnrollments(userId: number): Promise<UserEnrollment[]> {
    return await query(`
      SELECT 
        ue.*,
        s.title,
        s.description,
        s.difficulty,
        s.estimated_duration,
        COUNT(sn.id) as total_lessons,
        COUNT(CASE WHEN unp.completed = true THEN 1 END) as completed_lessons
      FROM user_enrollments ue
      JOIN subjects s ON ue.subject_id = s.id
      LEFT JOIN skill_nodes sn ON s.id = sn.subject_id AND sn.is_active = true
      LEFT JOIN user_node_progress unp ON ue.user_id = unp.user_id 
        AND sn.node_id = unp.node_id AND unp.subject_id = s.id
      WHERE ue.user_id = ?
      GROUP BY ue.id
      ORDER BY ue.enrolled_at DESC
    `, [userId]) as UserEnrollment[];
  }

  // Update user progress on a node
  static async updateNodeProgress(
    userId: number, 
    skillTreeId: number, 
    nodeId: string, 
    progressData: {
      completed: boolean;
      pointsEarned: number;
      score: number;
      timeSpent: number;
    }
  ): Promise<void> {
    await query(`
      INSERT INTO user_node_progress 
      (user_id, subject_id, node_id, completed, completed_at, points_earned, best_score, time_spent, attempts)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE
        completed = VALUES(completed),
        completed_at = CASE WHEN VALUES(completed) = true THEN NOW() ELSE completed_at END,
        points_earned = GREATEST(points_earned, VALUES(points_earned)),
        best_score = GREATEST(best_score, VALUES(best_score)),
        time_spent = time_spent + VALUES(time_spent),
        attempts = attempts + 1
    `, [
      userId, 
      skillTreeId, 
      nodeId, 
      progressData.completed,
      progressData.completed ? new Date() : null,
      progressData.pointsEarned,
      progressData.score,
      progressData.timeSpent
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

  // Update subject progress percentage
  static async updateSubjectProgress(userId: number, subjectId: number): Promise<void> {
    await query(`
      UPDATE user_enrollments ue
      SET 
        progress_percentage = (
          SELECT 
            CASE 
              WHEN COUNT(sn.id) = 0 THEN 0
              ELSE (COUNT(CASE WHEN unp.completed = true THEN 1 END) * 100.0 / COUNT(sn.id))
            END
          FROM skill_nodes sn
          JOIN user_node_progress unp ON sn.node_id = unp.node_id AND sn.subject_id = unp.subject_id
          WHERE sn.subject_id = ? AND unp.user_id = ?
        ),
        total_points_earned = (
          SELECT COALESCE(SUM(unp.points_earned), 0)
          FROM user_node_progress unp
          WHERE unp.user_id = ? AND unp.subject_id = ?
        ),
        completed_at = CASE 
          WHEN (
            SELECT COUNT(CASE WHEN unp.completed = true THEN 1 END) 
            FROM skill_nodes sn
            JOIN user_node_progress unp ON sn.node_id = unp.node_id AND sn.subject_id = unp.subject_id
            WHERE sn.subject_id = ? AND unp.user_id = ?
          ) = (
            SELECT COUNT(*) 
            FROM skill_nodes sn
            WHERE sn.subject_id = ? AND sn.is_active = true
          ) THEN NOW()
          ELSE completed_at
        END
      WHERE user_id = ? AND subject_id = ?
    `, [subjectId, userId, userId, subjectId, userId, subjectId, subjectId, userId, subjectId]);
  }

  // Get user achievements
  static async getUserAchievements(userId: number): Promise<Achievement[]> {
    return await query(`
      SELECT 
        a.*,
        ua.earned_at,
        ua.progress_value,
        CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as earned
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
      WHERE a.is_active = true
      ORDER BY ua.earned_at DESC, a.rarity DESC, a.points_reward DESC
    `, [userId]) as Achievement[];
  }

  // Award achievement to user
  static async awardAchievement(userId: number, achievementId: number): Promise<void> {
    await query(`
      INSERT IGNORE INTO user_achievements (user_id, achievement_id, progress_value)
      VALUES (?, ?, (SELECT requirement_value FROM achievements WHERE id = ?))
    `, [userId, achievementId, achievementId]);
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
      LIMIT ?
    `, [limit]) as User[];
  }

  // Record daily learning activity
  static async recordDailyActivity(userId: number, pointsEarned: number): Promise<void> {
    await query(`
      INSERT INTO learning_streaks (user_id, streak_date, activities_completed, points_earned)
      VALUES (?, CURDATE(), 1, ?)
      ON DUPLICATE KEY UPDATE
        activities_completed = activities_completed + 1,
        points_earned = points_earned + ?
    `, [userId, pointsEarned, pointsEarned]);
  }

  // Enroll user in subject
  static async enrollUserInSubject(userId: number, subjectId: number): Promise<void> {
    await query(`
      INSERT IGNORE INTO user_enrollments (user_id, subject_id)
      VALUES (?, ?)
    `, [userId, subjectId]);
  }
} 