import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/coding-challenges/[id] - Get a specific challenge for students
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = verifyToken(token || '');
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const challengeId = parseInt(params.id);
    
    // Get challenge details
    const challengeQuery = `
      SELECT 
        c.id,
        c.title,
        c.description,
        c.problem_statement,
        c.difficulty,
        c.points_easy,
        c.points_intermediate,
        c.points_hard,
        c.time_limit,
        c.memory_limit,
        c.supported_languages,
        c.function_signature,
        c.constraints,
        c.examples,
        c.hints,
        c.tags
      FROM coding_challenges c
      WHERE c.id = ? AND c.is_active = TRUE
    `;
    
    const challenges = await query(challengeQuery, [challengeId]);
    
    if (!Array.isArray(challenges) || challenges.length === 0) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }
    
    const challenge = challenges[0] as any;
    
    // Get sample test cases (visible to students)
    const testCasesQuery = `
      SELECT input_data, expected_output
      FROM coding_test_cases 
      WHERE challenge_id = ? AND is_sample = TRUE
      ORDER BY id ASC
    `;
    
    const testCases = await query(testCasesQuery, [challengeId]);
    
    // Get user's submission history for this challenge
    const submissionsQuery = `
      SELECT 
        id,
        language,
        status,
        score,
        execution_time,
        memory_used,
        test_cases_passed,
        test_cases_total,
        points_earned,
        submitted_at
      FROM coding_submissions
      WHERE challenge_id = ? AND user_id = ?
      ORDER BY submitted_at DESC
      LIMIT 10
    `;
    
    const submissions = await query(submissionsQuery, [challengeId, user.id]);
    
    // Parse JSON fields and format response
    const challengeData = {
      ...challenge,
      supported_languages: JSON.parse(challenge.supported_languages || '[]'),
      function_signature: JSON.parse(challenge.function_signature || '{}'),
      examples: JSON.parse(challenge.examples || '[]'),
      tags: JSON.parse(challenge.tags || '[]'),
      sample_test_cases: Array.isArray(testCases) ? testCases.map((tc: any) => ({
        input_data: JSON.parse(tc.input_data || '{}'),
        expected_output: tc.expected_output
      })) : [],
      user_submissions: submissions || []
    };
    
    return NextResponse.json(challengeData);
  } catch (error) {
    console.error('Error fetching coding challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 