import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import mysql from 'mysql2/promise';

interface QuizQuestion extends mysql.RowDataPacket {
  id: number;
  subject_id: number;
  node_id: number;
  question: string;
  options_0: string;
  options_1: string;
  options_2: string;
  options_3: string;
  points: number;
  difficulty: string;
  is_active: boolean;
  created_at: Date;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subject_id');
    const nodeId = searchParams.get('node_id');
    const courseId = searchParams.get('courseId');
    const topicId = searchParams.get('topicId');

    // Use either subject_id/node_id or courseId/topicId
    const finalSubjectId = subjectId || courseId;
    const finalNodeId = nodeId || topicId;

    let questions;
    if (finalSubjectId && finalNodeId) {
      // Get specific questions for a subject and node
      questions = await query(
        `SELECT 
          id,
          subject_id,
          node_id,
          question,
          option_a as options_0,
          option_b as options_1,
          option_c as options_2,
          option_d as options_3,
          points,
          difficulty,
          is_active,
          created_at
        FROM quiz_questions 
        WHERE subject_id = ? AND node_id = ? AND is_active = true
        ORDER BY RAND() 
        LIMIT 10`,
        [finalSubjectId, finalNodeId]
      ) as QuizQuestion[];

      // Transform the questions for student view
      if (Array.isArray(questions)) {
        questions = questions.map(q => ({
          id: q.id,
          question: q.question,
          options: [q.options_0, q.options_1, q.options_2, q.options_3],
          points: q.points,
          difficulty: q.difficulty
        }));
      }

      return NextResponse.json({ 
        success: true, 
        questions: questions 
      });
    } else {
      // Get all questions for admin view
      questions = await query(
        `SELECT 
          id,
          subject_id,
          node_id,
          question,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_answer,
          points,
          difficulty,
          is_active,
          created_at
        FROM quiz_questions 
        ORDER BY created_at DESC`
      );

      return NextResponse.json(questions);
    }
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch questions' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      subject_id,
      node_id,
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      points,
      difficulty
    } = body;

    // Validate required fields
    if (!subject_id || !node_id || !question ||
        !option_a || !option_b || !option_c || !option_d ||
        correct_answer === undefined || !points || !difficulty) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate correct_answer is between 0 and 3
    if (correct_answer < 0 || correct_answer > 3) {
      return NextResponse.json({ error: 'correct_answer must be between 0 and 3' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO quiz_questions 
       (subject_id, node_id, question, option_a, option_b, option_c, option_d, correct_answer, points, difficulty, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        subject_id,
        node_id,
        question,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        points,
        difficulty,
        true
      ]
    );

    const insertId = (result as mysql.ResultSetHeader).insertId;

    return NextResponse.json({ 
      success: true, 
      id: insertId,
      message: 'Quiz question created successfully' 
    });
  } catch (error) {
    console.error('Error creating quiz question:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 