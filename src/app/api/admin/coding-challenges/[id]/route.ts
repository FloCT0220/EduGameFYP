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
  supported_languages: string;
  created_by: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  created_by_username?: string;
}

interface ChallengeAnswerData extends RowDataPacket {
  programming_language: string;
  code_snippets: string;
  correct_answer: string;
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
    
    // Get challenge answers
    const answersQuery = `
      SELECT 
        programming_language,
        code_snippets,
        correct_answer
      FROM coding_challenge_answers
      WHERE challenge_id = ?
      ORDER BY programming_language
    `;
    
    const answers = await query(answersQuery, [challengeId]);
    
    // Parse JSON fields using utility function
    const challengeData = parseCodingChallengeListFields(challenge as Record<string, unknown>);
    
    // Add challenge answers to the response
    const response = {
      ...challengeData,
      challenge_answers: Array.isArray(answers) ? (answers as ChallengeAnswerData[]).map(answer => ({
        programming_language: answer.programming_language,
        code_snippets: typeof answer.code_snippets === 'string' 
          ? JSON.parse(answer.code_snippets) 
          : answer.code_snippets,
        correct_answer: typeof answer.correct_answer === 'string' 
          ? JSON.parse(answer.correct_answer) 
          : answer.correct_answer
      })) : []
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
      supported_languages,
      is_active,
      challenge_answers
    } = body;

    // Validate required fields
    if (!title || !description || !difficulty || !supported_languages) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update challenge
    await query(`
      UPDATE coding_challenges SET
        title = ?, description = ?, difficulty = ?,
        points = ?, supported_languages = ?,
        is_active = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      title,
      description,
      difficulty,
      points || 10,
      JSON.stringify(supported_languages),
      is_active !== false, // default to true
      challengeId
    ]);

    // Update challenge answers if provided
    if (challenge_answers && Array.isArray(challenge_answers)) {
      // Delete existing answers
      await query('DELETE FROM coding_challenge_answers WHERE challenge_id = ?', [challengeId]);
      
      // Insert new answers
      for (const answer of challenge_answers) {
        await query(`
          INSERT INTO coding_challenge_answers 
          (challenge_id, programming_language, code_snippets, correct_answer)
          VALUES (?, ?, ?, ?)
        `, [
          challengeId,
          answer.programming_language,
          JSON.stringify(answer.code_snippets),
          JSON.stringify(answer.correct_answer)
        ]);
      }
    }

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