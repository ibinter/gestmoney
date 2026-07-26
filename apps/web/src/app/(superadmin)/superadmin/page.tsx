'use client';
// ============================================================
// PAGE DASHBOARD SUPERADMIN — GESTMONEY
// 6 KPI cards + accès rapide aux sections
// ============================================================
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface StatsGlobales {
  tenantsActifs: number;
  usersTotal: number;
  transactionsCeMois: number;
  volumeCeMois: number;
  ticketsOuverts: number;
  licencesExpirantBientot: number;
}

function KpiCard({
  label,
  value,
  icon,
  color,
  sublabel,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  sublabel?: string;
}) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: '20px 24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        borderLeft: `4px solid ${color}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#1a2236' }}>{value}</div>
      {sublabel && <div style={{ fontSize: 12, color: '#9ca3af' }}>{sublabel}</div>}
    </div>
  );
}

function formatVolume(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} M FCFA`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)} K FCFA`;
  return `${v} FCFA`;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<StatsGlobales | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/superadmin/stats')
      .then((r) => setStats(r.data))
      .catch(() => setErreur('Impossible de charger les statistiques.'))
      .finally(() => setLoading(false));
  }, []);

  const KPIS = stats
    ? [
        {
          label: 'Tenants actifs',
          value: stats.tenantsActifs,
          icon: '🏢',
          color: '#3b82f6',
          sublabel: 'Sur la plateforme',
        },
        {
          label: 'Utilisateurs total',
          value: stats.usersTotal,
          icon: '👥',
          color: '#10b981',
          sublabel: 'Tous tenants confondus',
        },
        {
          label: 'Transactions ce mois',
          value: stats.transactionsCeMois.toLocaleString('fr-FR'),
          icon: '📈',
          color: '#f59e0b',
          sublabel: 'Depuis le 1er du mois',
        },
        {
          label: 'Volume ce mois',
          value: formatVolume(stats.volumeCeMois),
          icon: '💰',
          color: '#8b5cf6',
          sublabel: 'Montant total des transactions',
        },
        {
          label: 'Tickets ouverts',
          value: stats.ticketsOuverts,
          icon: '🎫',
          color: '#ef4444',
          sublabel: 'En attente de traitement',
        },
        {
          label: 'Licences expirant bientôt',
          value: stats.licencesExpirantBientot,
          icon: '⏰',
          color: '#f97316',
          sublabel: 'Dans les 7 prochains jours',
        },
      ]
    : [];

  const RACCOURCIS = [
    { href: '/superadmin/tenants', label: 'Gérer les tenants', icon: '🏢', color: '#3b82f6' },
    { href: '/superadmin/ops/paiements', label: 'Paiements', icon: '💳', color: '#10b981' },
    { href: '/superadmin/ops/licences', label: 'Licences', icon: '🔑', color: '#f59e0b' },
    { href: '/superadmin/crm', label: 'CRM Prospects', icon: '🎯', color: '#8b5cf6' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2236', margin: 0 }}>
          Tableau de bord SuperAdmin
        </h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
          Vue globale de la plateforme GESTMONEY
        </p>
      </div>

      {/* KPI cards */}
      {loading && (
        <div style={{ color: '#6b7280', fontSize: 14 }}>Chargement des statistiques...</div>
      )}
      {erreur && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            padding: '12px 16px',
            color: '#dc2626',
            fontSize: 14,
          }}
        >
          {erreur}
        </div>
      )}
      {!loading && stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {KPIS.map((k) => (
            <KpiCard key={k.label} {...k} />
          ))}
        </div>
      )}

      {/* Raccourcis */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1a2236', marginBottom: 12 }}>
          Accès rapide
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          {RACCOURCIS.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                padding: '20px 16px',
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                textDecoration: 'none',
                color: '#1a2236',
                fontWeight: 600,
                fontSize: 14,
                transition: 'box-shadow 0.15s',
                borderTop: `3px solid ${r.color}`,
              }}
            >
              <span style={{ fontSize: 28 }}>{r.icon}</span>
              {r.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
