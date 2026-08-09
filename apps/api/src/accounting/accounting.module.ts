import { Module } from '@nestjs/common';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { AccountingListener } from './listeners/accounting.listener';
import { PdfModule } from '../pdf/pdf.module';
import { LicencesModule } from '../licences/licences.module';

/**
 * Module Comptabilité SYSCOHADA pour GESTMONEY
 *
 * Fournit:
 * - Plan comptable SYSCOHADA (50+ comptes Classes 1-7)
 * - Journal comptable en partie double obligatoire
 * - États financiers: bilan, compte de résultat, flux de trésorerie
 * - Balance de vérification (débit = crédit)
 * - Exercices fiscaux avec clôture automatisée
 * - Génération automatique d'écritures depuis transactions Mobile Money
 * - Rapprochement bancaire
 *
 * Le PrismaModule est @Global() — pas besoin de l'importer ici.
 * EventEmitterModule est @Global() — le listener est câblé automatiquement.
 */
@Module({
  imports: [PdfModule, LicencesModule],
  controllers: [AccountingController],
  providers: [AccountingService, AccountingListener],
  exports: [AccountingService],
})
export class AccountingModule {}
