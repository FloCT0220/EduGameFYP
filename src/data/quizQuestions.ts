export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    points: number;
    difficulty: 'easy' | 'medium' | 'hard';
    explanation?: string;
    nodeId: string;
    courseId: string;
}

// Quiz questions organized by course and node
export const quizQuestions: Record<string, Record<string, QuizQuestion[]>> = {
    '1': { // React Fundamentals Course
        'react-1': [ // What is React?
            {
                id: 'react-1-q1',
                question: 'What is React?',
                options: ['A database', 'A JavaScript library for building user interfaces', 'A CSS framework', 'A server-side language'],
                correctAnswer: 1,
                points: 10,
                difficulty: 'easy',
                explanation: 'React is a JavaScript library developed by Facebook for building user interfaces, especially for web applications.',
                nodeId: 'react-1',
                courseId: '1'
            },
            {
                id: 'react-1-q2',
                question: 'Who developed React?',
                options: ['Google', 'Microsoft', 'Facebook (Meta)', 'Apple'],
                correctAnswer: 2,
                points: 10,
                difficulty: 'easy',
                explanation: 'React was developed by Facebook (now Meta) and was first released in 2013.',
                nodeId: 'react-1',
                courseId: '1'
            },
            {
                id: 'react-1-q3',
                question: 'What is the main advantage of using React?',
                options: ['Better styling', 'Component reusability', 'Faster loading', 'Built-in database'],
                correctAnswer: 1,
                points: 15,
                difficulty: 'medium',
                explanation: 'React\'s component-based architecture allows for highly reusable UI components.',
                nodeId: 'react-1',
                courseId: '1'
            }
        ],
        'react-2': [ // JSX Basics
            {
                id: 'react-2-q1',
                question: 'What does JSX stand for?',
                options: ['JavaScript XML', 'JavaScript Extension', 'Java Syntax Extension', 'JavaScript Extra'],
                correctAnswer: 0,
                points: 10,
                difficulty: 'easy',
                explanation: 'JSX stands for JavaScript XML and allows you to write HTML-like syntax in JavaScript.',
                nodeId: 'react-2',
                courseId: '1'
            },
            {
                id: 'react-2-q2',
                question: 'Which of the following is valid JSX?',
                options: ['<div class="container">', '<div className="container">', '<div Class="container">', '<div classname="container">'],
                correctAnswer: 1,
                points: 15,
                difficulty: 'medium',
                explanation: 'In JSX, you use className instead of class because class is a reserved word in JavaScript.',
                nodeId: 'react-2',
                courseId: '1'
            },
            {
                id: 'react-2-q3',
                question: 'How do you embed JavaScript expressions in JSX?',
                options: ['{{ expression }}', '{ expression }', '[ expression ]', '( expression )'],
                correctAnswer: 1,
                points: 15,
                difficulty: 'medium',
                explanation: 'JavaScript expressions are embedded in JSX using single curly braces { }.',
                nodeId: 'react-2',
                courseId: '1'
            }
        ],
        'react-3': [ // Components
            {
                id: 'react-3-q1',
                question: 'What are the two main types of components in React?',
                options: ['Class and Method', 'Functional and Class', 'Static and Dynamic', 'Simple and Complex'],
                correctAnswer: 1,
                points: 15,
                difficulty: 'medium',
                explanation: 'React has two main types of components: Functional components and Class components.',
                nodeId: 'react-3',
                courseId: '1'
            },
            {
                id: 'react-3-q2',
                question: 'Which is the modern preferred way to create components?',
                options: ['Class components', 'Functional components', 'Both equally', 'Object components'],
                correctAnswer: 1,
                points: 20,
                difficulty: 'medium',
                explanation: 'Functional components with hooks are now the preferred way to create React components.',
                nodeId: 'react-3',
                courseId: '1'
            }
        ],
        'react-4': [ // Props
            {
                id: 'react-4-q1',
                question: 'What are props in React?',
                options: ['Properties passed to components', 'Component methods', 'State variables', 'CSS styles'],
                correctAnswer: 0,
                points: 15,
                difficulty: 'easy',
                explanation: 'Props are properties passed from parent components to child components.',
                nodeId: 'react-4',
                courseId: '1'
            },
            {
                id: 'react-4-q2',
                question: 'Are props mutable or immutable?',
                options: ['Mutable', 'Immutable', 'Depends on the component', 'Sometimes mutable'],
                correctAnswer: 1,
                points: 20,
                difficulty: 'medium',
                explanation: 'Props are immutable - they cannot be changed by the component that receives them.',
                nodeId: 'react-4',
                courseId: '1'
            }
        ],
        'react-5': [ // State Management
            {
                id: 'react-5-q1',
                question: 'Which hook is used for state management in functional components?',
                options: ['useEffect', 'useState', 'useContext', 'useMemo'],
                correctAnswer: 1,
                points: 20,
                difficulty: 'easy',
                explanation: 'useState is the hook used to manage state in functional components.',
                nodeId: 'react-5',
                courseId: '1'
            },
            {
                id: 'react-5-q2',
                question: 'What does useState return?',
                options: ['Just the state value', 'Just the setter function', 'An array with state value and setter function', 'An object with state and setter'],
                correctAnswer: 2,
                points: 25,
                difficulty: 'medium',
                explanation: 'useState returns an array where the first element is the current state value and the second is the setter function.',
                nodeId: 'react-5',
                courseId: '1'
            }
        ],
        'general': [ // General React Questions
            {
                id: 'react-general-q1',
                question: 'What is the Virtual DOM in React?',
                options: ['A real DOM element', 'A lightweight copy of the real DOM in memory', 'A CSS framework', 'A debugging tool'],
                correctAnswer: 1,
                points: 20,
                difficulty: 'medium',
                explanation: 'The Virtual DOM is a lightweight JavaScript representation of the real DOM that React uses for efficient updates.',
                nodeId: 'general',
                courseId: '1'
            },
            {
                id: 'react-general-q2',
                question: 'What is the purpose of keys in React lists?',
                options: ['For styling', 'For performance optimization and tracking changes', 'For debugging', 'For routing'],
                correctAnswer: 1,
                points: 25,
                difficulty: 'medium',
                explanation: 'Keys help React identify which items have changed, been added, or removed, enabling efficient re-rendering.',
                nodeId: 'general',
                courseId: '1'
            },
            {
                id: 'react-general-q3',
                question: 'Which method is used to update state in class components?',
                options: ['updateState()', 'setState()', 'changeState()', 'modifyState()'],
                correctAnswer: 1,
                points: 15,
                difficulty: 'easy',
                explanation: 'setState() is the method used to update state in React class components.',
                nodeId: 'general',
                courseId: '1'
            }
        ]
    },
    '2': { // JavaScript Advanced Concepts Course
        'js-1': [ // Closures
            {
                id: 'js-1-q1',
                question: 'What is a closure in JavaScript?',
                options: ['A function that closes the browser', 'A function with access to outer scope variables', 'A closed loop', 'A function that returns nothing'],
                correctAnswer: 1,
                points: 20,
                difficulty: 'medium',
                explanation: 'A closure is a function that has access to variables from its outer (enclosing) scope even after the outer function has finished executing.',
                nodeId: 'js-1',
                courseId: '2'
            },
            {
                id: 'js-1-q2',
                question: 'What will this code output? function outer() { let x = 10; return function() { console.log(x); }; } const inner = outer(); inner();',
                options: ['undefined', 'Error', '10', 'null'],
                correctAnswer: 2,
                points: 25,
                difficulty: 'hard',
                explanation: 'The inner function forms a closure and retains access to the variable x from the outer scope.',
                nodeId: 'js-1',
                courseId: '2'
            }
        ],
        'js-2': [ // Prototypes
            {
                id: 'js-2-q1',
                question: 'What is the prototype chain in JavaScript?',
                options: ['A chain of functions', 'A mechanism for inheritance', 'A chain of errors', 'A performance optimization'],
                correctAnswer: 1,
                points: 25,
                difficulty: 'medium',
                explanation: 'The prototype chain is JavaScript\'s mechanism for inheritance, where objects can inherit properties and methods from other objects.',
                nodeId: 'js-2',
                courseId: '2'
            }
        ],
        'js-3': [ // Async/Await
            {
                id: 'js-3-q1',
                question: 'What does the async keyword do?',
                options: ['Makes a function synchronous', 'Makes a function return a Promise', 'Speeds up execution', 'Handles errors'],
                correctAnswer: 1,
                points: 25,
                difficulty: 'medium',
                explanation: 'The async keyword makes a function return a Promise, enabling the use of await inside it.',
                nodeId: 'js-3',
                courseId: '2'
            }
        ],
        'general': [ // General JavaScript Questions
            {
                id: 'js-general-q1',
                question: 'What is the difference between == and === in JavaScript?',
                options: ['No difference', '== checks type and value, === checks only value', '=== checks type and value, == checks only value', '=== checks type and value, == performs type coercion'],
                correctAnswer: 3,
                points: 20,
                difficulty: 'medium',
                explanation: '=== performs strict equality checking both type and value, while == performs type coercion before comparison.',
                nodeId: 'general',
                courseId: '2'
            },
            {
                id: 'js-general-q2',
                question: 'What is hoisting in JavaScript?',
                options: ['Moving variables to the top', 'A behavior where declarations are moved to the top of their scope', 'A performance optimization', 'A debugging technique'],
                correctAnswer: 1,
                points: 25,
                difficulty: 'hard',
                explanation: 'Hoisting is JavaScript\'s behavior of moving variable and function declarations to the top of their containing scope during compilation.',
                nodeId: 'general',
                courseId: '2'
            }
        ]
    },
    '3': { // TypeScript Complete Guide Course
        'ts-1': [ // TypeScript Basics
            {
                id: 'ts-1-q1',
                question: 'What is TypeScript?',
                options: ['A new programming language', 'A superset of JavaScript', 'A JavaScript framework', 'A database query language'],
                correctAnswer: 1,
                points: 15,
                difficulty: 'easy',
                explanation: 'TypeScript is a superset of JavaScript that adds static type definitions.',
                nodeId: 'ts-1',
                courseId: '3'
            },
            {
                id: 'ts-1-q2',
                question: 'What is the main benefit of using TypeScript?',
                options: ['Faster runtime performance', 'Type safety and better tooling', 'Smaller bundle size', 'Better styling'],
                correctAnswer: 1,
                points: 20,
                difficulty: 'medium',
                explanation: 'TypeScript provides type safety, which helps catch errors at compile time and provides better IDE support.',
                nodeId: 'ts-1',
                courseId: '3'
            }
        ],
        'ts-2': [ // Interfaces
            {
                id: 'ts-2-q1',
                question: 'What is an interface in TypeScript?',
                options: ['A class definition', 'A contract that defines the structure of an object', 'A function type', 'A variable declaration'],
                correctAnswer: 1,
                points: 20,
                difficulty: 'medium',
                explanation: 'An interface defines a contract that specifies what properties and methods an object should have.',
                nodeId: 'ts-2',
                courseId: '3'
            }
        ],
        'ts-3': [ // Generics
            {
                id: 'ts-3-q1',
                question: 'What are generics in TypeScript?',
                options: ['General functions', 'Type variables that make components reusable', 'Generic objects', 'Basic types'],
                correctAnswer: 1,
                points: 30,
                difficulty: 'hard',
                explanation: 'Generics allow you to create reusable components that work with multiple types while maintaining type safety.',
                nodeId: 'ts-3',
                courseId: '3'
            }
        ],
        'general': [ // General TypeScript Questions
            {
                id: 'ts-general-q1',
                question: 'How do you compile TypeScript to JavaScript?',
                options: ['node file.ts', 'tsc file.ts', 'npm run file.ts', 'ts-compile file.ts'],
                correctAnswer: 1,
                points: 15,
                difficulty: 'easy',
                explanation: 'The TypeScript compiler (tsc) is used to compile TypeScript files to JavaScript.',
                nodeId: 'general',
                courseId: '3'
            },
            {
                id: 'ts-general-q2',
                question: 'What is the any type in TypeScript?',
                options: ['A strict type', 'A type that disables type checking', 'A generic type', 'An interface type'],
                correctAnswer: 1,
                points: 20,
                difficulty: 'medium',
                explanation: 'The any type disables TypeScript\'s type checking and should be avoided when possible.',
                nodeId: 'general',
                courseId: '3'
            }
        ]
    }
};

