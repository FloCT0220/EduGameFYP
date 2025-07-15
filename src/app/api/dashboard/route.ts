import { NextRequest, NextResponse } from 'next/server';
import { UserService, UserEnrollment } from '@/lib/services/userService';
import { AchievementService } from '@/lib/services/achievementService';
import { verifyToken } from '@/lib/auth';

interface DashboardEnrollmentData extends UserEnrollment {
  course_title: string;
  course_description: string;
  total_topics: number;
  completed_topics: number;
}



export async function GET(request: NextRequest) {
  try {
    // Get user ID from Authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const tokenPayload = verifyToken(token);
    if (!tokenPayload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const userId = tokenPayload.id;

    // Check and award any new achievements for this user
    await AchievementService.checkAndAwardAchievements(userId);

    const dashboardData = await UserService.getUserDashboardData(userId);

    if (!dashboardData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Format the data for the frontend
    const formattedData = {
      user: {
        id: dashboardData.user.id,
        name: dashboardData.user.username,
        points: dashboardData.user.total_points,
        currentXP: dashboardData.user.total_points % 1000,
        xpForNextLevel: 1000,
        streakDays: dashboardData.user.current_streak,
        maxStreak: dashboardData.user.max_streak
      },
      courses: (dashboardData.enrollments as DashboardEnrollmentData[]).map((enrollment: DashboardEnrollmentData) => ({
        id: enrollment.course_id,
        name: enrollment.course_title || 'Unknown Course',
        progress: enrollment.progress_percentage || 0,
        totalLessons: enrollment.total_topics || 0,
        completedLessons: enrollment.completed_topics || 0
      })),
      achievements: (await AchievementService.getAllAchievementsWithUserStatus(parseInt(userId))).map((achievement) => ({
        title: achievement.name,
        description: achievement.description,
        icon: achievement.icon_url,
        earned: achievement.earned,
        earnedDate: achievement.earned_at ? new Date(achievement.earned_at) : undefined,
        rarity: 'common' as const
      }))
    };

    return NextResponse.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
} 