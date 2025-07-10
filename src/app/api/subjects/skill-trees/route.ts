import { NextResponse } from 'next/server';
import { query } from "@/lib/db";

interface SkillTree {
  id: number;
  title: string;
  subject_id: number; // keeping this for backward compatibility
}

export async function GET() {
  try {
    const courses = await query(`
      SELECT 
        id,
        title,
        id as subject_id
      FROM courses 
      WHERE is_published = true
      ORDER BY title
    `) as SkillTree[];

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching skill trees (courses):', error);
    return NextResponse.json(
      { error: 'Failed to fetch skill trees' },
      { status: 500 }
    );
  }
} 