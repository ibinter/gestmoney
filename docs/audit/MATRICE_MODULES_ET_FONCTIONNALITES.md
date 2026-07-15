# MATRICE MODULES & FONCTIONNALITÉS — GESTMONEY
> Date : 2026-07-15 | Source : analyse du code source  
> Légende : ✅ Implémenté | ⚠️ Partiel | ❌ Absent | 🔀 Redirect

---

## ESPACE DASHBOARD TENANT

| Module | Liste | Création | Modification | Suppression | Export | Permissions rôle | FR | EN | Mobile | Validé |
|--------|-------|----------|-------------|-------------|--------|------------------|----|----|--------|--------|
| **Transactions** | ✅ paginée côté serveur | ✅ dépôt/retrait/cash_in/cash_out | ❌ | ❌ | ✅ CSV | ❌ pas de guard rôle frontend | ✅ | ✅ | ⚠️ (table overflow) | ⚠️ |
| **Agents** | ✅ paginée côté client | ✅ modal formulaire | ❌ | ❌ | ✅ CSV | ❌ | ✅ | ✅ | ⚠️ | ⚠️ |
| **Agences** | ✅ paginée côté client | ✅ modal formulaire | ❌ | ❌ | ✅ CSV | ❌ | ✅ | ✅ | ⚠️ | ⚠️ |
| **Float** | ✅ soldes + mouvements | ✅ demande réappro | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ⚠️ | ⚠️ |
| **Caisse** | ✅ journal écritures | ✅ ajout écriture | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ⚠️ | ⚠️ |
| **Commissions** | ✅ par période | ❌ | ✅ valider | ❌ | ✅ CSV | ❌ | ✅ | ✅ | ⚠️ | ⚠️ |
| **Clients** | ✅ paginée côté client | ✅ modal formulaire | ❌ | ❌ | ✅ CSV | ❌ | ✅ | ✅ | ⚠️ | ⚠️ |
| **Rapports** | ✅ historique | ✅ génération à la demande | ❌ | ❌ | ✅ PDF/XLSX/CSV | ❌ | ✅ | ✅ | ⚠️ | ⚠️ |
| **Performances** | ✅ stats + top agents | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ⚠️ | ⚠️ |
| **Support / Tickets** | ✅ liste tickets | ✅ créer ticket | ❌ | ❌ | ❌ | ❌ | ✅ | ⚠️ | ⚠️ | ⚠️ |
| **Paramètres** | ✅ onglets | ⚠️ formulaire non sauvegardé | ⚠️ non connecté API | ❌ | ❌ | ❌ | ✅ | ✅ | ⚠️ | ❌ |
| **Aide / Guide** | ✅ FAQ accordéon | ❌ | ❌ | ❌ | ✅ PDF | ❌ | ✅ | ⚠️ | ⚠️ | ⚠️ |
| **Notifications** | ✅ | ❌ | ✅ marquer lu/non lu | ✅ supprimer | ❌ | ❌ | ✅ | ✅ | ✅ | ⚠️ |
| **Profil** | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ✅ | ✅ | ⚠️ | ⚠️ |
| **Dashboard KPI** | ✅ 8 cartes | ❌ | ❌ | ❌ | ⚠️ bouton vide | ❌ | ✅ | ✅ | ⚠️ | ⚠️ |

### Modules ABSENTS du dashboard tenant (données Prisma existantes)

| Module | Liste | Création | Modification | Suppression | Export | FR | EN | Mobile |
|--------|-------|----------|-------------|-------------|--------|----|----|--------|
| **Comptabilité** (journaux, grand livre) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **RH / Employés** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Paie** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Stock / Inventaire** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Super-agents** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Annulations (Reversal)** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Fraude / ML** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **KYC** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Audit logs** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Rôles & Permissions** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Taux de change** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Intégrations opérateurs** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## ESPACE SUPERADMIN IBIG SOFT

| Module | Liste | Création | Modification | Suppression | Export | Données réelles | FR | EN | Mobile |
|--------|-------|----------|-------------|-------------|--------|-----------------|----|----|--------|
| **Dashboard SA** | ⚠️ MOCK | ❌ | ❌ | ❌ | ❌ | ❌ MOCK | ✅ | ✅ | ⚠️ |
| **Prospects CRM** | À analyser | À analyser | À analyser | À analyser | À analyser | À analyser | ✅ | ⚠️ | ⚠️ |
| **Démonstrations** | À analyser | À analyser | À analyser | À analyser | À analyser | À analyser | ✅ | ⚠️ | ⚠️ |
| **Offres** | À analyser | À analyser | À analyser | À analyser | À analyser | À analyser | ✅ | ⚠️ | ⚠️ |
| **Licences** | À analyser | À analyser | À analyser | À analyser | À analyser | À analyser | ✅ | ⚠️ | ⚠️ |
| **Paiements SaaS** | À analyser | À analyser | À analyser | À analyser | À analyser | À analyser | ✅ | ⚠️ | ⚠️ |
| **Emails automatiques** | À analyser | À analyser | À analyser | À analyser | À analyser | À analyser | ✅ | ⚠️ | ⚠️ |
| **SARA IA config** | À analyser | À analyser | À analyser | À analyser | À analyser | À analyser | ✅ | ⚠️ | ⚠️ |
| **Analytics globaux** | À analyser | ❌ | ❌ | ❌ | À analyser | À analyser | ✅ | ⚠️ | ⚠️ |
| **Tenants** | ❌ MANQUANT | ❌ | ❌ | ❌ | ❌ | — | ❌ | ❌ | ❌ |
| **Utilisateurs globaux** | ❌ MANQUANT | ❌ | ❌ | ❌ | ❌ | — | ❌ | ❌ | ❌ |
| **Audit global** | ❌ MANQUANT | ❌ | ❌ | ❌ | ❌ | — | ❌ | ❌ | ❌ |

