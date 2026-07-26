import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * Module Support — tickets d'assistance de l'utilisateur courant.
 * PrismaService est fourni globalement (PrismaModule @Global).
 */
@Module({
  imports: [NotificationsModule],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
