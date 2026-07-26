import { Module } from '@nestjs/common';
import { TenantsAdminService } from './tenants.service';
import { TenantsAdminController } from './tenants.controller';
import { NotificationsModule } from '../../notifications/notifications.module';

/**
 * Module SuperAdmin — Gestion des tenants.
 * PrismaModule est @Global, aucun import nécessaire.
 */
@Module({
  imports: [NotificationsModule],
  controllers: [TenantsAdminController],
  providers: [TenantsAdminService],
  exports: [TenantsAdminService],
})
export class TenantsAdminModule {}
