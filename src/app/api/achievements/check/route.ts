import { NextResponse } from 'next/server';
import { AchievementService } from '@/lib/services/achievementService';
import { getSession } from '@/lib/session';
import { verifyToken } from '@/lib/auth';

export async function POST() {
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

    // Check and award achievements
    const newlyEarned = await AchievementService.checkAndAwardAchievements(userId);

    return NextResponse.json({
      success: true,
      newlyEarned,
      count: newlyEarned.length
    });
  } catch (error) {
    console.error('Error checking achievements:', error);
    return NextResponse.json({ error: 'Failed to check achievements' }, { status: 500 });
  }
} 