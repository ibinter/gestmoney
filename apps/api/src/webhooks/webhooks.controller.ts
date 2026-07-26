import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleType } from '../common/enums/role.enum';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Post()
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Créer un endpoint webhook' })
  creer(@Req() req: any, @Body() dto: CreateWebhookDto) {
    return this.webhooks.creer(req.tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les webhooks du tenant' })
  lister(@Req() req: any) {
    return this.webhooks.lister(req.tenantId);
  }

  @Delete(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Supprimer un webhook' })
  supprimer(@Req() req: any, @Param('id') id: string) {
    return this.webhooks.supprimer(id, req.tenantId);
  }

  @Post(':id/test')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Envoyer un ping test au webhook' })
  tester(@Req() req: any, @Param('id') id: string) {
    return this.webhooks.tester(id, req.tenantId);
  }

  @Get(':id/livraisons')
  @ApiOperation({ summary: 'Historique des 50 dernières livraisons' })
  livraisons(@Req() req: any, @Param('id') id: string) {
    return this.webhooks.getLivraisons(id, req.tenantId);
  }

  @Post('livraisons/:livraisonId/retenter')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Re-envoyer manuellement une livraison' })
  retenter(@Req() req: any, @Param('livraisonId') livraisonId: string) {
    return this.webhooks.retenter(livraisonId, req.tenantId);
  }
}
