import { NextRequest, NextResponse } from 'next/server';
import { QuizService } from '../../../../../lib/services/quizService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const nodeId = searchParams.get('nodeId');

    if (!courseId || !nodeId) {
      return NextResponse.json(
        { error: 'Course ID and Node ID are required' },
        { status: 400 }
      );
    }

    const questions = await QuizService.getQuizQuestions(
      parseInt(courseId), 
      nodeId
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
      correctAnswer: undefined,
      explanation: question.explanation
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
      difficulty,
      explanation
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
      difficulty,
      explanation
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