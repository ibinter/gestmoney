import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { KycSubmissionDto } from './dto/kyc-submission.dto';

export enum KycStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum KycLevel {
  NONE = 'NONE',
  BASIC = 'BASIC',
  FULL = 'FULL',
}

/** Limites de transaction selon niveau KYC (en XOF) */
export const KYC_LIMITS: Record<KycLevel, { perDay: number; label: string }> = {
  [KycLevel.NONE]: { perDay: 50_000, label: 'Non vérifié' },
  [KycLevel.BASIC]: { perDay: 500_000, label: 'KYC Basic' },
  [KycLevel.FULL]: { perDay: 5_000_000, label: 'KYC Complet' },
};

/** Durée de validité d'un KYC vérifié en millisecondes (1 an) */
const KYC_EXPIRY_MS = 365 * 24 * 60 * 60 * 1000;

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Soumission ───────────────────────────────────────────────────────────

  async submitVerification(
    userId: string,
    tenantId: string,
    dto: KycSubmissionDto,
  ) {
    // Vérifier s'il y a déjà un KYC PENDING ou VERIFIED actif
    const existingKyc = await this.prisma.kycVerification.findFirst({
      where: {
        userId,
        status: { in: [KycStatus.PENDING, KycStatus.VERIFIED] },
      },
    });

    if (existingKyc) {
      if (existingKyc.status === KycStatus.VERIFIED) {
        throw new BadRequestException('KYC déjà vérifié pour cet utilisateur');
      }
      if (existingKyc.status === KycStatus.PENDING) {
        throw new BadRequestException(
          'Une demande KYC est déjà en cours de traitement',
        );
      }
    }

    // Valider la date d'expiration si fournie
    if (dto.expiryDate) {
      const expiry = new Date(dto.expiryDate);
      if (expiry <= new Date()) {
        throw new BadRequestException('La pièce d\'identité est expirée');
      }
    }

    const kyc = await this.prisma.kycVerification.create({
      data: {
        userId,
        tenantId,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        documentUrl: dto.documentUrl,
        selfieUrl: dto.selfieUrl,
        status: KycStatus.PENDING,
      },
    });

    this.eventEmitter.emit('kyc.submitted', {
      kycId: kyc.id,
      userId,
      tenantId,
    });

    this.logger.log(`KYC soumis — user: ${userId}, type: ${dto.documentType}`);
    return kyc;
  }

  // ─── Statut ───────────────────────────────────────────────────────────────

  async getStatus(userId: string) {
    const kyc = await this.prisma.kycVerification.findFirst({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
    });

    if (!kyc) {
      return {
        userId,
        status: KycStatus.PENDING,
        level: KycLevel.NONE,
        limits: KYC_LIMITS[KycLevel.NONE],
        kycRecord: null,
      };
    }

    // Vérifier l'expiration
    if (kyc.status === KycStatus.VERIFIED && kyc.verifiedAt) {
      const expiresAt = new Date(kyc.verifiedAt.getTime() + KYC_EXPIRY_MS);
      if (expiresAt < new Date()) {
        await this.prisma.kycVerification.update({
          where: { id: kyc.id },
          data: { status: KycStatus.EXPIRED },
        });
        return {
          userId,
          status: KycStatus.EXPIRED,
          level: KycLevel.NONE,
          limits: KYC_LIMITS[KycLevel.NONE],
          expiresAt: expiresAt.toISOString(),
          kycRecord: { ...kyc, status: KycStatus.EXPIRED },
        };
      }

      const level = this.determineKycLevel(kyc);
      return {
        userId,
        status: KycStatus.VERIFIED,
        level,
        limits: KYC_LIMITS[level],
        verifiedAt: (kyc as any).reviewedAt?.toISOString() ?? new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        kycRecord: kyc,
      };
    }

    return {
      userId,
      status: kyc.status,
      level: KycLevel.NONE,
      limits: KYC_LIMITS[KycLevel.NONE],
      kycRecord: kyc,
    };
  }

  // ─── Approbation / Rejet ──────────────────────────────────────────────────

  async approve(userId: string, reviewerId: string, tenantId: string) {
    const kyc = await this.prisma.kycVerification.findFirst({
      where: { userId, status: KycStatus.PENDING },
      orderBy: { submittedAt: 'desc' },
    });

    if (!kyc) {
      throw new NotFoundException(
        `Aucun KYC PENDING trouvé pour l'utilisateur ${userId}`,
      );
    }

    const updated = await this.prisma.kycVerification.update({
      where: { id: kyc.id },
      data: {
        status: KycStatus.VERIFIED,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
      },
    });

    this.eventEmitter.emit('kyc.approved', {
      kycId: kyc.id,
      userId,
      tenantId,
    });

    this.eventEmitter.emit('notification.created', {
      userId,
      tenantId,
      notification: {
        type: 'KYC_APPROVED',
        title: 'KYC approuvé',
        message: 'Votre vérification d\'identité a été approuvée. Vos limites de transaction ont été augmentées.',
      },
    });

    this.logger.log(`KYC approuvé — user: ${userId}, reviewer: ${reviewerId}`);
    return updated;
  }

  async reject(userId: string, reason: string, reviewerId: string, tenantId: string) {
    const kyc = await this.prisma.kycVerification.findFirst({
      where: { userId, status: KycStatus.PENDING },
      orderBy: { submittedAt: 'desc' },
    });

    if (!kyc) {
      throw new NotFoundException(
        `Aucun KYC PENDING trouvé pour l'utilisateur ${userId}`,
      );
    }

    const updated = await this.prisma.kycVerification.update({
      where: { id: kyc.id },
      data: {
        status: KycStatus.REJECTED,
        rejectionReason: reason,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    });

    this.eventEmitter.emit('kyc.rejected', {
      kycId: kyc.id,
      userId,
      tenantId,
      reason,
    });

    this.eventEmitter.emit('notification.created', {
      userId,
      tenantId,
      notification: {
        type: 'KYC_REJECTED',
        title: 'KYC refusé',
        message: `Votre vérification d'identité a été refusée : ${reason}`,
      },
    });

    this.logger.warn(`KYC rejeté — user: ${userId}, raison: ${reason}`);
    return updated;
  }

  // ─── Liste des KYC en attente ─────────────────────────────────────────────

  async getPending(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.kycVerification.findMany({
        where: { tenantId, status: KycStatus.PENDING },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'asc' }, // FIFO
        skip,
        take: limit,
      }),
      this.prisma.kycVerification.count({
        where: { tenantId, status: KycStatus.PENDING },
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Documents ────────────────────────────────────────────────────────────

  async getDocuments(userId: string, requesterId: string, requesterRoles: string[]) {
    // Seul l'utilisateur lui-même ou un admin peut voir les documents
    const isAdmin = requesterRoles.some((r) =>
      ['ADMIN', 'SUPER_ADMIN', 'COMPLIANCE'].includes(r),
    );
    if (userId !== requesterId && !isAdmin) {
      throw new ForbiddenException('Accès refusé aux documents KYC');
    }

    return this.prisma.kycVerification.findMany({
      where: { userId },
      select: {
        id: true,
        documentType: true,
        documentNumber: true,
        documentUrl: true,
        selfieUrl: true,
        status: true,
        rejectionReason: true,
        submittedAt: true,
        reviewedAt: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  // ─── Helpers privés ───────────────────────────────────────────────────────

  private determineKycLevel(kyc: any): KycLevel {
    // KYC FULL si selfie + recto + verso + document non expiré
    if (
      kyc.selfieUrl &&
      kyc.documentUrl &&
      kyc.documentUrlBack &&
      ['CNI', 'PASSPORT'].includes(kyc.documentType)
    ) {
      return KycLevel.FULL;
    }
    // KYC BASIC si au moins le document principal est présent
    if (kyc.selfieUrl && kyc.documentUrl) {
      return KycLevel.BASIC;
    }
    return KycLevel.NONE;
  }
}
