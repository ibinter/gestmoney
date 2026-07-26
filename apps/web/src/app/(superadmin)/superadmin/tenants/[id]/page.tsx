'use client';
// ============================================================
// PAGE DÉTAIL TENANT SUPERADMIN — GESTMONEY
// Vue complète : infos + KPIs + 10 dernières transactions + users
// ============================================================
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface TenantDetail {
  tenant: {
    id: string;
    name: string;
    slug: string;
    domain: string | null;
    status: string;
    plan: string;
    country: string;
    currency: string;
    echeance: string | null;
    createdAt: string;
  };
  stats: {
    transactionsCeMois: number;
    volumeCeMois: number;
    nbUsers: number;
    nbAgences: number;
    nbAgents: number;
    totalTransactions: number;
  };
  derniersTx: Array<{
    id: string;
    reference: string;
    type: string;
    status: string;
    amount: number;
    currency: string;
    operatorCode: string;
    createdAt: string;
  }>;
  users: Array<{
    id: string;
    email: string;
    nom: string;
    status: string;
    roles: string[];
    createdAt: string;
  }>;
}

const STATUT_COULEUR: Record<string, string> = {
  ACTIVE: '#10b981',
  TRIAL: '#f59e0b',
  SUSPENDED: '#ef4444',
  EXPIRED: '#6b7280',
};

