import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PdfModule } from '../pdf/pdf.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LicencesModule } from '../licences/licences.module';

@Module({
  imports: [PdfModule, NotificationsModule, LicencesModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
