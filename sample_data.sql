-- Sample data for EduQuest subjects and skill trees

-- Insert sample users
INSERT INTO users (email, password_hash, username, role, total_points, level) VALUES
('john@example.com', 'hashed_password', 'john_doe', 'student', 1250, 3),
('jane@example.com', 'hashed_password', 'jane_smith', 'student', 890, 2),
('prof@example.com', 'hashed_password', 'professor', 'teacher', 0, 1);

-- Insert sample subjects
INSERT INTO subjects (title, description, instructor_id, difficulty, estimated_duration, icon, color_theme) VALUES
('Web Development', 'Master modern web development with HTML, CSS, JavaScript, and React', 3, 'foundation', 120, '🌐', 'blue'),
('Data Science', 'Learn data analysis, machine learning, and statistical modeling', 3, 'intermediate', 180, '📊', 'green'),
('Mobile Development', 'Build iOS and Android apps with React Native and Flutter', 3, 'advanced', 150, '📱', 'purple'),
('Cybersecurity', 'Understand security principles, ethical hacking, and defense strategies', 3, 'advanced', 200, '🔒', 'red');

-- Insert skill trees for Web Development
INSERT INTO skill_trees (subject_id, title, description, icon, order_index) VALUES
(1, 'HTML & CSS Fundamentals', 'Learn the building blocks of web development', '🎨', 1),
(1, 'JavaScript Mastery', 'Master modern JavaScript and ES6+ features', '⚡', 2),
(1, 'React Framework', 'Build dynamic user interfaces with React', '⚛️', 3),
(1, 'Backend Integration', 'Connect frontend to databases and APIs', '🔗', 4);

-- Insert skill trees for Data Science
INSERT INTO skill_trees (subject_id, title, description, icon, order_index) VALUES
(2, 'Python Basics', 'Learn Python programming fundamentals', '🐍', 1),
(2, 'Data Analysis', 'Master pandas, numpy, and data manipulation', '📈', 2),
(2, 'Machine Learning', 'Build and train ML models', '🤖', 3),
(2, 'Data Visualization', 'Create compelling charts and dashboards', '📊', 4);

-- Insert skill trees for Mobile Development
INSERT INTO skill_trees (subject_id, title, description, icon, order_index) VALUES
(3, 'React Native Basics', 'Learn cross-platform mobile development', '📱', 1),
(3, 'State Management', 'Master Redux and context API', '🔄', 2),
(3, 'Native Features', 'Integrate device features and APIs', '🔧', 3),
(3, 'App Store Deployment', 'Publish apps to stores', '🚀', 4);

-- Insert skill trees for Cybersecurity
INSERT INTO skill_trees (subject_id, title, description, icon, order_index) VALUES
(4, 'Security Fundamentals', 'Understand basic security concepts', '🛡️', 1),
(4, 'Network Security', 'Learn about network vulnerabilities and defense', '🌐', 2),
(4, 'Ethical Hacking', 'Master penetration testing techniques', '🔍', 3),
(4, 'Security Architecture', 'Design secure systems and applications', '🏗️', 4);

-- Insert skill nodes for HTML & CSS Fundamentals (Level 1-3)
INSERT INTO skill_nodes (skill_tree_id, node_id, title, description, level, position_x, position_y, points, difficulty, estimated_time, type, icon) VALUES
-- Level 1 (Foundation)
(1, 'html-basics', 'HTML Structure', 'Learn basic HTML tags and document structure', 1, 50, 10, 50, 'foundation', '30 min', 'lesson', '📄'),
(1, 'css-basics', 'CSS Styling', 'Master CSS selectors and basic styling', 1, 25, 35, 50, 'foundation', '45 min', 'lesson', '🎨'),
(1, 'css-layout', 'CSS Layout', 'Learn flexbox and grid layouts', 1, 75, 35, 50, 'foundation', '60 min', 'lesson', '📐'),

-- Level 2 (Intermediate)
(1, 'responsive-design', 'Responsive Design', 'Create mobile-friendly websites', 2, 50, 60, 75, 'intermediate', '90 min', 'lesson', '📱'),
(1, 'css-animations', 'CSS Animations', 'Add smooth animations and transitions', 2, 15, 60, 75, 'intermediate', '75 min', 'lesson', '✨'),
(1, 'css-frameworks', 'CSS Frameworks', 'Use Bootstrap and Tailwind CSS', 2, 85, 60, 75, 'intermediate', '120 min', 'lesson', '🎯'),

