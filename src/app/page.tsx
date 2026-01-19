'use client';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

// Supabase 클라이언트 설정
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export default function Home() {
  const [logs, setLogs] = useState<any[]>([]);

  // 1. 초기 데이터 불러오기
  const fetchLogs = async () => {
    const { data } = await supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false }); // 최신순
    if (data) setLogs(data);
  };

  useEffect(() => {
    // 앱 켜지면 기존 데이터 가져오기
    fetchLogs();

    // 2. 실시간 구독 설정 (Realtime Subscription)
    const channel = supabase
      .channel('realtime-logs') // 채널 이름 (아무거나 상관없음)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'logs' },
        (payload) => {
          // 새 데이터가 들어오면 기존 리스트의 맨 앞에 추가
          const newLog = payload.new;
          setLogs((prevLogs) => [newLog, ...prevLogs]);
        }
      )
      .subscribe();

    // 페이지 나갈 때 구독 해제 (청소)
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main className="p-6 max-w-2xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">💬 실시간 톡 저장소</h1>
        <span className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full animate-pulse">
          Live Connected
        </span>
      </div>

      <div className="space-y-4">
        {logs.map((log) => (
          <div 
            key={log.id} 
            className="p-5 border border-gray-200 rounded-xl shadow-sm bg-white hover:shadow-md transition-shadow"
          >
            {/* 상단: 보낸사람, 방이름, 시간 */}
            <div className="flex justify-between items-center mb-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {log.sender || '알수없음'}
                </span>
                <span className="text-gray-500">
                  @ {log.room || '개인톡'}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(log.created_at).toLocaleString('ko-KR')}
              </span>
            </div>

            {/* 본문: 메시지 내용 */}
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