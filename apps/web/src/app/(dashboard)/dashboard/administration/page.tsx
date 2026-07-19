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

function statutUtilisateur(statut: string): { pill: 'success' | 'pending' | 'failed'; label: string } {
  switch (statut.toUpperCase()) {
    case 'ACTIVE':
      return { pill: 'success', label: '● Actif' };
    case 'SUSPENDED':
      return { pill: 'failed', label: '● Suspendu' };
    case 'INACTIVE':
      return { pill: 'failed', label: '● Inactif' };
    case 'PENDING_VERIFICATION':
      return { pill: 'pending', label: '● En attente' };
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
  return (
    <div className="gm-section-block" id="utilisateurs">
      <GmSectionTitle>👥 Utilisateurs</GmSectionTitle>
      <GmTableWrap>
        {isLoading ? (
          <Etat>Chargement des utilisateurs…</Etat>
        ) : isError ? (
          <Etat>Impossible de charger les utilisateurs. Vérifiez vos droits ou réessayez.</Etat>
        ) : users.length === 0 ? (
          <Etat>Aucun utilisateur enregistré.</Etat>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Dernière connexion</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const st = statutUtilisateur(u.status);
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
                        <span style={{ color: 'var(--gm-text-2)' }}>Jamais connecté</span>
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
  return (
    <div className="gm-section-block" id="roles">
      <GmSectionTitle>🔐 Rôles &amp; permissions</GmSectionTitle>
      {isLoading ? (
        <Etat>Chargement des rôles…</Etat>
      ) : isError ? (
        <Etat>Impossible de charger les rôles.</Etat>
      ) : roles.length === 0 ? (
        <Etat>Aucun rôle configuré pour cette organisation.</Etat>
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
                    {role.nbUtilisateurs} utilisateur{role.nbUtilisateurs > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              {role.permissions.length === 0 ? (
                <div className="gm-perm-item gm-off">
                  <span className="gm-perm-check">—</span> Aucune permission enregistrée
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
  return (
    <div className="gm-section-block" id="audit">
      <GmSectionTitle
        action={
          <GmButton variante="outline" petit onClick={onExport} disabled={exportEnCours}>
            {exportEnCours ? 'Export en cours…' : '📥 Exporter CSV'}
          </GmButton>
        }
      >
        📋 Journal d&apos;audit récent
      </GmSectionTitle>
      {erreurExport && (
        <div style={{ fontSize: 12, color: 'var(--gm-danger)', marginBottom: 10 }}>{erreurExport}</div>
      )}
      <GmTableWrap>
        {isLoading ? (
          <Etat>Chargement du journal d&apos;audit…</Etat>
        ) : isError ? (
          <Etat>Impossible de charger le journal d&apos;audit.</Etat>
        ) : logs.length === 0 ? (
          <Etat>Aucune entrée dans le journal d&apos;audit.</Etat>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Ressource</th>
                <th>Utilisateur</th>
                <th>IP</th>
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
                    {l.userId ? `${l.userId.slice(0, 8)}…` : 'Système'}
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
      setErreurExport("L'export du journal d'audit a échoué. Réessayez.");
    } finally {
      setExportEnCours(false);
    }
  };

  if (!autorise) {
    return (
      <>
        <GmPageHeader
          titre="⚙️ Administration système"
          sousTitre="Accès restreint"
          fil={['Accueil', 'Administration']}
        />
        <div className="gm-section-block">
          <Etat>
            Cette page est réservée aux administrateurs. Contactez un administrateur de votre
            organisation si vous pensez qu&apos;il s&apos;agit d&apos;une erreur.
          </Etat>
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
        titre="⚙️ Administration système"
        sousTitre="Utilisateurs, rôles et supervision du journal d'audit"
        fil={['Accueil', 'Administration']}
        actions={
          <GmButton variante="outline" petit onClick={handleExport} disabled={exportEnCours}>
            📥 Exporter audit
          </GmButton>
        }
      />

      {/* STATS — uniquement des indicateurs adossés à une source réelle */}
      <div className="gm-stats-row">
        <div className="gm-stat-card gm-s1">
          <div className="gm-stat-value">{usersQ.isLoading ? '…' : usersQ.isError ? '—' : totalUsers}</div>
          <div className="gm-stat-label">Utilisateurs total</div>
          <div className="gm-stat-sub">
            {usersQ.isError ? 'Données indisponibles' : `${nbActifs} actifs · ${nbSuspendus} inactifs/suspendus`}
          </div>
        </div>
        <div className="gm-stat-card gm-s2">
          <div className="gm-stat-value">{rolesQ.isLoading ? '…' : rolesQ.isError ? '—' : (rolesQ.data?.length ?? 0)}</div>
          <div className="gm-stat-label">Rôles configurés</div>
          <div className="gm-stat-sub">
            {rolesQ.isError ? 'Données indisponibles' : 'Rôles du tenant'}
          </div>
        </div>
        <div className="gm-stat-card gm-s3">
          <div className="gm-stat-value">
            {statsQ.isLoading ? '…' : statsQ.isError ? '—' : (statsQ.data?.total ?? 0)}
          </div>
          <div className="gm-stat-label">Actions audit (24h)</div>
          <div className="gm-stat-sub">
            {statsQ.isError ? 'Données indisponibles' : `${statsQ.data?.byAction.length ?? 0} types d'action`}
          </div>
        </div>
        <div className="gm-stat-card gm-s4">
          <div className="gm-stat-value">
            {alertesQ.isLoading ? '…' : alertesQ.isError ? '—' : alertes.length}
          </div>
          <div className="gm-stat-label">Alertes audit</div>
          <div className="gm-stat-sub">
            {alertesQ.isError ? 'Données indisponibles' : 'Activité anormale (1h)'}
          </div>
        </div>
      </div>

      {/* ALERTES */}
      {alertes.length > 0 && (
        <div className="gm-section-block">
          <GmSectionTitle>🚨 Alertes de sécurité</GmSectionTitle>
          {alertes.map((a, i) => (
            <div className="gm-alert-banner" key={`${a.userId ?? 'n'}-${i}`}>
              <div className="gm-alert-icon">⚠️</div>
              <div className="gm-alert-text">
                <div className="gm-alert-title">{a.type}</div>
                <div className="gm-alert-desc">
                  {a.message} — sévérité {a.severity}
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
