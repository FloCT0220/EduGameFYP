import { NextResponse } from 'next/server';
import { initializeDatabase, resetDatabase, checkConnection } from '@/lib/db';

export async function POST() {
  try {
    await initializeDatabase();
    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully' 
    });
  } catch (error) {
    console.error('Database initialization failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Database initialization failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT() {
  try {
    await resetDatabase();
    return NextResponse.json({ 
      success: true, 
      message: 'Database reset successfully' 
    });
  } catch (error) {
    console.error('Database reset failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Database reset failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const isConnected = await checkConnection();
    return NextResponse.json({ 
      success: true, 
      connected: isConnected,
      message: isConnected ? 'Database connection successful' : 'Database connection failed'
    });
  } catch (error) {
    console.error('Database connection check failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        connected: false,
        message: 'Database connection check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 