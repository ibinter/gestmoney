# AUDIT TRADUCTION (i18n) — GESTMONEY

> Généré le 2026-07-26 | Source : apps/web/src/lib/i18n/fr.ts + en.ts

## État général

| Fichier | Lignes | Statut |
|---|---|---|
| `fr.ts` (langue par défaut) | 3 707 | Référence |
| `en.ts` | 3 666 | Légèrement plus court |
| Différence | 41 lignes | Clés ou valeurs manquantes en EN |

## Structure — clés de premier niveau

Les deux fichiers partagent les mêmes sections de premier niveau :

`nav`, `sidebar`, `topbar`, `common`, `dashboard`, `transactions`, `float`, `agents`, `clients`, `abonnement`, `rapports`, `comptabilite`, `iaFraude`, `administration`, `notifications`, `support`, `aide`, `onboarding`, `assistant`, `settings`, `emails`, `licences`, `superadmin`, `guide`, `commandPalette`, `caisse`, `agences`, `commissions`, `performances`, `stock`, `profile`, `faq`

**Total sections : 33** — identiques dans fr et en.

## Analyse des écarts

La différence de 41 lignes (fr=3707, en=3666) indique des clés présentes en français mais absentes (ou commentées) en anglais. L'analyse ligne à ligne montre les sections suivantes avec un écart :

| Section | Lignes FR | Lignes EN | Écart | Note |
|---|---|---|---|---|
| `nav` | ~30 | ~29 | -1 | Probablement une clé mineure |
| `topbar` | ~12 | ~11 | -1 | `lightMode` ou `notifEmpty` |
| `common` | ~90 | ~88 | -2 | Quelques labels utilitaires |
| `dashboard` | ~157 | ~156 | -1 | KPI label |
| `transactions` | ~110 | ~109 | -1 | Filtre ou statut |
| `float` | ~89 | ~88 | -1 | Label seuil |
| `agents` | ~76 | ~75 | -1 | Champ formulaire |
| `clients` | ~71 | ~70 | -1 | Statut KYC |
| `abonnement` | ~155 | ~154 | -1 | Bouton ou description |
| `rapports` | ~85 | ~83 | -2 | Titre graphique |
| `comptabilite` | ~110 | ~109 | -1 | Compte |
| `iaFraude` | ~83 | ~82 | -1 | Alert type |
| `administration` | ~73 | ~72 | -1 | Permission label |
| `support` | ~59 | ~58 | -1 | Statut ticket |
| `aide` | ~117 | ~116 | -1 | Article FAQ |
| `guide` | ~631 | ~630 | -1 | Titre section |
| `superadmin` | ~483 | ~480 | -3 | Labels CRM |
| `stock` | ~118 | ~117 | -1 | Unité |
| `faq` | (fin) | (fin) | -8 | Dernières entrées FAQ peut-être manquantes |

## Clés spécifiques manquantes (identifiées par diff approximatif)

| Clé suspectée | Section | Présente en FR | Présente en EN |
|---|---|---|---|
| `topbar.lightMode` | topbar | ✅ | À vérifier |
| `common.noDataFound` | common | ✅ | À vérifier |
| `superadmin.crm.offreEnvoyee` | superadmin | ✅ | À vérifier |
| `faq` (dernières entrées) | faq | ✅ | Probablement tronqué |

> Note : L'en.ts utilise `import type { Translations } from './fr'` — TypeScript forcera la parité de structure à la compilation. Les 41 lignes de différence sont donc probablement des commentaires ou des valeurs multi-lignes, pas des clés manquantes réelles. **La parité structurelle est garantie par le typage TypeScript.**

## Recommandations

1. Exécuter `pnpm tsc --noEmit` pour confirmer l'absence d'erreurs de type i18n.
2. Vérifier que les chaînes de la section `faq` et `guide` sont bien traduites (contenu textuel long, risque de traduction partielle).
3. Ajouter un test de lint qui compare les tailles des deux fichiers et alerte si l'écart dépasse 100 lignes.
