import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { verifyToken } from '@/utils/auth';

interface DecodedToken {
  userId: number;
  gender: string;
}

interface Friend {
  id: number;
  user1Id: number;
  user2Id: number;
  since: string;
}

interface FriendRequest {
  id: number;
  fromUserId: number;
  toUserId: number;
  status: string;
  createdAt: string;
}

export async function POST(req: NextRequest) {
  try {
    const { toUserId } = await req.json();
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token) as DecodedToken;
    const fromUserId = decoded.userId;

    if (fromUserId === toUserId) {
      return NextResponse.json({ error: 'Cannot send request to yourself' }, { status: 400 });
    }

    // Check if already friends
    const friends = await query(
      'SELECT * FROM Friends WHERE (user1Id = ? AND user2Id = ?) OR (user1Id = ? AND user2Id = ?)',
      [fromUserId, toUserId, toUserId, fromUserId]
    ) as Friend[];
    if (friends.length > 0) {
      return NextResponse.json({ error: 'Already friends' }, { status: 400 });
    }

    // Check if request already exists
    const requests = await query(
      'SELECT * FROM FriendRequests WHERE fromUserId = ? AND toUserId = ? AND status = "pending"',
      [fromUserId, toUserId]
    ) as FriendRequest[];
    if (requests.length > 0) {
      return NextResponse.json({ error: 'Request already sent' }, { status: 400 });
    }

    // Create friend request
    await query(
      'INSERT INTO FriendRequests (fromUserId, toUserId, status) VALUES (?, ?, "pending")',
      [fromUserId, toUserId]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 