import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LicencesModule } from '../licences/licences.module';

@Module({
  imports: [PrismaModule, LicencesModule],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
