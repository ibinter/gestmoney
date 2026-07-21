import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const SARA_SYSTEM_PROMPT = `Tu es SARA (Smart Automated Response Assistant), l'assistante intelligente de GESTMONEY, la plateforme de gestion Mobile Money éditée par IBIG Soft (IBIG SARL – Intermark Business International Group). Slogan : "L'excellence est notre passion".

Tes missions :
- Présenter les fonctionnalités de GESTMONEY avec précision et enthousiasme
- Guider les prospects vers l'essai gratuit ou une démonstration personnalisée
- Répondre aux questions sur les tarifs, opérateurs supportés (Orange Money, MTN MoMo, Wave, Moov, Airtel), conformité OHADA
- Aider les utilisateurs sur les fonctionnalités du dashboard (transactions, float, agents, commissions, rapports)
- Proposer une démonstration ou un contact commercial si le prospect est qualifié

Règles absolues :
- Ne jamais communiquer de données personnelles entre clients
- Ne jamais t'engager contractuellement au nom d'IBIG Soft
- Rester professionnelle, concise et bienveillante
- En cas de question technique complexe, escalader vers support@ibigsoft.com
- Répondre en français par défaut, en anglais si l'utilisateur écrit en anglais`;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async chat(message: string, sessionId: string, userId?: string, contexte: string = 'INTERNE') {
    const provider = this.configService.get<string>('SARA_PROVIDER', 'groq');
    const model = this.configService.get<string>('SARA_MODEL', 'llama-3.3-70b-versatile');
    const temperature = parseFloat(this.configService.get<string>('SARA_TEMPERATURE', '0.7'));
    const maxTokens = parseInt(this.configService.get<string>('SARA_MAX_TOKENS', '2048'));

    const messages: ChatMessage[] = [
      { role: 'system', content: SARA_SYSTEM_PROMPT },
      { role: 'user', content: message },
    ];

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

    // Persister la conversation en base
    try {
      await this.prisma.$executeRaw`
        INSERT INTO "sara_conversations" ("id", "sessionId", "context", "messages", "totalTokens", "provider", "modele", "userId", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${sessionId}, ${contexte}, ${JSON.stringify([{ role: 'user', content: message }, { role: 'assistant', content: response }])}::jsonb, ${totalTokens}, ${provider}, ${model}, ${userId ?? null}, now(), now())
        ON CONFLICT DO NOTHING
      `;
    } catch {
      // Ne pas bloquer si la table n'existe pas encore
    }

    return { response, provider, model, tokens: totalTokens };
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
   * ou qu'il échoue. Ce sont des réponses fixes, mais elles doivent rester
   * EXACTES : un prospect qui lit un tarif ici le prend pour argent comptant.
   * Les 4 forfaits actuels sont Starter 9 900, Essentiel 19 900,
   * Professional 39 900 XOF/mois et Enterprise sur devis.
   */
  private fallbackResponse(message: string): string {
    const q = message.toLowerCase();
    if (q.includes('prix') || q.includes('tarif') || q.includes('abonnement')) {
      return 'GESTMONEY propose 4 formules : **Starter** (9 900 XOF/mois), **Essentiel** (19 900 XOF/mois), **Professional** (39 900 XOF/mois) et **Enterprise** (sur devis). Essai gratuit 14 jours sans carte bancaire, et 2 mois offerts sur l\'abonnement annuel. Souhaitez-vous une démonstration ?';
    }
    if (q.includes('opérateur') || q.includes('operateur') || q.includes('orange') || q.includes('mtn') || q.includes('wave') || q.includes('moov') || q.includes('airtel')) {
      return 'GESTMONEY prend en charge **Orange Money**, **MTN MoMo**, **Wave**, **Moov Money** et **Airtel Money**. La configuration se fait depuis l\'espace d\'administration.';
    }
    if (q.includes('paiement') || q.includes('payer') || q.includes('paye')) {
      return 'GESTMONEY accepte de nombreux moyens de paiement : Mobile Money, cartes et passerelles (CinetPay, Stripe, PayPal…), virements national et international, transfert d\'argent, espèces en agence, chèque, cryptomonnaie, code prépayé et paiement à la livraison. Chaque moyen s\'active selon votre pays.';
    }
    if (q.includes('demo') || q.includes('démo') || q.includes('essai')) {
      return 'Vous pouvez démarrer un **essai gratuit de 14 jours** sans carte bancaire. Notre équipe peut aussi organiser une démonstration — rendez-vous sur la section Contact.';
    }
    return 'Bonjour ! Je suis **SARA**, votre assistante GESTMONEY. Posez-moi vos questions sur la plateforme, les tarifs, les opérateurs ou les moyens de paiement. 💬';
  }
}
