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

interface SkillTree {
    id: number;
    title: string;
    description: string;
    icon: string;
    order_index: number;
    total_nodes: number;
    completed_nodes: number;
    progress_percentage: number;
}

interface SubjectWithSkillTrees extends Subject {
    skill_trees: SkillTree[];
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

        // For each subject, fetch its skill trees with progress
        const subjectsWithSkillTrees = await Promise.all(
            subjects.map(async (subject: Subject): Promise<SubjectWithSkillTrees> => {
                const skillTreesQuery = `
                    SELECT 
                        st.id,
                        st.title,
                        st.description,
                        st.icon,
                        st.order_index,
                        COUNT(sn.id) as total_nodes,
                        COALESCE(completed_nodes.completed_count, 0) as completed_nodes,
                        CASE 
                            WHEN COUNT(sn.id) > 0 
                            THEN ROUND((COALESCE(completed_nodes.completed_count, 0) / COUNT(sn.id)) * 100, 1)
                            ELSE 0 
                        END as progress_percentage
                    FROM skill_trees st
                    LEFT JOIN skill_nodes sn ON st.id = sn.skill_tree_id AND sn.is_active = 1
                    LEFT JOIN (
                        SELECT 
                            sn.skill_tree_id,
                            COUNT(*) as completed_count
                        FROM skill_nodes sn
                        INNER JOIN user_node_progress unp ON sn.id = unp.node_id
                        WHERE unp.user_id = ? AND unp.completed = 1
                        GROUP BY sn.skill_tree_id
                    ) completed_nodes ON st.id = completed_nodes.skill_tree_id
                    WHERE st.subject_id = ? AND st.is_active = 1
                    GROUP BY st.id
                    ORDER BY st.order_index
                `;

                const skillTrees = await query(skillTreesQuery, [userId, subject.id]) as SkillTree[];

                return {
                    ...subject,
                    skill_trees: skillTrees
                };
            })
        );

        return NextResponse.json({
            success: true,
            subjects: subjectsWithSkillTrees
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