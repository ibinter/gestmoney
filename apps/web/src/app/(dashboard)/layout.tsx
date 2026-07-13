'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/ui/Topbar';
import { Sidebar } from '@/components/ui/Sidebar';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { Onboarding } from '@/components/ui/Onboarding';
import { AssistantIA } from '@/components/ui/AssistantIA';
import { useAuthStore } from '@/store/authStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOuverte, setSidebarOuverte] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers /login si non authentifié (double sécurité côté client)
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Sidebar fixe desktop */}
      <Sidebar mode="fixe" />

      {/* Sidebar overlay mobile */}
      <Sidebar
        mode="overlay"
        ouvert={sidebarOuverte}
        onFermer={() => setSidebarOuverte(false)}
      />

      {/* Zone principale */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOuverte(true)} />
        <CommandPalette />
        <Onboarding />
        <AssistantIA />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
