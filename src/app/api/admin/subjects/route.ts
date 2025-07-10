import { NextResponse } from 'next/server';
import { query } from "@/lib/db";

interface Course {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  thumbnail_url: string;
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
        id,
        title,
        description,
        difficulty_level as difficulty,
        category,
        thumbnail_url,
        is_published as is_active,
        enrolled_count,
        created_at,
        updated_at
      FROM courses 
      ORDER BY title
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
    const { title, description, difficulty, category, thumbnail_url } = body;

    const result = await query(`
      INSERT INTO courses (title, description, difficulty_level, category, thumbnail_url, is_published)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [title, description, difficulty, category, thumbnail_url, true]) as InsertResult;

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
} 