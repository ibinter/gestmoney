import type { Metadata } from 'next';
import Script from 'next/script';
import { TarifsInteractif } from './TarifsInteractif';
import { HeaderLanding } from '@/components/landing/HeaderLanding';
import { FooterGestmoney } from '@/components/landing/FooterGestmoney';
import { BandeauInfo } from '@/components/landing/BandeauInfo';

export const metadata: Metadata = {
  title: 'Tarifs GESTMONEY — Starter, Essentiel, Professional, Enterprise',
  description:
    'Choisissez le plan GESTMONEY adapté à votre réseau Mobile Money. Essai gratuit 14 jours, sans carte bancaire. Plans à partir de 9 900 FCFA/mois.',
  openGraph: {
    title: 'Tarifs GESTMONEY',
    description: 'Plans flexibles pour tous les réseaux Mobile Money',
    url: 'https://gestmoney.ibigsoft.com/tarifs',
  },
  alternates: { canonical: 'https://gestmoney.ibigsoft.com/tarifs' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'GESTMONEY',
  description:
    'Plateforme intelligente de gestion des réseaux Mobile Money en Afrique. Agents, float, commissions, comptabilité OHADA et reporting temps réel.',
  brand: { '@type': 'Brand', name: 'GESTMONEY' },
  offers: [
    {
      '@type': 'Offer',
      name: 'Starter',
      price: '9900',
      priceCurrency: 'XOF',
      priceValidUntil: '2027-01-01',
      availability: 'https://schema.org/InStock',
      url: 'https://gestmoney.ibigsoft.com/tarifs',
    },
    {
      '@type': 'Offer',
      name: 'Essentiel',
      price: '19900',
      priceCurrency: 'XOF',
      priceValidUntil: '2027-01-01',
      availability: 'https://schema.org/InStock',
      url: 'https://gestmoney.ibigsoft.com/tarifs',
    },
    {
      '@type': 'Offer',
      name: 'Professional',
      price: '39900',
      priceCurrency: 'XOF',
      priceValidUntil: '2027-01-01',
      availability: 'https://schema.org/InStock',
      url: 'https://gestmoney.ibigsoft.com/tarifs',
    },
    {
      '@type': 'Offer',
      name: 'Enterprise',
      price: '0',
      priceCurrency: 'XOF',
      description: 'Sur devis — contactez les ventes',
      availability: 'https://schema.org/InStock',
      url: 'https://gestmoney.ibigsoft.com/tarifs',
    },
  ],
};

export default function TarifsPage() {
  return (
    <>
      {/* Données structurées JSON-LD pour le SEO */}
      <Script
        id="tarifs-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <BandeauInfo />
      <HeaderLanding />
      <TarifsInteractif />
      <FooterGestmoney />
    </>
  );
}
