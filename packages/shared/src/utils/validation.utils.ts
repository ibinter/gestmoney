// ==============================================================================
// Utilitaires de validation
// ==============================================================================

/**
 * Valide un numéro de téléphone africain
 */
export function isValidAfricanPhone(phone: string): boolean {
  // Format international ou local pour les pays d'Afrique de l'Ouest/Centrale
  const regex = /^(\+?225|\+?221|\+?223|\+?226|\+?227|\+?228|\+?229|\+?237|\+?254)?[0-9]{8,10}$/;
  return regex.test(phone.replace(/\s/g, ''));
}

/**
 * Valide une adresse email
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valide qu'un montant est positif et non nul
 */
export function isValidAmount(amount: number): boolean {
  return typeof amount === 'number' && amount > 0 && isFinite(amount);
}

/**
 * Valide une référence de transaction
 */
export function isValidTransactionRef(ref: string): boolean {
  return /^[A-Z0-9_-]{8,50}$/.test(ref);
}

/**
 * Nettoie et normalise un numéro de téléphone
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-().+]/g, '');
}

/**
 * Vérifie si une chaîne est un UUID valide
 */
export function isValidUUID(uuid: string): boolean {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}
