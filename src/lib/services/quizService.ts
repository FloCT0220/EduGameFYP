import { query } from '../db';

export interface QuizQuestion {
  id: string;
  subject_id: number;
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
  subject_id: number;
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

export interface QuizResult {
  attempt: QuizAttempt;
  answers: QuizAnswer[];
  questions: QuizQuestion[];
}

export interface QuizStats {
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  totalPointsEarned: number;
  currentStreak: number;
  maxStreak: number;
}

export interface SubmitQuizData {
  userId: number;
  subjectId: number;
  nodeId: string;
  answers: {
    questionId: string;
    selectedAnswer: number;
    timeTaken?: number;
  }[];
  timeTaken?: number;
}

export interface QuizReviewData {
  attempt: QuizAttempt;
  results: {
    question: QuizQuestion;
    userAnswer?: number;
    isCorrect: boolean;
    pointsEarned: number;
    timeTaken?: number;
  }[];
}

// Service functions
export class QuizService {
  
  // Get quiz questions for a specific subject and node
  static async getQuizQuestions(subjectId: number, nodeId: string): Promise<QuizQuestion[]> {
    const questions = await query(
      'SELECT * FROM quiz_questions WHERE subject_id = ? AND node_id = ? AND is_active = true ORDER BY RAND() LIMIT 10',
      [subjectId, nodeId]
    );
    return questions as QuizQuestion[];
  }

  // Get all quiz questions for admin
  static async getAllQuizQuestions(): Promise<QuizQuestion[]> {
    const questions = await query(
      'SELECT * FROM quiz_questions ORDER BY subject_id, node_id, id'
    );
    return questions as QuizQuestion[];
  }

  // Get a specific quiz question by id
  static async getQuizQuestion(id: string): Promise<QuizQuestion | null> {
    const questions = await query(
      'SELECT * FROM quiz_questions WHERE id = ? AND is_active = true',
      [id]
    );
    const questionArray = questions as QuizQuestion[];
    return questionArray.length > 0 ? questionArray[0] : null;
  }

  // Submit quiz attempt
  static async submitQuizAttempt(data: SubmitQuizData): Promise<QuizResult> {
    const { userId, subjectId, nodeId, answers, timeTaken } = data;
    
    // Get all questions for this quiz
    const allQuestions = await QuizService.getQuizQuestions(subjectId, nodeId);
    
    // Calculate results
    let correctAnswers = 0;
    let totalPoints = 0;
    const results: QuizAnswer[] = [];
    
    for (const question of allQuestions) {
      const userAnswer = answers.find(a => a.questionId === question.id);
      const isCorrect = userAnswer?.selectedAnswer === question.correct_answer;
      const pointsEarned = isCorrect ? question.points : 0;
      
      if (isCorrect) correctAnswers++;
      totalPoints += pointsEarned;
      
      results.push({
        id: 0, // Will be set after insertion
        attempt_id: 0, // Will be set after insertion
        question_id: question.id,
        selected_answer: userAnswer?.selectedAnswer,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        time_taken: userAnswer?.timeTaken
      });
    }
    
    const scorePercentage = (correctAnswers / allQuestions.length) * 100;
    
    // Create quiz attempt
    const attemptResult = await query(
      `INSERT INTO quiz_attempts 
       (user_id, subject_id, node_id, questions_total, questions_correct, score_percentage, points_earned, time_bonus, streak_bonus, total_points, max_streak, time_taken, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [userId, subjectId, nodeId, allQuestions.length, correctAnswers, scorePercentage, totalPoints, 0, 0, totalPoints, 0, timeTaken]
    );
    
    const attemptId = (attemptResult as any).insertId;
    
    // Insert quiz answers
    for (const result of results) {
      await query(
        `INSERT INTO quiz_answers 
      (attempt_id, question_id, selected_answer, is_correct, points_earned, time_taken)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          attemptId, result.question_id, result.selected_answer,
          result.is_correct, result.points_earned, result.time_taken
        ]
      );
    }
    
    // Get the complete attempt record
    const attempt = await query(
      'SELECT * FROM quiz_attempts WHERE id = ?',
      [attemptId]
    );
    
