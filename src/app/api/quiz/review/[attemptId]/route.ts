import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import mysql from 'mysql2/promise';

interface QuizReviewQuestion {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: number;
  points: number;
  difficulty: string;
  subject_id: number;
  node_id: string;
}

interface QuizReviewAnswer {
  question_id: number;
  selected_answer: number | null;
  is_correct: boolean;
  points_earned: number;
  time_taken: number | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const attemptId = parseInt(params.attemptId);
    
    if (isNaN(attemptId)) {
      return NextResponse.json({ error: 'Invalid attempt ID' }, { status: 400 });
    }

    // Get attempt details
    const attemptResult = await query(
      `SELECT 
        id, user_id, subject_id, node_id, questions_total, questions_correct,
        score_percentage, points_earned, time_taken, completed_at
      FROM quiz_attempts 
      WHERE id = ?`,
      [attemptId]
    );

    if (!attemptResult || (attemptResult as mysql.RowDataPacket[]).length === 0) {
      return NextResponse.json({ error: 'Quiz attempt not found' }, { status: 404 });
    }

    const attempt = (attemptResult as mysql.RowDataPacket[])[0];

    // Get answers with question details
    const reviewData = await query(
      `SELECT 
        qa.question_id,
        qa.selected_answer,
        qa.is_correct,
        qa.points_earned,
        qa.time_taken,
        qq.id,
        qq.question,
        qq.option_a,
        qq.option_b,
        qq.option_c,
        qq.option_d,
        qq.correct_answer,
        qq.points,
        qq.difficulty,
        qq.subject_id,
        qq.node_id
      FROM quiz_answers qa
      JOIN quiz_questions qq ON qa.question_id = qq.id
      WHERE qa.attempt_id = ?
      ORDER BY qq.id`,
      [attemptId]
    );

    const reviewArray = reviewData as mysql.RowDataPacket[];

    // Format the response
    const questions: QuizReviewQuestion[] = [];
    const answers: QuizReviewAnswer[] = [];

    for (const row of reviewArray) {
      // Build question object
      const question: QuizReviewQuestion = {
        id: row.id,
        question: row.question,
        option_a: row.option_a,
        option_b: row.option_b,
        option_c: row.option_c,
        option_d: row.option_d,
        correct_answer: row.correct_answer,
        points: row.points,
        difficulty: row.difficulty,
        subject_id: row.subject_id,
        node_id: row.node_id
      };

      // Build answer object
      const answer: QuizReviewAnswer = {
        question_id: row.question_id,
        selected_answer: row.selected_answer,
        is_correct: row.is_correct,
        points_earned: row.points_earned,
        time_taken: row.time_taken
      };

      questions.push(question);
      answers.push(answer);
    }

    // Create ordered results matching questions with answers
    const results = questions.map((question) => {
      const answer = answers.find(a => a.question_id === question.id);
      return {
        question,
        userAnswer: answer?.selected_answer ?? null,
        isCorrect: answer?.is_correct ?? false,
        pointsEarned: answer?.points_earned ?? 0,
        timeTaken: answer?.time_taken ?? null,
        correctAnswer: question.correct_answer,
        options: [
          question.option_a,
          question.option_b,
          question.option_c,
          question.option_d
        ]
      };
    });

    // Ensure all questions are represented
    const orderedResults = [];
    for (const question of questions) {
      const existingResult = results.find(r => r.question.id === question.id);
      if (existingResult) {
        orderedResults.push(existingResult);
      } else {
        // If no answer found, create a default result
        orderedResults.push({
          question,
          userAnswer: null,
          isCorrect: false,
          pointsEarned: 0,
          timeTaken: null,
          correctAnswer: question.correct_answer,
          options: [
            question.option_a,
            question.option_b,
            question.option_c,
            question.option_d
          ]
        });
      }
    }

    return NextResponse.json({
      attempt,
      results: orderedResults,
      summary: {
        totalQuestions: attempt.questions_total,
        correctAnswers: attempt.questions_correct,
        scorePercentage: attempt.score_percentage,
        pointsEarned: attempt.points_earned,
        timeTaken: attempt.time_taken
      }
    });

  } catch (error) {
    console.error('Error fetching quiz review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 