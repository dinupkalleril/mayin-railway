'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface ProgressDataPoint {
  date: string;
  averageScore: number;
  scanCount: number;
}

interface ProgressSummary {
  totalScans: number;
  overallAverage: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

interface ProgressChartProps {
  userId: string;
  days?: number;
}

export function ProgressChart({ userId, days = 30 }: ProgressChartProps) {
  const [data, setData] = useState<ProgressDataPoint[]>([]);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchProgressData();
    }
  }, [userId, days]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/visibility/progress/${userId}?days=${days}`);

      if (response.ok) {
        const result = await response.json();
        setData(result.data || []);
        setSummary(result.summary || null);
        setError(null);
      } else {
        setError('Failed to load progress data');
      }
    } catch (err) {
      console.error('Error fetching progress:', err);
      setError('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display (e.g., "Dec 1")
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Custom tooltip component matching Railway theme
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-railway-elevated border border-railway-border rounded-lg p-3 shadow-lg">
          <p className="text-railway-white text-sm font-medium mb-1">
            {formatDate(label)}
          </p>
          <p className="text-primary-400 text-lg font-bold">
            {payload[0].value} / 100
          </p>
          <p className="text-railway-muted text-xs mt-1">
            {payload[0].payload.scanCount} scan{payload[0].payload.scanCount !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visibility Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse w-full h-full bg-railway-elevated rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visibility Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-railway-elevated flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-railway-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
            </div>
            <p className="text-railway-gray mb-2">No scan history yet</p>
            <p className="text-railway-muted text-sm">
              Run visibility scans to track your progress over time
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Chart with data
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Visibility Progress</CardTitle>
          <p className="text-sm text-railway-muted mt-1">
            Combined average score across all AI models
          </p>
        </div>
        {summary && (
          <div className="flex items-center gap-3">
            <Badge
              variant={summary.trend === 'up' ? 'success' : summary.trend === 'down' ? 'error' : 'default'}
            >
              {summary.trend === 'up' && '+'}
              {summary.trendPercentage}%
            </Badge>
            <span className="text-railway-muted text-sm">
              Last {days} days
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#262626"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#737373"
                tick={{ fill: '#737373', fontSize: 12 }}
                axisLine={{ stroke: '#262626' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#737373"
                tick={{ fill: '#737373', fontSize: 12 }}
                axisLine={{ stroke: '#262626' }}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="averageScore"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ fill: '#a855f7', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: '#c084fc', strokeWidth: 2, stroke: '#a855f7' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats below chart */}
        {summary && (
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-railway-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-railway-white">
                {summary.overallAverage}
              </p>
              <p className="text-xs text-railway-muted">Avg Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-railway-white">
                {summary.totalScans}
              </p>
              <p className="text-xs text-railway-muted">Total Scans</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-railway-white">
                {data.length}
              </p>
              <p className="text-xs text-railway-muted">Days with Scans</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ProgressChart;
