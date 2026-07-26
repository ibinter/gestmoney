'use client';

import { useState } from 'react';

const faqs = [
  {
    question: "Qu'est-ce que GESTMONEY ?",
    answer:
      "GESTMONEY est une plateforme SaaS conçue pour gérer les réseaux Mobile Money : agents, transactions, flottes, commissions et comptabilité OHADA, le tout depuis un tableau de bord centralisé.",
  },
  {
    question: 'Combien coûte GESTMONEY ?',
    answer:
      "Trois formules : STARTER à 25 000 FCFA/mois (5 utilisateurs, 3 agences), PRO à 60 000 FCFA/mois (20 utilisateurs, 15 agences), et ENTERPRISE sur devis pour les réseaux sans limite.",
  },
  {
    question: 'Puis-je essayer GESTMONEY gratuitement ?',
    answer:
      "Oui. Un essai de 14 jours est disponible sans carte bancaire ni engagement. En cas d'expiration, 7 jours de grâce supplémentaires sont accordés avant toute interruption du service.",
  },
  {
    question: 'Quels opérateurs Mobile Money sont supportés ?',
    answer:
      "GESTMONEY supporte Orange Money, MTN MoMo, Moov Money, Wave, Airtel Money, T-Money, Express Union, Wizall, Djamo et d'autres opérateurs régionaux. De nouveaux opérateurs sont régulièrement ajoutés.",
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer:
      "Toutes les communications sont chiffrées via HTTPS. Les mots de passe sont hachés avec bcrypt. Les accès sont contrôlés par rôle, un journal d'audit complet est conservé, et l'architecture multi-tenant garantit l'isolation totale entre réseaux.",
  },
  {
    question: 'GESTMONEY fonctionne-t-il sur mobile ?',
    answer:
      "Oui, l'interface est entièrement responsive et accessible depuis tout navigateur web moderne. Une Progressive Web App (PWA) est également disponible pour une installation directe sur l'écran d'accueil de votre smartphone.",
  },
  {
    question: "Comment fonctionne le paiement de l'abonnement ?",
    answer:
      "Vous pouvez payer par Mobile Money, virement bancaire, Wave, carte bancaire ou code prépayé (voucher). Le paiement est disponible en formule mensuelle ou annuelle (avec remise).",
  },
  {
    question: 'Puis-je gérer plusieurs agences ?',
    answer:
      "Oui. Le plan PRO permet de gérer jusqu'à 15 agences avec des agents indépendants par agence. Le plan ENTERPRISE n'impose aucune limite sur le nombre d'agences ou d'utilisateurs.",
  },
  {
    question: "Y a-t-il un contrat d'engagement ?",
    answer:
      "Non. Vous pouvez résilier à tout moment depuis votre espace abonnement, sans pénalité. L'accès reste actif jusqu'à la fin de la période déjà payée.",
  },
  {
    question: 'Comment migrer mes données Excel existantes ?',
    answer:
      "GESTMONEY propose un outil d'import XLSX/CSV intégré pour importer vos clients, agents et transactions historiques. Notre équipe support peut vous accompagner lors de la migration.",
  },
  {
    question: 'Quel support est disponible ?',
    answer:
      "Vous bénéficiez du chat SARA disponible 24h/24 et 7j/7, de l'email gestmoney@ibigsoft.com, du téléphone +225 27 22 27 60 14 (Lundi–Samedi, 8h–18h), et d'un système de tickets dans l'application.",
  },
  {
    question: "GESTMONEY est-il conforme à la comptabilité africaine ?",
    answer:
      "Oui. Le module comptabilité suit le Plan Comptable SYSCOHADA en vigueur en Côte d'Ivoire et dans l'ensemble des pays de l'UEMOA, vous permettant de produire vos états financiers réglementaires directement depuis la plateforme.",
  },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.25s ease',
        flexShrink: 0,
        color: '#009E00',
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          padding: '20px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: '1rem',
            color: '#111827',
            lineHeight: 1.4,
          }}
        >
          {question}
        </span>
        <ChevronIcon open={open} />
      </button>
      <div
        style={{
          maxHeight: open ? '400px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
        }}
      >
        <p
          style={{
            color: '#4b5563',
            fontSize: '0.95rem',
            lineHeight: 1.7,
            paddingBottom: '20px',
            margin: 0,
          }}
        >
          {answer}
        </p>
      </div>
    </div>
  );
}

export function FAQSection() {
  return (
    <section
      style={{
        backgroundColor: '#ffffff',
        padding: '80px 24px',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span
            style={{
              display: 'inline-block',
              backgroundColor: '#dcfce7',
              color: '#009E00',
              fontWeight: 600,
              fontSize: '0.8rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '4px 14px',
              borderRadius: '999px',
              marginBottom: '16px',
            }}
          >
            FAQ
          </span>
          <h2
            style={{
              fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '12px',
              lineHeight: 1.2,
            }}
          >
            Questions fréquentes
          </h2>
          <p
            style={{
              color: '#6b7280',
              fontSize: '1rem',
              maxWidth: '520px',
              margin: '0 auto',
            }}
          >
            Tout ce que vous devez savoir avant de démarrer avec GESTMONEY.
          </p>
        </div>

        {/* Accordion */}
        <div>
          {faqs.map((faq, i) => (
            <FAQItem key={i} question={faq.question} answer={faq.answer} />
          ))}
        </div>

        {/* CTA bas */}
        <div
          style={{
            marginTop: '48px',
            textAlign: 'center',
            padding: '32px',
            backgroundColor: '#f0fdf4',
            borderRadius: '12px',
            border: '1px solid #bbf7d0',
          }}
        >
          <p
            style={{
              color: '#374151',
              fontSize: '1rem',
              marginBottom: '16px',
            }}
          >
            Vous ne trouvez pas la réponse à votre question ?
          </p>
          <a
            href="mailto:gestmoney@ibigsoft.com"
            style={{
              display: 'inline-block',
              backgroundColor: '#009E00',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.95rem',
              padding: '10px 28px',
              borderRadius: '8px',
              textDecoration: 'none',
            }}
          >
            Contactez notre support
          </a>
        </div>
      </div>
    </section>
  );
}
