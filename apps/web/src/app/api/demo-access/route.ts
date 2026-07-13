import { NextResponse } from 'next/server';

// Les credentials démo restent côté serveur uniquement (variables d'environnement)
const DEMO_EMAIL = process.env.DEMO_EMAIL || 'admin@gestmoney.demo';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || '';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api/v1';
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || '';

export async function POST() {
  // Si pas de credentials démo configurés, refuser
  if (!DEMO_PASSWORD) {
    return NextResponse.json(
      { error: 'Accès démo non configuré sur ce serveur.' },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(TENANT_ID && { 'x-tenant-id': TENANT_ID }),
      },
      body: JSON.stringify({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        ...(TENANT_ID && { tenantId: TENANT_ID }),
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Compte démo indisponible. Contactez le support IBIG Soft.' },
        { status: 503 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Service temporairement indisponible.' },
      { status: 503 }
    );
  }
}
