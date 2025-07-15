import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface Topic {
  id: number;
  course_id: number;
  title: string;
  lesson_order: number;
  is_published: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const topics = await query(`
      SELECT 
        id,
        course_id,
        title,
        lesson_order,
        is_published
      FROM topics 
      WHERE course_id = ? AND is_published = true
      ORDER BY lesson_order ASC
    `, [parseInt(courseId)]) as Topic[];

    return NextResponse.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
} 