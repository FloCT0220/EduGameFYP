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
  node_id: number;
}

interface QuizReviewAnswer {
  question_id: number;
  selected_answer: number | null;
  is_correct: boolean;
  points_earned: number;
}

interface QuizReviewQuestionWithOptions extends QuizReviewQuestion {
  options: string[];
}

export async function GET(
  request: NextRequest,
  context: { params: { attemptId: string } } | Promise<{ params: { attemptId: string } }>
) {
  try {
    // Await params if context is a Promise (for Next.js dynamic API routes)
    const { params } = await context;
    const attemptId = parseInt(params.attemptId);
    
    if (isNaN(attemptId)) {
      return NextResponse.json({ error: 'Invalid attempt ID' }, { status: 400 });
    }

    // Get attempt details
    const attemptResult = await query(
      `SELECT 
        id, user_id, subject_id, node_id, questions_total, questions_correct,
        score_percentage, total_points
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
        qq.id,
        qq.question,
        qq.answers,
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
    const questions: QuizReviewQuestionWithOptions[] = [];
    const answers: QuizReviewAnswer[] = [];

    for (const row of reviewArray) {
      // Parse options from answers JSON
      let options: string[] = [];
      try {
        options = JSON.parse(row.answers);
      } catch {
        options = [];
      }
      // Build question object
      const question: QuizReviewQuestionWithOptions = {
        id: row.id,
        question: row.question,
        option_a: options[0] || '',
        option_b: options[1] || '',
        option_c: options[2] || '',
        option_d: options[3] || '',
        correct_answer: row.correct_answer,
        points: row.points,
        difficulty: row.difficulty,
        subject_id: row.subject_id,
        node_id: row.node_id,
        options
      };

      // Build answer object
      const answer: QuizReviewAnswer = {
        question_id: row.question_id,
        selected_answer: row.selected_answer,
        is_correct: row.is_correct,
        points_earned: row.points_earned
      };

      // Attach options array to question for easier use later
      // (question as any).options = options; // This line is removed as per the new_code

      questions.push(question);
      answers.push(answer);
    }

    // Create ordered results matching questions with answers
    const results = questions.map((question) => {
      const answer = answers.find(a => a.question_id === question.id);
      const options = question.options;
      return {
        question,
        userAnswer: answer?.selected_answer ?? null,
        isCorrect: answer?.is_correct ?? false,
        pointsEarned: answer?.points_earned ?? 0,
        correctAnswer: question.correct_answer,
        options
      };
    });

    // Ensure all questions are represented
    const orderedResults = [];
    for (const question of questions) {
      const existingResult = results.find(r => r.question.id === question.id);
      if (existingResult) {
        orderedResults.push(existingResult);
      } else {
        const options = question.options;
        orderedResults.push({
          question,
          userAnswer: null,
          isCorrect: false,
          pointsEarned: 0,
          correctAnswer: question.correct_answer,
          options
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
        totalPoints: attempt.total_points
      }
    });

  } catch (error) {
    console.error('Error fetching quiz review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 