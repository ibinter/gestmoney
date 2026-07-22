import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SupportService } from './support.service';
import {
  ChangerStatutTicketDto,
  CreateTicketDto,
  CreateTicketMessageDto,
} from './dto/ticket.dto';

@ApiTags('Support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('support/tickets')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get()
  @ApiOperation({ summary: 'Lister mes tickets de support' })
  list(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('statut') statut?: string,
    @Query('priorite') priorite?: string,
    @Query('categorie') categorie?: string,
    @Query('search') search?: string,
  ) {
    return this.supportService.list(req.user.id, {
      page,
      limit,
      statut,
      priorite,
      categorie,
      search,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques de mes tickets' })
  stats(@Req() req: any) {
    return this.supportService.stats(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un ticket + fil de messages' })
  getOne(@Param('id') id: string, @Req() req: any) {
    return this.supportService.getOne(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Ouvrir un ticket de support' })
  create(@Body() dto: CreateTicketDto, @Req() req: any) {
    return this.supportService.create(req.user.id, req.user.tenantId, dto);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Répondre / ajouter un message à un ticket' })
  addMessage(
    @Param('id') id: string,
    @Body() dto: CreateTicketMessageDto,
    @Req() req: any,
  ) {
    return this.supportService.addMessage(id, req.user.id, dto);
  }

  @Patch(':id/statut')
  @ApiOperation({ summary: 'Changer le statut d\'un ticket' })
  changerStatut(
    @Param('id') id: string,
    @Body() dto: ChangerStatutTicketDto,
    @Req() req: any,
  ) {
    return this.supportService.changerStatut(id, req.user.id, dto.statut);
  }
}
