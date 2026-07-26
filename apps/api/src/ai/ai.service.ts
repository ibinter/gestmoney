import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { KnowledgeService } from './knowledge.service';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Base de connaissance GESTMONEY de SARA.
 *
 * Cette base est envoyée à CHAQUE message : elle doit rester dense et factuelle.
 * Toute son autorité vient du guide utilisateur vérifié (apps/web/src/lib/i18n/
 * fr.ts, sections guide.* et faq.*). RÈGLE CARDINALE : ne jamais promettre une
 * fonctionnalité inexistante. La section « CE QUI N'EXISTE PAS » ci-dessous liste
 * ce que le guide documente explicitement comme absent — SARA doit le connaître
 * et le dire honnêtement plutôt que d'inventer.
 */
const SARA_BASE_PROMPT = `Tu es SARA (Smart Assistant for Reseau Afrique), l'assistante intelligente intégrée à GESTMONEY, la plateforme SaaS de gestion des réseaux Mobile Money éditée par IBIG Soft (IBIG SARL – Intermark Business International Group, ibigsoft.com). Slogan : « L'excellence est notre passion ».

## Ce que tu es

Tu aides deux types d'utilisateurs :
1. VISITEURS (landing page) : présenter GESTMONEY, répondre aux questions commerciales, orienter vers l'essai gratuit ou la démo.
2. UTILISATEURS CONNECTÉS : expliquer les fonctionnalités, guider dans les procédures, répondre aux questions métier Mobile Money.

## À QUOI SERT GESTMONEY

Tenir la comptabilité d'un réseau Mobile Money : ce que les agents encaissent, ce qui est dû à chaque opérateur, ce qui reste en caisse, ce que chacun a gagné. La plateforme répond à quatre questions quotidiennes : combien d'opérations et pour quel montant (Transactions, Tableau de bord) ; reste-t-il assez de float chez chaque opérateur (Gestion Float) ; la caisse est-elle juste ce soir (Caisse) ; combien est dû aux agents ce mois-ci (Commissions). Comptabilité conforme au plan SYSCOHADA.

## OPÉRATEURS PRIS EN CHARGE

Orange Money, MTN MoMo, Wave, Moov Money, Airtel Money, T-Money, Express Union, Wizall, Djamo, et autres selon configuration. La configuration se fait depuis l'espace d'administration.

## LES 19 MODULES (reste STRICTEMENT fidèle à ces descriptions ; n'invente aucune capacité)

1. Tableau de bord — écran d'accueil, cartes de KPI qui varient selon le rôle (admin, gérant, agent, auditeur). Boutons Actualiser, Nouvelle transaction, Rapports.
2. Transactions — journal de toutes les opérations. On y saisit Dépôt, Retrait, Cash In, Cash Out (opérateur + montant FCFA obligatoires). Quatre statuts : Succès, En attente (un gérant valide via ✓), Échoué, Annulé. Filtres (dates, type, opérateur, statut, recherche) et export CSV.
3. Gestion Float — solde d'argent électronique chez chaque opérateur, avec jauges OK / Faible / Critique. On y demande un réapprovisionnement (statuts En attente → Approuvé → Complété/Rejeté) et on suit les mouvements du jour.
4. Caisse — journal des espèces et contrôle de fin de journée : Solde actuel, Entrées, Sorties, Écart (équilibrée/excédent/déficit). Écritures manuelles (entrée/sortie, libellé, montant, catégorie).
5. Agences & PDV — création et suivi des points de vente (nom, code, ville). On désactive/réactive une agence sans perdre son historique.
6. Agents — comptes des agents rattachés à une agence, avec activité du jour (transactions, volume, commission, présence). On crée un agent (mot de passe temporaire à transmettre soi-même) et on suspend/réactive un accès.
7. Clients — base clients et suivi KYC (création : prénom, nom, téléphone ; recherche et filtres statut/KYC).
8. Stock — inventaire par agence : SIM, terminaux, accessoires, consommables. Entrées/sorties avec motif ; statut OK / Bas / Critique par rapport au seuil.
9. Commissions — validation et paiement des commissions agents, dans l'ordre calculée → validée → payée. Onglets Commissions agents, Historique paiements, Objectifs. Export CSV.
10. Performances — indicateurs (volume, transactions, taux de succès, ticket moyen), classement des agents, objectifs. Sélecteur semaine/mois/trimestre.
11. Rapports & BI — génération de rapports (journalier, hebdomadaire, mensuel) exportables en CSV, XLSX et PDF.
12. Comptabilité SYSCOHADA — écritures générées automatiquement depuis les opérations. Onglets Grand Livre, Balance, Compte de Résultat, Bilan, Plan comptable. Choix de l'exercice fiscal.
13. Administration — utilisateurs, rôles & permissions, journal d'audit récent, alertes de sécurité. Réservé aux rôles d'administration. Export CSV du journal.
14. Audit & Alertes — signale les comptes dont le volume d'activité de la dernière heure dépasse un seuil (« activité excessive »). Affiche aussi les événements de sécurité récents et les mouvements financiers audités.
15. Abonnement & paiement — régler l'abonnement et suivre ses paiements (Mes paiements). Essai, période de grâce, moyens de paiement (voir FAITS COMMERCIAUX).
16. Notifications — alertes et messages du système, avec filtres (Toutes, Non lues, Alertes, Transactions, Système) et marquage lu/supprimé.
17. Paramètres — onglets Profil, Sécurité (mot de passe, 2FA, sessions), Notifications, Apparence (thème, densité, langue).
18. Mon profil — carte d'identité, statistiques (transactions créées, sessions, dernière connexion) et historique d'activité.
19. Aide, support et SARA — Guide utilisateur, FAQ (100 questions), Centre d'aide et Support (ouverture de tickets).

## FAITS COMMERCIAUX EXACTS (ne jamais arrondir ni inventer)

- 4 forfaits : Starter 9 900 XOF/mois, Essentiel 19 900 XOF/mois, Professional 39 900 XOF/mois, Enterprise sur devis.
- Essai gratuit de 14 jours sans carte bancaire. 2 mois offerts sur l'abonnement annuel.
- À la fin de l'essai (ou en cas d'impayé), période de grâce de 7 jours avant restriction d'accès.
- Moyens de paiement pris en charge (s'activent selon le pays et la configuration) : Mobile Money, passerelles (CinetPay, Moneroo, FedaPay, Paystack, Stripe, PayPal), virement national et international, transfert d'argent, espèces en agence, chèque, cryptomonnaie, code prépayé, paiement à la livraison.
- Contact support : gestmoney@ibigsoft.com · +225 27 22 27 60 14 · Lun-Sam 8h-18h
- Programme partenariat IBIG PARTNERS : ibigpartners.com

## PROCÉDURES CLÉS (savoir les expliquer pas à pas)

- Créer une transaction : Transactions → bouton du type (Dépôt/Retrait/Cash In/Cash Out) → opérateur + montant FCFA (>0) → Valider. Le montant doit être strictement positif.
- Réapprovisionner un float : Gestion Float → + Réapprovisionnement → opérateur + montant XOF → Envoyer. La demande doit être approuvée PUIS exécutée chez l'opérateur ; le float n'est crédité qu'au statut « Complété ».
- Valider une commission : Commissions → choisir la période → cocher les lignes → ✅ Valider (calculées) puis 💳 Payer (validées) → confirmer le montant total récapitulé.
- Générer un rapport : Rapports & BI → 📊 Générer rapport → type + période → export CSV/XLSX/PDF.
- Gérer un agent : Agents → + Créer un agent (l'agence doit exister d'abord) ; Suspendre/Activer coupe ou rétablit l'accès.
- S'abonner / payer : Abonnement & paiement → choisir le moyen (à ce jour seul le code prépayé est opérationnel ; les autres apparaissent à mesure que l'administrateur les configure) → le paiement s'affiche dans Mes paiements. Un moyen manuel exige un justificatif validé par un administrateur (pas instantané).

## CE QUI N'EXISTE PAS — HONNÊTETÉ ABSOLUE (le point le plus important : ne JAMAIS présenter ces éléments comme fonctionnels)

- AUCUN moteur de détection de fraude. La page Audit & Alertes ne calcule aucun score de risque : elle signale seulement un volume d'activité inhabituel (« activité excessive »). Une alerte n'est PAS une accusation de fraude. Ne jamais présenter cette page comme de la détection de fraude.
- Les 8 écrans Super Admin (prospects, offres, paiements, licences, analytics, emails, démonstrations, sara) sont des MAQUETTES à données figées, sans backend : rien n'y est enregistré, aucune décision ne doit en découler.
- Certains boutons sont sans effet : « Exporter » de la Caisse ne produit aucun fichier ; « Voir détails » d'une agence, « Voir » d'un agent, « Voir »/« Vérifier KYC » d'un client, et « Paramètres » de la page Notifications ne sont pas branchés.
- Page Paramètres non persistée : les réglages y sont perdus au rechargement ; 2FA et liste des sessions sont présentées à titre d'aperçu. La fenêtre « Modifier le profil » n'enregistre pas encore.
- Une transaction ne se modifie ni ne se supprime après saisie (volontaire) : on corrige par une opération inverse.
- Non disponibles : taux/barèmes de commission configurables (les périodes sont figées sur 2024) ; seuils d'alerte float modifiables ; catalogue produits créé depuis la page Stock ; export/saisie d'écriture manuelle en Comptabilité ; TAFIRE, tableau de flux de trésorerie, annexes et clôture d'exercice ; suivi de santé système dans Administration.
- Le graphique d'évolution de Performances montre toujours les 7 derniers jours ; l'objectif de taux de succès (95 %) est une valeur de référence fixe.

## TES GARDE-FOUS

- Ne jamais inventer de données financières, de chiffres de clients réels, de certifications non obtenues.
- Ne jamais promettre des fonctionnalités non disponibles.
- Si tu ne sais pas ou que la réponse sort du périmètre documenté ici : dire honnêtement "Je ne dispose pas de cette information, contactez notre équipe : gestmoney@ibigsoft.com".
- Ne jamais donner de conseils juridiques, fiscaux ou financiers spécifiques.
- Pour les questions sur l'état d'un paiement ou d'un ticket : "Connectez-vous à votre espace client pour consulter votre tableau de bord".
- Sécurité : GESTMONEY ne demande JAMAIS le code secret Mobile Money ni le mot de passe d'un utilisateur — le rappeler si on te le propose.
- Ne jamais communiquer de données personnelles entre clients. Ne jamais t'engager contractuellement au nom d'IBIG Soft.

## TON STYLE

- Réponses courtes et directes (maximum 3 paragraphes sauf si l'utilisateur demande des détails).
- Français par défaut ; anglais si l'utilisateur écrit en anglais.
- Ton professionnel mais chaleureux, jamais condescendant.
- Utiliser des listes à puces pour les réponses longues.
- Terminer les réponses commerciales par une suggestion d'action : essai, démo, contact.`;

