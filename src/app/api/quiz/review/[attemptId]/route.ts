import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: { attemptId: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const courseId = searchParams.get('courseId');
        const topicId = searchParams.get('topicId');
        const { attemptId } = await params;

        if (!userId || !courseId || !topicId || !attemptId) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        // Get quiz attempt details
        const attemptQuery = `
            SELECT 
                qa.id,
                qa.user_id,
                qa.subject_id,
                qa.node_id,
                qa.questions_total,
                qa.questions_correct,
                qa.score_percentage,
                qa.points_earned,
                qa.time_bonus,
                qa.streak_bonus,
                qa.total_points,
                qa.time_taken,
                qa.completed_at
            FROM quiz_attempts qa
            WHERE qa.id = ? AND qa.user_id = ? AND qa.subject_id = ? AND qa.node_id = ?
        `;

        const attemptResult = await query(attemptQuery, [
            parseInt(attemptId),
            parseInt(userId),
            parseInt(courseId),
            topicId
        ]);

        if (!attemptResult || attemptResult.length === 0) {
            return NextResponse.json(
                { error: 'Quiz attempt not found' },
                { status: 404 }
            );
        }

        const attempt = attemptResult[0];

        // Get user's answers for this attempt
        const answersQuery = `
            SELECT 
                qa.id,
                qa.attempt_id,
                qa.question_id,
                qa.selected_answer,
                qa.is_correct,
                qa.points_earned,
                qa.time_taken
            FROM quiz_answers qa
            WHERE qa.attempt_id = ?
            ORDER BY qa.id
        `;

        const answers = await query(answersQuery, [parseInt(attemptId)]);

        // Get all questions for this quiz
        const questionsQuery = `
            SELECT 
                qq.id,
                qq.question_id,
                qq.subject_id,
                qq.node_id,
                qq.question,
                qq.option_a,
                qq.option_b,
                qq.option_c,
                qq.option_d,
                qq.correct_answer,
                qq.points,
                qq.difficulty
            FROM quiz_questions qq
            WHERE qq.subject_id = ? AND qq.node_id = ? AND qq.is_active = true
            ORDER BY qq.id
        `;

        const questions = await query(questionsQuery, [parseInt(courseId), topicId]);

        // Get topic information
        const topicQuery = `
            SELECT id, title
            FROM topics
            WHERE id = ? AND course_id = ?
        `;

        const topicResult = await query(topicQuery, [parseInt(topicId), parseInt(courseId)]);

        if (!topicResult || topicResult.length === 0) {
            return NextResponse.json(
                { error: 'Topic not found' },
                { status: 404 }
            );
        }

        const topic = topicResult[0];

        // Organize questions in the same order as they were answered
        const orderedQuestions = [];
        if (answers && answers.length > 0) {
            for (const answer of answers) {
                const question = questions.find(q => q.question_id === answer.question_id);
                if (question) {
                    orderedQuestions.push(question);
                }
            }
        }

        // If we have fewer ordered questions than total questions, add the remaining ones
        if (orderedQuestions.length < questions.length) {
            for (const question of questions) {
                if (!orderedQuestions.find(oq => oq.question_id === question.question_id)) {
                    orderedQuestions.push(question);
                }
            }
        }

        return NextResponse.json({
            success: true,
            reviewData: {
                attempt,
                answers: answers || [],
                questions: orderedQuestions,
                topic
            }
        });

    } catch (error) {
        console.error('Error fetching quiz review data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quiz review data' },
            { status: 500 }
        );
    }
} 