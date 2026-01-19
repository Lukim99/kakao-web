// app/page.tsx
'use client';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export default function Home() {
  const [logs, setLogs] = useState<any[]>([]);

  // 데이터 불러오기 함수
  const fetchLogs = async () => {
    const { data } = await supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false }); // 최신순 정렬
    if (data) setLogs(data);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <main className="p-10 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">💬 카카오톡 저장소</h1>
      <button 
        onClick={fetchLogs} 
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        새로고침
      </button>

      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="p-4 border rounded shadow-sm bg-white text-black">
            <p className="text-lg">{log.content}</p>
            <p className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </main>
  );
}