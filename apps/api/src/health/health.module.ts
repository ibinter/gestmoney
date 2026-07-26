import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { StatusController } from './status.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    TerminusModule,
    PrismaModule,
  ],
  controllers: [HealthController, StatusController],
})
export class HealthModule {}
