import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';
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
    const { title, description, icon, type, requirement_value, points_reward, rarity, is_active } = body;
    if (!title || !type || !rarity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const result = await query(
      `INSERT INTO achievements (title, description, icon, type, requirement_value, points_reward, rarity, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [title, description, icon, type, requirement_value, points_reward, rarity, is_active]
    ) as ResultSetHeader;
    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error creating achievement:', error);
    return NextResponse.json({ error: 'Failed to create achievement' }, { status: 500 });
  }
} 