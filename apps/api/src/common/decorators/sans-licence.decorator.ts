import { SetMetadata } from '@nestjs/common';

export const SANS_LICENCE_KEY = 'sansLicence';

/**
 * Exempte un contrôleur (ou une route) du contrôle de licence effectué par
 * `LicenceGuard`.
 *
 * ── Pourquoi une métadonnée et non une liste de chemins ─────────────────────
 * Une liste de préfixes d'URL codée en dur dans la garde se désynchronise au
 * premier renommage de route : la route change, la liste ne suit pas, et
 * l'exemption saute SILENCIEUSEMENT. Le décorateur, lui, voyage avec le code
 * qu'il protège.
 *
 * ── Ce que l'exemption doit couvrir ─────────────────────────────────────────
 * Tout ce dont un client à la licence EXPIRÉE a besoin pour REDEVENIR client :
 * s'authentifier, consulter l'état de sa licence, et surtout PAYER. Bloquer le
 * module paiements enfermerait dehors l'utilisateur qui veut régulariser : il
 * ne pourrait plus jamais payer, ce qui transforme une fuite de revenus en
 * perte définitive de revenus.
 *
 * `@SansLicence()` ne retire QUE le contrôle de licence : l'authentification
 * (`JwtAuthGuard`) et les rôles (`RolesGuard`) restent en vigueur.
 */
export const SansLicence = () => SetMetadata(SANS_LICENCE_KEY, true);
