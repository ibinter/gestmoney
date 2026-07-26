import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { execSync } from 'child_process';

@Injectable()
export class BackupScheduler {
  private readonly logger = new Logger(BackupScheduler.name);

  @Cron('0 2 * * *') // 02:00 chaque nuit
  async sauvegarderBase() {
    try {
      const output = execSync('/opt/gestmoney/scripts/backup-db.sh', {
        stdio: 'pipe',
        env: { ...process.env },
      });
      this.logger.log(`Sauvegarde nocturne réussie : ${output.toString().trim()}`);
    } catch (err) {
      this.logger.error('Échec sauvegarde nocturne', err instanceof Error ? err.message : String(err));
    }
  }
}
