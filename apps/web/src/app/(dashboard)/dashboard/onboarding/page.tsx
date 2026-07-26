'use client';
// ============================================================
// PAGE /dashboard/onboarding — Wizard accessible manuellement
// ============================================================
import React from 'react';
import { OnboardingWizard } from '@/components/ui/OnboardingWizard';
import { GmPageHeader } from '@/components/gm';

export default function OnboardingPage() {
  return (
    <>
      <GmPageHeader
        titre="Guide de démarrage"
        sousTitre="Suivez ces 5 étapes pour configurer votre réseau GESTMONEY."
      />
      {/* Le wizard en mode page dédiée : toujours visible */}
      <OnboardingWizard forceVisible />
    </>
  );
}
