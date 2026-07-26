import { Module } from '@nestjs/common';
import { BackupScheduler } from './backup.scheduler';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';

@Module({
  controllers: [BackupController],
  providers: [BackupService, BackupScheduler],
  exports: [BackupService],
})
export class BackupModule {}
