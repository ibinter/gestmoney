import { Module } from '@nestjs/common';
import { CommissionsController } from './commissions.controller';
import { CommissionsService } from './commissions.service';
import { CommissionListener } from './listeners/commission.listener';
import { LicencesModule } from '../licences/licences.module';

@Module({
  imports: [LicencesModule],
  controllers: [CommissionsController],
  providers: [CommissionsService, CommissionListener],
  exports: [CommissionsService],
})
export class CommissionsModule {}
