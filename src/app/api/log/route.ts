// app/api/log/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export async function POST(request: Request) {
  try {
    // 1. FormData로 데이터 받기 (중요!)
    const formData = await request.formData();
    const text = formData.get('text') as string;
    const sender = formData.get('sender') as string;
    const room = formData.get('room') as string;
    const imageFile = formData.get('image') as File | null;

    let publicImageUrl = null;

    if (imageFile) {
        const fileName = `image-${uuidv4()}.${imageFile.name.split('.').pop()}`;

        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('kakao-images')
            .upload(fileName, imageFile, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase
            .storage
            .from('kakao-images')
            .getPublicUrl(fileName);
            
        publicImageUrl = urlData.publicUrl;
    }

    const { error: dbError } = await supabase
      .from('logs')
      .insert([
        { 
          content: text,
          sender: sender, 
          room: room,
          image_url: publicImageUrl
        }
      ]);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("API 에러:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}