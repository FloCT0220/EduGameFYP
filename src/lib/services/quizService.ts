import { query } from '../db';

export interface QuizQuestion {
  id: number;
  question_id: string;
  course_id: number;
  node_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: number;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  is_active: boolean;
}

export interface QuizAttempt {
  id: number;
  user_id: number;
  course_id: number;
  node_id: string;
  questions_total: number;
  questions_correct: number;
  score_percentage: number;
  points_earned: number;
  time_bonus: number;
  streak_bonus: number;
  total_points: number;
  max_streak: number;
  time_taken?: number;
  started_at: Date;
  completed_at?: Date;
}

export interface QuizAnswer {
  id: number;
  attempt_id: number;
  question_id: string;
  selected_answer?: number;
  is_correct: boolean;
  points_earned: number;
  time_taken?: number;
}

export interface QuizAttemptData {
  user_id: number;
  course_id: number;
  node_id: string;
  questions_total: number;
  questions_correct: number;
  score_percentage: number;
  points_earned: number;
  time_bonus: number;
  streak_bonus: number;
  total_points: number;
  max_streak: number;
  time_taken?: number;
  completed_at: Date;
}

export interface QuizAnswerData {
  question_id: string;
  selected_answer?: number;
  is_correct: boolean;
  points_earned: number;
  time_taken?: number;
}

export class QuizService {
  // Get quiz questions for a specific node
  static async getQuizQuestions(courseId: number, nodeId: string): Promise<QuizQuestion[]> {
    return await query(`
      SELECT * FROM quiz_questions
      WHERE subject_id = ? AND node_id = ? AND is_active = true
      ORDER BY RAND()
    `, [courseId, nodeId]) as QuizQuestion[];
  }

  // Get cumulative quiz questions (current lesson + all previous lessons)
  static async getCumulativeQuizQuestions(courseId: number, topicId: number): Promise<QuizQuestion[]> {
    try {
      // First, get the current topic's lesson_order
      const currentTopic = await query(`
        SELECT lesson_order FROM topics 
        WHERE id = ? AND course_id = ?
      `, [topicId, courseId]) as { lesson_order: number }[];

      if (currentTopic.length === 0) {
        return [];
      }

      const currentLessonOrder = currentTopic[0].lesson_order;

      // Get all topic IDs up to and including the current lesson_order
      const eligibleTopics = await query(`
        SELECT id FROM topics 
        WHERE course_id = ? AND lesson_order <= ? AND is_published = true
        ORDER BY lesson_order
      `, [courseId, currentLessonOrder]) as { id: number }[];

      if (eligibleTopics.length === 0) {
        return [];
      }

      // Get quiz questions for all eligible topics (simplified approach)
      const topicIds = eligibleTopics.map(topic => topic.id.toString());
      const placeholders = topicIds.map(() => '?').join(', ');
      
      const questions = await query(`
        SELECT * FROM quiz_questions
        WHERE subject_id = ? AND node_id IN (${placeholders}) AND is_active = true
        ORDER BY RAND()
      `, [courseId, ...topicIds]) as QuizQuestion[];

      return questions;
    } catch (error) {
      console.error('Error in getCumulativeQuizQuestions:', error);
      // Fallback to single topic if there's an error
      return await this.getQuizQuestions(courseId, topicId.toString());
    }
  }

  // Get a specific quiz question by question_id
  static async getQuizQuestion(questionId: string): Promise<QuizQuestion | null> {
    const result = await query(`
      SELECT * FROM quiz_questions
      WHERE question_id = ? AND is_active = true
    `, [questionId]) as QuizQuestion[];
    
    return result.length > 0 ? result[0] : null;
  }

