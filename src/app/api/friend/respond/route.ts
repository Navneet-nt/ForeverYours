import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { verifyToken } from '@/utils/auth';

interface DecodedToken {
  userId: number;
  gender: string;
}

export async function POST(req: NextRequest) {
  try {
    const { requestId, accept } = await req.json();
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token) as DecodedToken;
    const userId = decoded.userId;

    // Get the friend request
    const requests = await query(
      'SELECT * FROM FriendRequests WHERE id = ? AND toUserId = ? AND status = "pending"',
      [requestId, userId]
    );
    if (!requests.length) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const request = requests[0];
    const status = accept ? 'accepted' : 'rejected';

    // Update request status
    await query(
      'UPDATE FriendRequests SET status = ? WHERE id = ?',
      [status, requestId]
    );

    // If accepted, create friendship
    if (accept) {
      await query(
        'INSERT INTO Friends (user1Id, user2Id) VALUES (?, ?)',
        [request.fromUserId, request.toUserId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 