import { NextRequest, NextResponse } from 'next/server';
import { QuizService } from '@/lib/services/quizService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const topicId = searchParams.get('topicId');

    // If no parameters provided, return all questions for admin management
    if (!courseId && !topicId) {
      const { query } = await import('@/lib/db');
      const questions = await query(`
        SELECT 
          id,
          question_id,
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
          is_active
        FROM quiz_questions 
        ORDER BY created_at DESC
      `);

      return NextResponse.json(questions);
    }

    // Original logic for specific course/topic
    if (!courseId || !topicId) {
      return NextResponse.json(
        { error: 'Course ID and Topic ID are required' },
        { status: 400 }
      );
    }

    // Use cumulative quiz questions (current + all previous lessons)
    const questions = await QuizService.getCumulativeQuizQuestions(
      parseInt(courseId), 
      parseInt(topicId)
    );

    // Format questions for frontend (hide correct answers)
    const formattedQuestions = questions.map(question => ({
      id: question.question_id,
      question: question.question,
      options: [
        question.option_a,
        question.option_b,
        question.option_c,
        question.option_d
      ],
      points: question.points,
      difficulty: question.difficulty,
      // Don't send correct answer to frontend for security
      correctAnswer: undefined
    }));

    return NextResponse.json({
      success: true,
      questions: formattedQuestions
    });

  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz questions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      question_id,
      course_id,
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

    if (!question_id || !course_id || !node_id || !question || 
        !option_a || !option_b || !option_c || !option_d || 
        correct_answer === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (correct_answer < 0 || correct_answer > 3) {
      return NextResponse.json(
        { error: 'Correct answer must be between 0 and 3' },
        { status: 400 }
      );
    }

    const questionDbId = await QuizService.createQuizQuestion({
      question_id,
      course_id,
      node_id,
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      points,
      difficulty
    });

    return NextResponse.json({
      success: true,
      questionId: questionDbId,
      message: 'Quiz question created successfully'
    });

  } catch (error) {
    console.error('Error creating quiz question:', error);
    return NextResponse.json(
      { error: 'Failed to create quiz question' },
      { status: 500 }
    );
  }
} 