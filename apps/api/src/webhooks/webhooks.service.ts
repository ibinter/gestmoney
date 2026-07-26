import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';

export const WEBHOOK_EVENTS = [
  'transaction.created',
  'transaction.completed',
  'transaction.cancelled',
  'float.updated',
  'float.low',
  'agent.created',
  'licence.expiring',
  'licence.expired',
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Signature ───────────────────────────────────────────────────────────────

  private signerPayload(secret: string, payload: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  async creer(tenantId: string, dto: CreateWebhookDto) {
    const secret = crypto.randomBytes(32).toString('hex');
    const endpoint = await this.prisma.webhookEndpoint.create({
      data: {
        tenantId,
        url: dto.url,
        secret,
        evenements: dto.evenements,
        description: dto.description,
        actif: dto.actif ?? true,
      },
    });
    // On retourne le secret une seule fois ici
    return { ...endpoint, secretPlaintext: secret };
  }

  async lister(tenantId: string) {
    return this.prisma.webhookEndpoint.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        url: true,
        actif: true,
        evenements: true,
        description: true,
        createdAt: true,
        // secret NON exposé dans la liste
      },
    });
  }

  async supprimer(id: string, tenantId: string): Promise<void> {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({ where: { id, tenantId } });
    if (!endpoint) throw new NotFoundException(`Webhook ${id} introuvable`);
    await this.prisma.webhookEndpoint.delete({ where: { id } });
  }

  async tester(id: string, tenantId: string) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({ where: { id, tenantId } });
    if (!endpoint) throw new NotFoundException(`Webhook ${id} introuvable`);

    const payload = JSON.stringify({ event: 'ping', timestamp: new Date().toISOString(), tenantId });
    const signature = this.signerPayload(endpoint.secret, payload);

    const livraison = await this.prisma.webhookLivraison.create({
      data: {
        webhookId: id,
        evenement: 'ping',
        payload: { event: 'ping', timestamp: new Date().toISOString() },
        tentatives: 1,
      },
    });

    try {
      const res = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gestmoney-Signature': `sha256=${signature}`,
          'X-Gestmoney-Event': 'ping',
        },
        body: payload,
        signal: AbortSignal.timeout(10_000),
      });
      const body = await res.text().catch(() => '');
      await this.prisma.webhookLivraison.update({
        where: { id: livraison.id },
        data: { reponseCode: res.status, reponseBody: body.slice(0, 2000), reussi: res.ok },
      });
      return { reussi: res.ok, reponseCode: res.status, reponseBody: body.slice(0, 500) };
    } catch (err: any) {
      await this.prisma.webhookLivraison.update({
        where: { id: livraison.id },
        data: { reussi: false, reponseBody: err?.message ?? 'Erreur réseau' },
      });
      return { reussi: false, reponseCode: null, reponseBody: err?.message ?? 'Erreur réseau' };
    }
  }

  async getLivraisons(webhookId: string, tenantId: string) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({ where: { id: webhookId, tenantId } });
    if (!endpoint) throw new NotFoundException(`Webhook ${webhookId} introuvable`);
    return this.prisma.webhookLivraison.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async retenter(livraisonId: string, tenantId: string) {
    const livraison = await this.prisma.webhookLivraison.findFirst({
      where: { id: livraisonId },
      include: { webhook: true },
    });
    if (!livraison) throw new NotFoundException(`Livraison ${livraisonId} introuvable`);
    if (livraison.webhook.tenantId !== tenantId) throw new ForbiddenException();

    const payload = JSON.stringify(livraison.payload);
    const signature = this.signerPayload(livraison.webhook.secret, payload);

    try {
      const res = await fetch(livraison.webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gestmoney-Signature': `sha256=${signature}`,
          'X-Gestmoney-Event': livraison.evenement,
        },
        body: payload,
        signal: AbortSignal.timeout(10_000),
      });
      const body = await res.text().catch(() => '');
      return this.prisma.webhookLivraison.update({
        where: { id: livraisonId },
        data: {
          reponseCode: res.status,
          reponseBody: body.slice(0, 2000),
          reussi: res.ok,
          tentatives: { increment: 1 },
          nextRetryAt: null,
        },
      });
    } catch (err: any) {
      return this.prisma.webhookLivraison.update({
        where: { id: livraisonId },
        data: {
          reussi: false,
          reponseBody: err?.message ?? 'Erreur réseau',
          tentatives: { increment: 1 },
        },
      });
    }
  }

  // ─── Emission (fire-and-forget avec retry exponentiel) ───────────────────────

  async emettre(tenantId: string, evenement: string, data: any): Promise<void> {
    let endpoints: { id: string; url: string; secret: string }[] = [];
    try {
      endpoints = await this.prisma.webhookEndpoint.findMany({
        where: { tenantId, actif: true, evenements: { has: evenement } },
        select: { id: true, url: true, secret: true },
      });
    } catch (err) {
      this.logger.warn(`Impossible de récupérer les webhooks pour ${tenantId}: ${err}`);
      return;
    }

    for (const endpoint of endpoints) {
      // fire-and-forget
      void this.envoyerAvecRetry(endpoint, evenement, data);
    }
  }

  private async envoyerAvecRetry(
    endpoint: { id: string; url: string; secret: string },
    evenement: string,
    data: any,
    maxTentatives = 3,
  ): Promise<void> {
    const payloadObj = {
      event: evenement,
      timestamp: new Date().toISOString(),
      data,
    };
    const payloadStr = JSON.stringify(payloadObj);
    const signature = this.signerPayload(endpoint.secret, payloadStr);

    let livraison = await this.prisma.webhookLivraison.create({
      data: {
        webhookId: endpoint.id,
        evenement,
        payload: payloadObj,
        tentatives: 0,
      },
    });

    for (let tentative = 1; tentative <= maxTentatives; tentative++) {
      if (tentative > 1) {
        // Délai exponentiel : 5s, 25s, 125s
        const delai = Math.pow(5, tentative) * 1000;
        await new Promise((r) => setTimeout(r, delai));
      }

      try {
        const res = await fetch(endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Gestmoney-Signature': `sha256=${signature}`,
            'X-Gestmoney-Event': evenement,
          },
          body: payloadStr,
          signal: AbortSignal.timeout(10_000),
        });
        const body = await res.text().catch(() => '');

        livraison = await this.prisma.webhookLivraison.update({
          where: { id: livraison.id },
          data: {
            reponseCode: res.status,
            reponseBody: body.slice(0, 2000),
            reussi: res.ok,
            tentatives: tentative,
            nextRetryAt: !res.ok && tentative < maxTentatives
              ? new Date(Date.now() + Math.pow(5, tentative + 1) * 1000)
              : null,
          },
        });

        if (res.ok) {
          this.logger.log(`Webhook [${evenement}] livré à ${endpoint.url} (tentative ${tentative})`);
          return;
        }

        this.logger.warn(`Webhook [${evenement}] → ${endpoint.url} HTTP ${res.status} (tentative ${tentative}/${maxTentatives})`);
      } catch (err: any) {
        this.logger.warn(`Webhook [${evenement}] → ${endpoint.url} erreur: ${err?.message} (tentative ${tentative}/${maxTentatives})`);
        await this.prisma.webhookLivraison.update({
          where: { id: livraison.id },
          data: {
            reussi: false,
            reponseBody: err?.message ?? 'Erreur réseau',
            tentatives: tentative,
          },
        });
      }
    }

    this.logger.error(`Webhook [${evenement}] → ${endpoint.url} : échec après ${maxTentatives} tentatives`);
  }
}
