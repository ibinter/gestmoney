import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { KycSubmissionDto, KycRejectDto } from './dto/kyc-submission.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('kyc')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('verify')
  @ApiOperation({
    summary: 'Soumettre une vérification KYC (pièce d\'identité + selfie)',
  })
  @ApiResponse({ status: 201, description: 'Demande KYC soumise, en attente de vérification' })
  @ApiResponse({ status: 400, description: 'KYC déjà en cours ou document expiré' })
  submitVerification(
    @CurrentUser() user: JwtPayload,
    @Body() dto: KycSubmissionDto,
  ) {
    return this.kycService.submitVerification(user.sub, user.tenantId, dto);
  }

  @Get('status/:userId')
  @ApiOperation({ summary: 'Statut KYC d\'un utilisateur (niveau, limites, expiration)' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur' })
  getStatus(@Param('userId') userId: string) {
    return this.kycService.getStatus(userId);
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.NETWORK_ADMIN)
  @ApiOperation({ summary: 'Liste des demandes KYC en attente de vérification (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getPending(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.kycService.getPending(user.tenantId, Number(page), Number(limit));
  }

  @Patch('approve/:userId')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.NETWORK_ADMIN)
  @ApiOperation({ summary: 'Approuver un KYC (admin) — débloque les limites supérieures' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur à approuver' })
  approve(
    @Param('userId') userId: string,
    @CurrentUser() reviewer: JwtPayload,
  ) {
    return this.kycService.approve(userId, reviewer.sub, reviewer.tenantId);
  }

  @Patch('reject/:userId')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.NETWORK_ADMIN)
  @ApiOperation({ summary: 'Rejeter un KYC avec motif (admin)' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur dont le KYC est rejeté' })
  reject(
    @Param('userId') userId: string,
    @CurrentUser() reviewer: JwtPayload,
    @Body() dto: KycRejectDto,
  ) {
    return this.kycService.reject(
      userId,
      dto.reason,
      reviewer.sub,
      reviewer.tenantId,
    );
  }

  @Get('documents/:userId')
  @ApiOperation({
    summary:
      'Documents KYC soumis par un utilisateur (accessible à l\'utilisateur lui-même ou admin)',
  })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur' })
  getDocuments(
    @Param('userId') userId: string,
    @CurrentUser() requester: JwtPayload,
  ) {
    return this.kycService.getDocuments(
      userId,
      requester.sub,
      requester.roles,
    );
  }
}
