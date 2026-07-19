'use client';
// ============================================================
// PAGE IA & SURVEILLANCE — GESTMONEY
// ------------------------------------------------------------
// RÈGLE APPLIQUÉE : cette page ne montre QUE des données réelles
// issues du backend (contrôleurs `audit` et `ai`).
//
// Volontairement ABSENTS de la maquette, faute de source réelle :
//   • score de risque / probabilité de fraude par transaction
//   • niveau de fraude (CRITIQUE/ÉLEVÉ/…) inventé
//   • montants « à risque », taux de faux positifs
//   • prévisions de float, insights du « moteur », métriques de modèle
// Le backend n'expose aucun moteur de scoring de fraude : afficher ces
// blocs reviendrait à accuser à tort des agents réels ou à donner une
// fausse impression de sécurité.
// ============================================================
import React from 'react';
import { GmPageHeader, GmButton, GmSectionTitle, GmTableWrap } from '@/components/gm';
import { formatDateTime, formatRelativeTime } from '@/lib/formatters';
import {
  useAuditAlertes,
  useAuditStats,
  useAuditSecurity,
  useAuditFinancial,
  useAiStatus,
  type AuditAlerte,
} from '@/hooks/useAudit';

// Sévérité telle que renvoyée par le backend (HIGH / MEDIUM) — aucune
// interprétation supplémentaire, aucun score inventé.
function classeSeverite(severity: string): string {
  switch (severity.toUpperCase()) {
    case 'HIGH':
      return 'gm-niv-critique';
    case 'MEDIUM':
      return 'gm-niv-moyen';
    case 'LOW':
      return 'gm-niv-faible';
    default:
      return 'gm-niv-faible';
  }
}

function libelleSeverite(severity: string): string {
  switch (severity.toUpperCase()) {
    case 'HIGH':
      return '🔴 Élevée';
    case 'MEDIUM':
      return '🟡 Moyenne';
    case 'LOW':
      return '🟢 Faible';
    default:
      return severity || '—';
  }
}

const LIBELLES_TYPE: Record<string, string> = {
  EXCESSIVE_ACTIVITY: "Volume d'actions inhabituel",
};

function EtatVide({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: 13, color: 'var(--gm-text-2)' }}>
      {children}
    </div>
  );
}

function EtatErreur({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: 13, color: 'var(--gm-danger)' }}>
      {children}
    </div>
  );
}

