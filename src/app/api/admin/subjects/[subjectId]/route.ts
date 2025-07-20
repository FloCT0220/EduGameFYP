import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  try {
    const { subjectId } = await params;
    const courseId = parseInt(subjectId);

    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const result = await query(
      'SELECT id, title, description, difficulty_level as difficulty, is_published as is_active, created_at, updated_at FROM courses WHERE id = ?',
      [courseId]
    );

    if (!result || !Array.isArray(result) || result.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  try {
    const { subjectId } = await params;
    const courseId = parseInt(subjectId);
    const body = await request.json();

    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const { title, description, difficulty, is_published } = body;

    // Validate required fields
    if (!title || !description || !difficulty) {
      return NextResponse.json({ error: 'Title, description, and difficulty are required' }, { status: 400 });
    }

    // Check if course exists
    const existingCourse = await query('SELECT id FROM courses WHERE id = ?', [courseId]);
    if (!existingCourse || !Array.isArray(existingCourse) || existingCourse.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if another course with the same title already exists (excluding current course)
    const duplicateCourse = await query(
      'SELECT id FROM courses WHERE title = ? AND id != ?',
      [title, courseId]
    );
    if (duplicateCourse && Array.isArray(duplicateCourse) && duplicateCourse.length > 0) {
      return NextResponse.json(
        { error: 'A course with this title already exists' },
        { status: 400 }
      );
    }

    // Update course
    await query(
      'UPDATE courses SET title = ?, description = ?, difficulty_level = ?, is_published = ? WHERE id = ?',
      [title, description, difficulty, is_published, courseId]
    );

    return NextResponse.json({ message: 'Course updated successfully' });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  try {
    const { subjectId } = await params;
    const courseId = parseInt(subjectId);

    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    // Check if course exists
    const existingCourse = await query('SELECT id FROM courses WHERE id = ?', [courseId]);
    if (!existingCourse || !Array.isArray(existingCourse) || existingCourse.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Delete course
    await query('DELETE FROM courses WHERE id = ?', [courseId]);

    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 