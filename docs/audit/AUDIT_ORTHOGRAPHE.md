# AUDIT ORTHOGRAPHE & QUALITÉ DU TEXTE — GESTMONEY

> Généré le 2026-07-26 | Source : apps/web/src/**/*.tsx

## Résultat global

Pas de faute grave détectée dans les chaînes UI directes. La majorité des textes passe par le système i18n (`fr.ts` / `en.ts`), ce qui centralise la gestion des libellés.

Les textes hardcodés dans les composants sont peu nombreux et globalement corrects.

---

## Fautes et incohérences détectées

| Fichier | Texte trouvé | Correction | Gravité |
|---|---|---|---|
| `login/page.tsx:146` | `ADRESSE EMAIL` (tout en majuscules, label) | `Adresse e-mail` (capitalisation normale) | Basse |
| `login/page.tsx:176` | `MOT DE PASSE` (tout en majuscules, label) | `Mot de passe` | Basse |
| `login/page.tsx:250` | `Se connecter` (bouton) | Correct — cohérent avec i18n | OK |
| `register/page.tsx:211` | `Email professionnel *` | `Adresse e-mail professionnelle *` (accord féminin) | Basse |
| `administration/page.tsx:350` | `'Email'` (colonne hardcodée) | Utiliser `t.common.email` (i18n) | Basse |
| Multiple | `connexion` vs `connecter` | Cohérent — `connexion` (nom) et `se connecter` (verbe) sont corrects | OK |

---

## Conventions respectées

| Convention | État |
|---|---|
| Accents sur les majuscules (É, À, Î) | ✅ Présents dans les textes i18n |
| Espaces insécables avant `:` et `?` et `!` | ⚠️ Non vérifiable en JavaScript (rendu navigateur) |
| `e-mail` vs `email` | ⚠️ Incohérent — `email` utilisé dans la plupart des labels, `e-mail` dans certains |
| Guillemets français (`«»`) | ❌ Non utilisés (guillemets droits partout) |
| Unités monétaires (`FCFA` vs `XOF`) | ✅ `FCFA` utilisé dans les messages utilisateur (correct pour le public cible) |

---

## Recommandations

1. **Uniformiser `email` / `e-mail`** : choisir une convention et l'appliquer dans tout `fr.ts`.
2. **Labels hardcodés** : remplacer les quelques labels hardcodés (`'Email'` dans `administration/page.tsx`) par des clés i18n.
3. **Majuscules UI** (`ADRESSE EMAIL`, `MOT DE PASSE`) : passer en CSS `text-transform: uppercase` plutôt qu'en dur dans le JSX — cela permet une traduction plus propre.
4. **Fautes critiques** : aucune — la qualité générale du texte est bonne.
