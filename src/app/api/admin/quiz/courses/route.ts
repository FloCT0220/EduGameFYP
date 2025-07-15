import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface Course {
  id: number;
  title: string;
  description: string;
  difficulty_level: string;
  is_published: boolean;
}

export async function GET() {
  try {
    const courses = await query(`
      SELECT 
        id,
        title,
        description,
        difficulty_level,
        is_published
      FROM courses 
      WHERE is_published = true
      ORDER BY title ASC
    `) as Course[];

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
} 