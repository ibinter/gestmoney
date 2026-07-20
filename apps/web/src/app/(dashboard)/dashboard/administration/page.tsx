'use client';
// ============================================================
// PAGE ADMINISTRATION — GESTMONEY
// Reproduit /mockup/administration.html avec les classes `gm-*`.
//
// IMPORTANT : seules les données réellement exposées par l'API sont
// affichées. Les blocs de la maquette sans source réelle (santé système,
// latences, ressources serveur, opérateurs configurés, « connectés
// maintenant ») sont volontairement OMIS : afficher de fausses métriques
// techniques induirait un administrateur en erreur.
// ============================================================
import React, { useState } from 'react';
import { GmPageHeader, GmButton, GmSectionTitle, GmTableWrap, GmStatusPill } from '@/components/gm';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime, formatRelativeTime } from '@/lib/formatters';
import {
  useAdminUsers,
  useAdminRoles,
  useAdminAuditLogs,
  useAdminAuditStats,
  useAdminAuditAlerts,
  telechargerExportAudit,
  type AdminUser,
  type AdminRole,
  type AdminAuditLog,
} from '@/hooks/useAdministration';
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';

// ─── Contrôle d'accès ────────────────────────────────────────────────────────
// Aligné sur les rôles autorisés côté API (users.controller / roles.controller).
const ROLES_ADMIN = ['super_admin', 'admin', 'network_admin', 'agency_manager', 'superviseur'];

// ─── Aides d'affichage ───────────────────────────────────────────────────────

function initiales(u: AdminUser) {
  return `${(u.firstName[0] ?? '').toUpperCase()}${(u.lastName[0] ?? '').toUpperCase()}` || '?';
}

/** Classe de badge de rôle présente dans mockup-system.css. */
function classeBadgeRole(nom: string): string {
  const n = nom.toUpperCase();
  if (n.includes('SUPER')) return 'gm-badge-super';
  if (n.includes('NETWORK')) return 'gm-badge-net-admin';
  if (n.includes('MANAGER') || n.includes('SUPERVIS')) return 'gm-badge-mgr';
  if (n.includes('ACCOUNT') || n.includes('COMPTA')) return 'gm-badge-accountant';
  if (n.includes('AUDIT')) return 'gm-badge-auditor';
  return 'gm-badge-agent';
}

function statutUtilisateur(
  statut: string,
  t: Translations,
): { pill: 'success' | 'pending' | 'failed'; label: string } {
  switch (statut.toUpperCase()) {
    case 'ACTIVE':
      return { pill: 'success', label: t.administration.statuts.actif };
    case 'SUSPENDED':
      return { pill: 'failed', label: t.administration.statuts.suspendu };
    case 'INACTIVE':
      return { pill: 'failed', label: t.administration.statuts.inactif };
    case 'PENDING_VERIFICATION':
      return { pill: 'pending', label: t.administration.statuts.enAttente };
    default:
      return { pill: 'pending', label: statut };
  }
}

function Etat({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--gm-text-2)', fontSize: 13 }}>
      {children}
    </div>
  );
}

// ─── Sections ────────────────────────────────────────────────────────────────

function SectionUtilisateurs({
  users,
  isLoading,
  isError,
}: {
  users: AdminUser[];
  isLoading: boolean;
  isError: boolean;
}) {
  const t = useT();
  return (
    <div className="gm-section-block" id="utilisateurs">
      <GmSectionTitle>{t.administration.users.title}</GmSectionTitle>
      <GmTableWrap>
        {isLoading ? (
          <Etat>{t.administration.users.loading}</Etat>
        ) : isError ? (
          <Etat>{t.administration.users.error}</Etat>
        ) : users.length === 0 ? (
          <Etat>{t.administration.users.empty}</Etat>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t.administration.users.colUser}</th>
                <th>{t.administration.users.colRole}</th>
                <th>{t.administration.users.colLastLogin}</th>
                <th>{t.administration.users.colStatus}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const st = statutUtilisateur(u.status, t);
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="gm-avatar-cell">
                        <div className="gm-avatar">{initiales(u)}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {`${u.firstName} ${u.lastName}`.trim() || u.email}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--gm-text-2)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {u.roles.length === 0 ? (
                        <span style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>—</span>
                      ) : (
                        u.roles.map((r) => (
                          <span key={r} className={`gm-badge ${classeBadgeRole(r)}`}>
                            {r}
                          </span>
                        ))
                      )}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {u.lastLoginAt ? (
                        <span title={formatDateTime(u.lastLoginAt)}>
                          {formatRelativeTime(u.lastLoginAt)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--gm-text-2)' }}>{t.administration.users.neverConnected}</span>
                      )}
                    </td>
                    <td>
                      <GmStatusPill statut={st.pill}>{st.label}</GmStatusPill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </GmTableWrap>
    </div>
  );
}

