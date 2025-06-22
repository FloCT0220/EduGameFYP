import { query } from '../db';

export interface Course {
  id: number;
  title: string;
  description: string;
  instructor_id?: number;
  difficulty: 'foundation' | 'intermediate' | 'advanced';
  estimated_duration?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  instructor_name?: string;
  total_enrollments?: number;
  average_rating?: number;
}

export interface SkillNode {
  id: number;
  course_id: number;
  node_id: string;
  title: string;
  description?: string;
  level: number;
  position_x: number;
  position_y: number;
  points: number;
  difficulty: 'foundation' | 'intermediate' | 'advanced';
  estimated_time?: string;
  type: 'lesson' | 'quiz' | 'project';
  content_url?: string;
  is_active: boolean;
  prerequisites?: string[];
  is_unlocked?: boolean;
  is_completed?: boolean;
  user_progress?: {
    completed: boolean;
    points_earned: number;
    best_score: number;
    attempts: number;
  };
}

export interface CourseWithProgress extends Course {
  enrollment_id?: number;
  enrolled_at?: Date;
  progress_percentage: number;
  total_points_earned: number;
  completed_lessons: number;
  total_lessons: number;
  is_enrolled: boolean;
}

export class CourseService {
  // Get all courses with optional filtering
  static async getAllCourses(
    filters?: {
      difficulty?: string;
      category?: string;
      isActive?: boolean;
    }
  ): Promise<Course[]> {
    let sql = `
      SELECT 
        c.*,
        u.username as instructor_name,
        COUNT(DISTINCT ue.user_id) as total_enrollments
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      LEFT JOIN user_enrollments ue ON c.id = ue.course_id
      WHERE 1=1
    `;
    
    const params: (string | number | boolean)[] = [];
    
    if (filters?.difficulty) {
      sql += ' AND c.difficulty = ?';
      params.push(filters.difficulty);
    }
    
    if (filters?.isActive !== undefined) {
      sql += ' AND c.is_active = ?';
      params.push(filters.isActive);
    }
    
    sql += ' GROUP BY c.id ORDER BY c.created_at DESC';
    
    return await query(sql, params) as Course[];
  }

  // Get course by ID
  static async getCourseById(courseId: number): Promise<Course | null> {
    const result = await query(`
      SELECT 
        c.*,
        u.username as instructor_name,
        COUNT(DISTINCT ue.user_id) as total_enrollments
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      LEFT JOIN user_enrollments ue ON c.id = ue.course_id
      WHERE c.id = ?
      GROUP BY c.id
    `, [courseId]) as Course[];
    
    return result.length > 0 ? result[0] : null;
  }

