import { query } from "@/lib/db";  
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import bcrypt from 'bcryptjs';

// TypeScript interfaces for database results
interface ExistingUser {
    id: number;
    email: string;
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

export async function GET() {
    try {
        const users = await query(
            "SELECT id, username, email, role, total_points, level, current_streak, created_at FROM users ORDER BY created_at DESC"
        );
        
        return NextResponse.json({
            success: true,
            users: users
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ 
            success: false,
            error: "Failed to fetch users" 
        }, { status: 500 });
    }
} 