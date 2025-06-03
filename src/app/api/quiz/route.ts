import { createConnection } from "lib/db";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const db = await createConnection();
		const posts = await db.query("SELECT * FROM quiz_questions");
		
		return NextResponse.json(posts);
	} catch (error) {
		console.error("Error fetching quiz_questions:", error);
		return NextResponse.json({ error: "Failed to fetch quiz_questions" }, { status: 500 });
		
	}
}