import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { LicenceGuard } from './licence.guard';
import { LicencesService } from './licences.service';
import { LicencesScheduler } from './licences.scheduler';
import { LicencesController } from './licences.controller';
import licencesConfig from './licences.config';

/**
 * Cycle de vie des licences d'abonnement.
 *
 * `LicencesService` est exporté afin que le module paiements puisse appeler
 * `activerDepuisPaiement(...)` une fois l'encaissement confirmé : la dépendance
 * va des paiements vers les licences, jamais l'inverse.
 */
@Module({
  imports: [
    ConfigModule.forFeature(licencesConfig),
    // `LicenceGuard` vérifie lui-même le JWT (les gardes globales s'exécutent
    // avant `JwtAuthGuard`, donc avant que Passport ne remplisse `req.user`).
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>(
          'JWT_SECRET',
          'gestmoney-super-secret-jwt-key-for-dev-32chars!',
        ),
      }),
    }),
  ],
  controllers: [LicencesController],
  providers: [LicencesService, LicencesScheduler, LicenceGuard],
  exports: [LicencesService, LicencesScheduler, LicenceGuard],
})
export class LicencesModule {}
