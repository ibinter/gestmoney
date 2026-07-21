import { Module } from '@nestjs/common';
import { ProspectsService } from './prospects.service';
import { ProspectsController } from './prospects.controller';
import { DemonstrationsService } from './demonstrations.service';
import { DemonstrationsController } from './demonstrations.controller';
import { OffresService } from './offres.service';
import { OffresController } from './offres.controller';

/**
 * Module CRM SuperAdmin (IBIG Soft) : pipeline commercial du logiciel lui-même
 * — prospects, démonstrations et offres personnalisées.
 *
 * PrismaService est fourni globalement (PrismaModule @Global), aucun import
 * n'est donc nécessaire ici. Ce module doit être enregistré manuellement dans
 * AppModule (fait par un autre intervenant).
 */
@Module({
  controllers: [
    ProspectsController,
    DemonstrationsController,
    OffresController,
  ],
  providers: [ProspectsService, DemonstrationsService, OffresService],
  exports: [ProspectsService, DemonstrationsService, OffresService],
})
export class CrmModule {}
