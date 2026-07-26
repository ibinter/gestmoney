import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { SansLicence } from '../common/decorators/sans-licence.decorator';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';
import { DocumentVerificationService } from './document-verification.service';
import { GenerateTokenDto } from './dto/generate-token.dto';

@ApiTags('Document Verification')
@Controller()
export class DocumentVerificationController {
  constructor(private readonly service: DocumentVerificationService) {}

  /**
   * Endpoint public — vérification d'un document par son token.
   * Accessible sans authentification.
   */
  @Get('public/verify/:token')
  @Public()
  @SansLicence()
  @ApiOperation({ summary: 'Vérifier l\'authenticité d\'un document via son token' })
  @ApiParam({ name: 'token', description: 'Token de vérification (hex 32 chars)' })
  async verify(@Param('token') token: string) {
    return this.service.verifyToken(token);
  }

  /**
   * Endpoint authentifié — génération d'un token de vérification pour un document.
   * Appelé par le frontend juste avant de télécharger un PDF.
   */
  @Post('documents/generate-verification-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Générer un token de vérification pour un document PDF' })
  async generateToken(
    @Body() dto: GenerateTokenDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    const token = await this.service.generateToken(
      dto.documentId,
      dto.documentType,
      user.tenantId,
      dto.contentSample ?? dto.documentId,
    );
    return {
      token,
      verifyUrl: `https://gestmoney.ibigsoft.com/verify/${token}`,
    };
  }
}
