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
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';

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

function libelleSeverite(severity: string, t: Translations): string {
  switch (severity.toUpperCase()) {
    case 'HIGH':
      return t.iaFraude.severite.high;
    case 'MEDIUM':
      return t.iaFraude.severite.medium;
    case 'LOW':
      return t.iaFraude.severite.low;
    default:
      return severity || '—';
  }
}

/** Libellés de type d'alerte pour la langue active. */
function libelleType(type: string, t: Translations): string {
  const libelles: Record<string, string> = t.iaFraude.types;
  return libelles[type] ?? type;
}

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
  const t = useT();
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
        fil={[t.common.home, t.iaFraude.breadcrumb]}
        titre={t.iaFraude.title}
        sousTitre={t.iaFraude.subtitle}
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
            {t.iaFraude.refresh}
          </GmButton>
        }
      />

      {/* ── STATUT DU MOTEUR IA (GET /ai/status) ───────────────────────────── */}
      <div className="gm-ai-header">
        <div className="gm-ai-badge">
          {iaEnLigne && <div className="gm-ai-badge-dot" />}
          {aiQ.isLoading
            ? t.iaFraude.ai.loading
            : aiQ.isError
              ? t.iaFraude.ai.unavailable
              : iaEnLigne
                ? t.iaFraude.ai.online
                : t.iaFraude.ai.offline}
        </div>
        <div className="gm-ai-header-text">
          <div className="gm-ai-header-title">{t.iaFraude.ai.title}</div>
          <div className="gm-ai-header-sub">
            {aiQ.data
              ? `${t.iaFraude.ai.providerPrefix} ${aiQ.data.activeProvider || '—'} · ${t.iaFraude.ai.modelPrefix} ${aiQ.data.model || '—'}`
              : t.iaFraude.ai.providersUnavailable}
          </div>
          <div className="gm-ai-header-sub" style={{ marginTop: 6 }}>
            {t.iaFraude.ai.noScoringNotice}
          </div>
        </div>
      </div>

      {/* ── INDICATEURS RÉELS (audit) ──────────────────────────────────────── */}
      <div className="gm-kpi-grid">
        <div className="gm-kpi-card">
          <div className="gm-kpi-icon">📋</div>
          <div className="gm-kpi-label">{t.iaFraude.kpi.auditedActions}</div>
          <div className="gm-kpi-value">
            {statsQ.isLoading ? '…' : statsQ.isError ? '—' : statsQ.data?.total.toLocaleString('fr-FR')}
          </div>
          <div className="gm-kpi-trend" style={{ color: 'var(--gm-text-2)' }}>
            {t.iaFraude.kpi.auditedActionsSub}
          </div>
        </div>

        <div className="gm-kpi-card">
          <div className="gm-kpi-icon">🚨</div>
          <div className="gm-kpi-label">{t.iaFraude.kpi.activeAlerts}</div>
          <div
            className="gm-kpi-value"
            style={{ color: alertes.length > 0 ? 'var(--gm-danger)' : undefined }}
          >
            {alertesQ.isLoading ? '…' : alertesQ.isError ? '—' : alertes.length}
          </div>
          <div className="gm-kpi-trend" style={{ color: 'var(--gm-text-2)' }}>
            {alertesQ.isError
              ? t.iaFraude.kpi.unavailable
              : nbHautes > 0
                ? `${t.iaFraude.kpi.highSeverityPrefix} ${nbHautes} ${t.iaFraude.kpi.highSeveritySuffix}`
                : t.iaFraude.kpi.noHighSeverity}
          </div>
        </div>

        <div className="gm-kpi-card">
          <div className="gm-kpi-icon">🔐</div>
          <div className="gm-kpi-label">{t.iaFraude.kpi.loginFailures}</div>
          <div
            className="gm-kpi-value"
            style={{ color: echecsConnexion > 0 ? 'var(--gm-warning)' : undefined }}
          >
            {securityQ.isLoading ? '…' : securityQ.isError ? '—' : echecsConnexion}
          </div>
          <div className="gm-kpi-trend" style={{ color: 'var(--gm-text-2)' }}>
            {t.iaFraude.kpi.loginFailuresSub}
          </div>
        </div>

        <div className="gm-kpi-card">
          <div className="gm-kpi-icon">⛔</div>
          <div className="gm-kpi-label">{t.iaFraude.kpi.lockedAccounts}</div>
          <div className="gm-kpi-value">
            {securityQ.isLoading ? '…' : securityQ.isError ? '—' : comptesBloques}
          </div>
          <div className="gm-kpi-trend" style={{ color: 'var(--gm-text-2)' }}>
            {t.iaFraude.kpi.lockedAccountsSub}
          </div>
        </div>
      </div>

      {/* ── ALERTES D'AUDIT RÉELLES (GET /audit/alerts) ────────────────────── */}
      <div className="gm-section-block">
        <GmSectionTitle>{t.iaFraude.alertes.title}</GmSectionTitle>
        <GmTableWrap>
          {alertesQ.isLoading ? (
            <EtatVide>{t.iaFraude.alertes.loading}</EtatVide>
          ) : alertesQ.isError ? (
            <EtatErreur>{t.iaFraude.alertes.error}</EtatErreur>
          ) : alertes.length === 0 ? (
            <EtatVide>{t.iaFraude.alertes.empty}</EtatVide>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t.iaFraude.alertes.colType}</th>
                  <th>{t.iaFraude.alertes.colUser}</th>
                  <th>{t.iaFraude.alertes.colCount}</th>
                  <th>{t.iaFraude.alertes.colPeriod}</th>
                  <th>{t.iaFraude.alertes.colSeverity}</th>
                  <th>{t.iaFraude.alertes.colDetail}</th>
                </tr>
              </thead>
              <tbody>
                {alertes.map((a, i) => (
                  <tr key={`${a.userId ?? 'anon'}-${a.type}-${i}`}>
                    <td style={{ fontWeight: 500 }}>{libelleType(a.type, t)}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{a.userId ?? '—'}</td>
                    <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {a.count.toLocaleString('fr-FR')}
                    </td>
                    <td style={{ color: 'var(--gm-text-2)' }}>{a.period}</td>
                    <td>
                      <span className={`gm-niveau-badge ${classeSeverite(a.severity)}`}>
                        {libelleSeverite(a.severity, t)}
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
          {t.iaFraude.alertes.disclaimer}
        </div>
      </div>

      {/* ── ÉVÉNEMENTS DE SÉCURITÉ (GET /audit/security) ───────────────────── */}
      <div className="gm-section-block">
        <GmSectionTitle>{t.iaFraude.security.title}</GmSectionTitle>
        <GmTableWrap>
          {securityQ.isLoading ? (
            <EtatVide>{t.iaFraude.security.loading}</EtatVide>
          ) : securityQ.isError ? (
            <EtatErreur>{t.iaFraude.security.error}</EtatErreur>
          ) : (securityQ.data?.events.length ?? 0) === 0 ? (
            <EtatVide>{t.iaFraude.security.empty}</EtatVide>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t.iaFraude.colonnes.date}</th>
                  <th>{t.iaFraude.colonnes.action}</th>
                  <th>{t.iaFraude.colonnes.user}</th>
                  <th>{t.iaFraude.colonnes.entity}</th>
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
        <GmSectionTitle>{t.iaFraude.financial.title}</GmSectionTitle>
        <GmTableWrap>
          {financialQ.isLoading ? (
            <EtatVide>{t.iaFraude.financial.loading}</EtatVide>
          ) : financialQ.isError ? (
            <EtatErreur>{t.iaFraude.financial.error}</EtatErreur>
          ) : (financialQ.data?.data.length ?? 0) === 0 ? (
            <EtatVide>{t.iaFraude.financial.empty}</EtatVide>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t.iaFraude.colonnes.date}</th>
                  <th>{t.iaFraude.colonnes.action}</th>
                  <th>{t.iaFraude.colonnes.user}</th>
                  <th>{t.iaFraude.colonnes.entity}</th>
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
