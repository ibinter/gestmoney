import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/** Nom du cookie httpOnly posé par AuthService à la connexion. */
const COOKIE_TOKEN = 'gestmoney_token';

/**
 * Le token est déposé dans un cookie httpOnly : le JavaScript du navigateur ne
 * peut pas le lire, donc le front ne peut PAS construire d'en-tête
 * `Authorization: Bearer`. N'extraire que depuis cet en-tête rendait tous les
 * endpoints protégés inaccessibles depuis l'application (401 systématique).
 * On lit donc le cookie en premier, puis l'en-tête — ce dernier restant utile
 * pour les clients non navigateur (mobile, intégrations, tests).
 */
function extraireToken(req: Request): string | null {
  const depuisCookie = (req?.cookies as Record<string, string> | undefined)?.[COOKIE_TOKEN];
  return depuisCookie ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extraireToken,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'gestmoney-super-secret-jwt-key-for-dev-32chars!'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    if (!user || user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Utilisateur non trouvé ou désactivé');
    }

    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles: user.userRoles.map((ur) => ur.role.name),
    };
  }
}
