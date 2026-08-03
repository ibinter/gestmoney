import { Controller, Post, Body, Get, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AiService } from './ai.service';
import { KnowledgeService } from './knowledge.service';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { v4 as uuidv4 } from 'uuid';

class KnowledgeSyncEntryDto {
  @IsString() slug: string;
  @IsString() titre: string;
  @IsString() categorie: string;
  @IsString() contenu: string;
  @IsArray() @IsString({ each: true }) mots_cles: string[];
  @IsString() source: string;
  @IsOptional() @IsString() langue?: string;
}

class KnowledgeSyncDto {
  @IsArray() entrees: KnowledgeSyncEntryDto[];
}

// Sans ces décorateurs, la validation globale (`whitelist` +
// `forbidNonWhitelisted`) rejetait TOUTE requête avec « property message
// should not exist » : le chat SARA renvoyait donc un 400 systématique.
class ChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsIn(['PUBLIC', 'INTERNE', 'SUPPORT'])
  contexte?: 'PUBLIC' | 'INTERNE' | 'SUPPORT';
}

@ApiTags('AI — SARA')
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly knowledgeService: KnowledgeService,
  ) {}

  // Endpoint public pour la landing page (SARA commercial)
  @Public()
  @Post('chat/public')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'SARA — chat public (landing page, prospects)' })
  async chatPublic(@Body() dto: ChatDto) {
    const sessionId = dto.sessionId || `pub_${uuidv4()}`;
    return this.aiService.chat(dto.message, sessionId, undefined, 'PUBLIC', undefined);
  }

  // Endpoint privé pour le dashboard (SARA interne)
  @UseGuards(JwtAuthGuard)
  @Post('chat')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'SARA — chat interne (dashboard utilisateurs)' })
  async chat(@Body() dto: ChatDto, @Request() req: any) {
    const sessionId = dto.sessionId || `int_${uuidv4()}`;
    return this.aiService.chat(dto.message, sessionId, req.user?.sub, dto.contexte ?? 'INTERNE', req.tenantId);
  }

  // Endpoint support (agents IBIG Soft)
  @UseGuards(JwtAuthGuard)
  @Post('chat/support')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'SARA — chat support (agents IBIG)' })
  async chatSupport(@Body() dto: ChatDto, @Request() req: any) {
    const sessionId = dto.sessionId || `sup_${uuidv4()}`;
    return this.aiService.chat(dto.message, sessionId, req.user?.sub, 'SUPPORT', req.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Statut des providers IA' })
  async status() {
    return {
      sara: 'online',
      providers: ['groq', 'openai', 'anthropic'],
      activeProvider: process.env.SARA_PROVIDER || 'groq',
      model: process.env.SARA_MODEL || 'llama-3.3-70b-versatile',
    };
  }

  /**
   * POST /ai/admin/knowledge/sync
   * Permet au SUPERADMIN de re-synchroniser la base documentaire sans redéploiement.
   * Corps : { entrees: KnowledgeSyncEntryDto[] }
   */
  @UseGuards(JwtAuthGuard)
  @Post('admin/knowledge/sync')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'SUPERADMIN — Synchroniser la base documentaire RAG de SARA' })
  async syncKnowledge(@Body() dto: KnowledgeSyncDto, @Request() req: any) {
    // Restriction SUPER_ADMIN uniquement
    const userRoles: string[] = req.user?.roles ?? [];
    const isSuperAdmin =
      userRoles.includes('SUPER_ADMIN') ||
      userRoles.includes('super_admin') ||
      req.user?.role === 'SUPER_ADMIN';

    if (!isSuperAdmin) {
      throw new ForbiddenException('Réservé au SUPER_ADMIN');
    }

    const count = await this.knowledgeService.synchroniser(dto.entrees ?? []);
    return {
      success: true,
      synchronised: count,
      message: `${count} entrée(s) documentaire(s) synchronisée(s) avec succès.`,
    };
  }

  /**
   * GET /ai/admin/knowledge/search?q=...
   * Permet de tester la recherche documentaire (SUPERADMIN).
   */
  @UseGuards(JwtAuthGuard)
  @Get('admin/knowledge/search')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'SUPERADMIN — Tester la recherche documentaire' })
  async searchKnowledge(@Request() req: any) {
    const userRoles: string[] = req.user?.roles ?? [];
    const isSuperAdmin =
      userRoles.includes('SUPER_ADMIN') ||
      userRoles.includes('super_admin') ||
      req.user?.role === 'SUPER_ADMIN';

    if (!isSuperAdmin) {
      throw new ForbiddenException('Réservé au SUPER_ADMIN');
    }

    const q: string = req.query?.q ?? '';
    if (!q) return { results: [], contexte: '' };

    const results = await this.knowledgeService.chercher(q, 5);
    const contexte = await this.knowledgeService.construireContexte(q);
    return { results, contexte, query: q };
  }
}
