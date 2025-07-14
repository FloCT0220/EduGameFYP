import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

interface AnswerRow {
  correct_answer: string[];
  points: number;
}

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = verifyToken(token || '');
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { challengeId, programmingLanguage, submittedAnswer } = await request.json();

    if (!challengeId || !programmingLanguage || !submittedAnswer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the correct answer for this challenge and language
    const answers = await query(`
      SELECT correct_answer, points
      FROM coding_challenge_answers cca
      JOIN coding_challenges cc ON cca.challenge_id = cc.id
      WHERE cca.challenge_id = ? AND cca.programming_language = ?
    `, [challengeId, programmingLanguage]) as AnswerRow[];

    if (!answers || answers.length === 0) {
      return NextResponse.json(
        { error: 'Challenge or language not found' },
        { status: 404 }
      );
    }

    const correctAnswer = answers[0].correct_answer;
    const challengePoints = answers[0].points;

    // Check if answer is correct
    const isCorrect = JSON.stringify(submittedAnswer) === JSON.stringify(correctAnswer);
    const pointsEarned = isCorrect ? challengePoints : 0;

    // Save submission to database
    await query(`
      INSERT INTO coding_submissions 
      (user_id, challenge_id, programming_language, submitted_answer, is_correct, points_earned)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [user.id, challengeId, programmingLanguage, JSON.stringify(submittedAnswer), isCorrect, pointsEarned]);

    // Update user's total points if answer is correct
    if (isCorrect) {
      await query(`
        UPDATE users 
        SET total_points = total_points + ? 
        WHERE id = ?
      `, [pointsEarned, user.id]);
    }

    return NextResponse.json({
      isCorrect,
      pointsEarned,
      message: isCorrect ? 'Correct answer! Points earned.' : 'Incorrect answer. Try again!'
    });

  } catch (error) {
    console.error('Error submitting challenge answer:', error);
    return NextResponse.json(
      { error: 'Failed to submit answer' },
      { status: 500 }
    );
  }
} 