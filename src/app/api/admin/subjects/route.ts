import { NextResponse } from 'next/server';
import { query } from "@/lib/db";

interface Course {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  is_active: boolean;
  enrolled_count: number;
  created_at: string;
  updated_at: string;
}

interface InsertResult {
  insertId: number;
}

export async function GET() {
  try {
    const courses = await query(`
      SELECT 
        c.id,
        c.title,
        c.description,
        c.difficulty_level as difficulty,
        c.is_published as is_active,
        (SELECT COUNT(*) FROM user_enrollments WHERE course_id = c.id) as enrolled_count,
        c.created_at,
        c.updated_at
      FROM courses c
      ORDER BY c.title
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, difficulty, is_published } = body;

    const result = await query(`
      INSERT INTO courses (title, description, difficulty_level, is_published)
      VALUES (?, ?, ?, ?)
    `, [title, description, difficulty, is_published]) as InsertResult;

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
} 