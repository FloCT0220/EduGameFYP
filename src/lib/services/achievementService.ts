import { query } from '@/lib/db';

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon_url: string;
  points_required: number;
  category: string;
  is_active: boolean;
  created_at: string;
}

interface UserStats {
  total_points: number;
  current_streak: number;
  max_streak: number;
  quizzes_completed: number;
  topics_completed: number;
  courses_enrolled: number;
  challenges_solved: number;
}

export class AchievementService {
  /**
   * Check and award achievements for a user
   */
  static async checkAndAwardAchievements(userId: number): Promise<Achievement[]> {
    try {
      // Get user stats
      const userStats = await this.getUserStats(userId);
      
      // Get all active achievements
      const achievements = await query(
        'SELECT * FROM achievements WHERE is_active = true ORDER BY points_required ASC'
      ) as Achievement[];

      // Get user's existing achievements
      const userAchievements = await query(
        'SELECT achievement_id FROM user_achievements WHERE user_id = ?',
        [userId]
      ) as { achievement_id: number }[];

      const earnedAchievementIds = userAchievements.map(ua => ua.achievement_id);
      const newlyEarned: Achievement[] = [];

      for (const achievement of achievements) {
        // Skip if already earned
        if (earnedAchievementIds.includes(achievement.id)) {
          continue;
        }

        // Check if achievement should be awarded
        if (await this.shouldAwardAchievement(achievement, userStats)) {
          await this.awardAchievement(userId, achievement.id);
          newlyEarned.push(achievement);
        }
      }

      return newlyEarned;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  /**
   * Check if an achievement should be awarded based on user stats
   */
  private static async shouldAwardAchievement(achievement: Achievement, userStats: UserStats): Promise<boolean> {
    switch (achievement.category) {
      case 'points':
        return userStats.total_points >= achievement.points_required;
      
      case 'streak':
        return userStats.current_streak >= achievement.points_required;
      
      case 'completion':
        return userStats.quizzes_completed >= achievement.points_required;
      
      case 'topics':
        return userStats.topics_completed >= achievement.points_required;
      
      case 'courses':
        return userStats.courses_enrolled >= achievement.points_required;
      
      case 'challenges':
        return userStats.challenges_solved >= achievement.points_required;
      
      default:
        return false;
    }
  }

  /**
   * Award an achievement to a user
   */
  private static async awardAchievement(userId: number, achievementId: number): Promise<void> {
    try {
      await query(
        'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
        [userId, achievementId]
      );
      console.log(`Achievement ${achievementId} awarded to user ${userId}`);
    } catch (error) {
      console.error('Error awarding achievement:', error);
    }
  }

  /**
   * Get comprehensive user stats for achievement checking
   */
  private static async getUserStats(userId: number): Promise<UserStats> {
    try {
      // Get basic user info
      const [user] = await query(
        'SELECT total_points, current_streak, max_streak FROM users WHERE id = ?',
        [userId]
      ) as { total_points: number; current_streak: number; max_streak: number }[];

      // Get quiz completion count
      const [quizStats] = await query(
        'SELECT COUNT(*) as quiz_count FROM quiz_attempts WHERE user_id = ? AND completed_at IS NOT NULL',
        [userId]
      ) as { quiz_count: number }[];

      // Get topic completion count
      const [topicStats] = await query(
        'SELECT COUNT(*) as topic_count FROM user_progress WHERE user_id = ? AND progress_type = "topic" AND completed = true',
        [userId]
      ) as { topic_count: number }[];

      // Get course enrollment count
      const [courseStats] = await query(
        'SELECT COUNT(*) as course_count FROM user_enrollments WHERE user_id = ?',
        [userId]
      ) as { course_count: number }[];

      // Get coding challenge completion count
      const [challengeStats] = await query(
        'SELECT COUNT(*) as challenge_count FROM coding_submissions WHERE user_id = ? AND is_correct = true',
        [userId]
      ) as { challenge_count: number }[];

      return {
        total_points: user?.total_points || 0,
        current_streak: user?.current_streak || 0,
        max_streak: user?.max_streak || 0,
        quizzes_completed: quizStats?.quiz_count || 0,
        topics_completed: topicStats?.topic_count || 0,
        courses_enrolled: courseStats?.course_count || 0,
        challenges_solved: challengeStats?.challenge_count || 0
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        total_points: 0,
        current_streak: 0,
        max_streak: 0,
        quizzes_completed: 0,
        topics_completed: 0,
        courses_enrolled: 0,
        challenges_solved: 0
      };
    }
  }

  /**
   * Get user's earned achievements
   */
  static async getUserAchievements(userId: number): Promise<Achievement[]> {
    try {
      const achievements = await query(`
        SELECT a.*, ua.earned_at 
        FROM achievements a
        INNER JOIN user_achievements ua ON a.id = ua.achievement_id
        WHERE ua.user_id = ?
        ORDER BY ua.earned_at DESC
      `, [userId]) as Achievement[];

      return achievements;
    } catch (error) {
      console.error('Error getting user achievements:', error);
      return [];
    }
  }

  /**
   * Get all available achievements with user's earned status
   */
  static async getAllAchievementsWithUserStatus(userId: number): Promise<(Achievement & { earned: boolean; earned_at?: string })[]> {
    try {
      const achievements = await query(`
        SELECT 
          a.*,
          CASE WHEN ua.achievement_id IS NOT NULL THEN true ELSE false END as earned,
          ua.earned_at
        FROM achievements a
        LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
        WHERE a.is_active = true
        ORDER BY a.points_required ASC
      `, [userId]) as (Achievement & { earned: boolean; earned_at?: string })[];

      return achievements;
    } catch (error) {
      console.error('Error getting achievements with user status:', error);
      return [];
    }
  }

  /**
   * Create default achievements if they don't exist
   */
  static async createDefaultAchievements(): Promise<void> {
    try {
      const defaultAchievements = [
        {
          name: 'First Steps',
          description: 'Complete your first quiz',
          icon_url: '🎯',
          points_required: 1,
          category: 'completion'
        },
        {
          name: 'Quiz Master',
          description: 'Complete 5 quizzes',
          icon_url: '🏆',
          points_required: 5,
          category: 'completion'
        },
        {
          name: 'Point Collector',
          description: 'Earn 100 points',
          icon_url: '💰',
          points_required: 100,
          category: 'points'
        },
        {
          name: 'Streak Starter',
          description: 'Maintain a 3-day learning streak',
          icon_url: '🔥',
          points_required: 3,
          category: 'streak'
        },
        {
          name: 'Topic Explorer',
          description: 'Complete 3 topics',
          icon_url: '📚',
          points_required: 3,
          category: 'topics'
        },
        {
          name: 'Course Enthusiast',
          description: 'Enroll in 2 courses',
          icon_url: '🎓',
          points_required: 2,
          category: 'courses'
        },
        {
          name: 'Code Warrior',
          description: 'Solve 3 coding challenges',
          icon_url: '💻',
          points_required: 3,
          category: 'challenges'
        },
        {
          name: 'Level Up',
          description: 'Reach level 5',
          icon_url: '⭐',
          points_required: 5,
          category: 'level'
        }
      ];

      for (const achievement of defaultAchievements) {
        // Check if achievement already exists
        const [existing] = await query(
          'SELECT id FROM achievements WHERE name = ?',
          [achievement.name]
        ) as { id: number }[];

        if (!existing) {
          await query(`
            INSERT INTO achievements (name, description, icon_url, points_required, category, is_active)
            VALUES (?, ?, ?, ?, ?, true)
          `, [
            achievement.name,
            achievement.description,
            achievement.icon_url,
            achievement.points_required,
            achievement.category
          ]);
        }
      }
    } catch (error) {
      console.error('Error creating default achievements:', error);
    }
  }
} 