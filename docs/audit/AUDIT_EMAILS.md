# AUDIT EMAILS & NOTIFICATIONS — GESTMONEY

> Généré le 2026-07-26 | Source : apps/api/src/notifications/

## Architecture

- **NotificationsService** (`notifications.service.ts`) : envoi email (Nodemailer), SMS (Twilio stub), Push (FCM stub)
- **NotificationListener** (`listeners/notification.listener.ts`) : abonnement aux événements via EventEmitter2
- **PaymentNotificationsListener** (`payment-notifications.listener.ts`) : événements paiements
- **Templates** (`templates/payment-notification.templates.ts`) : templates HTML/text

---

## État des canaux

| Canal | Implémentation | État | Note |
|---|---|---|---|
| **Email (Nodemailer)** | Oui | ⚠️ Partiel | Nodemailer chargé dynamiquement — si absent, repli sur log sans erreur |
| **SMS (Twilio)** | Non | ❌ No-op | Code Twilio commenté — envois SMS sont des logs uniquement |
| **Push (FCM/Expo)** | Non | ❌ No-op | Push commenté — envois sont des logs uniquement |

---

## Triggers email / notification

| Déclencheur | Événement | Canal | Destinataire | État |
|---|---|---|---|---|
| Transaction créée | `TRANSACTION_EVENTS.CREATED` | SMS | `tx.clientPhone` | ❌ SMS no-op |
| Transaction complétée | `TRANSACTION_EVENTS.COMPLETED` | SMS | `tx.clientPhone` | ❌ SMS no-op |
| Transaction échouée | `TRANSACTION_EVENTS.FAILED` | SMS | `tx.clientPhone` | ❌ SMS no-op |
| Float bas | `FLOAT_EVENTS.LOW_BALANCE_ALERT` | Push | Agent | ❌ Push no-op |
| Rechargement approuvé | `FLOAT_EVENTS.REPLENISHMENT_APPROVED` | Push | Agent | ❌ Push no-op |
| Rechargement rejeté | `FLOAT_EVENTS.REPLENISHMENT_REJECTED` | Push | Agent | ❌ Push no-op |
| Inscription utilisateur | Auth service | Email | Nouvel utilisateur | ⚠️ Dépend de Nodemailer |
| Mot de passe oublié | Auth service | Email | Utilisateur | ⚠️ Dépend de Nodemailer |
| Rappel expiration licence J-30 | LicencesScheduler cron | Email | Admin tenant | ⚠️ Dépend de Nodemailer |
| Rappel expiration licence J-7 | LicencesScheduler cron | Email | Admin tenant | ⚠️ Dépend de Nodemailer |
| Rappel expiration licence J-1 | LicencesScheduler cron | Email | Admin tenant | ⚠️ Dépend de Nodemailer |
| Paiement reçu | PaymentNotificationsListener | Email | Admin tenant | ⚠️ Dépend de Nodemailer |
| Lead public soumis | PublicLeadsController | Email | Admin GESTMONEY | ⚠️ Dépend de Nodemailer |

---

## Configuration SMTP (variables .env)

| Variable | Rôle |
|---|---|
| `SMTP_HOST` | Serveur SMTP (ex: mail.ibigsoft.com) |
| `SMTP_PORT` | Port SMTP (587 recommandé) |
| `SMTP_SECURE` | true/false (TLS) |
| `SMTP_USER` | Compte SMTP (gestmoney@ibigsoft.com) |
| `SMTP_PASS` | Mot de passe SMTP (hors mémoire) |
| `SMTP_FROM` | Adresse expéditeur |

---

## Recommandations

1. **Installer Nodemailer** en dépendance fixe : `pnpm add nodemailer && pnpm add -D @types/nodemailer`
2. **Implémenter Twilio** ou Africa's Talking pour les SMS (essentiels pour les confirmations de transaction)
3. **Ajouter une queue** (BullMQ + Redis) pour les emails afin d'éviter les pertes en cas de redémarrage
4. **Tester le flux email** bout-en-bout en environnement de staging avec le compte SMTP LWS
