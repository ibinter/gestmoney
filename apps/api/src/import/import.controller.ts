import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseEnumPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleType } from '../common/enums/role.enum';
import { ImportService } from './import.service';
import { ImportType } from './import.dto';

@ApiTags('Import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  /**
   * POST /import/:type
   * Upload un fichier XLSX ou CSV, valide et importe les données.
   * Throttle : 3 requêtes par minute par IP.
   */
  @Post(':type')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @UseInterceptors(
    FileInterceptor('fichier', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
          'text/plain',
          'application/octet-stream',
        ];
        if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|csv)$/i)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Seuls les fichiers .xlsx et .csv sont acceptés'), false);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'type', enum: ImportType })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fichier: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Importer des données depuis un fichier XLSX/CSV' })
  @ApiResponse({ status: 200, description: 'Rapport d\'import' })
  @ApiResponse({ status: 400, description: 'Fichier invalide ou type non supporté' })
  async importer(
    @Param('type', new ParseEnumPipe(ImportType)) type: ImportType,
    @UploadedFile() fichier: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!fichier) {
      throw new BadRequestException('Aucun fichier reçu — champ multipart attendu : "fichier"');
    }

    return this.importService.traiterFichier(
      fichier.buffer,
      fichier.mimetype,
      type,
      req.user.tenantId,
      req.user.id,
    );
  }

  /**
   * GET /import/:type/modele
   * Télécharge le fichier XLSX modèle pour le type donné.
   */
  @Get(':type/modele')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiParam({ name: 'type', enum: ImportType })
  @ApiOperation({ summary: 'Télécharger le fichier modèle XLSX pour un type d\'import' })
  @ApiResponse({ status: 200, description: 'Fichier XLSX modèle' })
  telechargerModele(
    @Param('type', new ParseEnumPipe(ImportType)) type: ImportType,
    @Res() res: Response,
  ) {
    const buffer = this.importService.genererModele(type);
    const filename = `${type}_import_modele.xlsx`;

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
