import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImportType, ImportReport, ImportRowError } from './import.dto';

// ── Templates ─────────────────────────────────────────────────────────────────
interface TemplateConfig {
  colonnes: string[];
  obligatoires: string[];
  modele: string;
  exemples: Record<string, string>[];
}

const TEMPLATES: Record<ImportType, TemplateConfig> = {
  [ImportType.CLIENTS]: {
    colonnes: ['nom', 'prenom', 'telephone', 'email', 'typeIdentite', 'numeroIdentite', 'adresse'],
    obligatoires: ['nom', 'telephone'],
    modele: 'clients_import_modele.xlsx',
    exemples: [
      { nom: 'KONÉ', prenom: 'Aminata', telephone: '+22507000001', email: 'aminata@exemple.ci', typeIdentite: 'CNI', numeroIdentite: 'CI-0001', adresse: 'Abidjan, Cocody' },
      { nom: 'DIALLO', prenom: 'Moussa', telephone: '+22507000002', email: '', typeIdentite: 'PASSEPORT', numeroIdentite: 'B-0001', adresse: 'Abidjan, Yopougon' },
    ],
  },
  [ImportType.AGENTS]: {
    colonnes: ['nom', 'prenom', 'telephone', 'email', 'agenceId', 'operateurs'],
    obligatoires: ['nom', 'telephone', 'agenceId'],
    modele: 'agents_import_modele.xlsx',
    exemples: [
      { nom: 'TRAORÉ', prenom: 'Ibrahim', telephone: '+22507100001', email: 'ibrahim@exemple.ci', agenceId: 'AGC-001', operateurs: 'MTN,ORANGE' },
      { nom: 'COULIBALY', prenom: 'Fatoumata', telephone: '+22507100002', email: '', agenceId: 'AGC-002', operateurs: 'MOOV' },
    ],
  },
  [ImportType.TRANSACTIONS]: {
    colonnes: ['type', 'montant', 'devise', 'clientId', 'agentId', 'reference', 'dateOperation'],
    obligatoires: ['type', 'montant', 'clientId'],
    modele: 'transactions_import_modele.xlsx',
    exemples: [
      { type: 'DEPOT', montant: '50000', devise: 'XOF', clientId: '+22507000001', agentId: 'AGT-001', reference: 'REF-001', dateOperation: '2024-01-15' },
      { type: 'RETRAIT', montant: '25000', devise: 'XOF', clientId: '+22507000002', agentId: 'AGT-002', reference: 'REF-002', dateOperation: '2024-01-15' },
    ],
  },
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo
const BATCH_SIZE = 100;

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Parsing ────────────────────────────────────────────────────────────────

  /**
   * Parse un buffer XLSX ou CSV et retourne un tableau de lignes (objets).
   * Lève une BadRequestException si le mimetype n'est pas supporté ou si
   * le fichier dépasse 5 Mo.
   */
  async parseFile(
    buffer: Buffer,
    mimetype: string,
  ): Promise<Record<string, string>[]> {
    if (buffer.length > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `Fichier trop volumineux (max 5 Mo, reçu ${(buffer.length / 1024 / 1024).toFixed(1)} Mo)`,
      );
    }

    const isXlsx =
      mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimetype === 'application/vnd.ms-excel' ||
      mimetype === 'application/octet-stream';
    const isCsv = mimetype === 'text/csv' || mimetype === 'text/plain';

    if (isXlsx) return this.parseXlsx(buffer);
    if (isCsv) return this.parseCsv(buffer.toString('utf-8'));

    // Tentative heuristique : si le buffer commence par PK (zip = xlsx)
    if (buffer[0] === 0x50 && buffer[1] === 0x4b) return this.parseXlsx(buffer);
    // Sinon on suppose CSV
    return this.parseCsv(buffer.toString('utf-8'));
  }

  private parseXlsx(buffer: Buffer): Record<string, string>[] {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const XLSX = require('xlsx') as typeof import('xlsx');
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) throw new BadRequestException('Le fichier XLSX est vide');
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
    return rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([k, v]) => [k, String(v ?? '')]),
      ),
    );
  }

  private parseCsv(text: string): Record<string, string>[] {
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const nonEmpty = lines.filter((l) => l.trim().length > 0);
    if (nonEmpty.length < 2) return [];

    const headers = nonEmpty[0].split(';').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < nonEmpty.length; i++) {
      const cells = nonEmpty[i].split(';').map((c) => c.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, j) => { row[h] = cells[j] ?? ''; });
      rows.push(row);
    }
    return rows;
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  valider(
    lignes: Record<string, string>[],
    type: ImportType,
  ): { valides: Record<string, string>[]; erreurs: ImportRowError[] } {
    const tpl = TEMPLATES[type];
    const erreurs: ImportRowError[] = [];
    const valides: Record<string, string>[] = [];

    lignes.forEach((ligne, idx) => {
      const numLigne = idx + 2; // +2 : ligne 1 = entête
      let ligneValide = true;

      // Vérification des colonnes obligatoires
      for (const col of tpl.obligatoires) {
        if (!ligne[col] || String(ligne[col]).trim() === '') {
          erreurs.push({ ligne: numLigne, colonne: col, message: `Champ obligatoire manquant : ${col}` });
          ligneValide = false;
        }
      }

      // Validations métier spécifiques
      if (type === ImportType.CLIENTS) {
        const tel = ligne.telephone?.trim();
        if (tel && !/^\+?[\d\s\-()]{8,15}$/.test(tel)) {
          erreurs.push({ ligne: numLigne, colonne: 'telephone', message: `Numéro de téléphone invalide : ${tel}` });
          ligneValide = false;
        }
      }

      if (type === ImportType.TRANSACTIONS) {
        const montant = parseFloat(ligne.montant);
        if (isNaN(montant) || montant <= 0) {
          erreurs.push({ ligne: numLigne, colonne: 'montant', message: `Montant invalide : ${ligne.montant}` });
          ligneValide = false;
        }
        const typesValides = ['DEPOT', 'RETRAIT', 'TRANSFERT', 'PAIEMENT'];
        if (ligne.type && !typesValides.includes(ligne.type.toUpperCase())) {
          erreurs.push({ ligne: numLigne, colonne: 'type', message: `Type de transaction invalide : ${ligne.type} (attendu : ${typesValides.join(', ')})` });
          ligneValide = false;
        }
      }

      if (ligneValide) valides.push(ligne);
    });

    return { valides, erreurs };
  }

  // ── Import en base ─────────────────────────────────────────────────────────

  async importer(
    lignes: Record<string, string>[],
    type: ImportType,
    tenantId: string,
    userId: string,
  ): Promise<{ importees: number; erreurs: ImportRowError[] }> {
    const erreurs: ImportRowError[] = [];
    let importees = 0;

    // Traitement par batch
    for (let i = 0; i < lignes.length; i += BATCH_SIZE) {
      const batch = lignes.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((ligne, j) =>
          this.insererLigne(ligne, type, tenantId, userId, i + j + 2),
        ),
      );

      results.forEach((r, j) => {
        if (r.status === 'fulfilled') {
          importees++;
        } else {
          const numLigne = i + j + 2;
          const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
          erreurs.push({ ligne: numLigne, colonne: '-', message: msg });
        }
      });
    }

    return { importees, erreurs };
  }

  private async insererLigne(
    ligne: Record<string, string>,
    type: ImportType,
    tenantId: string,
    _userId: string,
    _numLigne: number,
  ): Promise<void> {
    switch (type) {
      case ImportType.CLIENTS:
        await this.prisma.customer.upsert({
          where: { tenantId_phoneNumber: { tenantId, phoneNumber: ligne.telephone.trim() } },
          update: {
            firstName: ligne.prenom?.trim() || undefined,
            lastName: ligne.nom?.trim() || undefined,
            email: ligne.email?.trim() || undefined,
            nationalId: ligne.numeroIdentite?.trim() || undefined,
            address: ligne.adresse?.trim() || undefined,
          },
          create: {
            tenantId,
            phoneNumber: ligne.telephone.trim(),
            firstName: ligne.prenom?.trim() || undefined,
            lastName: ligne.nom?.trim() || undefined,
            email: ligne.email?.trim() || undefined,
            nationalId: ligne.numeroIdentite?.trim() || undefined,
            address: ligne.adresse?.trim() || undefined,
          },
        });
        break;

      case ImportType.AGENTS: {
        // Pour les agents, on cherche l'agence par son code
        const agenceId = ligne.agenceId?.trim();
        const agency = await this.prisma.agency.findFirst({
          where: { tenantId, OR: [{ id: agenceId }, { code: agenceId }] },
        });
        if (!agency) throw new Error(`Agence introuvable : ${agenceId}`);

        // Cherche un User existant par téléphone ou en crée un stub
        const existingUser = await this.prisma.user.findFirst({
          where: { tenantId, phone: ligne.telephone.trim() },
        });
        if (!existingUser) {
          throw new Error(
            `Aucun utilisateur trouvé avec le téléphone ${ligne.telephone} — créez d'abord le compte utilisateur`,
          );
        }
        // Upsert Agent
        const agentCode = `AGT-${ligne.telephone.replace(/\D/g, '').slice(-6)}`;
        await this.prisma.agent.upsert({
          where: { userId: existingUser.id },
          update: { agencyId: agency.id },
          create: {
            tenantId,
            agencyId: agency.id,
            userId: existingUser.id,
            agentCode,
            phoneNumber: ligne.telephone.trim(),
            nationalId: ligne.numeroIdentite?.trim() || 'N/A',
            address: ligne.adresse?.trim() || 'N/A',
          },
        });
        break;
      }

      case ImportType.TRANSACTIONS: {
        // Import de transactions historiques — on crée des enregistrements COMPLETED
        const agentId = ligne.agentId?.trim();
        const agent = agentId
          ? await this.prisma.agent.findFirst({
              where: { tenantId, OR: [{ id: agentId }, { agentCode: agentId }] },
            })
          : null;
        if (!agent) throw new Error(`Agent introuvable : ${agentId || '(non fourni)'}`);

        const montant = parseFloat(ligne.montant);
        const txType = ligne.type.toUpperCase();
        const devise = ligne.devise?.trim() || 'XOF';
        const reference = ligne.reference?.trim() || `IMP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

        const existing = await this.prisma.transaction.findFirst({
          where: { tenantId, reference },
        });
        if (existing) return; // doublon — on ignore silencieusement

        await this.prisma.transaction.create({
          data: {
            tenantId,
            reference,
            type: txType as any,
            status: 'COMPLETED' as any,
            amount: montant,
            netAmount: montant,
            currency: devise,
            operatorCode: agent.agentCode,
            agentId: agent.id,
            agencyId: agent.agencyId,
            networkId: (await this.prisma.agency.findUnique({ where: { id: agent.agencyId } }))!.networkId,
            senderPhone: ligne.clientId?.trim(),
            completedAt: ligne.dateOperation ? new Date(ligne.dateOperation) : new Date(),
          },
        });
        break;
      }
    }
  }

  // ── Génération de modèle XLSX ──────────────────────────────────────────────

  genererModele(type: ImportType): Buffer {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const XLSX = require('xlsx') as typeof import('xlsx');
    const tpl = TEMPLATES[type];
    const data = [tpl.colonnes, ...tpl.exemples.map((ex) => tpl.colonnes.map((c) => ex[c] ?? ''))];
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Mise en forme largeur colonnes
    ws['!cols'] = tpl.colonnes.map(() => ({ wch: 22 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import');
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  // ── Point d'entrée principal ───────────────────────────────────────────────

  async traiterFichier(
    buffer: Buffer,
    mimetype: string,
    type: ImportType,
    tenantId: string,
    userId: string,
  ): Promise<ImportReport> {
    const debut = Date.now();

    const lignesBrutes = await this.parseFile(buffer, mimetype);
    if (lignesBrutes.length === 0) {
      throw new BadRequestException('Le fichier est vide ou ne contient aucune ligne de données');
    }

    const { valides, erreurs: erreursValidation } = this.valider(lignesBrutes, type);
    const { importees, erreurs: erreursInsertion } = await this.importer(valides, type, tenantId, userId);

    const allErreurs = [...erreursValidation, ...erreursInsertion];

    this.logger.log(
      `Import ${type} — tenant=${tenantId} — ${lignesBrutes.length} lignes, ${importees} importées, ${allErreurs.length} erreurs`,
    );

    return {
      type,
      total: lignesBrutes.length,
      importees,
      erreurs: allErreurs.length,
      details: allErreurs,
      dureeMs: Date.now() - debut,
    };
  }
}
