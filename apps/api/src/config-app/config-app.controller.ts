import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConfigAppService } from './config-app.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

class UpdateTenantConfigDto {
  countryCode?: string;
  currency?: string;
  language?: string;
}

class SetLimitsDto {
  countryCode: string;
  operatorCode: string;
  perTransaction?: number;
  perDay?: number;
  perMonth?: number;
  currency?: string;
}

@ApiTags('config')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('config')
export class ConfigAppController {
  constructor(private readonly configAppService: ConfigAppService) {}

  // ─── Pays ─────────────────────────────────────────────────────────────────

  @Get('countries')
  @ApiOperation({ summary: 'Pays supportés avec devises, opérateurs et réglementations' })
  @ApiResponse({ status: 200, description: 'Liste des pays supportés' })
  getSupportedCountries() {
    return {
      data: this.configAppService.getSupportedCountries(),
      total: this.configAppService.getSupportedCountries().length,
    };
  }

  // ─── Devises ──────────────────────────────────────────────────────────────

  @Get('currencies')
  @ApiOperation({ summary: 'Devises africaines supportées (XOF, XAF, KES, NGN, GHS, TZS, UGX, RWF, MZN)' })
  getSupportedCurrencies() {
    return { data: this.configAppService.getSupportedCurrencies() };
  }

  // ─── Taux de change ───────────────────────────────────────────────────────

  @Get('exchange-rates')
  @ApiOperation({ summary: 'Taux de change actuels (base XOF, mise à jour quotidienne)' })
  async getExchangeRates() {
    return this.configAppService.getExchangeRates();
  }

  @Post('exchange-rates/refresh')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rafraîchir les taux de change depuis API externe (admin)' })
  async refreshExchangeRates() {
    await this.configAppService.refreshExchangeRates();
    return { message: 'Taux de change rafraîchis avec succès' };
  }

  // ─── Opérateurs ───────────────────────────────────────────────────────────

  @Get('operators')
  @ApiOperation({ summary: 'Opérateurs Mobile Money disponibles par pays' })
  getAllOperators() {
    return { data: this.configAppService.getAllOperators() };
  }

  @Get('operators/:countryCode')
  @ApiOperation({ summary: 'Opérateurs disponibles pour un pays spécifique' })
  getOperatorsByCountry(@Param('countryCode') countryCode: string) {
    return this.configAppService.getOperatorsByCountry(countryCode);
  }

  // ─── Configuration tenant ─────────────────────────────────────────────────

  @Get('tenant')
  @ApiOperation({ summary: 'Configuration actuelle du tenant (pays, devise, langue)' })
  async getTenantConfig(@CurrentUser() user: JwtPayload) {
    return this.configAppService.getTenantConfig(user.tenantId);
  }

  @Patch('tenant')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Configurer le tenant — pays, devise principale, langue (admin)' })
  async updateTenantConfig(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateTenantConfigDto,
  ) {
    return this.configAppService.updateTenantConfig(user.tenantId, dto);
  }

  // ─── Réglementations ──────────────────────────────────────────────────────

  @Get('regulations/:countryCode')
  @ApiOperation({ summary: 'Exigences réglementaires du pays (KYC, LBC-FT, limites légales)' })
  getRegulations(@Param('countryCode') countryCode: string) {
    return this.configAppService.getRegulations(countryCode);
  }

  // ─── Limites de transaction ───────────────────────────────────────────────

  @Get('limits')
  @ApiOperation({ summary: 'Limites de transaction configurées' })
  getLimits(
    @CurrentUser() user: JwtPayload,
  ) {
    // Retourner les limites de tous les pays configurés pour ce tenant
    const countries = this.configAppService.getSupportedCountries();
    return {
      data: countries.map((c) => ({
        countryCode: c.code,
        ...this.configAppService.getTransactionLimits(c.code),
      })),
    };
  }

  @Get('limits/:countryCode')
  @ApiOperation({ summary: 'Limites de transaction pour un pays et opérateur donnés' })
  getLimitsByCountry(
    @Param('countryCode') countryCode: string,
  ) {
    return this.configAppService.getTransactionLimits(countryCode);
  }

  @Post('limits')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Définir limites personnalisées par pays/opérateur (admin)' })
  async setLimits(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SetLimitsDto,
  ) {
    await this.configAppService.setTransactionLimits(
      user.tenantId,
      dto.countryCode,
      dto.operatorCode,
      {
        perTransaction: dto.perTransaction,
        perDay: dto.perDay,
        perMonth: dto.perMonth,
        currency: dto.currency,
      },
    );
    return { message: 'Limites mises à jour avec succès' };
  }
}