-- Level 3 (Advanced)
(1, 'css-architecture', 'CSS Architecture', 'Organize CSS with BEM and CSS modules', 3, 50, 85, 100, 'advanced', '120 min', 'lesson', '🏗️'),
(1, 'accessibility', 'Web Accessibility', 'Make websites accessible to all users', 3, 25, 85, 100, 'advanced', '90 min', 'lesson', '♿'),
(1, 'performance', 'Performance Optimization', 'Optimize CSS for better performance', 3, 75, 85, 100, 'advanced', '60 min', 'lesson', '⚡');

-- Insert skill nodes for JavaScript Mastery (Level 1-4)
INSERT INTO skill_nodes (skill_tree_id, node_id, title, description, level, position_x, position_y, points, difficulty, estimated_time, type, icon) VALUES
-- Level 1 (Foundation)
(2, 'js-basics', 'JavaScript Basics', 'Learn variables, functions, and control flow', 1, 50, 10, 50, 'foundation', '60 min', 'lesson', '📝'),
(2, 'js-dom', 'DOM Manipulation', 'Interact with HTML elements using JavaScript', 1, 25, 25, 50, 'foundation', '75 min', 'lesson', '🌳'),
(2, 'js-events', 'Event Handling', 'Handle user interactions and events', 1, 75, 25, 50, 'foundation', '60 min', 'lesson', '🖱️'),

-- Level 2 (Intermediate)
(2, 'es6-features', 'ES6+ Features', 'Master modern JavaScript features', 2, 50, 40, 75, 'intermediate', '90 min', 'lesson', '⚡'),
(2, 'async-js', 'Asynchronous JavaScript', 'Work with promises and async/await', 2, 15, 55, 75, 'intermediate', '120 min', 'lesson', '⏱️'),
(2, 'js-modules', 'Modules and Bundlers', 'Organize code with modules', 2, 85, 55, 75, 'intermediate', '90 min', 'lesson', '📦'),

-- Level 3 (Advanced)
(2, 'js-patterns', 'Design Patterns', 'Apply common JavaScript patterns', 3, 50, 70, 100, 'advanced', '120 min', 'lesson', '🎭'),
(2, 'js-testing', 'Testing JavaScript', 'Write unit tests and integration tests', 3, 25, 85, 100, 'advanced', '150 min', 'lesson', '🧪'),
(2, 'js-performance', 'Performance Optimization', 'Optimize JavaScript for speed', 3, 75, 85, 100, 'advanced', '90 min', 'lesson', '🚀'),

-- Level 4 (Expert)
(2, 'js-advanced', 'Advanced Concepts', 'Master advanced JavaScript concepts', 4, 50, 100, 150, 'advanced', '180 min', 'lesson', '🎯');

-- Insert skill nodes for React Framework (Level 2-4)
INSERT INTO skill_nodes (skill_tree_id, node_id, title, description, level, position_x, position_y, points, difficulty, estimated_time, type, icon) VALUES
-- Level 2 (Intermediate)
(3, 'react-basics', 'React Fundamentals', 'Learn React components and JSX', 2, 50, 10, 75, 'intermediate', '90 min', 'lesson', '⚛️'),
(3, 'react-hooks', 'React Hooks', 'Master useState, useEffect, and custom hooks', 2, 25, 25, 75, 'intermediate', '120 min', 'lesson', '🎣'),
(3, 'react-props', 'Props and State', 'Manage component data and state', 2, 75, 25, 75, 'intermediate', '90 min', 'lesson', '📤'),

-- Level 3 (Advanced)
(3, 'react-routing', 'React Router', 'Implement client-side routing', 3, 50, 40, 100, 'advanced', '75 min', 'lesson', '🗺️'),
(3, 'react-context', 'Context API', 'Share state across components', 3, 15, 55, 100, 'advanced', '90 min', 'lesson', '🌐'),
(3, 'react-performance', 'Performance Optimization', 'Optimize React applications', 3, 85, 55, 100, 'advanced', '120 min', 'lesson', '⚡'),

-- Level 4 (Expert)
(3, 'react-advanced', 'Advanced React', 'Master advanced React patterns', 4, 50, 70, 150, 'advanced', '180 min', 'lesson', '🎯'),
(3, 'react-testing', 'Testing React', 'Test React components and applications', 4, 25, 85, 150, 'advanced', '150 min', 'lesson', '🧪'),
(3, 'react-deployment', 'Deployment', 'Deploy React applications to production', 4, 75, 85, 150, 'advanced', '90 min', 'lesson', '🚀');

