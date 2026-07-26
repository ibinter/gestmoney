# CHANGELOG — GESTMONEY

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)  
Versionning : [Semantic Versioning](https://semver.org/)

---

## [Unreleased]

### En cours
- Tests unitaires étendus
- SMS Twilio
- Backup automatique

---

## [1.6.0] — 2026-07-26

### Added
- Configuration SMTP clarifiée dans `.env.example`

---

## [1.5.0] — 2026-07 (semaine)

### Fixed
- **Landing** : footer sur 2 colonnes en mobile (était 1 441 px de hauteur sur une seule colonne)
- **Landing** : footer plus compact — contacts en bande, colonnes explicites

### Changed
- Footer unique GESTMONEY — footer universel IBIG SOFT désactivé
- Retrait du lien mort `/forgot-password` du footer (modale dans `/login`)

---

## [1.4.0] — 2026-07

### Added
- Bandeau footer GESTMONEY au-dessus du footer universel
- Script universel IBIG SOFT (solutions + footer) intégré
- Assets statiques de `public/` servis sans redirection

### Fixed
- 3 points d'incohérence restants (reversal, rapports, tenant)
- Cohérence inter-modules (audit) + frontend KYC client

---

## [1.3.0] — 2026-07

### Added
- **KYC** : flux de vérification KYC client complet (backend)
- **Web** : sélecteur d'agent (transactions), ouverture/clôture caisse, KPI reporting réels
- **Caisse** : session ouverture/clôture fonctionnelle depuis le frontend
- **Web** : footer interne du tableau de bord

### Fixed
- Campagne de tests 4 agents — corrections systémiques des écritures comptables

---

## [1.2.0] — 2026-06

### Added
- **Guide** : guide riche intégré au dashboard (avec sidebar)
- **Guide** : entrée dans le menu latéral
- **Guide** : vrai PDF (pdfmake) + guide enrichi A-Z + lexique
- **Web** : export PDF fiable via iframe caché (guide + tous les exports)

### Fixed
- Export PDF — fix après blocage Cloudflare WAF sur requêtes blob directes

### Removed
- Bloc "Espace démo" retiré de la page de connexion

---

## [1.1.0] — 2026-06

### Added
- **Networks** : gestion des opérateurs CRUD (ajouter/modifier/supprimer)
- **Support** : pièces jointes persistées en base64
- **Support** : module complet (tickets backend + frontend)
- **Auth** : upload photo de profil (base64 JSON — fix Cloudflare multipart)
- **SuperAdmin** : actions CRM réelles (prospects, démos, offres)

### Fixed
- Tous les boutons morts de l'app (dashboard + SuperAdmin) branchés sur les vraies APIs
- Bouton "Voir" agent inopérant → modale de détail

---

## [1.0.0] — 2026-06

### Added
- **Exports** : menu d'export unifié CSV/Excel/PDF sur toutes les pages à données

### Fixed
- **API** : 0 erreur TypeScript sur toute l'API (42 erreurs → 0)

---

*Ce changelog couvre les 30 derniers commits. Voir `git log` pour l'historique complet.*
