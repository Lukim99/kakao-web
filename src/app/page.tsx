'use client';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState, useRef } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export default function Home() {
  const [logs, setLogs] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNewMsgBtn, setShowNewMsgBtn] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) {
      setLogs(data);
    }
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

  return (
    <main className="h-screen flex flex-col bg-gray-50 max-w-2xl mx-auto border-x border-gray-200 shadow-xl relative">
      
      <div className="flex-none p-4 bg-white border-b border-gray-200 z-10 shadow-sm">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          👀 테탑하실분 염탐
        </h1>
      </div>

      <div 
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {logs.map((log) => (
          <div 
            key={log.id} 
            className="p-4 border border-gray-100 rounded-2xl shadow-sm bg-white hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-center mb-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">
                  {log.sender || '(알 수 없음)'}
                </span>
                <span className="text-gray-400 text-xs">
                  @ {log.room || 'unknown'}
                </span>
              </div>
              <span className="text-[10px] text-gray-400">
                {new Date(log.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {log.image_url && (
              <div className="mb-3 rounded-lg overflow-hidden border border-gray-100">
                <img 
                  src={log.image_url} 
                  alt="첨부 이미지" 
                  className="w-auto h-auto"
                  loading="lazy"
                />
              </div>
            )}

            {!log.image_url && (
              <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap break-words">
                {log.content}
              </p>
            )}
          </div>
        ))}

        {logs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
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