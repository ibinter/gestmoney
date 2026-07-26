'use client';

import React, { useState } from 'react';

const VERT = '#009E00';
const OR = '#FFD000';
const FOND = '#0a2e15';

/* ------------------------------------------------------------------ */
/* Données                                                               */
/* ------------------------------------------------------------------ */

type Offre = {
  id: string;
  nom: string;
  prix: string;
  prixSub: string;
  utilisateurs: string;
  agences: string;
  support: string;
  recommande?: boolean;
  cta: string;
  ctaHref: string;
};

const OFFRES: Offre[] = [
  {
    id: 'starter',
    nom: 'STARTER',
    prix: '9 900 FCFA',
    prixSub: '/mois',
    utilisateurs: '5',
    agences: '1',
    support: 'Email',
    cta: "S'inscrire",
    ctaHref: '/register?plan=STARTER',
  },
  {
    id: 'essentiel',
    nom: 'ESSENTIEL',
    prix: '19 900 FCFA',
    prixSub: '/mois',
    utilisateurs: '15',
    agences: '3',
    support: 'Email',
    cta: "S'inscrire",
    ctaHref: '/register?plan=ESSENTIEL',
  },
  {
    id: 'professional',
    nom: 'PROFESSIONAL',
    prix: '39 900 FCFA',
    prixSub: '/mois',
    utilisateurs: 'Illimité',
    agences: '15',
    support: 'Email + Chat',
    recommande: true,
    cta: 'Commencer',
    ctaHref: '/register?plan=PROFESSIONAL',
  },
  {
    id: 'enterprise',
    nom: 'ENTERPRISE',
    prix: 'Sur devis',
    prixSub: '',
    utilisateurs: 'Illimité',
    agences: 'Illimité',
    support: 'Dédié',
    cta: 'Nous contacter',
    ctaHref: '#contact',
  },
];

type Fonctionnalite = {
  label: string;
  starter: boolean;
  essentiel: boolean;
  professional: boolean;
  enterprise: boolean;
};

const FONCTIONNALITES: Fonctionnalite[] = [
  { label: 'Agents de terrain',   starter: true,  essentiel: true,  professional: true,  enterprise: true  },
  { label: 'Flottes',             starter: true,  essentiel: true,  professional: true,  enterprise: true  },
  { label: 'Commissions auto',    starter: false, essentiel: true,  professional: true,  enterprise: true  },
  { label: 'Rapports avancés',    starter: false, essentiel: false, professional: true,  enterprise: true  },
  { label: 'Import Excel',        starter: false, essentiel: true,  professional: true,  enterprise: true  },
  { label: 'API & Webhooks',      starter: false, essentiel: false, professional: true,  enterprise: true  },
  { label: 'SARA IA',             starter: false, essentiel: false, professional: true,  enterprise: true  },
  { label: 'Sauvegarde cloud',    starter: true,  essentiel: true,  professional: true,  enterprise: true  },
  { label: 'Formation',           starter: false, essentiel: false, professional: false, enterprise: true  },
  { label: 'Audit log',           starter: false, essentiel: false, professional: true,  enterprise: true  },
];

/* ------------------------------------------------------------------ */
/* Sous-composants                                                       */
/* ------------------------------------------------------------------ */

function Check({ ok }: { ok: boolean }) {
  return ok ? (
    <span style={{ color: VERT, fontWeight: 700, fontSize: 16 }} aria-label="Inclus">✓</span>
  ) : (
    <span style={{ color: 'rgba(0,0,0,0.18)', fontSize: 16 }} aria-label="Non inclus">✗</span>
  );
}

function CarteOffre({ offre }: { offre: Offre }) {
  return (
    <div
      className={`oc-carte${offre.recommande ? ' oc-carte--recommande' : ''}`}
      aria-label={`Offre ${offre.nom}`}
    >
      {offre.recommande && (
        <div className="oc-badge" aria-label="Offre recommandée">
          ⭐ Recommandé
        </div>
      )}
      <h3 className="oc-nom">{offre.nom}</h3>
      <div className="oc-prix">
        <span className="oc-prix-montant">{offre.prix}</span>
        {offre.prixSub && <span className="oc-prix-sub">{offre.prixSub}</span>}
      </div>
      <ul className="oc-infos" aria-label={`Détails ${offre.nom}`}>
        <li><span className="oc-info-label">Utilisateurs</span><span className="oc-info-val">{offre.utilisateurs}</span></li>
        <li><span className="oc-info-label">Agences</span><span className="oc-info-val">{offre.agences}</span></li>
        <li><span className="oc-info-label">Support</span><span className="oc-info-val">{offre.support}</span></li>
      </ul>
      <a href={offre.ctaHref} className={`oc-cta${offre.recommande ? ' oc-cta--primary' : ''}`}>
        {offre.cta}
      </a>
    </div>
  );
}

