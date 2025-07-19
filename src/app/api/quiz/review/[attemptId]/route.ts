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
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    // Await params (required for Next.js 15+)
    const { attemptId: attemptIdStr } = await params;
    const attemptId = parseInt(attemptIdStr);
    
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

    // Get attempt with answers JSON
    const attemptWithAnswers = await query(
      `SELECT 
        id, user_id, subject_id, node_id, questions_total, questions_correct,
        score_percentage, total_points, answers
      FROM quiz_attempts 
      WHERE id = ?`,
      [attemptId]
    );

    if (!attemptWithAnswers || (attemptWithAnswers as mysql.RowDataPacket[]).length === 0) {
      return NextResponse.json({ error: 'Quiz attempt not found' }, { status: 404 });
    }

    const attemptWithAnswersData = (attemptWithAnswers as mysql.RowDataPacket[])[0];
    
    // Parse answers from JSON
    let answersData: { question_id: number; selected_answer: number; is_correct: boolean; points_earned: number }[] = [];
    if (attemptWithAnswersData.answers) {
      try {
        answersData = typeof attemptWithAnswersData.answers === 'string' 
          ? JSON.parse(attemptWithAnswersData.answers) 
          : attemptWithAnswersData.answers;
      } catch (error) {
        console.error('Error parsing answers JSON:', error);
        answersData = [];
      }
    }

    // Get the question IDs that were actually in this attempt
    const questionIds = answersData.map(answer => answer.question_id);
    
    if (questionIds.length === 0) {
      return NextResponse.json({ error: 'No questions found for this attempt' }, { status: 404 });
    }

    // Get questions for this attempt based on actual question IDs
    const questionsResult = await query(
      `SELECT 
        id,
        question,
        answers,
        correct_answer,
        points,
        difficulty,
        subject_id,
        node_id
      FROM quiz_questions 
      WHERE id IN (${questionIds.map(() => '?').join(',')})
      ORDER BY FIELD(id, ${questionIds.map(() => '?').join(',')})`,
      [...questionIds, ...questionIds] // First array for IN clause, second for FIELD clause
    );

    const questionsData = questionsResult as mysql.RowDataPacket[];

    // Format the response
    const questions: QuizReviewQuestionWithOptions[] = [];
    const answers: QuizReviewAnswer[] = [];

    // Process questions and answers
    for (const questionRow of questionsData) {
      // Parse options from answers JSON
      let options: string[] = [];
      try {
        // Handle both string and object formats from database
        if (typeof questionRow.answers === 'string') {
          options = JSON.parse(questionRow.answers);
        } else if (Array.isArray(questionRow.answers)) {
          options = questionRow.answers;
        } else {
          console.error('Unexpected answers format:', questionRow.answers);
          options = [];
        }
      } catch (error) {
        console.error('Error parsing answers JSON:', error, 'Raw data:', questionRow.answers);
        options = [];
      }

      // Build question object
      const question: QuizReviewQuestionWithOptions = {
        id: questionRow.id,
        question: questionRow.question,
        option_a: options[0] || '',
        option_b: options[1] || '',
        option_c: options[2] || '',
        option_d: options[3] || '',
        correct_answer: questionRow.correct_answer,
        points: questionRow.points,
        difficulty: questionRow.difficulty,
        subject_id: questionRow.subject_id,
        node_id: questionRow.node_id,
        options
      };

      // Find corresponding answer from answersData
      const answerData = answersData.find((a: { question_id: number; selected_answer: number; is_correct: boolean; points_earned: number }) => 
        a.question_id === questionRow.id
      );

      // Build answer object
      const answer: QuizReviewAnswer = {
        question_id: questionRow.id,
        selected_answer: answerData?.selected_answer ?? null,
        is_correct: answerData?.is_correct ?? false,
        points_earned: answerData?.points_earned ?? 0
      };

      questions.push(question);
      answers.push(answer);
    }

    // Ensure we have the same number of questions as answers
    if (questions.length !== answersData.length) {
      console.warn(`Mismatch: ${questions.length} questions found, ${answersData.length} answers expected`);
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