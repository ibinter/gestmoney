import { Module } from '@nestjs/common';
import { AlertesController } from './alertes.controller';
import { AlertesService } from './alertes.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [NotificationsModule, PushModule],
  controllers: [AlertesController],
  providers: [AlertesService],
  exports: [AlertesService],
})
export class AlertesModule {}
