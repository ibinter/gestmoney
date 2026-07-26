import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { PushService } from './push.service';
import { PushSubscriptionDto, PushUnsubscribeDto } from './dto/push.dto';
import { SansLicence } from '../common/decorators/sans-licence.decorator';

/** Interface minimale pour les données attachées par le middleware JWT */
interface AuthRequest extends Request {
  user?: { id: string; tenantId: string };
}

@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  /**
   * Retourne la clé publique VAPID nécessaire au navigateur pour créer
   * une PushSubscription. Route publique (pas de JWT requis).
   */
  @Get('vapid-public-key')
  @SansLicence()
  getVapidPublicKey() {
    return { vapidPublicKey: this.pushService.getVapidPublicKey() };
  }

  /**
   * Enregistre ou met à jour une subscription push pour l'utilisateur authentifié.
   */
  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  async subscribe(@Req() req: AuthRequest, @Body() dto: PushSubscriptionDto) {
    const userId   = req.user?.id   ?? '';
    const tenantId = req.user?.tenantId ?? '';
    if (!userId || !tenantId) {
      return { ok: false, message: 'Non authentifié' };
    }
    dto.userAgent = req.headers['user-agent'] ?? undefined;
    await this.pushService.abonner(userId, tenantId, dto);
    return { ok: true };
  }

  /**
   * Désabonne l'endpoint passé en body.
   */
  @Delete('subscribe')
  @HttpCode(HttpStatus.OK)
  async unsubscribe(@Body() dto: PushUnsubscribeDto) {
    await this.pushService.desabonner(dto.endpoint);
    return { ok: true };
  }
}
