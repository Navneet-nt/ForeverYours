import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { verifyToken } from '@/utils/auth';

interface DecodedToken {
  userId: number;
  gender: string;
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token) as DecodedToken;
    // const userId = decoded.userId; // Not used

    // Get recent posts with user info
    const posts = await query(`
      SELECT p.*, u.username, u.gender
      FROM Posts p
      JOIN Users u ON p.userId = u.id
      ORDER BY p.createdAt DESC
      LIMIT 50
    `);

    return NextResponse.json({ posts });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 