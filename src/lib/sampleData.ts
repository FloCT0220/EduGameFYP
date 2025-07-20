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
      const hashedPassword = await bcrypt.hash('admin', 10);
      
      await pool.execute(
        'INSERT INTO users (username, email, password, role, total_points) VALUES (?, ?, ?, ?, ?)',
        [
          'admin', 'admin@email.com', hashedPassword, 'admin', 1000
        ]
      );
      
      console.log('✅ Default admin user created');
    }

    // Create sample students
    const [studentsExist] = await pool.execute(
      'SELECT id FROM users WHERE role = "student" LIMIT 1'
    );

    if ((studentsExist as mysql.RowDataPacket[]).length === 0) {
      const sampleStudents = [
        ['john_doe', 'john@email.com', await bcrypt.hash('password123', 10), 'student', 250, 5, 8],
        ['sarah_smith', 'sarah@email.com', await bcrypt.hash('password123', 10), 'student', 180, 3, 5],
        ['mike_johnson', 'mike@email.com', await bcrypt.hash('password123', 10), 'student', 420, 7, 12],
        ['emma_wilson', 'emma@email.com', await bcrypt.hash('password123', 10), 'student', 320, 4, 9],
        ['alex_brown', 'alex@email.com', await bcrypt.hash('password123', 10), 'student', 150, 2, 3],
        ['lisa_davis', 'lisa@email.com', await bcrypt.hash('password123', 10), 'student', 380, 6, 10],
        ['david_miller', 'david@email.com', await bcrypt.hash('password123', 10), 'student', 290, 4, 7],
        ['anna_garcia', 'anna@email.com', await bcrypt.hash('password123', 10), 'student', 210, 3, 6]
      ];

      for (const student of sampleStudents) {
        await pool.execute(
          'INSERT INTO users (username, email, password, role, total_points, current_streak, max_streak) VALUES (?, ?, ?, ?, ?, ?, ?)',
          student
        );
      }
      console.log('✅ Sample students created');
    }


    // Insert sample courses if none exist
    const [coursesExist] = await pool.execute(
      'SELECT id FROM courses LIMIT 1'
    );

    if ((coursesExist as mysql.RowDataPacket[]).length === 0) {
      const sampleCourses = [
        [
          'Introduction to Programming',
          'Learn the fundamentals of programming with hands-on examples and interactive exercises. Perfect for beginners with no prior coding experience.',
          'beginner'
        ],
        [
          'Web Development Fundamentals',
          'Master HTML, CSS, and JavaScript to build responsive and interactive websites from scratch.',
          'beginner'
        ],
        [
          'Python Programming',
          'Learn Python programming language with practical projects and real-world applications.',
          'beginner'
        ],
        [
          'JavaScript Deep Dive',
          'Advanced JavaScript concepts including ES6+, async programming, and modern frameworks.',
          'intermediate'
        ],
        [
          'Database Design & SQL',
          'Learn how to design efficient and scalable database systems with SQL and NoSQL databases.',
          'intermediate'
        ],
        [
          'React.js Development',
          'Build modern web applications with React.js, hooks, and state management.',
          'intermediate'
        ],
        [
          'Node.js Backend Development',
          'Create scalable server-side applications with Node.js, Express, and MongoDB.',
          'intermediate'
        ],
        [
          'Data Structures & Algorithms',
          'Master fundamental data structures and algorithms for technical interviews.',
          'advanced'
        ],
        [
          'Machine Learning Basics',
          'Introduction to machine learning concepts, algorithms, and practical applications.',
          'advanced'
        ],
        [
          'DevOps & CI/CD',
          'Learn DevOps practices, Docker, Kubernetes, and continuous integration/deployment.',
          'advanced'
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
        // Define specific content for each topic
        const getTopicSections = (courseId: number, topicId: number) => {
          const sections: { [key: string]: Array<{title: string, content: string}> } = {
            // Course 1: Introduction to Programming
            "1_1": [
              {
                title: "What are Variables?",
                content: "Variables are containers that store data values. Think of them as labeled boxes where you can put different types of information. In programming, variables allow you to store and manipulate data throughout your program."
              },
              {
                title: "Variable Declaration",
                content: "To create a variable, you need to declare it first. Different programming languages have different syntax for this. For example, in JavaScript you use 'let' or 'const', in Python you simply assign a value, and in Java you specify the data type."
              },
              {
                title: "Data Types",
                content: "Programming languages support various data types: integers (whole numbers), floats (decimal numbers), strings (text), booleans (true/false), and more. Understanding data types is crucial for writing efficient and error-free code."
              },
              {
                title: "Variable Naming",
                content: "Good variable names are descriptive and follow naming conventions. Use camelCase or snake_case, avoid reserved words, and make names meaningful. For example, 'userAge' is better than 'a' or 'temp'."
              },
              {
                title: "Practice Exercise",
                content: "Try creating variables for a user's name, age, and email address. Use appropriate data types and meaningful names. This will help you understand how variables work in practice."
              }
            ],
            "1_2": [
              {
                title: "Understanding Control Flow",
                content: "Control structures determine the order in which your code executes. They allow your program to make decisions and repeat actions based on conditions. Without control structures, programs would execute in a straight line from top to bottom."
              },
              {
                title: "If Statements",
                content: "If statements are the most basic form of decision-making in programming. They check if a condition is true and execute specific code if it is. You can also use 'else' to handle the case when the condition is false."
              },
              {
                title: "Loops",
                content: "Loops allow you to repeat code multiple times. The three main types are: for loops (when you know how many times to repeat), while loops (repeat while a condition is true), and do-while loops (execute at least once, then check condition)."
              },
              {
                title: "Switch Statements",
                content: "Switch statements provide an alternative to multiple if-else statements when you need to check a variable against many possible values. They make code more readable and efficient for multiple conditions."
              },
              {
                title: "Best Practices",
                content: "Always use meaningful conditions, avoid deeply nested structures, and consider using early returns to reduce complexity. Remember to handle all possible cases in your control structures."
              }
            ],
            "1_3": [
              {
                title: "What are Functions?",
                content: "Functions are reusable blocks of code that perform specific tasks. They help organize code, avoid repetition, and make programs easier to understand and maintain. Think of functions as mini-programs within your main program."
              },
              {
                title: "Function Declaration",
                content: "To create a function, you need to declare it with a name, parameters (optional), and a body. The body contains the code that will execute when the function is called. Different languages have different syntax for function declaration."
              },
              {
                title: "Parameters and Arguments",
                content: "Parameters are variables that receive data when a function is called. Arguments are the actual values passed to the function. Functions can have multiple parameters, and some languages support default parameter values."
              },
              {
                title: "Return Values",
                content: "Functions can return values back to the code that called them. The return value can be used in calculations, assigned to variables, or passed to other functions. Functions that don't return a value are called void functions."
              },
              {
                title: "Scope and Lifetime",
                content: "Variables declared inside a function have local scope - they only exist within that function. Global variables are accessible throughout the program. Understanding scope helps avoid naming conflicts and memory issues."
              }
            ],
            "1_4": [
              {
                title: "Understanding Arrays",
                content: "Arrays are ordered collections of elements, usually of the same data type. They allow you to store multiple values in a single variable and access them using an index. Arrays are fundamental to programming and used in almost every application."
              },
              {
                title: "Array Operations",
                content: "Common array operations include: adding elements (push/append), removing elements (pop/remove), accessing elements by index, finding elements, and sorting. Each programming language has its own methods for these operations."
              },
              {
                title: "Multi-dimensional Arrays",
                content: "Arrays can have multiple dimensions. A 2D array is like a table with rows and columns, while a 3D array adds depth. These are useful for representing complex data structures like game boards or 3D graphics."
              },
              {
                title: "Array Methods",
                content: "Modern programming languages provide powerful array methods like map, filter, reduce, and forEach. These methods make it easier to manipulate arrays without writing complex loops and improve code readability."
              },
              {
                title: "Performance Considerations",
                content: "Array operations have different time complexities. Accessing by index is O(1), but searching or inserting can be O(n). Choose the right data structure based on your specific use case and performance requirements."
              }
            ],
            "1_5": [
              {
                title: "What is OOP?",
                content: "Object-Oriented Programming (OOP) is a programming paradigm that organizes code into objects that contain data and code. OOP focuses on creating reusable code and modeling real-world entities in software."
              },
              {
                title: "Classes and Objects",
                content: "A class is a blueprint for creating objects. It defines the properties (attributes) and methods (behaviors) that objects of that class will have. An object is an instance of a class - a concrete example created from the blueprint."
              },
              {
                title: "Encapsulation",
                content: "Encapsulation bundles data and methods that operate on that data within a single unit (class). It hides internal implementation details and provides controlled access to data through public methods, protecting data integrity."
              },
              {
                title: "Inheritance",
                content: "Inheritance allows a class to inherit properties and methods from another class. This promotes code reuse and establishes a hierarchical relationship between classes. A child class can extend or override parent class functionality."
              },
              {
                title: "Polymorphism",
                content: "Polymorphism allows objects to be treated as instances of their parent class while maintaining their own unique implementations. This enables flexible and extensible code that can work with different object types through a common interface."
              }
            ],
            // Course 2: Web Development Fundamentals
            "2_6": [
              {
                title: "HTML Basics",
                content: "HTML (HyperText Markup Language) is the standard markup language for creating web pages. It provides the structure and content of web pages using elements and tags. HTML documents are made up of elements that tell browsers how to display content."
              },
              {
                title: "Document Structure",
                content: "Every HTML document has a basic structure: <!DOCTYPE html>, <html>, <head>, and <body> tags. The head contains metadata like title and links to external resources, while the body contains the visible content."
              },
              {
                title: "Common Elements",
                content: "HTML provides many elements for different types of content: headings (<h1> to <h6>), paragraphs (<p>), links (<a>), images (<img>), lists (<ul>, <ol>, <li>), and more. Each element has specific semantic meaning."
              },
              {
                title: "Semantic HTML",
                content: "Semantic HTML uses meaningful elements that clearly describe their purpose. Examples include <header>, <nav>, <main>, <section>, <article>, <aside>, and <footer>. This improves accessibility and SEO."
              },
              {
                title: "Forms and Input",
                content: "HTML forms allow users to input data. Common form elements include text inputs, checkboxes, radio buttons, select dropdowns, and textareas. Forms are essential for user interaction and data collection."
              }
            ],
            "2_7": [
              {
                title: "CSS Introduction",
                content: "CSS (Cascading Style Sheets) is used to style and layout web pages. It separates presentation from content, allowing you to control colors, fonts, spacing, and layout. CSS can be written inline, in internal style tags, or in external files."
              },
              {
                title: "Selectors",
                content: "CSS selectors target HTML elements for styling. Common selectors include element selectors (p, div), class selectors (.classname), ID selectors (#idname), and pseudo-selectors (:hover, :focus). Understanding selectors is key to effective CSS."
              },
              {
                title: "Box Model",
                content: "Every HTML element is treated as a box with content, padding, border, and margin. The box model is fundamental to CSS layout. Understanding how these properties interact helps create precise layouts and spacing."
              },
              {
                title: "Flexbox and Grid",
                content: "Modern CSS provides powerful layout systems. Flexbox is great for one-dimensional layouts, while CSS Grid excels at two-dimensional layouts. These systems make it easier to create responsive and complex layouts."
              },
              {
                title: "Responsive Design",
                content: "Responsive design ensures websites work on all devices. Use media queries, flexible units (%, em, rem), and responsive images. Mobile-first design approach prioritizes mobile experience and scales up for larger screens."
              }
            ],
            "2_8": [
              {
                title: "JavaScript Fundamentals",
                content: "JavaScript is a dynamic programming language that adds interactivity to web pages. It runs in the browser and can manipulate HTML, handle events, and communicate with servers. JavaScript is essential for modern web development."
              },
              {
                title: "Variables and Data Types",
                content: "JavaScript variables are declared with let, const, or var. JavaScript is dynamically typed, meaning variables can hold different types of data. Common types include strings, numbers, booleans, objects, and arrays."
              },
              {
                title: "Functions",
                content: "JavaScript functions are first-class objects, meaning they can be assigned to variables, passed as arguments, and returned from other functions. Function declarations, expressions, and arrow functions provide different syntax options."
              },
              {
                title: "DOM Manipulation",
                content: "The Document Object Model (DOM) represents the HTML document as a tree structure. JavaScript can select, modify, and create DOM elements. This enables dynamic content updates and interactive user experiences."
              },
              {
                title: "Events",
                content: "JavaScript events respond to user actions like clicks, form submissions, and keyboard input. Event listeners attach functions to elements that execute when events occur. Understanding events is crucial for interactive web applications."
              }
            ],
            "2_9": [
              {
                title: "Responsive Design Principles",
                content: "Responsive design ensures websites work well on all devices and screen sizes. The key principles include flexible layouts, responsive images, and mobile-first design. This approach improves user experience across all devices."
              },
              {
                title: "Media Queries",
                content: "Media queries allow CSS to apply different styles based on device characteristics like screen width, height, and orientation. Common breakpoints target mobile (320px), tablet (768px), and desktop (1024px) devices."
              },
              {
                title: "Flexible Units",
                content: "Use relative units like percentages, em, rem, and viewport units (vw, vh) instead of fixed pixels. This creates layouts that scale appropriately across different screen sizes and user preferences."
              },
              {
                title: "Responsive Images",
                content: "Images should scale appropriately on different devices. Use max-width: 100%, srcset for different resolutions, and picture elements for art direction. Consider loading performance and bandwidth constraints."
              },
              {
                title: "Testing Responsiveness",
                content: "Test your responsive design on actual devices and use browser developer tools to simulate different screen sizes. Consider touch interactions, navigation patterns, and content hierarchy across all breakpoints."
              }
            ],
            "2_10": [
              {
                title: "Accessibility Basics",
                content: "Web accessibility ensures websites are usable by people with disabilities. This includes visual, auditory, motor, and cognitive impairments. Accessible websites benefit all users and are often required by law."
              },
              {
                title: "Semantic HTML",
                content: "Use semantic HTML elements that convey meaning to assistive technologies. Proper heading hierarchy, meaningful alt text for images, and descriptive link text help screen readers interpret content correctly."
              },
              {
                title: "Keyboard Navigation",
                content: "Ensure all interactive elements are keyboard accessible. Users should be able to navigate and use your website without a mouse. Test tab order, focus indicators, and keyboard shortcuts."
              },
              {
                title: "Color and Contrast",
                content: "Maintain sufficient color contrast (minimum 4.5:1 for normal text) and don't rely solely on color to convey information. Consider colorblind users and provide alternative ways to distinguish content."
              },
              {
                title: "Testing Accessibility",
                content: "Use automated tools like axe-core and manual testing with screen readers. Include accessibility testing in your development workflow and consider accessibility from the beginning of your project."
              }
            ]
          };
          
          const key = `${courseId}_${topicId}`;
          return sections[key] || [
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
        };
        
        const sampleTopics = [
          // Course 1: Introduction to Programming
          [1, 'Variables and Data Types', 'Learn about different types of variables and how to use them effectively in programming.', 1, 25, JSON.stringify(getTopicSections(1, 1))],
          [1, 'Control Structures', 'Master if statements, loops, and conditional logic in programming.', 2, 30, JSON.stringify(getTopicSections(1, 2))],
          [1, 'Functions and Methods', 'Learn how to create and use functions to organize and reuse code.', 3, 35, JSON.stringify(getTopicSections(1, 3))],
          [1, 'Arrays and Collections', 'Understand how to work with arrays, lists, and other data collections.', 4, 30, JSON.stringify(getTopicSections(1, 4))],
          [1, 'Object-Oriented Programming', 'Introduction to classes, objects, and OOP principles.', 5, 40, JSON.stringify(getTopicSections(1, 5))],
          
          // Course 2: Web Development Fundamentals
          [2, 'HTML Structure and Elements', 'Learn the fundamentals of HTML and document structure.', 1, 25, JSON.stringify(getTopicSections(2, 6))],
          [2, 'CSS Styling and Layout', 'Master CSS for styling web pages and creating responsive designs.', 2, 30, JSON.stringify(getTopicSections(2, 7))],
          [2, 'JavaScript Fundamentals', 'Introduction to JavaScript programming for web interactivity.', 3, 35, JSON.stringify(getTopicSections(2, 8))],
          [2, 'Responsive Design', 'Learn to create websites that work on all devices and screen sizes.', 4, 30, JSON.stringify(getTopicSections(2, 9))],
          [2, 'Web Accessibility', 'Make your websites accessible to all users, including those with disabilities.', 5, 25, JSON.stringify(getTopicSections(2, 10))],
          
          // Course 3: Python Programming
          [3, 'Python Basics', 'Introduction to Python syntax, variables, and basic operations.', 1, 25, JSON.stringify(getTopicSections(3, 11))],
          [3, 'Python Data Structures', 'Learn about lists, tuples, dictionaries, and sets in Python.', 2, 30, JSON.stringify(getTopicSections(3, 12))],
          [3, 'Python Functions', 'Master function definition, parameters, and return values in Python.', 3, 30, JSON.stringify(getTopicSections(3, 13))],
          [3, 'File Handling', 'Learn to read from and write to files using Python.', 4, 25, JSON.stringify(getTopicSections(3, 14))],
          [3, 'Python Libraries', 'Explore popular Python libraries like NumPy, Pandas, and Matplotlib.', 5, 35, JSON.stringify(getTopicSections(3, 15))],
          
          // Course 4: JavaScript Deep Dive
          [4, 'ES6+ Features', 'Learn modern JavaScript features including arrow functions, destructuring, and modules.', 1, 30, JSON.stringify(getTopicSections(4, 16))],
          [4, 'Asynchronous JavaScript', 'Master promises, async/await, and handling asynchronous operations.', 2, 35, JSON.stringify(getTopicSections(4, 17))],
          [4, 'DOM Manipulation', 'Advanced techniques for manipulating the Document Object Model.', 3, 30, JSON.stringify(getTopicSections(4, 18))],
          [4, 'JavaScript Design Patterns', 'Learn common design patterns and best practices in JavaScript.', 4, 35, JSON.stringify(getTopicSections(4, 19))],
          [4, 'Testing and Debugging', 'Master debugging techniques and testing strategies for JavaScript.', 5, 30, JSON.stringify(getTopicSections(4, 20))],
          
          // Course 5: Database Design & SQL
          [5, 'Database Fundamentals', 'Understanding database concepts, types, and relational database principles.', 1, 30, JSON.stringify(getTopicSections(5, 21))],
          [5, 'SQL Basics', 'Learn fundamental SQL queries and database operations.', 2, 35, JSON.stringify(getTopicSections(5, 22))],
          [5, 'Database Normalization', 'Master the principles of database normalization and design.', 3, 40, JSON.stringify(getTopicSections(5, 23))],
          [5, 'Advanced SQL', 'Learn advanced SQL queries, joins, and complex operations.', 4, 35, JSON.stringify(getTopicSections(5, 24))],
          [5, 'Database Optimization', 'Learn indexing, query optimization, and performance tuning.', 5, 40, JSON.stringify(getTopicSections(5, 25))],
          
          // Course 6: React.js Development
          [6, 'React Fundamentals', 'Introduction to React components, JSX, and component lifecycle.', 1, 35, JSON.stringify(getTopicSections(6, 26))],
          [6, 'React Hooks', 'Master useState, useEffect, and other React hooks for state management.', 2, 40, JSON.stringify(getTopicSections(6, 27))],
          [6, 'React Router', 'Learn client-side routing and navigation in React applications.', 3, 30, JSON.stringify(getTopicSections(6, 28))],
          [6, 'State Management', 'Explore Redux, Context API, and other state management solutions.', 4, 40, JSON.stringify(getTopicSections(6, 29))],
          [6, 'Testing React Apps', 'Learn to test React components and applications effectively.', 5, 35, JSON.stringify(getTopicSections(6, 30))],
          
          // Course 7: Node.js Backend Development
          [7, 'Node.js Basics', 'Introduction to Node.js runtime, modules, and package management.', 1, 30, JSON.stringify(getTopicSections(7, 31))],
          [7, 'Express.js Framework', 'Learn to build RESTful APIs using Express.js framework.', 2, 35, JSON.stringify(getTopicSections(7, 32))],
          [7, 'Database Integration', 'Connect Node.js applications to databases like MongoDB and MySQL.', 3, 40, JSON.stringify(getTopicSections(7, 33))],
          [7, 'Authentication & Security', 'Implement user authentication and security best practices.', 4, 35, JSON.stringify(getTopicSections(7, 34))],
          [7, 'Deployment & DevOps', 'Learn to deploy Node.js applications and basic DevOps practices.', 5, 30, JSON.stringify(getTopicSections(7, 35))],
          
          // Course 8: Data Structures & Algorithms
          [8, 'Arrays and Strings', 'Master array manipulation and string algorithms.', 1, 35, JSON.stringify(getTopicSections(8, 36))],
          [8, 'Linked Lists', 'Learn about singly and doubly linked lists and their operations.', 2, 40, JSON.stringify(getTopicSections(8, 37))],
          [8, 'Stacks and Queues', 'Understand stack and queue data structures and their applications.', 3, 35, JSON.stringify(getTopicSections(8, 38))],
          [8, 'Trees and Graphs', 'Learn about tree and graph data structures and traversal algorithms.', 4, 45, JSON.stringify(getTopicSections(8, 39))],
          [8, 'Sorting and Searching', 'Master various sorting and searching algorithms and their complexities.', 5, 40, JSON.stringify(getTopicSections(8, 40))],
          
          // Course 9: Machine Learning Basics
          [9, 'ML Fundamentals', 'Introduction to machine learning concepts and types of learning.', 1, 40, JSON.stringify(getTopicSections(9, 41))],
          [9, 'Data Preprocessing', 'Learn data cleaning, normalization, and feature engineering techniques.', 2, 35, JSON.stringify(getTopicSections(9, 42))],
          [9, 'Supervised Learning', 'Master classification and regression algorithms.', 3, 45, JSON.stringify(getTopicSections(9, 43))],
          [9, 'Unsupervised Learning', 'Learn clustering and dimensionality reduction techniques.', 4, 40, JSON.stringify(getTopicSections(9, 44))],
          [9, 'Model Evaluation', 'Understand how to evaluate and improve machine learning models.', 5, 35, JSON.stringify(getTopicSections(9, 45))],
          
          // Course 10: DevOps & CI/CD
          [10, 'Version Control with Git', 'Master Git fundamentals, branching, and collaboration workflows.', 1, 30, JSON.stringify(getTopicSections(10, 46))],
          [10, 'Docker Containers', 'Learn to containerize applications using Docker.', 2, 35, JSON.stringify(getTopicSections(10, 47))],
          [10, 'CI/CD Pipelines', 'Build continuous integration and deployment pipelines.', 3, 40, JSON.stringify(getTopicSections(10, 48))],
          [10, 'Cloud Deployment', 'Deploy applications to cloud platforms like AWS, Azure, or GCP.', 4, 35, JSON.stringify(getTopicSections(10, 49))],
          [10, 'Monitoring and Logging', 'Implement application monitoring and logging strategies.', 5, 30, JSON.stringify(getTopicSections(10, 50))]
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
        const [users] = await pool.execute(
          'SELECT id FROM users WHERE role = "student"'
        ) as [mysql.RowDataPacket[], mysql.FieldPacket[]];

        if (users.length > 0) {
          // Create realistic enrollments with progress
          const enrollments = [
            // John Doe - enrolled in multiple courses with good progress
            [users[0].id, 1, 85.5, 180], // Introduction to Programming - 85% complete
            [users[0].id, 2, 60.0, 120], // Web Development - 60% complete
            [users[0].id, 3, 25.0, 50],  // Python - 25% complete
            
            // Sarah Smith - focused on web development
            [users[1].id, 2, 90.0, 200], // Web Development - 90% complete
            [users[1].id, 4, 45.0, 80],  // JavaScript Deep Dive - 45% complete
            [users[1].id, 6, 15.0, 30],  // React.js - 15% complete
            
            // Mike Johnson - advanced learner
            [users[2].id, 1, 100.0, 250], // Introduction to Programming - completed
            [users[2].id, 5, 75.0, 150],  // Database Design - 75% complete
            [users[2].id, 8, 30.0, 60],   // Data Structures - 30% complete
            [users[2].id, 9, 10.0, 20],   // Machine Learning - 10% complete
            
            // Emma Wilson - beginner with steady progress
            [users[3].id, 1, 70.0, 140],  // Introduction to Programming - 70% complete
            [users[3].id, 2, 40.0, 80],   // Web Development - 40% complete
            
            // Alex Brown - just starting
            [users[4].id, 1, 20.0, 40],   // Introduction to Programming - 20% complete
            
            // Lisa Davis - intermediate level
            [users[5].id, 3, 100.0, 200], // Python - completed
            [users[5].id, 5, 60.0, 120],  // Database Design - 60% complete
            [users[5].id, 7, 25.0, 50],   // Node.js - 25% complete
            
            // David Miller - backend focus
            [users[6].id, 5, 85.0, 170],  // Database Design - 85% complete
            [users[6].id, 7, 50.0, 100],  // Node.js - 50% complete
            [users[6].id, 10, 15.0, 30],  // DevOps - 15% complete
            
            // Anna Garcia - frontend specialist
            [users[7].id, 2, 100.0, 250], // Web Development - completed
            [users[7].id, 4, 80.0, 160],  // JavaScript Deep Dive - 80% complete
            [users[7].id, 6, 45.0, 90]    // React.js - 45% complete
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
        // Course 1: Introduction to Programming - Variables and Data Types
        [1, 1, 'What is a variable in programming?', JSON.stringify(['A constant value that never changes', 'A named storage location for data', 'A mathematical function', 'A type of programming language']), 1, 10, 'easy'],
        [1, 1, 'Which of the following is a primitive data type?', JSON.stringify(['Array', 'Object', 'Integer', 'Function']), 2, 10, 'easy'],
        [1, 1, 'What is the difference between a variable and a constant?', JSON.stringify(['There is no difference', 'Variables can change, constants cannot', 'Constants can change, variables cannot', 'Both can change freely']), 1, 15, 'medium'],
        [1, 1, 'Which naming convention is considered best practice for variables?', JSON.stringify(['using spaces', 'camelCase or snake_case', 'ALL_CAPS', 'random-symbols']), 1, 15, 'medium'],
        
        // Course 1: Control Structures
        [1, 2, 'What is the purpose of an if statement?', JSON.stringify(['To repeat code', 'To make decisions based on conditions', 'To define functions', 'To create variables']), 1, 10, 'easy'],
        [1, 2, 'Which loop is best when you know the number of iterations?', JSON.stringify(['while loop', 'for loop', 'do-while loop', 'if loop']), 1, 10, 'easy'],
        [1, 2, 'What is the difference between == and === in JavaScript?', JSON.stringify(['No difference', '== checks value, === checks value and type', '=== is faster', '== is newer']), 1, 15, 'medium'],
        
        // Course 2: Web Development - HTML Structure
        [2, 6, 'What does HTML stand for?', JSON.stringify(['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlink Text Markup Language']), 0, 10, 'easy'],
        [2, 6, 'Which HTML tag is used to define the main content of a document?', JSON.stringify(['<body>', '<main>', '<content>', '<section>']), 0, 10, 'easy'],
        [2, 6, 'What is the correct syntax for creating a link in HTML?', JSON.stringify(['<a href="url">Link text</a>', '<link url="url">Link text</link>', '<a src="url">Link text</a>', '<href="url">Link text</href>']), 0, 15, 'medium'],
        
        // Course 2: CSS Styling
        [2, 7, 'What does CSS stand for?', JSON.stringify(['Computer Style Sheets', 'Creative Style Sheets', 'Cascading Style Sheets', 'Colorful Style Sheets']), 2, 10, 'easy'],
        [2, 7, 'Which property is used to change the text color of an element?', JSON.stringify(['color', 'text-color', 'font-color', 'background-color']), 0, 10, 'easy'],
        [2, 7, 'How do you select an element with id "header" in CSS?', JSON.stringify(['.header', '#header', 'header', '*header']), 1, 15, 'medium'],
        
        // Course 2: JavaScript Fundamentals
        [2, 8, 'Which of the following is the correct way to declare a variable in JavaScript?', JSON.stringify(['var myVar = 5;', 'variable myVar = 5;', 'v myVar = 5;', 'declare myVar = 5;']), 0, 10, 'easy'],
        [2, 8, 'What is the result of 5 + "5" in JavaScript?', JSON.stringify(['10', '55', 'Error', 'undefined']), 1, 15, 'medium'],
        [2, 8, 'Which method is used to write content to the browser console?', JSON.stringify(['console.write()', 'console.log()', 'console.print()', 'console.output()']), 1, 10, 'easy'],
        
        // Course 3: Python Programming - Python Basics
        [3, 11, 'What is the correct way to print "Hello World" in Python?', JSON.stringify(['print("Hello World")', 'echo("Hello World")', 'console.log("Hello World")', 'printf("Hello World")']), 0, 10, 'easy'],
        [3, 11, 'Which symbol is used for comments in Python?', JSON.stringify(['//', '#', '/*', '--']), 1, 10, 'easy'],
        [3, 11, 'What is the result of 3 ** 2 in Python?', JSON.stringify(['6', '9', '5', 'Error']), 1, 10, 'easy'],
        
        // Course 3: Python Data Structures
        [3, 12, 'Which data structure is mutable in Python?', JSON.stringify(['tuple', 'list', 'string', 'frozenset']), 1, 10, 'easy'],
        [3, 12, 'How do you add an element to a list in Python?', JSON.stringify(['list.add()', 'list.append()', 'list.insert()', 'list.push()']), 1, 10, 'easy'],
        [3, 12, 'What is the difference between a list and a tuple?', JSON.stringify(['No difference', 'Lists are mutable, tuples are immutable', 'Tuples are faster', 'Lists can only contain numbers']), 1, 15, 'medium'],
        
        // Course 4: JavaScript Deep Dive - ES6+ Features
        [4, 16, 'What is an arrow function?', JSON.stringify(['A function with arrows', 'A concise way to write functions', 'A type of loop', 'A variable declaration']), 1, 10, 'easy'],
        [4, 16, 'What does destructuring do?', JSON.stringify(['Breaks down objects', 'Extracts values from arrays/objects', 'Creates new objects', 'Deletes properties']), 1, 15, 'medium'],
        [4, 16, 'What is the spread operator used for?', JSON.stringify(['To spread butter', 'To expand arrays/objects', 'To create loops', 'To define functions']), 1, 10, 'easy'],
        
        // Course 4: Asynchronous JavaScript
        [4, 17, 'What is a Promise?', JSON.stringify(['A guarantee', 'An object representing eventual completion', 'A type of function', 'A variable']), 1, 15, 'medium'],
        [4, 17, 'What does async/await do?', JSON.stringify(['Makes code synchronous', 'Provides cleaner syntax for promises', 'Slows down execution', 'Creates loops']), 1, 15, 'medium'],
        
        // Course 5: Database Design - Database Fundamentals
        [5, 21, 'What is a database?', JSON.stringify(['A collection of files', 'An organized collection of data', 'A programming language', 'A web server']), 1, 10, 'easy'],
        [5, 21, 'What does SQL stand for?', JSON.stringify(['Structured Query Language', 'Simple Query Language', 'Standard Query Language', 'System Query Language']), 0, 10, 'easy'],
        [5, 21, 'Which command is used to retrieve data from a database?', JSON.stringify(['GET', 'FETCH', 'SELECT', 'RETRIEVE']), 2, 15, 'medium'],
        
        // Course 5: SQL Basics
        [5, 22, 'Which SQL statement is used to extract data from a database?', JSON.stringify(['EXTRACT', 'SELECT', 'GET', 'OPEN']), 1, 10, 'easy'],
        [5, 22, 'Which SQL keyword is used to eliminate duplicate rows?', JSON.stringify(['UNIQUE', 'DISTINCT', 'DIFFERENT', 'SINGLE']), 1, 10, 'easy'],
        [5, 22, 'What is the correct syntax for an INNER JOIN?', JSON.stringify(['SELECT * FROM table1 INNER JOIN table2 ON table1.id = table2.id', 'SELECT * FROM table1 JOIN table2 WHERE table1.id = table2.id', 'SELECT * FROM table1, table2 WHERE table1.id = table2.id', 'SELECT * FROM table1 INNER table2 ON table1.id = table2.id']), 0, 15, 'medium'],
        
        // Course 6: React.js - React Fundamentals
        [6, 26, 'What is React?', JSON.stringify(['A database', 'A JavaScript library for building UIs', 'A programming language', 'A web server']), 1, 10, 'easy'],
        [6, 26, 'What is JSX?', JSON.stringify(['A database query language', 'JavaScript XML syntax', 'A CSS framework', 'A testing tool']), 1, 10, 'easy'],
        [6, 26, 'What is a component in React?', JSON.stringify(['A function or class that returns JSX', 'A database table', 'A CSS file', 'A JavaScript variable']), 0, 15, 'medium'],
        
        // Course 6: React Hooks
        [6, 27, 'What is useState used for?', JSON.stringify(['To create functions', 'To manage state in functional components', 'To create loops', 'To import modules']), 1, 15, 'medium'],
        [6, 27, 'What is useEffect used for?', JSON.stringify(['To create effects', 'To handle side effects in components', 'To create variables', 'To import data']), 1, 15, 'medium'],
        
        // Course 7: Node.js - Node.js Basics
        [7, 31, 'What is Node.js?', JSON.stringify(['A database', 'A JavaScript runtime environment', 'A programming language', 'A web browser']), 1, 10, 'easy'],
        [7, 31, 'What is npm?', JSON.stringify(['Node Package Manager', 'Node Programming Module', 'Node Process Manager', 'Node Project Manager']), 0, 10, 'easy'],
        [7, 31, 'What is the purpose of package.json?', JSON.stringify(['To store data', 'To manage project dependencies', 'To create databases', 'To write code']), 1, 10, 'easy'],
        
        // Course 8: Data Structures - Arrays and Strings
        [8, 36, 'What is the time complexity of accessing an element in an array?', JSON.stringify(['O(n)', 'O(1)', 'O(log n)', 'O(n²)']), 1, 15, 'medium'],
        [8, 36, 'What is the time complexity of searching in an unsorted array?', JSON.stringify(['O(1)', 'O(n)', 'O(log n)', 'O(n²)']), 1, 15, 'medium'],
        [8, 36, 'Which data structure is best for frequent insertions and deletions?', JSON.stringify(['Array', 'Linked List', 'Stack', 'Queue']), 1, 20, 'hard'],
        
        // Course 9: Machine Learning - ML Fundamentals
        [9, 41, 'What is machine learning?', JSON.stringify(['A type of computer', 'A subset of AI that enables systems to learn', 'A programming language', 'A database system']), 1, 15, 'medium'],
        [9, 41, 'What is supervised learning?', JSON.stringify(['Learning without labels', 'Learning with labeled data', 'Learning by trial and error', 'Learning from rewards']), 1, 15, 'medium'],
        [9, 41, 'What is unsupervised learning?', JSON.stringify(['Learning with labels', 'Learning without labeled data', 'Learning with a teacher', 'Learning from examples']), 1, 15, 'medium'],
        
        // Course 10: DevOps - Version Control with Git
        [10, 46, 'What is Git?', JSON.stringify(['A programming language', 'A version control system', 'A database', 'A web server']), 1, 10, 'easy'],
        [10, 46, 'What is a commit in Git?', JSON.stringify(['A save point', 'A branch', 'A merge', 'A push']), 0, 10, 'easy'],
        [10, 46, 'What is a branch in Git?', JSON.stringify(['A separate line of development', 'A file', 'A commit', 'A repository']), 0, 15, 'medium']
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

 
    // Insert sample user achievements
    const [userAchievementsExist] = await pool.execute(
      'SELECT id FROM user_achievements LIMIT 1'
    );

    if ((userAchievementsExist as mysql.RowDataPacket[]).length === 0) {
      const [users] = await pool.execute(
        'SELECT id FROM users WHERE role = "student"'
      ) as [mysql.RowDataPacket[], mysql.FieldPacket[]];

      const [achievements] = await pool.execute(
        'SELECT id FROM achievements'
      ) as [mysql.RowDataPacket[], mysql.FieldPacket[]];

      if (users.length > 0 && achievements.length > 0) {
        // Award some achievements to students
        const userAchievements = [
          // John Doe - experienced learner
          [users[0].id, achievements[0].id], // First Steps
          [users[0].id, achievements[1].id], // Quick Learner
          [users[0].id, achievements[3].id], // Streak Master
          [users[0].id, achievements[4].id], // Perfect Score
          
          // Sarah Smith - quiz champion
          [users[1].id, achievements[0].id], // First Steps
          [users[1].id, achievements[5].id], // Quiz Champion
          [users[1].id, achievements[4].id], // Perfect Score
          [users[1].id, achievements[9].id], // Social Learner
          
          // Mike Johnson - advanced learner
          [users[2].id, achievements[0].id], // First Steps
          [users[2].id, achievements[1].id], // Quick Learner
          [users[2].id, achievements[2].id], // Course Master
          [users[2].id, achievements[6].id], // Coding Wizard
          [users[2].id, achievements[11].id], // Consistent Learner
          [users[2].id, achievements[16].id], // Learning Legend
          
          // Emma Wilson - steady progress
          [users[3].id, achievements[0].id], // First Steps
          [users[3].id, achievements[1].id], // Quick Learner
          [users[3].id, achievements[7].id], // Early Bird
          
          // Alex Brown - just starting
          [users[4].id, achievements[0].id], // First Steps
          
          // Lisa Davis - intermediate
          [users[5].id, achievements[0].id], // First Steps
          [users[5].id, achievements[1].id], // Quick Learner
          [users[5].id, achievements[2].id], // Course Master
          [users[5].id, achievements[5].id], // Quiz Champion
          
          // David Miller - backend focus
          [users[6].id, achievements[0].id], // First Steps
          [users[6].id, achievements[1].id], // Quick Learner
          [users[6].id, achievements[6].id], // Coding Wizard
          [users[6].id, achievements[8].id], // Knowledge Seeker
          
          // Anna Garcia - frontend specialist
          [users[7].id, achievements[0].id], // First Steps
          [users[7].id, achievements[1].id], // Quick Learner
          [users[7].id, achievements[2].id], // Course Master
          [users[7].id, achievements[5].id], // Quiz Champion
          [users[7].id, achievements[8].id] // Knowledge Seeker
        ];

        for (const userAchievement of userAchievements) {
          await pool.execute(
            'INSERT IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
            userAchievement
          );
        }
        console.log('✅ Sample user achievements created');
      }
    }

    // Insert sample quiz attempts
    const [quizAttemptsExist] = await pool.execute(
      'SELECT id FROM quiz_attempts LIMIT 1'
    );

    if ((quizAttemptsExist as mysql.RowDataPacket[]).length === 0) {
      const [users] = await pool.execute(
        'SELECT id FROM users WHERE role = "student"'
      ) as [mysql.RowDataPacket[], mysql.FieldPacket[]];

      if (users.length > 0) {
        const sampleQuizAttempts = [
          // John Doe's attempts
          [users[0].id, 1, 1, 4, 3, 75.0, 30, JSON.stringify([0, 1, 2, 1])],
          [users[0].id, 1, 2, 3, 3, 100.0, 30, JSON.stringify([1, 1, 1])],
          [users[0].id, 2, 6, 3, 2, 66.7, 20, JSON.stringify([0, 1, 1])],
          
          // Sarah Smith's attempts
          [users[1].id, 2, 6, 3, 3, 100.0, 30, JSON.stringify([0, 0, 0])],
          [users[1].id, 2, 7, 3, 2, 66.7, 20, JSON.stringify([1, 0, 1])],
          [users[1].id, 2, 8, 3, 2, 66.7, 20, JSON.stringify([0, 1, 1])],
          [users[1].id, 4, 16, 3, 3, 100.0, 30, JSON.stringify([1, 1, 1])],
          
          // Mike Johnson's attempts
          [users[2].id, 1, 1, 4, 4, 100.0, 40, JSON.stringify([1, 1, 1, 1])],
          [users[2].id, 1, 2, 3, 3, 100.0, 30, JSON.stringify([1, 1, 1])],
          [users[2].id, 5, 21, 3, 2, 66.7, 20, JSON.stringify([0, 1, 1])],
          [users[2].id, 5, 22, 3, 2, 66.7, 20, JSON.stringify([1, 0, 1])],
          
          // Emma Wilson's attempts
          [users[3].id, 1, 1, 4, 3, 75.0, 30, JSON.stringify([1, 0, 1, 1])],
          [users[3].id, 1, 2, 3, 2, 66.7, 20, JSON.stringify([0, 1, 1])],
          [users[3].id, 2, 6, 3, 2, 66.7, 20, JSON.stringify([1, 0, 1])],
          
          // Alex Brown's attempts
          [users[4].id, 1, 1, 4, 2, 50.0, 20, JSON.stringify([1, 0, 0, 1])],
          
          // Lisa Davis's attempts
          [users[5].id, 3, 11, 3, 3, 100.0, 30, JSON.stringify([0, 1, 1])],
          [users[5].id, 3, 12, 3, 2, 66.7, 20, JSON.stringify([1, 0, 1])],
          [users[5].id, 5, 21, 3, 2, 66.7, 20, JSON.stringify([0, 1, 1])],
          
          // David Miller's attempts
          [users[6].id, 1, 1, 4, 3, 75.0, 30, JSON.stringify([1, 0, 1, 1])],
          [users[6].id, 1, 2, 3, 2, 66.7, 20, JSON.stringify([0, 1, 1])],
          [users[6].id, 2, 6, 3, 2, 66.7, 20, JSON.stringify([1, 0, 1])],
          [users[6].id, 5, 21, 3, 3, 100.0, 30, JSON.stringify([1, 1, 1])],
          [users[6].id, 5, 22, 3, 2, 66.7, 20, JSON.stringify([1, 0, 1])],
          [users[6].id, 7, 31, 3, 2, 66.7, 20, JSON.stringify([0, 1, 1])],
          
          // Anna Garcia's attempts
          [users[7].id, 2, 6, 3, 3, 100.0, 30, JSON.stringify([0, 0, 0])],
          [users[7].id, 2, 7, 3, 3, 100.0, 30, JSON.stringify([0, 0, 0])],
          [users[7].id, 2, 8, 3, 2, 66.7, 20, JSON.stringify([0, 1, 1])],
          [users[7].id, 4, 16, 3, 2, 66.7, 20, JSON.stringify([1, 0, 1])],
          [users[7].id, 6, 26, 3, 2, 66.7, 20, JSON.stringify([1, 1, 0])]
        ];

        for (const attempt of sampleQuizAttempts) {
          await pool.execute(
            'INSERT INTO quiz_attempts (user_id, course_id, topic_id, questions_total, questions_correct, score_percentage, total_points, answers) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            attempt
          );
        }
        console.log('✅ Sample quiz attempts created');
      }
    }

    // Insert sample coding submissions
    const [codingSubmissionsExist] = await pool.execute(
      'SELECT id FROM coding_submissions LIMIT 1'
    );

    if ((codingSubmissionsExist as mysql.RowDataPacket[]).length === 0) {
      const [users] = await pool.execute(
        'SELECT id FROM users WHERE role = "student"'
      ) as [mysql.RowDataPacket[], mysql.FieldPacket[]];

      if (users.length > 0) {
        const sampleSubmissions = [
          // John Doe's submissions
          [users[0].id, 1, 'python', JSON.stringify(['1', '2', '3', '4']), true, 10],
          [users[0].id, 3, 'python', JSON.stringify(['1', '2', '3', '4', '5', '6', '7']), true, 10],
          [users[0].id, 5, 'python', JSON.stringify(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13']), false, 0],
          
          // Sarah Smith's submissions
          [users[1].id, 2, 'javascript', JSON.stringify(['1', '2', '3', '4']), true, 10],
          [users[1].id, 4, 'javascript', JSON.stringify(['1', '2', '3', '4', '5', '6', '7']), true, 10],
          [users[1].id, 6, 'python', JSON.stringify(['1', '2', '3', '4', '5', '6']), true, 20],
          
          // Mike Johnson's submissions
          [users[2].id, 1, 'python', JSON.stringify(['1', '2', '3', '4']), true, 10],
          [users[2].id, 3, 'python', JSON.stringify(['1', '2', '3', '4', '5', '6', '7']), true, 10],
          [users[2].id, 5, 'python', JSON.stringify(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13']), true, 20],
          [users[2].id, 6, 'python', JSON.stringify(['1', '2', '3', '4', '5', '6']), true, 20],
          [users[2].id, 7, 'python', JSON.stringify(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']), false, 0],
          
          // Lisa Davis's submissions
          [users[5].id, 1, 'python', JSON.stringify(['1', '2', '3', '4']), true, 10],
          [users[5].id, 3, 'python', JSON.stringify(['1', '2', '3', '4', '5', '6', '7']), true, 10],
          [users[5].id, 5, 'python', JSON.stringify(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13']), false, 0],
          
          // David Miller's submissions
          [users[6].id, 1, 'python', JSON.stringify(['1', '2', '3', '4']), true, 10],
          [users[6].id, 3, 'python', JSON.stringify(['1', '2', '3', '4', '5', '6', '7']), true, 10],
          [users[6].id, 5, 'python', JSON.stringify(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13']), true, 20],
          
          // Anna Garcia's submissions
          [users[7].id, 2, 'javascript', JSON.stringify(['1', '2', '3', '4']), true, 10],
          [users[7].id, 4, 'javascript', JSON.stringify(['1', '2', '3', '4', '5', '6', '7']), true, 10],
          [users[7].id, 6, 'python', JSON.stringify(['1', '2', '3', '4', '5', '6']), false, 0]
        ];

        for (const submission of sampleSubmissions) {
          await pool.execute(
            'INSERT INTO coding_submissions (user_id, challenge_id, programming_language, submitted_answer, is_correct, points_earned) VALUES (?, ?, ?, ?, ?, ?)',
            submission
          );
        }
        console.log('✅ Sample coding submissions created');
      }
    }

    // Insert sample user progress
    const [userProgressExist] = await pool.execute(
      'SELECT id FROM user_progress LIMIT 1'
    );

    if ((userProgressExist as mysql.RowDataPacket[]).length === 0) {
      const [users] = await pool.execute(
        'SELECT id FROM users WHERE role = "student"'
      ) as [mysql.RowDataPacket[], mysql.FieldPacket[]];

      if (users.length > 0) {
        const sampleProgress = [
          // John Doe's progress
          [users[0].id, 1, 1, 'topic', true, null, 25, 3],
          [users[0].id, 1, 2, 'topic', true, null, 30, 2],
          [users[0].id, 1, 3, 'topic', true, null, 35, 1],
          [users[0].id, 1, 4, 'topic', false, null, 0, 1],
          [users[0].id, 1, 5, 'topic', false, null, 0, 0],
          [users[0].id, 2, 6, 'topic', true, null, 25, 2],
          [users[0].id, 2, 7, 'topic', true, null, 30, 1],
          [users[0].id, 2, 8, 'topic', false, null, 0, 1],
          
          // Sarah Smith's progress
          [users[1].id, 2, 6, 'topic', true, null, 25, 1],
          [users[1].id, 2, 7, 'topic', true, null, 30, 1],
          [users[1].id, 2, 8, 'topic', true, null, 35, 1],
          [users[1].id, 2, 9, 'topic', true, null, 30, 1],
          [users[1].id, 2, 10, 'topic', false, null, 0, 1],
          [users[1].id, 4, 16, 'topic', true, null, 30, 1],
          [users[1].id, 4, 17, 'topic', true, null, 35, 1],
          [users[1].id, 4, 18, 'topic', false, null, 0, 1],
          
          // Mike Johnson's progress
          [users[2].id, 1, 1, 'topic', true, null, 25, 1],
          [users[2].id, 1, 2, 'topic', true, null, 30, 1],
          [users[2].id, 1, 3, 'topic', true, null, 35, 1],
          [users[2].id, 1, 4, 'topic', true, null, 30, 1],
          [users[2].id, 1, 5, 'topic', true, null, 40, 1],
          [users[2].id, 5, 21, 'topic', true, null, 30, 1],
          [users[2].id, 5, 22, 'topic', true, null, 35, 1],
          [users[2].id, 5, 23, 'topic', true, null, 40, 1],
          [users[2].id, 5, 24, 'topic', false, null, 0, 1],
          [users[2].id, 5, 25, 'topic', false, null, 0, 0],
          
          // Emma Wilson's progress
          [users[3].id, 1, 1, 'topic', true, null, 25, 1],
          [users[3].id, 1, 2, 'topic', true, null, 30, 1],
          [users[3].id, 1, 3, 'topic', true, null, 35, 1],
          [users[3].id, 1, 4, 'topic', false, null, 0, 1],
          [users[3].id, 1, 5, 'topic', false, null, 0, 0],
          [users[3].id, 2, 6, 'topic', true, null, 25, 1],
          [users[3].id, 2, 7, 'topic', true, null, 30, 1],
          [users[3].id, 2, 8, 'topic', false, null, 0, 1],
          
          // Alex Brown's progress
          [users[4].id, 1, 1, 'topic', true, null, 25, 1],
          [users[4].id, 1, 2, 'topic', false, null, 0, 1],
          [users[4].id, 1, 3, 'topic', false, null, 0, 0],
          
          // Lisa Davis's progress
          [users[5].id, 3, 11, 'topic', true, null, 25, 1],
          [users[5].id, 3, 12, 'topic', true, null, 30, 1],
          [users[5].id, 3, 13, 'topic', true, null, 30, 1],
          [users[5].id, 3, 14, 'topic', true, null, 25, 1],
          [users[5].id, 3, 15, 'topic', true, null, 35, 1],
          [users[5].id, 5, 21, 'topic', true, null, 30, 1],
          [users[5].id, 5, 22, 'topic', true, null, 35, 1],
          [users[5].id, 5, 23, 'topic', false, null, 0, 1],
          
          // David Miller's progress
          [users[6].id, 5, 21, 'topic', true, null, 30, 1],
          [users[6].id, 5, 22, 'topic', true, null, 35, 1],
          [users[6].id, 5, 23, 'topic', true, null, 40, 1],
          [users[6].id, 5, 24, 'topic', true, null, 35, 1],
          [users[6].id, 5, 25, 'topic', false, null, 0, 1],
          [users[6].id, 7, 31, 'topic', true, null, 30, 1],
          [users[6].id, 7, 32, 'topic', true, null, 35, 1],
          [users[6].id, 7, 33, 'topic', false, null, 0, 1],
          
          // Anna Garcia's progress
          [users[7].id, 2, 6, 'topic', true, null, 25, 1],
          [users[7].id, 2, 7, 'topic', true, null, 30, 1],
          [users[7].id, 2, 8, 'topic', true, null, 35, 1],
          [users[7].id, 2, 9, 'topic', true, null, 30, 1],
          [users[7].id, 2, 10, 'topic', true, null, 25, 1],
          [users[7].id, 4, 16, 'topic', true, null, 30, 1],
          [users[7].id, 4, 17, 'topic', true, null, 35, 1],
          [users[7].id, 4, 18, 'topic', true, null, 30, 1],
          [users[7].id, 4, 19, 'topic', false, null, 0, 1],
          [users[7].id, 4, 20, 'topic', false, null, 0, 0],
          [users[7].id, 6, 26, 'topic', true, null, 35, 1],
          [users[7].id, 6, 27, 'topic', true, null, 40, 1],
          [users[7].id, 6, 28, 'topic', false, null, 0, 1]
        ];

        for (const progress of sampleProgress) {
          await pool.execute(
            'INSERT INTO user_progress (user_id, course_id, topic_id, progress_type, completed, completed_at, points_earned, attempts) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            progress
          );
        }
        console.log('✅ Sample user progress created');
      }
    }

    console.log('✅ Default data inserted successfully');
  } catch (error) {
    console.error('❌ Error inserting default data:', error);
  }
}; 
