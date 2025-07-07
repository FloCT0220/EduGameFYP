import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

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
                t.lesson_order,
                t.points_reward as points,
                t.duration_minutes as estimated_time,
                'lesson' as type
            FROM topics t
            WHERE t.course_id = ? AND t.id = ?
        `;

        const topicResult = await query(topicQuery, [parseInt(courseId), parseInt(topicId)]);

        if (!topicResult || topicResult.length === 0) {
            return NextResponse.json(
                { error: 'Topic not found' },
                { status: 404 }
            );
        }

        const topicData = topicResult[0];

        // Check if user has completed this topic
        const progressQuery = `
            SELECT completed, completed_at, points_earned
            FROM user_topic_progress
            WHERE user_id = ? AND course_id = ? AND topic_id = ?
        `;

        const progressResult = await query(progressQuery, [parseInt(userId), parseInt(courseId), parseInt(topicId)]);
        const isCompleted = progressResult.length > 0 && progressResult[0].completed;
        
        // Get last quiz attempt ID if completed
        let lastAttemptId = null;
        let pointsEarned = 0;
        
        if (isCompleted) {
            const lastAttemptQuery = `
                SELECT id, total_points
                FROM quiz_attempts
                WHERE user_id = ? AND subject_id = ? AND node_id = ?
                ORDER BY completed_at DESC
                LIMIT 1
            `;
            
            const lastAttemptResult = await query(lastAttemptQuery, [parseInt(userId), parseInt(courseId), topicId]);
            if (lastAttemptResult && lastAttemptResult.length > 0) {
                lastAttemptId = lastAttemptResult[0].id;
                pointsEarned = lastAttemptResult[0].total_points || progressResult[0].points_earned || 0;
            }
        }

        // Get duration in minutes
        const durationMinutes = topicData.estimated_time || 30;

        // Create enhanced content if it's basic
        let enhancedContent = topicData.content;
        if (!enhancedContent || enhancedContent.length < 200) {
            enhancedContent = generateEnhancedContent(topicData.title, topicData.content);
        }

        const topic = {
            id: topicData.id,
            title: topicData.title,
            content: enhancedContent,
            lesson_order: topicData.lesson_order,
            points_reward: topicData.points,
            duration_minutes: durationMinutes,
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

function generateEnhancedContent(title: string, basicContent: string): string {
    // This is a simple content enhancement - in a real app, you'd have rich content stored
    const sections = [
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
                ${section.title === "Key Concepts" ? `
                    <ul style="margin-top: 1rem; padding-left: 1.5rem;">
                        <li style="margin-bottom: 0.5rem;">Understanding the fundamentals</li>
                        <li style="margin-bottom: 0.5rem;">Practical implementation strategies</li>
                        <li style="margin-bottom: 0.5rem;">Common patterns and approaches</li>
                    </ul>
                ` : ''}
                ${section.title === "Practical Examples" ? `
                    <div style="background-color: #f3f4f6; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem; border-left: 4px solid #3b82f6;">
                        <code style="font-family: 'Courier New', monospace; color: #1f2937;">
                            // Example implementation<br/>
                            const example = "${title.toLowerCase().replace(/\s+/g, '')}";<br/>
                            console.log("Learning:", example);
                        </code>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
} 