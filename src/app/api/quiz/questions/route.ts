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
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const topicId = searchParams.get('topicId');

    // Use courseId/topicId parameters
    const finalCourseId = courseId;
    const finalTopicId = topicId;

    let questions;
    if (finalCourseId && finalTopicId) {
      // Student view: fetch questions for course and all topics up to and including current topic
      const courseIdNum = parseInt(finalCourseId);
      const topicIdNum = parseInt(finalTopicId);
      if (isNaN(courseIdNum) || isNaN(topicIdNum)) {
        return NextResponse.json({ success: false, error: 'Invalid course or topic id' }, { status: 400 });
      }
      questions = await query(
        `SELECT 
          id,
          course_id,
          topic_id,
          question,
          answers,
          correct_answer,
          points,
          difficulty,
          is_active,
          created_at
        FROM quiz_questions 
        WHERE course_id = ? AND topic_id <= ? AND is_active = true`,
        [courseIdNum, topicIdNum]
      ) as QuizQuestion[];

      // Randomly select up to 10 questions
      if (Array.isArray(questions)) {
        // Shuffle
        questions = questions.sort(() => Math.random() - 0.5);
        // Take up to 10
        questions = questions.slice(0, 10);
        questions = questions.map(q => {
          const parsedQuestion = parseQuizQuestionFields(q);
          return {
            id: q.id,
            question: q.question,
            options: parsedQuestion.answers as string[],
            points: q.points,
            difficulty: q.difficulty
          };
        });
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
          course_id,
          topic_id,
          question,
          answers,
          correct_answer,
          points,
          difficulty,
          is_active,
          created_at
        FROM quiz_questions 
        ORDER BY created_at DESC`
      );

      // Parse JSON fields for admin view
      if (Array.isArray(questions)) {
        questions = (questions as QuizQuestion[]).map(q => parseQuizQuestionFields(q));
      }

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
      course_id,
      topic_id,
      question,
      answers,
      correct_answer,
      points,
      difficulty
    } = body;

    // Validate required fields
    if (!course_id || !topic_id || !question || !answers || 
        correct_answer === undefined || !points || !difficulty) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate answers is an array with 4 elements
    if (!Array.isArray(answers) || answers.length !== 4) {
      return NextResponse.json({ error: 'answers must be an array with exactly 4 elements' }, { status: 400 });
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