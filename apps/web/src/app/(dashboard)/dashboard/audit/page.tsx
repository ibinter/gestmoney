'use client';
// ============================================================
// PAGE JOURNAL D'AUDIT — GESTMONEY
// Filtres avancés, timeline visuelle, export CSV, stats collapsibles
// ============================================================
import React, { useState, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Download, Filter, RotateCcw, Shield } from 'lucide-react';
import { GmPageHeader, GmTableWrap } from '@/components/gm';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuditLogs, useAuditStatsExtended, type AuditFiltres, type AuditLogFull } from '@/hooks/useAudit';
import api from '@/lib/api';

// ─── Constantes ──────────────────────────────────────────────────────────────

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'EXPORT', 'APPROVE', 'REJECT', 'SUSPEND', 'ACTIVATE'] as const;

const RESSOURCES = [
  'transaction', 'agent', 'user', 'licence', 'float', 'commission',
  'client', 'agence', 'stock', 'support', 'audit',
];

/** Couleur de badge par action. */
const ACTION_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  CREATE:   { bg: '#dbeafe', text: '#1d4ed8', label: 'Création' },
  UPDATE:   { bg: '#ffedd5', text: '#c2410c', label: 'Modification' },
  DELETE:   { bg: '#fee2e2', text: '#dc2626', label: 'Suppression' },
  LOGIN:    { bg: '#dcfce7', text: '#15803d', label: 'Connexion' },
  LOGOUT:   { bg: '#f0fdf4', text: '#166534', label: 'Déconnexion' },
  EXPORT:   { bg: '#ede9fe', text: '#7c3aed', label: 'Export' },
  APPROVE:  { bg: '#d1fae5', text: '#065f46', label: 'Approbation' },
  REJECT:   { bg: '#fee2e2', text: '#991b1b', label: 'Rejet' },
  SUSPEND:  { bg: '#fef9c3', text: '#92400e', label: 'Suspension' },
  ACTIVATE: { bg: '#dcfce7', text: '#166534', label: 'Activation' },
  VIEW:     { bg: '#f1f5f9', text: '#475569', label: 'Consultation' },
};

const FILTRES_VIDES: AuditFiltres = {
  userId: '', action: '', resource: '', startDate: '', endDate: '', search: '', page: 1, limit: 20,
};

