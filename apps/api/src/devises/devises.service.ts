import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTauxDto } from './dto/update-taux.dto';

@Injectable()
export class DevisesService {
  private readonly logger = new Logger(DevisesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Lecture ───────────────────────────────────────────────────────────────

  async getTousTaux() {
    return this.prisma.tauxChange.findMany({
      orderBy: [{ deviseBase: 'asc' }, { deviseCible: 'asc' }],
    });
  }

  async getTaux(deviseBase: string, deviseCible: string): Promise<number> {
    if (deviseBase === deviseCible) return 1;

    // Taux direct
    const direct = await this.prisma.tauxChange.findUnique({
      where: { deviseBase_deviseCible: { deviseBase, deviseCible } },
    });
    if (direct) return direct.taux;

    // Taux inverse
    const inverse = await this.prisma.tauxChange.findUnique({
      where: { deviseBase_deviseCible: { deviseBase: deviseCible, deviseCible: deviseBase } },
    });
    if (inverse && inverse.taux !== 0) return 1 / inverse.taux;

    throw new NotFoundException(
      `Taux de change introuvable : ${deviseBase} → ${deviseCible}`,
    );
  }

  // ─── Conversion ────────────────────────────────────────────────────────────

  async convertir(
    montant: number,
    deviseSource: string,
    deviseCible: string,
  ): Promise<number> {
    const taux = await this.getTaux(deviseSource, deviseCible);
    return parseFloat((montant * taux).toFixed(4));
  }

  /**
   * Ramène un montant quelconque en XOF.
   * Si la devise est déjà XOF, retourne le montant tel quel.
   */
  async montantEnXOF(montant: number, devise: string): Promise<number> {
    if (devise === 'XOF') return montant;
    return this.convertir(montant, devise, 'XOF');
  }

  // ─── Mise à jour ───────────────────────────────────────────────────────────

  async updateTaux(dto: UpdateTauxDto) {
    const taux = await this.prisma.tauxChange.upsert({
      where: {
        deviseBase_deviseCible: {
          deviseBase: dto.deviseBase,
          deviseCible: dto.deviseCible,
        },
      },
      update: {
        taux: dto.taux,
        source: dto.source ?? 'MANUAL',
      },
      create: {
        deviseBase: dto.deviseBase,
        deviseCible: dto.deviseCible,
        taux: dto.taux,
        source: dto.source ?? 'MANUAL',
      },
    });
    this.logger.log(`Taux mis à jour : ${dto.deviseBase}→${dto.deviseCible} = ${dto.taux}`);
    return taux;
  }
}