const TX_STATUT_COULEUR: Record<string, string> = {
  COMPLETED: '#10b981',
  PENDING: '#f59e0b',
  FAILED: '#ef4444',
  PROCESSING: '#3b82f6',
  CANCELLED: '#6b7280',
};

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 10,
        padding: '16px 20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        borderTop: `3px solid ${color ?? '#3b82f6'}`,
      }}
    >
      <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#1a2236' }}>{value}</div>
    </div>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatMontant(v: number, currency = 'XOF') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 })
    .format(v)
    .replace('XOF', 'FCFA');
}

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ ok: boolean; msg: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/superadmin/tenants/${id}`)
      .then((r) => setData(r.data))
      .catch(() => setErreur('Impossible de charger les informations du tenant.'))
      .finally(() => setLoading(false));
  }, [id]);

  const showMsg = (ok: boolean, msg: string) => {
    setActionMsg({ ok, msg });
    setTimeout(() => setActionMsg(null), 3500);
  };

  const handleAction = async (
    action: 'suspendre' | 'reactiver' | 'prolonger' | 'reset-admin',
  ) => {
    if (!id) return;
    setActionLoading(true);
    try {
      if (action === 'suspendre') {
        await api.patch(`/superadmin/tenants/${id}/suspendre`, {
          raison: 'Suspension manuelle via console SuperAdmin',
        });
        showMsg(true, 'Tenant suspendu avec succès.');
      } else if (action === 'reactiver') {
        await api.patch(`/superadmin/tenants/${id}/reactiver`, {
          raison: 'Réactivation manuelle via console SuperAdmin',
        });
        showMsg(true, 'Tenant réactivé avec succès.');
      } else if (action === 'prolonger') {
        await api.patch(`/superadmin/tenants/${id}/licence`, { jours: 30 });
        showMsg(true, 'Licence prolongée de 30 jours.');
      } else if (action === 'reset-admin') {
        const r = await api.post(`/superadmin/tenants/${id}/reset-admin`);
        showMsg(true, r.data.message ?? 'Lien de reset envoyé.');
      }
      // Recharger
      const r = await api.get(`/superadmin/tenants/${id}`);
      setData(r.data);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Une erreur est survenue.';
      showMsg(false, msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Chargement...</div>
    );
  }

  if (erreur || !data) {
    return (
      <div
        style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 8,
          padding: 20,
          color: '#dc2626',
        }}
      >
        {erreur ?? 'Données introuvables.'}
        <br />
        <button
          onClick={() => router.back()}
          style={{
            marginTop: 12,
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          ← Retour
        </button>
      </div>
    );
  }

  const { tenant, stats, derniersTx, users } = data;
  const isSuspended = tenant.status === 'SUSPENDED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Toast */}
      {actionMsg && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 2000,
            padding: '12px 20px',
            borderRadius: 10,
            background: actionMsg.ok ? '#10b981' : '#ef4444',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
          {actionMsg.msg}
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: '#9ca3af' }}>
        <Link href="/superadmin/tenants" style={{ color: '#3b82f6', textDecoration: 'none' }}>
          Tenants
        </Link>{' '}
        / {tenant.name}
      </div>

      {/* En-tête tenant */}
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 20,
          alignItems: 'flex-start',
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a2236', margin: 0 }}>
              {tenant.name}
            </h1>
            <span
              style={{
                display: 'inline-flex',
                padding: '2px 10px',
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 600,
                background: (STATUT_COULEUR[tenant.status] ?? '#6b7280') + '20',
                color: STATUT_COULEUR[tenant.status] ?? '#6b7280',
              }}
            >
              {tenant.status}
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span>Slug : <strong>{tenant.slug}</strong></span>
            {tenant.domain && <span>Domaine : <strong>{tenant.domain}</strong></span>}
            <span>Plan : <strong>{tenant.plan}</strong></span>
            <span>Pays : <strong>{tenant.country}</strong></span>
            <span>Devise : <strong>{tenant.currency}</strong></span>
            <span>Expiration : <strong>{formatDate(tenant.echeance)}</strong></span>
            <span>Créé le : <strong>{formatDate(tenant.createdAt)}</strong></span>
          </div>
        </div>

        {/* Boutons d'action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 160 }}>
          {isSuspended ? (
            <button
              onClick={() => handleAction('reactiver')}
              disabled={actionLoading}
              style={{
                padding: '9px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#10b981',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                opacity: actionLoading ? 0.6 : 1,
              }}
            >
              Réactiver
            </button>
          ) : (
            <button
              onClick={() => handleAction('suspendre')}
              disabled={actionLoading}
              style={{
                padding: '9px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#ef4444',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                opacity: actionLoading ? 0.6 : 1,
              }}
            >
              Suspendre
            </button>
          )}
          <button
            onClick={() => handleAction('prolonger')}
            disabled={actionLoading}
            style={{
              padding: '9px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#f97316',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              opacity: actionLoading ? 0.6 : 1,
            }}
          >
            Prolonger +30 jours
          </button>
          <button
            onClick={() => handleAction('reset-admin')}
            disabled={actionLoading}
            style={{
              padding: '9px 16px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: '#fff',
              color: '#374151',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              opacity: actionLoading ? 0.6 : 1,
            }}
          >
            Reset mot de passe admin
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
        }}
      >
        <Stat label="Transactions ce mois" value={stats.transactionsCeMois.toLocaleString('fr-FR')} color="#3b82f6" />
        <Stat label="Volume ce mois" value={formatMontant(stats.volumeCeMois, tenant.currency)} color="#8b5cf6" />
        <Stat label="Utilisateurs" value={stats.nbUsers} color="#10b981" />
        <Stat label="Agences" value={stats.nbAgences} color="#f59e0b" />
        <Stat label="Agents" value={stats.nbAgents} color="#f97316" />
        <Stat label="Total transactions" value={stats.totalTransactions.toLocaleString('fr-FR')} color="#6b7280" />
      </div>

      {/* 10 dernières transactions */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a2236', marginBottom: 12 }}>
          10 dernières transactions
        </h2>
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            overflow: 'auto',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                {['Référence', 'Type', 'Statut', 'Montant', 'Opérateur', 'Date'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#6b7280',
                      fontSize: 11,
                      textTransform: 'uppercase',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {derniersTx.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>
                    Aucune transaction.
                  </td>
                </tr>
              )}
              {derniersTx.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#374151' }}>
                    {tx.reference}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>{tx.type}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        padding: '2px 8px',
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 600,
                        background: (TX_STATUT_COULEUR[tx.status] ?? '#6b7280') + '20',
                        color: TX_STATUT_COULEUR[tx.status] ?? '#6b7280',
                      }}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1a2236' }}>
                    {formatMontant(tx.amount, tx.currency)}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>{tx.operatorCode}</td>
                  <td style={{ padding: '10px 14px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {formatDate(tx.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Utilisateurs */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a2236', marginBottom: 12 }}>
          Utilisateurs ({users.length})
        </h2>
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            overflow: 'auto',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                {['Nom', 'Email', 'Statut', 'Rôles', 'Créé le'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#6b7280',
                      fontSize: 11,
                      textTransform: 'uppercase',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>
                    Aucun utilisateur.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 500, color: '#1a2236' }}>
                    {u.nom}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>{u.email}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        padding: '2px 8px',
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 600,
                        background: u.status === 'ACTIVE' ? '#d1fae5' : '#f3f4f6',
                        color: u.status === 'ACTIVE' ? '#10b981' : '#6b7280',
                      }}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>
                    {u.roles.join(', ') || '—'}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {formatDate(u.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
