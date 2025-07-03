import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/userService';

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
      courses: dashboardData.enrollments.map((enrollment: any) => ({
        id: enrollment.subject_id,
        name: enrollment.subject_title || 'Unknown Subject',
        progress: enrollment.progress_percentage,
        totalLessons: enrollment.total_nodes || 0,
        completedLessons: enrollment.completed_nodes || 0
      })),
      achievements: dashboardData.achievements.map(achievement => ({
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        earned: !!achievement.earned_at,
        earnedDate: achievement.earned_at,
        rarity: achievement.rarity
      })),
      quizStats: {
        totalAttempts: dashboardData.quizStats.total_attempts,
        averageScore: Math.round(dashboardData.quizStats.avg_score || 0),
        totalPoints: dashboardData.quizStats.total_quiz_points
      }
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