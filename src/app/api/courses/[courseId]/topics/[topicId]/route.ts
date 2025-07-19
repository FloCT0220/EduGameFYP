import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import mysql from 'mysql2/promise';

interface TopicData extends mysql.RowDataPacket {
    id: number;
    title: string;
    content: string;
    structured_content: string;
    lesson_order: number;
    points: number;
    type: string;
}

interface ProgressData extends mysql.RowDataPacket {
    completed: boolean;
    completed_at: string;
    points_earned: number;
}

interface AttemptData extends mysql.RowDataPacket {
    id: number;
    total_points: number;
}

export async function GET(
    request: NextRequest,
    { params }: { params: { courseId: string; topicId: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const { courseId, topicId } = await params;

        if (!userId || !courseId || !topicId) {
            return NextResponse.json(
                { error: 'User ID, Course ID, and Topic ID are required' },
                { status: 400 }
            );
        }

        // Get topic content from topics table
        const topicQuery = `
            SELECT 
                t.id,
                t.title,
                t.content,
                t.structured_content,
                t.lesson_order,
                t.points_reward as points,
                'lesson' as type
            FROM topics t
            WHERE t.course_id = ? AND t.id = ?
        `;

        const topicResult = await query(topicQuery, [parseInt(courseId), parseInt(topicId)]);

        if (!topicResult || !Array.isArray(topicResult) || topicResult.length === 0) {
            return NextResponse.json(
                { error: 'Topic not found' },
                { status: 404 }
            );
        }

        const topicData = topicResult[0] as TopicData;

        // Check if user has completed this topic
        const progressQuery = `
            SELECT completed, completed_at, points_earned
            FROM user_progress
            WHERE user_id = ? AND course_id = ? AND topic_id = ? AND progress_type = "topic"
        `;

        const progressResult = await query(progressQuery, [parseInt(userId), parseInt(courseId), parseInt(topicId)]);
        const progressArray = Array.isArray(progressResult) ? progressResult : [];
        const isCompleted = progressArray.length > 0 && (progressArray[0] as ProgressData).completed;
        
        // Get last quiz attempt ID if completed
        let lastAttemptId = null;
        let pointsEarned = 0;
        
        if (isCompleted) {
            const lastAttemptQuery = `
                SELECT id, total_points
                FROM quiz_attempts
                WHERE user_id = ? AND course_id = ? AND topic_id = ?
                ORDER BY completed_at DESC
                LIMIT 1
            `;
            
            const lastAttemptResult = await query(lastAttemptQuery, [parseInt(userId), parseInt(courseId), parseInt(topicId)]);
            const lastAttemptArray = Array.isArray(lastAttemptResult) ? lastAttemptResult : [];
            if (lastAttemptArray.length > 0) {
                lastAttemptId = (lastAttemptArray[0] as AttemptData).id;
                pointsEarned = (lastAttemptArray[0] as AttemptData).total_points || (progressArray[0] as ProgressData)?.points_earned || 0;
            }
        }

        // Parse structured content
        let structuredContent: StructuredContent | undefined;
        
        if (topicData.structured_content) {
            try {
                structuredContent = typeof topicData.structured_content === 'string' 
                    ? JSON.parse(topicData.structured_content) 
                    : topicData.structured_content;
            } catch (error) {
                console.error('Error parsing structured content:', error);
            }
        }
        
        // Generate enhanced content using structured content
        const enhancedContent = generateEnhancedContent(topicData.title, topicData.content || '', structuredContent);

        const topic = {
            id: topicData.id,
            title: topicData.title,
            content: enhancedContent,
            lesson_order: topicData.lesson_order,
            points_reward: topicData.points,
            is_completed: isCompleted,
            type: topicData.type,
            last_attempt_id: lastAttemptId,
            points_earned: pointsEarned
        };

        return NextResponse.json({
            success: true,
            topic
        });

    } catch (error) {
        console.error('Error fetching topic content:', error);
        return NextResponse.json(
            { error: 'Failed to fetch topic content' },
            { status: 500 }
        );
    }
}

interface ContentSection {
    title: string;
    content: string;
}

interface StructuredContent {
    sections: ContentSection[];
}

function generateEnhancedContent(title: string, basicContent: string, structuredContent?: StructuredContent): string {
    // Use structured content if available, otherwise create default sections
    const sections = structuredContent?.sections || [
        {
            title: "Introduction",
            content: basicContent || `Welcome to ${title}! In this lesson, we'll explore the fundamental concepts and practical applications.`
        },
        {
            title: "Key Concepts", 
            content: `Let's dive into the core principles that make ${title} so important in modern development.`
        },
        {
            title: "Practical Examples",
            content: `Here are some real-world examples of how ${title} is used in professional development environments.`
        },
        {
            title: "Best Practices",
            content: `To master ${title}, follow these industry-standard best practices and guidelines.`
        },
        {
            title: "Summary",
            content: `You've now learned the essential concepts of ${title}. Take the quiz below to test your understanding and earn points!`
        }
    ];

    return sections.map(section => `
        <div style="margin-bottom: 2rem;">
            <h2 style="color: #1f2937; font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; border-bottom: 2px solid #3b82f6; padding-bottom: 0.5rem;">
                ${section.title}
            </h2>
            <div style="color: #4b5563; line-height: 1.6; font-size: 1.1rem;">
                <p>${section.content}</p>
            </div>
        </div>
    `).join('');
} 