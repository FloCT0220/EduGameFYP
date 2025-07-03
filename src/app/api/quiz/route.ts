import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const questions = await query("SELECT * FROM quiz_questions WHERE is_active = true");
		
		return NextResponse.json({
			success: true,
			questions: questions
		});
	} catch (error) {
		console.error("Error fetching quiz questions:", error);
		return NextResponse.json({ 
			error: "Failed to fetch quiz questions",
			success: false 
		}, { status: 500 });
	}
}