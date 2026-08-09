'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// ─── Données ────────────────────────────────────────────────────────────────

const PLANS_MENSUEL = [
  {
    nom: 'DÉCOUVERTE',
    prix: '0',
    devise: 'Gratuit à vie',
    badge: null,
    ideal: 'Pour découvrir sans engagement',
    accentBg: '#f9fafb',
    accentBorder: '#e5e7eb',
    accentBtn: '#111827',
    accentTxt: '#fff',
    headColor: '#374151',
    cta: 'Créer mon espace gratuit',
    href: '/register',
    features: [
      '1 agence · 1 agent',
      '25 transactions / mois',
      'Toutes les fonctions de base',
      'Accès web + installation PWA',
      'Sauvegarde quotidienne',
      'Connexion par e-mail (OTP)',
      'Documents avec mention « Généré avec GESTMONEY »',
    ],
  },
  {
    nom: 'STARTER',
    prix: '9 900',
    devise: 'FCFA/mois',
    badge: null,
    ideal: 'Idéal pour démarrer',
    accentBg: '#f0fdf4',
    accentBorder: '#bbf7d0',
    accentBtn: '#009E00',
    accentTxt: '#fff',
    headColor: '#009E00',
    cta: 'Commencer l\'essai gratuit',
    href: '/register?plan=STARTER',
    features: [
      '1 agence — jusqu\'à 5 agents',
      '4 opérateurs Mobile Money',
      'Transactions & float',
      'Commissions automatiques',
      'Rapport mensuel PDF',
      'Support email (48h)',
    ],
  },
  {
    nom: 'ESSENTIEL',
    prix: '19 900',
    devise: 'FCFA/mois',
    badge: null,
    ideal: 'Pour les PME en croissance',
    accentBg: '#f0fdf4',
    accentBorder: '#86efac',
    accentBtn: '#16a34a',
    accentTxt: '#fff',
    headColor: '#16a34a',
    cta: 'Commencer l\'essai gratuit',
    href: '/register?plan=ESSENTIEL',
    features: [
      '3 agences — jusqu\'à 15 agents',
      '6 opérateurs Mobile Money',
      'Transactions, float & caisse',
      'Commissions + Reporting BI',
      'Comptabilité OHADA de base',
      'Export PDF / XLSX',
      'Support prioritaire (24h)',
    ],
  },
  {
    nom: 'PROFESSIONAL',
    prix: '39 900',
    devise: 'FCFA/mois',
    badge: '⭐ Recommandé',
    ideal: 'Réseaux établis & fintech',
    accentBg: '#fdfce6',
    accentBorder: '#FFD000',
    accentBtn: '#FFD000',
    accentTxt: '#111',
    headColor: '#b45309',
    cta: 'Commencer l\'essai gratuit',
    href: '/register?plan=PROFESSIONAL',
    features: [
      '15 agences — agents illimités',
      'Opérateurs Mobile Money illimités',
      'Tous les modules métier',
      'Compatibilité OHADA complète',
      'Reporting & BI avancés',
      'Assistant IA SARA inclus',
      'KYC & Clients intégrés',
      'API & intégrations',
      'Support dédié (4h)',
    ],
  },
  {
    nom: 'ENTERPRISE',
    prix: 'Sur devis',
    devise: '',
    badge: null,
    ideal: 'Groupes bancaires & MSB',
    accentBg: '#f0f9ff',
    accentBorder: '#bae6fd',
    accentBtn: '#0369a1',
    accentTxt: '#fff',
    headColor: '#0369a1',
    cta: 'Nous contacter',
    href: '#contact',
    features: [
      'Agences & agents illimités',
      'Multi-pays & multidevise',
      'Personnalisation complète',
      'Intégration & onboarding',
      'SLA garanti 99,9%',
      'CUSTOM & API dédiée',
      'Accompagnement expert dédié',
      'Formation & onboarding',
    ],
  },
];

// Prix annuels (-20%)
const PLANS_ANNUEL = PLANS_MENSUEL.map(p => {
  if (p.prix === 'Sur devis' || p.prix === '0') return p;
  const num = parseInt(p.prix.replace(/\s/g, ''), 10);
  const annuel = Math.round(num * 0.8 / 100) * 100;
  return { ...p, prix: annuel.toLocaleString('fr-FR'), devise: 'FCFA/mois (–20%)' };
});

