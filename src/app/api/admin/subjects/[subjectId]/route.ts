import { NextRequest, NextResponse } from 'next/server';
import { query } from "lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { subjectId: string } }
) {
  try {
    const subjectId = parseInt(params.subjectId);
    const body = await request.json();
    const { title, description, difficulty, estimated_duration, icon, color_theme } = body;

    await query(`
      UPDATE subjects 
      SET title = ?, description = ?, difficulty = ?, estimated_duration = ?, icon = ?, color_theme = ?, updated_at = NOW()
      WHERE id = ?
    `, [title, description, difficulty, estimated_duration, icon, color_theme, subjectId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating subject:', error);
    return NextResponse.json(
      { error: 'Failed to update subject' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { subjectId: string } }
) {
  try {
    const subjectId = parseInt(params.subjectId);

    await query('DELETE FROM subjects WHERE id = ?', [subjectId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json(
      { error: 'Failed to delete subject' },
      { status: 500 }
    );
  }
} 