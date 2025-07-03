import bcrypt from 'bcryptjs';
import { query } from './db';

export interface User {
  id: number;
  email: string;
  username: string;
  role: 'student' | 'admin' | 'instructor';
  avatar_url?: string;
  total_points: number;
  level: number;
  created_at: Date;
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    // Get user by email
    const users = await query(`
      SELECT * FROM users WHERE email = ?
    `, [email]) as any[];
    
    if (users.length === 0) {
      return null;
    }
    
    const user = users[0];
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return null;
    }
    
    // Update last login
    await query(`
      UPDATE users SET updated_at = NOW() WHERE id = ?
    `, [user.id]);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export function generateToken(user: User): string {
  // Simple token generation - for production, use a proper JWT library
  const payload = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    timestamp: Date.now()
  };
  
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function verifyToken(token: string): any {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    // Simple expiration check (7 days)
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - payload.timestamp > sevenDaysInMs) {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
} 