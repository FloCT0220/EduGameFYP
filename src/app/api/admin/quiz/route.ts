import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { parseQuizQuestionFields } from '@/lib/utils';
import mysql from 'mysql2/promise';

interface QuizQuestion extends mysql.RowDataPacket {
  id: number;
  course_id: number;
  topic_id: number;
  question: string;
  answers: string;
  correct_answer: number;
  points: number;
  difficulty: string;
  is_active: boolean;
  created_at: Date;
  subject_name: string;
  topic_name: string;
}

export async function GET() {
  try {
    // Get all questions for admin view with subject and topic names
    const questions = await query(
      `SELECT 
        qq.id,
        qq.course_id,
        qq.topic_id,
        qq.question,
        qq.answers,
        qq.correct_answer,
        qq.points,
        qq.difficulty,
        qq.is_active,
        qq.created_at,
        c.title as subject_name,
        t.title as topic_name
      FROM quiz_questions qq
      LEFT JOIN courses c ON qq.course_id = c.id
      LEFT JOIN topics t ON qq.topic_id = t.id
      ORDER BY qq.created_at DESC`
    );

    // Parse JSON fields for admin view
    if (Array.isArray(questions)) {
      const parsedQuestions = (questions as QuizQuestion[]).map(q => {
        const parsed = parseQuizQuestionFields(q);
        return {
          ...parsed,
          subject_name: q.subject_name || 'Unknown Subject',
          topic_name: q.topic_name || 'Unknown Topic'
        };
      });
      return NextResponse.json(parsedQuestions);
    }

    return NextResponse.json([]);
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
      course_id,
      topic_id,
      question,
      answers,
      correct_answer,
      points,
      difficulty
    } = body;

    // Validate required fields
    if (!course_id || !topic_id || !question || 
        !answers || !Array.isArray(answers) || answers.length !== 4 ||
        correct_answer === undefined || !points || !difficulty) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate that all answers are non-empty
    if (answers.some(answer => !answer || !answer.trim())) {
      return NextResponse.json({ error: 'All answer options must be filled' }, { status: 400 });
    }

    // Validate correct_answer is between 0 and 3
    if (correct_answer < 0 || correct_answer > 3) {
      return NextResponse.json({ error: 'correct_answer must be between 0 and 3' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO quiz_questions 
       (course_id, topic_id, question, answers, correct_answer, points, difficulty, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        course_id,
        topic_id,
        question,
        JSON.stringify(answers),
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