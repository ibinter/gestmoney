import { Module } from '@nestjs/common';
import { OpsService } from './ops.service';
import { OpsController } from './ops.controller';

/**
 * Module de consultation SuperAdmin (Paiements / Licences / Analytics).
 * PrismaModule est @Global, aucun import nécessaire.
 * À enregistrer dans app.module.ts (fait par l'équipe, pas ici).
 */
@Module({
  controllers: [OpsController],
  providers: [OpsService],
  exports: [OpsService],
})
export class OpsModule {}
