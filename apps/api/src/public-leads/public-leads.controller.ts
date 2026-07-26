import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { SansLicence } from '../common/decorators/sans-licence.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateLeadDto, LeadSource } from './public-leads.dto';

/** Adresse interne qui reçoit les notifications de nouveau lead. */
const INTERNAL_EMAIL = 'gestmoney@ibigsoft.com';

/** Tenant fictif utilisé pour les logs de notification (pas de tenant auth ici). */
const PLATFORM_TENANT = 'platform';

@ApiTags('Public')
@Public()
@SansLicence()
@Controller('public/leads')
export class PublicLeadsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Reçoit une demande de démo ou de contact depuis la landing page.
   * - 5 requêtes / minute / IP (via ThrottlerGuard global + @Throttle ci-dessous)
   * - Aucune authentification requise (@Public + @SansLicence)
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Soumettre une demande de démonstration (formulaire landing page)' })
  @ApiResponse({ status: 200, description: 'Lead enregistré, emails de confirmation envoyés' })
  @ApiResponse({ status: 429, description: 'Trop de requêtes (max 5 / minute / IP)' })
  async create(@Body() dto: CreateLeadDto) {
    const source = dto.source ?? LeadSource.DEMO;

    // Mapper source → ProspectOrigine Prisma
    const origineMap: Record<LeadSource, string> = {
      [LeadSource.DEMO]: 'SITE_WEB',
      [LeadSource.CONTACT]: 'SITE_WEB',
      [LeadSource.PARTENARIAT]: 'IBIG_PARTNERS',
    };

    // 1. Persister le prospect en base
    await this.prisma.prospect.create({
      data: {
        nom: dto.nom,
        email: dto.email,
        telephone: dto.telephone ?? null,
        entreprise: dto.societe ?? null,
        besoin: dto.message ?? null,
        origine: origineMap[source] as any,
        consentement: true,
        statut: 'NOUVEAU',
      },
    });

    // 2. Email de confirmation au prospect
    const sujetProspect =
      source === LeadSource.PARTENARIAT
        ? 'Votre demande de partenariat GESTMONEY a bien été reçue'
        : 'Votre demande de démonstration GESTMONEY a bien été reçue';

    const corpsProspect = [
      `Bonjour ${dto.nom},`,
      '',
      'Nous avons bien reçu votre demande et un membre de notre équipe vous contactera dans les 24 heures.',
      '',
      dto.societe ? `Entreprise : ${dto.societe}` : '',
      dto.telephone ? `Téléphone : ${dto.telephone}` : '',
      dto.message ? `Votre message : ${dto.message}` : '',
      '',
      'Cordialement,',
      "L'équipe GESTMONEY — IBIG Soft",
      'https://gestmoney.ibigsoft.com',
    ]
      .filter((l) => l !== null)
      .join('\n');

    // fire-and-forget : jamais bloquant
    void this.notifications.sendEmail({
      to: dto.email,
      subject: sujetProspect,
      body: corpsProspect,
      tenantId: PLATFORM_TENANT,
    });

    // 3. Notification interne
    const sujetInterne = `[LEAD ${source}] ${dto.nom}${dto.societe ? ` — ${dto.societe}` : ''}`;
    const corpsInterne = [
      `Nouveau lead reçu depuis la landing page GESTMONEY.`,
      '',
      `Nom       : ${dto.nom}`,
      `Email     : ${dto.email}`,
      dto.telephone ? `Téléphone : ${dto.telephone}` : '',
      dto.societe ? `Société   : ${dto.societe}` : '',
      `Source    : ${source}`,
      dto.message ? `Message   : ${dto.message}` : '',
    ]
      .filter((l) => l !== null)
      .join('\n');

    void this.notifications.sendEmail({
      to: INTERNAL_EMAIL,
      subject: sujetInterne,
      body: corpsInterne,
      tenantId: PLATFORM_TENANT,
    });

    return { success: true };
  }
}