/* Tableau comparateur — version desktop */
function TableauComparateur() {
  return (
    <div className="oc-tableau-wrap" id="comparateur">
      <table className="oc-tableau" aria-label="Comparaison des offres">
        <thead>
          <tr>
            <th className="oc-th oc-th-label">Fonctionnalité</th>
            {OFFRES.map((o) => (
              <th key={o.id} className={`oc-th${o.recommande ? ' oc-th--recommande' : ''}`}>
                {o.nom}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FONCTIONNALITES.map((f, i) => (
            <tr key={f.label} className={i % 2 === 0 ? 'oc-tr-pair' : ''}>
              <td className="oc-td oc-td-label">{f.label}</td>
              <td className="oc-td oc-td-val"><Check ok={f.starter} /></td>
              <td className="oc-td oc-td-val"><Check ok={f.essentiel} /></td>
              <td className="oc-td oc-td-val oc-td--recommande"><Check ok={f.professional} /></td>
              <td className="oc-td oc-td-val"><Check ok={f.enterprise} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* Cartes comparateur — version mobile */
function CartesComparateur() {
  const [actif, setActif] = useState<string>('pro');
  const offre = OFFRES.find((o) => o.id === actif)!;

  return (
    <div className="oc-comp-mobile">
      <div className="oc-comp-onglets" role="tablist" aria-label="Choisir une offre">
        {OFFRES.map((o) => (
          <button
            key={o.id}
            role="tab"
            aria-selected={actif === o.id}
            className={`oc-comp-onglet${actif === o.id ? ' oc-comp-onglet--actif' : ''}`}
            onClick={() => setActif(o.id)}
          >
            {o.nom}
          </button>
        ))}
      </div>
      <ul className="oc-comp-liste" role="tabpanel" aria-label={`Fonctionnalités ${offre.nom}`}>
        {FONCTIONNALITES.map((f) => {
          const ok = f[actif as keyof Fonctionnalite] as boolean;
          return (
            <li key={f.label} className="oc-comp-ligne">
              <span className="oc-comp-label">{f.label}</span>
              <Check ok={ok} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Export principal                                                      */
/* ------------------------------------------------------------------ */

export function OffreComparateurSection() {
  return (
    <section id="tarifs" aria-labelledby="oc-titre" style={{ background: '#f7f9f7', padding: 'clamp(48px,8vh,96px) clamp(16px,4vw,48px)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: VERT, margin: '0 0 10px' }}>
            Tarifs
          </p>
          <h2 id="oc-titre" style={{ fontSize: 'clamp(24px,4vw,38px)', fontWeight: 800, color: FOND, margin: '0 0 14px', lineHeight: 1.2 }}>
            Choisissez votre formule
          </h2>
          <p style={{ fontSize: 15.5, color: 'rgba(10,46,21,0.6)', margin: 0, maxWidth: '54ch', marginInline: 'auto' }}>
            Des offres adaptées aux structures de toutes tailles — de l&apos;agence indépendante
            au réseau national.
          </p>
        </div>

        {/* 3 cartes d'offres */}
        <div className="oc-grille">
          {OFFRES.map((o) => <CarteOffre key={o.id} offre={o} />)}
        </div>

        {/* Moyens de paiement */}
        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(10,46,21,0.5)', margin: '24px 0 48px' }}>
          Paiement par Mobile Money, virement, Wave, carte —{' '}
          <a href="/dashboard/abonnement" style={{ color: VERT, textDecoration: 'underline' }}>
            voir les détails sur la page abonnement
          </a>.
        </p>

        {/* Lien d'ancre vers le comparateur */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <a
            href="#comparateur"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 14,
              fontWeight: 600,
              color: FOND,
              textDecoration: 'none',
              borderBottom: `2px solid ${OR}`,
              paddingBottom: 2,
            }}
          >
            Comparer toutes les offres ↓
          </a>
        </div>

        {/* Tableau (desktop) / Cartes (mobile) */}
        <div className="oc-show-desktop"><TableauComparateur /></div>
        <div className="oc-show-mobile"><CartesComparateur /></div>

      </div>

      <style>{`
        /* ---- Grille de cartes ---- */
        .oc-grille {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 8px;
        }

        .oc-carte {
          background: #fff;
          border-radius: 14px;
          border: 1.5px solid rgba(10,46,21,0.1);
          padding: 28px 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          position: relative;
          transition: box-shadow .2s ease;
        }
        .oc-carte:hover { box-shadow: 0 6px 28px rgba(10,46,21,0.09); }

        .oc-carte--recommande {
          border-color: ${VERT};
          box-shadow: 0 4px 20px rgba(0,158,0,0.13);
        }
        .oc-carte--recommande:hover { box-shadow: 0 8px 32px rgba(0,158,0,0.2); }

        .oc-badge {
          display: inline-block;
          background: ${VERT};
          color: #fff;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: .05em;
          padding: 4px 12px;
          border-radius: 999px;
          margin-bottom: 12px;
          align-self: flex-start;
        }

        .oc-nom {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: rgba(10,46,21,0.5);
          margin: 0 0 10px;
        }

        .oc-prix {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 20px;
        }
        .oc-prix-montant {
          font-size: clamp(22px,3vw,28px);
          font-weight: 800;
          color: ${FOND};
          line-height: 1;
        }
        .oc-prix-sub {
          font-size: 13px;
          color: rgba(10,46,21,0.45);
        }

        .oc-infos {
          list-style: none;
          margin: 0 0 24px;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          border-top: 1px solid rgba(10,46,21,0.07);
          padding-top: 16px;
          flex: 1;
        }
        .oc-infos li {
          display: flex;
          justify-content: space-between;
          font-size: 13.5px;
        }
        .oc-info-label { color: rgba(10,46,21,0.55); }
        .oc-info-val   { font-weight: 600; color: ${FOND}; }

        .oc-cta {
          display: block;
          text-align: center;
          padding: 11px 0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          border: 2px solid ${FOND};
          color: ${FOND};
          transition: background .18s ease, color .18s ease;
        }
        .oc-cta:hover { background: ${FOND}; color: #fff; }
        .oc-cta--primary {
          background: ${VERT};
          border-color: ${VERT};
          color: #fff;
        }
        .oc-cta--primary:hover { background: #007a00; border-color: #007a00; color: #fff; }

        /* ---- Tableau ---- */
        .oc-tableau-wrap {
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid rgba(10,46,21,0.1);
          background: #fff;
        }
        .oc-tableau {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
        }
        .oc-th {
          padding: 14px 20px;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: rgba(10,46,21,0.45);
          text-align: center;
          border-bottom: 2px solid rgba(10,46,21,0.08);
        }
        .oc-th-label { text-align: left; }
        .oc-th--recommande { color: ${VERT}; }

        .oc-tr-pair { background: rgba(10,46,21,0.025); }

        .oc-td {
          padding: 11px 20px;
          border-bottom: 1px solid rgba(10,46,21,0.05);
          color: ${FOND};
        }
        .oc-td-label { font-weight: 500; }
        .oc-td-val { text-align: center; }
        .oc-td--recommande { background: rgba(0,158,0,0.04); }

        /* ---- Comparateur mobile ---- */
        .oc-comp-mobile { background: #fff; border-radius: 12px; border: 1px solid rgba(10,46,21,0.1); overflow: hidden; }

        .oc-comp-onglets {
          display: flex;
          border-bottom: 2px solid rgba(10,46,21,0.08);
        }
        .oc-comp-onglet {
          flex: 1;
          padding: 12px 4px;
          background: none;
          border: none;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: rgba(10,46,21,0.4);
          cursor: pointer;
          transition: color .15s ease, border-color .15s ease;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
        }
        .oc-comp-onglet--actif { color: ${VERT}; border-bottom-color: ${VERT}; }

        .oc-comp-liste { list-style: none; margin: 0; padding: 0; }
        .oc-comp-ligne {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 11px 20px;
          font-size: 13.5px;
          border-bottom: 1px solid rgba(10,46,21,0.05);
        }
        .oc-comp-label { color: ${FOND}; }

        /* ---- Visibilité responsive ---- */
        .oc-show-desktop { display: block; }
        .oc-show-mobile  { display: none; }

        @media (max-width: 767px) {
          .oc-grille { grid-template-columns: 1fr; }
          .oc-show-desktop { display: none; }
          .oc-show-mobile  { display: block; }
        }

        @media (max-width: 1023px) and (min-width: 768px) {
          .oc-grille { grid-template-columns: 1fr; max-width: 480px; margin-inline: auto; }
        }
      `}</style>
    </section>
  );
}
