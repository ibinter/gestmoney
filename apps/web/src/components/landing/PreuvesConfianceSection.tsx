const BADGES = [
  { emoji: '✅', label: 'Solution IBIG Soft' },
  { emoji: '🔒', label: 'Données sécurisées HTTPS' },
  { emoji: '🌍', label: '12+ opérateurs Mobile Money' },
  { emoji: '📱', label: 'Application multilingue FR/EN' },
  { emoji: '🕐', label: 'Accessible 24h/24 — 7j/7' },
  { emoji: '🌍', label: 'Adapté aux réalités africaines' },
  { emoji: '🔄', label: 'Mises à jour automatiques' },
  { emoji: '⚡', label: 'Installation sans téléchargement' },
] as const;

export function PreuvesConfianceSection() {
  return (
    <section
      aria-label="Preuves de confiance"
      style={{
        background: '#fafffe',
        borderTop: '1px solid #e8f5e9',
        borderBottom: '1px solid #e8f5e9',
        padding: '18px clamp(16px,4vw,48px)',
      }}
    >
      {/* Scrollable row */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          /* Hide scrollbar cross-browser */
          scrollbarWidth: 'none',
          msOverflowStyle: 'none' as const,
          paddingBottom: 2, /* prevent clipping box-shadow */
        }}
        /* WebKit scrollbar hidden via global CSS or inline pseudoelement not possible — scrollbarWidth covers Firefox */
      >
        {BADGES.map(({ emoji, label }) => (
          <span
            key={label}
            style={{
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#f0fdf4',
              border: '1px solid #d1fae5',
              color: '#166534',
              borderRadius: 999,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            <span aria-hidden="true">{emoji}</span>
            {label}
          </span>
        ))}
      </div>

      {/* Hide WebKit scrollbar */}
      <style>{`
        section[aria-label="Preuves de confiance"] div::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}
