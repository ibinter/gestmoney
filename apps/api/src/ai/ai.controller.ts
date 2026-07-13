import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { v4 as uuidv4 } from 'uuid';

class ChatDto {
  message: string;
  sessionId?: string;
  contexte?: 'PUBLIC' | 'INTERNE' | 'SUPPORT';
}

@ApiTags('AI — SARA')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // Endpoint public pour la landing page (SARA commercial)
  @Public()
  @Post('chat/public')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'SARA — chat public (landing page, prospects)' })
  async chatPublic(@Body() dto: ChatDto) {
    const sessionId = dto.sessionId || `pub_${uuidv4()}`;
    return this.aiService.chat(dto.message, sessionId, undefined, 'PUBLIC');
  }

  // Endpoint privé pour le dashboard (SARA interne)
  @UseGuards(JwtAuthGuard)
  @Post('chat')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'SARA — chat interne (dashboard utilisateurs)' })
  async chat(@Body() dto: ChatDto, @Request() req: any) {
    const sessionId = dto.sessionId || `int_${uuidv4()}`;
    return this.aiService.chat(dto.message, sessionId, req.user?.sub, dto.contexte ?? 'INTERNE');
  }

  // Endpoint support (agents IBIG Soft)
  @UseGuards(JwtAuthGuard)
  @Post('chat/support')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'SARA — chat support (agents IBIG)' })
  async chatSupport(@Body() dto: ChatDto, @Request() req: any) {
    const sessionId = dto.sessionId || `sup_${uuidv4()}`;
    return this.aiService.chat(dto.message, sessionId, req.user?.sub, 'SUPPORT');
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
}
