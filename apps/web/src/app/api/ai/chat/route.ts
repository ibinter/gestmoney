import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3011';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cookieStore = cookies();
    const token = cookieStore.get('gestmoney_token')?.value;

    // Choisir l'endpoint en fonction du contexte
    const contexte = body.contexte ?? 'PUBLIC';
    const endpoint = token
      ? (contexte === 'SUPPORT' ? '/api/v1/ai/chat/support' : '/api/v1/ai/chat')
      : '/api/v1/ai/chat/public';

    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      // Fallback local si l'API IA est indisponible
      return NextResponse.json({
        response: 'Je suis momentanément indisponible. Consultez le Centre d\'aide ou contactez support@ibigsoft.com.',
        provider: 'fallback',
      });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({
      response: 'Désolée, je rencontre un problème technique. Réessayez dans quelques instants.',
      provider: 'fallback',
    });
  }
}
