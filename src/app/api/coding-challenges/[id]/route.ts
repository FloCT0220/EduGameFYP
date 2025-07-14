import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { parseCodingChallengeListFields } from '@/lib/utils';

interface ChallengeRow {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  points: number;
  supported_languages: string;
  tags: string;
  created_at: string;
}

interface CodeSnippet {
  id: string;
  code: string;
}

interface AnswerRow {
  code_snippets: CodeSnippet[];
  correct_answer: string[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const challengeId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'python';

    if (isNaN(challengeId)) {
      return NextResponse.json(
        { error: 'Invalid challenge ID' },
        { status: 400 }
      );
    }

    // Get challenge details
    const challenges = await query(`
      SELECT 
        cc.id,
        cc.title,
        cc.description,
        cc.difficulty,
        cc.points,
        cc.supported_languages,
        cc.tags,
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

    // Get code snippets and correct answer for the selected language
    const answers = await query(`
      SELECT code_snippets, correct_answer
      FROM coding_challenge_answers
      WHERE challenge_id = ? AND programming_language = ?
    `, [challengeId, language]) as AnswerRow[];

    let codeSnippets: CodeSnippet[] = [];
    let correctAnswer: string[] = [];

    if (answers && answers.length > 0) {
      // Handle both string and object formats from database
      const codeSnippetsData = answers[0].code_snippets;
      const correctAnswerData = answers[0].correct_answer;
      
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