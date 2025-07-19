import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { parseCodingChallengeListFields } from '@/lib/utils';
import { RowDataPacket } from 'mysql2';

interface ChallengeData extends RowDataPacket {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  points: number;
  supported_language: string;
  created_by: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  created_by_username?: string;
}



// GET /api/admin/coding-challenges/[id] - Get a specific coding challenge
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = verifyToken(token || '');
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const challengeId = parseInt(id);
    
    // Get challenge details
    const challengeQuery = `
      SELECT 
        c.*,
        u.username as created_by_username
      FROM coding_challenges c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = ?
    `;
    
    const challenges = await query(challengeQuery, [challengeId]);
    
    if (!Array.isArray(challenges) || challenges.length === 0) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }
    
    const challenge = challenges[0] as ChallengeData;
    
    // Parse JSON fields using utility function
    const challengeData = parseCodingChallengeListFields(challenge as Record<string, unknown>);
    
    // Parse code_snippets and correct_answer from the database
    const code_snippets = typeof challenge.code_snippets === 'string' 
      ? JSON.parse(challenge.code_snippets) 
      : challenge.code_snippets || [];
    const correct_answer = typeof challenge.correct_answer === 'string' 
      ? JSON.parse(challenge.correct_answer) 
      : challenge.correct_answer || [];
    
    // Create challenge_answers structure that the frontend expects
    const challenge_answers = [{
      programming_language: 'python', // Default language
      code_snippets: code_snippets,
      correct_answer: correct_answer
    }];
    
    const response = {
      ...challengeData,
      challenge_answers: challenge_answers
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching coding challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/coding-challenges/[id] - Update a coding challenge
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = verifyToken(token || '');
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const challengeId = parseInt(id);
    const body = await request.json();
    const {
      title,
      description,
      difficulty,
      points,
      supported_language,
      is_active,
      challenge_answers
    } = body;

    // Validate required fields
    if (!title || !description || !difficulty || !supported_language) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Process challenge_answers to extract code_snippets and correct_answer
    let code_snippets = [];
    let correct_answer = [];
    
    if (challenge_answers && Array.isArray(challenge_answers) && challenge_answers.length > 0) {
      // For now, we'll use the first language's data as the primary answer
      // In the future, this could be expanded to support multiple languages
      const primaryAnswer = challenge_answers[0];
      code_snippets = primaryAnswer.code_snippets || [];
      correct_answer = primaryAnswer.correct_answer || [];
    }

    // Update challenge with merged fields
    await query(`
      UPDATE coding_challenges SET
        title = ?, description = ?, difficulty = ?,
        points = ?, supported_language = ?, code_snippets = ?, correct_answer = ?,
        is_active = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      title,
      description,
      difficulty,
      points || 10,
      supported_language,
      JSON.stringify(code_snippets),
      JSON.stringify(correct_answer),
      is_active !== false, // default to true
      challengeId
    ]);

    return NextResponse.json({ message: 'Challenge updated successfully' });
  } catch (error) {
    console.error('Error updating coding challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/coding-challenges/[id] - Delete a coding challenge
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = verifyToken(token || '');
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const challengeId = parseInt(id);
    
    // Check if challenge exists
    const existingChallenge = await query(
      'SELECT id FROM coding_challenges WHERE id = ?',
      [challengeId]
    );
    
    if (!Array.isArray(existingChallenge) || existingChallenge.length === 0) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }
    
    // Delete the challenge (CASCADE will handle test cases and submissions)
    await query('DELETE FROM coding_challenges WHERE id = ?', [challengeId]);
    
    return NextResponse.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    console.error('Error deleting coding challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 