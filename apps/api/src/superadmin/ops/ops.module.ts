import { Module } from '@nestjs/common';
import { OpsService } from './ops.service';
import { OpsController } from './ops.controller';
import { LicencesModule } from '../../licences/licences.module';

/**
 * Module de consultation SuperAdmin (Paiements / Licences / Analytics + export
 * clients). PrismaModule est @Global. `LicencesModule` est importé pour réutiliser
 * `LicencesService` (statut de licence, source unique) dans l'export clients.
 * À enregistrer dans app.module.ts (fait par l'équipe, pas ici).
 */
@Module({
  imports: [LicencesModule],
  controllers: [OpsController],
  providers: [OpsService],
  exports: [OpsService],
})
export class OpsModule {}
