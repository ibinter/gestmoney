import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import type { Request } from 'express';
import { ApiKeysService } from '../api-keys.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private apiKeysService: ApiKeysService) {
    super();
  }

  async validate(req: Request): Promise<unknown> {
    const authHeader = req.headers['authorization'] as string | undefined;
    if (!authHeader?.startsWith('Bearer gm_live_')) {
      throw new UnauthorizedException('Clé API manquante ou invalide');
    }

    const rawKey = authHeader.slice('Bearer '.length);
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
      req.socket?.remoteAddress;

    const apiKey = await this.apiKeysService.valider(rawKey, ip);
    if (!apiKey) {
      throw new UnauthorizedException('Clé API invalide, expirée ou IP non autorisée');
    }

    return {
      sub: `api-key:${apiKey['id']}`,
      tenantId: apiKey['tenantId'],
      role: 'API_KEY',
      roles: ['API_KEY'],
      permissions: apiKey['permissions'],
      apiKeyId: apiKey['id'],
    };
  }
}