const COMPARATIF = [
  {
    cat: 'Agences & Agents',
    lignes: [
      { feat: 'Nombre d\'agences',    starter: '1',    essentiel: '3',    pro: '15',       enterprise: 'Illimité' },
      { feat: 'Nombre d\'agents',     starter: '5',    essentiel: '15',   pro: 'Illimité', enterprise: 'Illimité' },
      { feat: 'Super-agents',         starter: '✅',   essentiel: '✅',   pro: '✅',       enterprise: '✅' },
      { feat: 'Multi-pays',           starter: '❌',   essentiel: '❌',   pro: '❌',       enterprise: '✅' },
    ],
  },
  {
    cat: 'Transactions',
    lignes: [
      { feat: 'Transactions/mois',       starter: 'Illimitées', essentiel: 'Illimitées', pro: 'Illimitées', enterprise: 'Illimitées' },
      { feat: 'Opérateurs Mobile Money', starter: '4',          essentiel: '6',          pro: 'Illimité',   enterprise: 'Illimité' },
      { feat: 'Gestion du float',        starter: '✅',         essentiel: '✅',         pro: '✅',         enterprise: '✅' },
      { feat: 'Caisse & coffre',         starter: '✅',         essentiel: '✅',         pro: '✅',         enterprise: '✅' },
    ],
  },
  {
    cat: 'Rapports',
    lignes: [
      { feat: 'Tableaux de bord',     starter: 'Basique', essentiel: 'Avancé',    pro: 'Avancé',      enterprise: 'Personnalisé' },
      { feat: 'Export PDF',           starter: '✅',      essentiel: '✅',        pro: '✅',           enterprise: '✅' },
      { feat: 'Export Excel',         starter: '❌',      essentiel: '✅',        pro: '✅',           enterprise: '✅' },
      { feat: 'Analytics temps réel', starter: '❌',      essentiel: '❌',        pro: '✅',           enterprise: '✅' },
      { feat: 'BI & Recharts',        starter: '❌',      essentiel: '❌',        pro: '✅',           enterprise: '✅' },
    ],
  },
  {
    cat: 'Sécurité',
    lignes: [
      { feat: 'Chiffrement TLS/AES',  starter: '✅', essentiel: '✅', pro: '✅', enterprise: '✅' },
      { feat: 'Journal d\'audit',     starter: '✅', essentiel: '✅', pro: '✅', enterprise: '✅' },
      { feat: 'Détection de fraudes', starter: '❌', essentiel: '❌', pro: '✅', enterprise: '✅' },
      { feat: 'SLA garanti 99.9%',    starter: '❌', essentiel: '❌', pro: '❌', enterprise: '✅' },
    ],
  },
  {
    cat: 'Intégrations',
    lignes: [
      { feat: 'API REST',             starter: '❌', essentiel: '❌', pro: '✅', enterprise: '✅' },
      { feat: 'Webhooks',             starter: '❌', essentiel: '❌', pro: '✅', enterprise: '✅' },
      { feat: 'Clés API partenaires', starter: '❌', essentiel: '❌', pro: '✅', enterprise: '✅' },
      { feat: 'Intégration dédiée',   starter: '❌', essentiel: '❌', pro: '❌', enterprise: '✅' },
    ],
  },
  {
    cat: 'Support',
    lignes: [
      { feat: 'Support email',      starter: '✅', essentiel: '✅',  pro: '✅',     enterprise: '✅' },
      { feat: 'Délai de réponse',   starter: '48h', essentiel: '24h', pro: '4h',   enterprise: 'Dédié' },
      { feat: 'Formation sur site', starter: '❌', essentiel: '❌',  pro: '❌',     enterprise: '✅' },
      { feat: 'Assistant IA SARA',  starter: '❌', essentiel: '❌',  pro: '✅',     enterprise: '✅' },
    ],
  },
];

