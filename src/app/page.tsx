'use client';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState, useRef } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export default function Home() {
  const [logs, setLogs] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0); // 안 읽은 메시지 개수
  const [showNewMsgBtn, setShowNewMsgBtn] = useState(false); // 버튼 표시 여부
  const [isAtBottom, setIsAtBottom] = useState(true); // 현재 스크롤이 맨 아래인지 여부
  
  const scrollRef = useRef<HTMLDivElement>(null); // 스크롤 박스 참조

  // 1. 데이터 불러오기 (과거 -> 최신 순으로 변경)
  const fetchLogs = async () => {
    const { data } = await supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: true }); // 채팅처럼 위에서 아래로 쌓이게 함
    if (data) {
      setLogs(data);
    }
  };

  // 2. 스크롤을 맨 아래로 내리는 함수
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setUnreadCount(0);
      setShowNewMsgBtn(false);
      setIsAtBottom(true);
    }
  };

  // 3. 스크롤 감지 핸들러 (사용자가 스크롤을 올렸는지 확인)
  const onScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      // 오차범위 10px 정도로 맨 아래인지 판단
      const isBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      setIsAtBottom(isBottom);

      // 사용자가 스스로 맨 아래로 내렸다면 알림 끄기
      if (isBottom) {
        setUnreadCount(0);
        setShowNewMsgBtn(false);
      }
    }
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
          
          setLogs((prevLogs) => {
            return [...prevLogs, newLog]; // 배열 뒤에 추가
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 4. 로그가 업데이트될 때 스크롤 처리 로직
  useEffect(() => {
    // 첫 로딩이거나, 이미 맨 아래를 보고 있었다면 -> 자동 스크롤
    if (isAtBottom) {
      scrollToBottom();
    } else {
      // 위를 보고 있었다면 -> 안 읽은 메시지 카운트 증가
      setUnreadCount((prev) => prev + 1);
      setShowNewMsgBtn(true);
    }
  }, [logs]); // logs가 변할 때마다 실행

  return (
    // 전체 화면 높이(h-screen) 고정
    <main className="h-screen flex flex-col bg-gray-50 max-w-2xl mx-auto border-x border-gray-200 shadow-xl relative">
      
      {/* 헤더 (고정) */}
      <div className="flex-none p-4 bg-white border-b border-gray-200 z-10 shadow-sm">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          👀 테탑하실분 염탐
        </h1>
      </div>

      {/* 메시지 리스트 영역 (스크롤 가능) */}
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
            {/* 상단 정보 */}
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

            {/* 이미지 표시 (있을 경우) */}
            {log.image_url && (
              <div className="mb-3 rounded-lg overflow-hidden border border-gray-100">
                <img 
                  src={log.image_url} 
                  alt="첨부 이미지" 
                  className="w-full h-auto object-cover max-h-60"
                  loading="lazy"
                />
              </div>
            )}

            {/* 텍스트 내용 */}
            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {log.content}
            </p>
          </div>
        ))}

        {logs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
            <p>텅 비었습니다.</p>
            <p className="text-sm">채팅방에서 메시지를 보내보세요!</p>
          </div>
        )}
      </div>

      {/* ⬇️ 새 메시지 알림 버튼 (플로팅) */}
      {showNewMsgBtn && (
        <div className="absolute bottom-5 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <button 
            onClick={scrollToBottom}
            className="pointer-events-auto bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold animate-bounce flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            ⬇️ 새 메시지 {unreadCount}개
          </button>
        </div>
      )}
    </main>
  );
}