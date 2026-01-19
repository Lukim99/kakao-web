// app/api/log/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export async function POST(request: Request) {
  const body = await request.json();
  const { text } = body; // 봇에서 보낸 { "text": "내용" }을 받음

  // DB에 저장
  const { error } = await supabase
    .from('logs')
    .insert([{ content: text }]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}