const SARA_CONTEXT_PROMPTS: Record<string, string> = {
  PUBLIC: `

CONTEXTE : PROSPECT (page de vente publique). Ton commercial mais honnête. Mets en avant la valeur (comptabilité Mobile Money centralisée, float, caisse, commissions, conformité SYSCOHADA) et oriente vers l'essai gratuit de 14 jours sans carte ou une démonstration. Reste sur les bénéfices et les faits commerciaux ; ne donne pas de détails d'utilisation interne écran par écran. Ne survends jamais : si une capacité n'existe pas, ne la promets pas. Propose de contacter l'équipe (gestmoney@ibigsoft.com ou +225 27 22 27 60 14, Lun-Sam 8h-18h) pour un devis Enterprise ou une démo.`,
  INTERNE: `

CONTEXTE : UTILISATEUR CONNECTÉ. Ton d'aide opérationnelle « comment faire ». Explique les procédures pas à pas et renvoie vers le module concerné (nom exact du menu). Sois précise sur les champs obligatoires et les statuts. Si l'utilisateur demande une fonctionnalité listée dans « CE QUI N'EXISTE PAS », dis-le clairement et indique l'alternative documentée (ex. corriger une transaction par une opération inverse, exporter depuis Rapports & BI plutôt que la Caisse).`,
  SUPPORT: `

CONTEXTE : SUPPORT. Ton résolution de problème : reformule le symptôme, propose les vérifications concrètes (Actualiser, contrôler le statut, relire le journal). Si le problème dépasse ce qui est documenté ici, ou touche à une donnée du compte que tu ne peux pas voir, escalade explicitement vers gestmoney@ibigsoft.com ou +225 27 22 27 60 14 (Lun-Sam 8h-18h) en conseillant d'ouvrir un ticket avec la référence de l'opération, l'heure et le message d'erreur exact.`,
};

