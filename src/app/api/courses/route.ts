import { NextRequest, NextResponse } from 'next/server';
import { CourseService } from '../../../../lib/services/courseService';

// TypeScript interface for course data
interface CourseData {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  estimated_duration?: number;
  total_lessons?: number;
  completed_lessons?: number;
  instructor_name?: string;
  is_enrolled?: boolean;
  progress_percentage?: number;
  total_enrollments?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const difficulty = searchParams.get('difficulty');
    const category = searchParams.get('category');

    let courses;
    
    if (userId) {
      // Get courses with user progress
      courses = await CourseService.getCoursesWithProgress(parseInt(userId));
    } else {
      // Get all courses without user progress
      const filters = {
        difficulty: difficulty || undefined,
        category: category || undefined,
        isActive: true
      };
      courses = await CourseService.getAllCourses(filters);
    }

    // Format courses for frontend
    const formattedCourses = courses.map((course: CourseData) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.difficulty, 
      difficulty: course.difficulty,
      duration: course.estimated_duration ? `${course.estimated_duration} hours` : 'Variable',
      lessons: course.total_lessons || 0,
      completedLessons: course.completed_lessons || 0,
      points: 250,
      instructor: course.instructor_name || 'Unknown',
      rating: 4.5, 
      enrolled: course.is_enrolled || false,
      thumbnail: course.difficulty === 'foundation' ? '📚' : 
                course.difficulty === 'intermediate' ? '⚡' : '🔷',
      achievements: [], // Could be fetched from user achievements
      progress: course.progress_percentage || 0,
      totalEnrollments: course.total_enrollments || 0
    }));

    return NextResponse.json({
      success: true,
      courses: formattedCourses
    });

  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, instructor_id, difficulty, estimated_duration } = body;

    if (!title || !description || !instructor_id || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const courseId = await CourseService.createCourse({
      title,
      description,
      instructor_id,
      difficulty,
      estimated_duration
    });

    return NextResponse.json({
      success: true,
      courseId,
      message: 'Course created successfully'
    });

  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
} 