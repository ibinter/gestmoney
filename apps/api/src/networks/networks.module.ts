import { Module } from '@nestjs/common';
import { NetworksController } from './networks.controller';
import { NetworksService } from './networks.service';

/**
 * Module Opérateurs (Network) — CRUD des réseaux Mobile Money.
 * PrismaService fourni globalement (PrismaModule @Global).
 */
@Module({
  controllers: [NetworksController],
  providers: [NetworksService],
  exports: [NetworksService],
})
export class NetworksModule {}
