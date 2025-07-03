import { NextRequest, NextResponse } from 'next/server';
import { CourseService } from '@/lib/services/courseService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId: courseIdParam } = await params;
    const courseId = parseInt(courseIdParam);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    // Get skill nodes for the course with user progress if userId provided
    const skillNodes = await CourseService.getCourseSkillNodes(
      courseId, 
      userId ? parseInt(userId) : undefined
    );

    // Transform database skill nodes to frontend format
    const formattedNodes = skillNodes.map(node => ({
      id: node.node_id,
      title: node.title,
      description: node.description || '',
      level: node.level,
      position: { 
        x: node.position_x * 2, // Reduce scale for better visibility
        y: node.position_y * 2 
      },
      prerequisites: node.prerequisites || [],
      completed: userId ? (node.user_progress?.completed || false) : false,
      locked: userId ? !(node.is_unlocked || false) : false,
      points: node.points,
      difficulty: node.difficulty,
      estimatedTime: node.estimated_time || '30 min',
      type: node.type,
      contentUrl: node.content_url,
      userProgress: userId ? node.user_progress : undefined
    }));

    return NextResponse.json({
      success: true,
      skillNodes: formattedNodes
    });

  } catch (error) {
    console.error('Error fetching skill nodes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skill nodes' },
      { status: 500 }
    );
  }
} 