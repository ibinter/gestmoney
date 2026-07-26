import { Body, Controller, Delete, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { NotificationsService } from './notifications.service';

class UpdatePreferencesDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() smsEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() emailEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() pushEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() emailAddress?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phoneNumber?: string;
}

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('preferences')
  @ApiOperation({ summary: "Préférences de notification de l'utilisateur connecté" })
  getPreferences(@Req() req: any) {
    return this.notificationsService.getUserPreferences(req.user.id, req.user.tenantId);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Mettre à jour les préférences de notification' })
  updatePreferences(@Body() dto: UpdatePreferencesDto, @Req() req: any) {
    return this.notificationsService.upsertPreferences(
      req.user.id,
      dto,
      req.user.tenantId,
    );
  }

  @Get('history')
  @ApiOperation({ summary: 'Historique des notifications envoyées' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Liste paginée des notifications' })
  getHistory(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.notificationsService.getHistory(req.user.tenantId, req.user.id, +page, +limit);
  }

  // ─── Notifications in-app ──────────────────────────────────────────────────

  @Get('count')
  @ApiOperation({ summary: 'Nombre de notifications in-app non lues' })
  async getCount(@Req() req: any) {
    const count = await this.notificationsService.compterInAppNonLues(
      req.user.id,
      req.user.tenantId,
    );
    return { count };
  }

  @Get()
  @ApiOperation({ summary: 'Liste des notifications in-app' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'read', required: false, type: Boolean })
  @ApiQuery({ name: 'type', required: false, type: String })
  async list(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('read') read?: string,
    @Query('type') type?: string,
  ) {
    return this.notificationsService.listerInApp(req.user.id, req.user.tenantId, {
      page: +page,
      limit: +limit,
      lue: read === undefined ? undefined : read === 'true',
      type,
    });
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marquer toutes les notifications in-app comme lues' })
  async markAllRead(@Req() req: any) {
    return this.notificationsService.marquerToutesInAppLues(req.user.id, req.user.tenantId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer une notification in-app comme lue' })
  async markRead(@Param('id') id: string, @Req() req: any) {
    return this.notificationsService.marquerInAppLue(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une notification in-app' })
  async delete(@Param('id') id: string, @Req() req: any) {
    return this.notificationsService.supprimerInApp(id, req.user.id);
  }
}
