import { NextResponse } from 'next/server';
import { query } from "@/lib/db";

interface CountResult {
  count: number;
}

interface ActivityResult {
  type: string;
  user: string;
  description: string;
  timestamp: string;
  id: number;
}

export async function GET() {
  try {
    // Get comprehensive dashboard statistics
    const [
      usersResult,
      coursesResult,
      quizzesResult,
      codingChallengesResult,
      activeUsersResult,
      completedCoursesResult
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users'),
      query('SELECT COUNT(*) as count FROM courses'),
      query('SELECT COUNT(*) as count FROM quiz_questions'),
      query('SELECT COUNT(*) as count FROM coding_challenges WHERE is_active = TRUE'),
      query('SELECT COUNT(DISTINCT user_id) as count FROM user_enrollments WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'),
      query('SELECT COUNT(*) as count FROM user_enrollments WHERE completed_at IS NOT NULL')
    ]);

    const stats = {
      totalUsers: Array.isArray(usersResult) ? (usersResult[0] as CountResult)?.count || 0 : 0,
      totalCourses: Array.isArray(coursesResult) ? (coursesResult[0] as CountResult)?.count || 0 : 0,
      totalQuizzes: Array.isArray(quizzesResult) ? (quizzesResult[0] as CountResult)?.count || 0 : 0,
      totalCodingChallenges: Array.isArray(codingChallengesResult) ? (codingChallengesResult[0] as CountResult)?.count || 0 : 0,
      activeUsers: Array.isArray(activeUsersResult) ? (activeUsersResult[0] as CountResult)?.count || 0 : 0,
      completedCourses: Array.isArray(completedCoursesResult) ? (completedCoursesResult[0] as CountResult)?.count || 0 : 0
    };

    // Get recent activity (fallback with simpler query structure for compatibility)
    const recentActivity: Array<{
      id: number;
      type: string;
      user: string;
      description: string;
      timestamp: string;
    }> = [];
    
    try {
      // Try to get user registrations
      const userRegsResult = await query(`
        SELECT 
          'user_registration' as type,
          u.username as user,
          'registered on the platform' as description,
          u.created_at as timestamp,
          u.id
        FROM users u
        WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY u.created_at DESC
        LIMIT 5
      `);

      if (Array.isArray(userRegsResult)) {
        recentActivity.push(...userRegsResult.map((activity, index: number) => ({
          id: index + 1,
          type: (activity as ActivityResult).type,
          user: (activity as ActivityResult).user,
          description: (activity as ActivityResult).description,
          timestamp: new Date((activity as ActivityResult).timestamp).toLocaleString()
        })));
      }

      // Try to get quiz completions
      const quizCompletionsResult = await query(`
        SELECT 
          'quiz_submission' as type,
          u.username as user,
          CONCAT('completed a quiz with ', ROUND(qa.score_percentage), '% score') as description,
          qa.completed_at as timestamp,
          u.id
        FROM quiz_attempts qa
        JOIN users u ON qa.user_id = u.id
        WHERE qa.completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY qa.completed_at DESC
        LIMIT 5
      `);

      if (Array.isArray(quizCompletionsResult)) {
        recentActivity.push(...quizCompletionsResult.map((activity, index: number) => ({
          id: index + 100,
          type: (activity as ActivityResult).type,
          user: (activity as ActivityResult).user,
          description: (activity as ActivityResult).description,
          timestamp: new Date((activity as ActivityResult).timestamp).toLocaleString()
        })));
      }
    } catch (activityError) {
      console.log('Note: Could not fetch recent activity:', activityError);
      // Continue without recent activity data
    }

    return NextResponse.json({
      stats,
      recentActivity: recentActivity.slice(0, 10) // Limit to 10 most recent
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
} 