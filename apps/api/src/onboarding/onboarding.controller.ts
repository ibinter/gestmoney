import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OnboardingService, EtapeKey } from './onboarding.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import { RoleType } from '../common/enums/role.enum';

@ApiTags('Onboarding')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly svc: OnboardingService) {}

  @Get()
  @ApiOperation({ summary: "Retourne l'état d'onboarding du tenant" })
  async getEtat(@TenantId() tenantId: string) {
    return this.svc.getEtat(tenantId);
  }

  @Post('marquer/:etape')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marque une étape comme terminée' })
  async marquer(
    @TenantId() tenantId: string,
    @Param('etape') etape: string,
  ) {
    const etapes: EtapeKey[] = ['etape1', 'etape2', 'etape3', 'etape4', 'etape5'];
    const key = etape as EtapeKey;
    if (!etapes.includes(key)) {
      return { error: `Étape inconnue : ${etape}` };
    }
    return this.svc.marquerEtape(tenantId, key);
  }

  @Delete('reinitialiser')
  @Roles(RoleType.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remet l'onboarding à zéro (SUPERADMIN)" })
  async reinitialiser(@TenantId() tenantId: string) {
    return this.svc.reinitialiser(tenantId);
  }
}
