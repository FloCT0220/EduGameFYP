import { createConnection } from "lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const db = await createConnection();
        
        // Get total count
        const [count] = await db.query("SELECT COUNT(*) as total FROM app_users");
        
        // Get all users (limited to 10 for safety)
        const [users] = await db.query("SELECT id, username, email, created_at FROM app_users LIMIT 10");
        
        // Get table structure
        const [tableStructure] = await db.query("DESCRIBE app_users");
        
        return NextResponse.json({
            message: "Database debug info",
            totalUsers: count[0]?.total || 0,
            users: users,
            tableStructure: tableStructure,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error("Debug endpoint error:", error);
        return NextResponse.json({
            error: "Failed to fetch debug info",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 