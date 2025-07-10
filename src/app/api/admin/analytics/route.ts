import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface CountResult {
  count: number;
}

interface CourseResult {
  id: number;
  title: string;
  enrollments: number;
  completionRate: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const days = parseInt(searchParams.get('days') || '30');
    
    // Get user engagement metrics
    const [
      totalUsersResult,
      activeUsersResult,
      newUsersResult,
      retentionResult
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users'),
      query(`SELECT COUNT(DISTINCT user_id) as count FROM user_enrollments WHERE updated_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)`),
      query(`SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`),
      query(`
        SELECT 
          COUNT(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) * 100.0 / COUNT(*) as retention_rate
        FROM users 
        WHERE created_at <= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `)
    ]);

    const userEngagement = {
      totalUsers: Array.isArray(totalUsersResult) ? (totalUsersResult[0] as CountResult)?.count || 0 : 0,
      activeUsers: Array.isArray(activeUsersResult) ? (activeUsersResult[0] as CountResult)?.count || 0 : 0,
      newUsersThisMonth: Array.isArray(newUsersResult) ? (newUsersResult[0] as CountResult)?.count || 0 : 0,
      retentionRate: Array.isArray(retentionResult) ? Math.round((retentionResult[0] as any)?.retention_rate || 0) : 0,
      averageSessionTime: 25, // Mock data - would need session tracking
      loginFrequency: {} // Mock data - would need login tracking
    };

    // Get course performance metrics
    const [
      totalCoursesResult,
      avgCompletionResult,
      popularCoursesResult
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM courses'),
      query(`
        SELECT AVG(
          CASE WHEN ue.completed_at IS NOT NULL THEN 100 ELSE 0 END
        ) as avg_completion
        FROM user_enrollments ue
      `),
      query(`
        SELECT 
          c.id,
          c.title,
          COUNT(ue.user_id) as enrollments,
          COUNT(CASE WHEN ue.completed_at IS NOT NULL THEN 1 END) * 100.0 / COUNT(ue.user_id) as completionRate
        FROM courses c
        LEFT JOIN user_enrollments ue ON c.id = ue.course_id
        GROUP BY c.id, c.title
        ORDER BY enrollments DESC
        LIMIT 5
      `)
    ]);

    const coursePerformance = {
      totalCourses: Array.isArray(totalCoursesResult) ? (totalCoursesResult[0] as CountResult)?.count || 0 : 0,
      averageCompletionRate: Array.isArray(avgCompletionResult) ? Math.round((avgCompletionResult[0] as any)?.avg_completion || 0) : 0,
      popularCourses: Array.isArray(popularCoursesResult) ? (popularCoursesResult as CourseResult[]).map(course => ({
        id: course.id,
        title: course.title,
        enrollments: course.enrollments || 0,
        completionRate: Math.round(course.completionRate || 0)
      })) : []
    };

    // Get learning metrics
    const [
      totalQuizzesResult,
      avgQuizScoreResult,
      totalCodingResult,
      codingSuccessResult,
      pointsDistributedResult
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM quiz_questions'),
      query('SELECT AVG(score_percentage) as avg_score FROM quiz_attempts WHERE completed_at IS NOT NULL'),
      query('SELECT COUNT(*) as count FROM coding_challenges WHERE is_active = TRUE'),
      query(`
        SELECT 
          COUNT(CASE WHEN status = 'accepted' THEN 1 END) * 100.0 / COUNT(*) as success_rate
        FROM coding_submissions
      `),
      query('SELECT SUM(total_points) as total FROM users')
    ]);

    const learningMetrics = {
      totalQuizzes: Array.isArray(totalQuizzesResult) ? (totalQuizzesResult[0] as CountResult)?.count || 0 : 0,
      averageQuizScore: Array.isArray(avgQuizScoreResult) ? Math.round((avgQuizScoreResult[0] as any)?.avg_score || 0) : 0,
      totalCodingChallenges: Array.isArray(totalCodingResult) ? (totalCodingResult[0] as CountResult)?.count || 0 : 0,
      codingSuccessRate: Array.isArray(codingSuccessResult) ? Math.round((codingSuccessResult[0] as any)?.success_rate || 0) : 0,
      pointsDistributed: Array.isArray(pointsDistributedResult) ? (pointsDistributedResult[0] as any)?.total || 0 : 0,
      streakData: {} // Mock data - would need streak tracking
    };

    // Get system usage data (mock data for now - would need proper analytics)
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      weeklyActivity.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: Math.floor(Math.random() * 50) + 10,
        completions: Math.floor(Math.random() * 20) + 5
      });
    }

    const peakUsageHours = [];
    for (let hour = 0; hour < 24; hour++) {
      peakUsageHours.push({
        hour,
        users: Math.floor(Math.random() * 30) + 5
      });
    }

    const systemUsage = {
      peakUsageHours,
      deviceTypes: { 'Desktop': 65, 'Mobile': 25, 'Tablet': 10 },
      weeklyActivity
    };

    return NextResponse.json({
      userEngagement,
      coursePerformance,
      learningMetrics,
      systemUsage
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 