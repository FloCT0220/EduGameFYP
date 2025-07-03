import { query } from "@/lib/db";
import { NextResponse } from "next/server";

// TypeScript interfaces for database results
interface CountResult {
    total: number;
}

interface UserResult {
    id: number;
    username: string;
    email: string;
    created_at: string;
}

interface TableStructure {
    Field: string;
    Type: string;
    Null: string;
    Key: string;
    Default: string | null;
    Extra: string;
}

export async function GET() {
    try {
        // Get total count
        const count = await query("SELECT COUNT(*) as total FROM users") as CountResult[];
        
        // Get all users (limited to 10 for safety)
        const users = await query("SELECT id, username, email, created_at FROM users LIMIT 10") as UserResult[];
        
        // Get table structure
        const tableStructure = await query("DESCRIBE users") as TableStructure[];
        
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