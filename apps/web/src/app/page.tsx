'use client';
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

// ─── Données ───────────────────────────────────────────────────
const FEATURES = [
  { icon: '↔️', titre: 'Multi-opérateurs', desc: 'Orange Money, MTN MoMo, Wave, Moov, Airtel — tous vos réseaux dans une seule plateforme unifiée.' },
  { icon: '🔒', titre: '100% sécurisé', desc: 'Authentification JWT renforcée, chiffrement de bout en bout, journaux d\'audit et détection de fraudes.' },
  { icon: '📊', titre: 'Reporting temps réel', desc: 'Tableaux de bord live via WebSocket, alertes float intelligentes et rapports BI exportables PDF/XLSX.' },
  { icon: '🏪', titre: 'Réseau d\'agences', desc: 'Gérez agents, agences, points de vente et territoires depuis un espace centralisé et géolocalisé.' },
  { icon: '💰', titre: 'Commissions automatisées', desc: 'Calcul automatique, paliers configurables, validation et paiement des commissions en quelques clics.' },
  { icon: '🤖', titre: 'Assistant IA SARA', desc: 'Alertes prédictives, recommandations de réapprovisionnement float et détection d\'anomalies en continu.' },
  { icon: '📦', titre: 'Gestion du float', desc: 'Suivi des soldes par réseau, seuils d\'alerte automatiques et demandes de réapprovisionnement intégrées.' },
  { icon: '🧾', titre: 'Comptabilité intégrée', desc: 'Plan comptable OHADA, journal d\'entrées, grand livre, bilan et clôture d\'exercice.' },
  { icon: '👥', titre: 'Ressources humaines', desc: 'Gestion des employés, contrats, feuilles de paie, congés et présences dans un module RH complet.' },
];

const MODULES = [
  { nom: 'Transactions', icon: '💳', desc: 'Dépôts, retraits, transferts, paiements — toutes les opérations' },
  { nom: 'Float Management', icon: '🏦', desc: 'Soldes, mouvements, seuils, réapprovisionnements' },
  { nom: 'Réseau Agents', icon: '👤', desc: 'Hiérarchie agent / super-agent / agence' },
  { nom: 'Commissions', icon: '💵', desc: 'Plans, calcul, validation, paiements automatisés' },
  { nom: 'Clients & KYC', icon: '🪪', desc: 'Fiche client, vérification d\'identité, fidélité' },
  { nom: 'Caisse', icon: '🏧', desc: 'Gestion caisse et coffre par agence' },
  { nom: 'Comptabilité', icon: '📒', desc: 'Plan comptable OHADA, grand livre, bilan' },
  { nom: 'Reporting & BI', icon: '📈', desc: 'Tableaux de bord, exports, rapports planifiés' },
  { nom: 'Stock', icon: '📦', desc: 'Inventaire, produits, mouvements, fournisseurs' },
  { nom: 'RH & Paie', icon: '👥', desc: 'Employés, contrats, paie, congés, présences' },
  { nom: 'Audit & Sécurité', icon: '🔍', desc: 'Journal d\'audit complet, alertes fraudes' },
  { nom: 'Intégrations API', icon: '🔌', desc: 'Connexion directe aux API des opérateurs' },
];

const STATS = [
  { valeur: '10 000+', label: 'Transactions / jour', couleur: '#009E00' },
  { valeur: '500+', label: 'Agences gérées', couleur: '#FFD000' },
  { valeur: '5', label: 'Opérateurs intégrés', couleur: '#E60000' },
  { valeur: '99.9%', label: 'Disponibilité SLA', couleur: '#fff' },
];

const OPS = [
  { nom: 'Orange Money', couleur: '#FF6B00', emoji: '🟠', pays: 'CI · SN · ML · CM' },
  { nom: 'MTN MoMo', couleur: '#FFD000', emoji: '🟡', pays: 'GH · NG · CM · BJ' },
  { nom: 'Wave', couleur: '#0099FF', emoji: '🔵', pays: 'CI · SN · ML' },
  { nom: 'Moov Money', couleur: '#009E00', emoji: '🟢', pays: 'BJ · TG · BF · GA' },
  { nom: 'Airtel Money', couleur: '#E60000', emoji: '🔴', pays: 'KE · TZ · RW · ZM' },
];

