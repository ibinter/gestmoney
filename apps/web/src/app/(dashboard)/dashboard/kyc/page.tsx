'use client';
// ============================================================
// Page KYC — Liste et traitement des dossiers KYC clients
// Accessible : ADMIN / MANAGER uniquement
// ============================================================
import React, { useState } from 'react';
import { ShieldCheck, CheckCircle, XCircle, Clock, AlertCircle, Search } from 'lucide-react';
import { GmPageHeader, GmButton, GmTableWrap } from '@/components/gm';
import { KycDossierModal } from '@/components/ui/KycDossierModal';
import { useKycDossiers, useKycStats, KycDossier } from '@/hooks/useKycDossiers';
import { formatDate } from '@/lib/formatters';

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUTS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'VALIDE', label: 'Validés' },
  { value: 'REFUSE', label: 'Refusés' },
  { value: 'EXPIRE', label: 'Expirés' },
];

function StatutBadge({ statut }: { statut: string }) {
  const MAP: Record<string, { label: string; bg: string; color: string }> = {
    EN_ATTENTE: { label: 'En attente', bg: 'var(--color-warning-light)',  color: 'var(--color-warning)' },
    EN_COURS:   { label: 'En cours',   bg: 'var(--color-info-light)',     color: 'var(--color-info)' },
    VALIDE:     { label: 'Validé',     bg: 'var(--color-success-light)',  color: 'var(--color-success)' },
    REFUSE:     { label: 'Refusé',     bg: 'var(--color-danger-light)',   color: 'var(--color-danger)' },
    EXPIRE:     { label: 'Expiré',     bg: 'var(--color-surface-3)',      color: 'var(--color-text-muted)' },
  };
  const cfg = MAP[statut] ?? MAP.EN_ATTENTE;
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
    }}>
      {cfg.label}
    </span>
  );
}

function PhotoMini({ src }: { src?: string | null }) {
  if (!src) return <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>—</span>;
  return (
    <img
      src={src}
      alt="Document"
      style={{ width: 44, height: 36, objectFit: 'cover', borderRadius: 5, border: '1px solid var(--color-border)' }}
    />
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function KycPage() {
  const [filtreStatut, setFiltreStatut] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dossierSelectionne, setDossierSelectionne] = useState<KycDossier | null>(null);
  const LIMIT = 20;

  const { data, isLoading } = useKycDossiers({ statut: filtreStatut || undefined, page, limit: LIMIT });
  const { data: stats } = useKycStats();

  const dossiers = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  // Filtre client-side par nom/téléphone
  const filtres = search
    ? dossiers.filter((d) => {
        const nom = `${d.client?.firstName ?? ''} ${d.client?.lastName ?? ''}`.toLowerCase();
        const tel = d.client?.phoneNumber ?? '';
        return nom.includes(search.toLowerCase()) || tel.includes(search);
      })
    : dossiers;

  return (
    <>
      <GmPageHeader
        titre="Dossiers KYC"
        sousTitre={
          stats
            ? `${stats.total} dossier(s) — ${stats.EN_COURS} en cours · ${stats.VALIDE} validés · ${stats.REFUSE} refusés`
            : "Vérification d'identité des clients"
        }
      />

      {/* Statistiques */}
      <div className="gm-stats-row" style={{ marginBottom: 24 }}>
        {[
          { icone: <Clock size={18} />,        label: 'En attente', val: stats?.EN_ATTENTE ?? 0, color: 'var(--color-warning)' },
          { icone: <AlertCircle size={18} />,   label: 'En cours',   val: stats?.EN_COURS   ?? 0, color: 'var(--color-info)' },
          { icone: <CheckCircle size={18} />,   label: 'Validés',    val: stats?.VALIDE     ?? 0, color: 'var(--color-success)' },
          { icone: <XCircle size={18} />,       label: 'Refusés',    val: stats?.REFUSE     ?? 0, color: 'var(--color-danger)' },
        ].map(({ icone, label, val, color }) => (
          <div key={label} className="gm-stat-mini">
            <div className="gm-stat-mini-icon" style={{ color }}>{icone}</div>
            <div>
              <div className="gm-stat-mini-val">{val}</div>
              <div className="gm-stat-mini-lbl">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Rechercher par nom ou téléphone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8,
              border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
              color: 'var(--color-text)', fontSize: 13, boxSizing: 'border-box',
            }}
          />
        </div>
        <select
          value={filtreStatut}
          onChange={(e) => { setFiltreStatut(e.target.value); setPage(1); }}
          style={{
            padding: '8px 12px', borderRadius: 8,
            border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
            color: 'var(--color-text)', fontSize: 13,
          }}
        >
          {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Tableau */}
      <GmTableWrap>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Photo', 'Client', 'Téléphone', 'Type document', 'N° document', 'Soumis le', 'Statut', 'Action'].map((h) => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>Chargement…</td></tr>
            ) : filtres.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>Aucun dossier KYC trouvé.</td></tr>
            ) : filtres.map((d) => (
              <tr key={d.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '10px 12px' }}><PhotoMini src={d.photoRecto} /></td>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                  {d.client ? `${d.client.firstName} ${d.client.lastName}` : '—'}
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)' }}>{d.client?.phoneNumber ?? '—'}</td>
                <td style={{ padding: '10px 12px' }}>{d.typeDocument ?? '—'}</td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12 }}>{d.numeroDocument ?? '—'}</td>
                <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{formatDate(d.createdAt)}</td>
                <td style={{ padding: '10px 12px' }}><StatutBadge statut={d.statut} /></td>
                <td style={{ padding: '10px 12px' }}>
                  <GmButton
                    variante="secondary"
                    petit
                    onClick={() => setDossierSelectionne(d)}
                  >
                    <ShieldCheck size={13} /> Examiner
                  </GmButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GmTableWrap>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <GmButton variante="secondary" petit onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            Précédent
          </GmButton>
          <span style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--color-text-muted)' }}>
            Page {page} / {totalPages}
          </span>
          <GmButton variante="secondary" petit onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            Suivant
          </GmButton>
        </div>
      )}

      {/* Modal vérificateur */}
      {dossierSelectionne && (
        <KycDossierModal
          clientId={dossierSelectionne.clientId}
          clientNom={
            dossierSelectionne.client
              ? `${dossierSelectionne.client.firstName} ${dossierSelectionne.client.lastName}`
              : 'Client'
          }
          dossier={dossierSelectionne}
          estAdmin
          onClose={() => setDossierSelectionne(null)}
        />
      )}
    </>
  );
}