-- Insert prerequisites for skill nodes
INSERT INTO node_prerequisites (node_id, prerequisite_node_id) VALUES
-- HTML & CSS prerequisites
(2, 1), -- CSS Styling requires HTML Structure
(3, 2), -- CSS Layout requires CSS Styling
(4, 3), -- Responsive Design requires CSS Layout
(5, 2), -- CSS Animations requires CSS Styling
(6, 3), -- CSS Frameworks requires CSS Layout
(7, 6), -- CSS Architecture requires CSS Frameworks
(8, 4), -- Web Accessibility requires Responsive Design
(9, 7), -- Performance Optimization requires CSS Architecture

-- JavaScript prerequisites
(11, 10), -- DOM Manipulation requires JavaScript Basics
(12, 11), -- Event Handling requires DOM Manipulation
(13, 10), -- ES6+ Features requires JavaScript Basics
(14, 13), -- Asynchronous JavaScript requires ES6+ Features
(15, 14), -- Modules and Bundlers requires Asynchronous JavaScript
(16, 15), -- Design Patterns requires Modules and Bundlers
(17, 16), -- Testing JavaScript requires Design Patterns
(18, 16), -- Performance Optimization requires Design Patterns
(19, 18), -- Advanced Concepts requires Performance Optimization

-- React prerequisites
(20, 10), -- React Fundamentals requires JavaScript Basics
(21, 20), -- React Hooks requires React Fundamentals
(22, 21), -- Props and State requires React Hooks
(23, 22), -- React Router requires Props and State
(24, 22), -- Context API requires Props and State
(25, 23), -- Performance Optimization requires React Router
(26, 25), -- Advanced React requires Performance Optimization
(27, 26), -- Testing React requires Advanced React
(28, 26); -- Deployment requires Advanced React

-- Insert sample user enrollments
INSERT INTO user_enrollments (user_id, subject_id, progress_percentage, total_points_earned) VALUES
(1, 1, 45.5, 225), -- John is enrolled in Web Development
(1, 2, 12.3, 110), -- John is also enrolled in Data Science
(2, 1, 78.2, 400), -- Jane is enrolled in Web Development
(2, 3, 23.1, 150); -- Jane is enrolled in Mobile Development

-- Insert sample user progress on nodes
INSERT INTO user_node_progress (user_id, skill_tree_id, node_id, completed, points_earned) VALUES
-- John's progress in Web Development
(1, 1, 'html-basics', TRUE, 50),
(1, 1, 'css-basics', TRUE, 50),
(1, 1, 'css-layout', TRUE, 50),
(1, 1, 'responsive-design', TRUE, 75),
(1, 2, 'js-basics', TRUE, 50),
(1, 2, 'js-dom', FALSE, 0),

-- Jane's progress in Web Development
(2, 1, 'html-basics', TRUE, 50),
(2, 1, 'css-basics', TRUE, 50),
(2, 1, 'css-layout', TRUE, 50),
(2, 1, 'responsive-design', TRUE, 75),
(2, 1, 'css-animations', TRUE, 75),
(2, 1, 'css-frameworks', TRUE, 75),
(2, 2, 'js-basics', TRUE, 50),
(2, 2, 'js-dom', TRUE, 50),
(2, 2, 'js-events', TRUE, 50),
(2, 2, 'es6-features', TRUE, 75),
(2, 3, 'react-basics', TRUE, 75),
(2, 3, 'react-hooks', TRUE, 75);

-- Insert sample achievements
INSERT INTO achievements (title, description, icon, type, requirement_value, points_reward, rarity) VALUES
('First Steps', 'Complete your first lesson', '👣', 'completion', 1, 50, 'common'),
('Quick Learner', 'Complete 5 lessons in a day', '⚡', 'speed', 5, 100, 'rare'),
('Skill Master', 'Complete all nodes in a skill tree', '🏆', 'completion', 1, 500, 'epic'),
('Level Up', 'Reach level 5 in any subject', '⭐', 'level', 5, 200, 'rare'),
('Streak Master', 'Maintain a 7-day learning streak', '🔥', 'streak', 7, 300, 'epic'),
('Perfect Score', 'Get 100% on a quiz', '🎯', 'accuracy', 100, 150, 'rare');

-- Insert sample user achievements
INSERT INTO user_achievements (user_id, achievement_id, earned_at, progress_value) VALUES
(1, 1, NOW(), 1),
(1, 4, NOW(), 5),
(2, 1, NOW(), 1),
(2, 2, NOW(), 5),
(2, 3, NOW(), 1);

-- Display summary
SELECT 'Sample data inserted successfully!' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_subjects FROM subjects;
SELECT COUNT(*) as total_skill_trees FROM skill_trees;
SELECT COUNT(*) as total_skill_nodes FROM skill_nodes;
SELECT COUNT(*) as total_enrollments FROM user_enrollments;
SELECT COUNT(*) as total_quiz_attempts FROM quiz_attempts; 