'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { FooterGestmoney } from '@/components/landing/FooterGestmoney';
import { HeaderLanding } from '@/components/landing/HeaderLanding';
import { PreuvesConfianceSection } from '@/components/landing/PreuvesConfianceSection';
import { IBIGPartnersSection } from '@/components/landing/IBIGPartnersSection';
import { CTAFinalSection } from '@/components/landing/CTAFinalSection';
import { SARAfloatingButton } from '@/components/landing/SARAfloatingButton';
import { WhatsAppFlottant } from '@/components/landing/WhatsAppFlottant';
import { BandeauInfo } from '@/components/landing/BandeauInfo';
import { ProblèmesRésolusSection } from '@/components/landing/ProblèmesRésolusSection';
import { DemoInteractive } from '@/components/landing/DemoInteractive';
import { BénéficesMajeursSection } from '@/components/landing/BénéficesMajeursSection';
import { PublicsConcernésSection } from '@/components/landing/PublicsConcernésSection';
import { SécuritéVitrineSection } from '@/components/landing/SécuritéVitrineSection';
import { AvantagesIBIGSection } from '@/components/landing/AvantagesIBIGSection';
import { IntégrationsSectionComponent } from '@/components/landing/IntégrationsSectionComponent';
import { OffreComparateurSection } from '@/components/landing/OffreComparateurSection';
import { TémoignagesSection } from '@/components/landing/TémoignagesSection';
import { FAQSection } from '@/components/landing/FAQSection';

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
  { nom: 'Orange Money', couleur: '#FF6B00', emoji: '🟠', pays: 'CI · SN · ML · BF · CM · GN · CD' },
  { nom: 'MTN MoMo', couleur: '#FFCC00', emoji: '🟡', pays: 'CI · BJ · GN · CM · GH · CG' },
  { nom: 'Moov Money / Flooz', couleur: '#0066CC', emoji: '🔵', pays: 'BJ · TG · CI · BF · NE · TD' },
  { nom: 'Wave', couleur: '#00A0E4', emoji: '🌊', pays: 'CI · SN · ML · BF · GM' },
  { nom: 'Airtel Money', couleur: '#E60000', emoji: '🔴', pays: 'TD · GA · CG · CD · NE' },
  { nom: 'Free Money', couleur: '#7B2CBF', emoji: '🟣', pays: 'SN' },
  { nom: 'Wizall Money', couleur: '#00A651', emoji: '🟢', pays: 'SN · CI · ML' },
  { nom: 'T-Money (Togocom)', couleur: '#C1272D', emoji: '🟤', pays: 'TG' },
  { nom: 'Express Union', couleur: '#1D3F94', emoji: '🔷', pays: 'CM · CF · TD' },
  { nom: 'Celtiis Cash', couleur: '#00843D', emoji: '🟩', pays: 'BJ' },
  { nom: 'Djamo', couleur: '#5B2A86', emoji: '🟪', pays: 'CI · SN' },
  { nom: 'Sank Money', couleur: '#F7941D', emoji: '🟧', pays: 'BF' },
];

