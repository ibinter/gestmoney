import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = cookies();
  const token = cookieStore.get('gestmoney_token')?.value;

  // Appel NestJS logout si token présent
  if (token) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3011';
      await fetch(`${apiUrl}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch {
      // Ignorer les erreurs réseau — on supprime les cookies quoi qu'il arrive
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete('gestmoney_token');
  response.cookies.delete('gestmoney_refresh');
  return response;
}
