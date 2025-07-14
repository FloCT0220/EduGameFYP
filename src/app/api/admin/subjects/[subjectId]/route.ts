import { NextRequest, NextResponse } from 'next/server';
import { query } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { subjectId: string } }
) {
  try {
    const awaitedParams = await params;
    const courseId = parseInt(awaitedParams.subjectId);
    const body = await request.json();
    const { title, description, difficulty, thumbnail_url } = body;

    await query(`
      UPDATE courses 
      SET title = ?, description = ?, difficulty_level = ?, thumbnail_url = ?, updated_at = NOW()
      WHERE id = ?
    `, [title, description, difficulty, thumbnail_url, courseId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { subjectId: string } }
) {
  try {
    const awaitedParams = await params;
    const courseId = parseInt(awaitedParams.subjectId);

    await query('DELETE FROM courses WHERE id = ?', [courseId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
} 