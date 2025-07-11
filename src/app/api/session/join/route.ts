import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { verifyToken } from '@/utils/auth';

interface DecodedToken {
  userId: number;
  gender: string;
}
interface Session {
  id: number;
  creatorId: number;
  createdAt: string;
}
interface SessionParticipant {
  id: number;
  sessionId: number;
  userId: number;
  joinedAt: string;
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token) as DecodedToken;
    const userId = decoded.userId;

    // Check if session exists
    const sessions = await query('SELECT * FROM Sessions WHERE id = ?', [sessionId]) as Session[];
    if (!sessions.length) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if user is already in session
    const participants = await query(
      'SELECT * FROM SessionParticipants WHERE sessionId = ? AND userId = ?',
      [sessionId, userId]
    ) as SessionParticipant[];
    if (participants.length > 0) {
      return NextResponse.json({ error: 'Already in session' }, { status: 400 });
    }

    // Add user to session
    await query(
      'INSERT INTO SessionParticipants (sessionId, userId) VALUES (?, ?)',
      [sessionId, userId]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 