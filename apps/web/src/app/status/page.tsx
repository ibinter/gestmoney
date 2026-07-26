'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
}

interface SystemStatus {
  status: 'operational' | 'degraded' | 'outage';
  incidents: string[];
  services: ServiceStatus[];
  lastUpdated: string;
}

const STATUS_LABEL: Record<string, string> = {
  operational: 'Opérationnel',
  degraded:    'Dégradé',
  outage:      'Panne',
};

const STATUS_COLOR: Record<string, string> = {
  operational: '#009E00',
  degraded:    '#d97706',
  outage:      '#dc2626',
};

// Barres d'uptime fictives 30 jours (vert = ok, rouge = incident)
// En production, ces données viendraient d'un historique
function UptimeBars({ status }: { status: 'operational' | 'degraded' | 'outage' }) {
  const bars = Array.from({ length: 30 }, (_, i) => {
    // Simule quelques incidents passés (dans un vrai projet : données réelles)
    const hasIssue = status !== 'operational' && i === 29;
    return hasIssue ? 'outage' : 'operational';
  });

  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 28 }}>
      {bars.map((bar, i) => (
        <div
          key={i}
          title={`J-${29 - i}`}
          style={{
            flex: 1,
            height: bar === 'operational' ? 20 : 28,
            borderRadius: 2,
            backgroundColor: bar === 'operational' ? '#009E00' : '#dc2626',
            opacity: bar === 'operational' ? 0.7 : 1,
            transition: 'height .2s',
          }}
        />
      ))}
    </div>
  );
}

function Pastille({ status }: { status: 'operational' | 'degraded' | 'outage' }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        backgroundColor: STATUS_COLOR[status],
        marginRight: 8,
        flexShrink: 0,
      }}
    />
  );
}

export default function StatusPage() {
  const [data, setData] = useState<SystemStatus | null>(null);
  const [error, setError] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/status`, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json: SystemStatus = await res.json();
      setData(json);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLastFetch(new Date());
    }
  };

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 30_000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const globalStatus = error ? 'outage' : (data?.status ?? 'operational');

  const bandeauBg =
    globalStatus === 'operational' ? '#f0fdf4' :
    globalStatus === 'degraded'    ? '#fffbeb' :
                                     '#fef2f2';

  const bandeauBorder =
    globalStatus === 'operational' ? '#bbf7d0' :
    globalStatus === 'degraded'    ? '#fde68a' :
                                     '#fecaca';

  const bandeauIcon =
    globalStatus === 'operational' ? '✅' :
    globalStatus === 'degraded'    ? '⚠️' :
                                     '🔴';

  const bandeauTexte =
    globalStatus === 'operational' ? 'Tous les systèmes sont opérationnels' :
    globalStatus === 'degraded'    ? 'Dégradation partielle des services' :
                                     'Incident en cours — nos équipes travaillent à la résolution';

  const secondsAgo = lastFetch
    ? Math.round((Date.now() - lastFetch.getTime()) / 1000)
    : null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── En-tête ─────────────────────────────────────────── */}
      <header style={{
        backgroundColor: '#0a2e15',
        padding: '20px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🪙</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            GEST<span style={{ color: '#009E00' }}>MONEY</span>
          </span>
        </Link>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          État des services
        </span>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>

        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 28px', color: '#111827' }}>
          État des services
        </h1>

        {/* ── Bandeau statut global ─────────────────────────── */}
        <div style={{
          backgroundColor: bandeauBg,
          border: `1px solid ${bandeauBorder}`,
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 16,
          fontWeight: 600,
          color: '#111827',
        }}>
          <span style={{ fontSize: 22 }}>{bandeauIcon}</span>
          {bandeauTexte}
        </div>

        {/* ── Grille des services ───────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 16,
          marginBottom: 40,
        }}>
          {(data?.services ?? [
            { name: 'API',             status: 'operational' as const },
            { name: 'Base de données', status: 'operational' as const },
            { name: 'Emails',          status: 'operational' as const },
            { name: 'Sauvegardes',     status: 'operational' as const },
          ]).map((svc) => (
            <div key={svc.name} style={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{svc.name}</span>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Pastille status={svc.status} />
                <span style={{ fontSize: 12, color: STATUS_COLOR[svc.status], fontWeight: 500 }}>
                  {STATUS_LABEL[svc.status]}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Uptime 30 jours ───────────────────────────────── */}
        <section style={{
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 24,
          marginBottom: 32,
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px', color: '#111827' }}>
            Disponibilité — 30 derniers jours
          </h2>
          {(data?.services ?? [
            { name: 'API', status: 'operational' as const },
            { name: 'Base de données', status: 'operational' as const },
          ]).slice(0, 2).map((svc) => (
            <div key={svc.name} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{svc.name}</span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>
                  {svc.status === 'operational' ? '100,0 %' : '99,9 %'}
                </span>
              </div>
              <UptimeBars status={svc.status} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>Il y a 30 jours</span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>Aujourd&apos;hui</span>
              </div>
            </div>
          ))}
        </section>

        {/* ── Incidents ─────────────────────────────────────── */}
        {data?.incidents && data.incidents.length > 0 && (
          <section style={{
            backgroundColor: '#fff',
            border: '1px solid #fecaca',
            borderRadius: 12,
            padding: 24,
            marginBottom: 32,
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: '#991b1b' }}>
              Incidents en cours
            </h2>
            {data.incidents.map((inc, i) => (
              <p key={i} style={{ margin: '0 0 8px', fontSize: 14, color: '#374151' }}>{inc}</p>
            ))}
          </section>
        )}

        {/* ── Contact support si incident ────────────────────── */}
        {globalStatus !== 'operational' && (
          <div style={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <span style={{ fontSize: 14, color: '#374151' }}>
              Vous rencontrez un problème ? Contactez notre support.
            </span>
            <a
              href="https://wa.me/2250778882592?text=Bonjour%20IBIG%20Soft%2C%20je%20signale%20un%20incident%20GESTMONEY."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#009E00',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Contacter le support
            </a>
          </div>
        )}

        {/* ── Pied : mis à jour + refresh ───────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>
            {secondsAgo !== null
              ? `Mis à jour il y a ${secondsAgo} seconde${secondsAgo !== 1 ? 's' : ''} · Actualisation automatique toutes les 30 s`
              : 'Chargement…'}
          </p>
          <button
            onClick={fetchStatus}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: 12,
              color: '#6b7280',
              cursor: 'pointer',
            }}
          >
            Actualiser maintenant
          </button>
        </div>

      </main>

      {/* ── Footer minimaliste ────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid #e5e7eb',
        padding: '20px 32px',
        textAlign: 'center',
        fontSize: 12,
        color: '#9ca3af',
      }}>
        <Link href="/" style={{ color: '#009E00', textDecoration: 'none', marginRight: 16 }}>
          GESTMONEY
        </Link>
        <Link href="/legal" style={{ color: '#9ca3af', textDecoration: 'none', marginRight: 16 }}>
          Mentions légales
        </Link>
        <a
          href="mailto:support@ibigsoft.com"
          style={{ color: '#9ca3af', textDecoration: 'none' }}
        >
          support@ibigsoft.com
        </a>
      </footer>

    </div>
  );
}
