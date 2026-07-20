'use client';
// ============================================================
// PAGE FLOAT OPÉRATEURS — GESTMONEY
// Présentation calquée sur mockup/float.html (classes gm-*).
// Logique métier (hooks API, seuils, statuts, mutation) préservée.
// ============================================================
import React, { useState } from 'react';
import { GmPageHeader, GmButton, GmTableWrap } from '@/components/gm';
import {
  useFloatSoldes,
  useFloatMouvements,
  useDemandesReappro,
  useCreerDemandeReappro,
} from '@/hooks/useFloat';
import { FloatSolde, OPERATEURS, Operateur, MouvementFloat } from '@/types';
import { formatMontant, formatDateTime } from '@/lib/formatters';
import { clsx } from 'clsx';
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';

// ─── Libellés ────────────────────────────────────────────────────────────────

const statutBadge = (t: Translations): Record<FloatSolde['statut'], { classe: string; label: string }> => ({
  ok: { classe: 'gm-badge-ok', label: `✓ ${t.float.badges.ok}` },
  alerte: { classe: 'gm-badge-warn', label: `⚡ ${t.float.badges.faible}` },
  critique: { classe: 'gm-badge-crit', label: `⚠ ${t.float.badges.critique}` },
});

const demandePill = (t: Translations): Record<string, { classe: string; label: string }> => ({
  en_attente: { classe: 'gm-pill-pend', label: `⏳ ${t.float.demandeStatuts.en_attente}` },
  approuve: { classe: 'gm-pill-proc', label: `↻ ${t.float.demandeStatuts.approuve}` },
  complete: { classe: 'gm-pill-done', label: `✓ ${t.float.demandeStatuts.complete}` },
  rejete: { classe: 'gm-pill-failed', label: `✕ ${t.float.demandeStatuts.rejete}` },
});

/** Initiales affichées dans la pastille opérateur. */
function initiales(label: string): string {
  const mots = label.trim().split(/\s+/);
  return mots.length > 1 ? mots[0].slice(0, 1) + mots[1].slice(0, 1) : label.slice(0, 2);
}

