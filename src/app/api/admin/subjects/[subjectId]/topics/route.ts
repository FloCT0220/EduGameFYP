import { NextRequest, NextResponse } from 'next/server';
import { query } from "@/lib/db";

interface ContentSection {
  title: string;
  content: string;
}

interface StructuredContent {
  sections: ContentSection[];
}

interface Topic {
  id: number;
  course_id: number;
  title: string;
  content: string;
  structured_content?: StructuredContent;
  lesson_order: number;
  points_reward: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface InsertResult {
  insertId: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { subjectId: string } }
) {
  try {
    const awaitedParams = await params;
    const courseId = parseInt(awaitedParams.subjectId);

    const topics = await query(`
      SELECT 
        id,
        course_id,
        title,
        content,
        structured_content,
        lesson_order,
        points_reward,
        is_published,
        created_at,
        updated_at
      FROM topics 
      WHERE course_id = ?
      ORDER BY lesson_order ASC
    `, [courseId]) as Topic[];

    return NextResponse.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { subjectId: string } }
) {
  try {
    const awaitedParams = await params;
    const courseId = parseInt(awaitedParams.subjectId);
    const body = await request.json();
    const { 
      title, 
      structured_content,
      points_reward, 
      is_published
    } = body;

    // Auto-generate the next lesson order
    const existingTopics = await query(`
      SELECT MAX(lesson_order) as max_order 
      FROM topics 
      WHERE course_id = ?
    `, [courseId]) as { max_order: number | null }[];

    const nextLessonOrder = (existingTopics[0]?.max_order || 0) + 1;

    const result = await query(`
      INSERT INTO topics (
        course_id, 
        title, 
        structured_content,
        lesson_order, 
        points_reward, 
        is_published
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      courseId,
      title,
      structured_content ? JSON.stringify(structured_content) : null,
      nextLessonOrder,
      points_reward,
      is_published
    ]) as InsertResult;

    return NextResponse.json({ 
      success: true, 
      id: result.insertId,
      lesson_order: nextLessonOrder,
      message: 'Topic created successfully'
    });
  } catch (error) {
    console.error('Error creating topic:', error);
    return NextResponse.json(
      { error: 'Failed to create topic' },
      { status: 500 }
    );
  }
} 