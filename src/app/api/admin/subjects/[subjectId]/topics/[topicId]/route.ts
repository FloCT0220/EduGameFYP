function hasSections(obj: unknown): obj is { sections: unknown[] } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'sections' in obj &&
    Array.isArray((obj as { sections: unknown[] }).sections)
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string; topicId: string }> }
) {
  try {
    const { subjectId, topicId } = await params;
    const courseId = parseInt(subjectId);
    const topicIdNum = parseInt(topicId);

    if (isNaN(courseId) || isNaN(topicIdNum)) {
      return NextResponse.json({ error: 'Invalid course or topic ID' }, { status: 400 });
    }

    const result = await query(
      'SELECT id, course_id, title, content, structured_content, lesson_order, points_reward, is_published, created_at, updated_at FROM topics WHERE id = ? AND course_id = ?',
      [topicIdNum, courseId]
    );

    if (!result || !Array.isArray(result) || result.length === 0) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    const topic = result[0] as Record<string, unknown>;
    
    // Parse structured_content if it exists
    if (topic.structured_content) {
      if (typeof topic.structured_content === 'string') {
        try {
          topic.structured_content = JSON.parse(topic.structured_content);
        } catch (error) {
          console.error('Error parsing structured_content:', error);
          topic.structured_content = null;
        }
      }
      // If it's already an object/array, no need to parse
      // If it's wrapped in { sections: [...] }, unwrap it
      if (hasSections(topic.structured_content)) {
        topic.structured_content = topic.structured_content.sections;
      }
    }

    return NextResponse.json(topic);
  } catch (error) {
    console.error('Error fetching topic:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string; topicId: string }> }
) {
  try {
    const { subjectId, topicId } = await params;
    const courseId = parseInt(subjectId);
    const topicIdNum = parseInt(topicId);
    const body = await request.json();

    if (isNaN(courseId) || isNaN(topicIdNum)) {
      return NextResponse.json({ error: 'Invalid course or topic ID' }, { status: 400 });
    }

    const { title, content, is_published, lesson_order, points_reward, structured_content } = body;

    // Validate required fields
    if (!title || !lesson_order || points_reward === undefined) {
      return NextResponse.json({ error: 'Title, lesson order, and points reward are required' }, { status: 400 });
    }

    // Check if topic exists
    const existingTopic = await query('SELECT id FROM topics WHERE id = ? AND course_id = ?', [topicIdNum, courseId]);
    if (!existingTopic || !Array.isArray(existingTopic) || existingTopic.length === 0) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Check if lesson order is unique within the course (excluding current topic)
    const orderCheck = await query(
      'SELECT id FROM topics WHERE course_id = ? AND lesson_order = ? AND id != ?',
      [courseId, lesson_order, topicIdNum]
    );
    if (orderCheck && Array.isArray(orderCheck) && orderCheck.length > 0) {
      return NextResponse.json({ error: `Lesson order ${lesson_order} is already taken by another topic in this course` }, { status: 400 });
    }

    // Save structured_content as a direct array
    let structuredContentJson = null;
    if (structured_content) {
      if (hasSections(structured_content)) {
        structuredContentJson = JSON.stringify(structured_content.sections);
      } else if (Array.isArray(structured_content)) {
        structuredContentJson = JSON.stringify(structured_content);
      } else {
        structuredContentJson = JSON.stringify([]);
      }
    }

    await query(
      'UPDATE topics SET title = ?, content = ?, lesson_order = ?, points_reward = ?, is_published = ?, structured_content = ?, updated_at = NOW() WHERE id = ? AND course_id = ?',
      [title, content || null, lesson_order, points_reward, is_published, structuredContentJson, topicIdNum, courseId]
    );

    return NextResponse.json({ message: 'Topic updated successfully' });
  } catch (error) {
    console.error('Error updating topic:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string; topicId: string }> }
) {
  try {
    const { subjectId, topicId } = await params;
    const courseId = parseInt(subjectId);
    const topicIdNum = parseInt(topicId);

    if (isNaN(courseId) || isNaN(topicIdNum)) {
      return NextResponse.json({ error: 'Invalid course or topic ID' }, { status: 400 });
    }

    // Check if topic exists
    const existingTopic = await query('SELECT id FROM topics WHERE id = ? AND course_id = ?', [topicIdNum, courseId]);
    if (!existingTopic || !Array.isArray(existingTopic) || existingTopic.length === 0) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Delete topic
    await query('DELETE FROM topics WHERE id = ? AND course_id = ?', [topicIdNum, courseId]);

    return NextResponse.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    console.error('Error deleting topic:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 