function heure(date: string, locale: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

/** Couleur de la jauge selon le statut calculé côté données. */
function couleurStatut(statut: FloatSolde['statut'], couleurOp: string): string {
  if (statut === 'critique') return 'var(--gm-danger)';
  if (statut === 'alerte') return 'var(--gm-warning)';
  return couleurOp;
}

export default function FloatPage() {
  const t = useT();
  const STATUT_BADGE = statutBadge(t);
  const DEMANDE_PILL = demandePill(t);
  const { data: soldes = [], isLoading } = useFloatSoldes();
  const { data: mouvements = [] } = useFloatMouvements();
  const { data: demandes = [] } = useDemandesReappro();
  const creerDemande = useCreerDemandeReappro();

  // Sélection visuelle d'une carte opérateur
  const [soldeSelectionne, setSoldeSelectionne] = useState<string | null>(null);
  // Alerte critique masquable
  const [alerteMasquee, setAlerteMasquee] = useState(false);

  // Modal de réapprovisionnement
  const [modalOuvert, setModalOuvert] = useState(false);
  const [soldeCible, setSoldeCible] = useState<FloatSolde | null>(null);
  const [operateurChoisi, setOperateurChoisi] = useState<Operateur | ''>('');
  const [montantReappro, setMontantReappro] = useState('');
  const [commentaireReappro, setCommentaireReappro] = useState('');
  const [succesReappro, setSuccesReappro] = useState('');
  const [erreurReappro, setErreurReappro] = useState('');

  function ouvrirModal(solde?: FloatSolde) {
    setSoldeCible(solde ?? null);
    setOperateurChoisi(solde ? solde.operateur : soldes[0]?.operateur ?? '');
    setErreurReappro('');
    setSuccesReappro('');
    setModalOuvert(true);
  }

  function fermerModal() {
    setModalOuvert(false);
    setSoldeCible(null);
    setMontantReappro('');
    setCommentaireReappro('');
    setErreurReappro('');
    setSuccesReappro('');
  }

  // Premier solde en niveau critique → bandeau d'alerte
  const critique = soldes.find((s) => s.statut === 'critique');
  const nbEnAttente = demandes.filter((d) => d.statut === 'en_attente').length;
  const derniereMaj = soldes.reduce<string | null>(
    (acc, s) => (!acc || new Date(s.derniereMaj) > new Date(acc) ? s.derniereMaj : acc),
    null,
  );

  return (
    <>
      <GmPageHeader
        fil={[`🏠 ${t.common.home}`, t.float.pageTitle]}
        titre={`🏦 ${t.float.pageTitle}`}
        sousTitre={
          derniereMaj
            ? `${t.float.liveLevels} — ${t.float.updatedOn} ${formatDateTime(derniereMaj)}`
            : t.float.liveLevels
        }
        actions={
          <GmButton variante="primary" petit onClick={() => ouvrirModal()}>
            {t.float.newRefill}
          </GmButton>
        }
      />

      {/* ─── Bandeau d'alerte critique ─────────────────────────────────── */}
      {critique && !alerteMasquee && (
        <div className="gm-alert-banner">
          <div className="gm-alert-icon">🚨</div>
          <div className="gm-alert-content">
            <div className="gm-alert-title">
              Float {OPERATEURS[critique.operateur]?.label ?? critique.operateur} — {t.float.banner.criticalLevel}
            </div>
            <div className="gm-alert-desc">
              {t.float.banner.currentBalance} <strong>{formatMontant(critique.soldeActuel)}</strong> — {t.float.banner.minThreshold}{' '}
              {formatMontant(critique.seuilAlerte)}. {t.float.banner.riskMessage}
            </div>
          </div>
          <div className="gm-alert-actions">
            <button className="gm-btn-danger-solid" onClick={() => ouvrirModal(critique)}>
              {t.float.refill}
            </button>
            <GmButton variante="outline" petit onClick={() => setAlerteMasquee(true)}>
              {t.float.banner.ignore}
            </GmButton>
          </div>
        </div>
      )}

      {/* ─── Cartes opérateurs ─────────────────────────────────────────── */}
      <div className="gm-op-grid">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="gm-op-card gm-ok-card" style={{ cursor: 'default' }}>
                <div className="gm-op-header">
                  <div className="gm-op-brand">
                    <div className="gm-op-logo-circle" style={{ background: 'var(--gm-border)' }} />
                    <div>
                      <div className="gm-op-name">{t.common.loading}</div>
                    </div>
                  </div>
                </div>
                <div className="gm-gauge-wrap">
                  <div className="gm-gauge-track">
                    <div className="gm-gauge-fill" style={{ width: '0%' }} />
                  </div>
                </div>
                <div className="gm-op-amount">—</div>
              </div>
            ))
          : soldes.map((solde) => {
              const op = OPERATEURS[solde.operateur];
              const label = op?.label ?? solde.operateur;
              const couleurOp = op?.couleur ?? 'var(--gm-primary)';
              // Logique conservée : niveau = solde / seuil d'alerte
              const pct = solde.seuilAlerte
                ? Math.round((solde.soldeActuel / solde.seuilAlerte) * 100)
                : 0;
              const couleur = couleurStatut(solde.statut, couleurOp);
              const badge = STATUT_BADGE[solde.statut];
              const estCritique = solde.statut === 'critique';

              return (
                <div
                  key={solde.id}
                  className={clsx(
                    'gm-op-card',
                    estCritique && 'gm-critical',
                    solde.statut === 'alerte' && 'gm-warning-card',
                    solde.statut === 'ok' && 'gm-ok-card',
                    soldeSelectionne === solde.id && 'gm-selected-op',
                  )}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSoldeSelectionne(solde.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSoldeSelectionne(solde.id);
                    }
                  }}
                >
                  <div className="gm-op-header">
                    <div className="gm-op-brand">
                      <div
                        className="gm-op-logo-circle"
                        style={{
                          background: couleurOp,
                          color: solde.operateur === 'mtn_momo' ? 'var(--gm-dark)' : '#fff',
                        }}
                      >
                        {initiales(label)}
                      </div>
                      <div>
                        <div className="gm-op-name">{label}</div>
                      </div>
                    </div>
                    <span className={clsx('gm-op-status-badge', badge.classe)}>{badge.label}</span>
                  </div>

                  <div className="gm-gauge-wrap">
                    <div className="gm-gauge-track">
                      <div
                        className="gm-gauge-fill"
                        style={{
                          width: `${Math.min(Math.max(pct, 0), 100)}%`,
                          background: couleur,
                        }}
                      />
                    </div>
                    <div className="gm-gauge-labels">
                      <span>0</span>
                      <span
                        style={
                          solde.statut === 'ok'
                            ? undefined
                            : { color: couleur, fontWeight: 600 }
                        }
                      >
                        {Math.min(pct, 999)}%
                      </span>
                      <span>{solde.seuilAlerte ? formatMontant(solde.seuilAlerte) : '—'}</span>
                    </div>
                  </div>

                  <div className={clsx('gm-op-amount', estCritique && 'gm-critical-amount')}>
                    {formatMontant(solde.soldeActuel)}
                  </div>
                  <div
                    className="gm-op-threshold"
                    style={solde.statut === 'ok' ? undefined : { color: couleur }}
                  >
                    {t.float.card.minThreshold} {solde.seuilAlerte ? formatMontant(solde.seuilAlerte) : '—'} ·{' '}
                    {estCritique ? (
                      <strong>{t.float.card.insufficient}</strong>
                    ) : solde.statut === 'alerte' ? (
                      t.float.card.watch
                    ) : (
                      t.float.card.marginOk
                    )}
                  </div>

                  <button
                    className={clsx('gm-op-action', estCritique && 'gm-action-crit')}
                    onClick={(e) => {
                      e.stopPropagation();
                      ouvrirModal(solde);
                    }}
                  >
                    {estCritique ? t.float.card.urgentRefill : t.float.card.refill}
                  </button>
                </div>
              );
            })}
      </div>

      {/* ─── Deux colonnes ─────────────────────────────────────────────── */}
      <div className="gm-two-col">
        {/* Mouvements */}
        <div className="gm-section-card">
          <div className="gm-section-head">
            <div>
              <div className="gm-section-title">{t.float.movements.title}</div>
              <div className="gm-section-sub">{t.float.movements.sub}</div>
            </div>
          </div>
          <GmTableWrap>
            <table>
              <thead>
                <tr>
                  <th>{t.float.movements.colHour}</th>
                  <th>{t.float.movements.colOperator}</th>
                  <th>{t.float.movements.colType}</th>
                  <th>{t.float.movements.colDescription}</th>
                  <th>{t.float.movements.colAmount}</th>
                  <th>{t.float.movements.colAgent}</th>
                  <th>{t.float.movements.colBalanceAfter}</th>
                </tr>
              </thead>
              <tbody>
                {mouvements.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--gm-text-2)' }}>
                      {t.float.movements.empty}
                    </td>
                  </tr>
                ) : (
                  mouvements.map((m: MouvementFloat) => {
                    const op = OPERATEURS[m.operateur];
                    const entree = m.type === 'entree';
                    return (
                      <tr key={m.id}>
                        <td style={{ color: 'var(--gm-text-2)', fontSize: 12 }}>{heure(m.date, t.dateLocale)}</td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            <span
                              className="gm-op-dot"
                              style={{ background: op?.couleur ?? 'var(--gm-border)' }}
                            />
                            {op?.label ?? m.operateur}
                          </span>
                        </td>
                        <td>
                          <span className={clsx('gm-badge', entree ? 'gm-badge-in' : 'gm-badge-out')}>
                            {entree ? t.float.movements.in : t.float.movements.out}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.description || '—'}
                        </td>
                        <td className={entree ? 'gm-amount-pos' : 'gm-amount-neg'}>
                          {entree ? '+' : '-'}
                          {formatMontant(m.montant)}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>{m.agentId || '—'}</td>
                        <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                          {formatMontant(m.soldeApres)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </GmTableWrap>
        </div>

        {/* Colonne droite */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Demandes en cours */}
          <div className="gm-section-card">
            <div className="gm-section-head">
              <div>
                <div className="gm-section-title">{t.float.requests.title}</div>
                <div className="gm-section-sub">{t.float.requests.sub}</div>
              </div>
              {nbEnAttente > 0 && (
                <span
                  style={{
                    background: 'rgba(245,184,0,0.15)',
                    color: 'var(--gm-primary-dark)',
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {nbEnAttente} {t.float.requests.pendingSuffix}
                </span>
              )}
            </div>
            <div className="gm-reapp-list">
              {demandes.length === 0 ? (
                <div
                  style={{ padding: '18px', fontSize: 12, color: 'var(--gm-text-2)', textAlign: 'center' }}
                >
                  {t.float.requests.empty}
                </div>
              ) : (
                demandes.map((d) => {
                  const op = OPERATEURS[d.operateur];
                  const pill = DEMANDE_PILL[d.statut] ?? { classe: 'gm-pill-pend', label: d.statut };
                  return (
                    <div key={d.id} className="gm-reapp-item">
                      <div className="gm-reapp-top">
                        <div className="gm-reapp-op">
                          <span
                            className="gm-reapp-dot"
                            style={{ background: op?.couleur ?? 'var(--gm-border)' }}
                          />
                          {op?.label ?? d.operateur}
                        </div>
                        <span className={clsx('gm-status-pill', pill.classe)}>{pill.label}</span>
                      </div>
                      <div
                        className="gm-reapp-amount"
                        style={d.statut === 'en_attente' ? { color: 'var(--gm-danger)' } : undefined}
                      >
                        {formatMontant(d.montant)}
                      </div>
                      <div className="gm-reapp-meta">
                        <span>📅 {d.date ? formatDateTime(d.date) : '—'}</span>
                        {d.demandeurNom && <span>👤 {d.demandeurNom}</span>}
                      </div>
                      {d.commentaire && (
                        <div className="gm-reapp-meta" style={{ marginTop: 4 }}>
                          <span>💬 {d.commentaire}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Seuils d'alerte (lecture seule — issus des données float) */}
          <div className="gm-section-card">
            <div className="gm-section-head">
              <div>
                <div className="gm-section-title">{t.float.thresholds.title}</div>
                <div className="gm-section-sub">{t.float.thresholds.sub}</div>
              </div>
            </div>
            <div>
              {soldes.length === 0 ? (
                <div
                  style={{ padding: '18px', fontSize: 12, color: 'var(--gm-text-2)', textAlign: 'center' }}
                >
                  —
                </div>
              ) : (
                soldes.map((s) => (
                  <div key={s.id} className="gm-threshold-row">
                    <div className="gm-threshold-op">
                      <span
                        className="gm-op-color-dot"
                        style={{ background: OPERATEURS[s.operateur]?.couleur ?? 'var(--gm-border)' }}
                      />
                      {OPERATEURS[s.operateur]?.label ?? s.operateur}
                    </div>
                    <input
                      className="gm-threshold-input"
                      type="number"
                      value={s.seuilAlerte}
                      readOnly
                      aria-label={`${t.float.thresholds.ariaPrefix} ${OPERATEURS[s.operateur]?.label ?? s.operateur}`}
                    />
                    <span className="gm-threshold-unit">XOF</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Modal réapprovisionnement ─────────────────────────────────── */}
      <div
        className={clsx('gm-modal-overlay', modalOuvert && 'gm-open')}
        onClick={(e) => {
          if (e.target === e.currentTarget) fermerModal();
        }}
      >
        <div className="gm-modal">
          <div className="gm-modal-head">
            <div className="gm-modal-title">{t.float.modal.title}</div>
            <button className="gm-modal-close" type="button" onClick={fermerModal} aria-label={t.common.close}>
              ✕
            </button>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setErreurReappro('');
              const montant = Number(montantReappro);
              if (!montant || montant <= 0) {
                setErreurReappro(t.common.invalidAmount);
                return;
              }
              if (!operateurChoisi) {
                setErreurReappro(t.float.modal.operatorRequired);
                return;
              }
              try {
                await creerDemande.mutateAsync({
                  operateur: operateurChoisi,
                  montant,
                  commentaire: commentaireReappro || undefined,
                });
                setSuccesReappro(t.float.modal.success);
                setMontantReappro('');
                setCommentaireReappro('');
                setTimeout(() => fermerModal(), 1500);
              } catch {
                setErreurReappro(t.float.modal.submitError);
              }
            }}
          >
            <div className="gm-modal-body">
              {soldeCible && (
                <div className="gm-modal-summary-row">
                  <span>{t.float.modal.currentBalance}</span>
                  <strong>{formatMontant(soldeCible.soldeActuel)}</strong>
                </div>
              )}
              {soldeCible && (
                <div className="gm-modal-summary-row">
                  <span>{t.float.modal.alertThreshold}</span>
                  <strong>{formatMontant(soldeCible.seuilAlerte)}</strong>
                </div>
              )}

              <div className="gm-form-group">
                <label className="gm-form-label" htmlFor="modal-op">
                  {t.float.modal.operator}
                </label>
                <select
                  id="modal-op"
                  value={operateurChoisi}
                  onChange={(e) => {
                    const val = e.target.value as Operateur;
                    setOperateurChoisi(val);
                    setSoldeCible(soldes.find((s) => s.operateur === val) ?? null);
                  }}
                  required
                >
                  <option value="">—</option>
                  {soldes.map((s) => (
                    <option key={s.id} value={s.operateur}>
                      {OPERATEURS[s.operateur]?.label ?? s.operateur}
                    </option>
                  ))}
                </select>
              </div>

              <div className="gm-form-group">
                <label className="gm-form-label" htmlFor="modal-amount">
                  {t.float.modal.amountLabel}
                </label>
                <input
                  id="modal-amount"
                  type="number"
                  min={1}
                  placeholder={t.float.modal.amountPlaceholder}
                  value={montantReappro}
                  onChange={(e) => setMontantReappro(e.target.value)}
                  required
                />
              </div>

              <div className="gm-form-group">
                <label className="gm-form-label" htmlFor="modal-comment">
                  {t.common.comment}
                </label>
                <textarea
                  id="modal-comment"
                  rows={2}
                  placeholder={t.float.modal.commentPlaceholder}
                  style={{ resize: 'vertical' }}
                  value={commentaireReappro}
                  onChange={(e) => setCommentaireReappro(e.target.value)}
                />
              </div>

              {erreurReappro && (
                <div className="gm-alert-desc" style={{ color: 'var(--gm-danger)' }}>
                  {erreurReappro}
                </div>
              )}
              {succesReappro && (
                <div className="gm-alert-desc" style={{ color: 'var(--gm-success)' }}>
                  {succesReappro}
                </div>
              )}
            </div>
            <div className="gm-modal-foot">
              <GmButton type="button" variante="outline" onClick={fermerModal}>
                {t.common.cancel}
              </GmButton>
              <GmButton type="submit" variante="primary" disabled={creerDemande.isPending}>
                {creerDemande.isPending ? t.common.sending : t.float.modal.submit}
              </GmButton>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
