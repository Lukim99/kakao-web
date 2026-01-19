'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

type TimeRange = 'day' | 'week' | 'month' | 'year';

interface UserStats {
  sender: string;
  count: number;
  percentage: number;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#f97316'];

export default function Dashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (logs.length > 0) {
      calculateStats();
    }
  }, [logs, timeRange]);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) {
      setLogs(data);
    }
    setLoading(false);
  };

  const getTimeRangeDate = () => {
    const now = new Date();
    switch (timeRange) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  };

  const calculateStats = () => {
    const startDate = getTimeRangeDate();
    const filteredLogs = logs.filter(log => new Date(log.created_at) >= startDate);
    
    const userMap = new Map<string, number>();
    filteredLogs.forEach(log => {
      const sender = log.sender || '(알 수 없음)';
      userMap.set(sender, (userMap.get(sender) || 0) + 1);
    });

    const total = filteredLogs.length;
    const stats: UserStats[] = Array.from(userMap.entries())
      .map(([sender, count]) => ({
        sender,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    setUserStats(stats);
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'day': return '최근 하루';
      case 'week': return '최근 일주일';
      case 'month': return '최근 한 달';
      case 'year': return '최근 1년';
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📊 테탑하실분 채팅 순위</h1>
          </div>
          
          <div className="flex gap-3">
            <Link href="/">
              <button className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                👀 염탐하러 가기
              </button>
            </Link>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
            >
              {theme === 'dark' ? '라이트 모드' : '다크 모드'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          {(['day', 'week', 'month', 'year'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timeRange === range
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {range === 'day' && '하루'}
              {range === 'week' && '일주일'}
              {range === 'month' && '한 달'}
              {range === 'year' && '1년'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {getTimeRangeLabel()} 채팅량
              </h2>
              <div className="pointer-events-none select-none">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userStats.slice(0, 10) as any}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                    <XAxis 
                      dataKey="sender" 
                      tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                채팅 비율
              </h2>
              <div className="pointer-events-none select-none">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userStats.slice(0, 8) as any}
                      dataKey="count"
                      nameKey="sender"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {userStats.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ color: theme === 'dark' ? '#ffffff' : '#000000' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 lg:col-span-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                채팅 순위
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">순위</th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">사용자</th>
                      <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">채팅 수</th>
                      <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">비율</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userStats.map((stat, index) => (
                      <tr 
                        key={stat.sender}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                            index === 0 ? 'bg-yellow-400 text-yellow-900' :
                            index === 1 ? 'bg-gray-300 text-gray-800' :
                            index === 2 ? 'bg-orange-400 text-orange-900' :
                            'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                          }`}>
                            {index === 0 ? '1' : index === 1 ? '2' : index === 2 ? '3' : index + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{stat.sender}</td>
                        <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300 font-semibold">
                          {stat.count.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${stat.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[50px] text-right">
                              {stat.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {userStats.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p className="text-lg">선택한 기간에 데이터가 없습니다.</p>
                  <p className="text-sm mt-2">다른 기간을 선택해보세요.</p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white lg:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-blue-100 text-sm font-medium mb-1">전체 채팅 수</p>
                  <p className="text-4xl font-bold">{userStats.reduce((sum, stat) => sum + stat.count, 0).toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-blue-100 text-sm font-medium mb-1">활성 사용자</p>
                  <p className="text-4xl font-bold">{userStats.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-blue-100 text-sm font-medium mb-1">평균 채팅 수</p>
                  <p className="text-4xl font-bold">
                    {userStats.length > 0 
                      ? Math.round(userStats.reduce((sum, stat) => sum + stat.count, 0) / userStats.length).toLocaleString()
                      : 0
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
