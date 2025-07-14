import { NextResponse } from 'next/server';
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
  submissions_count: number;
  success_rate: number;
}

export async function GET() {
  try {
    // Get all active coding challenges with submission statistics
    const challenges = await query(`
      SELECT 
        cc.id,
        cc.title,
        cc.description,
        cc.difficulty,
        cc.points,
        cc.supported_languages,
        cc.tags,
        cc.created_at,
        COUNT(cs.id) as submissions_count,
        CASE 
          WHEN COUNT(cs.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN cs.is_correct = true THEN 1 END) * 100.0 / COUNT(cs.id)), 1)
          ELSE 0 
        END as success_rate
      FROM coding_challenges cc
      LEFT JOIN coding_submissions cs ON cc.id = cs.challenge_id
      WHERE cc.is_active = true
      GROUP BY cc.id
      ORDER BY cc.created_at DESC
    `);

    // Parse JSON fields using utility function
    const parsedChallenges = (challenges as ChallengeRow[]).map(challenge => 
      parseCodingChallengeListFields(challenge as unknown as Record<string, unknown>)
    );

    return NextResponse.json(parsedChallenges);
  } catch (error) {
    console.error('Error fetching coding challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coding challenges' },
      { status: 500 }
    );
  }
} 