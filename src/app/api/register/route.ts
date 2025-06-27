import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { signToken, hashPassword } from '@/utils/auth';

interface DecodedToken {
  userId: number;
  gender: string;
}

export async function POST(req: NextRequest) {
  try {
    const { username, email, password, gender } = await req.json();
    if (!username || !email || !password || !gender) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const pwdHash = await hashPassword(password);
    await query(
      'INSERT INTO Users (username, email, passwordHash, gender) VALUES (?, ?, ?, ?)',
      [username, email, pwdHash, gender]
    );
    // Get the new user's ID
    const users = await query('SELECT id FROM Users WHERE email = ?', [email]);
    const user = users[0];
    const token = signToken({ userId: user.id, gender });
    return NextResponse.json({ token });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 