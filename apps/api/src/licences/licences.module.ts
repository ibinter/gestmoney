import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
  imports: [ConfigModule.forFeature(licencesConfig)],
  controllers: [LicencesController],
  providers: [LicencesService, LicencesScheduler],
  exports: [LicencesService, LicencesScheduler],
})
export class LicencesModule {}
