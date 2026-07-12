import React from 'react';

interface LogoProps {
  variante?: 'horizontal' | 'icon' | 'compact';
  theme?: 'clair' | 'sombre';
  largeur?: number;
  className?: string;
}

// Logo GESTMONEY — charte graphique officielle
// Couleurs : #FFD000 (jaune), #E60000 (rouge), #009E00 (vert), #111111 (noir)
export function Logo({ variante = 'horizontal', theme = 'clair', largeur, className = '' }: LogoProps) {
  if (variante === 'icon') {
    const taille = largeur ?? 40;
    return (
      <svg width={taille} height={taille} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Fond arrondi noir */}
        <rect width="100" height="100" rx="22" fill="#111111" />
        {/* Arc vert */}
        <path d="M15 72 Q8 50 22 30" stroke="#009E00" strokeWidth="6" strokeLinecap="round" fill="none" />
        {/* Arc rouge */}
        <path d="M20 78 Q10 50 25 25" stroke="#E60000" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.85" />
        {/* Arc jaune */}
        <path d="M25 18 Q55 5 80 28" stroke="#FFD000" strokeWidth="6" strokeLinecap="round" fill="none" />
        {/* Lettre G stylisée */}
        <text x="38" y="68" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="46" fill="white">G</text>
      </svg>
    );
  }

  if (variante === 'compact') {
    const h = largeur ?? 48;
    const w = h * 2.2;
    return (
      <svg width={w} height={h} viewBox="0 0 220 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Icône */}
        <rect x="0" y="4" width="40" height="40" rx="9" fill="#111111" />
        <path d="M6 35 Q3 22 11 12" stroke="#009E00" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M8 38 Q2 22 13 10" stroke="#E60000" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.85" />
        <path d="M11 8 Q26 2 38 14" stroke="#FFD000" strokeWidth="3" strokeLinecap="round" fill="none" />
        <text x="14" y="34" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="22" fill="white">G</text>
        {/* Texte */}
        <text x="50" y="33" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="24" fill={theme === 'sombre' ? '#FFFFFF' : '#111111'}>GEST</text>
        <text x="120" y="33" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="24" fill="#FFD000">M</text>
        <text x="140" y="33" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="24" fill="#E60000">O</text>
        <text x="161" y="33" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="24" fill="#111111">N</text>
        <text x="180" y="33" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="24" fill="#009E00">EY</text>
      </svg>
    );
  }

  // Horizontal (défaut)
  const h = largeur ? Math.round(largeur * 0.33) : 56;
  const w = largeur ?? 170;
  return (
    <svg width={w} height={h} viewBox="0 0 340 112" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* === ICÔNE GAUCHE === */}
      {/* Cercle fond noir */}
      <rect x="0" y="6" width="100" height="100" rx="22" fill="#111111" />

      {/* Arcs panafricains */}
      {/* Arc vert externe */}
      <path d="M8 80 Q2 55 16 32 Q26 16 44 10" stroke="#009E00" strokeWidth="7" strokeLinecap="round" fill="none" />
      {/* Arc rouge */}
      <path d="M14 88 Q4 56 20 28 Q33 10 56 6" stroke="#E60000" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.9" />
      {/* Arc jaune */}
      <path d="M24 14 Q52 2 80 18 Q96 28 100 50" stroke="#FFD000" strokeWidth="7" strokeLinecap="round" fill="none" />
      {/* Arc vert interne bas */}
      <path d="M10 90 Q30 108 60 104 Q84 100 96 82" stroke="#009E00" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.7" />

      {/* Téléphone stylisé */}
      <rect x="28" y="22" width="28" height="48" rx="5" fill="#1a1a1a" stroke="#FFD000" strokeWidth="1.5" />
      <rect x="31" y="26" width="22" height="36" rx="3" fill="#009E00" />
      {/* Flèche montante sur l'écran */}
      <path d="M42 52 L42 36 M38 40 L42 36 L46 40" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* FCFA text */}
      <text x="35" y="58" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="6" fill="white">FCFA</text>

      {/* Portefeuille */}
      <rect x="46" y="56" width="32" height="22" rx="4" fill="#222222" stroke="#FFD000" strokeWidth="1.5" />
      <rect x="52" y="52" width="20" height="8" rx="2" fill="#333333" stroke="#FFD000" strokeWidth="1" />
      <circle cx="68" cy="67" r="4" fill="#FFD000" />

      {/* === TEXTE DROIT === */}
      {/* GEST */}
      <text x="112" y="74" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="52" fill={theme === 'sombre' ? '#FFFFFF' : '#111111'}>GEST</text>
      {/* M jaune */}
      <text x="222" y="74" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="52" fill="#FFD000">M</text>
      {/* O rouge avec éclair */}
      <text x="254" y="74" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="52" fill="#E60000">O</text>
      {/* N noir */}
      <text x="286" y="74" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="52" fill={theme === 'sombre' ? '#FFFFFF' : '#111111'}>N</text>
      {/* EY vert */}
      <text x="316" y="74" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="52" fill="#009E00">E</text>

      {/* Ligne sous GEST et après */}
      {theme === 'sombre' && (
        <line x1="112" y1="82" x2="340" y2="82" stroke="#FFD000" strokeWidth="1.5" opacity="0.3" />
      )}
    </svg>
  );
}

// Version texte seul pour espaces très réduits
export function LogoTexte({ theme = 'clair', taille = 'md', className = '' }: {
  theme?: 'clair' | 'sombre';
  taille?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' };
  const couleurBase = theme === 'sombre' ? 'text-white' : 'text-[#111111]';
  return (
    <span className={`font-black tracking-wide ${sizes[taille]} ${className}`}>
      <span className={couleurBase}>GEST</span>
      <span style={{ color: '#FFD000' }}>M</span>
      <span style={{ color: '#E60000' }}>O</span>
      <span className={couleurBase}>N</span>
      <span style={{ color: '#009E00' }}>EY</span>
    </span>
  );
}
