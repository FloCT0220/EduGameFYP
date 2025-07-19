import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const result = await query(
      'SELECT id, username, email, role, bio, total_points, current_streak, max_streak, last_login, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    if (!result || !Array.isArray(result) || result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    const body = await request.json();

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const { username, email, password, role } = body;

    // Validate required fields
    if (!username || !email || !role) {
      return NextResponse.json({ error: 'Username, email, and role are required' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await query('SELECT id FROM users WHERE id = ?', [userId]);
    if (!existingUser || !Array.isArray(existingUser) || existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if email is already taken by another user
    const emailCheck = await query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
    if (emailCheck && Array.isArray(emailCheck) && emailCheck.length > 0) {
      return NextResponse.json({ error: 'Email is already taken' }, { status: 400 });
    }

    // Check if username is already taken by another user
    const usernameCheck = await query('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId]);
    if (usernameCheck && Array.isArray(usernameCheck) && usernameCheck.length > 0) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
    }

    // Update user
    if (password && password.trim() !== '') {
      // Update with password
      await query(
        'UPDATE users SET username = ?, email = ?, password = ?, role = ? WHERE id = ?',
        [username, email, password, role, userId]
      );
    } else {
      // Update without password
      await query(
        'UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?',
        [username, email, role, userId]
      );
    }

    return NextResponse.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await query('SELECT id FROM users WHERE id = ?', [userId]);
    if (!existingUser || !Array.isArray(existingUser) || existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user
    await query('DELETE FROM users WHERE id = ?', [userId]);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 