const FAQ_TARIFS = [
  {
    q: 'Y a-t-il une période d\'essai ?',
    r: 'Oui, 14 jours gratuits sans carte bancaire, avec accès à toutes les fonctionnalités PROFESSIONAL. À l\'issue, votre espace bascule automatiquement en Découverte (gratuit à vie) : aucune donnée n\'est supprimée, seules les fonctions avancées et le volume au-delà des plafonds se ferment.',
  },
  {
    q: 'Puis-je changer de plan à tout moment ?',
    r: 'Oui. Vous pouvez monter ou descendre de plan à tout moment depuis votre espace d\'abonnement. Le changement prend effet immédiatement, avec un prorata calculé automatiquement.',
  },
  {
    q: 'Comment fonctionne la facturation ?',
    r: 'La facturation est mensuelle ou annuelle selon votre choix. L\'abonnement annuel bénéficie de 2 mois offerts (soit –20%). Chaque renouvellement génère une facture disponible dans votre espace.',
  },
  {
    q: 'Acceptez-vous Orange Money / MTN MoMo pour le paiement ?',
    r: 'Oui. La plateforme prend en charge le Mobile Money (Orange Money, MTN MoMo, Wave, Moov, Airtel), la carte bancaire via CinetPay / Paystack, le virement bancaire, les espèces en agence et plus encore.',
  },
  {
    q: 'Puis-je avoir une démo personnalisée ?',
    r: 'Absolument. Remplissez le formulaire de contact ou écrivez à gestmoney@ibigsoft.com. Un expert IBIG Soft vous présente GESTMONEY en 30 minutes selon votre cas d\'usage.',
  },
  {
    q: 'Les mises à jour sont-elles incluses ?',
    r: 'Toutes les mises à jour, nouvelles fonctionnalités et correctifs sont inclus dans l\'abonnement, sans frais supplémentaires.',
  },
  {
    q: 'Mes données sont-elles en sécurité ?',
    r: 'Vos données sont chiffrées en transit (TLS) et au repos (AES-256). L\'accès est protégé par JWT double token. Un journal d\'audit complet trace chaque action. Hébergement sur serveurs dédiés en Europe.',
  },
  {
    q: 'Que se passe-t-il à l\'expiration ?',
    r: 'Une période de grâce de 7 jours suit l\'échéance : votre accès reste actif le temps de régulariser. Passé ce délai, le compte est suspendu en lecture seule — vos données sont conservées sans perte.',
  },
];

// ─── Composant principal ─────────────────────────────────────────────────────