function SectionRoles({
  roles,
  isLoading,
  isError,
}: {
  roles: AdminRole[];
  isLoading: boolean;
  isError: boolean;
}) {
  const t = useT();
  return (
    <div className="gm-section-block" id="roles">
      <GmSectionTitle>{t.administration.roles.title}</GmSectionTitle>
      {isLoading ? (
        <Etat>{t.administration.roles.loading}</Etat>
      ) : isError ? (
        <Etat>{t.administration.roles.error}</Etat>
      ) : roles.length === 0 ? (
        <Etat>{t.administration.roles.empty}</Etat>
      ) : (
        <div className="gm-roles-grid">
          {roles.map((role) => (
            <div className="gm-role-card" key={role.id}>
              <div className="gm-role-card-header">
                <div className="gm-role-icon">🔐</div>
                <div>
                  <div className="gm-role-name">
                    <span className={`gm-badge ${classeBadgeRole(role.name)}`}>{role.name}</span>
                  </div>
                  <div className="gm-role-count">
                    {role.nbUtilisateurs} {t.administration.roles.usersSuffix}
                  </div>
                </div>
              </div>
              {role.permissions.length === 0 ? (
                <div className="gm-perm-item gm-off">
                  <span className="gm-perm-check">—</span> {t.administration.roles.noPermission}
                </div>
              ) : (
                role.permissions.map((p) => (
                  <div className="gm-perm-item" key={p}>
                    <span className="gm-perm-check">✅</span> {p}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionAudit({
  logs,
  isLoading,
  isError,
  onExport,
  exportEnCours,
  erreurExport,
}: {
  logs: AdminAuditLog[];
  isLoading: boolean;
  isError: boolean;
  onExport: () => void;
  exportEnCours: boolean;
  erreurExport: string;
}) {
  const t = useT();
  return (
    <div className="gm-section-block" id="audit">
      <GmSectionTitle
        action={
          <GmButton variante="outline" petit onClick={onExport} disabled={exportEnCours}>
            {exportEnCours ? t.administration.exporting : t.administration.exportCsv}
          </GmButton>
        }
      >
        {t.administration.audit.title}
      </GmSectionTitle>
      {erreurExport && (
        <div style={{ fontSize: 12, color: 'var(--gm-danger)', marginBottom: 10 }}>{erreurExport}</div>
      )}
      <GmTableWrap>
        {isLoading ? (
          <Etat>{t.administration.audit.loading}</Etat>
        ) : isError ? (
          <Etat>{t.administration.audit.error}</Etat>
        ) : logs.length === 0 ? (
          <Etat>{t.administration.audit.empty}</Etat>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t.administration.audit.colDate}</th>
                <th>{t.administration.audit.colAction}</th>
                <th>{t.administration.audit.colResource}</th>
                <th>{t.administration.audit.colUser}</th>
                <th>{t.administration.audit.colIp}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{formatDateTime(l.createdAt)}</td>
                  <td style={{ fontWeight: 600, fontSize: 12 }}>{l.action}</td>
                  <td style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>
                    {l.entityType ?? '—'}
                    {l.entityId ? ` · ${l.entityId.slice(0, 8)}…` : ''}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>
                    {l.userId ? `${l.userId.slice(0, 8)}…` : t.administration.audit.system}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--gm-text-2)' }}>{l.ipAddress ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GmTableWrap>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdministrationPage() {
  const t = useT();
  const { user } = useAuthStore();
  const role = (user?.role ?? '').toLowerCase();
  const autorise = ROLES_ADMIN.includes(role);

  const [exportEnCours, setExportEnCours] = useState(false);
  const [erreurExport, setErreurExport] = useState('');

  const usersQ = useAdminUsers(1, 50);
  const rolesQ = useAdminRoles();
  const logsQ = useAdminAuditLogs(20);
  const statsQ = useAdminAuditStats(24);
  const alertesQ = useAdminAuditAlerts();

  const handleExport = async () => {
    setErreurExport('');
    setExportEnCours(true);
    try {
      await telechargerExportAudit('CSV');
    } catch {
      setErreurExport(t.administration.exportError);
    } finally {
      setExportEnCours(false);
    }
  };

  if (!autorise) {
    return (
      <>
        <GmPageHeader
          titre={t.administration.title}
          sousTitre={t.administration.restricted}
          fil={[t.common.home, t.administration.breadcrumb]}
        />
        <div className="gm-section-block">
          <Etat>{t.administration.restrictedMessage}</Etat>
        </div>
      </>
    );
  }

  const users = usersQ.data?.data ?? [];
  const totalUsers = usersQ.data?.total ?? users.length;
  const nbActifs = users.filter((u) => u.status.toUpperCase() === 'ACTIVE').length;
  const nbSuspendus = users.filter((u) =>
    ['SUSPENDED', 'INACTIVE'].includes(u.status.toUpperCase()),
  ).length;

  const alertes = alertesQ.data ?? [];

  return (
    <>
      <GmPageHeader
        titre={t.administration.title}
        sousTitre={t.administration.subtitle}
        fil={[t.common.home, t.administration.breadcrumb]}
        actions={
          <GmButton variante="outline" petit onClick={handleExport} disabled={exportEnCours}>
            {t.administration.exportAudit}
          </GmButton>
        }
      />

      {/* STATS — uniquement des indicateurs adossés à une source réelle */}
      <div className="gm-stats-row">
        <div className="gm-stat-card gm-s1">
          <div className="gm-stat-value">{usersQ.isLoading ? '…' : usersQ.isError ? '—' : totalUsers}</div>
          <div className="gm-stat-label">{t.administration.stats.totalUsers}</div>
          <div className="gm-stat-sub">
            {usersQ.isError
              ? t.administration.stats.unavailable
              : `${nbActifs} ${t.administration.stats.activeSuffix} · ${nbSuspendus} ${t.administration.stats.inactiveSuffix}`}
          </div>
        </div>
        <div className="gm-stat-card gm-s2">
          <div className="gm-stat-value">{rolesQ.isLoading ? '…' : rolesQ.isError ? '—' : (rolesQ.data?.length ?? 0)}</div>
          <div className="gm-stat-label">{t.administration.stats.roles}</div>
          <div className="gm-stat-sub">
            {rolesQ.isError ? t.administration.stats.unavailable : t.administration.stats.tenantRoles}
          </div>
        </div>
        <div className="gm-stat-card gm-s3">
          <div className="gm-stat-value">
            {statsQ.isLoading ? '…' : statsQ.isError ? '—' : (statsQ.data?.total ?? 0)}
          </div>
          <div className="gm-stat-label">{t.administration.stats.auditActions}</div>
          <div className="gm-stat-sub">
            {statsQ.isError
              ? t.administration.stats.unavailable
              : `${statsQ.data?.byAction.length ?? 0} ${t.administration.stats.actionTypesSuffix}`}
          </div>
        </div>
        <div className="gm-stat-card gm-s4">
          <div className="gm-stat-value">
            {alertesQ.isLoading ? '…' : alertesQ.isError ? '—' : alertes.length}
          </div>
          <div className="gm-stat-label">{t.administration.stats.auditAlerts}</div>
          <div className="gm-stat-sub">
            {alertesQ.isError
              ? t.administration.stats.unavailable
              : t.administration.stats.abnormalActivity}
          </div>
        </div>
      </div>

      {/* ALERTES */}
      {alertes.length > 0 && (
        <div className="gm-section-block">
          <GmSectionTitle>{t.administration.alertes.title}</GmSectionTitle>
          {alertes.map((a, i) => (
            <div className="gm-alert-banner" key={`${a.userId ?? 'n'}-${i}`}>
              <div className="gm-alert-icon">⚠️</div>
              <div className="gm-alert-text">
                <div className="gm-alert-title">{a.type}</div>
                <div className="gm-alert-desc">
                  {a.message} — {t.administration.alertes.severityPrefix} {a.severity}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SectionUtilisateurs users={users} isLoading={usersQ.isLoading} isError={usersQ.isError} />

      <SectionRoles
        roles={rolesQ.data ?? []}
        isLoading={rolesQ.isLoading}
        isError={rolesQ.isError}
      />

      <SectionAudit
        logs={logsQ.data ?? []}
        isLoading={logsQ.isLoading}
        isError={logsQ.isError}
        onExport={handleExport}
        exportEnCours={exportEnCours}
        erreurExport={erreurExport}
      />
    </>
  );
}
