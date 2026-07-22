'use client';
// ============================================================
// GESTION DES OPÉRATEURS MOBILE MONEY — GESTMONEY
// Liste + CRUD (créer / modifier / supprimer) branchés sur l'API réelle
// (`/networks` via hooks/useOperateurs). Aucune donnée fictive.
// ============================================================
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { GmPageHeader, GmButton } from '@/components/gm';
import { formatDate } from '@/lib/formatters';
import { useT } from '@/lib/i18n';
import {
  useOperateurs,
  useCreateOperateur,
  useUpdateOperateur,
  useDeleteOperateur,
  Operateur,
} from '@/hooks/useOperateurs';

// ─── Constantes ────────────────────────────────────────────────────────────────
const STATUTS: Array<{ value: Operateur['status']; label: string }> = [
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'INACTIVE', label: 'Inactif' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
];

const STATUT_LABEL: Record<Operateur['status'], string> = {
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
  MAINTENANCE: 'Maintenance',
};

// Couleurs des pastilles de statut (Actif=vert, Inactif=gris, Maintenance=orange)
const STATUT_STYLE: Record<Operateur['status'], React.CSSProperties> = {
  ACTIVE: { background: 'rgba(34,197,94,0.14)', color: '#15803d' },
  INACTIVE: { background: 'rgba(107,114,128,0.16)', color: '#4b5563' },
  MAINTENANCE: { background: 'rgba(245,158,11,0.16)', color: '#b45309' },
};

const CODE_REGEX = /^[A-Z0-9_]+$/;

interface FormState {
  operatorCode: string;
  name: string;
  country: string;
  currency: string;
  status: Operateur['status'];
}

const FORM_INIT: FormState = {
  operatorCode: '',
  name: '',
  country: '',
  currency: 'XOF',
  status: 'ACTIVE',
};

