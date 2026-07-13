'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SUPERADMIN_NAV = [
  {
    label: 'Vue globale',
    items: [
      { href: '/superadmin', label: 'Dashboard', icon: '🏠', exact: true },
      { href: '/superadmin/analytics', label: 'Analytics', icon: '📊' },
    ],
  },
  {
    label: 'Commercial',
    items: [
      { href: '/superadmin/prospects', label: 'CRM Prospects', icon: '👤' },
      { href: '/superadmin/demonstrations', label: 'Démonstrations', icon: '📅' },
      { href: '/superadmin/offres', label: 'Offres & Devis', icon: '📄' },
      { href: '/superadmin/paiements', label: 'Paiements', icon: '💳' },
    ],
  },
  {
    label: 'Plateforme',
    items: [
      { href: '/superadmin/licences', label: 'Licences', icon: '🔑' },
      { href: '/superadmin/emails', label: 'Emails', icon: '📧' },
      { href: '/superadmin/sara', label: 'SARA — IA', icon: '🤖' },
    ],
  },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col lg:flex-row min-h-0 -mx-4 sm:-mx-6 -my-6">
      {/* Barre supérieure mobile */}
      <div className="lg:hidden flex items-center gap-2 px-4 py-3 border-b border-border bg-yellow-50 dark:bg-yellow-900/20 overflow-x-auto">
        <span className="text-yellow-700 dark:text-yellow-400 text-xs font-black shrink-0">⚙️ SuperAdmin</span>
        {SUPERADMIN_NAV.flatMap(s => s.items).map(item => {
          const actif = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${actif ? 'bg-yellow-400 text-gray-900' : 'bg-white dark:bg-white/5 text-text-muted border border-border hover:border-yellow-400'}`}>
              {item.icon} {item.label}
            </Link>
          );
        })}
      </div>

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-56 border-r border-border bg-yellow-50/50 dark:bg-yellow-900/10 flex-shrink-0 min-h-full">
        <div className="px-4 py-4 border-b border-border">
          <p className="text-xs font-black text-yellow-700 dark:text-yellow-400 uppercase tracking-widest">⚙️ SuperAdmin</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {SUPERADMIN_NAV.map(section => (
            <div key={section.label}>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5 px-2">{section.label}</p>
              {section.items.map(item => {
                const actif = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all mb-0.5 ${actif ? 'bg-yellow-400 text-gray-900 font-bold' : 'text-text-muted hover:text-text-main hover:bg-yellow-100 dark:hover:bg-yellow-900/20'}`}>
                    <span className="text-base leading-none">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-border">
          <Link href="/dashboard" className="text-xs text-text-muted hover:text-text-main flex items-center gap-1.5 font-semibold">
            ← Retour dashboard
          </Link>
        </div>
      </aside>

      {/* Contenu */}
      <div className="flex-1 min-w-0 overflow-auto">
        {children}
      </div>
    </div>
  );
}
