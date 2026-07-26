# AUDIT GÉNÉRATION DE DOCUMENTS — GESTMONEY

> Généré le 2026-07-26 | Source : apps/api/src/ + apps/web/src/lib/

## Génération PDF côté web (pdfmake)

| Document | Route déclencheur | QR code | État |
|---|---|---|---|
| Guide GESTMONEY complet | `/guide` (bouton télécharger) | Non | ✅ Implémenté (pdfmake) |
| Export transactions (PDF) | `/(dashboard)/transactions` | Non | ✅ Implémenté (exportPdf.ts) |
| Export agents (PDF) | `/(dashboard)/agents` | Non | ✅ Implémenté |
| Export clients (PDF) | `/(dashboard)/clients` | Non | ✅ Implémenté |
| Export commissions (PDF) | `/(dashboard)/commissions` | Non | ✅ Implémenté |
| Export rapport BI (PDF) | `/(dashboard)/rapports` | Non | ✅ Implémenté |
| Export comptabilité (PDF) | `/(dashboard)/comptabilite` | Non | ✅ Implémenté |
| Export float (PDF) | `/(dashboard)/float` | Non | ✅ Implémenté |
| Export audit (PDF) | `/(dashboard)/audit` | Non | ✅ Implémenté |

**Technique** : export via iframe caché (fix Cloudflare WAF qui bloquait les requêtes blob directes). La librairie `pdfmake.ts` est un wrapper custom autour de pdfmake.

## Vérification de documents (QR code)

| Document | Route de génération | Route de vérification | QR code | État |
|---|---|---|---|---|
| Tout document avec token | `POST /documents/generate-verification-token` | `GET /documents/public/verify/:token` | Oui (token hex 32 chars) | ✅ Implémenté |

**Mécanisme** :
1. L'API génère un token SHA-256 lié au document (hash du contenu, type, tenant)
2. Le token est stocké dans `DocumentVerification` en DB
3. La route publique `/verify/:token` vérifie l'authenticité sans authentification
4. Chaque vérification incrémente `verifiedCount`

## Validation des pièces jointes (PaymentsService)

- Types acceptés : images (jpg, png, gif, webp, heic, heif) + PDF
- Sécurité : double extension détectée (ex: `recu.pdf.php`)
- Vérification MIME type + extension
- Stockage : base64 en base de données (non recommandé pour la production à grande échelle)

## Ce qui manque

| Document manquant | Priorité | Note |
|---|---|---|
| **Reçu de transaction (PDF officiel)** | P1 | Actuellement pas de génération serveur-side de reçu avec QR de vérification |
| **Fiche de paie employé (PDF)** | P2 | Module RH présent mais génération PDF absente |
| **Bon de commande stock (PDF)** | P3 | Module stock présent mais export PDF non documenté |
| **Rapport de caisse (PDF signé)** | P2 | Clôture de caisse sans PDF récapitulatif |

## Recommandations

1. Générer les reçus de transaction côté API (NestJS) avec pdfmake-node et inclure un QR code de vérification — indispensable pour la conformité réglementaire.
2. Migrer le stockage des pièces jointes de la base64-en-DB vers un stockage objet (MinIO/S3).
3. Ajouter la génération de fiches de paie PDF dans le module RH.
