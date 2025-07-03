import { NextResponse } from 'next/server';
import { query } from "@/lib/db";

export async function GET() {
  try {
    const subjects = await query(`
      SELECT 
        id,
        title,
        description,
        difficulty,
        estimated_duration,
        icon,
        color_theme,
        is_active,
        created_at,
        updated_at
      FROM subjects 
      ORDER BY title
    `) as any[];

    return NextResponse.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, difficulty, estimated_duration, icon, color_theme } = body;

    const result = await query(`
      INSERT INTO subjects (title, description, difficulty, estimated_duration, icon, color_theme)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [title, description, difficulty, estimated_duration, icon, color_theme]);

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json(
      { error: 'Failed to create subject' },
      { status: 500 }
    );
  }
} 