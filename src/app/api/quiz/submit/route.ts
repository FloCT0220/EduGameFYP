import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import mysql from 'mysql2/promise';
import { getSession } from '@/lib/session';
import { CourseService } from '@/lib/services/courseService';
import { UserService } from '@/lib/services/userService';

interface QuizAnswerInput {
  questionId: string;
  selectedAnswer: number;
  timeTaken?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      subjectId, 
      nodeId, 
      courseId,
      topicId,
      answers, 
      timeSpent 
    }: {
      userId?: number;
      subjectId?: number;
      nodeId?: number;
      courseId?: number;
      topicId?: string;
      answers: QuizAnswerInput[];
      timeSpent?: number;
    } = body;

    // Get user from session if not provided
    const finalUserId = userId;
    if (!finalUserId) {
      const token = getSession('authToken');
      if (!token) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
      }
      // TODO: Get user ID from token
      // For now, return error if no userId provided
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Use either subject_id/node_id or courseId/topicId
    const finalSubjectId = subjectId || courseId;
    const finalNodeId = nodeId || (topicId ? parseInt(topicId) : undefined);

    if (!finalUserId || !finalSubjectId || !finalNodeId || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        received: { userId: finalUserId, subjectId: finalSubjectId, nodeId: finalNodeId, answers }
      }, { status: 400 });
    }

    // Get all questions for this quiz
    const questions = await query(
      'SELECT * FROM quiz_questions WHERE subject_id = ? AND node_id = ? AND is_active = true',
      [finalSubjectId, finalNodeId]
    );

    const questionArray = questions as mysql.RowDataPacket[];

    if (!questionArray.length) {
      return NextResponse.json({ error: 'No questions found for this quiz' }, { status: 404 });
    }

    // Calculate results
    let correctAnswers = 0;
    let totalPoints = 0;
    const results = [];

    for (const question of questionArray) {
      const userAnswer = answers.find(a => a.questionId === question.id);
      const isCorrect = userAnswer?.selectedAnswer === question.correct_answer;
      const pointsEarned = isCorrect ? question.points : 0;

      if (isCorrect) correctAnswers++;
      totalPoints += pointsEarned;

      const resultItem = {
        question_id: question.id,
        selected_answer: userAnswer?.selectedAnswer,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        time_taken: timeSpent || 0
      };
      
      results.push(resultItem);
    }

    const scorePercentage = (correctAnswers / questionArray.length) * 100;
    const passed = scorePercentage >= 80; // 80% pass threshold

    // Create quiz attempt
    const attemptResult = await query(
      `INSERT INTO quiz_attempts 
       (user_id, subject_id, node_id, questions_total, questions_correct, score_percentage, points_earned, total_points, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [finalUserId, finalSubjectId, finalNodeId, questionArray.length, correctAnswers, scorePercentage, totalPoints, timeSpent || 0]
    );

    const attemptId = (attemptResult as mysql.ResultSetHeader).insertId;

    // Insert quiz answers
    for (const result of results) {
      await query(
        `INSERT INTO quiz_answers 
         (attempt_id, question_id, selected_answer, is_correct, points_earned, time_taken)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          attemptId, result.question_id, result.selected_answer,
          result.is_correct, result.points_earned, result.time_taken
        ]
      );
    }

    // Update user points and experience if passed
    if (passed) {
      await query(
        'UPDATE users SET total_points = total_points + ?, experience_points = experience_points + ? WHERE id = ?',
        [totalPoints, totalPoints, finalUserId]
      );

      // Update learning streak
      await updateLearningStreak(finalUserId);

      // Mark topic as completed if it's a topic-based quiz
      if (topicId && courseId) {
        await CourseService.markTopicComplete(finalUserId, parseInt(topicId));
        
        // Also update the user progress for consistency
        await UserService.updateTopicProgress(
          finalUserId, 
          courseId, 
          parseInt(topicId), 
          {
            completed: true,
            pointsEarned: totalPoints,
            timeSpent: Math.floor((timeSpent || 0) / 60) // Convert seconds to minutes
          }
        );

        // Update overall course progress
        await UserService.updateCourseProgress(finalUserId, courseId);
      }
    }

    return NextResponse.json({
      success: true,
      results: {
        attemptId,
        score: correctAnswers,
        totalQuestions: questionArray.length,
        pointsEarned: totalPoints,
        passed
      }
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function updateLearningStreak(userId: number) {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Check if user already has a streak record for today
    const existingStreak = await query(
      'SELECT id FROM learning_streaks WHERE user_id = ? AND streak_date = ?',
      [userId, today]
    );

    // Only update streak if no record exists for today
    if ((existingStreak as mysql.RowDataPacket[]).length === 0) {
      // Insert today's streak record
      await query(
        'INSERT INTO learning_streaks (user_id, streak_date, activities_completed, points_earned) VALUES (?, ?, 1, 0)',
        [userId, today]
      );

      // Get yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Check if user had activity yesterday
      const yesterdayStreak = await query(
        'SELECT id FROM learning_streaks WHERE user_id = ? AND streak_date = ?',
        [userId, yesterdayStr]
      );

      if ((yesterdayStreak as mysql.RowDataPacket[]).length > 0) {
        // Continue streak
        await query(
          'UPDATE users SET current_streak = current_streak + 1, max_streak = GREATEST(max_streak, current_streak + 1) WHERE id = ?',
          [userId]
        );
      } else {
        // Reset streak to 1
        await query(
          'UPDATE users SET current_streak = 1, max_streak = GREATEST(max_streak, 1) WHERE id = ?',
          [userId]
        );
      }
    }
  } catch (error) {
    console.error('Error updating learning streak:', error);
  }
} 