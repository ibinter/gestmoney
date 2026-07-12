'use client';
// ============================================================
// PAGE GESTION FLOAT — GESTMONEY
// ============================================================
import React, { useState } from 'react';
import { RefreshCw, Plus, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, badgeStatutFloat } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Table, Colonne } from '@/components/ui/Table';
import { useFloatSoldes, useFloatMouvements, useDemandesReappro, useCreerDemandeReappro } from '@/hooks/useFloat';
import { FloatSolde, OPERATEURS, Operateur, DemandeReapprovisionnement } from '@/types';
import { formatMontant, formatDate } from '@/lib/formatters';
import { clsx } from 'clsx';

// Mini sparkline SVG
function Sparkline({ valeurs, couleur = '#F5B800' }: { valeurs: number[]; couleur?: string }) {
  if (!valeurs || valeurs.length < 2) return null;
  const max = Math.max(...valeurs);
  const min = Math.min(...valeurs);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const pts = valeurs.map((v, i) => {
    const x = (i / (valeurs.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts.join(' ')} fill="none" stroke={couleur} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Point final */}
      <circle cx={w} cy={h - ((valeurs[valeurs.length - 1] - min) / range) * h} r="3" fill={couleur} />
    </svg>
  );
}

const STATUT_LABELS: Record<string, string> = {
  ok: 'Normal',
  alerte: 'Alerte',
  critique: 'Critique',
};

const DEMANDE_STATUT_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  approuve: 'Approuvé',
  rejete: 'Rejeté',
  complete: 'Complété',
};

