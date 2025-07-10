import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

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
                u.username as creator_name,
                c.enrolled_count,
                CASE WHEN ue.user_id IS NOT NULL THEN true ELSE false END as enrolled,
                COALESCE(ue.progress_percentage, 0) as progress_percentage,
                COALESCE(ue.total_points_earned, 0) as total_points_earned
            FROM courses c
            LEFT JOIN users u ON c.created_by = u.id
            LEFT JOIN user_enrollments ue ON c.id = ue.course_id AND ue.user_id = ?
            WHERE c.is_published = true
        `;

        const queryParams: (string | number)[] = [parseInt(userId)];

        // Add difficulty filter if specified
        if (difficulty && difficulty !== 'all' && difficulty !== 'my-courses') {
            coursesQuery += ' AND c.difficulty_level = ?';
            queryParams.push(difficulty);
        }

        // Add my courses filter
        if (difficulty === 'my-courses') {
            coursesQuery += ' AND ue.user_id IS NOT NULL';
        }

        coursesQuery += ' ORDER BY c.title';

        const courses = await query(coursesQuery, queryParams);

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

// Handle course enrollment
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

        // Check if already enrolled
        const existingEnrollment = await query(
            'SELECT id FROM user_enrollments WHERE user_id = ? AND course_id = ?',
            [userId, courseId]
        ) as { id: number }[];

        if (existingEnrollment.length > 0) {
            return NextResponse.json({ 
                success: false, 
                error: 'Already enrolled in this course' 
            }, { status: 400 });
        }

        // Create enrollment
        await query(
            `INSERT INTO user_enrollments 
             (user_id, course_id, enrolled_at, progress_percentage, total_points_earned)
             VALUES (?, ?, NOW(), 0, 0)`,
            [userId, courseId]
        );

        // Update course enrolled count
        await query(
            'UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ?',
            [courseId]
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