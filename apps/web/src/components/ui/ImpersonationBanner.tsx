'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface ImpersonationInfo {
  impersonatedBy: string;
  impersonationId: string;
  targetName: string;
  targetEmail: string;
}

/**
 * Décode le JWT depuis le cookie `gestmoney_token` (côté client, version
 * sans httpOnly — ce cookie est httpOnly, donc invisible en JS).
 * On passe par l'endpoint /api/v1/auth/me pour récupérer l'info d'impersonation
 * stockée dans le contexte utilisateur courant.
 */
function parseJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export default function ImpersonationBanner() {
  const [info, setInfo] = useState<ImpersonationInfo | null>(null);
  const [stopping, setStopping] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Le cookie gestmoney_token est httpOnly → inaccessible en JS.
    // On interroge le serveur pour savoir si la session est une impersonation.
    const check = async () => {
      try {
        const res = await api.get('/auth/me');
        const data = res.data;
        // Le profil retourné contient les champs d'impersonation si présents
        if (data.impersonatedBy && data.impersonationId) {
          setInfo({
            impersonatedBy: data.impersonatedBy,
            impersonationId: data.impersonationId,
            targetName: `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(),
            targetEmail: data.email ?? '',
          });
        }
      } catch {
        // Silencieux — pas d'impersonation ou erreur réseau
      }
    };

    check();
  }, []);

  // Également détecter via localStorage si le frontend stocke le token décodé
  useEffect(() => {
    try {
      const raw = localStorage.getItem('gestmoney_impersonation');
      if (raw) {
        const stored = JSON.parse(raw) as ImpersonationInfo;
        setInfo(stored);
      }
    } catch {
      // pas de donnée en localStorage
    }
  }, []);

  const handleStop = async () => {
    if (!info) return;
    setStopping(true);
    try {
      await api.post(`/auth/impersonate/${info.impersonationId}/stop`);
      {
        localStorage.removeItem('gestmoney_impersonation');
        setInfo(null);
        // Rediriger vers le dashboard SuperAdmin
        router.push('/dashboard/superadmin');
        router.refresh();
      }
    } catch {
      // erreur réseau
    } finally {
      setStopping(false);
    }
  };

  if (!info) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: '#f97316',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px',
        fontWeight: 600,
        fontSize: '14px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      <span>
        ⚠️ Vous visualisez le compte de{' '}
        <strong>{info.targetName || info.targetEmail}</strong>
        {info.targetName && info.targetEmail ? ` (${info.targetEmail})` : ''}{' '}
        — Session support active
      </span>
      <button
        onClick={handleStop}
        disabled={stopping}
        style={{
          background: '#fff',
          color: '#f97316',
          border: 'none',
          borderRadius: '6px',
          padding: '6px 16px',
          fontWeight: 700,
          cursor: stopping ? 'wait' : 'pointer',
          fontSize: '13px',
          flexShrink: 0,
        }}
      >
        {stopping ? 'Arrêt en cours…' : 'Terminer la session'}
      </button>
    </div>
  );
}