    return {
      attempt: (attempt as QuizAttempt[])[0],
      answers: results,
      questions: allQuestions
    };
  }

  // Get quiz review data
  static async getQuizReview(attemptId: number): Promise<QuizReviewData | null> {
    // Get attempt details
    const attempts = await query(
      'SELECT * FROM quiz_attempts WHERE id = ?',
      [attemptId]
    );
    
    if ((attempts as QuizAttempt[]).length === 0) {
      return null;
    }
    
    const attempt = (attempts as QuizAttempt[])[0];
    
    // Get quiz answers with questions
    const answersData = await query(
      `SELECT 
        qa.question_id,
        qa.selected_answer,
        qa.is_correct,
        qa.points_earned,
        qa.time_taken,
        qq.question,
        qq.option_a,
        qq.option_b,
        qq.option_c,
        qq.option_d,
        qq.correct_answer,
        qq.points,
        qq.difficulty
      FROM quiz_answers qa
      JOIN quiz_questions qq ON qa.question_id = qq.id
      WHERE qa.attempt_id = ?
      ORDER BY qq.id`,
      [attemptId]
    );
    
    const results: QuizReviewData['results'] = [];
    
    for (const row of answersData as any[]) {
      const question: QuizQuestion = {
        id: row.question_id,
        subject_id: attempt.subject_id,
        node_id: attempt.node_id,
        question: row.question,
        option_a: row.option_a,
        option_b: row.option_b,
        option_c: row.option_c,
        option_d: row.option_d,
        correct_answer: row.correct_answer,
        points: row.points,
        difficulty: row.difficulty,
        is_active: true
      };
      
      results.push({
        question,
        userAnswer: row.selected_answer,
        isCorrect: row.is_correct,
        pointsEarned: row.points_earned,
        timeTaken: row.time_taken
      });
    }
    
    return {
      attempt,
      results
    };
  }

  // Get quiz statistics for a user
  static async getQuizStats(userId: number): Promise<QuizStats> {
    const stats = await query(
      `SELECT 
        COUNT(*) as totalAttempts,
        AVG(score_percentage) as averageScore,
        MAX(score_percentage) as bestScore,
        SUM(points_earned) as totalPointsEarned,
        MAX(max_streak) as maxStreak
      FROM quiz_attempts
      WHERE user_id = ?`,
      [userId]
    );
    
    // Get current streak from user table
    const userStats = await query(
      'SELECT current_streak FROM users WHERE id = ?',
      [userId]
    );
    
    const statsData = (stats as any[])[0];
    const userData = (userStats as any[])[0];
    
    return {
      totalAttempts: statsData.totalAttempts || 0,
      averageScore: statsData.averageScore || 0,
      bestScore: statsData.bestScore || 0,
      totalPointsEarned: statsData.totalPointsEarned || 0,
      currentStreak: userData?.current_streak || 0,
      maxStreak: statsData.maxStreak || 0
    };
  }

  // Admin functions
  static async createQuizQuestion(questionData: Omit<QuizQuestion, 'id'>): Promise<QuizQuestion> {
    const result = await query(
      `INSERT INTO quiz_questions 
       (subject_id, node_id, question, option_a, option_b, option_c, option_d, correct_answer, points, difficulty, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        questionData.subject_id,
      questionData.node_id,
      questionData.question,
      questionData.option_a,
      questionData.option_b,
      questionData.option_c,
      questionData.option_d,
      questionData.correct_answer,
        questionData.points,
        questionData.difficulty,
        questionData.is_active
      ]
    );
    
    const insertId = (result as any).insertId;
    const newQuestion = await QuizService.getQuizQuestion(insertId.toString());
    return newQuestion!;
  }

  static async updateQuizQuestion(id: string, questionData: Partial<QuizQuestion>): Promise<QuizQuestion | null> {
    const updateFields = [];
    const updateValues = [];
    
    for (const [key, value] of Object.entries(questionData)) {
      if (value !== undefined && key !== 'id') {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    }
    
    if (updateFields.length === 0) {
      return await QuizService.getQuizQuestion(id);
    }
    
    updateValues.push(id);
    
    await query(
      `UPDATE quiz_questions SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    return await QuizService.getQuizQuestion(id);
  }

  static async deleteQuizQuestion(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM quiz_questions WHERE id = ?',
      [id]
    );
    
    return (result as any).affectedRows > 0;
  }
} 