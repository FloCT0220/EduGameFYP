import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface Course extends RowDataPacket {
  id: number;
  title: string;
  description: string;
    difficulty_level: string;
    category: string;
    creator_name: string;
    enrolled_count: number;
}

interface Topic extends RowDataPacket {
  id: number;
  course_id: number;
  title: string;
    content: string;
    lesson_order: number;
    points_reward: number;
    duration_minutes: number;
}

interface UserProgress extends RowDataPacket {
    total_lessons: number;
  completed_lessons: number;
}

interface TopicProgress extends RowDataPacket {
    id: number;
    completed: number;
}

export class CourseService {
  static async getCourseById(courseId: number): Promise<Course | null> {
        const courses = await query(
            'SELECT * FROM courses WHERE id = ?',
            [courseId]
        ) as Course[];
        return courses[0] || null;
  }

    static async getTopicsByCourseId(courseId: number): Promise<Topic[]> {
        const topics = await query(
            'SELECT * FROM topics WHERE course_id = ? ORDER BY lesson_order',
            [courseId]
        ) as Topic[];
        return topics;
  }

    static async getUserProgress(userId: number, courseId: number): Promise<UserProgress | null> {
        const progress = await query(
            `SELECT 
                COUNT(t.id) as total_lessons,
                COUNT(utp.completed) as completed_lessons
            FROM topics t
            LEFT JOIN user_topic_progress utp 
                ON t.id = utp.topic_id 
                AND utp.user_id = ?
                AND utp.completed = true
            WHERE t.course_id = ?
            GROUP BY t.course_id`,
            [userId, courseId]
        ) as UserProgress[];
        return progress[0] || null;
    }

    static async isUserEnrolled(userId: number, courseId: number): Promise<boolean> {
        const enrollments = await query(
            'SELECT 1 FROM user_enrollments WHERE user_id = ? AND course_id = ?',
            [userId, courseId]
        ) as RowDataPacket[];
        return enrollments.length > 0;
    }

    static async enrollUser(userId: number, courseId: number): Promise<void> {
        await query(
            'INSERT INTO user_enrollments (user_id, course_id) VALUES (?, ?)',
            [userId, courseId]
        );
      }

    static async getTopicProgress(userId: number, courseId: number): Promise<{ [topicId: number]: boolean }> {
        const progress = await query(
            `SELECT t.id, COALESCE(utp.completed, false) as completed
            FROM topics t
            LEFT JOIN user_topic_progress utp 
                ON t.id = utp.topic_id 
                AND utp.user_id = ?
            WHERE t.course_id = ?`,
            [userId, courseId]
        ) as TopicProgress[];

        return progress.reduce((acc: { [key: number]: boolean }, row: TopicProgress) => {
            acc[row.id] = row.completed === 1;
            return acc;
        }, {});
    }

    static async markTopicComplete(userId: number, topicId: number): Promise<void> {
        await query(
            `INSERT INTO user_topic_progress (user_id, topic_id, completed, completed_at)
            VALUES (?, ?, true, NOW())
            ON DUPLICATE KEY UPDATE completed = true, completed_at = NOW()`,
            [userId, topicId]
        );
  }
} 