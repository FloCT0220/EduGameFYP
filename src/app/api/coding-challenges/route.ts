import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

interface ChallengeRow {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  points_easy: number;
  points_intermediate: number;
  points_hard: number;
  time_limit: number;
  memory_limit: number;
  supported_languages: string;
  tags: string;
  created_at: string;
  user_attempts: number;
  best_score: number | null;
  best_status: string | null;
}

// GET /api/coding-challenges - Get active coding challenges for students
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = verifyToken(token || '');
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const difficulty = searchParams.get('difficulty');
    const tags = searchParams.get('tags');
    const search = searchParams.get('search');
    
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE c.is_active = TRUE';
    const queryParams: (string | number)[] = [];
    
    if (difficulty) {
      whereClause += ' AND c.difficulty = ?';
      queryParams.push(difficulty);
    }
    
    if (search) {
      whereClause += ' AND (c.title LIKE ? OR c.description LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (tags) {
      whereClause += ' AND JSON_CONTAINS(c.tags, ?)';
      queryParams.push(`"${tags}"`);
    }
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM coding_challenges c 
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams) as { total: number }[];
    const total = countResult[0].total;
    
    // Get challenges with user submission info
    const challengesQuery = `
      SELECT 
        c.id,
        c.title,
        c.description,
        c.difficulty,
        c.points_easy,
        c.points_intermediate,
        c.points_hard,
        c.time_limit,
        c.memory_limit,
        c.supported_languages,
        c.tags,
        c.created_at,
        (SELECT COUNT(*) FROM coding_submissions WHERE challenge_id = c.id AND user_id = ?) as user_attempts,
        (SELECT MAX(score) FROM coding_submissions WHERE challenge_id = c.id AND user_id = ?) as best_score,
        (SELECT status FROM coding_submissions WHERE challenge_id = c.id AND user_id = ? ORDER BY score DESC, submitted_at DESC LIMIT 1) as best_status
      FROM coding_challenges c
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    // Build final parameters array in correct order: WHERE params, user_ids (3x), limit, offset
    const finalParams = [...queryParams, user.id, user.id, user.id, limit, offset];
    const challenges = await query(challengesQuery, finalParams);
    
    // Parse JSON fields
    const parsedChallenges = Array.isArray(challenges) ? (challenges as ChallengeRow[]).map((challenge) => ({
      ...challenge,
      supported_languages: JSON.parse(challenge.supported_languages || '[]'),
      tags: JSON.parse(challenge.tags || '[]'),
      is_solved: challenge.best_status === 'accepted'
    })) : [];
    
    return NextResponse.json({
      challenges: parsedChallenges,
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