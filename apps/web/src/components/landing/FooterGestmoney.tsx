'use client';

import React from 'react';
import { Logo } from '@/components/ui/Logo';

/**
 * Footer GESTMONEY — footer unique de la page de vente.
 *
 * 6 colonnes (§7.32) :
 *  1. Identité (logo, description, slogan, bouton PWA, réseaux sociaux)
 *  2. Navigation (liens de la page de vente)
 *  3. Ressources (docs, aide, FAQ…)
 *  4. IBIG Soft (liens groupe)
 *  5. Légal
 *  6. Contacts (déplacés depuis l'ancienne bande gm-foot-bande)
 */

const VERT = '#009E00';
const OR = '#FFD000';
const FOND = '#0a2e15';

const CONTACT = {
  tel1: '+225 27 22 27 60 14',
  tel2: '+225 05 55 05 99 01',
  whatsapp: '+225 07 78 88 25 92',
  whatsappLien: 'https://wa.me/2250778882592',
  email1: 'gestmoney@ibigsoft.com',
  email2: 'support@ibigsoft.com',
  ville: 'Abidjan, Côte d’Ivoire',
  horaires: 'Lun – Sam · 8h00 – 18h00',
};

const RESEAUX = [
  { nom: 'Facebook',        url: 'https://www.facebook.com/ibigsoft' },
  { nom: 'LinkedIn',        url: 'https://www.linkedin.com/company/ibigsoft/' },
  { nom: 'YouTube',         url: 'https://www.youtube.com/@IBIGSOFT' },
  { nom: 'Instagram',       url: 'https://www.instagram.com/ibigsoft/' },
  { nom: 'TikTok',          url: 'https://www.tiktok.com/@ibigsoft' },
  { nom: 'Groupe Facebook', url: 'https://www.facebook.com/groups/1655325562202049' },
  { nom: 'Chaîne WhatsApp', url: 'https://whatsapp.com/channel/0029VbD8TIr9xVJmniJ8m81w' },
];

type Lien = { label: string; href: string; externe?: boolean };

/* ------------------------------------------------------------------ */
/*  Colonne 2 — Navigation                                             */
/* ------------------------------------------------------------------ */
const COL_NAVIGATION: Lien[] = [
  { label: 'Accueil',        href: '#hero' },
  { label: 'Fonctionnalités', href: '#fonctionnalites' },
  { label: 'Modules',        href: '#modules' },
  { label: 'Tarifs',         href: '#tarifs' },
  { label: 'Comparer les plans', href: '/tarifs' },
  { label: 'Démonstration',  href: '#contact' },
  { label: 'Assistance',     href: '/dashboard/support' },
  { label: 'Connexion',      href: '/login' },
  { label: 'Inscription',    href: '/register' },
];

/* ------------------------------------------------------------------ */
/*  Colonne 3 — Ressources                                             */
/* ------------------------------------------------------------------ */
const COL_RESSOURCES: Lien[] = [
  { label: 'Guide utilisateur',   href: '/guide' },
  { label: "Centre d'aide",       href: '/guide/aide' },
  { label: 'FAQ',                 href: '#faq' },
  { label: 'Tutoriels',           href: '/guide/tutoriels' },
  { label: 'Documentation',       href: '/guide/documentation' },
  { label: 'Nouveautés',          href: '/changelog' },
  { label: 'État des services', href: '/status' },
];

/* ------------------------------------------------------------------ */
/*  Colonne 4 — IBIG Soft                                              */
/* ------------------------------------------------------------------ */
const COL_IBIGSOFT: Lien[] = [
  { label: "À propos d'IBIG Soft",    href: 'https://ibigsoft.com',             externe: true },
  { label: 'Autres logiciels',        href: 'https://ibigsoft.com/#solutions',  externe: true },
  { label: 'Devenir partenaire',      href: 'https://ibigpartners.com/',        externe: true },
  { label: 'Programme IBIG PARTNERS', href: 'https://ibigpartners.com/',        externe: true },
];

