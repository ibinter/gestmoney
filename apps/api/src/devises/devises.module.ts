import { Module } from '@nestjs/common';
import { DevisesController } from './devises.controller';
import { DevisesService } from './devises.service';

@Module({
  controllers: [DevisesController],
  providers: [DevisesService],
  exports: [DevisesService],
})
export class DevisesModule {}
