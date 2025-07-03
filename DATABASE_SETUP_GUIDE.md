# 🚀 Dynamic Database Setup Guide

This guide explains how to use the enhanced dynamic database system that automatically creates and updates tables when your application runs.

## 📋 Features

✅ **Automatic Table Creation** - Tables are created automatically on first run
✅ **Default Data Insertion** - Sample data and admin user created automatically  
✅ **Connection Pooling** - Efficient database connection management
✅ **Error Handling** - Comprehensive error handling and logging
✅ **Manual Controls** - API endpoints for manual database management
✅ **Development Reset** - Easy database reset for development

## 🔧 Environment Setup

Create a `.env.local` file in your project root with the following variables:

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=your_password_here
DATABASE_NAME=fyp
DATABASE_PORT=3306

# JWT Configuration (if using JWT tokens)
JWT_SECRET=your-super-secret-jwt-key-here

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🏗️ Database Tables Created Automatically

The system creates the following tables on first run:

### Core Tables
- **users** - User accounts and profiles
- **courses** - Course information and metadata
- **topics** - Individual lessons/topics within courses
- **quizzes** - Quiz data and configuration
- **quiz_questions** - Individual quiz questions

### Progress Tracking
- **user_enrollments** - Course enrollment data
- **user_progress** - User progress on topics
- **user_quiz_attempts** - Quiz attempt history
- **daily_activity** - Daily learning activity log

### Gamification
- **achievements** - Available achievements/badges
- **user_achievements** - User-earned achievements
- **skill_tree_nodes** - Skill tree structure

## 🎯 How It Works

### Automatic Initialization
```typescript
// The database initializes automatically on first query
import { query } from '@/lib/db';

// This will trigger database initialization if needed
const users = await query('SELECT * FROM users LIMIT 5');
```

### Manual Initialization
You can also initialize manually:
```typescript
import { initializeDatabase } from '@/lib/db';

await initializeDatabase();
```

## 🔄 API Endpoints for Database Management

### Check Database Connection
```bash
GET /api/admin/database/init
```
Returns database connection status.

### Initialize Database
```bash
POST /api/admin/database/init
```
Manually triggers database initialization.

### Reset Database (Development)
```bash
PUT /api/admin/database/init
```
Resets and reinitializes the entire database.

## 📊 Default Data Created

### Admin User
- **Username:** admin
- **Email:** admin@example.com  
- **Password:** admin123
- **Role:** admin

### Sample Achievements
- 🎯 First Steps (10 points)
- 🧠 Quiz Master (20 points)
- 📅 Streak Starter (30 points)
- 💎 Point Collector (100 points)
- 🏆 Course Finisher (200 points)
- ⚡ Speed Learner (50 points)
- 🔥 Persistent Learner (100 points)
- 📚 Knowledge Seeker (150 points)

### Sample Courses
- Introduction to Programming (Beginner)
- Web Development Basics (Beginner)
- Database Design (Intermediate)

## 🛠️ Usage Examples

### Basic Query
```typescript
import { query } from '@/lib/db';

// Get all users
const users = await query('SELECT * FROM users');

// Get user by ID
const user = await query('SELECT * FROM users WHERE id = ?', [userId]);
```

### Transaction Example
```typescript
import { beginTransaction } from '@/lib/db';

const connection = await beginTransaction();
try {
  await connection.execute('INSERT INTO users (username, email) VALUES (?, ?)', ['john', 'john@example.com']);
  await connection.execute('INSERT INTO user_enrollments (user_id, course_id) VALUES (?, ?)', [userId, courseId]);
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

### Check Connection
```typescript
import { checkConnection } from '@/lib/db';

const isConnected = await checkConnection();
if (!isConnected) {
  console.error('Database connection failed!');
}
```

## 🔧 Development Workflow

### First Time Setup
1. Clone the repository
2. Create `.env.local` with your database credentials
3. Install dependencies: `npm install`
4. Start the application: `npm run dev`
5. Database tables and data are created automatically!

### Development Reset
If you need to reset the database during development:

```bash
# Using the API endpoint
curl -X PUT http://localhost:3000/api/admin/database/init

# Or programmatically
import { resetDatabase } from '@/lib/db';
await resetDatabase();
```

## 📝 Important Notes

### Production Considerations
- Change default passwords before production
- Use strong JWT secrets
- Consider database backups
- Monitor connection pool usage

### Security
- The admin user is created with a default password
- Change this immediately in production
- Use environment variables for sensitive data
- Implement proper authentication middleware

### Performance
- Connection pooling is enabled (max 10 connections)
- Indexes are created on frequently queried columns
- Use transactions for multiple related operations

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check connection status
curl http://localhost:3000/api/admin/database/init
```

### Common Errors
- **Connection refused**: Check if MySQL is running
- **Access denied**: Verify database credentials
- **Database doesn't exist**: Create the database manually first
- **Table already exists**: Normal - tables are created with `IF NOT EXISTS`

### Debug Logs
The system provides detailed console logs:
- 🔄 Initializing database...
- ✅ Table created/verified
- ✅ Default admin user created
- ✅ Database initialized successfully

## 🎉 You're Ready!

Your database now automatically sets itself up and manages tables dynamically. Start building your application with confidence knowing the database layer is robust and self-managing! 