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

const FORM_INIT_CLIENT = { prenom: '', nom: '', telephone: '', email: '', ville: '' };

const KYC_LABELS: Record<string, string> = { verifie: 'Vérifié', en_attente: 'En attente', rejete: 'Rejeté' };
const KYC_STATUTS: Record<string, 'success' | 'pending' | 'failed'> = {
  verifie: 'success',
  en_attente: 'pending',
  rejete: 'failed',
};
const STATUT_LABELS: Record<string, string> = { actif: 'Actif', inactif: 'Inactif', bloque: 'Bloqué' };
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
      setErreurClient('Prénom, nom et téléphone sont obligatoires.');
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
      setSuccesClient(`Client ${formClient.prenom} ${formClient.nom} enregistré.`);
      setFormClient(FORM_INIT_CLIENT);
      setTimeout(() => { setModalOuvert(false); setSuccesClient(''); }, 1500);
    } catch {
      setErreurClient('Erreur lors de l\'enregistrement. Réessayez.');
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
    { titre: 'Prénom', valeur: (c: Client) => c.prenom },
    { titre: 'Nom', valeur: (c: Client) => c.nom },
    { titre: 'Téléphone', valeur: (c: Client) => c.telephone },
    { titre: 'Email', valeur: (c: Client) => c.email ?? '' },
    { titre: 'Ville', valeur: (c: Client) => c.ville ?? '' },
    { titre: 'KYC', valeur: (c: Client) => c.kycStatut },
    { titre: 'Statut', valeur: (c: Client) => c.statut },
    { titre: 'Opérateur', valeur: (c: Client) => c.operateur },
    { titre: 'Solde wallet (FCFA)', valeur: (c: Client) => c.soldeWallet },
    { titre: 'Transactions', valeur: (c: Client) => c.nbTransactions },
    { titre: 'Volume (FCFA)', valeur: (c: Client) => c.montantTotal },
    { titre: 'Date inscription', valeur: (c: Client) => formatDate(c.createdAt) },
  ], 'clients');

  return (
    <>
      <GmPageHeader
        titre="Gestion des clients"
        sousTitre={
          isLoading
            ? 'Chargement des clients…'
            : `${allClients.length} client(s) enregistré(s) — ${nbActifs} actif(s) · ${nbKycPending} KYC en attente`
        }
        actions={
          <>
            <GmButton variante="outline" petit onClick={exporter}>
              <Download size={14} /> Exporter
            </GmButton>
            <GmButton variante="primary" petit onClick={() => setModalOuvert(true)}>
              <Plus size={14} /> Nouveau client
            </GmButton>
          </>
        }
      />

      <div className="gm-stats-row">
        <div className="gm-stat-mini">
          <div className="gm-stat-mini-icon">👥</div>
          <div>
            <div className="gm-stat-mini-val">{allClients.length}</div>
            <div className="gm-stat-mini-lbl">Total clients</div>
          </div>
        </div>
        <div className="gm-stat-mini">
          <div className="gm-stat-mini-icon" style={{ color: 'var(--gm-success)' }}>✅</div>
          <div>
            <div className="gm-stat-mini-val" style={{ color: 'var(--gm-success)' }}>{nbActifs}</div>
            <div className="gm-stat-mini-lbl">Clients actifs</div>
          </div>
        </div>
        <div className="gm-stat-mini">
          <div className="gm-stat-mini-icon" style={{ color: 'var(--gm-warning)' }}>🔍</div>
          <div>
            <div className="gm-stat-mini-val" style={{ color: nbKycPending > 0 ? 'var(--gm-warning)' : undefined }}>
              {nbKycPending}
            </div>
            <div className="gm-stat-mini-lbl">KYC en attente</div>
          </div>
        </div>
        <div className="gm-stat-mini">
          <div className="gm-stat-mini-icon">💵</div>
          <div>
            <div className="gm-stat-mini-val">{formatMontant(totalVolume)}</div>
            <div className="gm-stat-mini-lbl">Volume total · {nbInactifs} inactif(s)</div>
          </div>
        </div>
      </div>

      <div className="gm-filters-bar">
        <div className="gm-search-wrap">
          <span className="gm-si">🔍</span>
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="gm-filter-select"
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actifs</option>
          <option value="inactif">Inactifs</option>
          <option value="bloque">Bloqués</option>
        </select>
        <select
          className="gm-filter-select"
          value={filtreKyc}
          onChange={(e) => setFiltreKyc(e.target.value)}
        >
          <option value="">Tous les KYC</option>
          <option value="verifie">Vérifiés</option>
          <option value="en_attente">En attente</option>
          <option value="rejete">Rejetés</option>
        </select>
        <span style={{ fontSize: 12, color: 'var(--gm-text-2)', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
          {isLoading ? 'Chargement…' : `${clients.length} résultat(s)`}
        </span>
      </div>

      <GmTableWrap>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Ville</th>
                <th>Opérateur</th>
                <th style={{ textAlign: 'right' }}>Solde wallet</th>
                <th style={{ textAlign: 'right' }}>Transactions</th>
                <th style={{ textAlign: 'right' }}>Volume total</th>
                <th>KYC</th>
                <th>Statut</th>
                <th>Inscription</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', color: 'var(--gm-text-2)', padding: '28px 16px' }}>
                    Chargement…
                  </td>
                </tr>
              )}
              {!isLoading && clientsPage.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', color: 'var(--gm-text-2)', padding: '28px 16px' }}>
                    Aucun client trouvé
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
                        <button className="gm-action-btn" type="button">Voir</button>
                        {c.kycStatut === 'en_attente' && (
                          <button className="gm-action-btn" type="button">Vérifier KYC</button>
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
              ? 'Aucun client'
              : `Affichage de ${debut}–${fin} sur ${clients.length} client(s) — Page ${page} / ${totalPages || 1}`}
          </span>
          <div className="gm-pag-controls">
            <button
              className="gm-action-btn"
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Précédent
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
              Suivant →
            </button>
          </div>
        </div>
      </GmTableWrap>

      <Modal
        ouvert={modalOuvert}
        onFermer={() => { setModalOuvert(false); setFormClient(FORM_INIT_CLIENT); setErreurClient(''); setSuccesClient(''); }}
        titre="Nouveau client"
        taille="md"
      >
        <form className="space-y-4" onSubmit={handleSubmitClient}>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prénom *" placeholder="Prénom" value={formClient.prenom} onChange={(e) => setFormClient((f) => ({ ...f, prenom: e.target.value }))} required />
            <Input label="Nom *" placeholder="Nom" value={formClient.nom} onChange={(e) => setFormClient((f) => ({ ...f, nom: e.target.value }))} required />
          </div>
          <Input label="Téléphone *" type="tel" placeholder="+225 07 00 00 00 00" value={formClient.telephone} onChange={(e) => setFormClient((f) => ({ ...f, telephone: e.target.value }))} required />
          <Input label="Email" type="email" placeholder="client@email.com" value={formClient.email} onChange={(e) => setFormClient((f) => ({ ...f, email: e.target.value }))} />
          <Input label="Ville" placeholder="Abidjan" value={formClient.ville} onChange={(e) => setFormClient((f) => ({ ...f, ville: e.target.value }))} />

          {erreurClient && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{erreurClient}</div>}
          {succesClient && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">{succesClient}</div>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" variante="primary" fullWidth loading={creerClient.isPending}>Enregistrer le client</Button>
            <Button type="button" variante="ghost" onClick={() => { setModalOuvert(false); setFormClient(FORM_INIT_CLIENT); setErreurClient(''); }}>Annuler</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