// Helper function to get questions for a specific node
export const getQuestionsForNode = (courseId: string, nodeId: string): QuizQuestion[] => {
    return quizQuestions[courseId]?.[nodeId] || [];
};

// Helper function to get review questions from completed nodes
export const getReviewQuestions = (courseId: string, completedNodeIds: string[], maxQuestions: number = 2): QuizQuestion[] => {
    const reviewQuestions: QuizQuestion[] = [];
    
    completedNodeIds.forEach(nodeId => {
        const nodeQuestions = getQuestionsForNode(courseId, nodeId);
        if (nodeQuestions.length > 0) {
            // Randomly select questions from completed nodes
            const shuffled = [...nodeQuestions].sort(() => 0.5 - Math.random());
            reviewQuestions.push(...shuffled.slice(0, 1)); // Take 1 question per completed node
        }
    });
    
    // Shuffle and limit the number of review questions
    return reviewQuestions.sort(() => 0.5 - Math.random()).slice(0, maxQuestions);
};

// Helper function to combine current node questions with review questions
export const generateQuizQuestions = (
    courseId: string, 
    currentNodeId: string, 
    completedNodeIds: string[]
): QuizQuestion[] => {
    const currentNodeQuestions = getQuestionsForNode(courseId, currentNodeId);
    const reviewQuestions = getReviewQuestions(courseId, completedNodeIds, 2);
    
    // Combine and shuffle questions
    const allQuestions = [...currentNodeQuestions, ...reviewQuestions];
    return allQuestions.sort(() => 0.5 - Math.random());
}; 