  // Get courses with user progress
  static async getCoursesWithProgress(userId?: number): Promise<CourseWithProgress[]> {
    const sql = `
      SELECT 
        c.*,
        u.username as instructor_name,
        COUNT(DISTINCT all_ue.user_id) as total_enrollments,
        ${userId ? `
          MAX(ue.id) as enrollment_id,
          MAX(ue.enrolled_at) as enrolled_at,
          MAX(ue.progress_percentage) as progress_percentage,
          MAX(ue.total_points_earned) as total_points_earned,
          CASE WHEN MAX(ue.id) IS NOT NULL THEN true ELSE false END as is_enrolled,
        ` : `
          NULL as enrollment_id,
          NULL as enrolled_at,
          0 as progress_percentage,
          0 as total_points_earned,
          false as is_enrolled,
        `}
        COUNT(DISTINCT sn.id) as total_lessons,
        ${userId ? `
          COUNT(DISTINCT CASE WHEN unp.completed = true THEN sn.id END) as completed_lessons
        ` : '0 as completed_lessons'}
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      LEFT JOIN user_enrollments all_ue ON c.id = all_ue.course_id
      LEFT JOIN skill_nodes sn ON c.id = sn.course_id AND sn.is_active = true
      ${userId ? `
        LEFT JOIN user_enrollments ue ON c.id = ue.course_id AND ue.user_id = ?
        LEFT JOIN user_node_progress unp ON c.id = unp.course_id 
          AND unp.user_id = ? AND sn.node_id = unp.node_id
      ` : ''}
      WHERE c.is_active = true
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    
    const params = userId ? [userId, userId] : [];
    return await query(sql, params) as CourseWithProgress[];
  }

  // Get skill nodes for a course
  static async getCourseSkillNodes(courseId: number, userId?: number): Promise<SkillNode[]> {
    const sql = `
      SELECT 
        sn.*,
        ${userId ? `
          unp.completed,
          unp.points_earned,
          unp.best_score,
          unp.attempts,
          unp.completed_at
        ` : `
          false as completed,
          0 as points_earned,
          0 as best_score,
          0 as attempts,
          NULL as completed_at
        `}
      FROM skill_nodes sn
      ${userId ? `
        LEFT JOIN user_node_progress unp ON sn.course_id = unp.course_id 
          AND sn.node_id = unp.node_id AND unp.user_id = ?
      ` : ''}
      WHERE sn.course_id = ? AND sn.is_active = true
      ORDER BY sn.level, sn.position_y, sn.position_x
    `;
    
    const params = userId ? [userId, courseId] : [courseId];
    const rawNodes = await query(sql, params) as (SkillNode & {
      completed?: boolean;
      points_earned?: number;
      best_score?: number;
      attempts?: number;
      completed_at?: string;
    })[];

    // Transform raw data into SkillNode objects
    const nodes: SkillNode[] = rawNodes.map(row => ({
      id: row.id,
      course_id: row.course_id,
      node_id: row.node_id,
      title: row.title,
      description: row.description,
      level: row.level,
      position_x: row.position_x,
      position_y: row.position_y,
      points: row.points,
      difficulty: row.difficulty,
      estimated_time: row.estimated_time,
      type: row.type,
      content_url: row.content_url,
      is_active: row.is_active,
      prerequisites: [], // Will be populated below
      user_progress: userId ? {
        completed: !!row.completed,
        points_earned: row.points_earned || 0,
        best_score: row.best_score || 0,
        attempts: row.attempts || 0
      } : undefined
    }));

    // Get prerequisites for each node
    for (const node of nodes) {
      const prerequisites = await query(`
        SELECT sn.node_id
        FROM node_prerequisites np
        JOIN skill_nodes sn ON np.prerequisite_node_id = sn.id
        WHERE np.node_id = ?
      `, [node.id]) as { node_id: string }[];
      
      node.prerequisites = prerequisites.map(p => p.node_id);
      
      // Determine if node is unlocked
      if (userId) {
        node.is_unlocked = await this.isNodeUnlocked(node.id, userId);
        node.is_completed = !!node.user_progress?.completed;
      } else {
        // If no user, only first level nodes are unlocked
        node.is_unlocked = node.level === 1;
        node.is_completed = false;
      }
    }

    return nodes;
  }

  // Check if a node is unlocked for a user
  static async isNodeUnlocked(nodeId: number, userId: number): Promise<boolean> {
    // Get all prerequisites for this node
    const prerequisites = await query(`
      SELECT prerequisite_node_id
      FROM node_prerequisites
      WHERE node_id = ?
    `, [nodeId]) as { prerequisite_node_id: number }[];

    if (prerequisites.length === 0) {
      return true; // No prerequisites, so it's unlocked
    }

    // Check if all prerequisites are completed
    for (const prereq of prerequisites) {
      const progress = await query(`
        SELECT completed
        FROM user_node_progress unp
        JOIN skill_nodes sn ON unp.course_id = sn.course_id AND unp.node_id = sn.node_id
        WHERE sn.id = ? AND unp.user_id = ?
      `, [prereq.prerequisite_node_id, userId]) as { completed: boolean }[];

      if (progress.length === 0 || !progress[0].completed) {
        return false; // Prerequisite not completed
      }
    }

    return true; // All prerequisites completed
  }

  // Get skill node by node_id and course_id
  static async getSkillNode(courseId: number, nodeId: string): Promise<SkillNode | null> {
    const result = await query(`
      SELECT * FROM skill_nodes
      WHERE course_id = ? AND node_id = ? AND is_active = true
    `, [courseId, nodeId]) as SkillNode[];
    
    return result.length > 0 ? result[0] : null;
  }

  // Create a new course
  static async createCourse(courseData: {
    title: string;
    description: string;
    instructor_id: number;
    difficulty: 'foundation' | 'intermediate' | 'advanced';
    estimated_duration?: number;
  }): Promise<number> {
    const result = await query(`
      INSERT INTO courses (title, description, instructor_id, difficulty, estimated_duration)
      VALUES (?, ?, ?, ?, ?)
    `, [
      courseData.title,
      courseData.description,
      courseData.instructor_id,
      courseData.difficulty,
      courseData.estimated_duration || null
    ]) as { insertId: number };
    
    return result.insertId;
  }

  // Create a skill node
  static async createSkillNode(nodeData: {
    course_id: number;
    node_id: string;
    title: string;
    description?: string;
    level: number;
    position_x: number;
    position_y: number;
    points: number;
    difficulty: 'foundation' | 'intermediate' | 'advanced';
    estimated_time?: string;
    type: 'lesson' | 'quiz' | 'project';
    content_url?: string;
  }): Promise<number> {
    const result = await query(`
      INSERT INTO skill_nodes 
      (course_id, node_id, title, description, level, position_x, position_y, 
       points, difficulty, estimated_time, type, content_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nodeData.course_id,
      nodeData.node_id,
      nodeData.title,
      nodeData.description || null,
      nodeData.level,
      nodeData.position_x,
      nodeData.position_y,
      nodeData.points,
      nodeData.difficulty,
      nodeData.estimated_time || null,
      nodeData.type,
      nodeData.content_url || null
    ]) as { insertId: number };
    
