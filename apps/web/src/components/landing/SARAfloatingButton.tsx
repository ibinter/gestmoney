'use client';
// ============================================================
// SARAfloatingButton — bouton flottant SARA, page de vente.
// Chat local (réponses prédéfinies), sans appel API.
// Position : bas à droite. Sur mobile, monte au-dessus du bouton
// WhatsApp si celui-ci est présent.
// ============================================================
import React, { useState, useRef, useEffect } from 'react';

const VERT = '#009E00';
const OR = '#FFD000';
const FOND_HEADER = 'linear-gradient(135deg, #012d10, #009E00)';

interface Msg {
  role: 'user' | 'assistant';
  contenu: string;
  boutons?: { label: string; href: string }[];
}

const MSG_ACCUEIL: Msg = {
  role: 'assistant',
  contenu:
    'Bonjour ! Je suis SARA, l’assistante intelligente de GESTMONEY. Je peux vous présenter la solution, vous aider à choisir une formule ou organiser une démonstration. Comment puis-je vous aider ?',
};

const CHIPS = [
  'Que fait GESTMONEY ?',
  'Combien ça coûte ?',
  'Essai gratuit ?',
  'Demander une démo',
];

function repondre(question: string): Msg {
  const q = question.toLowerCase();

  if (/prix|co[uû]t|tarif|combien|abonnement|forfait/.test(q)) {
    return {
      role: 'assistant',
      contenu:
        'GESTMONEY propose plusieurs formules adaptées à la taille de votre réseau — de l’agence unique aux grands réseaux multi-sites. Consultez nos tarifs pour trouver la formule qui correspond à vos besoins.',
      boutons: [{ label: 'Voir les tarifs', href: '#tarifs' }],
    };
  }
  if (/essai|gratuit|test|d[eé]mo version|trial/.test(q)) {
    return {
      role: 'assistant',
      contenu:
        'Oui ! Vous pouvez créer un compte gratuitement et accéder à un environnement de test complet. Aucune carte bancaire requise.',
      boutons: [{ label: 'Créer mon compte gratuit', href: '/register' }],
    };
  }
  if (/d[eé]mo|d[eé]monstration|pr[eé]sentation|rendez-vous|rdv/.test(q)) {
    return {
      role: 'assistant',
      contenu:
        'Avec plaisir ! Remplissez le formulaire de contact et notre équipe vous rappellera sous 24h pour organiser une démonstration personnalisée.',
      boutons: [{ label: 'Demander une démo', href: '#contact' }],
    };
  }
  if (/fonction|module|fonctionnalit|fait quoi|utilit|outil|op[eé]rateur|mobile money/.test(q)) {
    return {
      role: 'assistant',
      contenu:
        'GESTMONEY est la plateforme intelligente de gestion des réseaux Mobile Money en Afrique : suivi des agences, gestion des agents, flottes, commissions, reporting et conformité — en temps réel.',
      boutons: [{ label: 'Voir les fonctionnalités', href: '#fonctionnalites' }],
    };
  }
  if (/contact|t[eé]l[eé]phone|email|mail|joindre|[eé]crire|equipe/.test(q)) {
    return {
      role: 'assistant',
      contenu:
        'Notre équipe est disponible du lundi au samedi, 8h00–18h00.\n\nTél : +225 27 22 27 60 14\nWhatsApp : +225 07 78 88 25 92\nEmail : gestmoney@ibigsoft.com',
      boutons: [{ label: 'Envoyer un e-mail', href: 'mailto:gestmoney@ibigsoft.com' }],
    };
  }

  // Fallback
  return {
    role: 'assistant',
    contenu:
      'Je n’ai pas bien compris votre question. Souhaitez-vous être mis en relation avec notre équipe ?',
    boutons: [{ label: 'Contacter l’équipe', href: 'mailto:gestmoney@ibigsoft.com' }],
  };
}

/* ── Icône robot SVG ── */
function IconeRobot({ taille = 28 }: { taille?: number }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <line x1="12" y1="7" x2="12" y2="11" />
      <line x1="8" y1="16" x2="8" y2="16" strokeWidth={2.5} />
      <line x1="12" y1="16" x2="12" y2="16" strokeWidth={2.5} />
      <line x1="16" y1="16" x2="16" y2="16" strokeWidth={2.5} />
    </svg>
  );
}

