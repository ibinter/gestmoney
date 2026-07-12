import { Body, Controller, Get, Patch, Query, Req, UseGuards } from '@nestjs/common';
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
}
