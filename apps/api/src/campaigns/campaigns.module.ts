import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * Module CRM Campagnes Email — relance prospects et abonnés.
 * PrismaService est fourni globalement (PrismaModule @Global).
 * ScheduleModule est enregistré globalement dans AppModule.
 */
@Module({
  imports: [NotificationsModule],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
