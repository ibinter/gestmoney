'use client';
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  GmPageHeader,
  GmButton,
  GmStatusPill,
  GmTableWrap,
} from '@/components/gm';
import { GmExportMenu } from '@/components/gm/GmExportMenu';
import { formatMontant, formatDate } from '@/lib/formatters';
import {
  useClients,
  useCreateClient,
  useSoumettreKyc,
  useApprouverKyc,
  useRejeterKyc,
  useVoirDocumentKyc,
  type ClientKyc,
} from '@/hooks/useClients';
import { Client } from '@/types';
import { useAuthStore } from '@/store/authStore';
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

/** Extrait un message lisible d'une erreur Axios/API, avec repli générique. */
function messageErreurApi(err: unknown): string {
  const e = err as { response?: { data?: { message?: unknown } } };
  const m = e?.response?.data?.message;
  if (Array.isArray(m)) return m.join(', ');
  if (typeof m === 'string' && m) return m;
  return 'Une erreur est survenue. Réessayez.';
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
  const [clientVu, setClientVu] = useState<ClientKyc | null>(null);
  const [formClient, setFormClient] = useState(FORM_INIT_CLIENT);
  const [erreurClient, setErreurClient] = useState('');
  const [succesClient, setSuccesClient] = useState('');

  // --- État du flux KYC (modale détail) ---
  const [kycFichier, setKycFichier] = useState<{ dataUrl: string; type: string; name: string } | null>(null);
  const [kycErreur, setKycErreur] = useState('');
  const [kycSucces, setKycSucces] = useState('');
  const [motifRejet, setMotifRejet] = useState('');
  const [afficheRejet, setAfficheRejet] = useState(false);

  const { data: allClients = [], isLoading } = useClients();
  const creerClient = useCreateClient();
  const soumettreKyc = useSoumettreKyc();
  const approuverKyc = useApprouverKyc();
  const rejeterKyc = useRejeterKyc();
  const voirDocument = useVoirDocumentKyc();

  const roleUser = String(useAuthStore((s) => s.user?.role) ?? '').toUpperCase();
  const estAdmin = roleUser === 'SUPER_ADMIN' || roleUser === 'NETWORK_ADMIN';

  // Réinitialise l'état KYC à chaque ouverture/fermeture de la modale détail.
  const fermerDetail = () => {
    setClientVu(null);
    setKycFichier(null);
    setKycErreur('');
    setKycSucces('');
    setMotifRejet('');
    setAfficheRejet(false);
  };

  const onFichierKyc = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKycErreur('');
    setKycSucces('');
    const file = e.target.files?.[0];
    if (!file) { setKycFichier(null); return; }
    if (file.size > 4 * 1024 * 1024) {
      setKycErreur('Le fichier ne doit pas dépasser 4 Mo.');
      setKycFichier(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setKycFichier({ dataUrl: String(reader.result), type: file.type, name: file.name });
    reader.onerror = () => setKycErreur('Lecture du fichier impossible.');
    reader.readAsDataURL(file);
  };

  const soumettreDossierKyc = async () => {
    if (!clientVu || !kycFichier) { setKycErreur('Sélectionnez une pièce d’identité.'); return; }
    setKycErreur('');
    try {
      await soumettreKyc.mutateAsync({
        id: clientVu.id,
        documentUrl: kycFichier.dataUrl,
        documentType: kycFichier.type || undefined,
      });
      setKycSucces('Dossier déposé — KYC en attente de vérification.');
      setKycFichier(null);
      setClientVu((c) => (c ? { ...c, kycStatut: 'en_attente', kycADocument: true } : c));
    } catch (err) {
      setKycErreur(messageErreurApi(err));
    }
  };

  const approuverDossierKyc = async () => {
    if (!clientVu) return;
    setKycErreur('');
    try {
      await approuverKyc.mutateAsync({ id: clientVu.id });
      setKycSucces('KYC approuvé — client vérifié.');
      setClientVu((c) => (c ? { ...c, kycStatut: 'verifie', kycMotifRejet: null } : c));
    } catch (err) {
      setKycErreur(messageErreurApi(err));
    }
  };

  const rejeterDossierKyc = async () => {
    if (!clientVu) return;
    setKycErreur('');
    try {
      await rejeterKyc.mutateAsync({ id: clientVu.id, reason: motifRejet || undefined });
      setKycSucces('KYC rejeté.');
      setClientVu((c) => (c ? { ...c, kycStatut: 'rejete', kycMotifRejet: motifRejet || null } : c));
      setAfficheRejet(false);
      setMotifRejet('');
    } catch (err) {
      setKycErreur(messageErreurApi(err));
    }
  };

  const ouvrirDocumentKyc = async () => {
    if (!clientVu) return;
    setKycErreur('');
    try {
      const doc = await voirDocument.mutateAsync(clientVu.id);
      const w = window.open();
      if (w) {
        const isImage = (doc.documentType ?? '').startsWith('image') || doc.documentUrl.startsWith('data:image');
        w.document.write(
          isImage
            ? `<img src="${doc.documentUrl}" style="max-width:100%" alt="Pièce d'identité" />`
            : `<iframe src="${doc.documentUrl}" style="width:100%;height:100vh;border:0"></iframe>`
        );
        w.document.title = 'Pièce d’identité';
      }
    } catch (err) {
      setKycErreur(messageErreurApi(err));
    }
  };

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
            <GmExportMenu
              titre={t.clients.title}
              donnees={clients}
              colonnes={[
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
              ]}
              nomFichier="clients"
            />
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
                        <button className="gm-action-btn" type="button" onClick={() => setClientVu(c)}>{t.common.view}</button>
                        {c.kycStatut === 'en_attente' && (
                          <button className="gm-action-btn" type="button" onClick={() => setClientVu(c)}>{t.clients.table.verifyKyc}</button>
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

      {/* Modale DÉTAIL client + FLUX KYC */}
      <Modal ouvert={!!clientVu} onFermer={fermerDetail} titre={clientVu ? `${clientVu.prenom} ${clientVu.nom}` : ''} taille="md">
        {clientVu && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {([
                [t.common.phone, clientVu.telephone || '—'],
                [t.common.email, clientVu.email || '—'],
                [t.common.city, clientVu.ville || '—'],
                [t.common.operator, clientVu.operateur || '—'],
                [t.clients.table.colWallet, formatMontant(clientVu.soldeWallet)],
                [t.clients.table.colTransactions, String(clientVu.nbTransactions ?? 0)],
                [t.clients.table.colTotalVolume, formatMontant(clientVu.montantTotal)],
                [t.common.registration, clientVu.createdAt ? formatDate(clientVu.createdAt) : '—'],
              ] as [string, string][]).map(([label, val]) => (
                <div key={label}>
                  <div className="text-xs uppercase tracking-wide text-text-muted mb-1">{label}</div>
                  <div className="text-sm font-semibold text-text-main">{val}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-text-muted mb-1">{t.common.statut}</div>
                <span className={`gm-status-pill ${STATUT_PILLS[clientVu.statut] ?? 'gm-pill-offline'}`}>{STATUT_LABELS[clientVu.statut] ?? clientVu.statut}</span>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-text-muted mb-1">{t.clients.table.colKyc}</div>
                <GmStatusPill statut={KYC_STATUTS[clientVu.kycStatut] ?? 'pending'}>{KYC_LABELS[clientVu.kycStatut] ?? clientVu.kycStatut}</GmStatusPill>
              </div>
            </div>

            {/* Motif de rejet éventuel */}
            {clientVu.kycStatut === 'rejete' && clientVu.kycMotifRejet && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                <span className="font-semibold">Motif du rejet : </span>{clientVu.kycMotifRejet}
              </div>
            )}

            {/* Zone KYC : pièce d'identité + actions */}
            <div className="border-t border-border-subtle pt-4 space-y-3">
              <div className="text-xs uppercase tracking-wide text-text-muted">Pièce d’identité</div>

              {clientVu.kycADocument && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-2">Un document est enregistré.</span>
                  <Button type="button" variante="ghost" onClick={ouvrirDocumentKyc} loading={voirDocument.isPending}>
                    Voir le document
                  </Button>
                </div>
              )}

              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={onFichierKyc}
                className="block w-full text-sm text-text-2 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-gray-200"
              />
              {kycFichier && <div className="text-xs text-text-muted">Sélectionné : {kycFichier.name}</div>}

              <Button
                type="button"
                variante="primary"
                disabled={!kycFichier}
                loading={soumettreKyc.isPending}
                onClick={soumettreDossierKyc}
              >
                {clientVu.kycADocument ? 'Redéposer le dossier' : 'Soumettre le dossier'}
              </Button>

              {/* Actions ADMIN : approuver / rejeter (uniquement si en attente) */}
              {estAdmin && clientVu.kycStatut === 'en_attente' && (
                <div className="space-y-2 pt-1">
                  <div className="flex gap-3">
                    <Button type="button" variante="primary" loading={approuverKyc.isPending} onClick={approuverDossierKyc}>
                      Approuver
                    </Button>
                    <Button type="button" variante="ghost" onClick={() => setAfficheRejet((v) => !v)}>
                      Rejeter
                    </Button>
                  </div>
                  {afficheRejet && (
                    <div className="space-y-2">
                      <Input
                        label="Motif du rejet"
                        placeholder="Ex. document illisible"
                        value={motifRejet}
                        onChange={(e) => setMotifRejet(e.target.value)}
                      />
                      <Button type="button" variante="primary" loading={rejeterKyc.isPending} onClick={rejeterDossierKyc}>
                        Confirmer le rejet
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {kycErreur && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{kycErreur}</div>}
              {kycSucces && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">{kycSucces}</div>}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
