'use client';
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

// ─── Données ───────────────────────────────────────────────────
const FEATURES = [
  { icon: '↔️', titre: 'Multi-opérateurs', desc: 'Orange Money, MTN MoMo, Wave, Moov, Airtel — tous vos réseaux dans une seule plateforme unifiée.' },
  { icon: '🔒', titre: '100% sécurisé', desc: 'Authentification JWT renforcée, chiffrement de bout en bout, journaux d\'audit et détection de fraudes.' },
  { icon: '📊', titre: 'Reporting temps réel', desc: 'Tableaux de bord live, alertes float intelligentes et rapports BI exportables PDF/XLSX.' },
  { icon: '🏪', titre: 'Réseau d\'agences', desc: 'Gérez agents, agences, points de vente et territoires depuis un espace centralisé.' },
  { icon: '💰', titre: 'Commissions automatisées', desc: 'Calcul automatique, paliers configurables, validation et paiement en quelques clics.' },
  { icon: '🤖', titre: 'Assistant IA SARA', desc: 'Alertes prédictives, recommandations de réapprovisionnement et détection d\'anomalies.' },
  { icon: '📦', titre: 'Gestion du float', desc: 'Suivi des soldes par réseau, seuils d\'alerte automatiques et réapprovisionnements intégrés.' },
  { icon: '🧾', titre: 'Comptabilité OHADA', desc: 'Plan comptable OHADA, journal, grand livre, bilan et clôture d\'exercice intégrés.' },
  { icon: '👥', titre: 'Ressources humaines', desc: 'Employés, contrats, paie, congés et présences dans un module RH complet.' },
];

const MODULES = [
  { nom: 'Transactions', icon: '💳', desc: 'Dépôts, retraits, transferts, paiements' },
  { nom: 'Float Management', icon: '🏦', desc: 'Soldes, mouvements, seuils, réapprovisionnements' },
  { nom: 'Réseau Agents', icon: '👤', desc: 'Hiérarchie agent / super-agent / agence' },
  { nom: 'Commissions', icon: '💵', desc: 'Plans, calcul, validation, paiements' },
  { nom: 'Clients & KYC', icon: '🪪', desc: 'Fiche client, vérification d\'identité' },
  { nom: 'Caisse', icon: '🏧', desc: 'Gestion caisse et coffre par agence' },
  { nom: 'Comptabilité', icon: '📒', desc: 'Plan OHADA, grand livre, bilan' },
  { nom: 'Reporting & BI', icon: '📈', desc: 'Tableaux de bord, exports, rapports' },
  { nom: 'Stock', icon: '📦', desc: 'Inventaire, produits, mouvements' },
  { nom: 'RH & Paie', icon: '👥', desc: 'Employés, contrats, paie, congés' },
  { nom: 'Audit & Sécurité', icon: '🔍', desc: 'Journal d\'audit complet, alertes fraudes' },
  { nom: 'Intégrations API', icon: '🔌', desc: 'Connexion directe aux API opérateurs' },
];

const STATS = [
  { valeur: '10 000+', label: 'Transactions / jour', bg: '#009E00', txt: '#fff' },
  { valeur: '500+', label: 'Agences gérées', bg: '#FFD000', txt: '#111' },
  { valeur: '5', label: 'Opérateurs intégrés', bg: '#E60000', txt: '#fff' },
  { valeur: '99.9%', label: 'Disponibilité SLA', bg: '#111', txt: '#FFD000' },
];

const OPS = [
  { nom: 'Orange Money', couleur: '#FF6B00', emoji: '🟠', pays: 'CI · SN · ML · CM' },
  { nom: 'MTN MoMo', couleur: '#FFCC00', emoji: '🟡', pays: 'GH · NG · CM · BJ' },
  { nom: 'Wave', couleur: '#0099FF', emoji: '🔵', pays: 'CI · SN · ML' },
  { nom: 'Moov Money', couleur: '#009E00', emoji: '🟢', pays: 'BJ · TG · BF · GA' },
  { nom: 'Airtel Money', couleur: '#E60000', emoji: '🔴', pays: 'KE · TZ · RW · ZM' },
];

