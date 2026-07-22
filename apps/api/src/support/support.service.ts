import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { normaliserPagination } from '../common/utils/pagination';
import {
  CreateTicketDto,
  CreateTicketMessageDto,
} from './dto/ticket.dto';
import { TicketStatut } from '@prisma/client';

/**
 * Module support (tickets) — utilisateur courant. Chaque utilisateur gère ses
 * propres tickets (scopé par `userId`). Modèles réels Ticket / TicketMessage.
 */
@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(private readonly prisma: PrismaService) {}

  private genererNumero(): string {
    // Identifiant lisible et unique sans dépendre d'un compteur (pas de course).
    return `TCK-${Date.now().toString(36).toUpperCase()}`;
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
    return this.toDto(ticket);
  }

  async addMessage(id: string, userId: string, dto: CreateTicketMessageDto) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id, userId } });
    if (!ticket) throw new NotFoundException('Ticket introuvable');

    const message = await this.prisma.ticketMessage.create({
      data: { ticketId: id, auteurId: userId, contenu: dto.contenu },
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
