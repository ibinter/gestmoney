import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SoumettreDocumentsDto, ValiderDossierDto, RefuserDossierDto, QueryKycDossiersDto } from './dto/kyc-dossier.dto';

const MAX_PHOTO_BYTES = 5_000_000; // 5 Mo

@Injectable()
export class KycDossierService {
  private readonly logger = new Logger(KycDossierService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Validation photo ─────────────────────────────────────────────────────

  private validerPhoto(dataUrl: string | undefined, champ: string): void {
    if (!dataUrl) return;
    const m = /^data:([a-zA-Z0-9.+/-]+);base64,(.+)$/.exec(dataUrl.trim());
    if (!m) throw new BadRequestException(`${champ} : data URL base64 attendue.`);
    if (Buffer.byteLength(m[2], 'base64') > MAX_PHOTO_BYTES)
      throw new BadRequestException(`${champ} trop volumineuse (max 5 Mo).`);
  }

  // ─── Lire un dossier ──────────────────────────────────────────────────────

  async getDossier(clientId: string, tenantId: string) {
    return this.prisma.kycDossier.findFirst({
      where: { clientId, tenantId },
    });
  }

  // ─── Soumettre / mettre à jour les documents ──────────────────────────────

  async soumettreDocuments(
    clientId: string,
    tenantId: string,
    dto: SoumettreDocumentsDto,
  ) {
    // Vérifier que le client appartient au tenant
    const client = await this.prisma.customer.findFirst({ where: { id: clientId, tenantId } });
    if (!client) throw new NotFoundException('Client introuvable');

    // Valider chaque photo fournie
    this.validerPhoto(dto.photoRecto, 'Photo recto');
    this.validerPhoto(dto.photoVerso, 'Photo verso');
    this.validerPhoto(dto.photoSelfie, 'Photo selfie');

    // Vérifier la date d'expiration si fournie
    if (dto.dateExpiration) {
      if (new Date(dto.dateExpiration) <= new Date())
        throw new BadRequestException("La pièce d'identité est expirée.");
    }

    const data = {
      tenantId,
      statut: 'EN_COURS',
      typeDocument: dto.typeDocument,
      numeroDocument: dto.numeroDocument,
      dateExpiration: dto.dateExpiration ? new Date(dto.dateExpiration) : null,
      paysEmetteur: dto.paysEmetteur ?? null,
      photoRecto: dto.photoRecto ?? null,
      photoVerso: dto.photoVerso ?? null,
      photoSelfie: dto.photoSelfie ?? null,
      // Réinitialise la décision précédente
      verifiePar: null,
      verifieAt: null,
      commentaire: null,
    };

    const dossier = await this.prisma.kycDossier.upsert({
      where: { clientId },
      create: { clientId, ...data },
      update: data,
    });

    // Sync statut sur le Customer (rétrocompatibilité)
    await this.prisma.customer.update({
      where: { id: clientId },
      data: { kycStatus: 'PENDING', kycRejectionReason: null },
    });

    this.logger.log(`KYC dossier soumis — client: ${clientId}`);
    return dossier;
  }

  // ─── Valider un dossier ───────────────────────────────────────────────────

  async valider(dossierId: string, verifieurId: string, dto?: ValiderDossierDto) {
    const dossier = await this.prisma.kycDossier.findUnique({ where: { id: dossierId } });
    if (!dossier) throw new NotFoundException('Dossier KYC introuvable');
    if (dossier.statut === 'VALIDE') throw new BadRequestException('Dossier déjà validé');

    const updated = await this.prisma.kycDossier.update({
      where: { id: dossierId },
      data: {
        statut: 'VALIDE',
        verifiePar: verifieurId,
        verifieAt: new Date(),
        commentaire: dto?.commentaire ?? null,
      },
    });

    // Sync sur Customer
    await this.prisma.customer.update({
      where: { id: dossier.clientId },
      data: {
        kycStatus: 'VERIFIED',
        kycVerified: true,
        kycVerifiedAt: new Date(),
        kycRejectionReason: null,
      },
    });

    this.logger.log(`KYC validé — dossier: ${dossierId}, vérificateur: ${verifieurId}`);
    return updated;
  }

  // ─── Refuser un dossier ───────────────────────────────────────────────────

  async refuser(dossierId: string, verifieurId: string, dto: RefuserDossierDto) {
    const dossier = await this.prisma.kycDossier.findUnique({ where: { id: dossierId } });
    if (!dossier) throw new NotFoundException('Dossier KYC introuvable');

    const updated = await this.prisma.kycDossier.update({
      where: { id: dossierId },
      data: {
        statut: 'REFUSE',
        verifiePar: verifieurId,
        verifieAt: new Date(),
        commentaire: dto.commentaire,
      },
    });

    // Sync sur Customer
    await this.prisma.customer.update({
      where: { id: dossier.clientId },
      data: {
        kycStatus: 'REJECTED',
        kycVerified: false,
        kycRejectionReason: dto.commentaire,
      },
    });

    this.logger.warn(`KYC refusé — dossier: ${dossierId}, raison: ${dto.commentaire}`);
    return updated;
  }

  // ─── Lister les dossiers ──────────────────────────────────────────────────

  async listerDossiers(tenantId: string, opts: QueryKycDossiersDto) {
    const page = Number(opts.page) || 1;
    const limit = Number(opts.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (opts.statut) where.statut = opts.statut.toUpperCase();

    const [dossiers, total] = await Promise.all([
      this.prisma.kycDossier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.kycDossier.count({ where }),
    ]);

    return {
      data: dossiers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Statistiques ─────────────────────────────────────────────────────────

  async statsKyc(tenantId: string) {
    const counts = await this.prisma.kycDossier.groupBy({
      by: ['statut'],
      where: { tenantId },
      _count: { _all: true },
    });

    const result: Record<string, number> = {
      EN_ATTENTE: 0,
      EN_COURS: 0,
      VALIDE: 0,
      REFUSE: 0,
      EXPIRE: 0,
    };
    for (const row of counts) {
      result[row.statut] = row._count._all;
    }

    return {
      total: Object.values(result).reduce((s, n) => s + n, 0),
      ...result,
    };
  }
}
