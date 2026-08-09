'use client';

import React from 'react';

const VERT = '#009E00';
const OR = '#FFD000';
const FOND = '#0a2e15';

type Statut = 'disponible' | 'integration' | 'bientot';

interface Intégration {
  nom: string;
  statut: Statut;
}

const INTÉGRATIONS: Intégration[] = [
  // Disponibles
  { nom: 'Orange Money CI', statut: 'disponible' },
  { nom: 'Moov Money CI', statut: 'disponible' },
  { nom: 'MTN MoMo CI', statut: 'disponible' },
  { nom: 'Wave CI', statut: 'disponible' },
  { nom: 'Virement bancaire', statut: 'disponible' },
  { nom: 'Paiement en espèces', statut: 'disponible' },
  // En intégration
  { nom: 'CinetPay', statut: 'integration' },
  { nom: 'MTN MoMo (autres pays)', statut: 'integration' },
  { nom: 'Orange Money (autres pays)', statut: 'integration' },
  // Bientôt
  { nom: 'Stripe', statut: 'bientot' },
  { nom: 'Paystack', statut: 'bientot' },
  { nom: 'Flutterwave', statut: 'bientot' },
  { nom: 'Moneroo', statut: 'bientot' },
  { nom: 'FedaPay', statut: 'bientot' },
  { nom: 'WhatsApp Business', statut: 'bientot' },
  { nom: 'SMS notifications', statut: 'bientot' },
  { nom: 'API webhooks', statut: 'bientot' },
];

const GROUPES: { statut: Statut; label: string; couleur: string; fond: string; bordure: string }[] = [
  {
    statut: 'disponible',
    label: 'Disponible',
    couleur: '#166534',
    fond: '#dcfce7',
    bordure: '#86efac',
  },
  {
    statut: 'integration',
    label: 'En intégration',
    couleur: '#9a3412',
    fond: '#ffedd5',
    bordure: '#fdba74',
  },
  {
    statut: 'bientot',
    label: 'Bientôt disponible',
    couleur: '#374151',
    fond: '#f3f4f6',
    bordure: '#d1d5db',
  },
];

function Badge({ statut }: { statut: Statut }) {
  const g = GROUPES.find((x) => x.statut === statut)!;
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: '.04em',
        padding: '2px 8px',
        borderRadius: 999,
        color: g.couleur,
        background: g.fond,
        border: `1px solid ${g.bordure}`,
        whiteSpace: 'nowrap',
      }}
    >
      {g.label}
    </span>
  );
}

function CarteIntégration({ intégration }: { intégration: Intégration }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '18px 20px',
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 4px rgba(0,0,0,.06)',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
        }}
      >
        💳
      </div>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>
        {intégration.nom}
      </p>
      <Badge statut={intégration.statut} />
    </div>
  );
}

export function IntégrationsSectionComponent() {
  const disponibles = INTÉGRATIONS.filter((i) => i.statut === 'disponible');
  const enIntégration = INTÉGRATIONS.filter((i) => i.statut === 'integration');
  const bientôt = INTÉGRATIONS.filter((i) => i.statut === 'bientot');

  return (
    <section
      id="integrations"
      style={{
        background: '#f9fafb',
        padding: 'clamp(48px,8vh,96px) clamp(16px,4vw,48px)',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: VERT,
              margin: '0 0 12px',
            }}
          >
            Paiements & intégrations
          </p>
          <h2
            style={{
              fontSize: 'clamp(24px,3vw,36px)',
              fontWeight: 800,
              color: '#111827',
              margin: '0 0 16px',
              lineHeight: 1.25,
            }}
          >
            Moyens de paiement et intégrations supportés
          </h2>
          <p
            style={{
              fontSize: 16,
              color: '#6b7280',
              maxWidth: '56ch',
              margin: '0 auto',
              lineHeight: 1.7,
            }}
          >
            GESTMONEY s'intègre aux opérateurs Mobile Money et aux passerelles de
            paiement les plus utilisés en Afrique. Voici l'état exact de nos
            intégrations.
          </p>
        </div>

        {/* Groupe : Disponible */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: VERT,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>
              Disponible maintenant
            </h3>
            <span
              style={{
                fontSize: 12,
                color: '#6b7280',
                background: '#e5e7eb',
                borderRadius: 999,
                padding: '2px 9px',
              }}
            >
              {disponibles.length}
            </span>
          </div>
          <div className="gm-integ-grid">
            {disponibles.map((i) => (
              <CarteIntégration key={i.nom} intégration={i} />
            ))}
          </div>
        </div>

        {/* Groupe : En intégration */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: OR,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>
              En cours d'intégration
            </h3>
            <span
              style={{
                fontSize: 12,
                color: '#6b7280',
                background: '#e5e7eb',
                borderRadius: 999,
                padding: '2px 9px',
              }}
            >
              {enIntégration.length}
            </span>
          </div>
          <div className="gm-integ-grid">
            {enIntégration.map((i) => (
              <CarteIntégration key={i.nom} intégration={i} />
            ))}
          </div>
        </div>

        {/* Groupe : Bientôt disponible */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#9ca3af',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>
              Bientôt disponible
            </h3>
            <span
              style={{
                fontSize: 12,
                color: '#6b7280',
                background: '#e5e7eb',
                borderRadius: 999,
                padding: '2px 9px',
              }}
            >
              {bientôt.length}
            </span>
          </div>
          <div className="gm-integ-grid">
            {bientôt.map((i) => (
              <CarteIntégration key={i.nom} intégration={i} />
            ))}
          </div>
        </div>

        {/* Légende */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            justifyContent: 'center',
            padding: '24px 28px',
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
          }}
        >
          <p
            style={{
              margin: '0 0 4px',
              fontSize: 12,
              fontWeight: 600,
              color: '#374151',
              width: '100%',
              textAlign: 'center',
            }}
          >
            Légende des statuts
          </p>
          {GROUPES.map((g) => (
            <div key={g.statut} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: '.04em',
                  padding: '2px 8px',
                  borderRadius: 999,
                  color: g.couleur,
                  background: g.fond,
                  border: `1px solid ${g.bordure}`,
                }}
              >
                {g.label}
              </span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                {g.statut === 'disponible' && '— Opérationnel, utilisable dès maintenant'}
                {g.statut === 'integration' && '— Développement en cours, bientôt activé'}
                {g.statut === 'bientot' && '— Planifié, pas encore en développement'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .gm-integ-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
          gap: 16px;
        }
        @media (max-width: 480px) {
          .gm-integ-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
        }
      `}</style>
    </section>
  );
}
