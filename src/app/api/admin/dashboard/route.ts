import { NextResponse } from 'next/server';
import { query } from "lib/db";

export async function GET() {
  try {
    // Get total users
    const usersResult = await query('SELECT COUNT(*) as count FROM users') as { count: number }[];
    const totalUsers = usersResult[0]?.count || 0;

    // Get total subjects
    const subjectsResult = await query('SELECT COUNT(*) as count FROM subjects') as { count: number }[];
    const totalSubjects = subjectsResult[0]?.count || 0;

    // Get total quiz questions
    const quizzesResult = await query('SELECT COUNT(*) as count FROM quiz_questions') as { count: number }[];
    const totalQuizzes = quizzesResult[0]?.count || 0;

    // Get total achievements
    const achievementsResult = await query('SELECT COUNT(*) as count FROM achievements') as { count: number }[];
    const totalAchievements = achievementsResult[0]?.count || 0;

    return NextResponse.json({
      totalUsers,
      totalSubjects,
      totalQuizzes,
      totalAchievements
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
} 