---

## DÉTAIL PAR FONCTIONNALITÉ TRANSVERSALE

### Export de données

| Module | CSV | PDF | XLSX | Etat |
|--------|-----|-----|------|------|
| Transactions | ✅ `exporterCsv` | ❌ | ❌ | PARTIEL |
| Agents | ✅ `exporterCsv` | ❌ | ❌ | PARTIEL |
| Agences | ✅ `exporterCsv` | ❌ | ❌ | PARTIEL |
| Commissions | ✅ `exporterCsv` | ❌ | ❌ | PARTIEL |
| Clients | ✅ `exporterCsv` | ❌ | ❌ | PARTIEL |
| Rapports | ✅ `exporterCsv` | ✅ `exporterPdf` | ✅ `exporterXlsx` | COMPLET |
| Aide | ❌ | ✅ `exporterPdf` | ❌ | PARTIEL |
| Float | ❌ | ❌ | ❌ | ABSENT |
| Caisse | ❌ | ❌ | ❌ | ABSENT |
| Performances | ❌ | ❌ | ❌ | ABSENT |

### Recherche et filtres

| Module | Recherche texte | Filtre statut | Filtre date | Filtre opérateur |
|--------|----------------|--------------|------------|-----------------|
| Transactions | ✅ | ✅ | ❌ | ✅ |
| Agents | ✅ | ✅ | ❌ | — |
| Agences | ✅ | ❌ | ❌ | — |
| Clients | ✅ | ✅ KYC | ❌ | — |
| Commissions | ❌ | ❌ | ✅ période | — |
| Notifications | ❌ | ✅ type | ❌ | — |
| Support | ❌ | ✅ statut/priorité | ❌ | — |

### Internationalisation (i18n)

| Clé `useT()` | FR | EN | Notes |
|-------------|----|----|-------|
| `t.dashboard.*` | ✅ | ✅ | Completé |
| `t.transactions.*` | ✅ | ✅ | Completé |
| `t.common.*` | ✅ | ✅ | Completé |
| `t.rapports.*` | ✅ | ✅ | Completé |
| Pages support, aide, caisse | ✅ FR | ⚠️ Partiel EN | Chaînes en dur en français dans certains composants |

### Accessibilité mobile

| Module | Responsive observé | Overflow table | Breakpoints |
|--------|-------------------|---------------|------------|
| Transactions | ⚠️ Table large | Possible overflow mobile | `sm:flex-row` |
| Agents | ⚠️ Table large | Possible overflow mobile | `sm:flex-row` |
| Dashboard | ✅ Grid responsive | — | `sm:col-2 lg:col-3 xl:col-4` |
| Float | ✅ Cards + table | — | — |
| Layout sidebar | ✅ Overlay mobile | — | Mode fixe desktop / overlay mobile |

---

## SCORE GLOBAL PAR MODULE (estimation)

| Module | Score (/10) | Commentaire |
|--------|-------------|-------------|
| Transactions | 7/10 | Complet mais manque filtre date, page détail |
| Agents | 6/10 | Manque édition, page détail, filtre date |
| Agences | 6/10 | Idem agents |
| Float | 7/10 | Bon mais manque export |
| Caisse | 6/10 | Manque export, édition écriture |
| Commissions | 6/10 | Manque recherche texte, filtre avancé |
| Clients | 6/10 | Manque édition, page détail, historique transactions |
| Rapports | 5/10 | Périodes statiques — bloquant en production |
| Performances | 5/10 | Stats OK mais manque export, objectifs configurables |
| Support | 4/10 | Fonctionnel de base mais sans hook dédié |
| Paramètres | 3/10 | Non connecté à l'API |
| Aide | 3/10 | Contenu statique |
| Notifications | 7/10 | Bien implémenté |
| SuperAdmin dashboard | 1/10 | Données MOCK |
| Comptabilité | 0/10 | ABSENT frontend |
| RH / Paie | 0/10 | ABSENT frontend |
| Stock | 0/10 | ABSENT frontend |
