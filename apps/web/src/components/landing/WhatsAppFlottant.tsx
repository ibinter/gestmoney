'use client';
// ============================================================
// WhatsAppFlottant — bouton WhatsApp flottant, page de vente.
// Position : bas à droite.
// Quand SARAfloatingButton est présent sur la même page,
// ce bouton doit être monté via un wrapper ou la page doit
// lui ajouter la classe/style `bottom: 92px` sur mobile.
// Par défaut : bottom 24px / right 24px (z-index 999).
// ============================================================
import React, { useEffect, useState } from 'react';

const WA_HREF =
  'https://wa.me/2250778882592?text=Bonjour%20IBIG%20Soft%2C%20je%20souhaite%20obtenir%20des%20informations%20sur%20GESTMONEY.';

function IconeWhatsApp() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function WhatsAppFlottant() {
  // Animation : bounce subtil 1× toutes les 5s
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setBounce(true);
      setTimeout(() => setBounce(false), 600);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <style>{`
        @keyframes wa-bounce {
          0%   { transform: translateY(0); }
          25%  { transform: translateY(-8px); }
          50%  { transform: translateY(0); }
          75%  { transform: translateY(-4px); }
          100% { transform: translateY(0); }
        }
        .wa-flottant-bounce { animation: wa-bounce 0.6s ease; }
      `}</style>

      <a
        href={WA_HREF}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contacter IBIG Soft sur WhatsApp"
        title="Contacter IBIG Soft sur WhatsApp"
        className={bounce ? 'wa-flottant-bounce' : ''}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: '#25D366',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(37,211,102,0.45)',
          zIndex: 999,
          textDecoration: 'none',
          transition: 'transform .15s, box-shadow .15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.1)';
          (e.currentTarget as HTMLAnchorElement).style.boxShadow =
            '0 8px 28px rgba(37,211,102,0.6)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLAnchorElement).style.boxShadow =
            '0 6px 20px rgba(37,211,102,0.45)';
        }}
      >
        <IconeWhatsApp />
      </a>
    </>
  );
}
