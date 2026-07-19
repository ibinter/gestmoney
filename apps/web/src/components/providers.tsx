"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { useState } from "react";
import { I18nProvider } from "@/lib/i18n";
import { CookieBanner } from "@/components/ui/CookieBanner";
import { PwaInstallBanner } from "@/components/ui/PwaInstallBanner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {/* Thème clair par défaut (identité GESTMONEY) — le mode sombre reste
          disponible via le ThemeToggle, mais n'est plus imposé par l'OS. */}
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <I18nProvider>
          {children}
          <Toaster richColors position="top-right" />
          <CookieBanner />
          <PwaInstallBanner />
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
