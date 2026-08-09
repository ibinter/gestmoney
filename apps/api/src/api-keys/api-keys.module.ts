import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { LicencesModule } from '../licences/licences.module';

@Module({
  imports: [PassportModule, LicencesModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, ApiKeyStrategy],
  exports: [ApiKeysService, ApiKeyStrategy],
})
export class ApiKeysModule {}
