/**
 * Normalise les paramètres de pagination.
 *
 * LE BUG QUE CECI CORRIGE — il est apparu trois fois (stock, audit, tenants) :
 * une valeur par défaut de paramètre (`page = 1`) ne s'applique qu'à
 * `undefined`. Or NestJS transmet `null` quand un query param est absent, et
 * `null` traverse la valeur par défaut. On obtient alors `take: null`, que
 * Prisma REJETTE à l'exécution (« + take: Int ») → 500. TypeScript ne peut pas
 * l'attraper : `take: number | undefined` est un type parfaitement valide,
 * c'est la valeur au runtime qui est fautive.
 *
 * Ce helper accepte donc null, undefined, les chaînes (les query params
 * arrivent en string) et les valeurs hors bornes, et renvoie toujours des
 * entiers exploitables plus le `skip` déjà calculé.
 */
export interface PaginationNormalisee {
  page: number;
  limit: number;
  skip: number;
}

export function normaliserPagination(
  page?: unknown,
  limit?: unknown,
  limitParDefaut = 20,
  limitMax = 500,
): PaginationNormalisee {
  const p = Math.trunc(Number(page));
  const l = Math.trunc(Number(limit));
  const pageOk = Number.isFinite(p) && p > 0 ? p : 1;
  const limitOk = Number.isFinite(l) && l > 0 ? Math.min(l, limitMax) : limitParDefaut;
  return { page: pageOk, limit: limitOk, skip: (pageOk - 1) * limitOk };
}