const OFFRES = [
  {
    nom: 'STARTER',
    prix: '49 000',
    devise: 'XOF/mois',
    badge: null,
    couleur: '#ffffff',
    features: [
      '1 agence · jusqu\'à 5 agents',
      '2 opérateurs Mobile Money',
      'Transactions & Float',
      'Commissions automatiques',
      'Rapports mensuels',
      'Support email',
    ],
  },
  {
    nom: 'PROFESSIONAL',
    prix: '149 000',
    devise: 'XOF/mois',
    badge: 'Recommandé',
    couleur: '#FFD000',
    features: [
      '10 agences · agents illimités',
      '5 opérateurs Mobile Money',
      'Tous les modules métier',
      'Comptabilité OHADA',
      'Rapports & BI avancés',
      'Assistant IA SARA',
      'Export PDF / XLSX',
      'Support prioritaire',
    ],
  },
  {
    nom: 'ENTERPRISE',
    prix: 'Sur devis',
    devise: '',
    badge: null,
    couleur: '#009E00',
    features: [
      'Agences illimitées',
      'Multi-pays & multidevise',
      'Personnalisation complète',
      'Intégration API dédiée',
      'RH & Paie inclus',
      'KYC & Conformité',
      'SLA garanti 99.9%',
      'Accompagnement dédié',
    ],
  },
];

const FAQ = [
  { q: 'Combien de temps dure l\'essai gratuit ?', r: '14 jours, sans carte bancaire. Accès à toutes les fonctionnalités PROFESSIONAL. À l\'issue de la période, votre compte passe en lecture seule jusqu\'à souscription.' },
  { q: 'GESTMONEY est-il conforme aux réglementations OHADA ?', r: 'Oui. La comptabilité intégrée respecte le plan comptable OHADA. Les exports et états financiers sont conformes aux exigences des autorités monétaires de l\'UEMOA et de la CEMAC.' },
  { q: 'Puis-je gérer plusieurs pays depuis une seule plateforme ?', r: 'Oui. GESTMONEY supporte la multidevise (XOF, GHS, KES, NGN…) et le multi-pays dans la formule ENTERPRISE. Chaque entité est isolée avec ses propres données et permissions.' },
  { q: 'Mes données sont-elles sécurisées ?', r: 'GESTMONEY utilise le chiffrement TLS en transit et AES-256 au repos. L\'authentification JWT avec double token, les journaux d\'audit complets et la détection de fraudes par IA protègent vos données 24h/24.' },
  { q: 'Comment fonctionne l\'intégration avec les opérateurs ?', r: 'Des adaptateurs natifs sont disponibles pour Orange Money, MTN MoMo, Wave, Moov et Airtel. L\'intégration se configure en quelques minutes via l\'espace SuperAdmin sans développement.' },
  { q: 'GESTMONEY est-il disponible en anglais ?', r: 'Oui. L\'interface est disponible en français et en anglais. La détection automatique de langue est activée, et chaque utilisateur peut choisir sa langue dans ses paramètres.' },
  { q: 'Proposez-vous une formation ?', r: 'Oui. Une formation en ligne, un guide utilisateur complet et un accès à l\'assistant SARA sont inclus dans toutes les formules. Une formation présentielle est disponible sur devis.' },
  { q: 'Comment devenir partenaire IBIG ?', r: 'Inscrivez-vous gratuitement sur ibigpartners.com. En tant que partenaire, vous recommandez GESTMONEY et recevez des commissions sur chaque client converti. Aucun investissement initial requis.' },
];