// Slides rotatifs du hero (défilement fluide)
const HERO_SLIDES = [
  { mot: 'Mobile Money', couleur: '#009E00', accroche: 'Agents, float, commissions, comptabilité OHADA et reporting temps réel.' },
  { mot: 'vos agents', couleur: '#d97706', accroche: 'Hiérarchie agents, super-agents et agences pilotée depuis un seul écran.' },
  { mot: 'votre float', couleur: '#0369a1', accroche: 'Soldes par opérateur, seuils d\'alerte et réapprovisionnements automatisés.' },
  { mot: 'vos commissions', couleur: '#E60000', accroche: 'Calcul automatique, paliers configurables, validation et paiement en un clic.' },
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
      '1 agence · jusqu\'à 3 agents',
      '4 opérateurs Mobile Money',
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
      '3 agences · jusqu\'à 15 agents',
      '6 opérateurs Mobile Money',
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
      'Opérateurs Mobile Money illimités',
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

// Moyens de paiement pris en charge par le module d'abonnement
const MOYENS_PAIEMENT = [
  {
    icon: '📱',
    titre: 'Mobile Money',
    couleur: '#FF6B00',
    fond: '#fff7ed',
    bordure: '#fed7aa',
    detail: 'Orange Money, MTN MoMo, Wave, Moov, Airtel Money',
  },
  {
    icon: '💳',
    titre: 'Carte bancaire & passerelles',
    couleur: '#0369a1',
    fond: '#f0f9ff',
    bordure: '#bae6fd',
    detail: 'CinetPay, Moneroo, FedaPay, Paystack, Stripe, PayPal',
  },
  {
    icon: '🏦',
    titre: 'Virement bancaire',
    couleur: '#009E00',
    fond: '#f0fdf4',
    bordure: '#bbf7d0',
    detail: 'Virement national et international (SWIFT / IBAN)',
  },
  {
    icon: '🌍',
    titre: 'Transfert d\'argent',
    couleur: '#7B2CBF',
    fond: '#faf5ff',
    bordure: '#e9d5ff',
    detail: 'Western Union, MoneyGram, Ria',
  },
  {
    icon: '💵',
    titre: 'Espèces en agence',
    couleur: '#b45309',
    fond: '#fffbeb',
    bordure: '#fde68a',
    detail: 'Règlement au comptoir, reçu enregistré dans la plateforme',
  },
  {
    icon: '🧾',
    titre: 'Chèque',
    couleur: '#334155',
    fond: '#f8fafc',
    bordure: '#e2e8f0',
    detail: 'Chèque bancaire, encaissement validé avant activation',
  },
  {
    icon: '₿',
    titre: 'Cryptomonnaie',
    couleur: '#d97706',
    fond: '#fefce8',
    bordure: '#fde047',
    detail: 'USDT, Bitcoin, Ethereum',
  },
  {
    icon: '🎟️',
    titre: 'Code prépayé',
    couleur: '#E60000',
    fond: '#fef2f2',
    bordure: '#fecaca',
    detail: 'Activation immédiate par code d\'abonnement',
  },
  {
    icon: '🚚',
    titre: 'Paiement à la livraison',
    couleur: '#0f766e',
    fond: '#f0fdfa',
    bordure: '#99f6e4',
    detail: 'Règlement lors de la remise du service sur site',
  },
];

const GARANTIES_ABONNEMENT = [
  { icon: '🆓', titre: '14 jours d\'essai', desc: 'Aucune carte bancaire demandée à l\'inscription.' },
  { icon: '🕊️', titre: '7 jours de grâce', desc: 'Après échéance, votre accès reste ouvert 7 jours avant suspension.' },
  { icon: '🚪', titre: 'Résiliation sans frais', desc: 'Vous arrêtez quand vous voulez, sans pénalité ni préavis.' },
];

const FAQ = [
  { q: 'Combien de temps dure l\'essai gratuit ?', r: '14 jours sans carte bancaire. Accès PROFESSIONAL complet. À l\'issue, votre compte passe en lecture seule jusqu\'à souscription.' },
  { q: 'Quels moyens de paiement puis-je utiliser ?', r: 'La plateforme prend en charge le Mobile Money, la carte bancaire via passerelles, le virement national et international, les transferts d\'argent, les espèces en agence, le chèque, la cryptomonnaie, le code prépayé et le paiement à la livraison. Chaque moyen s\'active à la demande selon votre pays : contactez-nous pour savoir lesquels sont ouverts chez vous.' },
  { q: 'Que se passe-t-il si je paie en retard ?', r: 'Une période de grâce de 7 jours suit l\'échéance : votre accès reste actif le temps de régulariser. Passé ce délai, le compte est suspendu, sans perte de données.' },
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
  const [faqOuvert, setFaqOuvert] = useState<number | null>(null);
  const [heroSlide, setHeroSlide] = useState(0);

  // ── État du formulaire de démo ────────────────────────────────────────────
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [demoError, setDemoError] = useState<string>('');

  const handleDemoSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDemoStatus('loading');
    setDemoError('');

    const form = e.currentTarget;
    const data = {
      nom: (form.elements.namedItem('nom') as HTMLInputElement)?.value ?? '',
      prenom: (form.elements.namedItem('prenom') as HTMLInputElement)?.value ?? '',
      societe: (form.elements.namedItem('entreprise') as HTMLInputElement)?.value ?? '',
      email: (form.elements.namedItem('email') as HTMLInputElement)?.value ?? '',
      telephone: (form.elements.namedItem('telephone') as HTMLInputElement)?.value ?? '',
      message: (form.elements.namedItem('message') as HTMLTextAreaElement)?.value ?? '',
      source: 'DEMO',
    };

    // En dev, l'API est proxiée via /api (next.config) ; en prod on appelle directement.
    const apiUrl =
      typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? '/api/public/leads'
        : 'https://gestmoney.ibigsoft.com/api/public/leads';

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any)?.message ?? `Erreur ${res.status}`);
      }
      setDemoStatus('success');
      form.reset();
    } catch (err: any) {
      setDemoError(err?.message ?? 'Une erreur est survenue. Veuillez réessayer.');
      setDemoStatus('error');
    }
  }, []);

  // Rotation fluide du hero
  useEffect(() => {
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const t = setInterval(() => setHeroSlide(s => (s + 1) % HERO_SLIDES.length), 3800);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: '#f8fef9', color: '#111', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflowX: 'hidden' }}>

      {/* ── BANDEAU INFO IBIG SOFT ── */}
      <BandeauInfo />

      {/* ── NAVBAR ── */}
      <HeaderLanding />

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
            Gérez tout<br />
            <span
              key={heroSlide}
              className="hero-rotate"
              style={{
                display: 'inline-block',
                background: `linear-gradient(90deg, ${HERO_SLIDES[heroSlide].couleur}, ${HERO_SLIDES[heroSlide].couleur}cc)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}
            >
              {HERO_SLIDES[heroSlide].mot}
            </span>
            <br />depuis un seul endroit.
          </h1>

          <p key={`p${heroSlide}`} className="hero-rotate" style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: '#4a6650', lineHeight: 1.7, maxWidth: 620, margin: '0 auto 24px', minHeight: 58 }}>
            <strong style={{ color: '#0a2e15' }}>GESTMONEY</strong> — la plateforme intelligente de gestion des réseaux Mobile Money en Afrique. {HERO_SLIDES[heroSlide].accroche}
          </p>

          {/* Points indicateurs du slider */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 36 }}>
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroSlide(i)}
                aria-label={`Slide ${i + 1}`}
                style={{
                  width: i === heroSlide ? 28 : 9, height: 9, borderRadius: 999, border: 'none', cursor: 'pointer', padding: 0,
                  background: i === heroSlide ? HERO_SLIDES[heroSlide].couleur : 'rgba(0,0,0,0.15)',
                  transition: 'all .4s ease',
                }}
              />
            ))}
          </div>

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

          {/* Opérateurs — marquee défilant fluide */}
          <p style={{ fontSize: 11, fontWeight: 800, color: '#009E00', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 14 }}>
            Compatible avec {OPS.length}+ opérateurs Mobile Money
          </p>
          <div className="marquee-mask" style={{ overflow: 'hidden', width: '100%', maskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)' }}>
            <div className="marquee-track" style={{ display: 'flex', gap: 10, width: 'max-content' }}>
              {[...OPS, ...OPS].map((op, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: '#fff', border: `1.5px solid ${op.couleur}33`,
                  borderRadius: 999, padding: '8px 16px', whiteSpace: 'nowrap',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.06)', flexShrink: 0,
                }}>
                  <span style={{ fontSize: 14 }}>{op.emoji}</span>
                  <span style={{ fontSize: 13, color: '#333', fontWeight: 700 }}>{op.nom}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PREUVES DE CONFIANCE ── */}
      <PreuvesConfianceSection />

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 20 }}>
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

      {/* ── PROBLÈMES RÉSOLUS ── */}
      <ProblèmesRésolusSection />

      {/* ── DÉMO INTERACTIVE ── */}
      <section id="demo" style={{ background: '#f8fafc', padding: 'clamp(48px,7vh,88px) clamp(16px,4vw,48px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ color: '#009E00', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', fontSize: 12, margin: '0 0 10px' }}>
            Démo interactive
          </p>
          <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.25rem)', fontWeight: 800, color: '#0a2e15', margin: '0 0 12px' }}>
            Explorez GESTMONEY sans créer de compte
          </h2>
          <p style={{ color: '#6b7280', maxWidth: '55ch', margin: '0 auto' }}>
            Naviguez dans le vrai dashboard. Cliquez, explorez, découvrez.
          </p>
        </div>
        <DemoInteractive />
      </section>

      {/* ── BÉNÉFICES MAJEURS ── */}
      <BénéficesMajeursSection />

      {/* ── PUBLICS CONCERNÉS ── */}
      <PublicsConcernésSection />

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
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.15em', color: '#E60000', textTransform: 'uppercase', marginBottom: 12 }}>Opérateurs supportés</p>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 900, marginBottom: 12, color: '#0a2e15' }}>
            Tous les Mobile Money<br />d&apos;Afrique de l&apos;Ouest &amp; Centrale.
          </h2>
          <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 44, maxWidth: 560, margin: '0 auto 44px' }}>
            UEMOA, CEDEAO et CEMAC — {OPS.length}+ opérateurs déjà intégrés, et <strong style={{ color: '#009E00' }}>tout autre opérateur ajouté sur demande</strong>.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            {OPS.map(op => (
              <div key={op.nom} style={{
                background: '#fff', border: `2px solid ${op.couleur}40`,
                borderRadius: 16, padding: '18px 20px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                boxShadow: `0 4px 16px ${op.couleur}15`,
                width: 156,
              }}>
                <span style={{ fontSize: 32 }}>{op.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: op.couleur, textAlign: 'center' }}>{op.nom}</span>
                <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textAlign: 'center' }}>{op.pays}</span>
              </div>
            ))}
            {/* Carte "etc" — ajout sur demande */}
            <div style={{
              background: 'linear-gradient(135deg,#f0fdf4,#fffbeb)', border: '2px dashed #FFD000',
              borderRadius: 16, padding: '18px 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7,
              width: 156,
            }}>
              <span style={{ fontSize: 32 }}>➕</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#b45309', textAlign: 'center' }}>+ Autres opérateurs</span>
              <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textAlign: 'center' }}>Ajout sur demande</span>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 32 }}>
            Votre opérateur ne figure pas dans la liste ?{' '}
            <a href="#contact" style={{ color: '#009E00', fontWeight: 700 }}>Contactez-nous</a>, nous l&apos;intégrons.
          </p>
        </div>
      </section>

      {/* ── INTÉGRATIONS & OPÉRATEURS ── */}
      <IntégrationsSectionComponent />

      {/* ── COMPARATEUR D'OFFRES ── */}
      <OffreComparateurSection />

      {/* ── TÉMOIGNAGES ── */}
      <TémoignagesSection />

      {/* ── TARIFS — 4 LICENCES ── */}
      <section id="tarifs" style={{ padding: 'clamp(70px,10vh,100px) clamp(16px,4vw,48px)', background: 'linear-gradient(180deg,#fffef0 0%,#fff8e1 50%,#f8fef9 100%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, letterSpacing: '.15em', color: '#d97706', textTransform: 'uppercase', marginBottom: 12 }}>Tarifs</p>
          <h2 style={{ fontSize: 'clamp(26px,4vw,46px)', fontWeight: 900, textAlign: 'center', marginBottom: 12, color: '#0a2e15', letterSpacing: '-0.02em' }}>
            Des formules claires,<br />adaptées à chaque étape.
          </h2>
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 16, marginBottom: 20 }}>
            ✅ Essai gratuit 14 jours &nbsp;·&nbsp; ✅ Sans carte bancaire &nbsp;·&nbsp; ✅ 7 jours de grâce après échéance &nbsp;·&nbsp; ✅ Résiliation sans frais
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
          <p style={{ textAlign: 'center', marginTop: 12, fontSize: 14, color: '#6b7280' }}>
            <Link href="/tarifs" style={{ color: '#009E00', fontWeight: 700, textDecoration: 'none' }}>
              Voir tous les détails des plans →
            </Link>
          </p>
          <p style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: '#6b7280' }}>
            <a href="#paiement" style={{ color: '#009E00', fontWeight: 700, textDecoration: 'none' }}>
              Voir les moyens de paiement pris en charge ↓
            </a>
          </p>
        </div>
      </section>

      {/* ── MOYENS DE PAIEMENT ── */}
      <section id="paiement" style={{ padding: 'clamp(70px,10vh,100px) clamp(16px,4vw,48px)', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, letterSpacing: '.15em', color: '#009E00', textTransform: 'uppercase', marginBottom: 12 }}>Paiement &amp; abonnement</p>
          <h2 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 900, textAlign: 'center', marginBottom: 14, color: '#0a2e15', letterSpacing: '-0.02em' }}>
            Payez comme vous<br />avez l&apos;habitude de payer.
          </h2>
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 16, lineHeight: 1.7, maxWidth: 620, margin: '0 auto 44px' }}>
            Le module d&apos;abonnement GESTMONEY prend en charge les moyens de paiement utilisés en Afrique de l&apos;Ouest et Centrale — du Mobile Money aux espèces en agence.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 16 }}>
            {MOYENS_PAIEMENT.map((m, i) => (
              <div key={i} style={{
                background: m.fond, border: `1.5px solid ${m.bordure}`,
                borderRadius: 16, padding: '20px 22px',
                display: 'flex', gap: 14, alignItems: 'flex-start',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                minWidth: 0,
              }}>
                <span style={{ fontSize: 26, flexShrink: 0, lineHeight: 1.2 }}>{m.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 800, fontSize: 15, marginBottom: 5, color: m.couleur }}>{m.titre}</p>
                  <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.55, overflowWrap: 'anywhere' }}>{m.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Mention d'honnêteté : activation à la demande */}
          <div style={{
            marginTop: 28, background: '#f8fef9', border: '1.5px dashed #bbf7d0',
            borderRadius: 14, padding: '16px 20px', maxWidth: 760, margin: '28px auto 0',
          }}>
            <p style={{ fontSize: 13, color: '#4a6650', lineHeight: 1.7, textAlign: 'center' }}>
              ℹ️ Ces moyens de paiement sont <strong style={{ color: '#0a2e15' }}>pris en charge par la plateforme</strong> et s&apos;activent à la demande selon votre pays et votre configuration. Tous ne sont pas ouverts simultanément —{' '}
              <a href="#contact" style={{ color: '#009E00', fontWeight: 700 }}>écrivez-nous</a> pour connaître ceux disponibles chez vous.
            </p>
          </div>

          {/* Garanties abonnement */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 16, marginTop: 40 }}>
            {GARANTIES_ABONNEMENT.map((g, i) => (
              <div key={i} style={{
                background: 'linear-gradient(135deg,#f0fdf4,#fffef0)',
                border: '1.5px solid #d1fae5', borderRadius: 16,
                padding: '22px 20px', textAlign: 'center', minWidth: 0,
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{g.icon}</div>
                <p style={{ fontWeight: 800, fontSize: 15, marginBottom: 6, color: '#0a2e15' }}>{g.titre}</p>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section style={{ padding: 'clamp(70px,10vh,100px) clamp(16px,4vw,48px)', background: 'linear-gradient(180deg,#f0fdf4 0%,#e8fded 100%)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, letterSpacing: '.15em', color: '#009E00', textTransform: 'uppercase', marginBottom: 12 }}>Comment ça marche</p>
          <h2 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 900, textAlign: 'center', marginBottom: 60, color: '#0a2e15', letterSpacing: '-0.02em' }}>
            Opérationnel en 3 étapes.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 28 }}>
            {[
              {
                num: '01',
                titre: 'Créez votre compte',
                desc: 'Inscription en 2 minutes, sans carte bancaire. Accès immédiat à l\'essai gratuit PROFESSIONAL complet.',
              },
              {
                num: '02',
                titre: 'Configurez votre réseau',
                desc: 'Ajoutez vos agences, agents et flottes opérateurs depuis l\'espace SuperAdmin en quelques clics.',
              },
              {
                num: '03',
                titre: 'Pilotez en temps réel',
                desc: 'Transactions, commissions et rapports instantanés — tout votre réseau Mobile Money sur un seul écran.',
              },
            ].map((step, i) => (
              <div key={i} style={{
                background: '#fff', border: '1.5px solid #d1fae5',
                borderRadius: 20, padding: '36px 28px',
                boxShadow: '0 4px 16px rgba(0,158,0,0.07)',
                display: 'flex', flexDirection: 'column', gap: 16,
              }}>
                <div style={{
                  fontSize: 'clamp(48px,8vw,64px)', fontWeight: 900, lineHeight: 1,
                  color: '#009E00', letterSpacing: '-0.04em',
                  fontVariantNumeric: 'tabular-nums',
                }}>{step.num}</div>
                <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0a2e15', margin: 0 }}>{step.titre}</h3>
                <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Link href="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 900,
              background: '#009E00', color: '#fff', textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(0,158,0,0.3)',
            }}>
              Démarrer maintenant →
            </Link>
          </div>
        </div>
      </section>

      {/* ── APERÇU DU TABLEAU DE BORD ── */}
      <section style={{ padding: 'clamp(70px,10vh,100px) clamp(16px,4vw,48px)', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.15em', color: '#009E00', textTransform: 'uppercase', marginBottom: 12 }}>Interface</p>
          <h2 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 900, marginBottom: 14, color: '#0a2e15', letterSpacing: '-0.02em' }}>
            Aperçu du tableau de bord.
          </h2>
          <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
            Une interface pensée pour le terrain — claire, rapide, accessible sur mobile.
          </p>
          <div style={{
            maxWidth: 900, margin: '0 auto',
            background: '#1a2e1a', borderRadius: 12,
            aspectRatio: '16/9', display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            border: '1.5px solid rgba(0,158,0,0.20)',
          }}>
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true">
              <rect x="4" y="8" width="44" height="30" rx="4" stroke="#009E00" strokeWidth="2.5" fill="none" />
              <rect x="18" y="38" width="16" height="4" rx="2" fill="#009E00" opacity=".6" />
              <rect x="12" y="44" width="28" height="2.5" rx="1.25" fill="#009E00" opacity=".3" />
              <rect x="10" y="14" width="14" height="8" rx="2" fill="#009E00" opacity=".4" />
              <rect x="28" y="14" width="14" height="8" rx="2" fill="#FFD000" opacity=".4" />
              <rect x="10" y="26" width="32" height="5" rx="2" fill="#009E00" opacity=".2" />
            </svg>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, fontWeight: 700, margin: 0 }}>
              Captures d&apos;écran disponibles prochainement
            </p>
            <p style={{ color: 'rgba(255,255,255,0.30)', fontSize: 12, margin: 0 }}>
              La plateforme est en cours de finalisation
            </p>
          </div>
        </div>
      </section>

      {/* ── VIDÉO DE PRÉSENTATION ── */}
      <section style={{ padding: 'clamp(70px,10vh,100px) clamp(16px,4vw,48px)', background: 'linear-gradient(180deg,#f8fef9 0%,#fff 100%)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.15em', color: '#009E00', textTransform: 'uppercase', marginBottom: 12 }}>Vidéo</p>
          <h2 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 900, marginBottom: 14, color: '#0a2e15', letterSpacing: '-0.02em' }}>
            Découvrez GESTMONEY en vidéo.
          </h2>
          <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
            Une présentation complète de la plateforme par notre équipe.
          </p>
          <div style={{
            maxWidth: 900, margin: '0 auto',
            background: '#0a2e15', borderRadius: 12,
            aspectRatio: '16/9', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            border: '1.5px solid rgba(0,158,0,0.20)',
            cursor: 'default',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Fond décoratif */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(0,158,0,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
            {/* Bouton play */}
            <div style={{
              position: 'relative', zIndex: 1,
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(0,158,0,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 12px rgba(0,158,0,0.20)',
            }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <polygon points="11,7 27,16 11,25" fill="#fff" />
              </svg>
            </div>
          </div>
          <p style={{ marginTop: 20, fontSize: 13, color: '#9ca3af' }}>
            Vidéo de présentation disponible prochainement — <a href="#contact" style={{ color: '#009E00', fontWeight: 700 }}>demandez une démo live</a>
          </p>
        </div>
      </section>

      {/* ── TÉMOIGNAGES (masqués jusqu'à disponibilité de vrais retours clients) ── */}
      {process.env.NEXT_PUBLIC_SHOW_TESTIMONIALS === 'true' && (
      <section style={{ padding: 'clamp(70px,10vh,100px) clamp(16px,4vw,48px)', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, letterSpacing: '.15em', color: '#009E00', textTransform: 'uppercase', marginBottom: 12 }}>Témoignages</p>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 900, textAlign: 'center', marginBottom: 56, color: '#0a2e15' }}>
            Ils font confiance à GESTMONEY.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))', gap: 20 }}>
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
      )}

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
      <IBIGPartnersSection />

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
          {demoStatus === 'success' ? (
            <div style={{
              background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 16,
              padding: '32px 24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <p style={{ fontWeight: 700, color: '#15803d', fontSize: 18, margin: '0 0 8px' }}>Demande envoyée !</p>
              <p style={{ color: '#166534', fontSize: 15, margin: 0 }}>
                Notre équipe vous contactera dans les 24 heures.
              </p>
            </div>
          ) : (
            <form onSubmit={handleDemoSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
              {[
                { name: 'prenom', placeholder: 'Prénom *', type: 'text', required: true },
                { name: 'nom', placeholder: 'Nom *', type: 'text', required: true },
                { name: 'entreprise', placeholder: 'Entreprise *', type: 'text', required: true },
                { name: 'email', placeholder: 'Email professionnel *', type: 'email', required: true },
                { name: 'telephone', placeholder: 'Téléphone / WhatsApp', type: 'tel', required: false },
              ].map(f => (
                <input key={f.name} name={f.name} type={f.type} placeholder={f.placeholder} required={f.required} style={{
                  width: '100%', background: '#f9fafb', border: '1.5px solid #d1d5db',
                  borderRadius: 12, padding: '13px 16px', color: '#111', fontSize: 14, outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box',
                }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#009E00'; e.currentTarget.style.background = '#f0fdf4'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#f9fafb'; }}
                />
              ))}
              <textarea name="message" placeholder="Décrivez votre projet" rows={3} style={{
                width: '100%', background: '#f9fafb', border: '1.5px solid #d1d5db',
                borderRadius: 12, padding: '13px 16px', color: '#111', fontSize: 14, outline: 'none',
                fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
              }}
                onFocus={e => { e.currentTarget.style.borderColor = '#009E00'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#d1d5db'; }}
              />
              {demoStatus === 'error' && (
                <p style={{ color: '#dc2626', fontSize: 13, margin: 0, textAlign: 'center' }}>
                  {demoError || 'Une erreur est survenue. Veuillez réessayer.'}
                </p>
              )}
              <button type="submit" disabled={demoStatus === 'loading'} style={{
                padding: '15px', borderRadius: 12, border: 'none',
                background: demoStatus === 'loading' ? '#86efac' : '#009E00',
                color: '#fff', fontSize: 16, fontWeight: 900,
                cursor: demoStatus === 'loading' ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 4px 16px rgba(0,158,0,0.3)',
              }}>
                {demoStatus === 'loading' ? 'Envoi en cours…' : 'Demander une démo →'}
              </button>
            </form>
          )}
          <p style={{ marginTop: 14, fontSize: 12, color: '#9ca3af' }}>Réponse sous 24h · Aucun engagement · Données protégées</p>
        </div>
      </section>

      {/* ── SÉCURITÉ VITRINE ── */}
      <SécuritéVitrineSection />

      {/* ── AVANTAGES IBIG SOFT ── */}
      <AvantagesIBIGSection />

      {/* ── FAQ (composant) ── */}
      <FAQSection />

      {/* ── CTA FINAL ── */}
      <CTAFinalSection />

      {/* ── Écosystème IBIG SOFT (« Nos solutions ») ── */}
      {/* Injecté par /ibigsoft-universal.js (détection auto = gestmoney).    */}
      <div data-ibig="solutions" />
      {/* Footer unique : celui de GESTMONEY. Le footer universel du script est
          désactivé (data-render="solutions") pour ne pas faire doublon ; ses
          informations utiles sont reprises dans FooterGestmoney. */}
      <FooterGestmoney />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { width: 100%; max-width: 100%; margin: 0; overflow-x: hidden; scroll-behavior: smooth; }
        .hidden-mobile { display: flex !important; }
        .show-mobile { display: none !important; }
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        a:focus-visible, button:focus-visible { outline: 2px solid #009E00; outline-offset: 2px; }

        /* Marquee défilant des opérateurs */
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-track { animation: marquee 28s linear infinite; }
        .marquee-mask:hover .marquee-track { animation-play-state: paused; }

        /* Rotation fluide du hero */
        @keyframes heroRotate {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-rotate { animation: heroRotate .6s ease both; }

        @media (prefers-reduced-motion: reduce) {
          * { transition: none !important; animation: none !important; }
          .marquee-track { animation: none !important; }
        }
      `}</style>

      {/* Bouton flottant SARA — chat commercial public (bas droite) */}
      <SARAfloatingButton />
      {/* Bouton flottant WhatsApp — contact humain (bas gauche, si numéro configuré) */}
      <WhatsAppFlottant />

      {/* Script universel IBIG SOFT, limité à la section « Nos solutions ».
          data-render="solutions" : on n'injecte PAS le footer universel, le
          footer GESTMONEY est le seul de la page. */}
      <Script
        src="/ibigsoft-universal.js"
        strategy="afterInteractive"
        data-solution="gestmoney"
        data-accent="#059669"
        data-render="solutions"
      />
    </div>
  );
}
