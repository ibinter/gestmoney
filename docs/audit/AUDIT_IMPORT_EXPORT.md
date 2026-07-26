# AUDIT IMPORT / EXPORT — GESTMONEY

> Généré le 2026-07-26

## Exports côté API (backend)

| Module | Route | Format | Fichier | État |
|---|---|---|---|---|
| Audit | `GET /audit/export` | CSV ou JSON | `audit.controller.ts` | ✅ Implémenté |
| Customers | `POST /customers/import` | (upload) | `customers.controller.ts` | ⚠️ Route définie, parsing à vérifier |

## Exports côté Web (frontend)

Le frontend dispose d'un utilitaire d'export unifié (`apps/web/src/lib/exportCsv.ts`, `exportPdf.ts`, `pdfmake.ts`) intégré sur plusieurs pages via un menu "Exporter".

| Page | CSV | Excel | PDF | État |
|---|---|---|---|---|
| Transactions | ✅ | ✅ | ✅ | ✅ Fonctionnel |
| Agents | ✅ | ✅ | ✅ | ✅ Fonctionnel |
| Clients | ✅ | ✅ | ✅ | ✅ Fonctionnel |
| Float | ✅ | ✅ | ✅ | ✅ Fonctionnel |
| Commissions | ✅ | ✅ | ✅ | ✅ Fonctionnel |
| Rapports | ✅ | ✅ | ✅ | ✅ Fonctionnel |
| Comptabilité | ✅ | ✅ | ✅ | ✅ Fonctionnel |
| Audit | ✅ | — | ✅ | ✅ Fonctionnel |
| Stock | ✅ | ✅ | ✅ | ⚠️ À vérifier |
| RH | ✅ | ✅ | ✅ | ⚠️ À vérifier |

## Imports côté Web

| Type | Module | Format attendu | État |
|---|---|---|---|
| Import clients en masse | Clients | CSV/Excel | ⚠️ Route backend `POST /customers/import` présente, frontend à vérifier |
| Import stock | Stock | CSV | ❌ Non documenté |

## Librairies utilisées

| Librairie | Usage | Côté |
|---|---|---|
| `pdfmake` | Génération PDF côté web (guide + exports) | Web |
| `exportCsv.ts` (utilitaire interne) | Export CSV depuis données JSON | Web |
| `exportPdf.ts` | Export PDF via iframe caché | Web |

## Observations

1. **Export PDF côté web** : fonctionne via iframe caché (fix Cloudflare) — technique fiable mais moins élégante qu'un blob direct.
2. **Import clients** : la route backend existe mais la validation du fichier CSV/Excel n'a pas été vérifiée.
3. **Export API-side** : seul le module audit a un endpoint d'export côté API. Pour les autres modules, l'export se fait côté client (frontend).
4. **Pas de génération PDF côté API** : les reçus de transaction et autres documents officiels sont générés côté web — pas de signature électronique ni de génération serveur-side robuste.
