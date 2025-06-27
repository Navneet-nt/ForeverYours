import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { verifyToken } from '@/utils/auth';
import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET || '');

interface DecodedToken {
  userId: number;
  gender: string;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token) as DecodedToken;
    const userId = decoded.userId;

    const formData = await req.formData();
    const image = formData.get('image') as File;
    const caption = formData.get('caption') as string;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert File to Buffer
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to GCS
    const fileName = `posts/${Date.now()}_${image.name}`;
    const file = bucket.file(fileName);
    await file.save(buffer, {
      metadata: {
        contentType: image.type,
      },
    });

    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Save to database
    await query(
      'INSERT INTO Posts (userId, imageUrl, caption) VALUES (?, ?, ?)',
      [userId, imageUrl, caption]
    );

    return NextResponse.json({ success: true, imageUrl });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 