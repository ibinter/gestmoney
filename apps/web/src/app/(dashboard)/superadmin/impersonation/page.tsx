'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  status: string;
  roles?: string[];
}

interface ImpersonationSession {
  id: string;
  targetUserId: string;
  targetTenantId: string;
  raison: string;
  createdAt: string;
  targetUser: { firstName: string; lastName: string; email: string } | null;
}

export default function ImpersonationPage() {
  const router = useRouter();

  // ── Recherche d'utilisateurs ──
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // ── Dialog de confirmation ──
  const [selected, setSelected] = useState<User | null>(null);
  const [raison, setRaison] = useState('');
  const [raisonError, setRaisonError] = useState('');
  const [starting, setStarting] = useState(false);
  const [apiError, setApiError] = useState('');

  // ── Sessions actives ──
  const [sessions, setSessions] = useState<ImpersonationSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Charger les sessions actives
  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await api.get('/auth/impersonate/sessions');
      setSessions(res.data ?? []);
    } catch {
      //
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Rechercher des utilisateurs
  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoadingUsers(true);
    setUsers([]);
    try {
      const res = await api.get(`/users?search=${encodeURIComponent(search)}&limit=20`);
      const data = res.data;
      const filtered = (data.data ?? data).filter(
        (u: User) => !u.roles?.includes('SUPER_ADMIN'),
      );
      setUsers(filtered);
    } catch {
      //
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleConfirm = async () => {
    if (!selected) return;
    if (raison.trim().length < 10) {
      setRaisonError('La raison doit faire au moins 10 caractères');
      return;
    }
    setRaisonError('');
    setStarting(true);
    setApiError('');

    try {
      const res = await api.post('/auth/impersonate', { targetUserId: selected.id, raison: raison.trim() });
      const data = res.data;

      // Stocker les infos d'impersonation pour le bandeau
      localStorage.setItem(
        'gestmoney_impersonation',
        JSON.stringify({
          impersonatedBy: 'me',
          impersonationId: data.sessionId,
          targetName: `${selected.firstName} ${selected.lastName}`,
          targetEmail: selected.email,
        }),
      );

      // Stocker le token court pour les prochaines requêtes API
      // (le cookie httpOnly ne peut pas être remplacé ici — le backend devrait
      //  le poser via Set-Cookie. On stocke en sessionStorage en fallback.)
      if (data.token) {
        sessionStorage.setItem('gestmoney_impersonation_token', data.token);
      }

      // Fermer le dialog et recharger
      setSelected(null);
      setRaison('');
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setApiError(err?.response?.data?.message ?? 'Erreur réseau. Réessayez.');
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async (sessionId: string) => {
    try {
      await api.post(`/auth/impersonate/${sessionId}/stop`);
      await loadSessions();
    } catch {
      //
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
        Impersonation — Sessions support
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '32px', fontSize: '14px' }}>
        Prenez temporairement la session d'un utilisateur pour l'aider. Chaque action est
        tracée dans les journaux d'audit.
      </p>

      {/* ── Sessions actives ── */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
          Sessions actives
        </h2>
        {loadingSessions ? (
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Chargement…</p>
        ) : sessions.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Aucune session active.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={th}>Utilisateur</th>
                <th style={th}>Tenant</th>
                <th style={th}>Raison</th>
                <th style={th}>Démarré</th>
                <th style={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={td}>
                    {s.targetUser
                      ? `${s.targetUser.firstName} ${s.targetUser.lastName}`
                      : s.targetUserId}
                    <br />
                    <span style={{ color: '#6b7280', fontSize: '12px' }}>
                      {s.targetUser?.email}
                    </span>
                  </td>
                  <td style={td}>{s.targetTenantId}</td>
                  <td style={td}>{s.raison}</td>
                  <td style={td}>{new Date(s.createdAt).toLocaleString('fr-FR')}</td>
                  <td style={td}>
                    <button
                      onClick={() => handleStop(s.id)}
                      style={{
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 10px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Terminer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ── Nouvelle session ── */}
      <section>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
          Démarrer une nouvelle session
        </h2>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Rechercher par email, nom…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              flex: 1,
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '14px',
            }}
          />
          <button
            onClick={handleSearch}
            disabled={loadingUsers}
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 20px',
              cursor: loadingUsers ? 'wait' : 'pointer',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            {loadingUsers ? 'Recherche…' : 'Rechercher'}
          </button>
        </div>

        {users.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={th}>Nom</th>
                <th style={th}>Email</th>
                <th style={th}>Tenant</th>
                <th style={th}>Statut</th>
                <th style={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={td}>
                    {u.firstName} {u.lastName}
                  </td>
                  <td style={td}>{u.email}</td>
                  <td style={td}>{u.tenantId}</td>
                  <td style={td}>
                    <span
                      style={{
                        background: u.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                        color: u.status === 'ACTIVE' ? '#166534' : '#991b1b',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td style={td}>
                    <button
                      onClick={() => { setSelected(u); setApiError(''); setRaison(''); }}
                      style={{
                        background: '#f97316',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 10px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      Prendre la session
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ── Dialog de confirmation ── */}
      {selected && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '28px',
              width: '440px',
              maxWidth: '95vw',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
              Confirmer la session support
            </h3>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
              Vous allez prendre la session de{' '}
              <strong>
                {selected.firstName} {selected.lastName}
              </strong>{' '}
              ({selected.email}). Cette action est tracée dans les journaux d'audit.
            </p>

            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '14px' }}>
              Raison <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              placeholder="ex. Support ticket #123 — problème de connexion signalé par le client"
              value={raison}
              onChange={(e) => { setRaison(e.target.value); setRaisonError(''); }}
              rows={3}
              style={{
                width: '100%',
                border: `1px solid ${raisonError ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '14px',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
            {raisonError && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{raisonError}</p>
            )}

            {apiError && (
              <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px', background: '#fee2e2', padding: '8px', borderRadius: '6px' }}>
                {apiError}
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 18px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={starting}
                style={{
                  background: '#f97316',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 20px',
                  cursor: starting ? 'wait' : 'pointer',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                {starting ? 'Démarrage…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  fontWeight: 600,
  fontSize: '12px',
  color: '#374151',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const td: React.CSSProperties = {
  padding: '10px 12px',
  verticalAlign: 'top',
};
