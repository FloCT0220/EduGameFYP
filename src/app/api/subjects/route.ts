import { NextRequest, NextResponse } from 'next/server';
import { query } from "../../../../lib/db";

interface Subject {
    id: number;
    title: string;
    description: string;
    difficulty: string;
    estimated_duration: number;
    icon: string;
    color_theme: string;
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
        let subjectsQuery = `
            SELECT 
                s.id,
                s.title,
                s.description,
                s.difficulty,
                s.estimated_duration,
                s.icon,
                s.color_theme,
                CASE WHEN ue.user_id IS NOT NULL THEN 1 ELSE 0 END as enrolled,
                COALESCE(ue.progress_percentage, 0) as progress_percentage,
                COALESCE(ue.total_points_earned, 0) as total_points_earned
            FROM subjects s
            LEFT JOIN user_enrollments ue ON s.id = ue.subject_id AND ue.user_id = ?
            WHERE s.is_active = 1
        `;

        const queryParams: (string | number)[] = [userId];

        // Add difficulty filter if specified
        if (difficulty && difficulty !== 'all') {
            subjectsQuery += ' AND s.difficulty = ?';
            queryParams.push(difficulty);
        }

        subjectsQuery += ' ORDER BY s.title';

        const subjects = await query(subjectsQuery, queryParams) as Subject[];

        return NextResponse.json({
            success: true,
            subjects: subjects
        });

    } catch (error) {
        console.error('Error fetching subjects:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to fetch subjects' 
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, subjectId } = body;

        if (!userId || !subjectId) {
            return NextResponse.json({ 
                success: false, 
                error: 'User ID and Subject ID are required' 
            }, { status: 400 });
        }

        // Check if user is already enrolled
        const existingEnrollment = await query(
            'SELECT id FROM user_enrollments WHERE user_id = ? AND subject_id = ?',
            [userId, subjectId]
        ) as { id: number }[];

        if (existingEnrollment.length > 0) {
            return NextResponse.json({ 
                success: false, 
                error: 'User is already enrolled in this subject' 
            }, { status: 400 });
        }

        // Enroll user in the subject
        await query(
            'INSERT INTO user_enrollments (user_id, subject_id) VALUES (?, ?)',
            [userId, subjectId]
        );

        return NextResponse.json({
            success: true,
            message: 'Successfully enrolled in subject'
        });

    } catch (error) {
        console.error('Error enrolling in subject:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to enroll in subject' 
        }, { status: 500 });
    }
} 