'use client';
import React from 'react';

interface LogoProps {
  variante?: 'horizontal' | 'compact' | 'icon';
  theme?: 'clair' | 'sombre';
  className?: string;
}

// Icône SVG seule — les arcs panafricains + G
function IconeSVG({ taille = 40 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <rect width="44" height="44" rx="10" fill="#111111" />
      {/* Arc vert */}
      <path d="M4 34 Q1 22 8 13 Q13 7 22 5" stroke="#009E00" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Arc rouge */}
      <path d="M6 37 Q1 23 10 11 Q16 4 26 3" stroke="#E60000" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.85" />
      {/* Arc jaune */}
      <path d="M12 5 Q24 1 36 9 Q42 14 43 24" stroke="#FFD000" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Arc vert bas */}
      <path d="M5 38 Q14 45 26 43 Q36 41 41 33" stroke="#009E00" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
      {/* G blanc */}
      <text x="10" y="31" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="24" fill="white">G</text>
    </svg>
  );
}

// Texte GESTMONEY en HTML pur — fiable et sans troncature
function TexteLogo({ theme = 'clair', taille = 24 }: { theme?: 'clair' | 'sombre'; taille?: number }) {
  const couleur = theme === 'sombre' ? '#FFFFFF' : '#111111';
  return (
    <span style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontWeight: 900, fontSize: taille, lineHeight: 1, letterSpacing: '-0.01em', display: 'inline-flex', alignItems: 'baseline', gap: 0 }}>
      <span style={{ color: couleur }}>GEST</span>
      <span style={{ color: '#FFD000' }}>M</span>
      <span style={{ color: '#E60000' }}>O</span>
      <span style={{ color: couleur }}>N</span>
      <span style={{ color: '#009E00' }}>EY</span>
    </span>
  );
}

export function Logo({ variante = 'horizontal', theme = 'clair', className = '' }: LogoProps) {
  if (variante === 'icon') {
    return <IconeSVG taille={40} />;
  }

  if (variante === 'compact') {
    return (
      <div className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <IconeSVG taille={32} />
        <TexteLogo theme={theme} taille={20} />
      </div>
    );
  }

  // horizontal
  return (
    <div className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      <IconeSVG taille={44} />
      <TexteLogo theme={theme} taille={28} />
    </div>
  );
}
