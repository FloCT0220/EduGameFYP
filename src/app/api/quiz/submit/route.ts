import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { QuizService } from '@/lib/services/quizService';

interface QuizAnswer {
    questionId: string;
    selectedAnswer: number;
}

interface QuizSubmission {
    courseId: number;
    topicId: string;
    answers: QuizAnswer[];
    timeSpent: number;
}

export async function POST(request: NextRequest) {
    try {
        // Extract and verify user from authentication token
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        const user = verifyToken(token || '');
        
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' }, 
                { status: 401 }
            );
        }
        
        const userId = user.id;
        const body: QuizSubmission = await request.json();
        const { courseId, topicId, answers, timeSpent } = body;

        if (!courseId || !topicId || !answers || !Array.isArray(answers)) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get cumulative quiz questions (current + all previous topics)
        const questions = await QuizService.getCumulativeQuizQuestions(courseId, parseInt(topicId));

        if (!questions || questions.length === 0) {
            return NextResponse.json(
                { error: 'No quiz questions found' },
                { status: 404 }
            );
        }

        // Calculate score
        let correctAnswers = 0;
        let totalPoints = 0;
        let earnedPoints = 0;
        const questionResults: any[] = [];

        for (const question of questions) {
            const userAnswer = answers.find(a => a.questionId === question.question_id);
            const isCorrect = userAnswer && userAnswer.selectedAnswer === question.correct_answer;
            
            if (isCorrect) {
                correctAnswers++;
                earnedPoints += question.points;
            }
            
            totalPoints += question.points;

            questionResults.push({
                question_id: question.question_id,
                selected_answer: userAnswer?.selectedAnswer || null,
                is_correct: isCorrect,
                points_earned: isCorrect ? question.points : 0,
                time_taken: 0 // Could be enhanced to track per-question time
            });
        }

        const scorePercentage = Math.round((correctAnswers / questions.length) * 100);
        const passed = scorePercentage >= 80; // 80% pass rate

        // Calculate bonus points
        const timeBonus = calculateTimeBonus(timeSpent, questions.length);
        const streakBonus = 0; // Could be enhanced to track learning streaks
        const totalPointsEarned = passed ? earnedPoints + timeBonus + streakBonus : 0;

        // Create quiz attempt record
        const attemptQuery = `
            INSERT INTO quiz_attempts (
                user_id, subject_id, node_id, questions_total, questions_correct,
                score_percentage, points_earned, time_bonus, streak_bonus, total_points,
                time_taken, completed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const attemptResult = await query(attemptQuery, [
            userId, courseId, topicId, questions.length, correctAnswers,
            scorePercentage, earnedPoints, timeBonus, streakBonus, totalPointsEarned,
            timeSpent * 60 // Convert to seconds
        ]);

        const attemptId = attemptResult.insertId;

        // Insert individual question answers
        for (const result of questionResults) {
            const answerQuery = `
                INSERT INTO quiz_answers (
                    attempt_id, question_id, selected_answer, is_correct, points_earned, time_taken
                ) VALUES (?, ?, ?, ?, ?, ?)
            `;

            await query(answerQuery, [
                attemptId, result.question_id, result.selected_answer,
                result.is_correct, result.points_earned, result.time_taken
            ]);
        }

        // If passed, update user progress and unlock next topic
        if (passed) {
            await updateUserProgress(userId, courseId, topicId, totalPointsEarned, timeSpent);
            await unlockNextTopic(userId, courseId, parseInt(topicId));
        }

        return NextResponse.json({
            success: true,
            results: {
                score: correctAnswers,
                totalQuestions: questions.length,
                scorePercentage: scorePercentage,
                pointsEarned: totalPointsEarned,
                passed: passed,
                timeBonus: timeBonus,
                streakBonus: streakBonus,
                attemptId: attemptId
            }
        });

    } catch (error) {
        console.error('Error submitting quiz:', error);
        return NextResponse.json(
            { error: 'Failed to submit quiz' },
            { status: 500 }
        );
    }
}

async function updateUserProgress(userId: number, courseId: number, topicId: string, pointsEarned: number, timeSpent: number) {
    try {
        // Update or insert user topic progress
        const progressQuery = `
            INSERT INTO user_topic_progress (
                user_id, course_id, topic_id, completed, completed_at, points_earned, attempts, time_spent
            ) VALUES (?, ?, ?, true, NOW(), ?, 1, ?)
            ON DUPLICATE KEY UPDATE
                completed = true,
                completed_at = NOW(),
                points_earned = GREATEST(points_earned, VALUES(points_earned)),
                attempts = attempts + 1,
                time_spent = time_spent + VALUES(time_spent)
        `;

        await query(progressQuery, [userId, courseId, parseInt(topicId), pointsEarned, timeSpent]);

        // Update user's total points
        const userPointsQuery = `
            UPDATE users 
            SET total_points = total_points + ?, 
                updated_at = NOW() 
            WHERE id = ?
        `;

        await query(userPointsQuery, [pointsEarned, userId]);

        // Update enrollment progress
        await updateEnrollmentProgress(userId, courseId);

        // Update learning streak
        await updateLearningStreak(userId, pointsEarned);

    } catch (error) {
        console.error('Error updating user progress:', error);
        throw error;
    }
}

async function updateEnrollmentProgress(userId: number, courseId: number) {
    try {
        // Calculate progress percentage
        const progressQuery = `
            SELECT 
                COUNT(*) as total_topics,
                SUM(CASE WHEN utp.completed = true THEN 1 ELSE 0 END) as completed_topics,
                SUM(CASE WHEN utp.completed = true THEN utp.points_earned ELSE 0 END) as total_points
            FROM topics t
            LEFT JOIN user_topic_progress utp ON t.id = utp.topic_id 
                AND utp.user_id = ? AND utp.course_id = ?
            WHERE t.course_id = ?
        `;

        const progressResult = await query(progressQuery, [userId, courseId, courseId]);
        
        if (progressResult && progressResult.length > 0) {
            const { total_topics, completed_topics, total_points } = progressResult[0];
            const progressPercentage = total_topics > 0 ? (completed_topics / total_topics) * 100 : 0;
            const isCompleted = progressPercentage >= 100;

            const updateQuery = `
                UPDATE user_enrollments 
                SET 
                    progress_percentage = ?,
                    total_points_earned = ?,
                    completed_at = ${isCompleted ? 'NOW()' : 'NULL'},
                    updated_at = NOW()
                WHERE user_id = ? AND course_id = ?
            `;

            await query(updateQuery, [progressPercentage, total_points || 0, userId, courseId]);
        }
    } catch (error) {
        console.error('Error updating enrollment progress:', error);
    }
}

async function updateLearningStreak(userId: number, pointsEarned: number) {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Check if this is the first activity of the day
        const existingStreakQuery = `
            SELECT activities_completed 
            FROM learning_streaks 
            WHERE user_id = ? AND streak_date = ?
        `;
        
        const existingStreak = await query(existingStreakQuery, [userId, today]);
        const isFirstActivityToday = !existingStreak || !Array.isArray(existingStreak) || existingStreak.length === 0;
        
        // Update or insert today's streak record
        const streakQuery = `
            INSERT INTO learning_streaks (user_id, streak_date, activities_completed, points_earned)
            VALUES (?, ?, 1, ?)
            ON DUPLICATE KEY UPDATE
                activities_completed = activities_completed + 1,
                points_earned = points_earned + VALUES(points_earned)
        `;

        await query(streakQuery, [userId, today, pointsEarned]);

        // Only update user's current streak if this is the first activity of the day
        if (isFirstActivityToday) {
            const streakUpdateQuery = `
                UPDATE users 
                SET current_streak = current_streak + 1,
                    max_streak = GREATEST(max_streak, current_streak + 1)
                WHERE id = ?
            `;

            await query(streakUpdateQuery, [userId]);
        }

    } catch (error) {
        console.error('Error updating learning streak:', error);
    }
}

async function unlockNextTopic(userId: number, courseId: number, currentTopicId: number) {
    try {
        // Find the next topic in sequence
        const nextTopicQuery = `
            SELECT id, lesson_order
            FROM topics
            WHERE course_id = ? AND lesson_order > (
                SELECT lesson_order FROM topics WHERE id = ? AND course_id = ?
            )
            ORDER BY lesson_order ASC
            LIMIT 1
        `;

        const nextTopicResult = await query(nextTopicQuery, [courseId, currentTopicId, courseId]);

        if (nextTopicResult && nextTopicResult.length > 0) {
            const nextTopic = nextTopicResult[0];
            
            // Check if the next topic is already unlocked/completed
            const progressCheckQuery = `
                SELECT completed FROM user_topic_progress
                WHERE user_id = ? AND course_id = ? AND topic_id = ?
            `;

            const progressResult = await query(progressCheckQuery, [userId, courseId, nextTopic.id]);

            // If no progress record exists, create one (which unlocks the topic)
            if (!progressResult || progressResult.length === 0) {
                await query(`
                    INSERT INTO user_topic_progress (user_id, course_id, topic_id, completed, points_earned, attempts, time_spent)
                    VALUES (?, ?, ?, false, 0, 0, 0)
                    ON DUPLICATE KEY UPDATE
                        user_id = user_id  -- No-op to prevent duplicate key error
                `, [userId, courseId, nextTopic.id]);

                console.log(`✅ Unlocked next topic ${nextTopic.id} for user ${userId}`);
            }
        }
    } catch (error) {
        console.error('Error unlocking next topic:', error);
    }
}

function calculateTimeBonus(timeSpentMinutes: number, questionCount: number): number {
    // Time bonus calculation: reward faster completion
    const averageTimePerQuestion = 2; // 2 minutes per question is ideal
    const idealTime = questionCount * averageTimePerQuestion;
    
    if (timeSpentMinutes <= idealTime) {
        // Bonus for completing within ideal time
        const bonusPercentage = Math.max(0, (idealTime - timeSpentMinutes) / idealTime);
        return Math.round(questionCount * 5 * bonusPercentage); // Up to 5 bonus points per question
    }
    
    return 0;
} 