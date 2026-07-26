# AUDIT SÉCURITÉ — GESTMONEY

> Généré le 2026-07-26

## Failles corrigées

| Faille | Gravité | État | Correction appliquée | Risque résiduel |
|---|---|---|---|---|
| **Fuite inter-tenant** | Critique | ✅ Corrigé | Filtre `tenantId` systématique dans tous les `findMany`/`findFirst` Prisma | Faible — à maintenir lors de nouveaux modules |
| **Tokens JWT sans expiration courte** | Haute | ✅ Corrigé | Access token court (15 min), refresh token long avec rotation | Faible |
| **Avatar en multipart bloqué par WAF** | Moyenne | ✅ Corrigé | Avatar encodé en base64 JSON (contournement Cloudflare) | Faible |
| **2FA non implémenté** | Haute | ✅ Corrigé | TOTP 2FA implémenté (enable/verify) | Moyen — optionnel, non forcé |
| **Mot de passe en clair** | Critique | ✅ Corrigé | `passwordHash` avec bcrypt | Faible |
| **Brute force login** | Haute | ✅ Partiel | `failedLoginAttempts` + `lockedUntil` en DB | Moyen — throttler non confirmé actif |

---

## Risques restants

| Faille | Gravité | État | Note |
|---|---|---|---|
| **SMS Twilio non implémenté** | Haute | ⚠️ Ouvert | Envois SMS sont des no-op (commenté) — OTP SMS inopérant |
| **2FA optionnel** | Moyenne | ⚠️ Ouvert | Le 2FA n'est pas forcé pour les rôles sensibles (SA, NA) |
| **Guards RH commentés** | Haute | ⚠️ Ouvert | Tout utilisateur authentifié peut accéder aux données RH du tenant |
| **AUDITOR sans @Roles** | Moyenne | ⚠️ Ouvert | Rôle défini mais jamais assigné dans les contrôleurs |
| **Rate limiting non confirmé** | Haute | ⚠️ Incertain | @nestjs/throttler importé mais activation en prod à vérifier |
| **Clés JWT en .env** | Moyenne | ⚠️ Structurel | JWT_SECRET doit être une clé forte et rotée régulièrement |
| **Pas de CSP headers** | Moyenne | ⚠️ Ouvert | Next.js n'a pas de headers Content-Security-Policy configurés |
| **Pièces jointes en base64 en DB** | Moyenne | ⚠️ Structurel | PJ support stockées en base64 en DB — gonflement + scan antivirus absent |
| **Audit logs accessible à tous les authentifiés** | Basse | ⚠️ Ouvert | audit.controller.ts utilise JwtAuthGuard sans RolesGuard |
| **Variables d'env en clair sur VPS** | Haute | ⚠️ Opérationnel | .env en /opt/gestmoney/ — accès SSH doit être restreint |
| **Backup absent** | Haute | ❌ Ouvert | Aucune sauvegarde automatique de la base PostgreSQL |

---

## Recommandations prioritaires

1. **P1 — Activer le rate limiting** : confirmer que `ThrottlerModule` est configuré avec des limites raisonnables (ex : 5 tentatives/minute sur `/auth/login`).
2. **P1 — Forcer le 2FA** pour SUPER_ADMIN et NETWORK_ADMIN.
3. **P1 — Restaurer les guards RH** : décommenter `@Roles` dans `hr.controller.ts`.
4. **P1 — Implémenter le backup PostgreSQL** : dump quotidien avec rétention 30 jours.
5. **P2 — Ajouter CSP headers** dans `next.config.js`.
6. **P2 — Migrer les pièces jointes** vers un stockage objet (S3/MinIO).
7. **P2 — Implémenter SMS Twilio** ou un provider alternatif (Africa's Talking).