export function TarifsInteractif() {
  const [annuel, setAnnuel] = useState(false);
  const [faqOuvert, setFaqOuvert] = useState<number | null>(null);
  const plans = annuel ? PLANS_ANNUEL : PLANS_MENSUEL;

  return (
    <div style={{ background: '#f8fef9', color: '#111', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflowX: 'hidden' }}>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(80px,10vh,120px) clamp(16px,4vw,48px) clamp(60px,8vh,80px)',
        background: 'linear-gradient(160deg, #e8fded 0%, #f8fef9 40%, #fffef0 100%)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.15em', color: '#009E00', textTransform: 'uppercase', marginBottom: 12 }}>
          Tarifs
        </p>
        <h1 style={{ fontSize: 'clamp(32px,5vw,62px)', fontWeight: 900, color: '#0a2e15', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16 }}>
          Tarifs transparents<br />
          <span style={{ color: '#009E00' }}>Pas de frais cachés.</span> Pas de surprise.
        </h1>
        <p style={{ fontSize: 17, color: '#4a6650', marginBottom: 40, maxWidth: 540, margin: '0 auto 40px', lineHeight: 1.7 }}>
          Choisissez le plan adapté à votre réseau Mobile Money. Essai gratuit 14 jours, sans carte bancaire.
        </p>

        {/* Toggle mensuel / annuel */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: '#fff', border: '1.5px solid #d1fae5', borderRadius: 999, padding: '6px 8px', boxShadow: '0 2px 12px rgba(0,158,0,0.08)', marginBottom: 12 }}>
          <button
            onClick={() => setAnnuel(false)}
            style={{
              padding: '8px 20px', borderRadius: 999, border: 'none', cursor: 'pointer',
              fontWeight: 800, fontSize: 14, fontFamily: 'inherit',
              background: !annuel ? '#009E00' : 'transparent',
              color: !annuel ? '#fff' : '#6b7280',
              transition: 'all .2s',
            }}
          >
            Mensuel
          </button>
          <button
            onClick={() => setAnnuel(true)}
            style={{
              padding: '8px 20px', borderRadius: 999, border: 'none', cursor: 'pointer',
              fontWeight: 800, fontSize: 14, fontFamily: 'inherit',
              background: annuel ? '#009E00' : 'transparent',
              color: annuel ? '#fff' : '#6b7280',
              transition: 'all .2s',
            }}
          >
            Annuel
          </button>
        </div>
        {annuel && (
          <div style={{ textAlign: 'center' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(90deg,#FFD000,#ffdd40)', color: '#111',
              borderRadius: 999, padding: '6px 18px', fontSize: 13, fontWeight: 900,
              boxShadow: '0 4px 12px rgba(255,208,0,0.35)',
            }}>
              🎁 2 mois offerts — économisez 20%
            </span>
          </div>
        )}
      </section>

      {/* ── 3 PLANS ─────────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(60px,8vh,80px) clamp(16px,4vw,48px)', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'start' }}>
          {plans.map((p, i) => (
            <div key={i} style={{
              background: p.accentBg,
              border: `2px solid ${p.accentBorder}`,
              borderRadius: 20, padding: '32px 26px', position: 'relative',
              boxShadow: p.badge ? '0 8px 32px rgba(255,208,0,0.25)' : '0 2px 12px rgba(0,0,0,0.06)',
              transform: p.badge ? 'scale(1.03)' : 'none',
            }}>
              {p.badge && (
                <div style={{
                  position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                  background: '#FFD000', color: '#111', fontSize: 12, fontWeight: 900,
                  padding: '5px 18px', borderRadius: 999, whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(255,208,0,0.4)',
                }}>{p.badge}</div>
              )}
              <p style={{ fontSize: 13, fontWeight: 800, color: p.headColor, letterSpacing: '.08em', marginBottom: 4, textTransform: 'uppercase' }}>{p.nom}</p>
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 20, fontStyle: 'italic' }}>{p.ideal}</p>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: p.prix === 'Sur devis' ? 28 : 36, fontWeight: 900, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{p.prix}</span>
                {p.devise && <span style={{ fontSize: 13, color: '#6b7280', marginLeft: 6 }}>{p.devise}</span>}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {p.features.map((f, j) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#374151' }}>
                    <span style={{ color: '#009E00', flexShrink: 0, marginTop: 1, fontWeight: 900 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href={p.href} style={{
                display: 'block', textAlign: 'center', padding: '14px',
                borderRadius: 12, textDecoration: 'none', fontWeight: 800, fontSize: 15,
                background: p.accentBtn, color: p.accentTxt,
                boxShadow: `0 4px 16px ${p.accentBtn}40`,
              }}>
                {p.cta} →
              </Link>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: '#9ca3af' }}>
          Tarifs HT · TVA selon pays · Essai gratuit 14 jours sans carte bancaire · Résiliation sans frais
        </p>
      </section>

      {/* ── TABLEAU COMPARATIF ───────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(60px,8vh,80px) clamp(16px,4vw,48px)', background: '#f8fef9' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, letterSpacing: '.15em', color: '#009E00', textTransform: 'uppercase', marginBottom: 12 }}>Comparatif détaillé</p>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 900, textAlign: 'center', marginBottom: 48, color: '#0a2e15', letterSpacing: '-0.02em' }}>
            Toutes les fonctionnalités, plan par plan.
          </h2>
          <div style={{ overflowX: 'auto', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1.5px solid #d1fae5' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', minWidth: 600 }}>
              <thead>
                <tr style={{ background: '#0a2e15' }}>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', width: '30%' }}>Fonctionnalité</th>
                  {['STARTER', 'ESSENTIEL', 'PROFESSIONAL', 'ENTERPRISE'].map((n, i) => (
                    <th key={n} style={{ padding: '16px 20px', textAlign: 'center', fontSize: 13, fontWeight: 900, color: i === 2 ? '#FFD000' : 'rgba(255,255,255,0.85)' }}>{n}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARATIF.map((cat, ci) => (
                  <React.Fragment key={ci}>
                    <tr>
                      <td colSpan={5} style={{ padding: '12px 20px', fontSize: 11, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#009E00', background: '#f0fdf4', borderTop: ci > 0 ? '1px solid #d1fae5' : 'none' }}>
                        {cat.cat}
                      </td>
                    </tr>
                    {cat.lignes.map((l: any, li) => (
                      <tr key={li} style={{ borderBottom: '1px solid #f0f0f0', background: li % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '13px 20px', fontSize: 14, color: '#374151' }}>{l.feat}</td>
                        <td style={{ padding: '13px 20px', textAlign: 'center', fontSize: 14, color: l.starter === '❌' ? '#d1d5db' : '#111', fontWeight: l.starter === '✅' || l.starter === '❌' ? 700 : 600 }}>{l.starter}</td>
                        <td style={{ padding: '13px 20px', textAlign: 'center', fontSize: 14, color: l.essentiel === '❌' ? '#d1d5db' : '#111', fontWeight: l.essentiel === '✅' || l.essentiel === '❌' ? 700 : 600 }}>{l.essentiel}</td>
                        <td style={{ padding: '13px 20px', textAlign: 'center', fontSize: 14, color: l.pro === '❌' ? '#d1d5db' : '#111', fontWeight: l.pro === '✅' || l.pro === '❌' ? 700 : 600, background: 'rgba(255,208,0,0.04)' }}>{l.pro}</td>
                        <td style={{ padding: '13px 20px', textAlign: 'center', fontSize: 14, color: l.enterprise === '❌' ? '#d1d5db' : '#111', fontWeight: l.enterprise === '✅' || l.enterprise === '❌' ? 700 : 600 }}>{l.enterprise}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ TARIFS ───────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(60px,8vh,80px) clamp(16px,4vw,48px)', background: '#fff' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, letterSpacing: '.15em', color: '#009E00', textTransform: 'uppercase', marginBottom: 12 }}>FAQ Tarifs</p>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 900, textAlign: 'center', marginBottom: 48, color: '#0a2e15' }}>
            Vos questions sur les prix.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FAQ_TARIFS.map((item, i) => (
              <div key={i} style={{ background: '#f8fef9', border: '1.5px solid #d1fae5', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <button
                  onClick={() => setFaqOuvert(faqOuvert === i ? null : i)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer', color: '#111', textAlign: 'left', fontFamily: 'inherit' }}
                >
                  <span style={{ fontSize: 15, fontWeight: 700, flex: 1, paddingRight: 16 }}>{item.q}</span>
                  <span style={{ fontSize: 20, color: '#009E00', fontWeight: 700, transition: 'transform .2s', transform: faqOuvert === i ? 'rotate(45deg)' : 'none', flexShrink: 0 }}>+</span>
                </button>
                {faqOuvert === i && (
                  <div style={{ padding: '0 22px 20px', fontSize: 14, color: '#6b7280', lineHeight: 1.75 }}>{item.r}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(80px,10vh,120px) clamp(16px,4vw,48px)', background: 'linear-gradient(160deg,#0a2e15 0%,#133d1f 60%,#1a4d26 100%)', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,208,0,0.15)', border: '1.5px solid rgba(255,208,0,0.3)',
            borderRadius: 999, padding: '7px 18px', marginBottom: 28,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFD000', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#FFD000', letterSpacing: '.1em', textTransform: 'uppercase' }}>Essai gratuit · 14 jours</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Commencez votre essai gratuit<br />de 14 jours
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.65)', marginBottom: 40, lineHeight: 1.7 }}>
            Aucune carte bancaire requise. Résiliez à tout moment.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{
              padding: '16px clamp(24px,4vw,44px)', borderRadius: 12, fontSize: 16, fontWeight: 900,
              background: '#FFD000', color: '#111', textDecoration: 'none',
              boxShadow: '0 4px 24px rgba(255,208,0,0.45)', display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              ⚡ Démarrer gratuitement
            </Link>
            <a href="mailto:gestmoney@ibigsoft.com" style={{
              padding: '16px clamp(24px,4vw,44px)', borderRadius: 12, fontSize: 16, fontWeight: 700,
              background: 'transparent', border: '1.5px solid rgba(255,255,255,0.3)',
              color: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              Contacter les ventes →
            </a>
          </div>
        </div>
      </section>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { width: 100%; max-width: 100%; margin: 0; overflow-x: hidden; }
        a:focus-visible, button:focus-visible { outline: 2px solid #009E00; outline-offset: 2px; }
      `}</style>
    </div>
  );
}
