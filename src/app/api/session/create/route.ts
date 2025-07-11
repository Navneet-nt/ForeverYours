import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { verifyToken } from '@/utils/auth';

interface InsertResult {
  insertId: number;
}

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

    const result = await query('INSERT INTO Sessions (creatorId) VALUES (?)', [userId]) as InsertResult;
    const sessionId = result.insertId;
    const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL}/join?sessionId=${sessionId}`;

    return NextResponse.json({ sessionId, inviteLink });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 