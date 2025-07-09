import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/coding-challenges - Get all coding challenges
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = verifyToken(token || '');
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const difficulty = searchParams.get('difficulty');
    const search = searchParams.get('search');
    
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const queryParams: (string | number)[] = [];
    
    if (difficulty) {
      whereClause += ' AND c.difficulty = ?';
      queryParams.push(difficulty);
    }
    
    if (search) {
      whereClause += ' AND (c.title LIKE ? OR c.description LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM coding_challenges c 
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams) as { total: number }[];
    const total = countResult[0].total;
    
    // Get challenges with pagination
    const challengesQuery = `
      SELECT 
        c.*,
        u.username as created_by_username,
        (SELECT COUNT(*) FROM coding_test_cases WHERE challenge_id = c.id) as test_cases_count,
        (SELECT COUNT(*) FROM coding_submissions WHERE challenge_id = c.id) as submissions_count
      FROM coding_challenges c
      LEFT JOIN users u ON c.created_by = u.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const challenges = await query(challengesQuery, [...queryParams, limit, offset]);
    
    return NextResponse.json({
      challenges,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching coding challenges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/coding-challenges - Create new coding challenge
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = verifyToken(token || '');
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      test_cases
    } = body;

    // Validate required fields
    if (!title || !description || !problem_statement || !difficulty || !supported_languages) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert challenge
    const challengeResult = await query(`
      INSERT INTO coding_challenges (
        title, description, problem_statement, difficulty,
        points_easy, points_intermediate, points_hard,
        time_limit, memory_limit, supported_languages,
        function_signature, constraints, examples, hints, tags,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      user.id
    ]) as { insertId: number };

    const challengeId = challengeResult.insertId;

    // Insert test cases if provided
    if (test_cases && test_cases.length > 0) {
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

    return NextResponse.json({ 
      message: 'Challenge created successfully',
      challengeId 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating coding challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 