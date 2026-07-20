'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  GmPageHeader,
  GmButton,
  GmStatusPill,
  GmTableWrap,
} from '@/components/gm';
import { formatMontant, formatDate } from '@/lib/formatters';
import { exporterCsv } from '@/lib/exportCsv';
import { useClients, useCreateClient } from '@/hooks/useClients';
import { Client } from '@/types';
import { useT } from '@/lib/i18n';

const FORM_INIT_CLIENT = { prenom: '', nom: '', telephone: '', email: '', ville: '' };

const KYC_STATUTS: Record<string, 'success' | 'pending' | 'failed'> = {
  verifie: 'success',
  en_attente: 'pending',
  rejete: 'failed',
};
const STATUT_PILLS: Record<string, string> = {
  actif: 'gm-pill-online',
  inactif: 'gm-pill-offline',
  bloque: 'gm-pill-suspended',
};

const AVATAR_COLORS = ['#FF6B00', '#3B82F6', '#22C55E', '#7C3AED', '#EF4444', '#F59E0B', '#1DA7E8', '#EC4899', '#14B8A6'];

/** Couleur d'avatar déterministe (purement décoratif, dérivé de l'id réel). */
function couleurAvatar(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

/** Classe de badge opérateur si l'opérateur réel est reconnu, sinon aucune. */
function classeOperateur(op: string): string {
  const v = (op || '').toLowerCase();
  if (v.includes('orange')) return 'gm-op-orange';
  if (v.includes('mtn') || v.includes('momo')) return 'gm-op-mtn';
  if (v.includes('wave')) return 'gm-op-wave';
  if (v.includes('moov')) return 'gm-op-moov';
  return '';
}

export default function ClientsPage() {
  const t = useT();
  const KYC_LABELS: Record<string, string> = t.clients.kycLabels;
  const STATUT_LABELS: Record<string, string> = t.clients.statutLabels;
  const [search, setSearch] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtreKyc, setFiltreKyc] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 15;
  const [modalOuvert, setModalOuvert] = useState(false);
  const [formClient, setFormClient] = useState(FORM_INIT_CLIENT);
  const [erreurClient, setErreurClient] = useState('');
  const [succesClient, setSuccesClient] = useState('');

  const { data: allClients = [], isLoading } = useClients();
  const creerClient = useCreateClient();

  const handleSubmitClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreurClient('');
    if (!formClient.prenom || !formClient.nom || !formClient.telephone) {
      setErreurClient(t.clients.modal.requiredFields);
      return;
    }
    try {
      await creerClient.mutateAsync({
        prenom: formClient.prenom,
        nom: formClient.nom,
        telephone: formClient.telephone,
        email: formClient.email || undefined,
        ville: formClient.ville || undefined,
      });
      setSuccesClient(`${t.clients.modal.savedPrefix} ${formClient.prenom} ${formClient.nom} ${t.clients.modal.savedSuffix}`);
      setFormClient(FORM_INIT_CLIENT);
      setTimeout(() => { setModalOuvert(false); setSuccesClient(''); }, 1500);
    } catch {
      setErreurClient(t.clients.modal.saveError);
    }
  };

  const clients = allClients.filter((c) => {
    const matchSearch = !search ||
      `${c.prenom} ${c.nom}`.toLowerCase().includes(search.toLowerCase()) ||
      c.telephone.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !filtreStatut || c.statut === filtreStatut;
    const matchKyc = !filtreKyc || c.kycStatut === filtreKyc;
    return matchSearch && matchStatut && matchKyc;
  });

  const totalPages = Math.ceil(clients.length / LIMIT);
  const clientsPage = clients.slice((page - 1) * LIMIT, page * LIMIT);
  const debut = clients.length === 0 ? 0 : (page - 1) * LIMIT + 1;
  const fin = Math.min(page * LIMIT, clients.length);

  useEffect(() => setPage(1), [search, filtreStatut, filtreKyc]);

  const nbActifs = allClients.filter((c) => c.statut === 'actif').length;
  const nbInactifs = allClients.filter((c) => c.statut === 'inactif').length;
  const nbKycPending = allClients.filter((c) => c.kycStatut === 'en_attente').length;
  const totalVolume = allClients.reduce((s, c) => s + c.montantTotal, 0);

  const exporter = () => exporterCsv(clients, [
    { titre: t.common.firstName, valeur: (c: Client) => c.prenom },
    { titre: t.common.lastName, valeur: (c: Client) => c.nom },
    { titre: t.common.phone, valeur: (c: Client) => c.telephone },
    { titre: t.common.email, valeur: (c: Client) => c.email ?? '' },
    { titre: t.common.city, valeur: (c: Client) => c.ville ?? '' },
    { titre: t.clients.table.colKyc, valeur: (c: Client) => c.kycStatut },
    { titre: t.common.statut, valeur: (c: Client) => c.statut },
    { titre: t.common.operator, valeur: (c: Client) => c.operateur },
    { titre: `${t.clients.table.colWallet} (FCFA)`, valeur: (c: Client) => c.soldeWallet },
    { titre: t.clients.table.colTransactions, valeur: (c: Client) => c.nbTransactions },
    { titre: `${t.common.volume} (FCFA)`, valeur: (c: Client) => c.montantTotal },
    { titre: t.common.registration, valeur: (c: Client) => formatDate(c.createdAt) },
  ], 'clients');

  return (
    <>
      <GmPageHeader
        titre={t.clients.title}
        sousTitre={
          isLoading
            ? t.clients.loading
            : `${allClients.length} ${t.clients.registeredSuffix} — ${nbActifs} ${t.clients.activeSuffix} · ${nbKycPending} ${t.clients.kycPendingSuffix}`
        }
        actions={
          <>
            <GmButton variante="outline" petit onClick={exporter}>
              <Download size={14} /> {t.common.export}
            </GmButton>
            <GmButton variante="primary" petit onClick={() => setModalOuvert(true)}>
              <Plus size={14} /> {t.clients.newClient}
            </GmButton>
          </>
        }
      />

      <div className="gm-stats-row">
        <div className="gm-stat-mini">
          <div className="gm-stat-mini-icon">👥</div>
          <div>
            <div className="gm-stat-mini-val">{allClients.length}</div>
            <div className="gm-stat-mini-lbl">{t.clients.stats.totalClients}</div>
          </div>
        </div>
        <div className="gm-stat-mini">
          <div className="gm-stat-mini-icon" style={{ color: 'var(--gm-success)' }}>✅</div>
          <div>
            <div className="gm-stat-mini-val" style={{ color: 'var(--gm-success)' }}>{nbActifs}</div>
            <div className="gm-stat-mini-lbl">{t.clients.stats.activeClients}</div>
          </div>
        </div>
        <div className="gm-stat-mini">
          <div className="gm-stat-mini-icon" style={{ color: 'var(--gm-warning)' }}>🔍</div>
          <div>
            <div className="gm-stat-mini-val" style={{ color: nbKycPending > 0 ? 'var(--gm-warning)' : undefined }}>
              {nbKycPending}
            </div>
            <div className="gm-stat-mini-lbl">{t.clients.stats.kycPending}</div>
          </div>
        </div>
        <div className="gm-stat-mini">
          <div className="gm-stat-mini-icon">💵</div>
          <div>
            <div className="gm-stat-mini-val">{formatMontant(totalVolume)}</div>
            <div className="gm-stat-mini-lbl">{t.clients.stats.totalVolume} · {nbInactifs} {t.clients.stats.inactiveSuffix}</div>
          </div>
        </div>
      </div>

      <div className="gm-filters-bar">
        <div className="gm-search-wrap">
          <span className="gm-si">🔍</span>
          <input
            type="text"
            placeholder={t.clients.filters.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="gm-filter-select"
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
        >
          <option value="">{t.clients.filters.allStatus}</option>
          <option value="actif">{t.clients.filters.actifs}</option>
          <option value="inactif">{t.clients.filters.inactifs}</option>
          <option value="bloque">{t.clients.filters.bloques}</option>
        </select>
        <select
          className="gm-filter-select"
          value={filtreKyc}
          onChange={(e) => setFiltreKyc(e.target.value)}
        >
          <option value="">{t.clients.filters.allKyc}</option>
          <option value="verifie">{t.clients.filters.verifies}</option>
          <option value="en_attente">{t.clients.filters.enAttente}</option>
          <option value="rejete">{t.clients.filters.rejetes}</option>
        </select>
        <span style={{ fontSize: 12, color: 'var(--gm-text-2)', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
          {isLoading ? t.common.loading : `${clients.length} ${t.common.results}`}
        </span>
      </div>

      <GmTableWrap>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>{t.clients.table.colClient}</th>
                <th>{t.common.city}</th>
                <th>{t.common.operator}</th>
                <th style={{ textAlign: 'right' }}>{t.clients.table.colWallet}</th>
                <th style={{ textAlign: 'right' }}>{t.clients.table.colTransactions}</th>
                <th style={{ textAlign: 'right' }}>{t.clients.table.colTotalVolume}</th>
                <th>{t.clients.table.colKyc}</th>
                <th>{t.common.statut}</th>
                <th>{t.common.registration}</th>
                <th>{t.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', color: 'var(--gm-text-2)', padding: '28px 16px' }}>
                    {t.common.loading}
                  </td>
                </tr>
              )}
              {!isLoading && clientsPage.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', color: 'var(--gm-text-2)', padding: '28px 16px' }}>
                    {t.clients.table.empty}
                  </td>
                </tr>
              )}
              {!isLoading && clientsPage.map((c) => {
                const initiales = `${c.prenom?.[0] ?? ''}${c.nom?.[0] ?? ''}`.toUpperCase() || '—';
                const clsOp = classeOperateur(c.operateur);
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="gm-client-cell">
                        <div className="gm-avatar" style={{ background: couleurAvatar(c.id) }}>{initiales}</div>
                        <div>
                          <div className="gm-client-name">{c.prenom} {c.nom}</div>
                          <div className="gm-client-id">{c.telephone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{c.ville || '—'}</td>
                    <td>
                      {c.operateur
                        ? <span className={clsOp ? `gm-op-badge ${clsOp}` : 'gm-op-badge'}>{c.operateur}</span>
                        : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {formatMontant(c.soldeWallet)}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{c.nbTransactions}</td>
                    <td style={{ textAlign: 'right', color: 'var(--gm-text-2)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatMontant(c.montantTotal)}
                    </td>
                    <td>
                      <GmStatusPill statut={KYC_STATUTS[c.kycStatut] ?? 'pending'}>
                        {KYC_LABELS[c.kycStatut] ?? c.kycStatut}
                      </GmStatusPill>
                    </td>
                    <td>
                      <span className={`gm-status-pill ${STATUT_PILLS[c.statut] ?? 'gm-pill-offline'}`}>
                        {STATUT_LABELS[c.statut] ?? c.statut}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>
                      {c.createdAt ? formatDate(c.createdAt) : '—'}
                    </td>
                    <td>
                      <div className="gm-action-btns">
                        <button className="gm-action-btn" type="button">{t.common.view}</button>
                        {c.kycStatut === 'en_attente' && (
                          <button className="gm-action-btn" type="button">{t.clients.table.verifyKyc}</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="gm-table-footer">
          <span className="gm-pag-info">
            {clients.length === 0
              ? t.clients.table.noClient
              : `${t.clients.table.showing} ${debut}–${fin} ${t.clients.table.onTotal} ${clients.length} ${t.clients.table.clientsSuffix} — ${t.common.page} ${page} / ${totalPages || 1}`}
          </span>
          <div className="gm-pag-controls">
            <button
              className="gm-action-btn"
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              {t.clients.table.prev}
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={p === page ? 'gm-pag-btn gm-active' : 'gm-pag-btn'}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className="gm-action-btn"
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t.clients.table.next}
            </button>
          </div>
        </div>
      </GmTableWrap>

      <Modal
        ouvert={modalOuvert}
        onFermer={() => { setModalOuvert(false); setFormClient(FORM_INIT_CLIENT); setErreurClient(''); setSuccesClient(''); }}
        titre={t.clients.modal.title}
        taille="md"
      >
        <form className="space-y-4" onSubmit={handleSubmitClient}>
          <div className="grid grid-cols-2 gap-3">
            <Input label={t.clients.modal.firstNameRequired} placeholder={t.common.firstName} value={formClient.prenom} onChange={(e) => setFormClient((f) => ({ ...f, prenom: e.target.value }))} required />
            <Input label={t.clients.modal.lastNameRequired} placeholder={t.common.lastName} value={formClient.nom} onChange={(e) => setFormClient((f) => ({ ...f, nom: e.target.value }))} required />
          </div>
          <Input label={t.clients.modal.phoneRequired} type="tel" placeholder="+225 07 00 00 00 00" value={formClient.telephone} onChange={(e) => setFormClient((f) => ({ ...f, telephone: e.target.value }))} required />
          <Input label={t.common.email} type="email" placeholder={t.clients.modal.emailPlaceholder} value={formClient.email} onChange={(e) => setFormClient((f) => ({ ...f, email: e.target.value }))} />
          <Input label={t.common.city} placeholder={t.clients.modal.cityPlaceholder} value={formClient.ville} onChange={(e) => setFormClient((f) => ({ ...f, ville: e.target.value }))} />

          {erreurClient && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{erreurClient}</div>}
          {succesClient && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">{succesClient}</div>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" variante="primary" fullWidth loading={creerClient.isPending}>{t.clients.modal.submit}</Button>
            <Button type="button" variante="ghost" onClick={() => { setModalOuvert(false); setFormClient(FORM_INIT_CLIENT); setErreurClient(''); }}>{t.common.cancel}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
