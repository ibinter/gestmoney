// ==============================================================================
// Constantes Statuts communs
// ==============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const DATE_FORMATS = {
  DATE: 'dd/MM/yyyy',
  DATE_TIME: 'dd/MM/yyyy HH:mm',
  DATE_TIME_SECONDS: 'dd/MM/yyyy HH:mm:ss',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  TIME: 'HH:mm',
} as const;
