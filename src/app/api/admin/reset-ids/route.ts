import { createConnection } from "lib/db";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { table, resetTo } = body;
        
        // Validate input
        const allowedTables = ['app_users', 'quiz_items'];
        if (!allowedTables.includes(table)) {
            return NextResponse.json(
                { error: "Invalid table name" }, 
                { status: 400 }
            );
        }

        const db = await createConnection();
        
        if (resetTo === 'auto') {
            // Reset to max ID + 1
            const [maxResult] = await db.query(`SELECT MAX(id) as maxId FROM ${table}`);
            const maxId = maxResult[0]?.maxId || 0;
            const nextId = maxId + 1;
            
            await db.query(`ALTER TABLE ${table} AUTO_INCREMENT = ?`, [nextId]);
            
            return NextResponse.json({
                message: `Auto-increment reset for ${table}`,
                previousMaxId: maxId,
                newAutoIncrement: nextId
            });
            
        } else if (resetTo && typeof resetTo === 'number') {
            // Reset to specific number
            await db.query(`ALTER TABLE ${table} AUTO_INCREMENT = ?`, [resetTo]);
            
            return NextResponse.json({
                message: `Auto-increment reset for ${table}`,
                newAutoIncrement: resetTo
            });
            
        } else {
            return NextResponse.json(
                { error: "Invalid resetTo value. Use 'auto' or a number" }, 
                { status: 400 }
            );
        }

    } catch (error) {
        console.error("Error resetting auto-increment:", error);
        return NextResponse.json(
            { error: `Failed to reset auto-increment: ${error instanceof Error ? error.message : 'Unknown error'}` }, 
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const db = await createConnection();
        
        // Get current auto-increment values for all tables
        const [tables] = await db.query(`
            SELECT 
                TABLE_NAME,
                AUTO_INCREMENT
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND AUTO_INCREMENT IS NOT NULL
        `);
        
        // Get max IDs for comparison
        const [userMax] = await db.query("SELECT MAX(id) as maxId, COUNT(*) as totalRows FROM app_users");
        const [quizMax] = await db.query("SELECT MAX(id) as maxId, COUNT(*) as totalRows FROM quiz_items");
        
        return NextResponse.json({
            autoIncrementStatus: tables,
            currentMaxIds: {
                app_users: {
                    maxId: userMax[0]?.maxId || 0,
                    totalRows: userMax[0]?.totalRows || 0
                },
                quiz_items: {
                    maxId: quizMax[0]?.maxId || 0,
                    totalRows: quizMax[0]?.totalRows || 0
                }
            }
        });
        
    } catch (error) {
        console.error("Error fetching auto-increment status:", error);
        return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
    }
} 