import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface CountResult {
  count: number;
}

interface ScoreResult {
  avg_score: number;
}

interface LastActivityResult {
  last_activity: string | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: userIdParam } = await params;
    const userId = parseInt(userIdParam);
    
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Get user's course statistics
    const [
      totalCoursesResult,
      completedCoursesResult,
      quizzesTakenResult,
      averageScoreResult
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM user_enrollments WHERE user_id = ?', [userId]),
      query('SELECT COUNT(*) as count FROM user_enrollments WHERE user_id = ? AND completed_at IS NOT NULL', [userId]),
      query('SELECT COUNT(*) as count FROM quiz_attempts WHERE user_id = ? AND completed_at IS NOT NULL', [userId]),
      query('SELECT AVG(score_percentage) as avg_score FROM quiz_attempts WHERE user_id = ? AND completed_at IS NOT NULL', [userId])
    ]);

    // Get last activity
    const lastActivityResult = await query(`
      SELECT MAX(activity_date) as last_activity
      FROM (
        SELECT updated_at as activity_date FROM user_enrollments WHERE user_id = ?
        UNION ALL
        SELECT completed_at as activity_date FROM quiz_attempts WHERE user_id = ? AND completed_at IS NOT NULL
        UNION ALL
        SELECT submitted_at as activity_date FROM coding_submissions WHERE user_id = ?
      ) activities
    `, [userId, userId, userId]);

    const totalCourses = Array.isArray(totalCoursesResult) ? (totalCoursesResult[0] as CountResult)?.count || 0 : 0;
    const completedCourses = Array.isArray(completedCoursesResult) ? (completedCoursesResult[0] as CountResult)?.count || 0 : 0;
    const quizzesTaken = Array.isArray(quizzesTakenResult) ? (quizzesTakenResult[0] as CountResult)?.count || 0 : 0;
    const averageScore = Array.isArray(averageScoreResult) ? Math.round((averageScoreResult[0] as ScoreResult)?.avg_score || 0) : 0;
    
    const lastActivityDate = Array.isArray(lastActivityResult) && lastActivityResult[0] 
      ? (lastActivityResult[0] as LastActivityResult)?.last_activity 
      : null;

    const lastActivity = lastActivityDate 
      ? new Date(lastActivityDate).toLocaleDateString()
      : 'No recent activity';

    return NextResponse.json({
      totalCourses,
      completedCourses,
      quizzesTaken,
      averageScore,
      lastActivity
    });
  } catch (error) {
    console.error('User stats API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 