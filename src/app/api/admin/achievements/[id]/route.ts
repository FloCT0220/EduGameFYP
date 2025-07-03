import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { ResultSetHeader } from 'mysql2';

// GET a single achievement by id
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [achievement] = await query('SELECT * FROM achievements WHERE id = ?', [params.id]);
    if (!achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }
    return NextResponse.json(achievement);
  } catch (error) {
    console.error('Error fetching achievement:', error);
    return NextResponse.json({ error: 'Failed to fetch achievement' }, { status: 500 });
  }
}

// PUT update an achievement
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { title, description, icon, type, requirement_value, points_reward, rarity, is_active } = body;
    const result = await query(
      `UPDATE achievements SET title=?, description=?, icon=?, type=?, requirement_value=?, points_reward=?, rarity=?, is_active=? WHERE id=?`,
      [title, description, icon, type, requirement_value, points_reward, rarity, is_active, params.id]
    ) as ResultSetHeader;
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating achievement:', error);
    return NextResponse.json({ error: 'Failed to update achievement' }, { status: 500 });
  }
}

// DELETE an achievement
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await query('DELETE FROM achievements WHERE id = ?', [params.id]) as ResultSetHeader;
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    return NextResponse.json({ error: 'Failed to delete achievement' }, { status: 500 });
  }
} 