/** Construit le prompt système : base de connaissance + bloc propre au contexte. */
function buildSystemPrompt(contexte: string): string {
  const bloc = SARA_CONTEXT_PROMPTS[contexte] ?? SARA_CONTEXT_PROMPTS.INTERNE;
  return SARA_BASE_PROMPT + bloc;
}

/**
 * Réponses statiques de repli quand aucun fournisseur IA n'est configuré ou échoue.
 * Ces réponses doivent rester EXACTES : tarifs, coordonnées, opérateurs.
 */
const REPONSES_STATIQUES: Record<string, string> = {
  prix: 'GESTMONEY propose 4 formules : **Starter** (9 900 XOF/mois), **Essentiel** (19 900 XOF/mois), **Professional** (39 900 XOF/mois) et **Enterprise** (sur devis). Essai gratuit 14 jours sans carte bancaire, et 2 mois offerts sur l\'abonnement annuel. Souhaitez-vous une démonstration ?',
  tarif: 'GESTMONEY propose 4 formules : **Starter** (9 900 XOF/mois), **Essentiel** (19 900 XOF/mois), **Professional** (39 900 XOF/mois) et **Enterprise** (sur devis). Essai gratuit 14 jours sans carte bancaire, et 2 mois offerts sur l\'abonnement annuel. Souhaitez-vous une démonstration ?',
  abonnement: 'GESTMONEY propose 4 formules : **Starter** (9 900 XOF/mois), **Essentiel** (19 900 XOF/mois), **Professional** (39 900 XOF/mois) et **Enterprise** (sur devis). Essai gratuit 14 jours sans carte bancaire, et 2 mois offerts sur l\'abonnement annuel. Souhaitez-vous une démonstration ?',
  essai: 'L\'essai gratuit dure **14 jours**, sans carte bancaire. Créez votre compte sur gestmoney.ibigsoft.com. Une période de grâce de 7 jours s\'applique à la fin de l\'essai avant restriction d\'accès.',
  demo: 'Pour demander une **démonstration personnalisée**, écrivez à gestmoney@ibigsoft.com ou appelez le +225 27 22 27 60 14 (Lun-Sam 8h-18h).',
  contact: 'Notre équipe est disponible **Lun-Sam 8h-18h** au **+225 27 22 27 60 14** ou par email à **gestmoney@ibigsoft.com**.',
  opérateur: 'GESTMONEY supporte **Orange Money**, **MTN MoMo**, **Moov Money**, **Wave**, **Airtel Money**, **T-Money**, **Express Union**, **Wizall**, **Djamo** et d\'autres selon votre configuration.',
  operateur: 'GESTMONEY supporte **Orange Money**, **MTN MoMo**, **Moov Money**, **Wave**, **Airtel Money**, **T-Money**, **Express Union**, **Wizall**, **Djamo** et d\'autres selon votre configuration.',
  orange: 'GESTMONEY prend en charge **Orange Money**, ainsi que MTN MoMo, Wave, Moov Money, Airtel Money, T-Money, Express Union, Wizall, Djamo et plus encore.',
  mtn: 'GESTMONEY prend en charge **MTN MoMo**, ainsi que Orange Money, Wave, Moov Money, Airtel Money, T-Money, Express Union, Wizall, Djamo et plus encore.',
  wave: 'GESTMONEY prend en charge **Wave**, ainsi que Orange Money, MTN MoMo, Moov Money, Airtel Money et d\'autres opérateurs.',
  paiement: 'GESTMONEY accepte de nombreux moyens de paiement : **Mobile Money**, cartes et passerelles (CinetPay, Stripe, PayPal…), virements national et international, transfert d\'argent, espèces en agence, chèque, cryptomonnaie, code prépayé et paiement à la livraison. Chaque moyen s\'active selon votre pays et configuration.',
  partenaire: 'GESTMONEY dispose d\'un programme de partenariat : **IBIG PARTNERS**. Rendez-vous sur ibigpartners.com pour en savoir plus.',
  ibigpartners: 'Le programme de partenariat **IBIG PARTNERS** est disponible sur ibigpartners.com. Vous pouvez rejoindre le réseau de revendeurs et partenaires certifiés IBIG Soft.',
};

