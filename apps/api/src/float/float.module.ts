import { Module } from '@nestjs/common';
import { FloatController } from './float.controller';
import { FloatService } from './float.service';
import { FloatListener } from './listeners/float.listener';

@Module({
  controllers: [FloatController],
  providers: [FloatService, FloatListener],
  exports: [FloatService],
})
export class FloatModule {}