export default function OperateursPage() {
  const t = useT();

  const { data: operateurs = [], isLoading, isError } = useOperateurs();
  const creer = useCreateOperateur();
  const modifier = useUpdateOperateur();
  const supprimer = useDeleteOperateur();

  // Modale formulaire (création / édition)
  const [modalOuvert, setModalOuvert] = useState(false);
  const [editionId, setEditionId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(FORM_INIT);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  // Confirmation de suppression
  const [aSupprimer, setASupprimer] = useState<Operateur | null>(null);
  const [erreurSuppr, setErreurSuppr] = useState('');

  const nbActifs = operateurs.filter((o) => o.status === 'ACTIVE').length;
  const nbMaintenance = operateurs.filter((o) => o.status === 'MAINTENANCE').length;

  const ouvrirCreation = () => {
    setEditionId(null);
    setForm(FORM_INIT);
    setErreur('');
    setSucces('');
    setModalOuvert(true);
  };

  const ouvrirEdition = (o: Operateur) => {
    setEditionId(o.id);
    setForm({
      operatorCode: o.operatorCode,
      name: o.name,
      country: o.country,
      currency: o.currency || 'XOF',
      status: o.status,
    });
    setErreur('');
    setSucces('');
    setModalOuvert(true);
  };

  const fermerModal = () => {
    setModalOuvert(false);
    setEditionId(null);
    setForm(FORM_INIT);
    setErreur('');
    setSucces('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');

    const code = form.operatorCode.trim().toUpperCase();
    if (!code || !form.name.trim() || !form.country.trim()) {
      setErreur('Le code, le nom et le pays sont obligatoires.');
      return;
    }
    if (!CODE_REGEX.test(code)) {
      setErreur('Le code doit être en MAJUSCULES (lettres, chiffres et _ uniquement). Ex. ORANGE_MONEY.');
      return;
    }

    try {
      if (editionId) {
        await modifier.mutateAsync({
          id: editionId,
          operatorCode: code,
          name: form.name.trim(),
          country: form.country.trim(),
          currency: form.currency.trim() || 'XOF',
          status: form.status,
        });
        setSucces(`Opérateur « ${form.name.trim()} » mis à jour.`);
      } else {
        await creer.mutateAsync({
          operatorCode: code,
          name: form.name.trim(),
          country: form.country.trim(),
          currency: form.currency.trim() || 'XOF',
          status: form.status,
        });
        setSucces(`Opérateur « ${form.name.trim()} » créé.`);
      }
      setTimeout(fermerModal, 1200);
    } catch (err: any) {
      setErreur(
        err?.response?.data?.message ||
          (editionId ? 'Impossible de modifier cet opérateur.' : 'Impossible de créer cet opérateur.'),
      );
    }
  };

  const handleDelete = async () => {
    if (!aSupprimer) return;
    setErreurSuppr('');
    try {
      await supprimer.mutateAsync(aSupprimer.id);
      setASupprimer(null);
    } catch (err: any) {
      // 409 : opérateur référencé → afficher le message renvoyé par l'API.
      setErreurSuppr(
        err?.response?.data?.message ||
          'Cet opérateur est utilisé et ne peut pas être supprimé. Désactivez-le plutôt.',
      );
    }
  };

  const enCoursForm = creer.isPending || modifier.isPending;

  return (
    <>
      <GmPageHeader
        fil={['Accueil', 'Opérateurs']}
        titre="Opérateurs Mobile Money"
        sousTitre={
          isLoading
            ? 'Chargement…'
            : `${operateurs.length} opérateur${operateurs.length > 1 ? 's' : ''} — ${nbActifs} actif${nbActifs > 1 ? 's' : ''}${nbMaintenance ? ` · ${nbMaintenance} en maintenance` : ''}`
        }
        actions={
          <GmButton variante="primary" petit onClick={ouvrirCreation}>
            Nouvel opérateur
          </GmButton>
        }
      />

      {/* ── Liste ─────────────────────────────────────────────── */}
      <div className="gm-agences-grid">
        {isLoading && (
          <div className="gm-agence-card">
            <div className="gm-agence-city">Chargement des opérateurs…</div>
          </div>
        )}

        {!isLoading && isError && (
          <div className="gm-agence-card">
            <div className="gm-agence-city" style={{ color: 'var(--gm-danger)' }}>
              Impossible de charger les opérateurs. Réessayez plus tard.
            </div>
          </div>
        )}

        {!isLoading && !isError && operateurs.length === 0 && (
          <div className="gm-agence-card">
            <div className="gm-agence-city">
              Aucun opérateur. Cliquez sur « Nouvel opérateur » pour en ajouter un.
            </div>
          </div>
        )}

        {!isLoading &&
          !isError &&
          operateurs.map((o) => (
            <div className="gm-agence-card" key={o.id}>
              <div className="gm-agence-card-header">
                <div>
                  <div className="gm-agence-name">📡 {o.name}</div>
                  <div className="gm-agence-city">
                    {o.operatorCode} · {o.country || '—'} · {o.currency || '—'}
                  </div>
                </div>
                <span className="gm-status-pill" style={STATUT_STYLE[o.status]}>
                  {STATUT_LABEL[o.status]}
                </span>
              </div>

              <div className="gm-agence-metrics">
                <div className="gm-agence-metric">
                  <div className="gm-agence-metric-value">{o.nbTransactions}</div>
                  <div className="gm-agence-metric-label">Transactions</div>
                </div>
                <div className="gm-agence-metric">
                  <div className="gm-agence-metric-value">{o.nbAgences}</div>
                  <div className="gm-agence-metric-label">Agences</div>
                </div>
                <div className="gm-agence-metric">
                  <div className="gm-agence-metric-value">{o.nbFloat}</div>
                  <div className="gm-agence-metric-label">Float</div>
                </div>
                <div className="gm-agence-metric">
                  <div className="gm-agence-metric-value" style={{ fontSize: 13 }}>
                    {o.createdAt ? formatDate(o.createdAt) : '—'}
                  </div>
                  <div className="gm-agence-metric-label">Créé le</div>
                </div>
              </div>

              <div className="gm-agence-actions">
                <button type="button" className="gm-agence-btn gm-primary" onClick={() => ouvrirEdition(o)}>
                  {t.common.edit}
                </button>
                <button
                  type="button"
                  className="gm-agence-btn"
                  onClick={() => {
                    setErreurSuppr('');
                    setASupprimer(o);
                  }}
                  style={{ color: 'var(--gm-danger)' }}
                >
                  {t.common.delete}
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* ── Modale création / édition ─────────────────────────── */}
      <Modal
        ouvert={modalOuvert}
        onFermer={fermerModal}
        titre={editionId ? "Modifier l'opérateur" : 'Nouvel opérateur'}
        taille="md"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nom"
              placeholder="Orange Money"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              label="Code opérateur"
              placeholder="ORANGE_MONEY"
              value={form.operatorCode}
              onChange={(e) =>
                setForm((f) => ({ ...f, operatorCode: e.target.value.toUpperCase() }))
              }
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Pays"
              placeholder="Côte d'Ivoire"
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              required
            />
            <Input
              label="Devise"
              placeholder="XOF"
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))}
            />
          </div>
          <Select
            label="Statut"
            options={STATUTS}
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({ ...f, status: e.target.value as Operateur['status'] }))
            }
          />

          <p className="text-xs text-gray-400">
            Code en MAJUSCULES, lettres, chiffres et « _ » uniquement (ex. ORANGE_MONEY).
          </p>

          {erreur && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
              {erreur}
            </div>
          )}
          {succes && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
              {succes}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" variante="primary" fullWidth loading={enCoursForm}>
              {editionId ? t.common.save : t.common.create}
            </Button>
            <Button type="button" variante="ghost" onClick={fermerModal}>
              {t.common.cancel}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Confirmation de suppression ───────────────────────── */}
      <Modal
        ouvert={!!aSupprimer}
        onFermer={() => {
          setASupprimer(null);
          setErreurSuppr('');
        }}
        titre="Supprimer l'opérateur"
        taille="sm"
      >
        {aSupprimer && (
          <div className="space-y-4">
            <p className="text-sm text-text-main">
              Confirmer la suppression de l'opérateur «&nbsp;
              <strong>{aSupprimer.name}</strong>&nbsp;» ({aSupprimer.operatorCode}) ? Cette action
              est irréversible.
            </p>

            {erreurSuppr && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                {erreurSuppr}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variante="danger"
                fullWidth
                loading={supprimer.isPending}
                onClick={handleDelete}
              >
                {t.common.delete}
              </Button>
              <Button
                type="button"
                variante="ghost"
                onClick={() => {
                  setASupprimer(null);
                  setErreurSuppr('');
                }}
              >
                {t.common.cancel}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