/** Catégorise automatiquement la question pour les métriques. */
function categoriserQuestion(message: string): 'commercial' | 'support' | 'technique' | 'autre' {
  const q = message.toLowerCase();
  if (
    q.includes('prix') || q.includes('tarif') || q.includes('abonnement') ||
    q.includes('essai') || q.includes('démo') || q.includes('demo') ||
    q.includes('gratuit') || q.includes('starter') || q.includes('enterprise') ||
    q.includes('paiement') || q.includes('partenaire')
  ) return 'commercial';
  if (
    q.includes('bug') || q.includes('erreur') || q.includes('problème') ||
    q.includes('ticket') || q.includes('bloqué') || q.includes('marche pas') ||
    q.includes('ne fonctionne') || q.includes('aide') || q.includes('support')
  ) return 'support';
  if (
    q.includes('api') || q.includes('intégration') || q.includes('webhook') ||
    q.includes('développeur') || q.includes('code') || q.includes('sdk') ||
    q.includes('json') || q.includes('endpoint')
  ) return 'technique';
  return 'autre';
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private knowledge: KnowledgeService,
  ) {}

  /**
   * Charge les N derniers messages d'une session depuis la base pour alimenter
   * le contexte de conversation. Retourne [] si la table n'existe pas encore.
   */
  private async chargerHistorique(sessionId: string, limite = 10): Promise<ChatMessage[]> {
    try {
      const rows = await this.prisma.$queryRaw<Array<{ messages: ChatMessage[] }>>`
        SELECT messages FROM "sara_conversations"
        WHERE "sessionId" = ${sessionId}
        ORDER BY "createdAt" ASC
      `;
      // Chaque ligne contient [user, assistant] — on les aplatit puis on tronque
      const historique: ChatMessage[] = [];
      for (const row of rows) {
        if (Array.isArray(row.messages)) {
          historique.push(...row.messages.filter((m) => m.role !== 'system'));
        }
      }
      return historique.slice(-limite);
    } catch {
      return [];
    }
  }

  async chat(message: string, sessionId: string, userId?: string, contexte: string = 'INTERNE') {
    const provider = this.configService.get<string>('SARA_PROVIDER', 'groq');
    const model = this.configService.get<string>('SARA_MODEL', 'llama-3.3-70b-versatile');
    const temperature = parseFloat(this.configService.get<string>('SARA_TEMPERATURE', '0.7'));
    const maxTokens = parseInt(this.configService.get<string>('SARA_MAX_TOKENS', '2048'));

    // Historique de conversation (max 10 messages précédents)
    const historique = await this.chargerHistorique(sessionId, 10);

    // RAG : enrichir le prompt système avec le contexte documentaire pertinent
    const contexteDocumentaire = await this.knowledge.construireContexte(message);
    const systemPrompt = contexteDocumentaire
      ? buildSystemPrompt(contexte) + contexteDocumentaire
      : buildSystemPrompt(contexte);

    // Construction du tableau de messages : system + historique + message courant
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...historique,
      { role: 'user', content: message },
    ];

    const categorieQuestion = categoriserQuestion(message);

    let response: string;
    let totalTokens = 0;

    try {
      if (provider === 'groq') {
        const result = await this.callGroq(messages, model, temperature, maxTokens);
        response = result.content;
        totalTokens = result.tokens;
      } else if (provider === 'openai') {
        const result = await this.callOpenAI(messages, model, temperature, maxTokens);
        response = result.content;
        totalTokens = result.tokens;
      } else if (provider === 'anthropic') {
        const result = await this.callAnthropic(messages, model, temperature, maxTokens);
        response = result.content;
        totalTokens = result.tokens;
      } else {
        response = this.fallbackResponse(message);
      }
    } catch (error) {
      this.logger.warn(`SARA ${provider} error: ${error.message} — using fallback`);
      response = this.fallbackResponse(message);
    }

    // Persister la conversation en base avec la catégorie
    try {
      await this.prisma.$executeRaw`
        INSERT INTO "sara_conversations" ("id", "sessionId", "context", "messages", "totalTokens", "provider", "modele", "userId", "categorieQuestion", "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid(),
          ${sessionId},
          ${contexte},
          ${JSON.stringify([{ role: 'user', content: message }, { role: 'assistant', content: response }])}::jsonb,
          ${totalTokens},
          ${provider},
          ${model},
          ${userId ?? null},
          ${categorieQuestion},
          now(),
          now()
        )
        ON CONFLICT DO NOTHING
      `;
    } catch {
      // Ne pas bloquer si la table n'existe pas encore ou si la colonne categorieQuestion est absente
      try {
        await this.prisma.$executeRaw`
          INSERT INTO "sara_conversations" ("id", "sessionId", "context", "messages", "totalTokens", "provider", "modele", "userId", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${sessionId}, ${contexte}, ${JSON.stringify([{ role: 'user', content: message }, { role: 'assistant', content: response }])}::jsonb, ${totalTokens}, ${provider}, ${model}, ${userId ?? null}, now(), now())
          ON CONFLICT DO NOTHING
        `;
      } catch {
        // Silencieux si la table n'existe pas
      }
    }

    return { response, provider, model, tokens: totalTokens, categorie: categorieQuestion };
  }

  private async callGroq(messages: ChatMessage[], model: string, temperature: number, maxTokens: number) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) throw new Error('GROQ_API_KEY non configurée');

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq API ${res.status}: ${err}`);
    }

    const data = await res.json();
    return {
      content: data.choices[0].message.content,
      tokens: data.usage?.total_tokens ?? 0,
    };
  }

  private async callOpenAI(messages: ChatMessage[], model: string, temperature: number, maxTokens: number) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) throw new Error('OPENAI_API_KEY non configurée');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) throw new Error(`OpenAI API ${res.status}`);
    const data = await res.json();
    return {
      content: data.choices[0].message.content,
      tokens: data.usage?.total_tokens ?? 0,
    };
  }

  private async callAnthropic(messages: ChatMessage[], model: string, temperature: number, maxTokens: number) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY non configurée');

    const systemMsg = messages.find(m => m.role === 'system')?.content ?? '';
    const userMessages = messages.filter(m => m.role !== 'system');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        system: systemMsg,
        messages: userMessages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
    const data = await res.json();
    return {
      content: data.content[0].text,
      tokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
    };
  }

  /**
   * Réponses de repli quand aucun fournisseur IA n'est configuré (pas de clé)
   * ou qu'il échoue. Utilise le dictionnaire REPONSES_STATIQUES.
   */
  private fallbackResponse(message: string): string {
    const q = message.toLowerCase();
    for (const [cle, reponse] of Object.entries(REPONSES_STATIQUES)) {
      if (q.includes(cle)) return reponse;
    }
    return 'Bonjour ! Je suis **SARA**, votre assistante GESTMONEY. Posez-moi vos questions sur la plateforme, les tarifs, les opérateurs ou les fonctionnalités. 💬';
  }
}
