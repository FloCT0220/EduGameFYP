import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const questions = await query(`
			SELECT 
				q.*,
				c.title as subject_name,
				t.title as topic_name
			FROM quiz_questions q
			LEFT JOIN courses c ON q.course_id = c.id
			LEFT JOIN topics t ON q.topic_id = t.id
			WHERE q.is_active = true
			ORDER BY q.course_id, q.topic_id, q.id
		`);
		
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