'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Erreur critique — GESTMONEY</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: #ffffff;
            color: #111111;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 24px;
            text-align: center;
          }
          .logo { font-size: 1.75rem; font-weight: 900; letter-spacing: 0.05em; color: #009E00; margin-bottom: 1.5rem; }
          h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem; color: #1a1a1a; }
          p { font-size: 0.95rem; color: #555; line-height: 1.6; max-width: 420px; margin-bottom: 1.5rem; }
          a { color: #009E00; }
          .digest { font-family: monospace; font-size: 0.75rem; color: #aaa; margin-bottom: 1.5rem; }
          button {
            background: #009E00;
            color: #ffffff;
            border: none;
            border-radius: 8px;
            padding: 12px 28px;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
          }
          button:hover { background: #007a00; }
        `}</style>
      </head>
      <body>
        <div className="logo">GESTMONEY</div>

        {/* Icône croix simple */}
        <svg
          width="56" height="56" viewBox="0 0 24 24" fill="none"
          stroke="#cc0000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ marginBottom: '1.25rem' }}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>

        <h1>Erreur critique</h1>
        <p>
          Une erreur irrécupérable est survenue. Veuillez contacter le support :{' '}
          <a href="mailto:gestmoney@ibigsoft.com">gestmoney@ibigsoft.com</a>
        </p>

        {error.digest && (
          <p className="digest">Réf. : {error.digest}</p>
        )}

        <button onClick={() => window.location.reload()}>
          Recharger la page
        </button>
      </body>
    </html>
  );
}