export default function FloatPage() {
  const { data: soldes = [], isLoading } = useFloatSoldes();
  const { data: mouvements = [] } = useFloatMouvements();
  const { data: demandes = [] } = useDemandesReappro();
  const creerDemande = useCreerDemandeReappro();

  const [modalReappro, setModalReappro] = useState<FloatSolde | null>(null);
  const [montantReappro, setMontantReappro] = useState('');
  const [commentaireReappro, setCommentaireReappro] = useState('');
  const [succesReappro, setSuccesReappro] = useState('');
  const [erreurReappro, setErreurReappro] = useState('');

  const colonnesDemandes: Colonne<DemandeReapprovisionnement>[] = [
    { key: 'operateur', titre: 'Opérateur', rendu: (v) => <span>{OPERATEURS[v as Operateur]?.logo} {OPERATEURS[v as Operateur]?.label}</span> },
    { key: 'montant', titre: 'Montant', rendu: (v) => formatMontant(Number(v)), align: 'right' },
    { key: 'demandeurNom', titre: 'Demandé par' },
    { key: 'date', titre: 'Date', rendu: (v) => formatDate(String(v)) },
    {
      key: 'statut',
      titre: 'Statut',
      rendu: (v) => {
        const couleurMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
          en_attente: 'warning', approuve: 'info', rejete: 'danger', complete: 'success',
        };
        return <Badge couleur={couleurMap[String(v)] || 'neutral'} point>{DEMANDE_STATUT_LABELS[String(v)]}</Badge>;
      },
    },
  ];

  const nbAlertes = soldes.filter((s) => s.statut !== 'ok').length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Gestion du Float</h1>
          <p className="text-sm text-gray-500">Soldes par opérateur et mouvements en temps réel</p>
        </div>
        <div className="flex gap-2">
          {nbAlertes > 0 && (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2">
              <AlertTriangle size={15} className="text-warning" />
              <span className="text-sm font-medium text-yellow-700">{nbAlertes} alerte(s)</span>
            </div>
          )}
          <Button variante="ghost" taille="sm" icone={<RefreshCw size={15} />}>Actualiser</Button>
        </div>
      </div>

      {/* Cards par opérateur */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-card shadow-card p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-8 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))
          : soldes.map((solde) => {
              const op = OPERATEURS[solde.operateur];
              const pct = Math.round((solde.soldeActuel / solde.seuilAlerte) * 100);
              const couleurStatut = solde.statut === 'critique' ? '#EF4444' : solde.statut === 'alerte' ? '#F59E0B' : '#22C55E';
              return (
                <div
                  key={solde.id}
                  className={clsx(
                    'bg-white rounded-card shadow-card p-5 flex flex-col gap-3',
                    solde.statut === 'critique' && 'ring-2 ring-danger/30',
                    solde.statut === 'alerte' && 'ring-2 ring-warning/30'
                  )}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{op?.logo}</span>
                      <div>
                        <p className="text-xs font-semibold text-text-main">{op?.label}</p>
                        <Badge couleur={badgeStatutFloat(solde.statut)} point>
                          {STATUT_LABELS[solde.statut]}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Solde */}
                  <div>
                    <p className="text-xs text-gray-500">Solde actuel</p>
                    <p className={clsx('text-lg font-bold', {
                      'text-danger': solde.statut === 'critique',
                      'text-warning': solde.statut === 'alerte',
                      'text-success': solde.statut === 'ok',
                    })}>
                      {formatMontant(solde.soldeActuel)}
                    </p>
                    <p className="text-xs text-gray-400">Seuil : {formatMontant(solde.seuilAlerte)}</p>
                  </div>

                  {/* Barre de niveau */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Niveau</span>
                      <span>{Math.min(pct, 999)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: couleurStatut,
                        }}
                      />
                    </div>
                  </div>

                  {/* Sparkline évolution 7j */}
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Évolution 7 jours</p>
                    <Sparkline valeurs={solde.evolution} couleur={couleurStatut} />
                  </div>

                  {/* Action */}
                  <Button
                    taille="sm"
                    variante={solde.statut !== 'ok' ? 'primary' : 'outline'}
                    icone={<Plus size={13} />}
                    fullWidth
                    onClick={() => setModalReappro(solde)}
                  >
                    Réapprovisionner
                  </Button>
                </div>
              );
            })}
      </div>

      {/* Mouvements du jour */}
      <Card>
        <CardHeader>
          <CardTitle>Mouvements du jour</CardTitle>
        </CardHeader>
        <div className="space-y-2">
          {mouvements.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center text-sm',
                  m.type === 'entree' ? 'bg-green-100 text-success' : 'bg-red-100 text-danger'
                )}>
                  {m.type === 'entree' ? '↑' : '↓'}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-main">{m.description}</p>
                  <p className="text-xs text-gray-400">{OPERATEURS[m.operateur]?.label} • {formatDate(m.date)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={clsx('text-sm font-bold', m.type === 'entree' ? 'text-success' : 'text-danger')}>
                  {m.type === 'entree' ? '+' : '-'}{formatMontant(m.montant)}
                </p>
                <p className="text-xs text-gray-400">Solde : {formatMontant(m.soldeApres)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Demandes de réapprovisionnement */}
      <Card>
        <CardHeader>
          <CardTitle>Demandes de réapprovisionnement</CardTitle>
          <Button taille="sm" variante="primary" icone={<Plus size={14} />} onClick={() => setModalReappro(null)}>
            Nouvelle demande
          </Button>
        </CardHeader>
        <Table
          colonnes={colonnesDemandes}
          donnees={demandes}
          messageVide="Aucune demande en cours"
        />
      </Card>

      {/* Modal réapprovisionnement */}
      <Modal
        ouvert={!!modalReappro}
        onFermer={() => { setModalReappro(null); setMontantReappro(''); setCommentaireReappro(''); setErreurReappro(''); setSuccesReappro(''); }}
        titre={`Réapprovisionner — ${modalReappro ? OPERATEURS[modalReappro.operateur]?.label : ''}`}
        taille="sm"
      >
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setErreurReappro('');
            const montant = Number(montantReappro);
            if (!montant || montant <= 0) { setErreurReappro('Montant invalide.'); return; }
            try {
              await creerDemande.mutateAsync({
                operateur: modalReappro?.operateur,
                montant,
                commentaire: commentaireReappro || undefined,
              });
              setSuccesReappro('Demande soumise avec succès.');
              setMontantReappro('');
              setCommentaireReappro('');
              setTimeout(() => { setModalReappro(null); setSuccesReappro(''); }, 1500);
            } catch {
              setErreurReappro('Erreur lors de la soumission.');
            }
          }}
        >
          {modalReappro && (
            <div className="bg-surface rounded-xl p-3 text-sm">
              <p className="text-gray-500">Solde actuel : <span className="font-bold text-text-main">{formatMontant(modalReappro.soldeActuel)}</span></p>
              <p className="text-gray-500">Seuil d&apos;alerte : <span className="font-medium">{formatMontant(modalReappro.seuilAlerte)}</span></p>
            </div>
          )}
          <Input
            label="Montant du réapprovisionnement (FCFA)"
            type="number"
            placeholder="Ex: 5 000 000"
            value={montantReappro}
            onChange={(e) => setMontantReappro(e.target.value)}
            required
          />
          <Input
            label="Commentaire (optionnel)"
            placeholder="Motif du réapprovisionnement"
            value={commentaireReappro}
            onChange={(e) => setCommentaireReappro(e.target.value)}
          />
          {erreurReappro && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{erreurReappro}</div>}
          {succesReappro && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">{succesReappro}</div>}
          <div className="flex gap-2 pt-1">
            <Button type="submit" variante="primary" fullWidth loading={creerDemande.isPending}>Soumettre la demande</Button>
            <Button type="button" variante="ghost" onClick={() => setModalReappro(null)}>Annuler</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
