/**
 * Helper côté client pour générer un token de vérification de document
 * et obtenir l'URL à intégrer dans un PDF avant son téléchargement.
 *
 * Usage typique :
 *   const verifyUrl = await getDocumentVerifyUrl('txn_abc123', 'RECU_TRANSACTION');
 *   // puis intégrer verifyUrl dans la définition pdfmake du document
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export type DocumentType = 'RECU_TRANSACTION' | 'RAPPORT' | 'FACTURE';

export interface VerifyTokenResponse {
  token: string;
  verifyUrl: string;
}

/**
 * Appelle le backend pour générer un token de vérification.
 * Retourne l'URL publique à embarquer dans le PDF.
 * En cas d'erreur, retourne `null` (le PDF reste téléchargeable sans token).
 */
export async function getDocumentVerifyUrl(
  documentId: string,
  documentType: DocumentType,
  contentSample?: string,
): Promise<string | null> {
  try {
    // Récupère le token JWT depuis le cookie (les Server Actions le font via headers,
    // ici on lit le cookie côté client si disponible, sinon on passe par fetch
    // avec credentials: 'include' pour envoyer le cookie httpOnly).
    const res = await fetch(`${API_BASE}/documents/generate-verification-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ documentId, documentType, contentSample }),
    });

    if (!res.ok) return null;

    const data: VerifyTokenResponse = await res.json();
    return data.verifyUrl;
  } catch {
    return null;
  }
}

/**
 * Construit le bloc pdfmake à ajouter en bas de chaque document PDF vérifié.
 * À inclure dans le tableau `content` de la définition pdfmake.
 */
export function buildVerificationBlock(verifyUrl: string) {
  return {
    margin: [0, 24, 0, 0] as [number, number, number, number],
    stack: [
      {
        canvas: [
          {
            type: 'line' as const,
            x1: 0, y1: 0, x2: 515, y2: 0,
            lineWidth: 0.5,
            lineColor: '#cccccc',
          },
        ],
        margin: [0, 0, 0, 8] as [number, number, number, number],
      },
      {
        columns: [
          {
            width: '*',
            stack: [
              {
                text: 'Vérifiez l\'authenticité de ce document :',
                fontSize: 7,
                color: '#888888',
              },
              {
                text: verifyUrl,
                fontSize: 7,
                color: '#009E00',
                bold: true,
                // pdfmake ne supporte pas les vraies URLs dans un champ text
                // mais affiche le lien comme texte — suffisant pour scanner / taper.
              },
            ],
          },
          {
            width: 'auto',
            text: 'GESTMONEY — IBIG Soft',
            fontSize: 7,
            color: '#aaaaaa',
            alignment: 'right' as const,
          },
        ],
      },
    ],
  };
}