  // Save quiz attempt
  static async saveQuizAttempt(attemptData: QuizAttemptData): Promise<number> {
    const result = await query(`
      INSERT INTO quiz_attempts 
      (user_id, course_id, node_id, questions_total, questions_correct, 
       score_percentage, points_earned, time_bonus, streak_bonus, 
       total_points, max_streak, time_taken, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      attemptData.user_id,
      attemptData.course_id,
      attemptData.node_id,
      attemptData.questions_total,
      attemptData.questions_correct,
      attemptData.score_percentage,
      attemptData.points_earned,
      attemptData.time_bonus,
      attemptData.streak_bonus,
      attemptData.total_points,
      attemptData.max_streak,
      attemptData.time_taken || null,
      attemptData.completed_at
    ]) as { insertId: number };
    
    return result.insertId;
  }

  // Save quiz answers
  static async saveQuizAnswers(attemptId: number, answers: QuizAnswerData[]): Promise<void> {
    if (answers.length === 0) return;
    
    const values = answers.map(answer => [
      attemptId,
      answer.question_id,
      answer.selected_answer ?? null,
      answer.is_correct,
      answer.points_earned,
      answer.time_taken ?? null
    ]);
    
    const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
    const flatValues = values.flat();
    
    await query(`
      INSERT INTO quiz_answers 
      (attempt_id, question_id, selected_answer, is_correct, points_earned, time_taken)
      VALUES ${placeholders}
    `, flatValues);
  }

  // Get user's quiz attempts for a specific node
  static async getUserQuizAttempts(
    userId: number, 
    courseId: number, 
    nodeId: string
  ): Promise<QuizAttempt[]> {
    return await query(`
      SELECT * FROM quiz_attempts
      WHERE user_id = ? AND course_id = ? AND node_id = ?
      ORDER BY started_at DESC
    `, [userId, courseId, nodeId]) as QuizAttempt[];
  }

  // Get user's best quiz attempt for a node
  static async getUserBestAttempt(
    userId: number, 
    courseId: number, 
    nodeId: string
  ): Promise<QuizAttempt | null> {
    const result = await query(`
      SELECT * FROM quiz_attempts
      WHERE user_id = ? AND course_id = ? AND node_id = ?
      ORDER BY score_percentage DESC, total_points DESC
      LIMIT 1
    `, [userId, courseId, nodeId]) as QuizAttempt[];
    
    return result.length > 0 ? result[0] : null;
  }

  // Get quiz attempt details with answers
  static async getQuizAttemptDetails(attemptId: number): Promise<{
    attempt: QuizAttempt;
    answers: QuizAnswer[];
    questions: QuizQuestion[];
  } | null> {
    // Get attempt
    const attempts = await query(`
      SELECT * FROM quiz_attempts WHERE id = ?
    `, [attemptId]) as QuizAttempt[];
    
    if (attempts.length === 0) return null;
    
    const attempt = attempts[0];
    
    // Get answers
    const answers = await query(`
      SELECT * FROM quiz_answers WHERE attempt_id = ?
    `, [attemptId]) as QuizAnswer[];
    
    // Get questions
    const questionIds = answers.map(a => a.question_id);
    if (questionIds.length === 0) {
      return { attempt, answers: [], questions: [] };
    }
    
    const placeholders = questionIds.map(() => '?').join(', ');
    const questions = await query(`
      SELECT * FROM quiz_questions 
      WHERE question_id IN (${placeholders})
    `, questionIds) as QuizQuestion[];
    
    return { attempt, answers, questions };
  }

  // Get quiz statistics for a node
  static async getQuizStatistics(courseId: number, nodeId: string): Promise<{
    total_attempts: number;
    total_users: number;
    average_score: number;
    best_score: number;
    completion_rate: number;
  }> {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_attempts,
        COUNT(DISTINCT user_id) as total_users,
        AVG(score_percentage) as average_score,
        MAX(score_percentage) as best_score,
        (COUNT(CASE WHEN score_percentage >= 70 THEN 1 END) * 100.0 / COUNT(*)) as completion_rate
      FROM quiz_attempts
      WHERE course_id = ? AND node_id = ?
    `, [courseId, nodeId]) as {
      total_attempts: number;
      total_users: number;
      average_score: number;
      best_score: number;
      completion_rate: number;
    }[];

    return stats[0] || {
      total_attempts: 0,
      total_users: 0,
      average_score: 0,
      best_score: 0,
      completion_rate: 0
    };
  }

  // Create a new quiz question
  static async createQuizQuestion(questionData: {
    question_id: string;
    course_id: number;
    node_id: string;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: number;
    points?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
  }): Promise<number> {
    const result = await query(`
      INSERT INTO quiz_questions 
      (question_id, course_id, node_id, question, option_a, option_b, 
       option_c, option_d, correct_answer, points, difficulty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      questionData.question_id,
      questionData.course_id,
      questionData.node_id,
      questionData.question,
      questionData.option_a,
      questionData.option_b,
      questionData.option_c,
      questionData.option_d,
      questionData.correct_answer,
      questionData.points || 10,
      questionData.difficulty || 'easy'
    ]) as { insertId: number };
    
    return result.insertId;
  }

  // Update quiz question
  static async updateQuizQuestion(
    questionId: string, 
    updateData: Partial<QuizQuestion>
  ): Promise<void> {
    const fields = Object.keys(updateData).filter(key => 
      key !== 'id' && key !== 'question_id'
    );
    if (fields.length === 0) return;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updateData[field as keyof QuizQuestion] ?? null);
    
    await query(`
      UPDATE quiz_questions 
      SET ${setClause}
      WHERE question_id = ?
    `, [...values, questionId]);
  }

  // Delete quiz question (soft delete)
  static async deleteQuizQuestion(questionId: string): Promise<void> {
    await query(`
      UPDATE quiz_questions 
      SET is_active = false
      WHERE question_id = ?
    `, [questionId]);
  }

  // Get user's quiz performance summary
  static async getUserQuizPerformance(userId: number): Promise<{
    total_attempts: number;
    total_questions_answered: number;
    total_correct_answers: number;
    average_score: number;
    total_points_earned: number;
    best_streak: number;
  }> {
    const performance = await query(`
      SELECT 
        COUNT(qa.id) as total_attempts,
        SUM(qa.questions_total) as total_questions_answered,
        SUM(qa.questions_correct) as total_correct_answers,
        AVG(qa.score_percentage) as average_score,
        SUM(qa.total_points) as total_points_earned,
        MAX(qa.max_streak) as best_streak
      FROM quiz_attempts qa
      WHERE qa.user_id = ?
    `, [userId]) as {
      total_attempts: number;
      total_questions_answered: number;
      total_correct_answers: number;
      average_score: number;
      total_points_earned: number;
      best_streak: number;
    }[];

    return performance[0] || {
      total_attempts: 0,
      total_questions_answered: 0,
      total_correct_answers: 0,
      average_score: 0,
      total_points_earned: 0,
      best_streak: 0
    };
  }
} 