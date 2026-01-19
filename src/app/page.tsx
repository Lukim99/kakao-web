'use client';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState, useRef } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export default function Home() {
  const [logs, setLogs] = useState<any[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setLogs(data);
  };

  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel('realtime-logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'logs' },
        (payload) => {
          const newLog = payload.new;
          setLogs((prevLogs) => [newLog, ...prevLogs]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <main className="p-6 max-w-2xl mx-auto bg-gray-50 min-h-screen flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">👀 테탑하실분 염탐</h1>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto flex flex-col-reverse space-y-4 space-y-reverse">
        {logs.map((log) => (
          <div 
            key={log.id} 
            className="p-5 border border-gray-200 rounded-xl shadow-sm bg-white hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-center mb-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {log.sender || '(알 수 없음)'}
                </span>
                <span className="text-gray-500">
                  @ {log.room || 'unknown'}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(log.created_at).toLocaleString('ko-KR')}
              </span>
            </div>

            <div className="pl-1">
              <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
                {log.content}
              </p>
            </div>
          </div>
        ))}

        {logs.length === 0 && (
          <p className="text-center text-gray-400 py-10">저장된 메시지가 없습니다.</p>
        )}
      </div>
    </main>
  );
}