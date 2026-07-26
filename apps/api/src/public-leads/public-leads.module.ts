import { Module } from '@nestjs/common';
import { PublicLeadsController } from './public-leads.controller';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * Module public (sans auth) pour recevoir les leads landing page.
 * PrismaService est fourni globalement (PrismaModule @Global).
 * NotificationsService est exporté par NotificationsModule.
 */
@Module({
  imports: [NotificationsModule],
  controllers: [PublicLeadsController],
})
export class PublicLeadsModule {}
