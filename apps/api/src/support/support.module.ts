import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

/**
 * Module Support — tickets d'assistance de l'utilisateur courant.
 * PrismaService est fourni globalement (PrismaModule @Global).
 */
@Module({
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