// 4 licences modérées
const OFFRES = [
  {
    nom: 'STARTER',
    prix: '9 900',
    devise: 'XOF / mois',
    badge: null,
    accentBg: '#f0fdf4',
    accentBorder: '#bbf7d0',
    accentBtn: '#009E00',
    accentTxt: '#fff',
    headColor: '#009E00',
    features: [
      '1 agence · jusqu\'à 5 agents',
      '2 opérateurs Mobile Money',
      'Transactions & Float',
      'Commissions automatiques',
      'Rapport mensuel PDF',
      'Support email (48h)',
    ],
    ideal: 'Idéal pour démarrer',
  },
  {
    nom: 'ESSENTIEL',
    prix: '19 900',
    devise: 'XOF / mois',
    badge: null,
    accentBg: '#fffbeb',
    accentBorder: '#fde68a',
    accentBtn: '#d97706',
    accentTxt: '#fff',
    headColor: '#b45309',
    features: [
      '3 agences · jusqu\'à 20 agents',
      '4 opérateurs Mobile Money',
      'Transactions, Float & Caisse',
      'Commissions + Reporting BI',
      'Comptabilité OHADA de base',
      'Exports PDF / XLSX',
      'Support prioritaire (24h)',
    ],
    ideal: 'Pour les PME en croissance',
  },
  {
    nom: 'PROFESSIONAL',
    prix: '39 900',
    devise: 'XOF / mois',
    badge: '⭐ Recommandé',
    accentBg: '#fdfce6',
    accentBorder: '#FFD000',
    accentBtn: '#FFD000',
    accentTxt: '#111',
    headColor: '#b45309',
    features: [
      '10 agences · agents illimités',
      '5 opérateurs Mobile Money',
      'Tous les modules métier',
      'Comptabilité OHADA complète',
      'Assistant IA SARA inclus',
      'Reporting & BI avancés',
      'KYC & Clients intégrés',
      'API & Intégrations',
      'Support dédié (4h)',
    ],
    ideal: 'Réseaux établis & fintech',
  },
  {
    nom: 'ENTERPRISE',
    prix: 'Sur devis',
    devise: '',
    badge: null,
    accentBg: '#f0f9ff',
    accentBorder: '#bae6fd',
    accentBtn: '#0369a1',
    accentTxt: '#fff',
    headColor: '#0369a1',
    features: [
      'Agences & agents illimités',
      'Multi-pays & multidevise',
      'Personnalisation complète',
      'RH & Paie inclus',
      'KYC & Conformité avancée',
      'SLA garanti 99.9%',
      'Intégration API dédiée',
      'Accompagnement expert dédié',
      'Formation & onboarding',
    ],
    ideal: 'Groupes bancaires & MSB',
  },
];

const FAQ = [
  { q: 'Combien de temps dure l\'essai gratuit ?', r: '14 jours sans carte bancaire. Accès PROFESSIONAL complet. À l\'issue, votre compte passe en lecture seule jusqu\'à souscription.' },
  { q: 'GESTMONEY est-il conforme OHADA ?', r: 'Oui. La comptabilité respecte le plan OHADA. Exports conformes aux exigences UEMOA et CEMAC.' },
  { q: 'Puis-je gérer plusieurs pays ?', r: 'Oui. GESTMONEY supporte la multidevise (XOF, GHS, KES…) et le multi-pays en formule ENTERPRISE.' },
  { q: 'Mes données sont-elles sécurisées ?', r: 'Chiffrement TLS en transit et AES-256 au repos. JWT double token, journaux d\'audit et détection de fraudes IA.' },
  { q: 'Comment fonctionne l\'intégration opérateurs ?', r: 'Adaptateurs natifs Orange, MTN, Wave, Moov, Airtel. Configuration en minutes via l\'espace SuperAdmin.' },
  { q: 'GESTMONEY est-il disponible en anglais ?', r: 'Oui. Interface FR/EN, détection automatique, choix dans les paramètres.' },
  { q: 'Proposez-vous une formation ?', r: 'Formation en ligne, guide complet et assistant SARA inclus. Formation présentielle disponible sur devis.' },
  { q: 'Comment devenir partenaire IBIG ?', r: 'Inscrivez-vous sur ibigpartners.com. Commissions sur chaque client converti. Aucun investissement initial.' },
];

