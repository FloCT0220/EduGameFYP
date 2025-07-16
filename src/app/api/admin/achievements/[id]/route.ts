import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { ResultSetHeader } from 'mysql2';

// GET a single achievement by id
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const achievements = await query('SELECT * FROM achievements WHERE id = ?', [id]) as unknown as Record<string, unknown>[];
    const achievement = achievements[0];
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
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const { title, description, icon, type, requirement_value, is_active } = body;
    
    // Validate all required fields
    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    if (!description || description.trim() === '') {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }
    
    if (!icon || icon.trim() === '') {
      return NextResponse.json({ error: 'Icon is required' }, { status: 400 });
    }
    
    if (!type || type.trim() === '') {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }
    
    if (requirement_value === undefined || requirement_value === null || requirement_value < 0) {
      return NextResponse.json({ error: 'Points required must be a valid number (0 or greater)' }, { status: 400 });
    }
    
    if (is_active === undefined || is_active === null) {
      return NextResponse.json({ error: 'Active status is required' }, { status: 400 });
    }
    
    const { id } = await params;
    
    // All data is validated, proceed with update
    const updateParams = [
      title.trim(), // name
      description.trim(), // description
      icon.trim(), // icon_url
      type.trim(), // category
      requirement_value, // points_required
      is_active, // is_active
      id
    ];
    
    const result = await query(
      `UPDATE achievements SET name=?, description=?, icon_url=?, category=?, points_required=?, is_active=? WHERE id=?`,
      updateParams
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
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await query('DELETE FROM achievements WHERE id = ?', [id]) as ResultSetHeader;
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    return NextResponse.json({ error: 'Failed to delete achievement' }, { status: 500 });
  }
} 