'use client';

import React from 'react';
import { Logo } from '@/components/ui/Logo';

/**
 * Footer GESTMONEY — footer unique de la page de vente.
 *
 * Le script universel IBIG SOFT n'injecte plus que la section « Nos solutions »
 * (data-render="solutions") : deux footers empilés faisaient doublon. Les
 * informations du groupe qui n'existaient que dans le footer universel —
 * téléphones, WhatsApp, adresse, horaires, e-mails, réseaux sociaux, mention
 * de l'éditeur — sont donc reprises ici. Le catalogue des autres logiciels
 * n'est volontairement pas repris : le carrousel juste au-dessus le porte déjà.
 */

const VERT = '#009E00';
const OR = '#FFD000';
const FOND = '#0a2e15';

const CONTACT = {
  tel1: '+225 27 22 27 60 14',
  tel2: '+225 05 55 05 99 01',
  whatsapp: '+225 07 78 88 25 92',
  whatsappLien: 'https://wa.me/2250778882592',
  ville: 'Abidjan, Côte d’Ivoire',
  horaires: 'Lun – Sam · 8h00 – 18h00',
};

const RESEAUX = [
  { nom: 'Facebook', url: 'https://www.facebook.com/ibigsoft' },
  { nom: 'LinkedIn', url: 'https://www.linkedin.com/company/ibigsoft/' },
  { nom: 'YouTube', url: 'https://www.youtube.com/@IBIGSOFT' },
  { nom: 'Instagram', url: 'https://www.instagram.com/ibigsoft/' },
  { nom: 'TikTok', url: 'https://www.tiktok.com/@ibigsoft' },
  { nom: 'Groupe Facebook', url: 'https://www.facebook.com/groups/1655325562202049' },
  { nom: 'Chaîne WhatsApp', url: 'https://whatsapp.com/channel/0029VbD8TIr9xVJmniJ8m81w' },
];

type Lien = { label: string; href: string; externe?: boolean };

