'use client';
// ============================================================
// BULLE SARA — page de vente (public)
// Chat commercial branché sur l'endpoint public /ai/chat.
// Styles inline pour rester cohérent avec la page de vente
// (le design system gm-* est réservé au dashboard).
// ============================================================
import React, { useState, useRef, useEffect } from 'react';

interface Msg {
  role: 'user' | 'assistant';
  contenu: string;
}

const ACCUEIL: Msg = {
  role: 'assistant',
  contenu:
    "Bonjour 👋 Je suis SARA, l'assistante de GESTMONEY. Posez-moi vos questions sur la plateforme, les tarifs, les opérateurs ou les moyens de paiement.",
};

export function SaraBubble() {
  const [ouvert, setOuvert] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([ACCUEIL]);
  const [saisie, setSaisie] = useState('');
  const [enCours, setEnCours] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);
  const [sessionId] = useState(
    () => `web_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`,
  );

  useEffect(() => {
    if (ouvert) finRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, ouvert, enCours]);

  const envoyer = async () => {
    const q = saisie.trim();
    if (!q || enCours) return;
    setSaisie('');
    setMessages((m) => [...m, { role: 'user', contenu: q }]);
    setEnCours(true);
    try {
      // Pas de token sur la page de vente : la route Next.js aiguille
      // automatiquement vers /ai/chat/public (contexte commercial).
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, sessionId, contexte: 'PUBLIC' }),
      });
      const data = await res.json().catch(() => ({}));
      const reponse =
        data?.response ??
        "Désolée, je suis momentanément indisponible. Écrivez-nous à contact@ibigsoft.com.";
      setMessages((m) => [...m, { role: 'assistant', contenu: reponse }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          contenu:
            "Je rencontre un problème technique. Réessayez dans un instant ou écrivez à contact@ibigsoft.com.",
        },
      ]);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <>
      {/* Fenêtre de chat */}
      {ouvert && (
        <div
          role="dialog"
          aria-label="Discussion avec SARA"
          style={{
            position: 'fixed',
            bottom: 92,
            right: 20,
            width: 'min(370px, calc(100vw - 40px))',
            height: 'min(520px, calc(100vh - 140px))',
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 12px 48px rgba(1,45,16,0.22)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1000,
            border: '1px solid rgba(0,158,0,0.15)',
          }}
        >
          {/* En-tête */}
          <div
            style={{
              background: 'linear-gradient(135deg, #012d10, #009E00)',
              color: '#fff',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: '#FFD000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              🤖
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>SARA</div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>Assistante GESTMONEY</div>
            </div>
            <button
              onClick={() => setOuvert(false)}
              aria-label="Fermer la discussion"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: '#fff',
                width: 28,
                height: 28,
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* Fil de messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              background: '#f8fef9',
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: m.role === 'user' ? '#009E00' : '#fff',
                  color: m.role === 'user' ? '#fff' : '#0a2e15',
                  padding: '9px 13px',
                  borderRadius: 14,
                  borderBottomRightRadius: m.role === 'user' ? 4 : 14,
                  borderBottomLeftRadius: m.role === 'user' ? 14 : 4,
                  fontSize: 13.5,
                  lineHeight: 1.5,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {m.contenu}
              </div>
            ))}
            {enCours && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  color: '#6b7280',
                  fontSize: 13,
                  fontStyle: 'italic',
                  padding: '4px 8px',
                }}
              >
                SARA écrit…
              </div>
            )}
            <div ref={finRef} />
          </div>

          {/* Saisie */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: 12,
              borderTop: '1px solid #eef2f0',
              flexShrink: 0,
              background: '#fff',
            }}
          >
            <input
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && envoyer()}
              placeholder="Votre question…"
              aria-label="Votre message"
              style={{
                flex: 1,
                border: '1.5px solid #d1d5db',
                borderRadius: 12,
                padding: '10px 12px',
                fontSize: 13.5,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <button
              onClick={envoyer}
              disabled={enCours || !saisie.trim()}
              aria-label="Envoyer"
              style={{
                background: saisie.trim() ? '#009E00' : '#d1d5db',
                border: 'none',
                color: '#fff',
                width: 42,
                borderRadius: 12,
                cursor: saisie.trim() ? 'pointer' : 'default',
                fontSize: 17,
                flexShrink: 0,
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Bouton flottant */}
      <button
        onClick={() => setOuvert((v) => !v)}
        aria-label={ouvert ? 'Fermer SARA' : 'Discuter avec SARA'}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #012d10, #009E00)',
          border: '3px solid #FFD000',
          color: '#fff',
          fontSize: 26,
          cursor: 'pointer',
          boxShadow: '0 6px 24px rgba(1,45,16,0.35)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {ouvert ? '✕' : '🤖'}
      </button>
    </>
  );
}
