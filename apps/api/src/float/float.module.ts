import { Module } from '@nestjs/common';
import { FloatController } from './float.controller';
import { FloatService } from './float.service';
import { FloatListener } from './listeners/float.listener';
import { AlertesModule } from '../alertes/alertes.module';

@Module({
  imports: [AlertesModule],
  controllers: [FloatController],
  providers: [FloatService, FloatListener],
  exports: [FloatService],
})
export class FloatModule {}
