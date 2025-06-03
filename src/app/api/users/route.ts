import { createConnection } from "lib/db";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, email, password } = body;

        console.log('Form data received:', { username, email });

        // Basic validation
        if (!username || !email || !password) {
            return NextResponse.json(
                { error: "Missing required fields" }, 
                { status: 400 }
            );
        }

        // Check if email already exists
        const db = await createConnection();
        
        // First, let's check total user count
        const [totalUsersResult] = await db.query("SELECT COUNT(*) as count FROM app_users");
        console.log('Total users in database:', totalUsersResult);

        // Now check for specific user - destructure to get only the data rows
        const [existingUserRows] = await db.query(
            "SELECT id, email, username FROM app_users WHERE email = ? OR username = ?", 
            [email, username]
        );

        if (existingUserRows.length > 0) {
            console.log('DUPLICATE FOUND:', existingUserRows);
            return NextResponse.json(
                { error: "Email or username already exists" }, 
                { status: 409 }
            );
        }

        // Insert new user - also destructure the result
        const [result] = await db.query(
            `INSERT INTO app_users (username, email, password, created_at) 
             VALUES (?, ?, ?, NOW())`,
            [username, email, password]
        );

        return NextResponse.json({
            message: "User registered successfully",
            userId: result.insertId
        }, { status: 201 });

    } catch (error) {
        console.error("Error registering user:", error);
        console.error("Error details:", error instanceof Error ? error.message : 'Unknown error');
        return NextResponse.json(
            { error: `Failed to register user: ${error instanceof Error ? error.message : 'Unknown error'}` }, 
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const db = await createConnection();
        const [users] = await db.query("SELECT id, username, email, created_at FROM app_users");
        
        return NextResponse.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
} 