import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type EtapeKey = 'etape1' | 'etape2' | 'etape3' | 'etape4' | 'etape5';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Retourne (ou crée) l'état d'onboarding du tenant. */
  async getEtat(tenantId: string) {
    const row = await this.prisma.onboardingStep.upsert({
      where:  { tenantId },
      create: { tenantId },
      update: {},
    });
    const etapes = {
      etape1: row.etape1,
      etape2: row.etape2,
      etape3: row.etape3,
      etape4: row.etape4,
      etape5: row.etape5,
    };
    const completees = Object.values(etapes).filter(Boolean).length;
    return {
      ...etapes,
      termine: row.termine,
      completees,
      total: 5,
      updatedAt: row.updatedAt,
    };
  }

  /** Marque une étape comme terminée et met à jour le flag `termine`. */
  async marquerEtape(tenantId: string, etape: EtapeKey) {
    const row = await this.prisma.onboardingStep.upsert({
      where:  { tenantId },
      create: { tenantId, [etape]: true },
      update: { [etape]: true },
    });
    // Recalculer termine
    const toutes = ['etape1', 'etape2', 'etape3', 'etape4', 'etape5'] as EtapeKey[];
    const termine = toutes.every((k) => (k === etape ? true : !!(row as Record<string, unknown>)[k]));
    if (termine && !row.termine) {
      await this.prisma.onboardingStep.update({
        where: { tenantId },
        data: { termine: true },
      });
    }
    return this.getEtat(tenantId);
  }

  /** Remet à zéro l'onboarding (SUPERADMIN). */
  async reinitialiser(tenantId: string) {
    await this.prisma.onboardingStep.upsert({
      where:  { tenantId },
      create: { tenantId },
      update: {
        etape1: false,
        etape2: false,
        etape3: false,
        etape4: false,
        etape5: false,
        termine: false,
      },
    });
    this.logger.log(`Onboarding réinitialisé pour le tenant ${tenantId}`);
    return this.getEtat(tenantId);
  }
}
