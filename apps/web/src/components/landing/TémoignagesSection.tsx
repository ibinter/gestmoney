'use client';

const témoignages = [
  {
    nom: 'Konan Arsène',
    titre: 'Directeur, Réseau Orange Money Bouaké',
    initiales: 'KA',
    couleur: '#f97316',
    texte:
      "Avant GESTMONEY, je perdais 2h chaque soir à consolider les Excel de mes 8 agences. Maintenant tout est en temps réel.",
  },
  {
    nom: 'Fatoumata Diallo',
    titre: 'Gérante, Agence Wave Abidjan Plateau',
    initiales: 'FD',
    couleur: '#8b5cf6',
    texte:
      "Le calcul automatique des commissions a éliminé tous nos conflits avec les agents. Chacun voit ses gains en temps réel.",
  },
  {
    nom: 'Moussa Traoré',
    titre: 'Responsable MTN MoMo, Mali',
    initiales: 'MT',
    couleur: '#0ea5e9',
    texte:
      "L'import de nos 2 000 clients depuis Excel s'est fait en 20 minutes. L'équipe support a été exceptionnelle.",
  },
  {
    nom: 'Aminata Coulibaly',
    titre: 'DG, Groupe de change, Dakar',
    initiales: 'AC',
    couleur: '#ec4899',
    texte:
      "La comptabilité OHADA intégrée nous a évité d'embaucher un comptable supplémentaire. ROI immédiat.",
  },
  {
    nom: 'Jean-Claude Aké',
    titre: 'IT Manager, Réseau multiservice',
    initiales: 'JA',
    couleur: '#14b8a6',
    texte:
      "La gestion des rôles est très fine. Chaque agent ne voit que ses propres transactions. Aucune fuite d'information.",
  },
  {
    nom: 'Binta Keïta',
    titre: 'Fondatrice, FinTech startup',
    initiales: 'BK',
    couleur: '#009E00',
    texte:
      "Le démarrage en 1 heure, l'interface en français, le support réactif… Je recommande à tous mes partenaires.",
  },
];

function Étoiles() {
  return (
    <div style={{ display: 'flex', gap: '2px', marginBottom: '12px' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="#f59e0b"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </div>
  );
}

function CarteTestimonial({
  nom,
  titre,
  initiales,
  couleur,
  texte,
}: (typeof témoignages)[0]) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        padding: '28px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        border: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
      }}
    >
      {/* Guillemet */}
      <div
        style={{
          fontSize: '3.5rem',
          lineHeight: 1,
          color: '#009E00',
          fontFamily: 'Georgia, serif',
          marginBottom: '8px',
          opacity: 0.4,
          userSelect: 'none',
        }}
      >
        "
      </div>

      {/* Texte */}
      <p
        style={{
          color: '#374151',
          fontSize: '0.95rem',
          lineHeight: 1.7,
          flex: 1,
          margin: '0 0 20px 0',
          fontStyle: 'italic',
        }}
      >
        {texte}
      </p>

      <Étoiles />

      {/* Auteur */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: couleur,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.85rem',
            flexShrink: 0,
          }}
        >
          {initiales}
        </div>
        <div>
          <div
            style={{
              fontWeight: 600,
              fontSize: '0.9rem',
              color: '#111827',
            }}
          >
            {nom}
          </div>
          <div
            style={{
              fontSize: '0.8rem',
              color: '#6b7280',
              marginTop: '2px',
            }}
          >
            {titre}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TémoignagesSection() {
  return (
    <section
      style={{
        backgroundColor: '#f0fdf4',
        padding: '80px 24px',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span
            style={{
              display: 'inline-block',
              backgroundColor: '#dcfce7',
              color: '#009E00',
              fontWeight: 600,
              fontSize: '0.8rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '4px 14px',
              borderRadius: '999px',
              marginBottom: '16px',
            }}
          >
            Témoignages
          </span>
          <h2
            style={{
              fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '16px',
              lineHeight: 1.2,
            }}
          >
            Ils font confiance à GESTMONEY
          </h2>

          {/* Note globale */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#ffffff',
              border: '1px solid #bbf7d0',
              borderRadius: '999px',
              padding: '8px 20px',
              boxShadow: '0 1px 6px rgba(0,158,0,0.08)',
            }}
          >
            <div style={{ display: 'flex', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <svg
                  key={i}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="#f59e0b"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
              ))}
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: '0.95rem',
                color: '#111827',
              }}
            >
              4.9/5
            </span>
            <span
              style={{
                color: '#6b7280',
                fontSize: '0.875rem',
              }}
            >
              — 230+ réseaux équipés
            </span>
          </div>
        </div>

        {/* Grille */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px',
          }}
        >
          {témoignages.map((t, i) => (
            <CarteTestimonial key={i} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}
