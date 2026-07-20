import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationListener } from './listeners/notification.listener';
import { PaymentNotificationsListener } from './payment-notifications.listener';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationListener, PaymentNotificationsListener],
  exports: [NotificationsService],
})
export class NotificationsModule {}