const TEMOIGNAGES = [
  { nom: 'Mamadou Koné', poste: 'Directeur Réseau', entreprise: 'Orange Money CI', texte: 'GESTMONEY a transformé la gestion de nos 300 agents. Les alertes float nous font économiser 4h par jour.', note: 5 },
  { nom: 'Fatoumata Diallo', poste: 'DAF', entreprise: 'MTN MoMo Sénégal', texte: 'La comptabilité OHADA et les exports conformes ont simplifié nos audits annuels du début à la fin.', note: 5 },
  { nom: 'Kwame Asante', poste: 'CEO', entreprise: 'FinTech Ghana', texte: 'Deployed across 5 countries in 3 months. Multi-currency and API integrations are simply outstanding.', note: 5 },
];

// ─── Composants ─────────────────────────────────────────────────
function Stars({ n }: { n: number }) {
  return <span style={{ color: '#FFD000', fontSize: 15 }}>{Array(n).fill('★').join('')}</span>;
}

// ─── Page principale ────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqOuvert, setFaqOuvert] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileMenuOpen(false); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mobileMenuOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  return (
    <div style={{ background: '#f8fef9', color: '#111', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflowX: 'hidden' }}>

      {/* ── BANDE D'ANNONCE ── */}
      <div style={{ background: 'linear-gradient(90deg,#009E00,#00c400)', padding: '9px 16px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
        🎉 Essai gratuit 14 jours — aucune carte bancaire requise.{' '}
        <Link href="/register" style={{ color: '#FFD000', fontWeight: 900, textDecoration: 'underline' }}>Démarrer maintenant →</Link>
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        padding: '0 clamp(16px,4vw,48px)', height: 66,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(248,254,249,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${scrolled ? 'rgba(0,158,0,0.15)' : 'rgba(0,0,0,0.06)'}`,
        boxShadow: scrolled ? '0 2px 16px rgba(0,158,0,0.08)' : 'none',
        transition: 'all .25s',
      }}>
        <Logo variante="compact" theme="clair" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="hidden-mobile">
          {[
            ['#fonctionnalites', 'Fonctionnalités'],
            ['#modules', 'Modules'],
            ['#tarifs', 'Tarifs'],
            ['#faq', 'FAQ'],
            ['#contact', 'Contact'],
          ].map(([href, label]) => (
            <a key={href} href={href} style={{ fontSize: 14, fontWeight: 600, color: '#444', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#009E00')}
              onMouseLeave={e => (e.currentTarget.style.color = '#444')}>
              {label}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="hidden-mobile">
          <Link href="/login" style={{ fontSize: 14, fontWeight: 700, color: '#009E00', textDecoration: 'none', padding: '8px 16px', border: '1.5px solid #009E00', borderRadius: 10 }}>
            Connexion
          </Link>
          <Link href="/register" style={{
            padding: '9px 22px', borderRadius: 10, fontSize: 14, fontWeight: 800,
            background: '#FFD000', color: '#111', textDecoration: 'none',
            boxShadow: '0 2px 12px rgba(255,208,0,0.35)',
          }}>
            Essai gratuit →
          </Link>
        </div>

        <button
          onClick={() => setMobileMenuOpen(v => !v)}
          aria-label="Menu"
          className="show-mobile"
          style={{ background: 'none', border: '1.5px solid #ddd', borderRadius: 8, width: 40, height: 40, cursor: 'pointer', fontSize: 18, color: '#333' }}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* ── MENU MOBILE ── */}
      {mobileMenuOpen && (
        <>
          <div onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }} />
          <div ref={menuRef} style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(300px, 85vw)',
            background: '#fff', zIndex: 201, padding: 24, overflowY: 'auto',
            display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <Logo variante="compact" theme="clair" />
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#666' }}>✕</button>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[['#fonctionnalites','Fonctionnalités'],['#modules','Modules'],['#tarifs','Tarifs'],['#faq','FAQ'],['#contact','Contact']].map(([href,label]) => (
                <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '12px 8px', fontSize: 16, fontWeight: 600, color: '#222', textDecoration: 'none', borderBottom: '1px solid #f0f0f0' }}>
                  {label}
                </a>
              ))}
            </nav>
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 24 }}>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', textAlign: 'center', padding: 13, borderRadius: 10, border: '1.5px solid #009E00', color: '#009E00', textDecoration: 'none', fontWeight: 700 }}>
                Se connecter
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', textAlign: 'center', padding: 13, borderRadius: 10, background: '#FFD000', color: '#111', textDecoration: 'none', fontWeight: 900 }}>
                ⚡ Essai gratuit 14 jours
              </Link>
            </div>
          </div>
        </>
      )}

      {/* ── HERO ── */}
      <section style={{
        minHeight: '92vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', padding: 'clamp(80px,10vh,120px) clamp(16px,4vw,48px) clamp(60px,8vh,100px)',
        background: 'linear-gradient(160deg, #e8fded 0%, #f8fef9 35%, #fffef0 65%, #fff8e1 100%)',
        overflow: 'hidden',
      }}>
        {/* Glows lumineux */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '5%', left: '-10%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,158,0,0.18) 0%, transparent 65%)' }} />
          <div style={{ position: 'absolute', bottom: '0%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,208,0,0.20) 0%, transparent 65%)' }} />
          <div style={{ position: 'absolute', top: '40%', right: '20%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,0,0,0.08) 0%, transparent 70%)' }} />
          {/* Motif géométrique décoratif */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06 }} aria-hidden>
            <defs><pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill="#009E00" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 820, width: '100%', textAlign: 'center' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,158,0,0.10)', border: '1.5px solid rgba(0,158,0,0.25)',
            borderRadius: 999, padding: '7px 18px', marginBottom: 28,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#009E00', display: 'inline-block', boxShadow: '0 0 0 3px rgba(0,158,0,0.2)' }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#009E00', letterSpacing: '.1em', textTransform: 'uppercase' }}>Plateforme SaaS · Afrique · OHADA</span>
          </div>

          <h1 style={{ fontSize: 'clamp(34px, 6vw, 72px)', fontWeight: 900, lineHeight: 1.08, marginBottom: 24, letterSpacing: '-0.03em', color: '#0a2e15' }}>
            Gérez tout votre réseau<br />
            <span style={{ background: 'linear-gradient(90deg, #009E00, #00c400)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Mobile Money</span>
            <br />depuis un seul endroit.
          </h1>

          <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: '#4a6650', lineHeight: 1.7, maxWidth: 600, margin: '0 auto 44px' }}>
            GESTMONEY est la plateforme intelligente de gestion des réseaux Mobile Money en Afrique — agents, float, commissions, comptabilité OHADA et reporting temps réel.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 52 }}>
            <Link href="/register" style={{
              padding: '16px clamp(24px,4vw,40px)', borderRadius: 12, fontSize: 16, fontWeight: 900,
              background: '#FFD000', color: '#111', textDecoration: 'none',
              boxShadow: '0 4px 24px rgba(255,208,0,0.5)', display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              ⚡ Démarrer gratuitement — 14 jours
            </Link>
            <a href="#contact" style={{
              padding: '16px clamp(24px,4vw,40px)', borderRadius: 12, fontSize: 16, fontWeight: 700,
              background: '#fff', border: '1.5px solid #009E00', color: '#009E00', textDecoration: 'none',
              boxShadow: '0 2px 12px rgba(0,158,0,0.10)',
            }}>
              📅 Demander une démo
            </a>
          </div>

          {/* Opérateurs */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {OPS.map(op => (
              <div key={op.nom} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: '#fff', border: `1.5px solid ${op.couleur}33`,
                borderRadius: 999, padding: '6px 14px',
                boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
              }}>
                <span style={{ fontSize: 14 }}>{op.emoji}</span>
                <span style={{ fontSize: 12, color: '#333', fontWeight: 700 }}>{op.nom}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: 'clamp(40px,6vh,60px) clamp(16px,4vw,48px)', background: '#fff', borderTop: '1px solid #e8f5e9', borderBottom: '1px solid #e8f5e9' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              padding: '28px 20px', textAlign: 'center', borderRadius: 16,
              background: s.bg, color: s.txt,
              boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            }}>
              <p style={{ fontSize: 'clamp(30px,4vw,42px)', fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{s.valeur}</p>
              <p style={{ fontSize: 13, marginTop: 6, fontWeight: 700, opacity: 0.85 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PAYS ── */}
      <section style={{ padding: '28px clamp(16px,4vw,48px)', background: '#f0fdf4', borderBottom: '1px solid #d1fae5' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#16a34a', marginBottom: 14, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>Actif dans</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(12px,3vw,32px)', flexWrap: 'wrap' }}>
            {['Côte d\'Ivoire 🇨🇮', 'Sénégal 🇸🇳', 'Ghana 🇬🇭', 'Mali 🇲🇱', 'Bénin 🇧🇯', 'Togo 🇹🇬', 'Kenya 🇰🇪'].map(p => (
              <span key={p} style={{ fontSize: 14, color: '#166534', fontWeight: 700 }}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FONCTIONNALITÉS ── */}
      <section id="fonctionnalites" style={{ padding: 'clamp(70px,10vh,100px) clamp(16px,4vw,48px)', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, letterSpacing: '.15em', color: '#009E00', textTransform: 'uppercase', marginBottom: 12 }}>Fonctionnalités</p>
          <h2 style={{ fontSize: 'clamp(26px,4vw,46px)', fontWeight: 900, textAlign: 'center', marginBottom: 14, color: '#0a2e15', letterSpacing: '-0.02em' }}>
            Tout pour piloter votre réseau.
          </h2>
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 17, marginBottom: 60, maxWidth: 520, margin: '0 auto 60px' }}>
            Une plateforme unique, conçue pour les réalités du terrain africain.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: '#f8fef9', border: '1.5px solid #d1fae5',
                borderRadius: 16, padding: 28,
                boxShadow: '0 2px 8px rgba(0,158,0,0.05)',
                transition: 'box-shadow .2s, transform .2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,158,0,0.12)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,158,0,0.05)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14, fontSize: 24,
                  background: 'linear-gradient(135deg,#e8fded,#d1fae5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                  boxShadow: '0 2px 8px rgba(0,158,0,0.10)',
                }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, color: '#111' }}>{f.titre}</h3>
                <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODULES ── */}
      <section id="modules" style={{ padding: 'clamp(70px,10vh,100px) clamp(16px,4vw,48px)', background: 'linear-gradient(180deg,#f0fdf4 0%,#e8fded 100%)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, letterSpacing: '.15em', color: '#009E00', textTransform: 'uppercase', marginBottom: 12 }}>Modules</p>
          <h2 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 900, textAlign: 'center', marginBottom: 52, color: '#0a2e15', letterSpacing: '-0.02em' }}>
            12 modules intégrés,<br />un seul abonnement.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {MODULES.map((m, i) => (
              <div key={i} style={{
                background: '#fff', border: '1.5px solid #d1fae5',
                borderRadius: 14, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start',
                boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
              }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{m.icon}</span>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, color: '#111' }}>{m.nom}</p>
                  <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OPÉRATEURS ── */}
      <section id="operateurs" style={{ padding: 'clamp(70px,10vh,100px) clamp(16px,4vw,48px)', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.15em', color: '#E60000', textTransform: 'uppercase', marginBottom: 12 }}>Opérateurs supportés</p>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 900, marginBottom: 52, color: '#0a2e15' }}>
            Compatible avec tous les réseaux<br />Mobile Money d&apos;Afrique.
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 18, flexWrap: 'wrap' }}>
            {OPS.map(op => (
              <div key={op.nom} style={{
                background: '#fff', border: `2px solid ${op.couleur}40`,
                borderRadius: 18, padding: 'clamp(20px,3vw,30px) clamp(22px,4vw,40px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                boxShadow: `0 4px 20px ${op.couleur}15`,
                minWidth: 130,
              }}>
                <span style={{ fontSize: 40 }}>{op.emoji}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: op.couleur }}>{op.nom}</span>
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{op.pays}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TARIFS — 4 LICENCES ── */}
      <section id="tarifs" style={{ padding: 'clamp(70px,10vh,100px) clamp(16px,4vw,48px)', background: 'linear-gradient(180deg,#fffef0 0%,#fff8e1 50%,#f8fef9 100%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, letterSpacing: '.15em', color: '#d97706', textTransform: 'uppercase', marginBottom: 12 }}>Tarifs</p>
          <h2 style={{ fontSize: 'clamp(26px,4vw,46px)', fontWeight: 900, textAlign: 'center', marginBottom: 12, color: '#0a2e15', letterSpacing: '-0.02em' }}>
            Des formules claires,<br />adaptées à chaque étape.
          </h2>
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 16, marginBottom: 20 }}>
            ✅ Essai gratuit 14 jours &nbsp;·&nbsp; ✅ Sans carte bancaire &nbsp;·&nbsp; ✅ Résiliation sans frais
          </p>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(90deg,#FFD000,#ffdd40)', color: '#111',
              borderRadius: 999, padding: '9px 22px', fontSize: 14, fontWeight: 900,
              boxShadow: '0 4px 16px rgba(255,208,0,0.4)',
            }}>
              🎁 2 mois offerts sur l&apos;abonnement annuel
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(258px, 1fr))', gap: 20, alignItems: 'start' }}>
            {OFFRES.map((o, i) => (
              <div key={i} style={{
                background: o.accentBg,
                border: `2px solid ${o.accentBorder}`,
                borderRadius: 20, padding: '28px 24px', position: 'relative',
                boxShadow: o.badge ? '0 8px 32px rgba(255,208,0,0.25)' : '0 2px 12px rgba(0,0,0,0.06)',
                transform: o.badge ? 'scale(1.03)' : 'none',
              }}>
                {o.badge && (
                  <div style={{
                    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                    background: '#FFD000', color: '#111', fontSize: 12, fontWeight: 900,
                    padding: '5px 18px', borderRadius: 999, whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(255,208,0,0.4)',
                  }}>{o.badge}</div>
                )}
                <p style={{ fontSize: 13, fontWeight: 800, color: o.headColor, letterSpacing: '.08em', marginBottom: 6, textTransform: 'uppercase' }}>{o.nom}</p>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 18, fontStyle: 'italic' }}>{o.ideal}</p>
                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: o.prix === 'Sur devis' ? 28 : 34, fontWeight: 900, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{o.prix}</span>
                  {o.devise && <span style={{ fontSize: 13, color: '#6b7280', marginLeft: 6 }}>{o.devise}</span>}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {o.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#374151' }}>
                      <span style={{ color: '#009E00', flexShrink: 0, marginTop: 1, fontWeight: 900 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link href={o.prix === 'Sur devis' ? '#contact' : '/register'} style={{
                  display: 'block', textAlign: 'center', padding: '13px',
                  borderRadius: 12, textDecoration: 'none', fontWeight: 800, fontSize: 15,
                  background: o.accentBtn, color: o.accentTxt,
                  boxShadow: `0 4px 16px ${o.accentBtn}40`,
                  transition: 'opacity .15s',
                }}>
                  {o.prix === 'Sur devis' ? 'Nous contacter →' : 'Démarrer l\'essai gratuit →'}
                </Link>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: 36, fontSize: 13, color: '#9ca3af' }}>
            Tarifs HT · TVA selon pays · Paiement mensuel ou annuel (2 mois offerts) · Devis personnalisé disponible
          </p>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ── */}
      <section style={{ padding: 'clamp(70px,10vh,100px) clamp(16px,4vw,48px)', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, letterSpacing: '.15em', color: '#009E00', textTransform: 'uppercase', marginBottom: 12 }}>Témoignages</p>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 900, textAlign: 'center', marginBottom: 56, color: '#0a2e15' }}>
            Ils font confiance à GESTMONEY.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 20 }}>
            {TEMOIGNAGES.map((t, i) => (
              <div key={i} style={{ background: '#f8fef9', border: '1.5px solid #d1fae5', borderRadius: 18, padding: 28, boxShadow: '0 2px 12px rgba(0,158,0,0.06)' }}>
                <Stars n={t.note} />
                <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.75, margin: '16px 0 20px', fontStyle: 'italic' }}>
                  &ldquo;{t.texte}&rdquo;
                </p>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 14, color: '#111' }}>{t.nom}</p>
                  <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{t.poste} · {t.entreprise}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: 'clamp(70px,10vh,100px) clamp(16px,4vw,48px)', background: '#f8fef9' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, letterSpacing: '.15em', color: '#009E00', textTransform: 'uppercase', marginBottom: 12 }}>FAQ</p>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 900, textAlign: 'center', marginBottom: 48, color: '#0a2e15' }}>
            Questions fréquentes.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FAQ.map((item, i) => (
              <div key={i} style={{ background: '#fff', border: '1.5px solid #d1fae5', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <button onClick={() => setFaqOuvert(faqOuvert === i ? null : i)} style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer', color: '#111', textAlign: 'left',
                }}>
                  <span style={{ fontSize: 15, fontWeight: 700, flex: 1, paddingRight: 16 }}>{item.q}</span>
                  <span style={{ fontSize: 20, color: '#009E00', fontWeight: 700, transition: 'transform .2s', transform: faqOuvert === i ? 'rotate(45deg)' : 'none', flexShrink: 0 }}>+</span>
                </button>
                {faqOuvert === i && (
                  <div style={{ padding: '0 22px 20px', fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>{item.r}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTENAIRES ── */}
      <section id="partners" style={{ padding: 'clamp(70px,10vh,100px) clamp(16px,4vw,48px)', background: 'linear-gradient(135deg,#fffef0,#fff8e1)' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>🤝</div>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 900, marginBottom: 16, color: '#0a2e15' }}>
            Développez vos revenus avec{' '}
            <span style={{ color: '#d97706' }}>IBIG PARTNERS</span>
          </h2>
          <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 32, lineHeight: 1.7, maxWidth: 520, margin: '0 auto 32px' }}>
            Rejoignez gratuitement le programme de partenariat IBIG. Commissions attractives sur chaque client converti.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 36 }}>
            {['Inscription gratuite','Commission sur ventes','Espace dédié','Support commercial'].map(b => (
              <span key={b} style={{ background: '#fff', border: '1.5px solid #fde68a', borderRadius: 999, padding: '7px 16px', fontSize: 13, fontWeight: 700, color: '#92400e' }}>✓ {b}</span>
            ))}
          </div>
          <a href="https://ibigpartners.com/" target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '15px 36px', borderRadius: 12, fontSize: 16, fontWeight: 900,
            background: '#FFD000', color: '#111', textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(255,208,0,0.4)',
          }}>
            Devenir partenaire →
          </a>
        </div>
      </section>

      {/* ── CONTACT / DÉMO ── */}
      <section id="contact" style={{ padding: 'clamp(70px,10vh,100px) clamp(16px,4vw,48px)', background: '#fff' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>📅</div>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 900, marginBottom: 12, color: '#0a2e15' }}>
            Demandez une démonstration
          </h2>
          <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 36, lineHeight: 1.7 }}>
            Un expert IBIG Soft vous présente GESTMONEY en 30 minutes.
          </p>
          <form onSubmit={e => { e.preventDefault(); alert('Demande enregistrée ! Notre équipe vous contactera dans les 24h.'); }}
            style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
            {[
              { name: 'prenom', placeholder: 'Prénom *', type: 'text', required: true },
              { name: 'nom', placeholder: 'Nom *', type: 'text', required: true },
              { name: 'entreprise', placeholder: 'Entreprise *', type: 'text', required: true },
              { name: 'email', placeholder: 'Email professionnel *', type: 'email', required: true },
              { name: 'telephone', placeholder: 'Téléphone / WhatsApp', type: 'tel', required: false },
            ].map(f => (
              <input key={f.name} type={f.type} placeholder={f.placeholder} required={f.required} style={{
                width: '100%', background: '#f9fafb', border: '1.5px solid #d1d5db',
                borderRadius: 12, padding: '13px 16px', color: '#111', fontSize: 14, outline: 'none',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
                onFocus={e => { e.currentTarget.style.borderColor = '#009E00'; e.currentTarget.style.background = '#f0fdf4'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#f9fafb'; }}
              />
            ))}
            <textarea placeholder="Décrivez votre projet" rows={3} style={{
              width: '100%', background: '#f9fafb', border: '1.5px solid #d1d5db',
              borderRadius: 12, padding: '13px 16px', color: '#111', fontSize: 14, outline: 'none',
              fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
            }}
              onFocus={e => { e.currentTarget.style.borderColor = '#009E00'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
            <button type="submit" style={{
              padding: '15px', borderRadius: 12, border: 'none',
              background: '#009E00', color: '#fff', fontSize: 16, fontWeight: 900,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(0,158,0,0.3)',
            }}>
              Demander une démo →
            </button>
          </form>
          <p style={{ marginTop: 14, fontSize: 12, color: '#9ca3af' }}>Réponse sous 24h · Aucun engagement · Données protégées</p>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: 'clamp(80px,10vh,120px) clamp(16px,4vw,48px)', textAlign: 'center', background: 'linear-gradient(160deg,#012d10,#009E00 60%,#00c400)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,208,0,0.15) 0%,transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 900, marginBottom: 20, color: '#fff', letterSpacing: '-0.02em' }}>
            Prêt à digitaliser<br />votre réseau Mobile Money ?
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.8)', marginBottom: 44, lineHeight: 1.7 }}>
            Essai gratuit 14 jours · Aucune carte bancaire · Résiliation sans frais.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{
              padding: '16px clamp(24px,4vw,44px)', borderRadius: 12, fontSize: 16, fontWeight: 900,
              background: '#FFD000', color: '#111', textDecoration: 'none',
              boxShadow: '0 4px 24px rgba(255,208,0,0.5)',
            }}>
              ⚡ Démarrer gratuitement →
            </Link>
            <a href="#contact" style={{
              padding: '16px clamp(24px,4vw,44px)', borderRadius: 12, fontSize: 16, fontWeight: 700,
              background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.4)',
              color: '#fff', textDecoration: 'none',
            }}>
              📅 Démo personnalisée
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0a2e15', borderTop: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(40px,6vh,64px) clamp(16px,4vw,48px) 32px', color: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40, marginBottom: 48 }}>
            <div>
              <Logo variante="compact" theme="sombre" />
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 12, lineHeight: 1.6 }}>
                La plateforme intelligente de gestion des réseaux Mobile Money en Afrique.
              </p>
              <p style={{ fontSize: 12, color: '#009E00', marginTop: 8, fontStyle: 'italic' }}>L&apos;excellence est notre passion</p>
            </div>
            {[
              { titre: 'Navigation', liens: [['Fonctionnalités','#fonctionnalites'],['Modules','#modules'],['Tarifs','#tarifs'],['Démonstration','#contact'],['Connexion','/login'],['Créer un compte','/register']] },
              { titre: 'Ressources', liens: [['Centre d\'aide','/dashboard/aide'],['Guide','/dashboard/aide'],['FAQ','#faq'],['Support','/dashboard/support']] },
              { titre: 'IBIG Soft', liens: [['À propos','https://ibigsoft.com'],['IBIG PARTNERS','https://ibigpartners.com/'],['Devenir partenaire','https://ibigpartners.com/'],['Contact','mailto:contact@ibigsoft.com']] },
            ].map(col => (
              <div key={col.titre}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: 'rgba(255,255,255,0.3)', marginBottom: 16, textTransform: 'uppercase' }}>{col.titre}</p>
                {col.liens.map(([label, href]) => (
                  <a key={label} href={href} target={href.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer"
                    style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 10 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#FFD000')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
                    {label}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© {new Date().getFullYear()} GESTMONEY · IBIG Soft — Intermark Business International Group</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Made with ❤️ pour l&apos;Afrique</p>
          </div>
        </div>
      </footer>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { width: 100%; max-width: 100%; margin: 0; overflow-x: hidden; }
        .hidden-mobile { display: flex !important; }
        .show-mobile { display: none !important; }
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        a:focus-visible, button:focus-visible { outline: 2px solid #009E00; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
      `}</style>
    </div>
  );
}
