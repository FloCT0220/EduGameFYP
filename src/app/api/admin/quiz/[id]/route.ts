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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

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
      WHERE qq.id = ?`,
      [id]
    ) as QuizQuestion[];

    if (questions.length === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const question = questions[0];
    const parsedQuestion = parseQuizQuestionFields(question);
    
    return NextResponse.json({
      ...parsedQuestion,
      subject_name: question.subject_name || 'Unknown Subject',
      topic_name: question.topic_name || 'Unknown Topic'
    });
  } catch (error) {
    console.error('Error fetching quiz question:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

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
      `UPDATE quiz_questions 
       SET course_id = ?, topic_id = ?, question = ?, answers = ?, 
           correct_answer = ?, points = ?, difficulty = ?
       WHERE id = ?`,
      [
        course_id,
        topic_id,
        question,
        JSON.stringify(answers),
        correct_answer,
        points,
        difficulty,
        id
      ]
    );

    const affectedRows = (result as mysql.ResultSetHeader).affectedRows;
    if (affectedRows === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Quiz question updated successfully' 
    });
  } catch (error) {
    console.error('Error updating quiz question:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const result = await query(
      'DELETE FROM quiz_questions WHERE id = ?',
      [id]
    );

    const affectedRows = (result as mysql.ResultSetHeader).affectedRows;
    if (affectedRows === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Quiz question deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting quiz question:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 