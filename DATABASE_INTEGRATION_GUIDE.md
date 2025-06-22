# Database Integration Guide

This guide explains how to connect your MySQL database schema to your Next.js application pages using the service layer I've created.

## Service Layer Overview

I've created three main service classes that handle database operations:

### 1. UserService (`lib/services/userService.ts`)
Handles user-related operations:
- User authentication and profile data
- User progress tracking
- Achievements and badges
- Leaderboard functionality
- Course enrollments

### 2. CourseService (`lib/services/courseService.ts`)
Handles course-related operations:
- Course management and listings
- Skill nodes and course structure
- Prerequisites and unlocking logic
- Course statistics

### 3. QuizService (`lib/services/quizService.ts`)
Handles quiz-related operations:
- Quiz questions and answers
- Quiz attempts and scoring
- Performance tracking
- Quiz statistics

## Database Connection Setup

### Environment Variables
Add these to your `.env.local` file:

```env
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=eduquest
DATABASE_PORT=3306
```

### Database Configuration
Your database configuration is already set up in `lib/db.ts` with proper TypeScript types.

## Page-to-Database Mapping

### 1. Dashboard Page (`src/app/dashboard/page.tsx`)

**Current Mock Data → Database Integration:**

Replace the mock data calls with API calls to your new dashboard endpoint:

```typescript
// Before (Mock Data)
const mockUserData = { ... };

// After (Database Integration)
useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/dashboard?userId=${currentUserId}`);
      const data = await response.json();
      if (data.success) {
        setUserData(data.data.user);
        setCourses(data.data.courses);
        setAchievements(data.data.achievements);
        setQuizStats(data.data.quizStats);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };
  fetchDashboardData();
}, [currentUserId]);
```

**Database Tables Used:**
- `users` - User profile and game stats
- `user_enrollments` - Course progress
- `user_achievements` - Earned badges
- `quiz_attempts` - Quiz performance stats

### 2. Courses Page (`src/app/courses/page.tsx`)

**Integration Example:**

```typescript
// Replace mockCourses with API call
useEffect(() => {
  const fetchCourses = async () => {
    try {
      const params = new URLSearchParams({
        userId: currentUserId.toString(),
        ...(activeFilter !== 'all' && { difficulty: activeFilter }),
        ...(searchTerm && { search: searchTerm })
      });
      
      const response = await fetch(`/api/courses?${params}`);
      const data = await response.json();
      if (data.success) {
        setCourses(data.courses);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };
  fetchCourses();
}, [currentUserId, activeFilter, searchTerm]);
```

**Database Tables Used:**
- `courses` - Course information
- `users` - Instructor details
- `user_enrollments` - User enrollment status
- `skill_nodes` - Course content structure
- `user_node_progress` - Individual lesson progress

### 3. Quiz Page (`src/app/quiz/page.tsx`)

**Integration Example:**

```typescript
// Fetch quiz questions
const loadQuizQuestions = async (courseId: number, nodeId: string) => {
  try {
    const response = await fetch(`/api/quiz/questions?courseId=${courseId}&nodeId=${nodeId}`);
    const data = await response.json();
    if (data.success) {
      setQuestions(data.questions);
    }
  } catch (error) {
    console.error('Failed to load quiz questions:', error);
  }
};

// Submit quiz results
const submitQuiz = async (results: QuizResults) => {
  try {
    const response = await fetch('/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUserId,
        courseId,
        nodeId,
        questions,
        answers: results.answers,
        score: results.score,
        scorePercentage: results.scorePercentage,
        totalPoints: results.totalPoints,
        timeBonus: results.timeBonus,
        streakBonus: results.streakBonus,
        maxStreak: results.maxStreak,
        timeTaken: results.timeTaken
      })
    });
    
    const data = await response.json();
    if (data.success) {
      // Handle successful submission
      setShowResults(true);
      setNodeCompleted(data.nodeCompleted);
    }
  } catch (error) {
    console.error('Failed to submit quiz:', error);
  }
};
```

**Database Tables Used:**
- `quiz_questions` - Question content and answers
- `quiz_attempts` - User quiz attempts
- `quiz_answers` - Individual question responses
- `user_node_progress` - Progress tracking
- `users` - Points and streak updates

## API Routes I've Created

### 1. `/api/dashboard` (GET)
- **Purpose**: Get user dashboard data
- **Parameters**: `userId` (query parameter)
- **Returns**: User stats, course progress, achievements, quiz stats

### 2. `/api/courses` (GET)
- **Purpose**: Get courses with user progress
- **Parameters**: `userId`, `difficulty`, `category` (query parameters)
- **Returns**: Course list with enrollment status and progress

### 3. `/api/courses` (POST)
- **Purpose**: Create new course
- **Body**: Course details (title, description, instructor_id, difficulty)
- **Returns**: Created course ID

### 4. `/api/quiz/questions` (GET)
- **Purpose**: Get quiz questions for a node
- **Parameters**: `courseId`, `nodeId` (query parameters)
- **Returns**: Quiz questions (without correct answers)

### 5. `/api/quiz/questions` (POST)
- **Purpose**: Create new quiz question
- **Body**: Question details and options
- **Returns**: Created question ID

## Additional API Routes You Need

Based on your application, you should also create:

### User Management
```typescript
// /api/users/[id]/route.ts - Get/update user profile
// /api/users/login/route.ts - User authentication
// /api/users/register/route.ts - User registration
```

### Course Management
```typescript
// /api/courses/[id]/route.ts - Get specific course details
// /api/courses/[id]/enroll/route.ts - Enroll in course
// /api/courses/[id]/skill-tree/route.ts - Get course skill tree
```

### Progress Tracking
```typescript
// /api/progress/route.ts - Update node progress
// /api/achievements/route.ts - Get user achievements
// /api/leaderboard/route.ts - Get leaderboard data
```

## Frontend Integration Steps

### Step 1: Replace Mock Data
1. Identify all mock data in your components
2. Create corresponding API endpoints
3. Replace static data with API calls
4. Add loading states and error handling

### Step 2: Add User Context
Create a user context to manage current user state:

```typescript
// contexts/UserContext.tsx
const UserContext = createContext({
  user: null,
  setUser: () => {},
  isLoading: true
});
```

### Step 3: Environment Setup
1. Set up your database connection variables
2. Create the database using the provided schema
3. Populate initial data (achievements, system settings)
4. Test database connectivity

### Step 4: Authentication Integration
Add user authentication to determine the current user:

```typescript
// hooks/useAuth.ts
const useAuth = () => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Check for stored auth token
    // Validate with server
    // Set user state
  }, []);
  
  return { user, login, logout, isAuthenticated };
};
```

## Data Flow Example

Here's how data flows from database to UI for the dashboard:

1. **User loads dashboard page**
2. **Frontend calls** `/api/dashboard?userId=123`
3. **API route** calls `UserService.getUserDashboardData(123)`
4. **Service** executes SQL queries across multiple tables
5. **Service** returns formatted data
6. **API route** formats for frontend consumption
7. **Frontend** updates UI components with real data

## Testing Your Integration

### 1. Database Setup
```sql
-- Run the database schema
SOURCE database_schema.sql;