export default function IaFraudePage() {
  const alertesQ = useAuditAlertes();
  const statsQ = useAuditStats(1);
  const securityQ = useAuditSecurity(7);
  const financialQ = useAuditFinancial(20);
  const aiQ = useAiStatus();

  const alertes: AuditAlerte[] = alertesQ.data ?? [];
  const nbHautes = alertes.filter((a) => a.severity.toUpperCase() === 'HIGH').length;

  const echecsConnexion =
    securityQ.data?.summary.find((s) => s.action === 'LOGIN_FAILED')?.count ?? 0;
  const comptesBloques =
    securityQ.data?.summary.find((s) => s.action === 'ACCOUNT_LOCKED')?.count ?? 0;

  const iaEnLigne = aiQ.data?.sara === 'online';

  return (
    <>
      <GmPageHeader
        fil={['Accueil', 'IA & Surveillance']}
        titre="🤖 IA & Surveillance"
        sousTitre="Alertes d'audit et événements de sécurité issus du journal réel — aucune donnée simulée"
        actions={
          <GmButton
            variante="outline"
            petit
            onClick={() => {
              alertesQ.refetch();
              statsQ.refetch();
              securityQ.refetch();
              financialQ.refetch();
            }}
          >
            🔄 Actualiser
          </GmButton>
        }
      />

      {/* ── STATUT DU MOTEUR IA (GET /ai/status) ───────────────────────────── */}
      <div className="gm-ai-header">
        <div className="gm-ai-badge">
          {iaEnLigne && <div className="gm-ai-badge-dot" />}
          {aiQ.isLoading
            ? 'Statut IA…'
            : aiQ.isError
              ? 'Statut IA indisponible'
              : iaEnLigne
                ? 'Assistant SARA actif'
                : 'Assistant SARA hors ligne'}
        </div>
        <div className="gm-ai-header-text">
          <div className="gm-ai-header-title">Assistant IA SARA</div>
          <div className="gm-ai-header-sub">
            {aiQ.data
              ? `Fournisseur actif : ${aiQ.data.activeProvider || '—'} · Modèle : ${aiQ.data.model || '—'}`
              : 'Statut des fournisseurs IA non disponible'}
          </div>
          <div className="gm-ai-header-sub" style={{ marginTop: 6 }}>
            ⓘ Aucun moteur de scoring de fraude n&apos;est configuré : cette page ne calcule ni score
            de risque ni probabilité de fraude. Elle relaie uniquement les alertes du journal
            d&apos;audit.
          </div>
        </div>
      </div>

      {/* ── INDICATEURS RÉELS (audit) ──────────────────────────────────────── */}
      <div className="gm-kpi-grid">
        <div className="gm-kpi-card">
          <div className="gm-kpi-icon">📋</div>
          <div className="gm-kpi-label">Actions auditées (24 h)</div>
          <div className="gm-kpi-value">
            {statsQ.isLoading ? '…' : statsQ.isError ? '—' : statsQ.data?.total.toLocaleString('fr-FR')}
          </div>
          <div className="gm-kpi-trend" style={{ color: 'var(--gm-text-2)' }}>
            Journal d&apos;audit · 24 dernières heures
          </div>
        </div>

        <div className="gm-kpi-card">
          <div className="gm-kpi-icon">🚨</div>
          <div className="gm-kpi-label">Alertes d&apos;audit actives</div>
          <div
            className="gm-kpi-value"
            style={{ color: alertes.length > 0 ? 'var(--gm-danger)' : undefined }}
          >
            {alertesQ.isLoading ? '…' : alertesQ.isError ? '—' : alertes.length}
          </div>
          <div className="gm-kpi-trend" style={{ color: 'var(--gm-text-2)' }}>
            {alertesQ.isError
              ? 'Indisponible'
              : nbHautes > 0
                ? `dont ${nbHautes} de sévérité élevée`
                : 'Aucune sévérité élevée'}
          </div>
        </div>

        <div className="gm-kpi-card">
          <div className="gm-kpi-icon">🔐</div>
          <div className="gm-kpi-label">Échecs de connexion (7 j)</div>
          <div
            className="gm-kpi-value"
            style={{ color: echecsConnexion > 0 ? 'var(--gm-warning)' : undefined }}
          >
            {securityQ.isLoading ? '…' : securityQ.isError ? '—' : echecsConnexion}
          </div>
          <div className="gm-kpi-trend" style={{ color: 'var(--gm-text-2)' }}>
            Événements LOGIN_FAILED audités
          </div>
        </div>

        <div className="gm-kpi-card">
          <div className="gm-kpi-icon">⛔</div>
          <div className="gm-kpi-label">Comptes verrouillés (7 j)</div>
          <div className="gm-kpi-value">
            {securityQ.isLoading ? '…' : securityQ.isError ? '—' : comptesBloques}
          </div>
          <div className="gm-kpi-trend" style={{ color: 'var(--gm-text-2)' }}>
            Événements ACCOUNT_LOCKED audités
          </div>
        </div>
      </div>

      {/* ── ALERTES D'AUDIT RÉELLES (GET /audit/alerts) ────────────────────── */}
      <div className="gm-section-block">
        <GmSectionTitle>🚨 Alertes d&apos;audit</GmSectionTitle>
        <GmTableWrap>
          {alertesQ.isLoading ? (
            <EtatVide>Chargement des alertes d&apos;audit…</EtatVide>
          ) : alertesQ.isError ? (
            <EtatErreur>
              Impossible de charger les alertes d&apos;audit. Aucune donnée n&apos;est affichée pour
              éviter toute interprétation erronée.
            </EtatErreur>
          ) : alertes.length === 0 ? (
            <EtatVide>
              Aucune alerte d&apos;audit sur la dernière heure. Aucune détection de fraude
              n&apos;est configurée sur ce système.
            </EtatVide>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Utilisateur</th>
                  <th>Nb d&apos;actions</th>
                  <th>Période</th>
                  <th>Sévérité</th>
                  <th>Détail</th>
                </tr>
              </thead>
              <tbody>
                {alertes.map((a, i) => (
                  <tr key={`${a.userId ?? 'anon'}-${a.type}-${i}`}>
                    <td style={{ fontWeight: 500 }}>{LIBELLES_TYPE[a.type] ?? a.type}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{a.userId ?? '—'}</td>
                    <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {a.count.toLocaleString('fr-FR')}
                    </td>
                    <td style={{ color: 'var(--gm-text-2)' }}>{a.period}</td>
                    <td>
                      <span className={`gm-niveau-badge ${classeSeverite(a.severity)}`}>
                        {libelleSeverite(a.severity)}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--gm-text-2)', whiteSpace: 'normal', maxWidth: 280 }}>
                      {a.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </GmTableWrap>
        <div style={{ fontSize: 12, color: 'var(--gm-text-2)', marginTop: -14, marginBottom: 24 }}>
          Ces alertes signalent un volume d&apos;activité inhabituel dans le journal d&apos;audit. Elles
          ne constituent pas une accusation de fraude et doivent être vérifiées manuellement.
        </div>
      </div>

      {/* ── ÉVÉNEMENTS DE SÉCURITÉ (GET /audit/security) ───────────────────── */}
      <div className="gm-section-block">
        <GmSectionTitle>🔐 Événements de sécurité — 7 derniers jours</GmSectionTitle>
        <GmTableWrap>
          {securityQ.isLoading ? (
            <EtatVide>Chargement des événements de sécurité…</EtatVide>
          ) : securityQ.isError ? (
            <EtatErreur>Impossible de charger les événements de sécurité.</EtatErreur>
          ) : (securityQ.data?.events.length ?? 0) === 0 ? (
            <EtatVide>Aucun événement de sécurité enregistré sur les 7 derniers jours.</EtatVide>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Action</th>
                  <th>Utilisateur</th>
                  <th>Entité</th>
                </tr>
              </thead>
              <tbody>
                {securityQ.data!.events.slice(0, 25).map((e) => (
                  <tr key={e.id}>
                    <td style={{ color: 'var(--gm-text-2)', fontSize: 12 }}>
                      {formatDateTime(e.createdAt)}
                    </td>
                    <td style={{ fontWeight: 600 }}>{e.action}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{e.userId ?? '—'}</td>
                    <td style={{ color: 'var(--gm-text-2)' }}>{e.entityType ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </GmTableWrap>
      </div>

      {/* ── MOUVEMENTS FINANCIERS AUDITÉS (GET /audit/financial) ───────────── */}
      <div className="gm-section-block">
        <GmSectionTitle>💰 Mouvements financiers audités</GmSectionTitle>
        <GmTableWrap>
          {financialQ.isLoading ? (
            <EtatVide>Chargement des mouvements financiers…</EtatVide>
          ) : financialQ.isError ? (
            <EtatErreur>Impossible de charger les mouvements financiers audités.</EtatErreur>
          ) : (financialQ.data?.data.length ?? 0) === 0 ? (
            <EtatVide>Aucun mouvement financier audité.</EtatVide>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Action</th>
                  <th>Utilisateur</th>
                  <th>Entité</th>
                </tr>
              </thead>
              <tbody>
                {financialQ.data!.data.map((e) => (
                  <tr key={e.id}>
                    <td style={{ color: 'var(--gm-text-2)', fontSize: 12 }}>
                      {formatRelativeTime(e.createdAt)}
                    </td>
                    <td style={{ fontWeight: 600 }}>{e.action}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{e.userId ?? '—'}</td>
                    <td style={{ color: 'var(--gm-text-2)' }}>{e.entityType ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </GmTableWrap>
      </div>
    </>
  );
}