    return result.insertId;
  }

  // Add prerequisite to a node
  static async addNodePrerequisite(nodeId: number, prerequisiteNodeId: number): Promise<void> {
    await query(`
      INSERT IGNORE INTO node_prerequisites (node_id, prerequisite_node_id)
      VALUES (?, ?)
    `, [nodeId, prerequisiteNodeId]);
  }

  // Update course
  static async updateCourse(courseId: number, updateData: Partial<Course>): Promise<void> {
    const fields = Object.keys(updateData).filter(key => key !== 'id');
    if (fields.length === 0) return;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updateData[field as keyof Course] ?? null);
    
    await query(`
      UPDATE courses 
      SET ${setClause}, updated_at = NOW()
      WHERE id = ?
    `, [...values, courseId]);
  }

  // Delete course (soft delete)
  static async deleteCourse(courseId: number): Promise<void> {
    await query(`
      UPDATE courses 
      SET is_active = false, updated_at = NOW()
      WHERE id = ?
    `, [courseId]);
  }

  // Get course statistics
  static async getCourseStatistics(courseId: number): Promise<{
    total_enrollments: number;
    completed_enrollments: number;
    average_progress: number;
    total_quiz_attempts: number;
    average_quiz_score: number;
  }> {
    const stats = await query(`
      SELECT 
        COUNT(DISTINCT ue.user_id) as total_enrollments,
        COUNT(DISTINCT CASE WHEN ue.completed_at IS NOT NULL THEN ue.user_id END) as completed_enrollments,
        AVG(ue.progress_percentage) as average_progress,
        COUNT(DISTINCT qa.id) as total_quiz_attempts,
        AVG(qa.score_percentage) as average_quiz_score
      FROM user_enrollments ue
      LEFT JOIN quiz_attempts qa ON ue.user_id = qa.user_id AND ue.course_id = qa.course_id
      WHERE ue.course_id = ?
    `, [courseId]) as {
      total_enrollments: number;
      completed_enrollments: number;
      average_progress: number;
      total_quiz_attempts: number;
      average_quiz_score: number;
    }[];

    return stats[0] || {
      total_enrollments: 0,
      completed_enrollments: 0,
      average_progress: 0,
      total_quiz_attempts: 0,
      average_quiz_score: 0
    };
  }
} 