import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { KycDossierController } from './kyc-dossier.controller';
import { KycDossierService } from './kyc-dossier.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KycController, KycDossierController],
  providers: [KycService, KycDossierService],
  exports: [KycService, KycDossierService],
})
export class KycModule {}
