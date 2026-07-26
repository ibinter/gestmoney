import { Module } from '@nestjs/common';
import { VersionsController } from './versions.controller';
import { VersionsService } from './versions.service';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * Module Versions — gestion des versions logiciel et notifications utilisateurs.
 * PrismaService est fourni globalement (PrismaModule @Global).
 */
@Module({
  imports: [NotificationsModule],
  controllers: [VersionsController],
  providers: [VersionsService],
  exports: [VersionsService],
})
export class VersionsModule {}