const TEMOIGNAGES = [
  { nom: 'Mamadou Koné', poste: 'Directeur Réseau', entreprise: 'Orange Money CI', texte: 'GESTMONEY a transformé la gestion de nos 300 agents. Les rapports temps réel et les alertes float nous font économiser 4h de travail par jour.', note: 5 },
  { nom: 'Fatoumata Diallo', poste: 'DAF', entreprise: 'MTN MoMo Sénégal', texte: 'Enfin une solution qui parle OHADA. La comptabilité intégrée et les exports PDF conformes nous ont simplifié nos audits annuels.', note: 5 },
  { nom: 'Kwame Asante', poste: 'CEO', entreprise: 'FinTech GH', texte: 'We deployed GESTMONEY across 5 countries in 3 months. The multi-currency support and API integrations are simply outstanding.', note: 5 },
];

// ─── Composants helpers ─────────────────────────────────────────
function Stars({ n }: { n: number }) {
  return <span style={{ color: '#FFD000', fontSize: 14 }}>{Array(n).fill('★').join('')}</span>;
}

function SectionBadge({ couleur, texte }: { couleur: string; texte: string }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: couleur, textAlign: 'center', marginBottom: 16 }}>
      {texte}
    </p>
  );
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

  // Fermer le menu mobile si on clique en dehors
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileMenuOpen(false); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mobileMenuOpen]);

  // Bloquer le scroll body quand menu ouvert
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div style={{ background: '#07110a', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflowX: 'hidden' }}>

      {/* ── BARRE D'ANNONCE ── */}
      <div style={{ background: '#009E00', padding: '8px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600 }}>
        🎉 Essai gratuit 14 jours — aucune carte bancaire requise.{' '}
        <Link href="/login" style={{ color: '#fff', fontWeight: 900, textDecoration: 'underline' }}>Démarrer maintenant →</Link>
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'sticky', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 clamp(16px, 4vw, 40px)', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(7,17,10,0.95)' : 'rgba(7,17,10,0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        transition: 'background .25s',
      }}>
        <Logo variante="compact" theme="sombre" />

        {/* Nav desktop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="hidden-mobile">
          {[
            ['#fonctionnalites', 'Fonctionnalités'],
            ['#modules', 'Modules'],
            ['#tarifs', 'Tarifs'],
            ['#faq', 'FAQ'],
            ['#contact', 'Contact'],
          ].map(([href, label]) => (
            <a key={href} href={href} style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>
              {label}
            </a>
          ))}
        </div>

        {/* CTA desktop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="hidden-mobile">
          <Link href="/login" style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', padding: '7px 14px' }}>
            Connexion
          </Link>
          <Link href="/login" style={{
            padding: '8px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
            background: '#FFD000', color: '#111', textDecoration: 'none',
          }}>
            Essai gratuit
          </Link>
        </div>

        {/* Hamburger mobile */}
        <button
          onClick={() => setMobileMenuOpen(v => !v)}
          aria-label="Menu"
          aria-expanded={mobileMenuOpen}
          className="show-mobile"
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
            width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 20,
          }}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* ── MENU MOBILE DRAWER ── */}
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            onClick={closeMobileMenu}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 }}
          />
          {/* Panneau */}
          <div
            ref={menuRef}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(320px, 85vw)',
              background: '#0d1a0f', zIndex: 201, overflowY: 'auto',
              display: 'flex', flexDirection: 'column', padding: 24,
              boxShadow: '-4px 0 24px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <Logo variante="compact" theme="sombre" />
              <button onClick={closeMobileMenu} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                ['#fonctionnalites', 'Fonctionnalités'],
                ['#modules', 'Modules'],
                ['#tarifs', 'Tarifs'],
                ['#faq', 'FAQ'],
                ['#contact', 'Contact'],
                ['#partners', 'Devenir partenaire'],
              ].map(([href, label]) => (
                <a key={href} href={href} onClick={closeMobileMenu} style={{
                  display: 'block', padding: '14px 16px', borderRadius: 12,
                  color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: 16, fontWeight: 600,
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                  {label}
                </a>
              ))}
            </nav>
            <div style={{ marginTop: 'auto', paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/login" onClick={closeMobileMenu} style={{
                display: 'block', textAlign: 'center', padding: '13px', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.2)', color: '#fff', textDecoration: 'none',
                fontSize: 15, fontWeight: 700,
              }}>
                Se connecter
              </Link>
              <Link href="/login" onClick={closeMobileMenu} style={{
                display: 'block', textAlign: 'center', padding: '13px', borderRadius: 12,
                background: '#FFD000', color: '#111', textDecoration: 'none',
                fontSize: 15, fontWeight: 900,
              }}>
                ⚡ Essai gratuit 14 jours
              </Link>
            </div>
            <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 20 }}>
              © 2026 GESTMONEY · IBIG Soft
            </p>
          </div>
        </>
      )}

      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 'clamp(100px,12vh,140px) clamp(16px,4vw,40px) clamp(60px,8vh,100px)' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-5%', left: '-8%', width: 'clamp(300px, 50vw, 600px)', height: 'clamp(300px, 50vw, 600px)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,158,0,0.14) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: 'clamp(200px, 40vw, 500px)', height: 'clamp(200px, 40vw, 500px)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,208,0,0.09) 0%, transparent 70%)' }} />
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04 }}>
            <defs><pattern id="grid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.5" fill="#fff" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, width: '100%', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,158,0,0.12)', border: '1px solid rgba(0,158,0,0.25)',
            borderRadius: 999, padding: '6px 16px', marginBottom: 32,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#009E00', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#009E00', letterSpacing: '.06em' }}>PLATEFORME CLOUD SAAS · AFRIQUE · ESPACE OHADA</span>
          </div>

          <h1 style={{ fontSize: 'clamp(32px, 6vw, 68px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.02em' }}>
            Gérez tout votre réseau<br />
            <span style={{ color: '#FFD000' }}>Mobile Money</span><br />
            <span style={{ color: '#009E00' }}>depuis un seul endroit.</span>
          </h1>

          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 580, margin: '0 auto 40px' }}>
            GESTMONEY est la plateforme SaaS intelligente de gestion des réseaux Mobile Money en Afrique — agents, float, commissions, comptabilité OHADA et reporting en temps réel.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link href="/login" style={{
              padding: 'clamp(12px,2vh,15px) clamp(20px,4vw,36px)', borderRadius: 12,
              fontSize: 'clamp(14px,1.5vw,16px)', fontWeight: 900,
              background: '#FFD000', color: '#111', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              Accéder à la plateforme →
            </Link>
            <a href="#contact" style={{
              padding: 'clamp(12px,2vh,15px) clamp(20px,4vw,36px)', borderRadius: 12,
              fontSize: 'clamp(14px,1.5vw,16px)', fontWeight: 700,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', textDecoration: 'none',
            }}>
              📅 Demander une démo
            </a>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {OPS.map(op => (
              <div key={op.nom} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 999, padding: '5px 12px',
              }}>
                <span style={{ fontSize: 13 }}>{op.emoji}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>{op.nom}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: '0 clamp(16px,4vw,40px) 80px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              padding: '28px 20px', textAlign: 'center',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14,
            }}>
              <p style={{ fontSize: 'clamp(28px,4vw,38px)', fontWeight: 900, color: s.couleur, fontVariantNumeric: 'tabular-nums' }}>{s.valeur}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 6, fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PREUVES DE CONFIANCE ── */}
      <section style={{ padding: '40px clamp(16px,4vw,40px)', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 20, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' }}>Confiance établie dans</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(16px,4vw,40px)', flexWrap: 'wrap', alignItems: 'center' }}>
            {['Côte d\'Ivoire 🇨🇮', 'Sénégal 🇸🇳', 'Ghana 🇬🇭', 'Mali 🇲🇱', 'Bénin 🇧🇯', 'Togo 🇹🇬', 'Kenya 🇰🇪'].map(p => (
              <span key={p} style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FONCTIONNALITÉS ── */}
      <section id="fonctionnalites" style={{ padding: 'clamp(60px,8vh,100px) clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <SectionBadge couleur="#FFD000" texte="Fonctionnalités" />
          <h2 style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 900, textAlign: 'center', marginBottom: 16, letterSpacing: '-0.02em' }}>
            Tout ce dont vous avez besoin<br />
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>pour piloter votre réseau.</span>
          </h2>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 16, marginBottom: 56, maxWidth: 500, margin: '0 auto 56px' }}>
            Une plateforme unique, conçue pour les réalités du terrain africain.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: 28,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'rgba(255,208,0,0.08)', border: '1px solid rgba(255,208,0,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16,
                }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>{f.titre}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODULES ── */}
      <section id="modules" style={{ padding: 'clamp(60px,8vh,100px) clamp(16px,4vw,40px)', background: 'rgba(0,0,0,0.15)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <SectionBadge couleur="#009E00" texte="Modules" />
          <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, textAlign: 'center', marginBottom: 48, letterSpacing: '-0.02em' }}>
            12 modules intégrés, un seul abonnement.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {MODULES.map((m, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '20px 20px', display: 'flex', gap: 14, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{m.icon}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{m.nom}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OPÉRATEURS ── */}
      <section id="operateurs" style={{ padding: 'clamp(60px,8vh,100px) clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <SectionBadge couleur="#E60000" texte="Opérateurs supportés" />
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 900, marginBottom: 48, letterSpacing: '-0.02em' }}>
            Compatible avec tous les réseaux<br />Mobile Money d&apos;Afrique.
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            {OPS.map(op => (
              <div key={op.nom} style={{
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${op.couleur}33`,
                borderRadius: 16, padding: 'clamp(16px,3vw,28px) clamp(20px,4vw,36px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, minWidth: 120,
              }}>
                <span style={{ fontSize: 36 }}>{op.emoji}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: op.couleur }}>{op.nom}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{op.pays}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TARIFS ── */}
      <section id="tarifs" style={{ padding: 'clamp(60px,8vh,100px) clamp(16px,4vw,40px)', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <SectionBadge couleur="#FFD000" texte="Tarifs" />
          <h2 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 900, textAlign: 'center', marginBottom: 12, letterSpacing: '-0.02em' }}>
            Des formules adaptées à chaque réseau.
          </h2>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 15, marginBottom: 56 }}>
            Essai gratuit 14 jours · Sans carte bancaire · Résiliation sans frais
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'start' }}>
            {OFFRES.map((o, i) => (
              <div key={i} style={{
                background: o.badge ? 'rgba(255,208,0,0.05)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${o.badge ? 'rgba(255,208,0,0.3)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 20, padding: 28, position: 'relative',
              }}>
                {o.badge && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: '#FFD000', color: '#111', fontSize: 11, fontWeight: 900,
                    padding: '4px 14px', borderRadius: 999, letterSpacing: '.05em',
                  }}>{o.badge}</div>
                )}
                <p style={{ fontSize: 12, fontWeight: 700, color: o.couleur, letterSpacing: '.1em', marginBottom: 12 }}>{o.nom}</p>
                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{o.prix}</span>
                  {o.devise && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginLeft: 6 }}>{o.devise}</span>}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {o.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                      <span style={{ color: '#009E00', flexShrink: 0, marginTop: 1 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link href="/login" style={{
                  display: 'block', textAlign: 'center', padding: '12px',
                  borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 14,
                  background: o.badge ? '#FFD000' : 'rgba(255,255,255,0.08)',
                  color: o.badge ? '#111' : '#fff',
                  border: o.badge ? 'none' : '1px solid rgba(255,255,255,0.15)',
                }}>
                  {o.prix === 'Sur devis' ? 'Nous contacter' : 'Démarrer l\'essai gratuit'}
                </Link>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: 32, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
            Tarifs HT. TVA selon pays. Paiement mensuel ou annuel (–15%). Devis personnalisé disponible.
          </p>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ── */}
      <section style={{ padding: 'clamp(60px,8vh,100px) clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <SectionBadge couleur="#009E00" texte="Témoignages" />
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 900, textAlign: 'center', marginBottom: 48, letterSpacing: '-0.02em' }}>
            Ils font confiance à GESTMONEY.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {TEMOIGNAGES.map((t, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: 28,
              }}>
                <Stars n={t.note} />
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: '16px 0 20px', fontStyle: 'italic' }}>
                  &ldquo;{t.texte}&rdquo;
                </p>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14 }}>{t.nom}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{t.poste} · {t.entreprise}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: 'clamp(60px,8vh,100px) clamp(16px,4vw,40px)', background: 'rgba(0,0,0,0.15)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <SectionBadge couleur="#FFD000" texte="FAQ" />
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 900, textAlign: 'center', marginBottom: 48, letterSpacing: '-0.02em' }}>
            Questions fréquentes.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FAQ.map((item, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14, overflow: 'hidden',
              }}>
                <button
                  onClick={() => setFaqOuvert(faqOuvert === i ? null : i)}
                  style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer',
                    color: '#fff', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 700, flex: 1, paddingRight: 16 }}>{item.q}</span>
                  <span style={{ fontSize: 18, color: '#FFD000', flexShrink: 0, transition: 'transform .2s', transform: faqOuvert === i ? 'rotate(45deg)' : 'none' }}>+</span>
                </button>
                {faqOuvert === i && (
                  <div style={{ padding: '0 22px 20px', fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
                    {item.r}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PWA ── */}
      <section style={{ padding: 'clamp(60px,8vh,100px) clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>📱</div>
          <SectionBadge couleur="#009E00" texte="Application mobile" />
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 900, marginBottom: 16, letterSpacing: '-0.02em' }}>
            Installez GESTMONEY sur votre appareil.
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 32, lineHeight: 1.7 }}>
            GESTMONEY est une Progressive Web App (PWA) installable sur Android, Windows, iPhone et tablette — sans passer par un store.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            {['Android 📲', 'Windows 💻', 'iPhone 🍎', 'iPad 📋'].map(p => (
              <span key={p} style={{
                background: 'rgba(0,158,0,0.1)', border: '1px solid rgba(0,158,0,0.25)',
                borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: '#009E00',
              }}>{p}</span>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
            Un bouton &ldquo;Installer l&apos;application&rdquo; apparaît automatiquement dans votre navigateur.
          </p>
        </div>
      </section>

      {/* ── IBIG PARTNERS ── */}
      <section id="partners" style={{ padding: 'clamp(60px,8vh,100px) clamp(16px,4vw,40px)', background: 'rgba(255,208,0,0.04)', borderTop: '1px solid rgba(255,208,0,0.08)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🤝</div>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 900, marginBottom: 16, letterSpacing: '-0.02em' }}>
            Développez vos revenus avec{' '}
            <span style={{ color: '#FFD000' }}>IBIG PARTNERS</span>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', marginBottom: 32, lineHeight: 1.7, maxWidth: 540, margin: '0 auto 32px' }}>
            Rejoignez gratuitement le programme de partenariat IBIG et recommandez les solutions du groupe à votre réseau. Recevez des commissions attractives sur chaque client converti.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 36 }}>
            {['Inscription gratuite', 'Commission sur ventes', 'Espace partenaire dédié', 'Support commercial'].map(b => (
              <span key={b} style={{
                background: 'rgba(255,208,0,0.1)', border: '1px solid rgba(255,208,0,0.2)',
                borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: '#FFD000',
              }}>✓ {b}</span>
            ))}
          </div>
          <a
            href="https://ibigpartners.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 900,
              background: '#FFD000', color: '#111', textDecoration: 'none',
            }}
          >
            Devenir partenaire →
          </a>
          <p style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            Aucun investissement requis · Aucun revenu garanti
          </p>
        </div>
      </section>

      {/* ── AUTRES LOGICIELS IBIG SOFT ── */}
      <section style={{ padding: 'clamp(60px,8vh,100px) clamp(16px,4vw,40px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <SectionBadge couleur="#009E00" texte="Groupe IBIG Soft" />
          <h2 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 900, marginBottom: 40, letterSpacing: '-0.02em' }}>
            Découvrez les autres solutions IBIG Soft
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { nom: 'GESTSALARY', secteur: 'RH & Paie', desc: 'Paie, congés, présences — OHADA' },
              { nom: 'GESTSTORE', secteur: 'Commerce', desc: 'Caisse, stock, clients — retail' },
              { nom: 'GESTAGRI', secteur: 'Agriculture', desc: 'Coopératives, intrants, récoltes' },
            ].map((s, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14, padding: 24, textAlign: 'left',
              }}>
                <p style={{ fontSize: 11, color: '#009E00', fontWeight: 700, marginBottom: 6, letterSpacing: '.1em' }}>{s.secteur}</p>
                <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>{s.nom}</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 16, lineHeight: 1.5 }}>{s.desc}</p>
                <a href="https://ibigsoft.com" target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, color: '#FFD000', textDecoration: 'none', fontWeight: 700 }}>
                  Découvrir →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMANDE DE DÉMO ── */}
      <section id="contact" style={{ padding: 'clamp(60px,8vh,100px) clamp(16px,4vw,40px)', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📅</div>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 900, marginBottom: 12, letterSpacing: '-0.02em' }}>
            Demandez une démonstration
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 36, lineHeight: 1.7 }}>
            Un expert IBIG Soft vous présente GESTMONEY en 30 minutes, en ligne, adapté à votre contexte.
          </p>
          <form
            onSubmit={e => { e.preventDefault(); alert('Demande enregistrée ! Notre équipe vous contactera dans les 24h.'); }}
            style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}
          >
            {[
              { name: 'prenom', placeholder: 'Prénom *', type: 'text', required: true },
              { name: 'nom', placeholder: 'Nom *', type: 'text', required: true },
              { name: 'entreprise', placeholder: 'Entreprise *', type: 'text', required: true },
              { name: 'email', placeholder: 'Email professionnel *', type: 'email', required: true },
              { name: 'telephone', placeholder: 'Téléphone / WhatsApp', type: 'tel', required: false },
            ].map(f => (
              <input
                key={f.name}
                type={f.type}
                placeholder={f.placeholder}
                required={f.required}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
                  padding: '13px 16px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            ))}
            <textarea
              placeholder="Décrivez votre projet ou vos besoins"
              rows={3}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
                padding: '13px 16px', color: '#fff', fontSize: 14, outline: 'none',
                fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '14px', borderRadius: 12, border: 'none',
                background: '#FFD000', color: '#111', fontSize: 15, fontWeight: 900,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Demander une démo →
            </button>
          </form>
          <p style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            Réponse sous 24h · Aucun engagement · Données protégées
          </p>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: 'clamp(80px,10vh,120px) clamp(16px,4vw,40px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,208,0,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, marginBottom: 20, letterSpacing: '-0.02em' }}>
            Prêt à digitaliser<br />votre réseau Mobile Money ?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 40, lineHeight: 1.7 }}>
            Essai gratuit 14 jours. Aucune carte bancaire. Résiliation sans frais.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" style={{
              padding: '15px clamp(24px,4vw,40px)', borderRadius: 12, fontSize: 'clamp(14px,1.5vw,16px)', fontWeight: 900,
              background: '#FFD000', color: '#111', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              Démarrer gratuitement →
            </Link>
            <a href="#contact" style={{
              padding: '15px clamp(24px,4vw,40px)', borderRadius: 12, fontSize: 'clamp(14px,1.5vw,16px)', fontWeight: 700,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', textDecoration: 'none',
            }}>
              📅 Démo personnalisée
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER COMPLET ── */}
      <footer style={{ background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(255,255,255,0.07)', padding: 'clamp(40px,6vh,64px) clamp(16px,4vw,40px) 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Grille colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40, marginBottom: 48 }}>
            {/* Colonne Logiciel */}
            <div>
              <Logo variante="compact" theme="sombre" />
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 12, lineHeight: 1.6 }}>
                La plateforme intelligente de gestion des réseaux Mobile Money en Afrique.
              </p>
              <p style={{ fontSize: 12, color: '#009E00', marginTop: 8, fontStyle: 'italic' }}>L&apos;excellence est notre passion</p>
            </div>
            {/* Colonne Navigation */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: 'rgba(255,255,255,0.3)', marginBottom: 16, textTransform: 'uppercase' }}>Navigation</p>
              {['Fonctionnalités#fonctionnalites', 'Modules#modules', 'Tarifs#tarifs', 'Démonstration#contact', 'Connexion/login', 'Essai gratuit/login'].map(item => {
                const [label, href] = item.split('/').length > 1 ? [item.split('/')[0], '/'+item.split('/')[1]] : [item.split('#')[0], '#'+item.split('#')[1]];
                return (
                  <a key={item} href={href} style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', marginBottom: 10 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}>
                    {label}
                  </a>
                );
              })}
            </div>
            {/* Colonne Ressources */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: 'rgba(255,255,255,0.3)', marginBottom: 16, textTransform: 'uppercase' }}>Ressources</p>
              {[
                ['Centre d\'aide', '/dashboard/aide'],
                ['Guide utilisateur', '/dashboard/aide'],
                ['FAQ', '#faq'],
                ['Support', '/dashboard/support'],
                ['Documents légaux', '/legal'],
              ].map(([label, href]) => (
                <a key={label} href={href} style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', marginBottom: 10 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}>
                  {label}
                </a>
              ))}
            </div>
            {/* Colonne IBIG Soft */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: 'rgba(255,255,255,0.3)', marginBottom: 16, textTransform: 'uppercase' }}>IBIG Soft</p>
              {[
                ['À propos', 'https://ibigsoft.com'],
                ['Autres logiciels', 'https://ibigsoft.com'],
                ['IBIG PARTNERS', 'https://ibigpartners.com/'],
                ['Devenir partenaire', 'https://ibigpartners.com/'],
                ['Contact', 'mailto:contact@ibigsoft.com'],
              ].map(([label, href]) => (
                <a key={label} href={href} target={href.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer"
                  style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', marginBottom: 10 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}>
                  {label}
                </a>
              ))}
            </div>
            {/* Colonne Légal */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: 'rgba(255,255,255,0.3)', marginBottom: 16, textTransform: 'uppercase' }}>Légal</p>
              {[
                ['Mentions légales', '/legal/mentions-legales'],
                ['CGU', '/legal/cgu'],
                ['Confidentialité', '/legal/confidentialite'],
                ['Cookies', '/legal/cookies'],
                ['Conditions SARA', '/legal/sara'],
                ['Conditions essai', '/legal/essai'],
              ].map(([label, href]) => (
                <a key={label} href={href} style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', marginBottom: 10 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}>
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Séparateur */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginBottom: 4 }}>
                © {new Date().getFullYear()} GESTMONEY. Tous droits réservés.
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>
                Logiciel conçu, édité et exploité par IBIG Soft, une marque de IBIG SARL – Intermark Business International Group.
              </p>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>Made with ❤️ pour l&apos;Afrique</p>
          </div>
        </div>
      </footer>

      {/* ── STYLES RESPONSIVE ── */}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { width: 100%; max-width: 100%; margin: 0; overflow-x: hidden; }
        .hidden-mobile { display: flex !important; }
        .show-mobile { display: none !important; }
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        a:focus-visible, button:focus-visible { outline: 2px solid #FFD000; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
      `}</style>
    </div>
  );
}
