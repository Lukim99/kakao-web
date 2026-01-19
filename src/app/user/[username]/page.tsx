'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

type TimeRange = 'day' | 'week' | 'month' | 'year';

interface ChatLog {
  id: string;
  sender: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

export default function UserPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const username = decodeURIComponent(params.username as string);
  const timeRangeParam = searchParams.get('range') as TimeRange | null;
  
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>(timeRangeParam || 'day');
  const [loading, setLoading] = useState(true);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchUserLogs();
  }, [username, timeRange]);

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

  const fetchUserLogs = async () => {
    setLoading(true);
    const startDate = getTimeRangeDate();
    
    const { data } = await supabase
      .from('logs')
      .select('*')
      .eq('sender', username)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });
    
    if (data) {
      setLogs(data);
    }
    setLoading(false);
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
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <Link href="/rank" className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-2 inline-block">
              ← 순위표로 돌아가기
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {username}님의 채팅
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {getTimeRangeLabel()} 동안 {logs.length}개의 채팅
            </p>
          </div>
          
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
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
          <div className="space-y-3 sm:space-y-4">
            {logs.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  선택한 기간에 채팅이 없습니다.
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                  다른 기간을 선택해보세요.
                </p>
              </div>
            ) : (
              logs.map((log) => (
                <div 
                  key={log.id} 
                  className="p-3 sm:p-4 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm bg-white dark:bg-gray-800 hover:shadow-md dark:hover:shadow-lg transition-all"
                >
                  <div className="flex justify-between items-center mb-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded text-xs">
                        {log.sender}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(log.created_at).toLocaleString('ko-KR', { 
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>

                  {log.image_url && (
                    <div className="mb-3 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                      <img 
                        src={log.image_url} 
                        alt="첨부 이미지" 
                        className="w-auto h-auto max-w-full"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {!log.image_url && (
                    <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {log.content}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
