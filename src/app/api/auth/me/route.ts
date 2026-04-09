import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  
  if (!token) {
    return NextResponse.json({ user: null });
  }

  const user = getUserFromToken(token);
  
  if (!user) {
    const response = NextResponse.json({ user: null });
    response.cookies.delete('token');
    return response;
  }

  return NextResponse.json({
    user: {
      id: user.userId,
      username: user.username,
    },
  });
}
