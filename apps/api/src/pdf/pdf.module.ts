import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DocumentVerificationModule } from '../document-verification/document-verification.module';
import { LicencesModule } from '../licences/licences.module';
import { PdfService } from './pdf.service';

@Module({
  imports: [PrismaModule, DocumentVerificationModule, LicencesModule],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
