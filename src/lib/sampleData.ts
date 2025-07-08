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
      const hashedPasswordUser = await bcrypt.hash('123', 10);
      
      await pool.execute(
        'INSERT INTO users (username, email, password, role, level, experience_points, total_points) VALUES (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)',
        [
          'admin', 'admin@email.com', hashedPassword, 'admin', 10, 1000, 1000,
          'user', 'user@email.com', hashedPasswordUser, 'student', 0, 0, 0
        ]
      );
      
      console.log('✅ Default admin user created');
    }

    // Insert default achievements
    const [achievementsExist] = await pool.execute(
      'SELECT id FROM achievements LIMIT 1'
    );

    if ((achievementsExist as mysql.RowDataPacket[]).length === 0) {
      const defaultAchievements = [
        ['First Steps', 'Complete your first lesson', '🎯', 'blue', 10, 'learning'],
        ['Quiz Master', 'Pass your first quiz', '🧠', 'green', 20, 'assessment'],
        ['Streak Starter', 'Study for 3 days in a row', '📅', 'purple', 30, 'habits'],
        ['Point Collector', 'Earn 100 total points', '💎', 'yellow', 100, 'points'],
        ['Course Finisher', 'Complete your first course', '🏆', 'gold', 200, 'completion'],
        ['Speed Learner', 'Complete 5 lessons in one day', '⚡', 'orange', 50, 'speed'],
        ['Persistent Learner', 'Study for 7 days in a row', '🔥', 'red', 100, 'habits'],
        ['Knowledge Seeker', 'Complete 10 quizzes', '📚', 'indigo', 150, 'assessment']
      ];

      for (const achievement of defaultAchievements) {
        await pool.execute(
          'INSERT INTO achievements (name, description, icon_url, badge_color, points_required, category) VALUES (?, ?, ?, ?, ?, ?)',
          achievement
        );
      }
      console.log('✅ Default achievements created');
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
          'beginner',
          'Programming'
        ],
        [
          'Web Development Basics',
          'Master HTML, CSS, and JavaScript to build amazing websites from scratch.',
          'beginner',
          'Web Development'
        ],
        [
          'Database Design',
          'Learn how to design efficient and scalable database systems.',
          'intermediate',
          'Database'
        ]
      ];

      for (const course of sampleCourses) {
        await pool.execute(
          'INSERT INTO courses (title, description, difficulty_level, category, is_published) VALUES (?, ?, ?, ?, ?)',
          [...course, true]
        );
      }
      console.log('✅ Sample courses created');
      
      // Insert sample topics for the courses
      const [topicsExist] = await pool.execute(
        'SELECT id FROM topics LIMIT 1'
      );

      if ((topicsExist as mysql.RowDataPacket[]).length === 0) {
        const sampleTopics = [
          // Course 1: Introduction to Programming
          [1, 'Understanding Variables and Data Types', 'Learn about different types of variables and how to use them effectively in programming. This lesson covers basic data types, variable declaration, and best practices for naming variables.', 1, null, 30, 10],
          
          // Course 2: Web Development Basics  
          [2, 'HTML Basics', 'Learn the fundamentals of HTML and document structure. Master essential HTML tags, semantic markup, and how to create well-structured web pages.', 1, null, 25, 10],
          [2, 'CSS Styling', 'Master CSS for styling web pages and creating responsive designs. Learn selectors, properties, layout techniques, and modern CSS practices.', 2, null, 35, 15],
          [2, 'JavaScript Fundamentals', 'Introduction to JavaScript programming for web interactivity. Cover variables, functions, DOM manipulation, and event handling.', 3, null, 40, 20],
          [2, 'Building a Simple Website', 'Put it all together by building a complete website. Apply HTML, CSS, and JavaScript skills to create an interactive web project.', 4, null, 50, 25],
          
          // Course 3: Database Design
          [3, 'Introduction to Databases', 'Understanding database concepts and types. Learn about relational databases, DBMS, and fundamental database principles.', 1, null, 30, 10],
          [3, 'SQL Basics', 'Learn fundamental SQL queries and database operations. Master SELECT, INSERT, UPDATE, DELETE commands and basic joins.', 2, null, 40, 15],
          [3, 'Database Normalization', 'Master the principles of database normalization and design. Learn about normal forms and how to design efficient database schemas.', 3, null, 45, 20],
          [3, 'Advanced Queries and Optimization', 'Learn advanced SQL queries and performance optimization. Cover complex joins, subqueries, and indexing strategies.', 4, null, 50, 25]
        ];

        for (const topic of sampleTopics) {
          await pool.execute(
            'INSERT INTO topics (course_id, title, content, lesson_order, video_url, duration_minutes, points_reward, is_published) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
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
        ['topic-1-q1', 1, '1', 'What is a variable in programming?', 'A constant value that never changes', 'A named storage location for data', 'A mathematical function', 'A type of programming language', 1, 10, 'easy', 'A variable is a named storage location in memory that can hold data which can be changed during program execution.'],
        ['topic-1-q2', 1, '1', 'Which of the following is a primitive data type?', 'Array', 'Object', 'Integer', 'Function', 2, 10, 'easy', 'Integer is a primitive data type that represents whole numbers.'],
        ['topic-1-q3', 1, '1', 'What is the difference between a variable and a constant?', 'There is no difference', 'Variables can change, constants cannot', 'Constants can change, variables cannot', 'Both can change freely', 1, 15, 'medium', 'Variables can have their values changed during program execution, while constants have fixed values that cannot be modified.'],
        ['topic-1-q4', 1, '1', 'Which naming convention is considered best practice for variables?', 'using spaces', 'camelCase or snake_case', 'ALL_CAPS', 'random-symbols', 1, 15, 'medium', 'camelCase (myVariable) and snake_case (my_variable) are widely accepted naming conventions that make code readable and maintainable.'],

        // Topic 2 - HTML Basics (Course 2, Topic ID 2)
        ['topic-2-q1', 2, '2', 'What does HTML stand for?', 'Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlink Text Markup Language', 0, 10, 'easy', 'HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages.'],
        ['topic-2-q2', 2, '2', 'Which HTML tag is used to define the main content of a document?', '<body>', '<main>', '<content>', '<section>', 0, 10, 'easy', 'The <body> tag contains all the visible content of an HTML document.'],
        ['topic-2-q3', 2, '2', 'What is the correct syntax for creating a link in HTML?', '<a href="url">Link text</a>', '<link url="url">Link text</link>', '<a src="url">Link text</a>', '<href="url">Link text</href>', 0, 15, 'medium', 'The correct syntax uses the <a> tag with the href attribute to specify the URL.'],
        ['topic-2-q4', 2, '2', 'What is the purpose of the DOCTYPE declaration?', 'To define CSS styles', 'To declare the HTML version', 'To include JavaScript', 'To create comments', 1, 15, 'medium', 'The DOCTYPE declaration tells the browser which version of HTML the page is using.'],

        // Topic 3 - CSS Styling (Course 2, Topic ID 3)
        ['topic-3-q1', 2, '3', 'What does CSS stand for?', 'Computer Style Sheets', 'Creative Style Sheets', 'Cascading Style Sheets', 'Colorful Style Sheets', 2, 10, 'easy', 'CSS stands for Cascading Style Sheets, which is used to style and layout web pages.'],
        ['topic-3-q2', 2, '3', 'Which property is used to change the text color of an element?', 'color', 'text-color', 'font-color', 'background-color', 0, 10, 'easy', 'The color property is used to set the color of text in CSS.'],
        ['topic-3-q3', 2, '3', 'How do you select an element with id "header" in CSS?', '.header', '#header', 'header', '*header', 1, 15, 'medium', 'The # symbol is used to select elements by their id attribute in CSS.'],
        ['topic-3-q4', 2, '3', 'Which CSS property controls the spacing between elements?', 'margin', 'padding', 'spacing', 'gap', 0, 10, 'easy', 'The margin property controls the space outside an element, between elements.'],

        // Topic 4 - JavaScript Fundamentals (Course 2, Topic ID 4)
        ['topic-4-q1', 2, '4', 'Which of the following is the correct way to declare a variable in JavaScript?', 'var myVar = 5;', 'variable myVar = 5;', 'v myVar = 5;', 'declare myVar = 5;', 0, 10, 'easy', 'Variables in JavaScript are declared using var, let, or const keywords.'],
        ['topic-4-q2', 2, '4', 'What is the result of 5 + "5" in JavaScript?', '10', '55', 'Error', 'undefined', 1, 15, 'medium', 'JavaScript performs type coercion, converting the number 5 to a string and concatenating it with "5".'],
        ['topic-4-q3', 2, '4', 'Which method is used to write content to the browser console?', 'console.write()', 'console.log()', 'console.print()', 'console.output()', 1, 10, 'easy', 'console.log() is the standard method for outputting information to the browser console.'],

        // Topic 5 - Building a Simple Website (Course 2, Topic ID 5)
        ['topic-5-q1', 2, '5', 'What does DOM stand for?', 'Document Object Model', 'Dynamic Object Management', 'Data Object Model', 'Document Oriented Model', 0, 10, 'easy', 'DOM stands for Document Object Model, which represents the structure of HTML documents.'],
        ['topic-5-q2', 2, '5', 'Which method is used to select an element by its ID?', 'getElementById()', 'getElementByID()', 'selectById()', 'findById()', 0, 10, 'easy', 'The getElementById() method returns the element with the specified ID.'],
        ['topic-5-q3', 2, '5', 'How do you change the text content of an element?', 'element.text = "new text"', 'element.innerHTML = "new text"', 'element.textContent = "new text"', 'element.content = "new text"', 2, 15, 'medium', 'The textContent property is used to set or return the text content of an element.'],

        // Database Design Course - Introduction to Databases
        ['topic-db-1-q1', 3, '6', 'What is a database?', 'A collection of files', 'An organized collection of data', 'A programming language', 'A web server', 1, 10, 'easy', 'A database is an organized collection of structured information or data.'],
        ['topic-db-1-q2', 3, '6', 'What does SQL stand for?', 'Structured Query Language', 'Simple Query Language', 'Standard Query Language', 'System Query Language', 0, 10, 'easy', 'SQL stands for Structured Query Language, used for managing relational databases.'],
        ['topic-db-1-q3', 3, '6', 'Which command is used to retrieve data from a database?', 'GET', 'FETCH', 'SELECT', 'RETRIEVE', 2, 15, 'medium', 'The SELECT command is used to retrieve data from a database table.'],

        // Database Design Course - SQL Basics
        ['topic-db-2-q1', 3, '7', 'Which SQL statement is used to extract data from a database?', 'EXTRACT', 'SELECT', 'GET', 'OPEN', 1, 10, 'easy', 'The SELECT statement is used to query and retrieve data from database tables.'],
        ['topic-db-2-q2', 3, '7', 'Which SQL keyword is used to eliminate duplicate rows?', 'UNIQUE', 'DISTINCT', 'DIFFERENT', 'SINGLE', 1, 10, 'easy', 'The DISTINCT keyword is used to remove duplicate rows from the result set.'],
        ['topic-db-2-q3', 3, '7', 'What is the correct syntax for an INNER JOIN?', 'SELECT * FROM table1 INNER JOIN table2 ON table1.id = table2.id', 'SELECT * FROM table1 JOIN table2 WHERE table1.id = table2.id', 'SELECT * FROM table1, table2 WHERE table1.id = table2.id', 'SELECT * FROM table1 INNER table2 ON table1.id = table2.id', 0, 15, 'medium', 'INNER JOIN requires the ON keyword to specify the join condition.'],

        // Database Design Course - Database Normalization
        ['topic-db-3-q1', 3, '8', 'What is the main purpose of database normalization?', 'To increase data redundancy', 'To reduce data redundancy and improve data integrity', 'To make queries slower', 'To increase storage space', 1, 10, 'easy', 'Database normalization reduces data redundancy and improves data integrity by organizing data efficiently.'],
        ['topic-db-3-q2', 3, '8', 'What is First Normal Form (1NF)?', 'Tables must have primary keys', 'Each column must contain atomic values', 'No partial dependencies', 'No transitive dependencies', 1, 15, 'medium', 'First Normal Form requires that each column contains only atomic (indivisible) values.'],
        ['topic-db-3-q3', 3, '8', 'What violates Third Normal Form (3NF)?', 'Composite primary keys', 'Transitive dependencies', 'Atomic values', 'Foreign keys', 1, 15, 'medium', 'Third Normal Form is violated when there are transitive dependencies between non-key attributes.'],

        // Database Design Course - Advanced Queries and Optimization
        ['topic-db-4-q1', 3, '9', 'What is the purpose of database indexing?', 'To slow down queries', 'To improve query performance', 'To increase storage space', 'To make data redundant', 1, 10, 'easy', 'Database indexes are used to speed up data retrieval operations by creating fast access paths to data.'],
        ['topic-db-4-q2', 3, '9', 'Which type of index is automatically created for primary keys?', 'Secondary index', 'Clustered index', 'Composite index', 'Partial index', 1, 15, 'medium', 'A clustered index is automatically created for primary keys and determines the physical order of data in the table.'],
        ['topic-db-4-q3', 3, '9', 'What is a subquery?', 'A query that joins multiple tables', 'A query nested inside another query', 'A query that updates data', 'A query that creates indexes', 1, 15, 'medium', 'A subquery is a SQL query nested inside another query, used to perform operations that require multiple steps.'],
        ['topic-db-4-q4', 3, '9', 'Which SQL clause is used to optimize queries by limiting result sets?', 'WHERE', 'HAVING', 'LIMIT', 'ORDER BY', 0, 10, 'easy', 'The WHERE clause filters rows before processing, which helps optimize query performance by reducing the dataset size.'],
        ['topic-db-4-q5', 3, '9', 'What is query execution plan?', 'A list of SQL commands', 'A roadmap showing how the database will execute a query', 'A backup of the database', 'A user interface design', 1, 15, 'medium', 'A query execution plan shows the sequence of operations the database will perform to execute a query, helping identify optimization opportunities.'],
        ['topic-db-4-q6', 3, '9', 'Which JOIN type returns all rows from both tables?', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN', 3, 15, 'medium', 'FULL OUTER JOIN returns all rows from both tables, including unmatched rows from either side.'],
        ['topic-db-4-q7', 3, '9', 'What is the difference between UNION and UNION ALL?', 'No difference', 'UNION removes duplicates, UNION ALL keeps duplicates', 'UNION ALL removes duplicates, UNION keeps duplicates', 'UNION is faster than UNION ALL', 1, 20, 'hard', 'UNION removes duplicate rows from the result set, while UNION ALL includes all rows including duplicates, making it faster.'],
        ['topic-db-4-q8', 3, '9', 'Which statement about database views is correct?', 'Views store actual data', 'Views are virtual tables based on SQL queries', 'Views cannot be queried', 'Views require more storage space', 1, 15, 'medium', 'Database views are virtual tables that display data from one or more tables based on a SQL query, without storing the actual data.']
      ];

      for (const question of sampleQuizQuestions) {
        await pool.execute(
          'INSERT INTO quiz_questions (question_id, subject_id, node_id, question, option_a, option_b, option_c, option_d, correct_answer, points, difficulty, explanation, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [...question, true]
        );
      }
      console.log('✅ Sample quiz questions created');
    }

    console.log('✅ Default data inserted successfully');
  } catch (error) {
    console.error('❌ Error inserting default data:', error);
  }
}; 