import {
  Controller,
  Get,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleType } from '../common/enums/role.enum';
import { BackupService } from './backup.service';

@ApiTags('Admin - Sauvegardes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.SUPER_ADMIN)
@Controller('admin/backups')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les fichiers de sauvegarde disponibles' })
  @ApiResponse({ status: 200, description: 'Liste des sauvegardes' })
  listeBackups() {
    return this.backupService.listeBackups();
  }

  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Déclencher une sauvegarde manuelle immédiate' })
  @ApiResponse({ status: 200, description: 'Sauvegarde lancée' })
  declencherBackup() {
    return this.backupService.declencherBackup();
  }
}
