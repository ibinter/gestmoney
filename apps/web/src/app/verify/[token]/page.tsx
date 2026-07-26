import React from 'react';

interface VerifyResult {
  valid: boolean;
  document?: {
    id: string;
    documentId: string;
    documentType: string;
    tenantId: string;
    createdAt: string;
    verifiedCount: number;
    expiresAt: string | null;
  };
  reason?: string;
}

const TYPE_LABELS: Record<string, string> = {
  RECU_TRANSACTION: 'Reçu de transaction',
  RAPPORT: 'Rapport financier',
  FACTURE: 'Facture',
};

async function fetchVerification(token: string): Promise<VerifyResult> {
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ?? 'https://gestmoney.ibigsoft.com/api/v1';
  try {
    const res = await fetch(`${apiBase}/public/verify/${token}`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return { valid: false, reason: 'Erreur de connexion au serveur.' };
    return res.json();
  } catch {
    return { valid: false, reason: 'Impossible de joindre le serveur de vérification.' };
  }
}

export default async function VerifyPage({
  params,
}: {
  params: { token: string };
}) {
  const result = await fetchVerification(params.token);

  const doc = result.document;
  const typeLabel = doc ? (TYPE_LABELS[doc.documentType] ?? doc.documentType) : '';
  const createdDate = doc
    ? new Date(doc.createdAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          maxWidth: '480px',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Bandeau couleur */}
        <div
          style={{
            background: result.valid ? '#009E00' : '#C41E1E',
            padding: '28px 32px 20px',
            color: '#fff',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>
            {result.valid ? '✅' : '❌'}
          </div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>
            {result.valid ? 'Document authentique' : 'Document introuvable'}
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: '14px', opacity: 0.9 }}>
            {result.valid
              ? 'Ce document a été émis par GESTMONEY et n\'a pas été altéré.'
              : result.reason ?? 'Ce lien est invalide ou a expiré.'}
          </p>
        </div>

        {/* Corps */}
        <div style={{ padding: '28px 32px' }}>
          {result.valid && doc ? (
            <>
              <dl style={{ margin: 0, display: 'grid', gap: '14px' }}>
                <Row label="Type de document" value={typeLabel} />
                <Row label="Référence" value={doc.documentId} mono />
                <Row label="Émis le" value={createdDate} />
                <Row
                  label="Nombre de vérifications"
                  value={String(doc.verifiedCount)}
                />
                {doc.expiresAt && (
                  <Row
                    label="Expire le"
                    value={new Date(doc.expiresAt).toLocaleDateString('fr-FR')}
                  />
                )}
              </dl>

              <div
                style={{
                  marginTop: '24px',
                  padding: '14px 16px',
                  background: '#f0faf0',
                  borderRadius: '8px',
                  borderLeft: '4px solid #009E00',
                  fontSize: '13px',
                  color: '#2a6a2a',
                  lineHeight: '1.5',
                }}
              >
                <strong>Comment lire ce résultat ?</strong> Ce document a été généré
                et signé par le système GESTMONEY. Son authenticité est garantie tant
                que ce lien est valide.
              </div>
            </>
          ) : (
            <p style={{ color: '#666', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
              Le document associé à ce lien est introuvable dans notre base de données.
              Il est possible que le lien ait expiré, que le document ait été révoqué,
              ou que l&apos;URL soit incorrecte.
              <br />
              <br />
              Contactez l&apos;émetteur du document pour obtenir un nouveau lien de
              vérification.
            </p>
          )}

          <div
            style={{
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid #eee',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: '16px',
                letterSpacing: '0.5px',
              }}
            >
              <span style={{ color: '#111' }}>GEST</span>
              <span style={{ color: '#F5B800' }}>M</span>
              <span style={{ color: '#C41E1E' }}>O</span>
              <span style={{ color: '#009E00' }}>N</span>
              <span style={{ color: '#111' }}>EY</span>
            </span>
            <span style={{ color: '#999', fontSize: '12px' }}>
              Système de vérification de documents — ibigsoft.com
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <dt
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: '#888',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          margin: 0,
          fontSize: '14px',
          color: '#111',
          fontFamily: mono ? 'monospace' : 'inherit',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </dd>
    </div>
  );
}
