import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Indispensable : l'authentification repose sur des cookies httpOnly
  // (`gestmoney_token` / `gestmoney_refresh`) posés par l'API.
  withCredentials: true,
});

// Aucun intercepteur de requête n'ajoute de `Authorization` : le token est
// dans un cookie httpOnly, illisible par le JavaScript. C'est le navigateur
// qui l'envoie automatiquement grâce à `withCredentials`.

// ─── Rafraîchissement de session ──────────────────────────────────────────────
// Le token d'accès est court (15 min). Sans ce mécanisme, toutes les requêtes
// tombaient en 401 passé ce délai et l'utilisateur restait bloqué sur des
// données vides, sans être ni reconnecté ni renvoyé vers /login.

/** Un seul rafraîchissement à la fois : quand 10 requêtes tombent en 401
 *  simultanément, elles attendent le même appel au lieu d'en lancer 10. */
let rafraichissementEnCours: Promise<void> | null = null;

function rafraichirSession(): Promise<void> {
  if (!rafraichissementEnCours) {
    rafraichissementEnCours = axios
      .post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
      .then(() => undefined)
      .finally(() => {
        rafraichissementEnCours = null;
      });
  }
  return rafraichissementEnCours;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requeteInitiale = error.config;
    const url: string = requeteInitiale?.url ?? "";

    // Ne pas boucler sur le rafraîchissement lui-même, ni sur la connexion.
    const estEndpointDeSession =
      url.includes("/auth/refresh") || url.includes("/auth/login");

    if (
      error.response?.status === 401 &&
      !estEndpointDeSession &&
      !requeteInitiale?._retry
    ) {
      requeteInitiale._retry = true;
      try {
        await rafraichirSession();
        // Le nouveau cookie est posé : on rejoue la requête telle quelle.
        return api(requeteInitiale);
      } catch {
        // Le refresh a échoué (session réellement expirée) → retour au login,
        // en gardant la page courante pour y revenir après reconnexion.
        if (typeof window !== "undefined") {
          const retour = encodeURIComponent(
            window.location.pathname + window.location.search,
          );
          window.location.href = `/login?redirect=${retour}`;
        }
      }
    }

    // ─── Licence inactive (402) ───────────────────────────────────────────────
    // L'API refuse désormais les requêtes des établissements dont l'abonnement
    // est expiré, suspendu, révoqué ou impayé (`LicenceGuard`, côté NestJS).
    //
    // Contrairement au 401, il n'y a RIEN à rejouer : aucune reprise
    // automatique ne débloquera la situation, seul un paiement le fera. On
    // envoie donc l'utilisateur vers l'écran de renouvellement.
    //
    // Le module paiements est exempté côté API (`@SansLicence()`) : la page
    // d'abonnement continue de fonctionner et l'utilisateur peut régulariser.
    // On ne redirige pas quand on y est déjà, sous peine de boucle de
    // rechargement.
    if (error.response?.status === 402) {
      const cible: string =
        error.response?.data?.renouvellementUrl ?? "/dashboard/abonnement";

      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith(cible)
      ) {
        window.location.href = cible;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
