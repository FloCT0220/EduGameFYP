import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { parseCodingChallengeListFields } from '@/lib/utils';

interface ChallengeRow {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  points: number;
  supported_language: string;
  code_snippets: string;
  correct_answer: string;
  created_at: string;
}

interface CodeSnippet {
  id: string;
  code: string;
  language?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const challengeId = parseInt(id);

    if (isNaN(challengeId)) {
      return NextResponse.json(
        { error: 'Invalid challenge ID' },
        { status: 400 }
      );
    }

    // Get challenge details with code snippets and answers
    const challenges = await query(`
      SELECT 
        cc.id,
        cc.title,
        cc.description,
        cc.difficulty,
        cc.points,
        cc.supported_language,
        cc.code_snippets,
        cc.correct_answer,
        cc.created_at
      FROM coding_challenges cc
      WHERE cc.id = ? AND cc.is_active = true
    `, [challengeId]);

    if (!challenges || (challenges as ChallengeRow[]).length === 0) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    const challenge = (challenges as ChallengeRow[])[0];

    // Parse code snippets and correct answer from the challenge
    let codeSnippets: CodeSnippet[] = [];
    let correctAnswer: string[] = [];

    if (challenge.code_snippets) {
      const codeSnippetsData = challenge.code_snippets;
      const correctAnswerData = challenge.correct_answer;
      
      if (typeof codeSnippetsData === 'string') {
        codeSnippets = JSON.parse(codeSnippetsData || '[]');
      } else {
        codeSnippets = codeSnippetsData || [];
      }
      
      if (typeof correctAnswerData === 'string') {
        correctAnswer = JSON.parse(correctAnswerData || '[]');
      } else {
        correctAnswer = correctAnswerData || [];
      }
    }

    // No need to filter by language since each challenge has its own supported_language
    // The language parameter is not used for filtering in this context

    // Parse JSON fields using utility function
    const parsedChallenge = parseCodingChallengeListFields(challenge as unknown as Record<string, unknown>);

    // Add code snippets and correct answer to the response
    const response = {
      ...parsedChallenge,
      code_snippets: codeSnippets,
      correct_answer: correctAnswer
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching coding challenge:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coding challenge' },
      { status: 500 }
    );
  }
} 