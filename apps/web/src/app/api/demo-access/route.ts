import { NextResponse } from 'next/server';

// Les credentials démo restent côté serveur uniquement (variables d'environnement)
const DEMO_EMAIL = process.env.DEMO_EMAIL || 'admin@gestmoney.demo';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || '';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api/v1';
// Tenant DÉDIÉ à la démo (données fictives isolées), distinct du tenant principal.
const DEMO_TENANT_ID = process.env.DEMO_TENANT_ID || '';

export async function POST() {
  // Si le tenant démo ou les credentials démo ne sont pas configurés, refuser.
  if (!DEMO_TENANT_ID || !DEMO_PASSWORD) {
    return NextResponse.json(
      { error: 'Accès démo non configuré' },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': DEMO_TENANT_ID,
      },
      body: JSON.stringify({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        tenantId: DEMO_TENANT_ID,
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Compte démo indisponible. Contactez le support IBIG Soft.' },
        { status: 503 }
      );
    }

    const data = await res.json();
    const response = NextResponse.json(data);

    // Propager le(s) cookie(s) d'authentification httpOnly émis par l'API NestJS
    // (gestmoney_token). Sans ça, le navigateur n'a pas de token et le middleware
    // renvoie /dashboard vers /login.
    const setCookies =
      typeof res.headers.getSetCookie === 'function'
        ? res.headers.getSetCookie()
        : ([res.headers.get('set-cookie')].filter(Boolean) as string[]);
    for (const cookie of setCookies) {
      response.headers.append('set-cookie', cookie);
    }

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Service temporairement indisponible.' },
      { status: 503 }
    );
  }
}