-- Insert test data
INSERT INTO users (email, password_hash, first_name, last_name, role) 
VALUES ('test@example.com', 'hashed_password', 'Test', 'User', 'student');

INSERT INTO courses (title, description, instructor_id, difficulty) 
VALUES ('Test Course', 'A test course', 1, 'foundation');
```

### 2. API Testing
Test each endpoint using tools like Postman or curl:

```bash
# Test dashboard API
curl "http://localhost:3000/api/dashboard?userId=1"

# Test courses API
curl "http://localhost:3000/api/courses?userId=1"
```

### 3. Frontend Testing
1. Start with dashboard page integration
2. Verify data loads correctly
3. Test error handling
4. Move to other pages progressively

## Security Considerations

1. **Authentication**: Add proper user authentication before accessing APIs
2. **Authorization**: Verify users can only access their own data
3. **Input Validation**: Validate all inputs before database operations
4. **SQL Injection**: Use parameterized queries (already implemented)
5. **Rate Limiting**: Add rate limiting to prevent abuse

## Performance Tips

1. **Pagination**: Add pagination for large data sets
2. **Caching**: Implement caching for frequently accessed data
3. **Indexing**: Ensure proper database indexes (included in schema)
4. **Connection Pooling**: Use connection pooling (already configured)

This integration will transform your static mockup into a fully functional, database-driven application! 