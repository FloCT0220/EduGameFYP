import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import mysql from 'mysql2/promise';
import { verifyToken } from '@/lib/auth';
import { CourseService } from '@/lib/services/courseService';
import { UserService } from '@/lib/services/userService';
import { AchievementService } from '@/lib/services/achievementService';

interface QuizAnswerInput {
  questionId: string;
  selectedAnswer: number;
  timeTaken?: number;
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon_url: string;
  points_required: number;
  category: string;
  is_active: boolean;
  created_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      courseId, 
      topicId, 
      answers, 
      questionIds // <-- add this
    }: {
      userId?: number;
      courseId?: number;
      topicId?: string;
      answers: QuizAnswerInput[];
      questionIds?: string[];
    } = body;

    // Get user from Authorization header if not provided
    let finalUserId = userId;
    if (!finalUserId) {
      const authHeader = request.headers.get('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
      }

      const token = authHeader.split(' ')[1];
      const tokenPayload = verifyToken(token);
      if (!tokenPayload) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
      }
      
      finalUserId = tokenPayload.id;
    }

    if (!finalUserId || !courseId || !topicId || !answers || !Array.isArray(answers) || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        received: { userId: finalUserId, courseId, topicId, answers, questionIds }
      }, { status: 400 });
    }

    // Fetch only those questions, in the order provided
    const questions = await query(
      `SELECT * FROM quiz_questions WHERE id IN (${questionIds.map(() => '?').join(',')})`,
      questionIds
    );
    const questionArray = questions as mysql.RowDataPacket[];

    // Calculate results
    let correctAnswers = 0;
    let totalPoints = 0;
    const results = [];

    for (const qid of questionIds) {
      const question = questionArray.find(q => String(q.id) === String(qid));
      const userAnswer = answers.find(a => String(a.questionId) === String(qid));
      const isCorrect = question && userAnswer?.selectedAnswer === question.correct_answer;
      const pointsEarned = isCorrect && question ? question.points : 0;

      if (isCorrect) correctAnswers++;
      totalPoints += pointsEarned;

      const resultItem = {
        question_id: qid,
        selected_answer: userAnswer?.selectedAnswer ?? null,
        is_correct: isCorrect,
        points_earned: pointsEarned
      };
      
      results.push(resultItem);
    }

    const scorePercentage = (correctAnswers / questionIds.length) * 100;
    const passed = scorePercentage >= 80; // 80% pass threshold

    // Create quiz attempt
    const attemptResult = await query(
      `INSERT INTO quiz_attempts 
       (user_id, course_id, topic_id, questions_total, questions_correct, score_percentage, total_points, answers, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [finalUserId, courseId, parseInt(topicId), questionIds.length, correctAnswers, scorePercentage, totalPoints, JSON.stringify(results)]
      );

    let newlyEarnedAchievements: Achievement[] = [];

    // Update user points and experience if passed
    if (passed) {
      await query(
        'UPDATE users SET total_points = total_points + ? WHERE id = ?',
        [totalPoints, finalUserId]
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
            pointsEarned: totalPoints
          }
        );

        // Update overall course progress
        await UserService.updateCourseProgress(finalUserId, courseId);
      }

      // Check and award achievements
      newlyEarnedAchievements = await AchievementService.checkAndAwardAchievements(finalUserId);
    }

    return NextResponse.json({
      success: true,
      results: {
        attemptId: (attemptResult as mysql.ResultSetHeader).insertId,
        score: correctAnswers,
        totalQuestions: questionIds.length,
        totalPoints: totalPoints,
        passed
      },
      achievements: {
        newlyEarned: newlyEarnedAchievements
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
    // Check if user already has completed progress for today
    const existingStreak = await query(
      'SELECT id FROM user_progress WHERE user_id = ? AND DATE(completed_at) = ? AND completed = true',
      [userId, today]
    );

    // Only update streak if no completed progress exists for today
    if ((existingStreak as mysql.RowDataPacket[]).length === 0) {
      // Get yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Check if user had completed progress yesterday
      const yesterdayStreak = await query(
        'SELECT id FROM user_progress WHERE user_id = ? AND DATE(completed_at) = ? AND completed = true',
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