import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// POST /api/coding-challenges/submit - Submit a solution
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = verifyToken(token || '');
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { challenge_id, language, source_code } = body;

    // Validate input
    if (!challenge_id || !language || !source_code) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify challenge exists and is active
    const challengeQuery = `
      SELECT id, difficulty, points_easy, points_intermediate, points_hard, supported_languages
      FROM coding_challenges 
      WHERE id = ? AND is_active = TRUE
    `;
    
    const challenges = await query(challengeQuery, [challenge_id]);
    
    if (!Array.isArray(challenges) || challenges.length === 0) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const challenge = challenges[0] as any;
    const supportedLanguages = JSON.parse(challenge.supported_languages || '[]');
    
    if (!supportedLanguages.includes(language)) {
      return NextResponse.json({ error: 'Language not supported for this challenge' }, { status: 400 });
    }

    // Create submission record
    const submissionResult = await query(`
      INSERT INTO coding_submissions (
        user_id, challenge_id, language, source_code, status
      ) VALUES (?, ?, ?, ?, 'pending')
    `, [user.id, challenge_id, language, source_code]) as { insertId: number };

    const submissionId = submissionResult.insertId;

    // Get test cases for the challenge
    const testCasesQuery = `
      SELECT id, input_data, expected_output, weight
      FROM coding_test_cases 
      WHERE challenge_id = ?
      ORDER BY id ASC
    `;
    
    const testCases = await query(testCasesQuery, [challenge_id]);

    if (!Array.isArray(testCases) || testCases.length === 0) {
      // No test cases - mark as compilation error
      await query(`
        UPDATE coding_submissions 
        SET status = 'compilation_error', 
            error_message = 'No test cases available',
            judged_at = NOW()
        WHERE id = ?
      `, [submissionId]);
      
      return NextResponse.json({ 
        submissionId,
        status: 'compilation_error',
        message: 'No test cases available for this challenge'
      });
    }

    // Execute code against test cases (simplified simulation)
    const results = await executeCode(source_code, language, testCases);
    
    // Calculate score and status
    const totalTestCases = testCases.length;
    let passedTestCases = 0;
    let totalWeight = 0;
    let passedWeight = 0;

    // Process test case results
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i] as any;
      const result = results[i];
      
      totalWeight += testCase.weight;
      
      if (result.status === 'passed') {
        passedTestCases++;
        passedWeight += testCase.weight;
      }

      // Insert test case result
      await query(`
        INSERT INTO coding_submission_results (
          submission_id, test_case_id, status, execution_time, 
          memory_used, actual_output, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        submissionId,
        testCase.id,
        result.status,
        result.execution_time || null,
        result.memory_used || null,
        result.actual_output || '',
        result.error_message || null
      ]);
    }

    // Calculate final score and status
    const scorePercentage = totalWeight > 0 ? (passedWeight / totalWeight) * 100 : 0;
    let finalStatus = 'wrong_answer';
    
    if (scorePercentage === 100) {
      finalStatus = 'accepted';
    } else if (passedTestCases > 0) {
      finalStatus = 'wrong_answer';
    } else {
      finalStatus = 'runtime_error';
    }

    // Calculate points earned based on difficulty and score
    const pointsMap = {
      easy: challenge.points_easy,
      intermediate: challenge.points_intermediate,
      hard: challenge.points_hard
    };
    
    const maxPoints = pointsMap[challenge.difficulty as keyof typeof pointsMap] || 10;
    const pointsEarned = finalStatus === 'accepted' ? maxPoints : Math.floor(maxPoints * (scorePercentage / 100));

    // Update submission with final results
    await query(`
      UPDATE coding_submissions 
      SET 
        status = ?,
        test_cases_passed = ?,
        test_cases_total = ?,
        score = ?,
        points_earned = ?,
        judged_at = NOW()
      WHERE id = ?
    `, [
      finalStatus,
      passedTestCases,
      totalTestCases,
      scorePercentage,
      pointsEarned,
      submissionId
    ]);

    // Update user stats and points if accepted
    if (finalStatus === 'accepted') {
      // Update user total points
      await query(`
        UPDATE users 
        SET total_points = total_points + ?
        WHERE id = ?
      `, [pointsEarned, user.id]);

      // Update user coding stats
      await query(`
        INSERT INTO user_coding_stats (
          user_id, challenges_attempted, challenges_solved, 
          total_submissions, total_coding_points,
          ${challenge.difficulty}_solved,
          last_submission_at
        ) VALUES (?, 1, 1, 1, ?, 1, NOW())
        ON DUPLICATE KEY UPDATE
          challenges_solved = challenges_solved + (CASE WHEN (
            SELECT COUNT(*) FROM coding_submissions 
            WHERE user_id = ? AND challenge_id = ? AND status = 'accepted'
          ) = 1 THEN 1 ELSE 0 END),
          total_submissions = total_submissions + 1,
          total_coding_points = total_coding_points + ?,
          ${challenge.difficulty}_solved = ${challenge.difficulty}_solved + (CASE WHEN (
            SELECT COUNT(*) FROM coding_submissions 
            WHERE user_id = ? AND challenge_id = ? AND status = 'accepted'
          ) = 1 THEN 1 ELSE 0 END),
          last_submission_at = NOW()
      `, [
        pointsEarned,
        user.id, challenge_id,
        pointsEarned,
        user.id, challenge_id
      ]);
    } else {
      // Update stats for non-accepted submissions
      await query(`
        INSERT INTO user_coding_stats (
          user_id, challenges_attempted, total_submissions, last_submission_at
        ) VALUES (?, 1, 1, NOW())
        ON DUPLICATE KEY UPDATE
          challenges_attempted = challenges_attempted + (CASE WHEN (
            SELECT COUNT(DISTINCT challenge_id) FROM coding_submissions 
            WHERE user_id = ?
          ) > (SELECT challenges_attempted FROM user_coding_stats WHERE user_id = ? LIMIT 1) THEN 1 ELSE 0 END),
          total_submissions = total_submissions + 1,
          last_submission_at = NOW()
      `, [user.id, user.id, user.id]);
    }

    return NextResponse.json({
      submissionId,
      status: finalStatus,
      score: scorePercentage,
      test_cases_passed: passedTestCases,
      test_cases_total: totalTestCases,
      points_earned: pointsEarned,
      message: getStatusMessage(finalStatus, scorePercentage)
    });

  } catch (error) {
    console.error('Error submitting solution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Simplified code execution simulation
async function executeCode(sourceCode: string, language: string, testCases: any[]): Promise<any[]> {
  const results = [];

  for (const testCase of testCases) {
    try {
      // This is a simplified simulation - in production you'd use a proper code execution sandbox
      const inputData = JSON.parse(testCase.input_data);
      const expectedOutput = testCase.expected_output.trim();
      
      // Simple pattern matching for basic algorithms
      let actualOutput = '';
      let status = 'failed';
      
      // For demonstration, let's simulate some simple test cases
      if (language === 'python') {
        actualOutput = simulatePythonExecution(sourceCode, inputData);
      } else if (language === 'javascript') {
        actualOutput = simulateJavaScriptExecution(sourceCode, inputData);
      } else {
        actualOutput = simulateGenericExecution(sourceCode, inputData);
      }
      
      if (actualOutput.trim() === expectedOutput) {
        status = 'passed';
      }
      
      results.push({
        status,
        execution_time: Math.floor(Math.random() * 100) + 10, // Random execution time
        memory_used: Math.floor(Math.random() * 50) + 10,     // Random memory usage
        actual_output: actualOutput,
        error_message: status === 'passed' ? null : 'Output does not match expected result'
      });
    } catch (error) {
      results.push({
        status: 'error',
        execution_time: null,
        memory_used: null,
        actual_output: '',
        error_message: 'Runtime error during execution'
      });
    }
  }

  return results;
}

function simulatePythonExecution(code: string, input: any): string {
  // Very basic simulation for demo purposes
  if (code.includes('return a + b') || code.includes('return a+b')) {
    if (typeof input.a === 'number' && typeof input.b === 'number') {
      return (input.a + input.b).toString();
    }
  }
  if (code.includes('return sum(') && Array.isArray(input.arr)) {
    return input.arr.reduce((a: number, b: number) => a + b, 0).toString();
  }
  return '0'; // Default output
}

function simulateJavaScriptExecution(code: string, input: any): string {
  // Very basic simulation for demo purposes
  if (code.includes('return a + b') || code.includes('return a+b')) {
    if (typeof input.a === 'number' && typeof input.b === 'number') {
      return (input.a + input.b).toString();
    }
  }
  if (code.includes('reduce(') && Array.isArray(input.arr)) {
    return input.arr.reduce((a: number, b: number) => a + b, 0).toString();
  }
  return '0'; // Default output
}

function simulateGenericExecution(code: string, input: any): string {
  // Very basic simulation - just return first input value or 0
  const values = Object.values(input);
  return values.length > 0 ? String(values[0]) : '0';
}

function getStatusMessage(status: string, score: number): string {
  switch (status) {
    case 'accepted':
      return `🎉 Accepted! Perfect solution with ${score}% score.`;
    case 'wrong_answer':
      return `❌ Wrong Answer. Your solution passed ${score}% of test cases.`;
    case 'runtime_error':
      return `💥 Runtime Error. Please check your code for errors.`;
    case 'time_limit_exceeded':
      return `⏰ Time Limit Exceeded. Your solution is too slow.`;
    case 'memory_limit_exceeded':
      return `💾 Memory Limit Exceeded. Your solution uses too much memory.`;
    case 'compilation_error':
      return `🔧 Compilation Error. Please fix syntax errors in your code.`;
    default:
      return `⏳ Your solution is being evaluated...`;
  }
} 