import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PdfModule } from '../pdf/pdf.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { DevisesModule } from '../devises/devises.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [NotificationsModule, PdfModule, WebhooksModule, DevisesModule, PushModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
