'use client';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export default function Home() {
  const [logs, setLogs] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNewMsgBtn, setShowNewMsgBtn] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [oldestLogId, setOldestLogId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (data && data.length > 0) {
      const reversedData = [...data].reverse();
      setLogs(reversedData);
      setOldestLogId(reversedData[0].id);
      setHasMore(data.length === 100);
    }
  };

  const loadMoreLogs = async () => {
    if (!oldestLogId || loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const previousScrollHeight = scrollRef.current?.scrollHeight || 0;
    
    const { data } = await supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false })
      .lt('id', oldestLogId)
      .limit(100);
    
    if (data && data.length > 0) {
      const reversedData = [...data].reverse();
      setLogs((prevLogs) => [...reversedData, ...prevLogs]);
      setOldestLogId(reversedData[0].id);
      setHasMore(data.length === 100);
      
      setTimeout(() => {
        if (scrollRef.current) {
          const newScrollHeight = scrollRef.current.scrollHeight;
          scrollRef.current.scrollTop = newScrollHeight - previousScrollHeight;
        }
      }, 0);
    } else {
      setHasMore(false);
    }
    
    setLoadingMore(false);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setUnreadCount(0);
      setShowNewMsgBtn(false);
      setIsAtBottom(true);
    }
  };

  const onScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      setIsAtBottom(isBottom);

      if (isBottom) {
        setUnreadCount(0);
        setShowNewMsgBtn(false);
      }
    }
  };

  useEffect(() => {
    fetchLogs().then(() => {
      setTimeout(() => scrollToBottom(), 100);
    });

    const channel = supabase
      .channel('realtime-logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'logs' },
        (payload) => {
          const newLog = payload.new;
          
          setLogs((prevLogs) => {
            return [...prevLogs, newLog];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    } else {
      setUnreadCount((prev) => prev + 1);
      setShowNewMsgBtn(true);
    }
  }, [logs]);

  if (!mounted) {
    return null;
  }

  return (
    <main className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 max-w-2xl mx-auto border-x border-gray-200 dark:border-gray-700 shadow-xl relative transition-colors">
      
      <div className="flex-none p-3 sm:p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10 shadow-sm">
        <div className="flex justify-between items-center gap-2">
          <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            👀 테탑하실분 염탐
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
              title="테마 변경"
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
            <Link href="/rank">
              <button className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap">
                📊 순위표
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 scroll-smooth"
      >
        {hasMore && logs.length > 0 && (
          <div className="flex justify-center pb-3">
            <button
              onClick={loadMoreLogs}
              disabled={loadingMore}
              className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  로딩 중...
                </span>
              ) : (
                '더 보기'
              )}
            </button>
          </div>
        )}
        
        {logs.map((log) => (
          <div 
            key={log.id} 
            className="p-3 sm:p-4 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm bg-white dark:bg-gray-800 hover:shadow-md dark:hover:shadow-lg transition-all"
          >
            <div className="flex justify-between items-center mb-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded text-xs">
                  {log.sender || '(알 수 없음)'}
                </span>
              </div>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                {new Date(log.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
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
        ))}

        {logs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-2">
            <p>텅 비었습니다.</p>
            <p className="text-sm">채팅방에서 메시지를 보내보세요!</p>
          </div>
        )}
      </div>

      {showNewMsgBtn && (
        <div className="absolute bottom-5 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <button 
            onClick={scrollToBottom}
            className="pointer-events-auto bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold animate-bounce flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            ⬇ 새 메시지 {unreadCount}개
          </button>
        </div>
      )}
    </main>
  );
}