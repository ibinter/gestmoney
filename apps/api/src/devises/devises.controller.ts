import {
  Body,
  Controller,
  Get,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DevisesService } from './devises.service';
import { UpdateTauxDto } from './dto/update-taux.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('devises')
@Controller('devises')
export class DevisesController {
  constructor(private readonly devisesService: DevisesService) {}

  @Get('taux')
  @ApiOperation({ summary: 'Liste tous les taux de change configurés' })
  async getTousTaux() {
    return this.devisesService.getTousTaux();
  }

  @Get('convertir')
  @ApiOperation({ summary: 'Conversion à la volée' })
  @ApiQuery({ name: 'montant', type: Number })
  @ApiQuery({ name: 'de', type: String })
  @ApiQuery({ name: 'vers', type: String })
  async convertir(
    @Query('montant') montant: string,
    @Query('de') de: string,
    @Query('vers') vers: string,
  ) {
    const montantNum = parseFloat(montant);
    const resultat = await this.devisesService.convertir(montantNum, de, vers);
    return {
      montant: montantNum,
      deviseSource: de,
      deviseCible: vers,
      resultat,
    };
  }

  @Put('taux')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mise à jour manuelle d\'un taux (NETWORK_ADMIN+)' })
  async updateTaux(@Body() dto: UpdateTauxDto) {
    return this.devisesService.updateTaux(dto);
  }
}
