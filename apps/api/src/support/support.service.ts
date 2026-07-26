import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { normaliserPagination } from '../common/utils/pagination';
import {
  CreateTicketDto,
  CreateTicketMessageDto,
} from './dto/ticket.dto';
import { TicketStatut } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Module support (tickets) — utilisateur courant. Chaque utilisateur gère ses
 * propres tickets (scopé par `userId`). Modèles réels Ticket / TicketMessage.
 */
@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  private readonly SUPPORT_EMAIL = 'gestmoney@ibigsoft.com';

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private genererNumero(): string {
    // Identifiant lisible et unique sans dépendre d'un compteur (pas de course).
    return `TCK-${Date.now().toString(36).toUpperCase()}`;
  }

  /** Valide une pièce jointe en data URL base64 (tout type, <= 3 Mo). */
  private validerPieceJointe(dataUrl?: string): string | null {
    if (!dataUrl) return null;
    const m = /^data:([a-zA-Z0-9.+/-]+);base64,(.+)$/.exec(dataUrl.trim());
    if (!m) {
      throw new BadRequestException(
        'Pièce jointe invalide : une data URL base64 est attendue.',
      );
    }
    const octets = Buffer.byteLength(m[2], 'base64');
    if (octets === 0) throw new BadRequestException('Pièce jointe vide.');
    if (octets > 3_000_000) {
      throw new BadRequestException('Pièce jointe trop volumineuse (max 3 Mo).');
    }
    return dataUrl.trim();
  }

  private toDto(t: any) {
    return {
      id: t.id,
      numero: t.numero,
      objet: t.objet,
      description: t.description,
      categorie: t.categorie ?? null,
      priorite: t.priorite,
      statut: t.statut,
      module: t.module ?? null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };
  }

  async list(
    userId: string,
    query: {
      page?: string;
      limit?: string;
      statut?: string;
      priorite?: string;
      categorie?: string;
      search?: string;
    },
  ) {
    const { page, limit, skip } = normaliserPagination(
      query.page as any,
      query.limit as any,
      20,
    );

    const where: any = { userId };
    if (query.statut) where.statut = query.statut;
    if (query.priorite) where.priorite = query.priorite;
    if (query.categorie) where.categorie = query.categorie;
    if (query.search) {
      where.OR = [
        { objet: { contains: query.search, mode: 'insensitive' } },
        { numero: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { messages: true } } },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    const data = rows.map((t: any) => ({
      ...this.toDto(t),
      nbMessages: t._count.messages,
    }));

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async getOne(id: string, userId: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ticket) throw new NotFoundException('Ticket introuvable');

    const auteurIds = [
      ...new Set(
        ticket.messages.map((m) => m.auteurId).filter((v): v is string => !!v),
      ),
    ];
    const auteurs = auteurIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: auteurIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
    const nomParId = new Map(
      auteurs.map((u) => [
        u.id,
        `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || null,
      ]),
    );

    return {
      ...this.toDto(ticket),
      nbMessages: ticket.messages.length,
      messages: ticket.messages.map((m) => ({
        id: m.id,
        contenu: m.contenu,
        interne: m.interne,
        auteurId: m.auteurId,
        auteurNom: m.auteurId ? nomParId.get(m.auteurId) ?? null : null,
        pieceJointe: m.pieceJointe ?? null,
        pieceJointeNom: m.pieceJointeNom ?? null,
        createdAt: m.createdAt,
      })),
    };
  }

  async create(userId: string, tenantId: string, dto: CreateTicketDto) {
    const ticket = await this.prisma.ticket.create({
      data: {
        numero: this.genererNumero(),
        tenantId: tenantId ?? null,
        userId,
        objet: dto.objet,
        description: dto.description,
        categorie: dto.categorie ?? null,
        priorite: dto.priorite ?? 'NORMALE',
        module: dto.module ?? null,
        statut: 'NOUVEAU',
        // Le premier message reprend la description du ticket.
        messages: { create: [{ auteurId: userId, contenu: dto.description }] },
      },
    });
    this.logger.log(`Ticket ${ticket.numero} créé par ${userId}`);

    // Email de confirmation au créateur du ticket
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true },
    }).catch(() => null);

    if (user?.email) {
      void this.notifications.sendEmail({
        to: user.email,
        subject: `Ticket ${ticket.numero} créé — ${dto.objet}`,
        body: [
          `Bonjour ${user.firstName ?? ''},`,
          '',
          `Votre ticket d'assistance a bien été créé.`,
          '',
          `Numéro : ${ticket.numero}`,
          `Objet  : ${dto.objet}`,
          `Statut : NOUVEAU`,
          '',
          'Notre équipe traitera votre demande dans les meilleurs délais.',
          '',
          "L'équipe Support GESTMONEY",
        ].join('\n'),
        tenantId: tenantId ?? 'platform',
      });
    }

    // Notification interne à l'équipe support
    void this.notifications.sendEmail({
      to: this.SUPPORT_EMAIL,
      subject: `[TICKET] ${ticket.numero} — ${dto.objet}`,
      body: [
        `Nouveau ticket créé par ${userId}.`,
        '',
        `Numéro   : ${ticket.numero}`,
        `Objet    : ${dto.objet}`,
        `Catégorie: ${dto.categorie ?? 'N/A'}`,
        `Priorité : ${dto.priorite ?? 'NORMALE'}`,
        '',
        `Description :`,
        dto.description,
      ].join('\n'),
      tenantId: tenantId ?? 'platform',
    });

    // Notification in-app au créateur
    void this.notifications.creerInApp(
      userId,
      tenantId ?? 'platform',
      'SUPPORT',
      `Ticket ${ticket.numero} créé`,
      `Votre demande "${dto.objet}" a bien été enregistrée. Notre équipe vous répond rapidement.`,
      `/dashboard/support`,
    );

    return this.toDto(ticket);
  }

  async addMessage(id: string, userId: string, dto: CreateTicketMessageDto) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id, userId } });
    if (!ticket) throw new NotFoundException('Ticket introuvable');

    const pieceJointe = this.validerPieceJointe(dto.pieceJointe);
    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId: id,
        auteurId: userId,
        contenu: dto.contenu,
        pieceJointe,
        pieceJointeNom: pieceJointe ? dto.pieceJointeNom ?? 'piece-jointe' : null,
      },
    });

    // Remonte le ticket (updatedAt) et le rouvre s'il était résolu/fermé.
    const rouvrir =
      ticket.statut === 'RESOLU' || ticket.statut === 'FERME'
        ? { statut: 'EN_COURS' as TicketStatut }
        : {};
    await this.prisma.ticket.update({
      where: { id },
      data: { updatedAt: new Date(), ...rouvrir },
    });

    return {
      id: message.id,
      contenu: message.contenu,
      interne: message.interne,
      auteurId: message.auteurId,
      pieceJointe: message.pieceJointe ?? null,
      pieceJointeNom: message.pieceJointeNom ?? null,
      createdAt: message.createdAt,
    };
  }

  async changerStatut(id: string, userId: string, statut: TicketStatut) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id, userId } });
    if (!ticket) throw new NotFoundException('Ticket introuvable');
    const updated = await this.prisma.ticket.update({
      where: { id },
      data: { statut },
    });

    // Notification in-app sur changement de statut significatif
    if (statut === 'RESOLU' || statut === 'FERME' || statut === 'EN_COURS') {
      const libelle: Record<string, string> = {
        RESOLU: 'résolu',
        FERME: 'fermé',
        EN_COURS: 'pris en charge',
      };
      void this.notifications.creerInApp(
        userId,
        ticket.tenantId ?? 'platform',
        'SUPPORT',
        `Ticket ${ticket.numero} ${libelle[statut] ?? statut}`,
        `Le statut de votre ticket "${ticket.objet}" a été mis à jour : ${libelle[statut] ?? statut}.`,
        `/dashboard/support`,
      );
    }

    return this.toDto(updated);
  }

  async stats(userId: string) {
    const rows = await this.prisma.ticket.groupBy({
      by: ['statut'],
      where: { userId },
      _count: { _all: true },
    });
    const c = (s: string) =>
      rows.find((r) => r.statut === s)?._count._all ?? 0;
    const total = rows.reduce((acc, r) => acc + r._count._all, 0);
    return {
      total,
      ouverts: c('NOUVEAU') + c('OUVERT'),
      enCours: c('EN_COURS') + c('ATTENTE_CLIENT') + c('ESCALADE'),
      resolus: c('RESOLU') + c('FERME'),
    };
  }
}
