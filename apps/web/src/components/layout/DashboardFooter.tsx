'use client';
// ============================================================
// Footer interne du tableau de bord GESTMONEY — discret, en bas de la
// zone de contenu (liens utiles + mentions éditeur + version).
// ============================================================
import React from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

const APP_VERSION = 'v1.0';

export function DashboardFooter() {
  const { lang } = useI18n();
  const annee = new Date().getFullYear();
  const en = lang === 'en';

  const liens: { label: string; href: string }[] = [
    { label: en ? 'Guide' : 'Guide', href: '/dashboard/guide' },
    { label: en ? 'Support' : 'Support', href: '/dashboard/support' },
    { label: en ? 'Legal notice' : 'Mentions légales', href: '/legal/mentions-legales' },
    { label: en ? 'Privacy' : 'Confidentialité', href: '/legal/confidentialite' },
    { label: en ? 'Terms' : 'CGU', href: '/legal/cgu' },
  ];

  return (
    <footer className="border-t border-gray-100 dark:border-white/08 mt-6">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="font-semibold text-text-main">GESTMONEY</span>
            <span className="opacity-60">·</span>
            <span>© {annee} IBIG Soft</span>
            <span className="opacity-60">·</span>
            <span className="opacity-70">{APP_VERSION}</span>
          </div>

          <nav className="flex items-center gap-3 flex-wrap justify-center">
            {liens.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="hover:text-text-main transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="text-center sm:text-right text-[11px] text-text-muted/70 mt-2">
          {en
            ? 'The intelligent platform for digital financial services management.'
            : 'La plateforme intelligente de gestion des services financiers digitaux.'}
        </p>
      </div>
    </footer>
  );
}
