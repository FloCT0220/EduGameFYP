import { NextRequest, NextResponse } from 'next/server';
import { query } from "@/lib/db";

interface ContentSection {
  title: string;
  content: string;
}

interface StructuredContent {
  sections: ContentSection[];
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { subjectId: string; topicId: string } }
) {
  try {
    const awaitedParams = await params;
    const courseId = parseInt(awaitedParams.subjectId);
    const topicId = parseInt(awaitedParams.topicId);
    const body = await request.json();
    
    const { 
      title, 
      structured_content,
      lesson_order, 
      points_reward, 
      is_published
    }: {
      title: string;
      structured_content?: StructuredContent;
      lesson_order: number;
      points_reward: number;
      is_published: boolean;
    } = body;

    // Validate lesson order uniqueness within the course (excluding current topic)
    const existingTopics = await query(`
      SELECT COUNT(*) as count 
      FROM topics 
      WHERE course_id = ? AND lesson_order = ? AND id != ?
    `, [courseId, lesson_order, topicId]) as { count: number }[];

    if (existingTopics[0].count > 0) {
      return NextResponse.json(
        { error: `Lesson order ${lesson_order} is already taken by another topic in this course.` },
        { status: 400 }
      );
    }

    await query(`
      UPDATE topics 
      SET 
        title = ?, 
        structured_content = ?,
        lesson_order = ?, 
        points_reward = ?, 
        is_published = ?,
        updated_at = NOW()
      WHERE id = ? AND course_id = ?
    `, [
      title,
      structured_content ? JSON.stringify(structured_content) : null,
      lesson_order,
      points_reward,
      is_published,
      topicId,
      courseId
    ]);

    return NextResponse.json({ 
      success: true,
      message: 'Topic updated successfully'
    });
  } catch (error) {
    console.error('Error updating topic:', error);
    return NextResponse.json(
      { error: 'Failed to update topic' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { subjectId: string; topicId: string } }
) {
  try {
    const awaitedParams = await params;
    const courseId = parseInt(awaitedParams.subjectId);
    const topicId = parseInt(awaitedParams.topicId);

    await query(
      'DELETE FROM topics WHERE id = ? AND course_id = ?',
      [topicId, courseId]
    );

    return NextResponse.json({ 
      success: true,
      message: 'Topic deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting topic:', error);
    return NextResponse.json(
      { error: 'Failed to delete topic' },
      { status: 500 }
    );
  }
} 