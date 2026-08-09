import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { LicenceGuard } from './licence.guard';
import { LicencesService } from './licences.service';
import { LicencesScheduler } from './licences.scheduler';
import { LicencesController } from './licences.controller';
import licencesConfig from './licences.config';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * Cycle de vie des licences d'abonnement.
 *
 * `LicencesService` est exporté afin que le module paiements puisse appeler
 * `activerDepuisPaiement(...)` une fois l'encaissement confirmé : la dépendance
 * va des paiements vers les licences, jamais l'inverse.
 */
@Module({
  imports: [
    NotificationsModule,
    ConfigModule.forFeature(licencesConfig),
    // `LicenceGuard` vérifie lui-même le JWT (les gardes globales s'exécutent
    // avant `JwtAuthGuard`, donc avant que Passport ne remplisse `req.user`).
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret) throw new Error('JWT_SECRET non configuré');
        return { secret };
      },
    }),
  ],
  controllers: [LicencesController],
  providers: [LicencesService, LicencesScheduler, LicenceGuard],
  exports: [LicencesService, LicencesScheduler, LicenceGuard],
})
export class LicencesModule {}
