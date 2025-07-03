import { NextRequest, NextResponse } from 'next/server';
import { query } from "@/lib/db";

interface Course {
    id: number;
    title: string;
    description: string;
    difficulty_level: string;
    category: string;
    enrolled: number;
    progress_percentage: number;
    total_points_earned: number;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const difficulty = searchParams.get('difficulty');

        if (!userId) {
            return NextResponse.json({ 
                success: false, 
                error: 'User ID is required' 
            }, { status: 400 });
        }

        // Build the base query
        let coursesQuery = `
            SELECT 
                c.id,
                c.title,
                c.description,
                c.difficulty_level,
                c.category,
                CASE WHEN ue.user_id IS NOT NULL THEN 1 ELSE 0 END as enrolled,
                COALESCE(ue.progress_percentage, 0) as progress_percentage,
                COALESCE(ue.total_points_earned, 0) as total_points_earned
            FROM courses c
            LEFT JOIN user_enrollments ue ON c.id = ue.course_id AND ue.user_id = ?
            WHERE c.is_published = 1
        `;

        const queryParams: (string | number)[] = [userId];

        // Add difficulty filter if specified
        if (difficulty && difficulty !== 'all') {
            coursesQuery += ' AND c.difficulty_level = ?';
            queryParams.push(difficulty);
        }

        coursesQuery += ' ORDER BY c.title';

        const courses = await query(coursesQuery, queryParams) as Course[];

        return NextResponse.json({
            success: true,
            courses: courses
        });

    } catch (error) {
        console.error('Error fetching courses:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to fetch courses' 
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, courseId } = body;

        if (!userId || !courseId) {
            return NextResponse.json({ 
                success: false, 
                error: 'User ID and Course ID are required' 
            }, { status: 400 });
        }

        // Check if user is already enrolled
        const existingEnrollment = await query(
            'SELECT id FROM user_enrollments WHERE user_id = ? AND course_id = ?',
            [userId, courseId]
        ) as { id: number }[];

        if (existingEnrollment.length > 0) {
            return NextResponse.json({ 
                success: false, 
                error: 'User is already enrolled in this course' 
            }, { status: 400 });
        }

        // Enroll user in the course
        await query(
            'INSERT INTO user_enrollments (user_id, course_id) VALUES (?, ?)',
            [userId, courseId]
        );

        return NextResponse.json({
            success: true,
            message: 'Successfully enrolled in course'
        });

    } catch (error) {
        console.error('Error enrolling in course:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to enroll in course' 
        }, { status: 500 });
    }
} 