const COLONNES: { titre: string; liens: Lien[] }[] = [
  {
    titre: 'La plateforme',
    liens: [
      { label: 'Fonctionnalités', href: '#fonctionnalites' },
      { label: 'Modules métier', href: '#modules' },
      { label: 'Opérateurs supportés', href: '#operateurs' },
      { label: 'Tarifs', href: '#tarifs' },
      { label: 'Moyens de paiement', href: '#paiement' },
      { label: 'Demander une démo', href: '#contact' },
    ],
  },
  {
    titre: 'Ressources',
    liens: [
      { label: 'Guide utilisateur', href: '/guide' },
      { label: 'Cas pratiques', href: '/guide/cas-pratiques' },
      { label: 'Lexique Mobile Money', href: '/guide/lexique' },
      { label: 'Questions fréquentes', href: '#faq' },
    ],
  },
  {
    // Ces liens mènent à l'application : un visiteur non connecté est renvoyé
    // vers /login, ce qui est le comportement attendu pour un espace client.
    titre: 'Espace client',
    liens: [
      { label: 'Se connecter', href: '/login' },
      { label: 'Créer un compte', href: '/register' },
      { label: 'Support & assistance', href: '/dashboard/support' },
      { label: 'Mon abonnement', href: '/dashboard/abonnement' },
    ],
  },
  {
    titre: 'Légal GESTMONEY',
    liens: [
      { label: 'Mentions légales', href: '/legal/mentions-legales' },
      { label: "Conditions d'utilisation", href: '/legal/cgu' },
      { label: 'Confidentialité', href: '/legal/confidentialite' },
      { label: 'Cookies', href: '/legal/cookies' },
      { label: 'Tous les documents', href: '/legal' },
    ],
  },
];

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
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        {/* Grille principale : marque + 4 colonnes de liens, sur une seule
            rangée en grand écran (colonnes explicites — un auto-fit faisait
            retomber la 5e colonne à la ligne et étirait le footer). */}
        <div className="gm-foot-grid">
          <div>
            <Logo variante="compact" theme="sombre" />
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '14px 0 0', lineHeight: 1.65, maxWidth: '32ch' }}>
              La plateforme intelligente de gestion des réseaux Mobile Money en Afrique :
              agences, agents, flottes, commissions et conformité, en temps réel.
            </p>
            <p style={{ fontSize: 12, color: VERT, marginTop: 10, fontStyle: 'italic' }}>
              L&apos;excellence est notre passion
            </p>
          </div>

          {COLONNES.map((col) => (
            <nav key={col.titre} aria-label={col.titre}>
              <p style={titreColonne}>{col.titre}</p>
              {col.liens.map((l) => (
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
          ))}
        </div>

        {/* Bande contacts + réseaux : en ligne plutôt qu'en colonne, pour ne pas
            allonger le footer. Reprend les coordonnées du groupe IBIG SOFT. */}
        <div className="gm-foot-bande">
          <div className="gm-foot-contacts">
            <a href={`tel:${CONTACT.tel1.replace(/\s/g, '')}`} className="gm-footer-lien gm-inline">{CONTACT.tel1}</a>
            <a href={`tel:${CONTACT.tel2.replace(/\s/g, '')}`} className="gm-footer-lien gm-inline">{CONTACT.tel2}</a>
            <a href={CONTACT.whatsappLien} target="_blank" rel="noopener noreferrer" className="gm-footer-lien gm-inline">
              WhatsApp {CONTACT.whatsapp}
            </a>
            <a href="mailto:gestmoney@ibigsoft.com" className="gm-footer-lien gm-inline">gestmoney@ibigsoft.com</a>
            <a href="mailto:support@ibigsoft.com" className="gm-footer-lien gm-inline">support@ibigsoft.com</a>
            <a href="mailto:legal@ibigsoft.com" className="gm-footer-lien gm-inline">legal@ibigsoft.com</a>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{CONTACT.ville}</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{CONTACT.horaires}</span>
          </div>
          <div className="gm-foot-reseaux">
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

        <div
          style={{
            /* Pas de filet ici : la bande contacts juste au-dessus en porte déjà un. */
            paddingTop: 4,
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            fontSize: 12,
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          <p style={{ margin: 0 }}>
            © {new Date().getFullYear()} GESTMONEY — édité par{' '}
            <a
              href="https://ibigsoft.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="gm-footer-lien"
              style={{ display: 'inline', color: 'rgba(255,255,255,0.45)', textDecoration: 'none', marginBottom: 0 }}
            >
              IBIG SOFT
            </a>{' '}
            · Intermark Business International Group
          </p>
          <p style={{ margin: 0 }}>Conçu en Côte d&apos;Ivoire, pensé pour l&apos;Afrique</p>
        </div>
      </div>

      <style>{`
        .gm-foot-grid {
          display: grid;
          grid-template-columns: 1.5fr repeat(4, minmax(0, 1fr));
          gap: clamp(24px, 3vw, 40px);
          margin-bottom: 32px;
        }
        .gm-foot-bande {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 14px 28px;
          padding: 20px 0;
          border-top: 1px solid rgba(255,255,255,0.07);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          margin-bottom: 18px;
        }
        .gm-foot-contacts { display: flex; flex-wrap: wrap; gap: 6px 22px; align-items: center; }
        .gm-foot-reseaux  { display: flex; flex-wrap: wrap; gap: 6px; }

        /* Liens de la bande : en ligne, sans la marge basse des colonnes. */
        .gm-footer-lien.gm-inline { display: inline; margin-bottom: 0; font-size: 13px; }

        .gm-footer-reseau {
          font-size: 11.5px;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          padding: 5px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          transition: color .15s ease, border-color .15s ease;
        }

        .gm-footer-lien:hover { color: ${OR} !important; }
        .gm-footer-reseau:hover { color: ${OR}; border-color: ${OR}; }
        .gm-footer-lien:focus-visible,
        .gm-footer-reseau:focus-visible { outline: 2px solid ${VERT}; outline-offset: 3px; border-radius: 3px; }

        @media (max-width: 1024px) {
          .gm-foot-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        /* Mobile : les listes restent sur 2 colonnes (une seule doublait la
           hauteur du footer), la marque occupe toute la largeur. */
        @media (max-width: 560px) {
          .gm-foot-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px 20px; }
          .gm-foot-grid > div:first-child { grid-column: 1 / -1; }
          .gm-foot-bande { justify-content: flex-start; }
          .gm-foot-contacts { gap: 6px 16px; }
        }
      `}</style>
    </footer>
  );
}
