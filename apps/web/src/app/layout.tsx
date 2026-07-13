import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { PwaRegister } from "@/components/ui/PwaRegister";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "GESTMONEY - Gestion Mobile Money",
    template: "%s | GESTMONEY",
  },
  description: "La plateforme intelligente de gestion des réseaux Mobile Money en Afrique. Gérez vos agents, transactions, float et commissions en temps réel.",
  authors: [{ name: "IBIG Soft", url: "https://ibigsoft.com" }],
  keywords: ["Mobile Money", "FCFA", "Orange Money", "MTN MoMo", "Wave", "Moov Money", "Afrique", "fintech", "OHADA", "gestion agent"],
  creator: "IBIG Soft — IBIG SARL",
  publisher: "IBIG Soft",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://gestmoney.ibigsoft.com"),
  icons: {
    icon: "/favicon.svg",
    apple: "/icons/icon-152x152.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "GESTMONEY — Gestion Mobile Money",
    description: "La plateforme intelligente de gestion des réseaux Mobile Money en Afrique.",
    siteName: "GESTMONEY",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GESTMONEY — Gestion Mobile Money",
    description: "La plateforme intelligente de gestion des réseaux Mobile Money en Afrique.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GESTMONEY",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#009E00" },
    { media: "(prefers-color-scheme: dark)", color: "#009E00" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <PwaRegister />
      </body>
    </html>
  );
}
