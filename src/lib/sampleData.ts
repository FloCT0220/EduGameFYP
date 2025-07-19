import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { createPool } from './db';

// Insert default data
export const insertDefaultData = async () => {
  const pool = createPool();

  try {
    // Check if admin user exists
    const [adminExists] = await pool.execute(
      'SELECT id FROM users WHERE role = "admin" LIMIT 1'
    );

    if ((adminExists as mysql.RowDataPacket[]).length === 0) {
      // Create default admin user
      const hashedPassword = await bcrypt.hash('123', 10);
      
      await pool.execute(
        'INSERT INTO users (username, email, password, role, total_points) VALUES (?, ?, ?, ?, ?)',
        [
          'admin', 'admin@email.com', hashedPassword, 'admin', 1000
        ]
      );
      
      console.log('✅ Default admin user created');
    }


    // Insert sample courses if none exist
    const [coursesExist] = await pool.execute(
      'SELECT id FROM courses LIMIT 1'
    );

    if ((coursesExist as mysql.RowDataPacket[]).length === 0) {
      const sampleCourses = [
        [
          'Introduction to Programming',
          'Learn the fundamentals of programming with hands-on examples and interactive exercises.',
          'beginner'
        ],
        [
          'Web Development Basics',
          'Master HTML, CSS, and JavaScript to build amazing websites from scratch.',
          'beginner'
        ],
        [
          'Database Design',
          'Learn how to design efficient and scalable database systems.',
          'intermediate'
        ]
      ];

      for (const course of sampleCourses) {
        await pool.execute(
          'INSERT INTO courses (title, description, difficulty_level, is_published) VALUES (?, ?, ?, ?)',
          [...course, true]
        );
      }
      console.log('✅ Sample courses created');
      
      // Insert sample topics for the courses
      const [topicsExist] = await pool.execute(
        'SELECT id FROM topics LIMIT 1'
      );

      if ((topicsExist as mysql.RowDataPacket[]).length === 0) {
        const defaultSections = [
          {
            title: "Introduction",
            content: "Welcome to this lesson! In this topic, we'll explore the fundamental concepts and practical applications."
          },
          {
            title: "Key Concepts",
            content: "Let's dive into the core principles that make this topic important in modern development."
          },
          {
            title: "Practical Examples",
            content: "Here are some real-world examples of how this topic is used in professional development environments."
          },
          {
            title: "Best Practices",
            content: "To master this topic, follow these industry-standard best practices and guidelines."
          },
          {
            title: "Summary",
            content: "You've now learned the essential concepts. Take the quiz below to test your understanding and earn points!"
          }
        ];
        const sampleTopics = [
          // Course 1: Introduction to Programming
          [1, 'Understanding Variables and Data Types', 'Learn about different types of variables and how to use them effectively in programming. This lesson covers basic data types, variable declaration, and best practices for naming variables.', 1, 30, JSON.stringify(defaultSections)],
          // Course 2: Web Development Basics  
          [2, 'HTML Basics', 'Learn the fundamentals of HTML and document structure. Master essential HTML tags, semantic markup, and how to create well-structured web pages.', 1, 25, JSON.stringify(defaultSections)],
          [2, 'CSS Styling', 'Master CSS for styling web pages and creating responsive designs. Learn selectors, properties, layout techniques, and modern CSS practices.', 2, 35, JSON.stringify(defaultSections)],
          [2, 'JavaScript Fundamentals', 'Introduction to JavaScript programming for web interactivity. Cover variables, functions, DOM manipulation, and event handling.', 3, 40, JSON.stringify(defaultSections)],
          [2, 'Building a Simple Website', 'Put it all together by building a complete website. Apply HTML, CSS, and JavaScript skills to create an interactive web project.', 4, 50, JSON.stringify(defaultSections)],
          // Course 3: Database Design
          [3, 'Introduction to Databases', 'Understanding database concepts and types. Learn about relational databases, DBMS, and fundamental database principles.', 1, 30, JSON.stringify(defaultSections)],
          [3, 'SQL Basics', 'Learn fundamental SQL queries and database operations. Master SELECT, INSERT, UPDATE, DELETE commands and basic joins.', 2, 40, JSON.stringify(defaultSections)],
          [3, 'Database Normalization', 'Master the principles of database normalization and design. Learn about normal forms and how to design efficient database schemas.', 3, 45, JSON.stringify(defaultSections)],
          [3, 'Advanced Queries and Optimization', 'Learn advanced SQL queries and performance optimization. Cover complex joins, subqueries, and indexing strategies.', 4, 50, JSON.stringify(defaultSections)]
        ];
        for (const topic of sampleTopics) {
          await pool.execute(
            'INSERT INTO topics (course_id, title, content, lesson_order, points_reward, structured_content, is_published) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [...topic, true]
          );
        }
        console.log('✅ Sample topics created');
      }

      // Insert sample user enrollments
      const [enrollmentsExist] = await pool.execute(
        'SELECT id FROM user_enrollments LIMIT 1'
      );

      if ((enrollmentsExist as mysql.RowDataPacket[]).length === 0) {
        const [adminUser] = await pool.execute(
          'SELECT id FROM users WHERE role = "admin" LIMIT 1'
        ) as [mysql.RowDataPacket[], mysql.FieldPacket[]];

        if (adminUser.length > 0) {
          const adminId = adminUser[0].id;
          
          // Enroll admin in all sample courses
          const enrollments = [
            [adminId, 1, 0, 0], // Course 1
            [adminId, 2, 0, 0], // Course 2  
            [adminId, 3, 0, 0]  // Course 3
          ];

          for (const enrollment of enrollments) {
            await pool.execute(
              'INSERT IGNORE INTO user_enrollments (user_id, course_id, progress_percentage, total_points_earned) VALUES (?, ?, ?, ?)',
              enrollment
            );
          }
          console.log('✅ Sample user enrollments created');
        }
      }
    }

    // Insert sample quiz questions if none exist
    const [quizQuestionsExist] = await pool.execute(
      'SELECT id FROM quiz_questions LIMIT 1'
    );

    if ((quizQuestionsExist as mysql.RowDataPacket[]).length === 0) {
      const sampleQuizQuestions = [
        // Topic 1 - Understanding Variables and Data Types (Course 1, Topic ID 1)
        [1, 1, 'What is a variable in programming?', JSON.stringify(['A constant value that never changes', 'A named storage location for data', 'A mathematical function', 'A type of programming language']), 1, 10, 'easy'],
        [1, 1, 'Which of the following is a primitive data type?', JSON.stringify(['Array', 'Object', 'Integer', 'Function']), 2, 10, 'easy'],
        [1, 1, 'What is the difference between a variable and a constant?', JSON.stringify(['There is no difference', 'Variables can change, constants cannot', 'Constants can change, variables cannot', 'Both can change freely']), 1, 15, 'medium'],
        [1, 1, 'Which naming convention is considered best practice for variables?', JSON.stringify(['using spaces', 'camelCase or snake_case', 'ALL_CAPS', 'random-symbols']), 1, 15, 'medium'],

        // Topic 2 - HTML Basics (Course 2, Topic ID 2)
        [2, 2, 'What does HTML stand for?', JSON.stringify(['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlink Text Markup Language']), 0, 10, 'easy'],
        [2, 2, 'Which HTML tag is used to define the main content of a document?', JSON.stringify(['<body>', '<main>', '<content>', '<section>']), 0, 10, 'easy'],
        [2, 2, 'What is the correct syntax for creating a link in HTML?', JSON.stringify(['<a href="url">Link text</a>', '<link url="url">Link text</link>', '<a src="url">Link text</a>', '<href="url">Link text</href>']), 0, 15, 'medium'],
        [2, 2, 'What is the purpose of the DOCTYPE declaration?', JSON.stringify(['To define CSS styles', 'To declare the HTML version', 'To include JavaScript', 'To create comments']), 1, 15, 'medium'],

        // Topic 3 - CSS Styling (Course 2, Topic ID 3)
        [2, 3, 'What does CSS stand for?', JSON.stringify(['Computer Style Sheets', 'Creative Style Sheets', 'Cascading Style Sheets', 'Colorful Style Sheets']), 2, 10, 'easy'],
        [2, 3, 'Which property is used to change the text color of an element?', JSON.stringify(['color', 'text-color', 'font-color', 'background-color']), 0, 10, 'easy'],
        [2, 3, 'How do you select an element with id "header" in CSS?', JSON.stringify(['.header', '#header', 'header', '*header']), 1, 15, 'medium'],
        [2, 3, 'Which CSS property controls the spacing between elements?', JSON.stringify(['margin', 'padding', 'spacing', 'gap']), 0, 10, 'easy'],

        // Topic 4 - JavaScript Fundamentals (Course 2, Topic ID 4)
        [2, 4, 'Which of the following is the correct way to declare a variable in JavaScript?', JSON.stringify(['var myVar = 5;', 'variable myVar = 5;', 'v myVar = 5;', 'declare myVar = 5;']), 0, 10, 'easy'],
        [2, 4, 'What is the result of 5 + "5" in JavaScript?', JSON.stringify(['10', '55', 'Error', 'undefined']), 1, 15, 'medium'],
        [2, 4, 'Which method is used to write content to the browser console?', JSON.stringify(['console.write()', 'console.log()', 'console.print()', 'console.output()']), 1, 10, 'easy'],

        // Topic 5 - Building a Simple Website (Course 2, Topic ID 5)
        [2, 5, 'What does DOM stand for?', JSON.stringify(['Document Object Model', 'Dynamic Object Management', 'Data Object Model', 'Document Oriented Model']), 0, 10, 'easy'],
        [2, 5, 'Which method is used to select an element by its ID?', JSON.stringify(['getElementById()', 'getElementByID()', 'selectById()', 'findById()']), 0, 10, 'easy'],
        [2, 5, 'How do you change the text content of an element?', JSON.stringify(['element.text = "new text"', 'element.innerHTML = "new text"', 'element.textContent = "new text"', 'element.content = "new text"']), 2, 15, 'medium'],

        // Database Design Course - Introduction to Databases
        [3, 6, 'What is a database?', JSON.stringify(['A collection of files', 'An organized collection of data', 'A programming language', 'A web server']), 1, 10, 'easy'],
        [3, 6, 'What does SQL stand for?', JSON.stringify(['Structured Query Language', 'Simple Query Language', 'Standard Query Language', 'System Query Language']), 0, 10, 'easy'],
        [3, 6, 'Which command is used to retrieve data from a database?', JSON.stringify(['GET', 'FETCH', 'SELECT', 'RETRIEVE']), 2, 15, 'medium'],

        // Database Design Course - SQL Basics
        [3, 7, 'Which SQL statement is used to extract data from a database?', JSON.stringify(['EXTRACT', 'SELECT', 'GET', 'OPEN']), 1, 10, 'easy'],
        [3, 7, 'Which SQL keyword is used to eliminate duplicate rows?', JSON.stringify(['UNIQUE', 'DISTINCT', 'DIFFERENT', 'SINGLE']), 1, 10, 'easy'],
        [3, 7, 'What is the correct syntax for an INNER JOIN?', JSON.stringify(['SELECT * FROM table1 INNER JOIN table2 ON table1.id = table2.id', 'SELECT * FROM table1 JOIN table2 WHERE table1.id = table2.id', 'SELECT * FROM table1, table2 WHERE table1.id = table2.id', 'SELECT * FROM table1 INNER table2 ON table1.id = table2.id']), 0, 15, 'medium'],

        // Database Design Course - Database Normalization
        [3, 8, 'What is the main purpose of database normalization?', JSON.stringify(['To increase data redundancy', 'To reduce data redundancy and improve data integrity', 'To make queries slower', 'To increase storage space']), 1, 10, 'easy'],
        [3, 8, 'What is First Normal Form (1NF)?', JSON.stringify(['Tables must have primary keys', 'Each column must contain atomic values', 'No partial dependencies', 'No transitive dependencies']), 1, 15, 'medium'],
        [3, 8, 'What violates Third Normal Form (3NF)?', JSON.stringify(['Composite primary keys', 'Transitive dependencies', 'Atomic values', 'Foreign keys']), 1, 15, 'medium'],

        // Database Design Course - Advanced Queries and Optimization
        [3, 9, 'What is the purpose of database indexing?', JSON.stringify(['To slow down queries', 'To improve query performance', 'To increase storage space', 'To make data redundant']), 1, 10, 'easy'],
        [3, 9, 'Which type of index is automatically created for primary keys?', JSON.stringify(['Secondary index', 'Clustered index', 'Composite index', 'Partial index']), 1, 15, 'medium'],
        [3, 9, 'What is a subquery?', JSON.stringify(['A query that joins multiple tables', 'A query nested inside another query', 'A query that updates data', 'A query that creates indexes']), 1, 15, 'medium'],
        [3, 9, 'Which SQL clause is used to optimize queries by limiting result sets?', JSON.stringify(['WHERE', 'HAVING', 'LIMIT', 'ORDER BY']), 0, 10, 'easy'],
        [3, 9, 'What is query execution plan?', JSON.stringify(['A list of SQL commands', 'A roadmap showing how the database will execute a query', 'A backup of the database', 'A user interface design']), 1, 15, 'medium'],
        [3, 9, 'Which JOIN type returns all rows from both tables?', JSON.stringify(['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN']), 3, 15, 'medium'],
        [3, 9, 'What is the difference between UNION and UNION ALL?', JSON.stringify(['No difference', 'UNION removes duplicates, UNION ALL keeps duplicates', 'UNION ALL removes duplicates, UNION keeps duplicates', 'UNION is faster than UNION ALL']), 1, 20, 'hard'],
        [3, 9, 'Which statement about database views is correct?', JSON.stringify(['Views store actual data', 'Views are virtual tables based on SQL queries', 'Views cannot be queried', 'Views require more storage space']), 1, 15, 'medium']
      ];

      for (const question of sampleQuizQuestions) {
        await pool.execute(
          'INSERT INTO quiz_questions (course_id, topic_id, question, answers, correct_answer, points, difficulty, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [...question, true]
        );
      }
      console.log('✅ Sample quiz questions created');
    }

    // Insert coding challenges sample data
    const [codingChallengesExist] = await pool.execute(
      'SELECT id FROM coding_challenges LIMIT 1'
    );

    if ((codingChallengesExist as mysql.RowDataPacket[]).length === 0) {
      const [adminUser] = await pool.execute(
        'SELECT id FROM users WHERE role = "admin" LIMIT 1'
      ) as [mysql.RowDataPacket[], mysql.FieldPacket[]];

      if (adminUser.length > 0) {
        const adminId = adminUser[0].id;

        // Sample coding challenges with embedded code snippets and answers
        const codingChallenges = [
          [
            'Two Sum',
            'Find two numbers in an array that add up to a target sum.',
            'easy',
            10,
            'python',
            JSON.stringify([
              { id: '1', code: 'for i in range(len(nums)):' },
              { id: '2', code: 'for j in range(i + 1, len(nums)):' },
              { id: '3', code: 'if nums[i] + nums[j] == target:' },
              { id: '4', code: 'return [i, j]' },
              { id: '5', code: 'return []' }
            ]),
            JSON.stringify(['1', '2', '3', '4']),
            adminId, true
          ],
          [
            'Two Sum',
            'Find two numbers in an array that add up to a target sum.',
            'easy',
            10,
            'javascript',
            JSON.stringify([
              { id: '1', code: 'for (let i = 0; i < nums.length; i++) {' },
              { id: '2', code: 'for (let j = i + 1; j < nums.length; j++) {'},
              { id: '3', code: 'if (nums[i] + nums[j] === target) {' },
              { id: '4', code: 'return [i, j];' }
            ]),
            JSON.stringify(['1', '2', '3', '4']),
            adminId, true
          ],
          [
            'Reverse String',
            'Write a function that reverses a string.',
            'easy',
            10,
            'python',
            JSON.stringify([
              { id: '1', code: 'left = 0' },
              { id: '2', code: 'right = len(s) - 1' },
              { id: '3', code: 'while left < right:' },
              { id: '4', code: 's[left], s[right] = s[right], s[left]' },
              { id: '5', code: 'left += 1' },
              { id: '6', code: 'right -= 1' },
              { id: '7', code: 'return s' }
            ]),
            JSON.stringify(['1', '2', '3', '4', '5', '6', '7']),
            adminId, true
          ],
          [
            'Reverse String',
            'Write a function that reverses a string.',
            'easy',
            10,
            'javascript',
            JSON.stringify([
              { id: '1', code: 'let left = 0;'},
              { id: '2', code: 'let right = s.length - 1;'},
              { id: '3', code: 'while (left < right) {' },
              { id: '4', code: '[s[left], s[right]] = [s[right], s[left]];'},
              { id: '5', code: 'left++;' },
              { id: '6', code: 'right--;' },
              { id: '7', code: 'return s;'}
            ]),
            JSON.stringify(['1', '2', '3', '4']),
            adminId, true
          ],
          [
            'Add Two Numbers',
            'Add two numbers represented as linked lists.',
            'intermediate',
            20,
            'python',
            JSON.stringify([
              { id: '1', code: 'dummy = ListNode(0)' },
              { id: '2', code: 'current = dummy' },
              { id: '3', code: 'carry = 0' },
              { id: '4', code: 'while l1 or l2 or carry:' },
              { id: '5', code: 'x = l1.val if l1 else 0' },
              { id: '6', code: 'y = l2.val if l2 else 0' },
              { id: '7', code: 'sum_val = x + y + carry' },
              { id: '8', code: 'carry = sum_val // 10' },
              { id: '9', code: 'current.next = ListNode(sum_val % 10)' },
              { id: '10', code: 'current = current.next' },
              { id: '11', code: 'if l1: l1 = l1.next' },
              { id: '12', code: 'if l2: l2 = l2.next' },
              { id: '13', code: 'return dummy.next' }
            ]),
            JSON.stringify(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13']),
            adminId, true
          ],
          [
            'Maximum Subarray',
            'Find the contiguous subarray with the largest sum.',
            'intermediate',
            20,
            'python',
            JSON.stringify([
              { id: '1', code: 'max_current = nums[0]' },
              { id: '2', code: 'max_global = nums[0]' },
              { id: '3', code: 'for i in range(1, len(nums)):' },
              { id: '4', code: 'max_current = max(nums[i], max_current + nums[i])' },
              { id: '5', code: 'max_global = max(max_global, max_current)' },
              { id: '6', code: 'return max_global' }
            ]),
            JSON.stringify(['1', '2', '3', '4', '5', '6']),
            adminId, true
          ],
          [
            'Binary Tree Inorder Traversal',
            'Return the inorder traversal of a binary tree.',
            'hard',
            50,
            'python',
            JSON.stringify([
              { id: '1', code: 'result = []' },
              { id: '2', code: 'stack = []' },
              { id: '3', code: 'current = root' },
              { id: '4', code: 'while current or stack:' },
              { id: '5', code: 'while current:' },
              { id: '6', code: 'stack.append(current)' },
              { id: '7', code: 'current = current.left' },
              { id: '8', code: 'current = stack.pop()' },
              { id: '9', code: 'result.append(current.val)' },
              { id: '10', code: 'current = current.right' },
              { id: '11', code: 'return result' }
            ]),
            JSON.stringify(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']),
            adminId, true
          ]
        ];

        // Insert coding challenges
        for (const challenge of codingChallenges) {
          await pool.execute(
            `INSERT INTO coding_challenges 
            (title, description, difficulty, points, supported_language, code_snippets, correct_answer, created_by, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            challenge
          );
        }
        console.log('✅ Coding challenges created');
      }
    }

    console.log('✅ Default data inserted successfully');
  } catch (error) {
    console.error('❌ Error inserting default data:', error);
  }
}; 

// Sample coding challenges with new structure
export const sampleCodingChallenges = [
  {
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    difficulty: 'easy',
    points: 10,
    supported_language: 'python',
    code_snippets: [
      { id: '1', code: 'for i in range(len(nums)):', isCorrect: true },
      { id: '2', code: 'for j in range(i + 1, len(nums)):', isCorrect: true },
      { id: '3', code: 'if nums[i] + nums[j] == target:', isCorrect: true },
      { id: '4', code: 'return [i, j]', isCorrect: true },
      { id: '5', code: 'return []', isCorrect: true },
      { id: '6', code: 'for i in range(len(nums) - 1):', isCorrect: false },
      { id: '7', code: 'if nums[i] == target:', isCorrect: false },
      { id: '8', code: 'return i', isCorrect: false }
    ],
    correct_answer: ['1', '2', '3', '4']
  },
  {
    title: 'Reverse String',
    description: 'Write a function that reverses a string.',
    difficulty: 'easy',
    points: 5,
    supported_language: 'javascript',
    code_snippets: [
      { id: '1', code: 'let left = 0', isCorrect: true },
      { id: '2', code: 'let right = s.length - 1', isCorrect: true },
      { id: '3', code: 'while (left < right) {', isCorrect: true },
      { id: '4', code: '[s[left], s[right]] = [s[right], s[left]]', isCorrect: true },
      { id: '5', code: 'left++', isCorrect: true },
      { id: '6', code: 'right--', isCorrect: true },
      { id: '7', code: 'return s', isCorrect: true },
      { id: '8', code: 'for (let i = 0; i < s.length; i++) {', isCorrect: false },
      { id: '9', code: 's[i] = s[s.length - 1 - i]', isCorrect: false }
    ],
    correct_answer: ['1', '2', '3', '4', '5', '6', '7']
  }
]; 