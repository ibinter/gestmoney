'use client';
// ============================================================
// PAGE TENANTS SUPERADMIN — GESTMONEY
// Tableau paginé + recherche + filtres + actions en ligne
// ============================================================
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Tenant {
  id: string;
  nom: string;
  slug: string;
  statut: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED';
  plan: string;
  nbUsers: number;
  transactionsCeMois: number;
  echeance: string | null;
  adminEmail: string | null;
  adminNom: string | null;
  createdAt: string;
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUT_COULEUR: Record<string, string> = {
  ACTIVE: '#10b981',
  TRIAL: '#f59e0b',
  SUSPENDED: '#ef4444',
  EXPIRED: '#6b7280',
};

const STATUT_LABEL: Record<string, string> = {
  ACTIVE: 'Actif',
  TRIAL: 'Essai',
  SUSPENDED: 'Suspendu',
  EXPIRED: 'Expiré',
};

const PLAN_LABEL: Record<string, string> = {
  STARTER: 'Starter',
  PROFESSIONAL: 'Pro',
  ENTERPRISE: 'Enterprise',
  CUSTOM: 'Custom',
};

function StatutBadge({ statut }: { statut: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
        background: STATUT_COULEUR[statut] + '20',
        color: STATUT_COULEUR[statut] ?? '#6b7280',
      }}
    >
      {STATUT_LABEL[statut] ?? statut}
    </span>
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

// ─── Modale de confirmation générique ──────────────────────────
function ConfirmDialog({
  titre,
  message,
  onConfirm,
  onCancel,
  loading,
}: {
  titre: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          maxWidth: 420,
          width: '90%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: '#1a2236' }}>
          {titre}
        </h3>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280' }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: '#ef4444',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'En cours...' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  // Filtres
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [page, setPage] = useState(1);

  // Actions en ligne
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    type: 'suspendre' | 'prolonger';
    tenant: Tenant;
  } | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  const showToast = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const charger = useCallback(() => {
    setLoading(true);
    setErreur(null);
    const params: Record<string, string | number> = { page, limit: 20 };
    if (search) params.search = search;
    if (statut) params.statut = statut;

    api
      .get('/superadmin/tenants', { params })
      .then((r) => {
        setTenants(r.data.data);
        setMeta(r.data.meta);
      })
      .catch(() => setErreur('Impossible de charger la liste des tenants.'))
      .finally(() => setLoading(false));
  }, [page, search, statut]);

  useEffect(() => {
    charger();
  }, [charger]);

  // Reset page quand on filtre
  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };
  const handleStatut = (v: string) => {
    setStatut(v);
    setPage(1);
  };

  const handleSuspendre = async (tenant: Tenant) => {
    setActionLoading(tenant.id + '-suspendre');
    try {
      await api.patch(`/superadmin/tenants/${tenant.id}/suspendre`, {
        raison: 'Suspension manuelle via console SuperAdmin',
      });
      showToast(true, `${tenant.nom} suspendu avec succès.`);
      charger();
    } catch {
      showToast(false, 'Erreur lors de la suspension.');
    } finally {
      setActionLoading(null);
      setConfirm(null);
    }
  };

  const handleProlonger = async (tenant: Tenant) => {
    setActionLoading(tenant.id + '-prolonger');
    try {
      await api.patch(`/superadmin/tenants/${tenant.id}/licence`, { jours: 30 });
      showToast(true, `Licence de ${tenant.nom} prolongée de 30 jours.`);
      charger();
    } catch {
      showToast(false, 'Erreur lors de la prolongation.');
    } finally {
      setActionLoading(null);
      setConfirm(null);
    }
  };

  const handleReactiver = async (tenantId: string, tenantNom: string) => {
    setActionLoading(tenantId + '-reactiver');
    try {
      await api.patch(`/superadmin/tenants/${tenantId}/reactiver`, {
        raison: 'Réactivation manuelle via console SuperAdmin',
      });
      showToast(true, `${tenantNom} réactivé avec succès.`);
      charger();
    } catch {
      showToast(false, 'Erreur lors de la réactivation.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 2000,
            padding: '12px 20px',
            borderRadius: 10,
            background: toast.ok ? '#10b981' : '#ef4444',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Modale de confirmation */}
      {confirm?.type === 'suspendre' && (
        <ConfirmDialog
          titre="Suspendre ce tenant ?"
          message={`L'accès de "${confirm.tenant.nom}" sera immédiatement coupé. Les utilisateurs ne pourront plus se connecter.`}
          onConfirm={() => handleSuspendre(confirm.tenant)}
          onCancel={() => setConfirm(null)}
          loading={!!actionLoading}
        />
      )}
      {confirm?.type === 'prolonger' && (
        <ConfirmDialog
          titre="Prolonger la licence de 30 jours ?"
          message={`La licence de "${confirm.tenant.nom}" sera étendue de 30 jours à compter de l'échéance actuelle.`}
          onConfirm={() => handleProlonger(confirm.tenant)}
          onCancel={() => setConfirm(null)}
          loading={!!actionLoading}
        />
      )}

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a2236', margin: 0 }}>
            Tenants ({meta?.total ?? '…'})
          </h1>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>
            Gestion complète des établissements
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Rechercher par nom ou slug..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            flex: '1 1 240px',
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <select
          value={statut}
          onChange={(e) => handleStatut(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            fontSize: 14,
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          <option value="">Tous les statuts</option>
          <option value="ACTIVE">Actifs</option>
          <option value="TRIAL">Essai</option>
          <option value="SUSPENDED">Suspendus</option>
          <option value="EXPIRED">Expirés</option>
        </select>
      </div>

      {/* Erreur */}
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

      {/* Tableau */}
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          overflow: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              {['Nom', 'Statut', 'Plan', 'Users', 'Tx/mois', 'Expiration', 'Actions'].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#6b7280',
                      fontSize: 12,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>
                  Chargement...
                </td>
              </tr>
            )}
            {!loading && tenants.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>
                  Aucun tenant trouvé.
                </td>
              </tr>
            )}
            {!loading &&
              tenants.map((t) => (
                <tr
                  key={t.id}
                  style={{ borderBottom: '1px solid #f9fafb' }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#1a2236' }}>{t.nom}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{t.slug}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <StatutBadge statut={t.statut} />
                  </td>
                  <td style={{ padding: '12px 16px', color: '#374151' }}>
                    {PLAN_LABEL[t.plan] ?? t.plan}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#374151', textAlign: 'center' }}>
                    {t.nbUsers}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#374151', textAlign: 'center' }}>
                    {t.transactionsCeMois.toLocaleString('fr-FR')}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#374151', whiteSpace: 'nowrap' }}>
                    {formatDate(t.echeance)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Link
                        href={`/superadmin/tenants/${t.id}`}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          background: '#eff6ff',
                          color: '#3b82f6',
                          textDecoration: 'none',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Voir
                      </Link>
                      {t.statut === 'SUSPENDED' ? (
                        <button
                          onClick={() => handleReactiver(t.id, t.nom)}
                          disabled={actionLoading === t.id + '-reactiver'}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: 'none',
                            background: '#d1fae5',
                            color: '#10b981',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {actionLoading === t.id + '-reactiver' ? '...' : 'Réactiver'}
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirm({ type: 'suspendre', tenant: t })}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: 'none',
                            background: '#fef2f2',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          Suspendre
                        </button>
                      )}
                      <button
                        onClick={() => setConfirm({ type: 'prolonger', tenant: t })}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: 'none',
                          background: '#fff7ed',
                          color: '#f97316',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        +30j
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: '#fff',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.4 : 1,
            }}
          >
            ←
          </button>
          <span style={{ fontSize: 14, color: '#374151' }}>
            Page {page} / {meta.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page === meta.totalPages}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: '#fff',
              cursor: page === meta.totalPages ? 'not-allowed' : 'pointer',
              opacity: page === meta.totalPages ? 0.4 : 1,
            }}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