// ─── Sous-composants ─────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
  const c = ACTION_COLORS[action] ?? { bg: '#f1f5f9', text: '#475569', label: action };
  return (
    <span
      style={{ background: c.bg, color: c.text, padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
    >
      {c.label}
    </span>
  );
}

function BarChart({ data, max, label }: { data: { label: string; count: number }[]; max: number; label: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gm-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      {data.slice(0, 5).map((d) => (
        <div key={d.label} style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{d.label}</span>
            <span style={{ fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>{d.count}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--gm-border)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${max > 0 ? Math.round((d.count / max) * 100) : 0}%`,
                background: 'var(--gm-primary)',
                borderRadius: 3,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DailyActivityBars({ daily }: { daily: { date: string; count: number }[] }) {
  const last7 = daily.slice(-7);
  const peak = Math.max(...last7.map((d) => d.count), 1);
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gm-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activité 7j</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 56 }}>
        {last7.map((d) => {
          const pct = Math.max(4, Math.round((d.count / peak) * 100));
          const jour = new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
          return (
            <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div title={`${d.count} actions`} style={{ width: '100%', height: `${pct}%`, background: 'var(--gm-primary)', borderRadius: '3px 3px 0 0', opacity: 0.85 }} />
              <span style={{ fontSize: 10, color: 'var(--gm-text-secondary)', whiteSpace: 'nowrap' }}>{jour}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Affiche les valeurs old/new côte à côte dans la ligne expandée. */
function DiffView({ oldValues, newValues }: { oldValues?: unknown; newValues?: unknown }) {
  const fmt = (v: unknown) => {
    if (v == null) return <em style={{ color: 'var(--gm-text-secondary)' }}>—</em>;
    if (typeof v === 'object') return <pre style={{ margin: 0, fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(v, null, 2)}</pre>;
    return <span>{String(v)}</span>;
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 16px', background: 'var(--gm-surface-alt, #f8fafc)', borderRadius: 8, fontSize: 12 }}>
      <div>
        <div style={{ fontWeight: 600, marginBottom: 4, color: '#dc2626' }}>Avant</div>
        {fmt(oldValues)}
      </div>
      <div>
        <div style={{ fontWeight: 600, marginBottom: 4, color: '#16a34a' }}>Après</div>
        {fmt(newValues)}
      </div>
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function AuditPage() {
  const [filtresActifs, setFiltresActifs] = useState<AuditFiltres>(FILTRES_VIDES);
  const [filtresBrouillon, setFiltresBrouillon] = useState<AuditFiltres>(FILTRES_VIDES);
  const [statsOuvert, setStatsOuvert] = useState(true);
  const [ligneExpandee, setLigneExpandee] = useState<string | null>(null);
  const [exportEnCours, setExportEnCours] = useState(false);

  const { data: logs, isLoading, isError } = useAuditLogs(filtresActifs);
  const { data: stats } = useAuditStatsExtended(30);

  const total = logs?.total ?? 0;
  const page = filtresActifs.page ?? 1;
  const limit = filtresActifs.limit ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const setBrouillon = useCallback((champ: keyof AuditFiltres, val: string) => {
    setFiltresBrouillon((prev) => ({ ...prev, [champ]: val, page: 1 }));
  }, []);

  const appliquerFiltres = useCallback(() => {
    setFiltresActifs({ ...filtresBrouillon, page: 1 });
    setLigneExpandee(null);
  }, [filtresBrouillon]);

  const reinitialiser = useCallback(() => {
    setFiltresBrouillon(FILTRES_VIDES);
    setFiltresActifs(FILTRES_VIDES);
    setLigneExpandee(null);
  }, []);

  const changerPage = useCallback((p: number) => {
    setFiltresActifs((prev) => ({ ...prev, page: p }));
  }, []);

  const exporterCSV = useCallback(async () => {
    setExportEnCours(true);
    try {
      const params = new URLSearchParams();
      params.set('format', 'CSV');
      if (filtresActifs.startDate) params.set('startDate', filtresActifs.startDate);
      if (filtresActifs.endDate) params.set('endDate', filtresActifs.endDate);
      if (filtresActifs.action) params.set('action', filtresActifs.action);
      if (filtresActifs.userId) params.set('userId', filtresActifs.userId);
      if (filtresActifs.resource) params.set('resource', filtresActifs.resource);
      if (filtresActifs.search) params.set('search', filtresActifs.search);

      const res = await api.get(`/audit/export?${params.toString()}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      const cd = (res.headers['content-disposition'] as string) ?? '';
      const match = cd.match(/filename="([^"]+)"/);
      a.download = match?.[1] ?? `audit-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Erreur lors de l\'export CSV.');
    } finally {
      setExportEnCours(false);
    }
  }, [filtresActifs]);

  // Valeurs max pour les barres de stats
  const maxAction = useMemo(() => Math.max(...(stats?.byAction.map((d) => d.count) ?? [0]), 1), [stats]);
  const maxResource = useMemo(() => Math.max(...(stats?.byResource.map((d) => d.count) ?? [0]), 1), [stats]);

  return (
    <div className="gm-page">
      <GmPageHeader
        titre="Journal d'audit"
        sousTitre={`Traçabilité complète des actions — ${total.toLocaleString('fr-FR')} entrée${total !== 1 ? 's' : ''}`}
        icone={<Shield size={20} />}
      />

      {/* ── Section stats collapsible ────────────────────────────────── */}
      <div className="gm-card" style={{ marginBottom: 16 }}>
        <button
          onClick={() => setStatsOuvert((v) => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            color: 'var(--gm-text)', fontWeight: 600, fontSize: 14,
          }}
        >
          {statsOuvert ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          Statistiques 30 derniers jours
          {stats && (
            <span style={{ marginLeft: 'auto', fontWeight: 400, fontSize: 12, color: 'var(--gm-text-secondary)' }}>
              {stats.total.toLocaleString('fr-FR')} actions au total
            </span>
          )}
        </button>

        {statsOuvert && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginTop: 20 }}>
            <BarChart
              data={stats.byAction.map((d) => ({ label: ACTION_COLORS[d.action]?.label ?? d.action, count: d.count }))}
              max={maxAction}
              label="Top actions"
            />
            <BarChart
              data={stats.byResource.map((d) => ({ label: d.resource, count: d.count }))}
              max={maxResource}
              label="Par ressource"
            />
            <DailyActivityBars daily={stats.daily} />
          </div>
        )}
      </div>

      {/* ── Barre de filtres ─────────────────────────────────────────── */}
      <div className="gm-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
          {/* Recherche libre */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--gm-text-secondary)', display: 'block', marginBottom: 4 }}>Recherche</label>
            <Input
              placeholder="Mot-clé dans les détails…"
              value={filtresBrouillon.search ?? ''}
              onChange={(e) => setBrouillon('search', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && appliquerFiltres()}
            />
          </div>

          {/* Action */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--gm-text-secondary)', display: 'block', marginBottom: 4 }}>Action</label>
            <select
              className="gm-select"
              value={filtresBrouillon.action ?? ''}
              onChange={(e) => setBrouillon('action', e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Toutes</option>
              {ACTIONS.map((a) => (
                <option key={a} value={a}>{ACTION_COLORS[a]?.label ?? a}</option>
              ))}
            </select>
          </div>

          {/* Ressource */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--gm-text-secondary)', display: 'block', marginBottom: 4 }}>Ressource</label>
            <select
              className="gm-select"
              value={filtresBrouillon.resource ?? ''}
              onChange={(e) => setBrouillon('resource', e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Toutes</option>
              {RESSOURCES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Date début */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--gm-text-secondary)', display: 'block', marginBottom: 4 }}>Depuis</label>
            <input
              type="date"
              className="gm-input"
              value={filtresBrouillon.startDate ?? ''}
              onChange={(e) => setBrouillon('startDate', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Date fin */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--gm-text-secondary)', display: 'block', marginBottom: 4 }}>Jusqu'au</label>
            <input
              type="date"
              className="gm-input"
              value={filtresBrouillon.endDate ?? ''}
              onChange={(e) => setBrouillon('endDate', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* ID utilisateur */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--gm-text-secondary)', display: 'block', marginBottom: 4 }}>ID utilisateur</label>
            <Input
              placeholder="cuid de l'utilisateur…"
              value={filtresBrouillon.userId ?? ''}
              onChange={(e) => setBrouillon('userId', e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={appliquerFiltres} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} />
            Filtrer
          </Button>
          <Button variant="outline" onClick={reinitialiser} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RotateCcw size={14} />
            Réinitialiser
          </Button>
          <div style={{ marginLeft: 'auto' }}>
            <Button
              variant="outline"
              onClick={exporterCSV}
              disabled={exportEnCours}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={14} />
              {exportEnCours ? 'Export…' : 'Exporter CSV'}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Tableau principal ─────────────────────────────────────────── */}
      <GmTableWrap>
        {isError && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--gm-error)' }}>
            Impossible de charger le journal d'audit.
          </div>
        )}

        {!isError && (
          <table className="gm-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: 32 }} />
                <th>Date / heure</th>
                <th>Utilisateur</th>
                <th>Action</th>
                <th>Ressource</th>
                <th>Détail</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--gm-text-secondary)' }}>
                    Chargement…
                  </td>
                </tr>
              )}

              {!isLoading && (!logs?.data || logs.data.length === 0) && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--gm-text-secondary)' }}>
                    Aucune entrée ne correspond aux filtres.
                  </td>
                </tr>
              )}

              {!isLoading && logs?.data.map((log: AuditLogFull) => {
                const expanded = ligneExpandee === log.id;
                const hasDetail = log.oldValues != null || log.newValues != null || log.details != null;

                return (
                  <React.Fragment key={log.id}>
                    <tr
                      style={{ cursor: hasDetail ? 'pointer' : 'default', background: expanded ? 'var(--gm-surface-alt, #f8fafc)' : undefined }}
                      onClick={() => hasDetail && setLigneExpandee(expanded ? null : log.id)}
                    >
                      <td style={{ textAlign: 'center', color: 'var(--gm-text-secondary)' }}>
                        {hasDetail && (expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                      </td>
                      <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString('fr-FR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit', second: '2-digit',
                        })}
                      </td>
                      <td style={{ fontSize: 12 }}>
                        <code style={{ fontSize: 11, background: 'var(--gm-border)', padding: '1px 4px', borderRadius: 4 }}>
                          {log.userId ? log.userId.slice(0, 8) + '…' : '—'}
                        </code>
                      </td>
                      <td>
                        <ActionBadge action={log.action} />
                      </td>
                      <td style={{ fontSize: 12 }}>
                        <span>{log.entityType ?? '—'}</span>
                        {log.entityId && (
                          <span style={{ fontSize: 10, color: 'var(--gm-text-secondary)', display: 'block' }}>
                            #{log.entityId.slice(0, 8)}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: 12, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {typeof log.details === 'string'
                          ? log.details
                          : log.details != null
                          ? JSON.stringify(log.details).slice(0, 80)
                          : '—'}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--gm-text-secondary)', whiteSpace: 'nowrap' }}>
                        {log.ipAddress ?? '—'}
                      </td>
                    </tr>

                    {/* Ligne de détail expandée */}
                    {expanded && (
                      <tr>
                        <td colSpan={7} style={{ padding: '0 16px 12px 48px' }}>
                          <DiffView
                            oldValues={log.oldValues}
                            newValues={log.newValues ?? log.details}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </GmTableWrap>

      {/* ── Pagination ───────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
          <Button
            variant="outline"
            onClick={() => changerPage(page - 1)}
            disabled={page <= 1}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <ChevronLeft size={14} />
            Précédent
          </Button>

          <span style={{ fontSize: 13, color: 'var(--gm-text-secondary)' }}>
            Page <strong>{page}</strong> / {totalPages}
            {' '}({total.toLocaleString('fr-FR')} entrée{total !== 1 ? 's' : ''})
          </span>

          <Button
            variant="outline"
            onClick={() => changerPage(page + 1)}
            disabled={page >= totalPages}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            Suivant
            <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}
