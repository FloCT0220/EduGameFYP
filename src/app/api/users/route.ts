import { query } from "@/lib/db";  
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import bcrypt from 'bcryptjs';

// TypeScript interfaces for database results
interface ExistingUser {
    id: number;
    email: string;
}

interface UserProfile {
    id: number;
    username: string;
    email: string;
    role: string;
    bio?: string;
    total_points: number;
    level: number;
    current_streak: number;
    max_streak: number;
    created_at: string;
    last_login?: string;
}

interface InsertResult {
    insertId: number;
    affectedRows: number;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {username, email, password, role = 'student' } = body;

        console.log('User registration data received:', { username, email, role });

        // Basic validation
        if (!username || !email || !password) {
            return NextResponse.json(
                { error: "Missing required fields: username, email, password" }, 
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Invalid email format" }, 
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingUsers = await query(
            "SELECT id, email FROM users WHERE email = ?", 
            [email]
        ) as ExistingUser[];

        if (existingUsers.length > 0) {
            console.log('DUPLICATE EMAIL FOUND:', existingUsers);
            return NextResponse.json(
                { error: "Email already exists" }, 
                { status: 409 }
            );
        }

        // Hash password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const result = await query(
            `INSERT INTO users (username, email, password, role, created_at) 
             VALUES (?, ?, ?, ?, NOW())`,
            [username, email, hashedPassword, role]
        ) as InsertResult;

        return NextResponse.json({
            success: true,
            message: "User registered successfully",
            userId: result.insertId,
            user: {
                id: result.insertId,
                username,
                email,
                role
            }
        }, { status: 201 });

    } catch (error) {
        console.error("Error registering user:", error);
        console.error("Error details:", error instanceof Error ? error.message : 'Unknown error');
        return NextResponse.json(
            { 
                success: false,
                error: `Failed to register user: ${error instanceof Error ? error.message : 'Unknown error'}` 
            }, 
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        // Check for token-based auth first
        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const payload = verifyToken(token);
            if (payload) {
                // Get authenticated user's profile
                const users = await query(
                    "SELECT id, username, email, role, bio, total_points, level, current_streak, max_streak, created_at, last_login FROM users WHERE id = ?",
                    [payload.id]
                );
                
                const userList = users as UserProfile[];
                if (userList.length === 0) {
                    return NextResponse.json({
                        success: false,
                        error: "User not found"
                    }, { status: 404 });
                }

                return NextResponse.json({
                    success: true,
                    user: userList[0]
                });
            }
        }

        // If no token or invalid token, check for userId parameter (for admin use)
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (userId) {
            // Get specific user profile
            const users = await query(
                "SELECT id, username, email, role, bio, total_points, level, current_streak, max_streak, created_at, last_login FROM users WHERE id = ?",
                [userId]
            );
            
            const userList = users as UserProfile[];
            if (userList.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: "User not found"
                }, { status: 404 });
            }

            return NextResponse.json({
                success: true,
                user: userList[0]
            });
        } else {
            // Get all users (for admin)
            const users = await query(
                "SELECT id, username, email, role, total_points, level, current_streak, created_at FROM users ORDER BY created_at DESC"
            );
            
            return NextResponse.json({
                success: true,
                users: users
            });
        }
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ 
            success: false,
            error: "Failed to fetch users" 
        }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        // Authenticate user
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Authorization required' },
                { status: 401 }
            );
        }

        const token = authHeader.split(' ')[1];
        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { userId, username, bio } = body;

        // Ensure user can only update their own profile (or admin can update any)
        if (payload.role !== 'admin' && payload.id !== parseInt(userId)) {
            return NextResponse.json(
                { error: 'Permission denied' },
                { status: 403 }
            );
        }

        // Basic validation
        if (!username || username.trim().length < 2) {
            return NextResponse.json(
                { error: 'Username must be at least 2 characters long' },
                { status: 400 }
            );
        }

        // Check if username already exists (excluding current user)
        const existingUsers = await query(
            "SELECT id FROM users WHERE username = ? AND id != ?",
            [username.trim(), userId]
        ) as ExistingUser[];

        if (existingUsers.length > 0) {
            return NextResponse.json(
                { error: 'Username already taken' },
                { status: 409 }
            );
        }

        // Update user profile
        await query(
            "UPDATE users SET username = ?, bio = ? WHERE id = ?",
            [username.trim(), bio || null, userId]
        );

        // Get updated user data
        const updatedUsers = await query(
            "SELECT id, username, email, role, bio, total_points, level, current_streak, max_streak, created_at FROM users WHERE id = ?",
            [userId]
        ) as UserProfile[];

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUsers[0]
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        );
    }
} 