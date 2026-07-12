import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigAppController } from './config-app.controller';
import { ConfigAppService } from './config-app.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10_000,
      maxRedirects: 3,
    }),
    PrismaModule,
  ],
  controllers: [ConfigAppController],
  providers: [ConfigAppService],
  exports: [ConfigAppService],
})
export class ConfigAppModule {}
