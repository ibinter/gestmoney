import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleType } from '../common/enums/role.enum';
import { VersionsService } from './versions.service';
import { CreateVersionDto } from './dto/versions.dto';

@ApiTags('Versions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class VersionsController {
  constructor(private readonly versionsService: VersionsService) {}

  /** Liste toutes les versions publiées avec le flag vue par utilisateur. */
  @Get('versions')
  @ApiOperation({ summary: 'Lister les versions publiées' })
  listerVersions(@Req() req: { user: { userId: string } }) {
    return this.versionsService.listerVersions(req.user.userId);
  }

  /** Dernière version non vue par l'utilisateur connecté. */
  @Get('versions/latest')
  @ApiOperation({ summary: 'Dernière version non vue' })
  derniereNonVue(@Req() req: { user: { userId: string } }) {
    return this.versionsService.derniereNonVue(req.user.userId);
  }

  /** Marquer une version comme vue. */
  @Post('versions/:id/vue')
  @ApiOperation({ summary: 'Marquer une version comme vue' })
  marquerVue(
    @Req() req: { user: { userId: string } },
    @Param('id') versionId: string,
  ) {
    return this.versionsService.marquerVue(req.user.userId, versionId);
  }

  /** Créer une nouvelle version (SUPERADMIN). */
  @Post('admin/versions')
  @UseGuards(RolesGuard)
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Créer une version (SUPERADMIN)' })
  creerVersion(@Body() dto: CreateVersionDto) {
    return this.versionsService.creerVersion(dto);
  }

  /** Publier une version (SUPERADMIN). */
  @Patch('admin/versions/:id/publier')
  @UseGuards(RolesGuard)
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Publier une version (SUPERADMIN)' })
  publierVersion(@Param('id') id: string) {
    return this.versionsService.publierVersion(id);
  }
}
