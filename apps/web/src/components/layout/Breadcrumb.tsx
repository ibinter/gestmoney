'use client';
// ============================================================
// FIL D'ARIANE AUTOMATIQUE — GESTMONEY
// Génère les breadcrumbs depuis le pathname Next.js
// ============================================================
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  dashboard:      'Tableau de bord',
  transactions:   'Transactions',
  float:          'Gestion Float',
  caisse:         'Caisse',
  agences:        'Agences & PDV',
  agents:         'Agents',
  clients:        'Clients',
  commissions:    'Commissions',
  performances:   'Performances',
  rapports:       'Rapports & BI',
  reporting:      'Reporting',
  notifications:  'Notifications',
  settings:       'Paramètres',
  profile:        'Mon profil',
  support:        'Support',
  aide:           "Centre d'aide",
  superadmin:     'Console Super Admin',
  licences:       'Licences',
  prospects:      'Prospects',
  demonstrations: 'Démonstrations',
  offres:         'Offres',
  paiements:      'Paiements',
  sara:           'SARA IA',
  analytics:      'Analytics',
  emails:         'Emails',
  customers:      'Clients (legacy)',
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  // Pas de breadcrumb si on est à la racine du dashboard
  if (segments.length <= 1) return null;

  const crumbs = segments.map((seg, i) => ({
    label: ROUTE_LABELS[seg] ?? seg,
    href: '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }));

  return (
    <nav aria-label="Fil d'Ariane" className="flex items-center gap-1 flex-wrap">
      <Link
        href="/dashboard"
        className="text-text-muted hover:text-primary transition-colors"
        aria-label="Accueil"
      >
        <Home size={13} />
      </Link>

      {crumbs.map((crumb) => (
        <React.Fragment key={crumb.href}>
          <ChevronRight size={12} className="text-text-muted opacity-50 flex-shrink-0" />
          {crumb.isLast ? (
            <span
              className="text-xs font-semibold text-text-main truncate max-w-[180px]"
              aria-current="page"
            >
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="text-xs text-text-muted hover:text-primary transition-colors truncate max-w-[140px]"
            >
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
