# AUDIT RESPONSIVE — GESTMONEY

> Généré le 2026-07-26 | Source : tests visuels + commits récents

## Breakpoints Tailwind utilisés

| Breakpoint | Taille | Tailwind |
|---|---|---|
| Mobile | < 640px | `sm:` |
| Tablette | 640–1024px | `md:` / `lg:` |
| Desktop | > 1024px | `xl:` / `2xl:` |

---

## Problèmes identifiés et corrigés

| Page | Breakpoint | Problème | Correction | État |
|---|---|---|---|---|
| **Landing (footer)** | Mobile < 640px | Footer affiché sur 1 colonne — hauteur 1 441 px | 2 colonnes + contacts en bande | ✅ Corrigé (commit `6fef3b4`) |
| **Landing (footer)** | Mobile | Footer trop volumineux | Format compact, colonnes explicites | ✅ Corrigé (commit `9343dfb`) |

---

## État par page (auto-évaluation)

| Page | Mobile | Tablette | Desktop | Problèmes connus |
|---|---|---|---|---|
| Landing `/` | ⚠️ | ✅ | ✅ | Footer corrigé, autres sections à tester |
| Login `/login` | ✅ | ✅ | ✅ | Formulaire centré responsive |
| Dashboard (accueil) | ⚠️ | ✅ | ✅ | KPI tiles empilées sur mobile |
| Transactions | ⚠️ | ✅ | ✅ | Tableau horizontal — défilement horizontal sur mobile |
| Agents | ⚠️ | ✅ | ✅ | Tableau — défilement horizontal |
| Clients | ⚠️ | ✅ | ✅ | Tableau — défilement horizontal |
| Float | ✅ | ✅ | ✅ | Cartes — bien responsive |
| Caisse | ✅ | ✅ | ✅ | Cartes simples |
| Commissions | ⚠️ | ✅ | ✅ | Tableau — défilement horizontal |
| Rapports | ⚠️ | ✅ | ✅ | Graphiques peuvent déborder sur mobile |
| Comptabilité | ⚠️ | ⚠️ | ✅ | Tableaux complexes difficiles sur < 768px |
| SuperAdmin | ❌ | ⚠️ | ✅ | Console conçue pour desktop uniquement |
| Guide | ✅ | ✅ | ✅ | Sidebar masquée sur mobile |
| Support | ✅ | ✅ | ✅ | |

---

## Recommandations

1. **Tableaux de données** : implémenter une vue "carte" alternative pour mobile (< 640px) sur les pages Transactions, Agents, Clients, Commissions.
2. **Dashboard mobile** : tester sur iPhone SE (375px) — les KPI tiles peuvent dépasser la largeur.
3. **Comptabilité** : le grand livre et le tableau de bord comptable sont très larges — ajouter `overflow-x-auto` sur les conteneurs.
4. **SuperAdmin** : acceptable de rester desktop-only mais ajouter un message d'avertissement sur mobile.
5. **Graphiques (Rapports)** : vérifier que les charts Recharts utilisent `width="100%"` et non des valeurs fixes.
