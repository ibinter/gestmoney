'use client';
// ============================================================
// LAYOUT SUPERADMIN — GESTMONEY
// Shell minimal : topbar + sidebar fixe, sans BandeauLicence.
// Réservé aux utilisateurs avec le rôle SUPER_ADMIN.
// ============================================================
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

const NAV_ITEMS = [
  { href: '/superadmin', label: 'Tableau de bord', icon: '📊' },
  { href: '/superadmin/tenants', label: 'Tenants', icon: '🏢' },
  { href: '/superadmin/ops/paiements', label: 'Paiements', icon: '💳' },
  { href: '/superadmin/ops/licences', label: 'Licences', icon: '🔑' },
  { href: '/superadmin/crm', label: 'CRM', icon: '🎯' },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    const role = user?.role?.toUpperCase();
    if (role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, hasHydrated, user, router]);

  if (!hasHydrated || !isAuthenticated) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--gm-bg, #f5f6fa)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: 'var(--gm-sidebar-bg, #1a2236)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
        padding: '0 0 16px',
      }}>
        <div style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          marginBottom: 8,
        }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', opacity: 0.5, letterSpacing: 1, marginBottom: 4 }}>
            Console
          </div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>SuperAdmin</div>
        </div>
        <nav style={{ flex: 1, padding: '0 8px' }}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                color: 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                fontSize: 14,
                marginBottom: 2,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Link
            href="/dashboard"
            style={{
              display: 'block',
              fontSize: 13,
              color: 'rgba(255,255,255,0.5)',
              textDecoration: 'none',
            }}
          >
            ← Retour au Dashboard
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Topbar */}
        <header style={{
          height: 56,
          background: '#fff',
          borderBottom: '1px solid var(--gm-border, #e5e7eb)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          gap: 12,
        }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--gm-text, #1a2236)' }}>
            Console SuperAdmin — GESTMONEY
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 13, color: '#6b7280' }}>
            {user?.firstName} {user?.lastName}
          </span>
        </header>

        <main style={{ flex: 1, padding: 24, maxWidth: 1400, width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
