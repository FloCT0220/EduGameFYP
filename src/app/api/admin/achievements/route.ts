import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { ResultSetHeader } from 'mysql2';

// GET all achievements
export async function GET() {
  try {
    const achievements = await query('SELECT * FROM achievements ORDER BY created_at DESC');
    return NextResponse.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
}

// POST a new achievement
export async function POST(request: NextRequest) {
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
    
    // All data is validated, proceed with insertion
    const params = [
      title.trim(), // name
      description.trim(), // description
      icon.trim(), // icon_url
      type.trim(), // category
      requirement_value, // points_required
      is_active // is_active
    ];
    
    const result = await query(
      `INSERT INTO achievements (name, description, icon_url, category, points_required, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      params
    ) as ResultSetHeader;
    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error creating achievement:', error);
    return NextResponse.json({ error: 'Failed to create achievement' }, { status: 500 });
  }
} 