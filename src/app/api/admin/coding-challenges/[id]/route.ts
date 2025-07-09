import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/coding-challenges/[id] - Get a specific coding challenge
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = verifyToken(token || '');
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const challengeId = parseInt(params.id);
    
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
    
    const challenge = challenges[0];
    
    // Get test cases
    const testCasesQuery = `
      SELECT * FROM coding_test_cases 
      WHERE challenge_id = ? 
      ORDER BY is_sample DESC, id ASC
    `;
    
    const testCases = await query(testCasesQuery, [challengeId]);
    
    // Parse JSON fields
    const challengeData = {
      ...challenge,
      supported_languages: JSON.parse(challenge.supported_languages || '[]'),
      function_signature: JSON.parse(challenge.function_signature || '{}'),
      examples: JSON.parse(challenge.examples || '[]'),
      tags: JSON.parse(challenge.tags || '[]'),
      test_cases: Array.isArray(testCases) ? testCases.map((tc: { input_data: string; [key: string]: unknown }) => ({
        ...tc,
        input_data: JSON.parse(tc.input_data || '{}')
      })) : []
    };
    
    return NextResponse.json(challengeData);
  } catch (error) {
    console.error('Error fetching coding challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/coding-challenges/[id] - Update a coding challenge
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = verifyToken(token || '');
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const challengeId = parseInt(params.id);
    const body = await request.json();
    const {
      title,
      description,
      problem_statement,
      difficulty,
      points_easy,
      points_intermediate,
      points_hard,
      time_limit,
      memory_limit,
      supported_languages,
      function_signature,
      constraints,
      examples,
      hints,
      tags,
      test_cases,
      is_active
    } = body;

    // Validate required fields
    if (!title || !description || !problem_statement || !difficulty || !supported_languages) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update challenge
    await query(`
      UPDATE coding_challenges SET
        title = ?, description = ?, problem_statement = ?, difficulty = ?,
        points_easy = ?, points_intermediate = ?, points_hard = ?,
        time_limit = ?, memory_limit = ?, supported_languages = ?,
        function_signature = ?, constraints = ?, examples = ?, hints = ?, tags = ?,
        is_active = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      title,
      description,
      problem_statement,
      difficulty,
      points_easy || 10,
      points_intermediate || 20,
      points_hard || 50,
      time_limit || 300,
      memory_limit || 256,
      JSON.stringify(supported_languages),
      JSON.stringify(function_signature || {}),
      constraints || '',
      JSON.stringify(examples || []),
      hints || '',
      JSON.stringify(tags || []),
      is_active !== false, // default to true
      challengeId
    ]);

    // Update test cases if provided
    if (test_cases) {
      // Delete existing test cases
      await query('DELETE FROM coding_test_cases WHERE challenge_id = ?', [challengeId]);
      
      // Insert new test cases
      if (test_cases.length > 0) {
        for (const testCase of test_cases) {
          await query(`
            INSERT INTO coding_test_cases (
              challenge_id, input_data, expected_output, is_sample, is_hidden, weight
            ) VALUES (?, ?, ?, ?, ?, ?)
          `, [
            challengeId,
            JSON.stringify(testCase.input_data),
            testCase.expected_output,
            testCase.is_sample || false,
            testCase.is_hidden !== false, // default to true
            testCase.weight || 1.0
          ]);
        }
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
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = verifyToken(token || '');
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const challengeId = parseInt(params.id);
    
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