import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, generateToken } from '@/lib/auth';
import { initializeDatabase, checkConnection } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Check database connection first
    const isConnected = await checkConnection();
    if (!isConnected) {
      console.error('❌ Database connection failed');
      return NextResponse.json(
        { error: 'Database connection failed. Please check your database configuration.' },
        { status: 500 }
      );
    }

    // Initialize database on first login attempt
    console.log('🔄 Initializing database...');
    await initializeDatabase();
    console.log('✅ Database initialized');
    
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('🔐 Attempting to authenticate user:', email);
    const user = await authenticateUser(email, password);

    if (!user) {
      console.log('❌ Authentication failed for user:', email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('✅ Authentication successful for user:', email);
    const token = generateToken(user);

    return NextResponse.json({
      success: true,
      user,
      token
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
} 