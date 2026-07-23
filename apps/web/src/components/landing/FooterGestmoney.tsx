'use client';

import React from 'react';
import { Logo } from '@/components/ui/Logo';

/**
 * Bandeau footer propre à GESTMONEY.
 *
 * Le footer universel IBIG SOFT (injecté par /ibigsoft-universal.js) ne porte
 * que les informations du groupe : contacts, réseaux, documents légaux du site
 * ibigsoft.com. Tout ce qui est propre au produit — navigation de la page de
 * vente, ressources, espace client, documents légaux GESTMONEY — disparaissait
 * avec l'ancien footer. Ce bandeau les réintègre, juste au-dessus du footer
 * universel et sur le même fond (#0B1220) pour ne former qu'un seul bloc.
 */

const VERT = '#009E00';
const OR = '#FFD000';
const FOND = '#0B1220';

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
      { label: 'Support & assistance', href: '/dashboard/support' },
    ],
  },
  {
    titre: 'Espace client',
    liens: [
      { label: 'Se connecter', href: '/login' },
      { label: 'Créer un compte', href: '/register' },
      { label: 'Mot de passe oublié', href: '/forgot-password' },
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

export function FooterGestmoney() {
  return (
    <section
      aria-label="Liens GESTMONEY"
      style={{
        background: FOND,
        color: '#fff',
        fontFamily: 'Inter, ui-sans-serif, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        borderTop: `2px solid ${VERT}`,
        padding: 'clamp(40px,6vh,64px) clamp(16px,4vw,48px) 28px',
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: 'clamp(28px,4vw,48px)',
            marginBottom: 40,
          }}
        >
          <div style={{ minWidth: 200 }}>
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
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.35)',
                  margin: '0 0 16px',
                }}
              >
                {col.titre}
              </p>
              {col.liens.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  {...(l.externe ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="gm-footer-lien"
                  style={{
                    display: 'block',
                    fontSize: 13.5,
                    color: 'rgba(255,255,255,0.55)',
                    textDecoration: 'none',
                    marginBottom: 11,
                    transition: 'color .15s ease',
                  }}
                >
                  {l.label}
                </a>
              ))}
            </nav>
          ))}
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 20,
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            fontSize: 12,
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          <p style={{ margin: 0 }}>
            © {new Date().getFullYear()} GESTMONEY — une solution IBIG SOFT · Intermark Business
            International Group
          </p>
          <p style={{ margin: 0 }}>Conçu en Côte d&apos;Ivoire, pensé pour l&apos;Afrique</p>
        </div>
      </div>

      <style>{`
        .gm-footer-lien:hover { color: ${OR} !important; }
        .gm-footer-lien:focus-visible { outline: 2px solid ${VERT}; outline-offset: 3px; border-radius: 3px; }
      `}</style>
    </section>
  );
}