export function SARAfloatingButton() {
  const [ouvert, setOuvert] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([MSG_ACCUEIL]);
  const [saisie, setSaisie] = useState('');
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ouvert) finRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, ouvert]);

  const envoyer = (texte?: string) => {
    const q = (texte ?? saisie).trim();
    if (!q) return;
    setSaisie('');
    const userMsg: Msg = { role: 'user', contenu: q };
    const reponse = repondre(q);
    setMessages((m) => [...m, userMsg, reponse]);
  };

  return (
    <>
      {/* ── Styles ── */}
      <style>{`
        @keyframes sara-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 6px 24px rgba(0,158,0,0.4); }
          50%       { transform: scale(1.06); box-shadow: 0 8px 32px rgba(0,158,0,0.55); }
        }
        @keyframes sara-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        .sara-btn-float {
          animation: sara-pulse 3s ease-in-out infinite;
        }
        .sara-btn-float:hover { animation-play-state: paused; }

        .sara-fenetre {
          position: fixed;
          bottom: 92px;
          right: 20px;
          width: min(340px, calc(100vw - 32px));
          max-height: 500px;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 16px 56px rgba(1,45,16,0.24);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 1001;
          border: 1px solid rgba(0,158,0,0.15);
        }

        /* Mobile : plein écran */
        @media (max-width: 560px) {
          .sara-fenetre {
            top: 0; left: 0; right: 0; bottom: 0;
            width: 100%; max-height: 100%;
            border-radius: 0;
          }
        }

        /* Chips de suggestion */
        .sara-chip {
          display: inline-block;
          padding: 7px 13px;
          border-radius: 999px;
          border: 1.5px solid ${VERT};
          color: ${VERT};
          background: #fff;
          font-size: 12.5px;
          cursor: pointer;
          transition: background .15s, color .15s;
          white-space: nowrap;
          font-family: inherit;
        }
        .sara-chip:hover { background: ${VERT}; color: #fff; }

        /* Boutons de réponse */
        .sara-action-btn {
          display: inline-block;
          margin-top: 8px;
          padding: 7px 14px;
          border-radius: 10px;
          background: ${VERT};
          color: #fff;
          font-size: 12.5px;
          text-decoration: none;
          font-family: inherit;
          cursor: pointer;
          border: none;
          transition: opacity .15s;
        }
        .sara-action-btn:hover { opacity: .85; }

        /* Bouton flottant — décale vers le haut sur mobile (WhatsApp en bas) */
        .sara-btn-pos {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 1000;
        }
        @media (max-width: 768px) {
          .sara-btn-pos { bottom: 88px; }
        }
      `}</style>

      {/* ── Fenêtre de chat ── */}
      {ouvert && (
        <div className="sara-fenetre" role="dialog" aria-label="Discussion avec SARA">
          {/* En-tête */}
          <div
            style={{
              background: FOND_HEADER,
              color: '#fff',
              padding: '13px 15px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: OR,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#012d10',
                flexShrink: 0,
              }}
            >
              <IconeRobot taille={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.1 }}>SARA</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Assistante IA · GESTMONEY</div>
            </div>
            {/* Point "En ligne" */}
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#4ade80',
                display: 'inline-block',
                animation: 'sara-dot 1.8s ease-in-out infinite',
                marginRight: 4,
              }}
              aria-label="En ligne"
            />
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
                fontSize: 15,
                lineHeight: 1,
                flexShrink: 0,
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
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              background: '#f8fef9',
            }}
          >
            {/* Chips de suggestion — juste après l'accueil */}
            {messages.length === 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 4 }}>
                {CHIPS.map((c) => (
                  <button key={c} className="sara-chip" onClick={() => envoyer(c)}>
                    {c}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  background: m.role === 'user' ? VERT : '#fff',
                  color: m.role === 'user' ? '#fff' : '#0a2e15',
                  padding: '9px 13px',
                  borderRadius: 14,
                  borderBottomRightRadius: m.role === 'user' ? 4 : 14,
                  borderBottomLeftRadius: m.role === 'user' ? 14 : 4,
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {m.contenu}
                {m.boutons?.map((b) => (
                  <div key={b.label}>
                    <a href={b.href} className="sara-action-btn">
                      {b.label}
                    </a>
                  </div>
                ))}
              </div>
            ))}
            <div ref={finRef} />
          </div>

          {/* Saisie */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: '10px 12px',
              borderTop: '1px solid #e8f5ea',
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
                padding: '9px 12px',
                fontSize: 13.5,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <button
              onClick={() => envoyer()}
              disabled={!saisie.trim()}
              aria-label="Envoyer"
              style={{
                background: saisie.trim() ? VERT : '#d1d5db',
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

          {/* Pied de fenêtre */}
          <div
            style={{
              fontSize: 10.5,
              color: '#9ca3af',
              textAlign: 'center',
              padding: '5px 12px 8px',
              lineHeight: 1.5,
              background: '#fff',
              borderTop: '1px solid #f3f4f6',
            }}
          >
            Réponses automatiques — IBIG Soft ·{' '}
            <a href="/legal/confidentialite" style={{ color: '#9ca3af' }}>
              Politique de confidentialité
            </a>
            <br />
            <em>Les réponses sont générées automatiquement et peuvent être imprécises.</em>
          </div>
        </div>
      )}

      {/* ── Bouton flottant ── */}
      <button
        className="sara-btn-pos sara-btn-float"
        onClick={() => setOuvert((v) => !v)}
        aria-label={ouvert ? 'Fermer SARA' : 'Besoin d’aide ? Parlez à SARA'}
        title={ouvert ? 'Fermer SARA' : 'Besoin d’aide ? Parlez à SARA'}
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: VERT,
          border: `3px solid ${OR}`,
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {ouvert ? (
          <span style={{ fontSize: 20, lineHeight: 1 }}>✕</span>
        ) : (
          <>
            <IconeRobot taille={26} />
            {/* Badge "En ligne" */}
            <span
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 11,
                height: 11,
                borderRadius: '50%',
                background: '#4ade80',
                border: '2px solid #fff',
                animation: 'sara-dot 1.8s ease-in-out infinite',
              }}
              aria-hidden="true"
            />
          </>
        )}
      </button>
    </>
  );
}
