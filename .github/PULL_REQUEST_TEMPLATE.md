## Description

<!-- Décrivez brièvement les changements apportés et pourquoi -->

## Type de changement

- [ ] Bug fix (correction non-breaking)
- [ ] Nouvelle fonctionnalité (ajout non-breaking)
- [ ] Breaking change (correction ou fonctionnalité qui casse l'existant)
- [ ] Refactoring (pas de changement fonctionnel)
- [ ] Documentation
- [ ] CI/CD / Infrastructure
- [ ] Dépendances

## Issue liée

Closes #<!-- numéro de l'issue -->

---

## Checklist

### Code

- [ ] Le code respecte les conventions du projet (ESLint, Prettier)
- [ ] J'ai effectué une auto-review de mon code
- [ ] J'ai commenté les parties complexes ou non évidentes
- [ ] Pas de `console.log` ou code de débogage laissé

### Tests

- [ ] J'ai ajouté des tests unitaires couvrant les nouveaux cas
- [ ] J'ai ajouté des tests d'intégration si nécessaire
- [ ] Tous les tests existants passent (`pnpm test`)
- [ ] La couverture de code est maintenue ou améliorée

### API & Documentation

- [ ] La documentation Swagger est mise à jour (`@ApiOperation`, `@ApiResponse`)
- [ ] Le fichier `docs/API.md` est mis à jour si de nouveaux endpoints sont ajoutés
- [ ] Les DTOs disposent de validateurs `class-validator` appropriés
- [ ] Les réponses d'erreur sont documentées

### Base de données

- [ ] Une migration Prisma a été créée si le schéma a changé (`pnpm db:migrate`)
- [ ] La migration est réversible ou un plan de rollback est documenté
- [ ] Les seeds sont mis à jour si de nouveaux champs obligatoires sont ajoutés
- [ ] Les indexes nécessaires ont été ajoutés pour les nouvelles requêtes

### Sécurité

- [ ] Aucun secret ou clé API n'est commité
- [ ] Les nouvelles routes sont protégées par les guards appropriés (`@Roles`, `@Tenant`)
- [ ] Les données entrantes sont validées et assainies
- [ ] Les logs ne contiennent pas d'informations sensibles (numéros de téléphone, montants en clair)

### Breaking changes

- [ ] Ce PR ne contient pas de breaking change
- [ ] OU : Les breaking changes sont documentés ci-dessous et l'équipe en est informée

### Multi-tenant

- [ ] Les nouvelles requêtes filtrent bien par `tenantId`
- [ ] Les nouvelles entités ont une relation `Tenant`

---

## Breaking changes (si applicable)

<!-- Décrivez les breaking changes et la procédure de migration -->

## Captures d'écran / Démo (si applicable)

<!-- Ajoutez des captures d'écran pour les changements visuels -->

## Notes pour les reviewers

<!-- Informations spécifiques pour guider la review -->
