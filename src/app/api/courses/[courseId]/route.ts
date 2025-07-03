import { NextRequest, NextResponse } from 'next/server';
import { CourseService } from '@/lib/services/courseService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId: courseIdParam } = await params;
    const courseId = parseInt(courseIdParam);
    const searchParams = new URL(request.url).searchParams;
    const userId = parseInt(searchParams.get('userId') || '0');

    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    const course = await CourseService.getCourseById(courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Get topics for the course
    const topics = await CourseService.getTopicsByCourseId(courseId);

    // If user ID is provided, get enrollment status and progress
    let isEnrolled = false;
    let userProgress = null;
    let topicProgress = {};

    if (userId) {
      isEnrolled = await CourseService.isUserEnrolled(userId, courseId);
      if (isEnrolled) {
        userProgress = await CourseService.getUserProgress(userId, courseId);
        topicProgress = await CourseService.getTopicProgress(userId, courseId);
      }
    }

    return NextResponse.json({
      success: true,
      course,
      topics,
      isEnrolled,
      userProgress,
      topicProgress
    });

  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId: courseIdParam } = await params;
    const courseId = parseInt(courseIdParam);
    const searchParams = new URL(request.url).searchParams;
    const userId = parseInt(searchParams.get('userId') || '0');

    if (isNaN(courseId) || !userId) {
      return NextResponse.json(
        { error: 'Invalid course ID or user ID' },
        { status: 400 }
      );
    }

    // Check if course exists
    const course = await CourseService.getCourseById(courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if already enrolled
    const isEnrolled = await CourseService.isUserEnrolled(userId, courseId);
    if (isEnrolled) {
      return NextResponse.json(
        { error: 'User already enrolled in this course' },
        { status: 400 }
      );
    }

    // Enroll user
    await CourseService.enrollUser(userId, courseId);

    return NextResponse.json({
      success: true,
      message: 'Successfully enrolled in course'
    });

  } catch (error) {
    console.error('Error enrolling in course:', error);
    return NextResponse.json(
      { error: 'Failed to enroll in course' },
      { status: 500 }
    );
  }
} 