import {
  Controller,
  Get,
  Put,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AlertesService } from './alertes.service';
import { UpdateConfigAlertesDto, ListAlertesDto } from './dto/alertes.dto';

@UseGuards(JwtAuthGuard)
@Controller('alertes')
export class AlertesController {
  constructor(private readonly alertesService: AlertesService) {}

  /** GET /alertes — liste paginée */
  @Get()
  async getAlertes(@Request() req: any, @Query() query: ListAlertesDto) {
    const tenantId: string = req.user.tenantId;
    const lu = query.lu !== undefined ? String(query.lu) === 'true' : undefined;
    return this.alertesService.getAlertes(tenantId, {
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 30,
      lu,
    });
  }

  /** GET /alertes/config — configuration actuelle */
  @Get('config')
  async getConfig(@Request() req: any) {
    return this.alertesService.getConfig(req.user.tenantId);
  }

  /** PUT /alertes/config — mettre à jour la configuration */
  @Put('config')
  async updateConfig(@Request() req: any, @Body() dto: UpdateConfigAlertesDto) {
    return this.alertesService.updateConfig(req.user.tenantId, dto);
  }

  /** PATCH /alertes/tout-lire — marquer toutes les alertes comme lues */
  @Patch('tout-lire')
  async marquerToutesLues(@Request() req: any) {
    return this.alertesService.marquerToutesLues(req.user.tenantId);
  }

  /** PATCH /alertes/:id/lu — marquer une alerte comme lue */
  @Patch(':id/lu')
  async marquerLue(@Param('id') id: string, @Request() req: any) {
    return this.alertesService.marquerLue(id, req.user.tenantId);
  }
}
