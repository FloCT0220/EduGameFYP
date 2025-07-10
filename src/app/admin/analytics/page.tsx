'use client';

import { useState, useEffect } from 'react';
import { FaUsers, FaBook, FaChartLine, FaCalendarAlt, FaTrophy } from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsData {
  userEngagement: {
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    retentionRate: number;
    averageSessionTime: number;
    loginFrequency: { [key: string]: number };
  };
  coursePerformance: {
    totalCourses: number;
    averageCompletionRate: number;
    popularCourses: Array<{
      id: number;
      title: string;
      enrollments: number;
      completionRate: number;
    }>;
  };
  learningMetrics: {
    totalQuizzes: number;
    averageQuizScore: number;
    totalCodingChallenges: number;
    codingSuccessRate: number;
    pointsDistributed: number;
    streakData: { [key: string]: number };
  };
  systemUsage: {
    peakUsageHours: Array<{ hour: number; users: number }>;
    deviceTypes: { [key: string]: number };
    weeklyActivity: Array<{ date: string; users: number; completions: number }>;
  };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/analytics?days=${dateRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h1>
        <div className="text-center py-8">
          <p className="text-gray-500">Unable to load analytics data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into user engagement and performance</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* User Engagement Metrics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FaUsers className="mr-2 h-5 w-5 text-blue-600" />
          User Engagement
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{analytics.userEngagement.totalUsers}</div>
            <div className="text-sm text-blue-800">Total Users</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{analytics.userEngagement.activeUsers}</div>
            <div className="text-sm text-green-800">Active Users</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{analytics.userEngagement.newUsersThisMonth}</div>
            <div className="text-sm text-purple-800">New This Month</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{analytics.userEngagement.retentionRate}%</div>
            <div className="text-sm text-yellow-800">Retention Rate</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{analytics.userEngagement.averageSessionTime}m</div>
            <div className="text-sm text-orange-800">Avg Session</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Performance */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaBook className="mr-2 h-5 w-5 text-green-600" />
            Course Performance
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-xl font-bold text-green-600">{analytics.coursePerformance.totalCourses}</div>
                <div className="text-xs text-green-800">Total Courses</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-xl font-bold text-blue-600">{analytics.coursePerformance.averageCompletionRate}%</div>
                <div className="text-xs text-blue-800">Avg Completion</div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Popular Courses</h3>
              <div className="space-y-2">
                {analytics.coursePerformance.popularCourses.slice(0, 3).map((course, index) => (
                  <div key={course.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-600 mr-2">#{index + 1}</span>
                      <span className="text-sm text-gray-900">{course.title}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600">{course.enrollments} enrolled</div>
                      <div className="text-xs text-green-600">{course.completionRate}% completed</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Learning Metrics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaTrophy className="mr-2 h-5 w-5 text-yellow-600" />
            Learning Metrics
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-xl font-bold text-purple-600">{analytics.learningMetrics.totalQuizzes}</div>
                <div className="text-xs text-purple-800">Total Quizzes</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="text-xl font-bold text-yellow-600">{analytics.learningMetrics.averageQuizScore}%</div>
                <div className="text-xs text-yellow-800">Avg Quiz Score</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-xl font-bold text-orange-600">{analytics.learningMetrics.totalCodingChallenges}</div>
                <div className="text-xs text-orange-800">Coding Challenges</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-xl font-bold text-red-600">{analytics.learningMetrics.codingSuccessRate}%</div>
                <div className="text-xs text-red-800">Coding Success</div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xl font-bold text-gray-700">{analytics.learningMetrics.pointsDistributed.toLocaleString()}</div>
              <div className="text-xs text-gray-600">Total Points Distributed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FaChartLine className="mr-2 h-5 w-5 text-indigo-600" />
          Weekly Activity Trends
        </h2>
        <div className="h-64">
          <Line
            data={{
              labels: analytics.systemUsage.weeklyActivity.map(day => day.date),
              datasets: [
                {
                  label: 'Active Users',
                  data: analytics.systemUsage.weeklyActivity.map(day => day.users),
                  borderColor: 'rgb(37, 99, 235)',
                  backgroundColor: 'rgba(37, 99, 235, 0.1)',
                  tension: 0.4,
                  fill: true
                },
                {
                  label: 'Course Completions',
                  data: analytics.systemUsage.weeklyActivity.map(day => day.completions),
                  borderColor: 'rgb(22, 163, 74)',
                  backgroundColor: 'rgba(22, 163, 74, 0.1)',
                  tension: 0.4,
                  fill: true
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom'
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                  }
                },
                x: {
                  grid: {
                    display: false
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Peak Usage Hours */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FaCalendarAlt className="mr-2 h-5 w-5 text-purple-600" />
          Peak Usage Hours
        </h2>
        <div className="h-64">
          <Line
            data={{
              labels: analytics.systemUsage.peakUsageHours.map(hour => `${hour.hour}:00`),
              datasets: [
                {
                  label: 'Active Users',
                  data: analytics.systemUsage.peakUsageHours.map(hour => hour.users),
                  borderColor: 'rgb(147, 51, 234)',
                  backgroundColor: 'rgba(147, 51, 234, 0.1)',
                  tension: 0.4,
                  fill: true
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  callbacks: {
                    title: (context) => `${context[0].label} hrs`,
                    label: (context) => `${context.formattedValue} users`
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                  },
                  title: {
                    display: true,
                    text: 'Active Users'
                  }
                },
                x: {
                  grid: {
                    display: false
                  },
                  title: {
                    display: true,
                    text: 'Hour of Day'
                  }
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
} 