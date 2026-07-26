import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface VerifyResult {
  valid: boolean;
  document?: {
    id: string;
    documentId: string;
    documentType: string;
    tenantId: string;
    createdAt: Date;
    verifiedCount: number;
    expiresAt: Date | null;
  };
  reason?: string;
}

@Injectable()
export class DocumentVerificationService {
  private readonly logger = new Logger(DocumentVerificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Génère un token de vérification pour un document et le persiste en base.
   * Retourne le token (hex 32 chars).
   */
  async generateToken(
    documentId: string,
    documentType: string,
    tenantId: string,
    content: Buffer | string,
  ): Promise<string> {
    const token = crypto.randomBytes(16).toString('hex');
    const contentHash = crypto
      .createHash('sha256')
      .update(typeof content === 'string' ? Buffer.from(content, 'utf-8') : content)
      .digest('hex');

    await this.prisma.documentVerification.upsert({
      where: { token },
      create: {
        token,
        documentId,
        documentType,
        tenantId,
        contentHash,
      },
      update: {
        contentHash,
        documentType,
      },
    });

    this.logger.log(`Token généré pour document ${documentId} (type: ${documentType})`);
    return token;
  }

  /**
   * Vérifie un token, incrémente le compteur et retourne les informations du document.
   */
  async verifyToken(token: string): Promise<VerifyResult> {
    const record = await this.prisma.documentVerification.findUnique({
      where: { token },
    });

    if (!record) {
      return { valid: false, reason: 'Token introuvable' };
    }

    if (record.expiresAt && record.expiresAt < new Date()) {
      return { valid: false, reason: 'Lien expiré' };
    }

    // Incrémente le compteur et met à jour verifiedAt
    await this.prisma.documentVerification.update({
      where: { token },
      data: {
        verifiedCount: { increment: 1 },
        verifiedAt: new Date(),
      },
    });

    return {
      valid: true,
      document: {
        id: record.id,
        documentId: record.documentId,
        documentType: record.documentType,
        tenantId: record.tenantId,
        createdAt: record.createdAt,
        verifiedCount: record.verifiedCount + 1,
        expiresAt: record.expiresAt,
      },
    };
  }
}
