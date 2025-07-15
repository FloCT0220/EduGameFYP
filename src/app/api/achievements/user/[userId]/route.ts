import { NextRequest, NextResponse } from 'next/server';
import { AchievementService } from '@/lib/services/achievementService';
import { getSession } from '@/lib/session';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from session
    const authToken = getSession('authToken');
    if (!authToken) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Decode user ID from token
    const tokenPayload = verifyToken(authToken);
    if (!tokenPayload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const userId = tokenPayload.id;

    // Get all achievements with user's earned status
    const achievements = await AchievementService.getAllAchievementsWithUserStatus(userId);

    return NextResponse.json({
      success: true,
      achievements
    });
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
} 