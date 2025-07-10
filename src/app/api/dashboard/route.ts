import { NextRequest, NextResponse } from 'next/server';
import { UserService, UserEnrollment } from '@/lib/services/userService';

interface DashboardEnrollmentData extends UserEnrollment {
  course_title: string;
  course_description: string;
  total_topics: number;
  completed_topics: number;
}

interface AchievementData {
  name: string;
  description: string;
  icon_url: string;
  badge_color: string;
  earned_at?: Date;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const dashboardData = await UserService.getUserDashboardData(parseInt(userId));

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
        level: dashboardData.user.level,
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
      achievements: dashboardData.achievements.map((achievement: AchievementData) => ({
        title: achievement.name,
        description: achievement.description,
        icon: achievement.icon_url,
        earned: !!achievement.earned_at,
        earnedDate: achievement.earned_at,
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