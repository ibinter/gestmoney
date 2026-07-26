import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  // ── Génération ──────────────────────────────────────────────────────────────
  async generer(
    tenantId: string,
    userId: string,
    dto: CreateApiKeyDto,
  ): Promise<{ key: string; apiKey: Record<string, unknown> }> {
    const rawSuffix = randomBytes(16).toString('hex'); // 32 chars hex
    const rawKey = `gm_live_${rawSuffix}`;
    const prefix = rawKey.slice(0, 16); // "gm_live_" + 8 chars
    const keyHash = createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await this.prisma.apiKey.create({
      data: {
        tenantId,
        nom: dto.nom,
        keyHash,
        prefix,
        permissions: dto.permissions,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        ipWhitelist: dto.ipWhitelist ?? [],
        createdBy: userId,
      },
    });

    // Retirer le hash de la réponse — on renvoie les métadonnées + la clé en clair
    const { keyHash: _kh, ...safe } = apiKey;
    return { key: rawKey, apiKey: safe };
  }

  // ── Validation (utilisée par la stratégie Passport) ─────────────────────────
  async valider(
    rawKey: string,
    ip?: string,
  ): Promise<Record<string, unknown> | null> {
    if (!rawKey.startsWith('gm_live_')) return null;

    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await this.prisma.apiKey.findUnique({ where: { keyHash } });

    if (!apiKey) return null;
    if (!apiKey.actif) return null;
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;
    if (
      apiKey.ipWhitelist.length > 0 &&
      ip &&
      !apiKey.ipWhitelist.includes(ip)
    ) {
      return null;
    }

    // Mise à jour lastUsedAt + nbAppels en arrière-plan
    void this.prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date(), nbAppels: { increment: 1 } },
      })
      .catch(() => undefined);

    const { keyHash: _kh, ...safe } = apiKey;
    return safe;
  }

  // ── Révocation ───────────────────────────────────────────────────────────────
  async revoquer(id: string, tenantId: string): Promise<void> {
    const apiKey = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!apiKey) throw new NotFoundException('Clé API introuvable');
    if (apiKey.tenantId !== tenantId)
      throw new ForbiddenException('Accès refusé');

    await this.prisma.apiKey.update({
      where: { id },
      data: { actif: false, revokedAt: new Date() },
    });
  }

  // ── Liste ────────────────────────────────────────────────────────────────────
  async lister(tenantId: string): Promise<Record<string, unknown>[]> {
    const keys = await this.prisma.apiKey.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return keys.map(({ keyHash: _kh, ...safe }) => safe);
  }
}
