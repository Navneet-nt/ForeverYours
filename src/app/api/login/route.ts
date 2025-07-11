import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { signToken, comparePassword } from '@/utils/auth';

interface User {
  id: number;
  email: string;
  passwordHash: string;
  gender: string;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const users = await query('SELECT * FROM Users WHERE email = ?', [email]) as User[];
    if (!users.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = users[0];
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const token = signToken({ userId: user.id, gender: user.gender });
    return NextResponse.json({ token });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 