/* ------------------------------------------------------------------ */
/*  Colonne 5 — Légal                                                  */
/* ------------------------------------------------------------------ */
const COL_LEGAL: Lien[] = [
  { label: 'Mentions légales',      href: '/legal/mentions-legales' },
  { label: "Conditions d'utilisation", href: '/legal/cgu' },
  { label: 'Confidentialité',       href: '/legal/confidentialite' },
  { label: 'Cookies',               href: '/legal/cookies' },
  { label: 'Politique de support',  href: '/legal/support' },
  { label: 'Résiliation',           href: '/legal/resiliation' },
  { label: 'Tous les documents',    href: '/legal' },
];

/* ------------------------------------------------------------------ */
/*  Styles partagés                                                    */
/* ------------------------------------------------------------------ */
const titreColonne: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.35)',
  margin: '0 0 16px',
};

const styleLien: React.CSSProperties = {
  display: 'block',
  fontSize: 13.5,
  color: 'rgba(255,255,255,0.55)',
  textDecoration: 'none',
  marginBottom: 11,
  transition: 'color .15s ease',
};

/* ------------------------------------------------------------------ */
/*  Composant colonne générique                                         */
/* ------------------------------------------------------------------ */
function ColonneLiens({ titre, liens }: { titre: string; liens: Lien[] }) {
  return (
    <nav aria-label={titre}>
      <p style={titreColonne}>{titre}</p>
      {liens.map((l) => (
        <a
          key={l.label}
          href={l.href}
          {...(l.externe ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="gm-footer-lien"
          style={styleLien}
        >
          {l.label}
        </a>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */
export function FooterGestmoney() {
  return (
    <footer
      style={{
        background: FOND,
        color: '#fff',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: 'clamp(40px,6vh,64px) clamp(16px,4vw,48px) 28px',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* ── Grille 6 colonnes ──────────────────────────────────── */}
        <div className="gm-foot-grid">

          {/* Col 1 — Identité */}
          <div>
            <Logo variante="compact" theme="sombre" />

            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '14px 0 0', lineHeight: 1.65, maxWidth: '32ch' }}>
              La plateforme intelligente de gestion des réseaux Mobile Money en Afrique :
              agences, agents, flottes, commissions et conformité, en temps réel.
            </p>

            <p style={{ fontSize: 12, color: VERT, marginTop: 10, fontStyle: 'italic' }}>
              L&apos;excellence est notre passion
            </p>

            {/* Bouton PWA */}
            <a
              href="#pwa"
              className="gm-btn-pwa"
            >
              Installer l&apos;application
            </a>

            {/* Réseaux sociaux (déplacés depuis la bande) */}
            <div className="gm-foot-reseaux" style={{ marginTop: 18 }}>
              {RESEAUX.map((r) => (
                <a
                  key={r.nom}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gm-footer-reseau"
                >
                  {r.nom}
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 — Navigation */}
          <ColonneLiens titre="Navigation" liens={COL_NAVIGATION} />

          {/* Col 3 — Ressources */}
          <ColonneLiens titre="Ressources" liens={COL_RESSOURCES} />

          {/* Col 4 — IBIG Soft */}
          <ColonneLiens titre="IBIG Soft" liens={COL_IBIGSOFT} />

          {/* Col 5 — Légal */}
          <ColonneLiens titre="Légal" liens={COL_LEGAL} />

          {/* Col 6 — Contacts */}
          <nav aria-label="Contacts">
            <p style={titreColonne}>Contacts</p>

            <a href={`tel:${CONTACT.tel1.replace(/\s/g,'')}`} className="gm-footer-lien" style={styleLien}>
              {CONTACT.tel1}
            </a>
            <a href={`tel:${CONTACT.tel2.replace(/\s/g,'')}`} className="gm-footer-lien" style={styleLien}>
              {CONTACT.tel2}
            </a>
            <a href={CONTACT.whatsappLien} target="_blank" rel="noopener noreferrer" className="gm-footer-lien" style={styleLien}>
              WhatsApp {CONTACT.whatsapp}
            </a>
            <a href={`mailto:${CONTACT.email1}`} className="gm-footer-lien" style={styleLien}>
              {CONTACT.email1}
            </a>
            <a href={`mailto:${CONTACT.email2}`} className="gm-footer-lien" style={styleLien}>
              {CONTACT.email2}
            </a>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 11px' }}>
              {CONTACT.ville}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              {CONTACT.horaires}
            </p>
          </nav>

        </div>{/* /gm-foot-grid */}

        {/* ── Barre de séparation ──────────────────────────────── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '28px 0 20px' }} />

        {/* ── Copyright étendu (§7.32) ─────────────────────────── */}
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.7 }}>
          <p style={{ margin: '0 0 6px' }}>
            &copy; {new Date().getFullYear()} GESTMONEY. Tous droits réservés.
          </p>
          <p style={{ margin: '0 0 6px' }}>
            Logiciel conçu, édité et exploité par IBIG Soft, une marque de IBIG SARL &ndash; Intermark Business International Group.
          </p>
          <p style={{ margin: '0 0 10px' }}>
            Toute reproduction, imitation, copie, adaptation, extraction ou utilisation non autorisée du logiciel, de son interface,
            de son logo, de ses textes, de sa documentation ou de son identité visuelle est interdite.
          </p>
          <a
            href="https://ibigsoft.com"
            target="_blank"
            rel="noopener noreferrer"
            className="gm-footer-lien"
            style={{ display: 'inline', color: 'rgba(255,255,255,0.45)', textDecoration: 'none', marginBottom: 0, fontSize: 12 }}
          >
            Découvrir l&apos;éditeur IBIG Soft →
          </a>
        </div>

      </div>

      <style>{`
        /* ── Grille 6 colonnes ─────────────────────────────────── */
        .gm-foot-grid {
          display: grid;
          grid-template-columns: 1.8fr repeat(5, minmax(0, 1fr));
          gap: clamp(20px, 2.5vw, 36px);
          margin-bottom: 0;
        }

        /* ≤ 1280px : 3 colonnes (2 rangées × 3) */
        @media (max-width: 1280px) {
          .gm-foot-grid { grid-template-columns: repeat(3, 1fr); }
        }

        /* ≤ 768px : 2 colonnes */
        @media (max-width: 768px) {
          .gm-foot-grid { grid-template-columns: repeat(2, 1fr); }
        }

        /* ≤ 560px : 2 colonnes, colonne 1 pleine largeur */
        @media (max-width: 560px) {
          .gm-foot-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px 20px; }
          .gm-foot-grid > div:first-child { grid-column: 1 / -1; }
        }

        /* ── Réseaux sociaux (pills) ────────────────────────────── */
        .gm-foot-reseaux  { display: flex; flex-wrap: wrap; gap: 6px; }

        .gm-footer-reseau {
          font-size: 11.5px;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          padding: 5px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          transition: color .15s ease, border-color .15s ease;
        }

        /* ── Bouton PWA ─────────────────────────────────────────── */
        .gm-btn-pwa {
          display: inline-block;
          margin-top: 14px;
          padding: 8px 16px;
          font-size: 12.5px;
          font-weight: 600;
          color: ${FOND};
          background: ${OR};
          border-radius: 6px;
          text-decoration: none;
          transition: opacity .15s ease, transform .15s ease;
        }
        .gm-btn-pwa:hover { opacity: .88; transform: translateY(-1px); }

        /* ── États interactifs ──────────────────────────────────── */
        .gm-footer-lien:hover   { color: ${OR} !important; }
        .gm-footer-reseau:hover { color: ${OR}; border-color: ${OR}; }
        .gm-footer-lien:focus-visible,
        .gm-footer-reseau:focus-visible { outline: 2px solid ${VERT}; outline-offset: 3px; border-radius: 3px; }
      `}</style>
    </footer>
  );
}
