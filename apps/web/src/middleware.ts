import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes publiques accessibles sans authentification
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/legal',
  '/mentions-legales',
  '/cgu',
  '/confidentialite',
  '/cookies',
  '/aide-publique',
  '/contact',
];

// Préfixes publics (statiques, API publique)
const PUBLIC_PREFIXES = [
  '/_next/',
  '/api/auth/',          // login, register, refresh
  '/api/auth-logout',    // route Next.js de déconnexion
  '/api/demo-access',    // route Next.js accès démo (publique)
  '/api/config/',        // pays, devises
  '/favicon',
  '/manifest',
  '/icons/',
  '/images/',
  '/sw.js',
  '/offline.html',
  '/logo',
  '/variante',
];

// Routes réservées au SUPER_ADMIN
const SUPERADMIN_ROUTES = ['/superadmin'];

function isPublic(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r + '/'))) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  return false;
}

function isSuperAdminRoute(pathname: string): boolean {
  return SUPERADMIN_ROUTES.some((r) => pathname.startsWith(r));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Laisser passer les routes publiques sans vérification
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Lire le token depuis le cookie httpOnly (prioritaire) ou le header Authorization
  const tokenCookie = request.cookies.get('gestmoney_token')?.value;
  const authHeader = request.headers.get('authorization');
  const tokenHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = tokenCookie || tokenHeader;

  // Pas de token → rediriger vers login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Vérification basique de la structure du JWT (sans vérifier la signature côté edge)
  // La vérification de signature est faite par le backend NestJS
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Token malformé');
    }

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

    // Token expiré
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('gestmoney_token');
      return response;
    }

    // Vérification rôle SUPER_ADMIN pour les routes superadmin
    if (isSuperAdminRoute(pathname)) {
      const role = payload.role || payload.roles?.[0];
      if (role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Transmettre les infos utilisateur via headers (disponibles dans les Server Components)
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.sub || payload.id || '');
    requestHeaders.set('x-user-role', payload.role || '');
    requestHeaders.set('x-tenant-id', payload.tenantId || '');

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    // Token invalide → rediriger vers login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('gestmoney_token');
    return response;
  }
}

export const config = {
  matcher: [
    // Protéger toutes les routes sauf les fichiers statiques Next.js
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
