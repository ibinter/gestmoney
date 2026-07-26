import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const BACKUP_DIR = '/opt/gestmoney/backups';

export interface BackupFileInfo {
  nom: string;
  taille: string;
  tailleOctets: number;
  date: Date;
  chemin: string;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  listeBackups(): { backups: BackupFileInfo[]; total: number } {
    if (!fs.existsSync(BACKUP_DIR)) {
      return { backups: [], total: 0 };
    }

    const fichiers = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith('.sql.gz'))
      .map((nom) => {
        const chemin = path.join(BACKUP_DIR, nom);
        const stat = fs.statSync(chemin);
        const tailleOctets = stat.size;
        return {
          nom,
          taille: this.formaterTaille(tailleOctets),
          tailleOctets,
          date: stat.mtime,
          chemin,
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    return { backups: fichiers, total: fichiers.length };
  }

  declencherBackup(): { message: string; fichier?: string } {
    try {
      const output = execSync('/opt/gestmoney/scripts/backup-db.sh', {
        stdio: 'pipe',
        env: { ...process.env },
        timeout: 300_000, // 5 minutes max
      });
      const message = output.toString().trim();
      this.logger.log(`Sauvegarde manuelle déclenchée : ${message}`);
      return { message: 'Sauvegarde créée avec succès', fichier: message };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Échec sauvegarde manuelle : ${msg}`);
      throw new InternalServerErrorException(`Échec de la sauvegarde : ${msg}`);
    }
  }

  private formaterTaille(octets: number): string {
    if (octets < 1024) return `${octets} o`;
    if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`;
    return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
  }
}
