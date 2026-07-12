import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJournalEntryDto } from './dto/journal-entry.dto';
import { QueryLedgerDto } from './dto/query-ledger.dto';
import { CreateFiscalYearDto } from './dto/fiscal-year.dto';
import { ReconcileDto, CreateChartOfAccountDto, AutoEntryDto } from './dto/reconcile.dto';
import {
  IFiscalYear,
  IJournalEntry,
  ITrialBalance,
  IIncomeStatement,
  IBalanceSheet,
  ICashFlow,
  TrialBalanceLine,
} from './interfaces/accounting.interface';
import { ITransaction } from '../transactions/interfaces/transaction.interface';
import {
  SYSCOHADA_CHART_OF_ACCOUNTS,
  OPERATOR_FLOAT_ACCOUNT,
  SeedAccount,
} from './seeds/chart-of-accounts.seed';

// ─── Mapping types SYSCOHADA → AccountType Prisma ────────────────────────────

const SYSCOHADA_TO_PRISMA_TYPE: Record<string, string> = {
  ACTIF: 'ASSET',
  PASSIF: 'LIABILITY',
  CAPITAL: 'EQUITY',
  PRODUIT: 'REVENUE',
  CHARGE: 'EXPENSE',
  TRESORERIE: 'ASSET',
  TIERS: 'LIABILITY',
};

// ─── Helpers arithmétique Decimal-safe ───────────────────────────────────────

function toF(v: string | number | null | undefined): number {
  return parseFloat(String(v ?? '0')) || 0;
}

function addStr(a: string, b: string | number): string {
  return (toF(a) + toF(b)).toFixed(2);
}

function subStr(a: string, b: string | number): string {
  return (toF(a) - toF(b)).toFixed(2);
}

function toStr(n: number | string): string {
  return toF(n).toFixed(2);
}

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Plan comptable ──────────────────────────────────────────────────────────

  async getChartOfAccounts(tenantId: string): Promise<any[]> {
    return this.prisma.accountChart.findMany({
      where: { tenantId, isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  async createAccount(
    dto: CreateChartOfAccountDto,
    tenantId: string,
  ): Promise<any> {
    const existing = await this.prisma.accountChart.findFirst({
      where: { tenantId, code: dto.accountNumber },
    });
    if (existing) {
      throw new BadRequestException(`Le compte ${dto.accountNumber} existe déjà`);
    }

    // Résoudre le parent si fourni
    let parentId: string | undefined;
    if (dto.parentAccountNumber) {
      const parent = await this.prisma.accountChart.findFirst({
        where: { tenantId, code: dto.parentAccountNumber },
      });
      if (parent) parentId = parent.id;
    }

    const prismaType = SYSCOHADA_TO_PRISMA_TYPE[dto.type] ?? 'ASSET';
    const level = dto.accountNumber.length <= 2 ? 1 : dto.accountNumber.length <= 3 ? 2 : 3;

    return this.prisma.accountChart.create({
      data: {
        tenantId,
        code: dto.accountNumber,
        name: dto.label,
        type: prismaType as any,
        parentId,
        isActive: true,
        normalBalance: ['EXPENSE', 'ASSET'].includes(prismaType) ? 'DEBIT' : 'CREDIT',
        level,
      },
    });
  }

  async seedChartOfAccounts(tenantId: string): Promise<void> {
    this.logger.log(`Initialisation plan comptable SYSCOHADA pour tenant ${tenantId}`);

    // Créer d'abord les comptes racines (sans parent)
    const roots = SYSCOHADA_CHART_OF_ACCOUNTS.filter((a) => !a.parentAccountNumber);
    const withParent = SYSCOHADA_CHART_OF_ACCOUNTS.filter((a) => a.parentAccountNumber);

    for (const account of [...roots, ...withParent]) {
      await this._upsertAccount(tenantId, account);
    }

    this.logger.log(
      `Plan comptable SYSCOHADA initialisé: ${SYSCOHADA_CHART_OF_ACCOUNTS.length} comptes`,
    );
  }

  private async _upsertAccount(tenantId: string, account: SeedAccount): Promise<void> {
    const existing = await this.prisma.accountChart.findFirst({
      where: { tenantId, code: account.accountNumber },
    });
    if (existing) return;

    let parentId: string | undefined;
    if (account.parentAccountNumber) {
      const parent = await this.prisma.accountChart.findFirst({
        where: { tenantId, code: account.parentAccountNumber },
      });
      if (parent) parentId = parent.id;
    }

    const prismaType = SYSCOHADA_TO_PRISMA_TYPE[account.type] ?? 'ASSET';
    const level = account.accountNumber.length <= 2 ? 1 : account.accountNumber.length <= 3 ? 2 : 3;

    await this.prisma.accountChart.create({
      data: {
        tenantId,
        code: account.accountNumber,
        name: account.label,
        type: prismaType as any,
        parentId,
        isActive: true,
        normalBalance: ['EXPENSE', 'ASSET'].includes(prismaType) ? 'DEBIT' : 'CREDIT',
        level,
      },
    });
  }

  // ─── Exercice fiscal ─────────────────────────────────────────────────────────

  async getFiscalYears(tenantId: string): Promise<IFiscalYear[]> {
    const years = await this.prisma.fiscalYear.findMany({
      where: { tenantId },
      orderBy: { startDate: 'desc' },
    });
    return years.map(this._mapFiscalYear);
  }

  async createFiscalYear(
    dto: CreateFiscalYearDto,
    tenantId: string,
    userId: string,
  ): Promise<IFiscalYear> {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (start >= end) {
      throw new BadRequestException(
        'La date de début doit être antérieure à la date de fin',
      );
    }

    const overlap = await this.prisma.fiscalYear.findFirst({
      where: {
        tenantId,
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });
    if (overlap) {
      throw new BadRequestException(
        `L'exercice chevauche un exercice existant: ${(overlap as any).name}`,
      );
    }

    const fy = await this.prisma.fiscalYear.create({
      data: {
        tenantId,
        name: dto.label,
        startDate: start,
        endDate: end,
        isClosed: false,
        closedById: null,
      },
    });

    await this._auditLog(tenantId, userId, 'CREATE', 'FiscalYear', fy.id);

    return this._mapFiscalYear(fy);
  }

  async closeFiscalYear(
    fiscalYearId: string,
    tenantId: string,
    userId: string,
  ): Promise<IFiscalYear> {
    const fy = await this.prisma.fiscalYear.findFirst({
      where: { id: fiscalYearId, tenantId },
    });
    if (!fy) throw new NotFoundException(`Exercice fiscal ${fiscalYearId} introuvable`);
    if ((fy as any).isClosed) {
      throw new BadRequestException('Cet exercice est déjà clôturé');
    }

    // Vérifier équilibre avant clôture
    const trial = await this.getTrialBalance(tenantId, fiscalYearId);
    if (!trial.isBalanced) {
      throw new BadRequestException(
        `Impossible de clôturer: balance déséquilibrée (débit: ${trial.totalDebit}, crédit: ${trial.totalCredit})`,
      );
    }

    // Générer écriture de report à nouveau
    const incomeStmt = await this.getIncomeStatement(tenantId, { fiscalYearId });
    const resultatNet = toF(incomeStmt.resultatNet);

    if (Math.abs(resultatNet) > 0.01) {
      await this._generateClotureEntry(
        tenantId,
        userId,
        fiscalYearId,
        resultatNet,
        (fy as any).name,
        (fy as any).endDate,
      );
    }

    const updated = await this.prisma.fiscalYear.update({
      where: { id: fiscalYearId },
      data: { isClosed: true, closedAt: new Date(), closedById: userId },
    });

    await this._auditLog(tenantId, userId, 'UPDATE', 'FiscalYear', fiscalYearId);
    this.logger.log(`Exercice fiscal clôturé: ${(fy as any).name}`);

    return this._mapFiscalYear(updated);
  }

  private async _generateClotureEntry(
    tenantId: string,
    userId: string,
    fiscalYearId: string,
    resultatNet: number,
    fyName: string,
    endDate: Date,
  ): Promise<void> {
    const isProfit = resultatNet > 0;
    const absAmount = Math.abs(resultatNet).toFixed(2);

    // Trouver les comptes de report à nouveau
    const compte120 = await this.prisma.accountChart.findFirst({
      where: { tenantId, code: '120' },
    });
    const compte129 = await this.prisma.accountChart.findFirst({
      where: { tenantId, code: '129' },
    });
    const compte706 = await this.prisma.accountChart.findFirst({
      where: { tenantId, code: '706' },
    });
    const compte627 = await this.prisma.accountChart.findFirst({
      where: { tenantId, code: '627' },
    });

    if (!compte120 || !compte129 || !compte706 || !compte627) {
      this.logger.warn('Comptes de report introuvables — écriture de clôture non générée');
      return;
    }

    const resultAccount = isProfit ? compte120 : compte129;
    const counterAccount = isProfit ? compte706 : compte627;

    const dto: CreateJournalEntryDto = {
      date: endDate.toISOString().slice(0, 10),
      reference: `CLOTURE-${fiscalYearId.slice(0, 8)}`,
      description: `Clôture exercice ${fyName} — Report à nouveau`,
      fiscalYearId,
      lines: isProfit
        ? [
            { accountNumber: compte706.code, label: 'Solde créditeur produits', debit: absAmount, credit: '0.00' },
            { accountNumber: compte120.code, label: 'Résultat net — bénéfice (RAN)', debit: '0.00', credit: absAmount },
          ]
        : [
            { accountNumber: compte129.code, label: 'Résultat net — perte (RAN)', debit: absAmount, credit: '0.00' },
            { accountNumber: compte627.code, label: 'Solde débiteur charges', debit: '0.00', credit: absAmount },
          ],
    };

    await this.createJournalEntry(dto, tenantId, userId, true);
  }

  // ─── Journal comptable ───────────────────────────────────────────────────────

  async createJournalEntry(
    dto: CreateJournalEntryDto,
    tenantId: string,
    userId: string,
    isAutoGenerated = false,
  ): Promise<IJournalEntry> {
    // Vérifier exercice ouvert
    const fy = await this.prisma.fiscalYear.findFirst({
      where: { id: dto.fiscalYearId, tenantId, isClosed: false },
    });
    if (!fy) {
      throw new NotFoundException(
        `Exercice fiscal ${dto.fiscalYearId} introuvable ou clôturé`,
      );
    }

    // Valider la partie double
    await this.validateDoubleEntry(dto.lines);

    // Résoudre les accountIds depuis les codes SYSCOHADA
    const accountCodes = [...new Set(dto.lines.map((l) => l.accountNumber))];
    const accounts = await this.prisma.accountChart.findMany({
      where: { tenantId, code: { in: accountCodes }, isActive: true },
    });
    const accountMap = new Map(accounts.map((a) => [(a as any).code, a]));

    for (const line of dto.lines) {
      if (!accountMap.has(line.accountNumber)) {
        throw new BadRequestException(
          `Compte ${line.accountNumber} introuvable ou inactif dans le plan comptable`,
        );
      }
    }

    // Vérifier unicité référence
    const existingRef = await this.prisma.journalEntry.findFirst({
      where: { tenantId, reference: dto.reference },
    });
    if (existingRef) {
      throw new BadRequestException(`La référence ${dto.reference} existe déjà`);
    }

    // Calculer totaux
    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of dto.lines) {
      totalDebit += toF(line.debit);
      totalCredit += toF(line.credit);
    }

    const entry = await this.prisma.$transaction(async (tx) => {
      const resolvedUserId = userId === 'SYSTEM'
        ? await this._getOrCreateSystemUser(tenantId)
        : userId;

      // Stocker les métadonnées supplémentaires dans le champ description étendu
      // car le schéma JournalEntry ne supporte pas transactionId/agentId directement
      const metaSuffix = dto.transactionId ? ` [txn:${dto.transactionId}]` : '';

      const created = await tx.journalEntry.create({
        data: {
          tenantId,
          reference: dto.reference,
          description: dto.description + metaSuffix,
          status: 'DRAFT',
          totalDebit: totalDebit,
          totalCredit: totalCredit,
          currency: 'XOF',
          entryDate: new Date(dto.date),
          fiscalYearId: dto.fiscalYearId,
          createdById: resolvedUserId,
          lines: {
            create: dto.lines.map((line) => {
              const acct = accountMap.get(line.accountNumber)!;
              return {
                accountId: (acct as any).id,
                description: line.label,
                debit: toF(line.debit),
                credit: toF(line.credit),
                currency: line.currency ?? 'XOF',
              };
            }),
          },
        },
        include: { lines: { include: { account: true } } },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId: userId === 'SYSTEM' ? null : userId,
          action: 'CREATE',
          resource: 'JournalEntry',
          resourceId: created.id,
          newValues: {
            reference: dto.reference,
            description: dto.description,
            isAutoGenerated,
            linesCount: dto.lines.length,
            totalDebit,
            totalCredit,
          } as any,
        },
      });

      return created;
    });

    this.logger.log(
      `Écriture comptable: ${dto.reference} | ${dto.lines.length} lignes | auto=${isAutoGenerated}`,
    );

    return this._mapJournalEntry(entry);
  }

  async getJournal(
    query: QueryLedgerDto,
    tenantId: string,
  ): Promise<{ data: IJournalEntry[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, accountNumber, startDate, endDate, fiscalYearId } = query;

    const where: any = { tenantId };
    if (fiscalYearId) where.fiscalYearId = fiscalYearId;
    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) where.entryDate.gte = new Date(startDate);
      if (endDate) where.entryDate.lte = new Date(endDate);
    }
    if (accountNumber) {
      where.lines = { some: { account: { code: { startsWith: accountNumber } } } };
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { entryDate: 'desc' },
        include: { lines: { include: { account: true } } },
      }),
      this.prisma.journalEntry.count({ where }),
    ]);

    return {
      data: data.map(this._mapJournalEntry),
      total,
      page,
      limit,
    };
  }

  async getJournalEntry(id: string, tenantId: string): Promise<IJournalEntry> {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, tenantId },
      include: { lines: { include: { account: true } } },
    });
    if (!entry) throw new NotFoundException(`Écriture ${id} introuvable`);
    return this._mapJournalEntry(entry);
  }

  // ─── Grand livre d'un compte ──────────────────────────────────────────────────

  async getLedgerAccount(
    accountNumber: string,
    tenantId: string,
    query: QueryLedgerDto,
  ): Promise<any> {
    const account = await this.prisma.accountChart.findFirst({
      where: { tenantId, code: accountNumber },
    });
    if (!account) throw new NotFoundException(`Compte ${accountNumber} introuvable`);

    const lineWhere: any = { accountId: account.id };
    const journalWhere: any = { tenantId };
    if (query.fiscalYearId) journalWhere.fiscalYearId = query.fiscalYearId;
    if (query.startDate || query.endDate) {
      journalWhere.entryDate = {};
      if (query.startDate) journalWhere.entryDate.gte = new Date(query.startDate);
      if (query.endDate) journalWhere.entryDate.lte = new Date(query.endDate);
    }
    lineWhere.journalEntry = journalWhere;

    const lines = await this.prisma.journalLine.findMany({
      where: lineWhere,
      include: {
        journalEntry: {
          select: { entryDate: true, reference: true, description: true, status: true },
        },
      },
      orderBy: { journalEntry: { entryDate: 'asc' } },
    });

    let totalDebit = '0.00';
    let totalCredit = '0.00';
    for (const l of lines) {
      totalDebit = addStr(totalDebit, (l as any).debit);
      totalCredit = addStr(totalCredit, (l as any).credit);
    }

    return {
      account,
      entries: lines,
      totalDebit,
      totalCredit,
      balance: subStr(totalDebit, totalCredit),
    };
  }

  // ─── Balance de vérification ──────────────────────────────────────────────────

  async getTrialBalance(
    tenantId: string,
    fiscalYearId?: string,
  ): Promise<ITrialBalance> {
    const journalWhere: any = { tenantId };
    if (fiscalYearId) journalWhere.fiscalYearId = fiscalYearId;

    const lines = await this.prisma.journalLine.findMany({
      where: { journalEntry: journalWhere },
      include: { account: true },
    });

    const accountMap = new Map<string, {
      code: string;
      name: string;
      type: string;
      debit: number;
      credit: number;
    }>();

    for (const line of lines) {
      const acct = (line as any).account;
      const key = acct.id;
      if (!accountMap.has(key)) {
        accountMap.set(key, {
          code: acct.code,
          name: acct.name,
          type: acct.type,
          debit: 0,
          credit: 0,
        });
      }
      const entry = accountMap.get(key)!;
      entry.debit += toF((line as any).debit);
      entry.credit += toF((line as any).credit);
    }

    const trialLines: TrialBalanceLine[] = Array.from(accountMap.values())
      .sort((a, b) => a.code.localeCompare(b.code))
      .map(({ code, name, type, debit, credit }) => {
        const balance = debit - credit;
        return {
          accountNumber: code,
          label: name,
          type: this._prismaTypeToSysco(type) as any,
          totalDebit: debit.toFixed(2),
          totalCredit: credit.toFixed(2),
          balance: Math.abs(balance).toFixed(2),
          balanceType: balance >= 0 ? 'DEBITEUR' : 'CREDITEUR',
        };
      });

    let totalDebit = 0;
    let totalCredit = 0;
    for (const l of trialLines) {
      totalDebit += toF(l.totalDebit);
      totalCredit += toF(l.totalCredit);
    }

    return {
      fiscalYearId: fiscalYearId ?? 'ALL',
      asOfDate: new Date(),
      lines: trialLines,
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCredit.toFixed(2),
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  }

  // ─── Compte de résultat ───────────────────────────────────────────────────────

  async getIncomeStatement(
    tenantId: string,
    params: { fiscalYearId?: string; startDate?: string; endDate?: string },
  ): Promise<IIncomeStatement> {
    const { fiscalYearId, startDate, endDate } = params;

    const journalWhere: any = { tenantId };
    if (fiscalYearId) journalWhere.fiscalYearId = fiscalYearId;
    if (startDate || endDate) {
      journalWhere.entryDate = {};
      if (startDate) journalWhere.entryDate.gte = new Date(startDate);
      if (endDate) journalWhere.entryDate.lte = new Date(endDate);
    }

    const lines = await this.prisma.journalLine.findMany({
      where: {
        journalEntry: journalWhere,
        OR: [
          { account: { code: { startsWith: '6' } } },
          { account: { code: { startsWith: '7' } } },
        ],
      },
      include: { account: true },
    });

    const chargeMap = new Map<string, { name: string; amount: number }>();
    const produitMap = new Map<string, { name: string; amount: number }>();

    for (const line of lines) {
      const acct = (line as any).account;
      if (acct.code.startsWith('6')) {
        const cur = chargeMap.get(acct.code) ?? { name: acct.name, amount: 0 };
        cur.amount += toF((line as any).debit) - toF((line as any).credit);
        chargeMap.set(acct.code, cur);
      } else if (acct.code.startsWith('7')) {
        const cur = produitMap.get(acct.code) ?? { name: acct.name, amount: 0 };
        cur.amount += toF((line as any).credit) - toF((line as any).debit);
        produitMap.set(acct.code, cur);
      }
    }

    const charges = Array.from(chargeMap.entries())
      .filter(([, v]) => v.amount > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, { name, amount }]) => ({
        accountNumber: code,
        label: name,
        montant: amount.toFixed(2),
      }));

    const produits = Array.from(produitMap.entries())
      .filter(([, v]) => v.amount > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, { name, amount }]) => ({
        accountNumber: code,
        label: name,
        montant: amount.toFixed(2),
      }));

    const totalCharges = charges.reduce((s, c) => s + toF(c.montant), 0);
    const totalProduits = produits.reduce((s, p) => s + toF(p.montant), 0);
    const resultatNet = totalProduits - totalCharges;

    let period = { startDate: new Date(), endDate: new Date() };
    if (fiscalYearId) {
      const fy = await this.prisma.fiscalYear.findUnique({ where: { id: fiscalYearId } });
      if (fy) period = { startDate: (fy as any).startDate, endDate: (fy as any).endDate };
    }

    return {
      fiscalYearId: fiscalYearId ?? 'ALL',
      period,
      produits,
      charges,
      totalProduits: totalProduits.toFixed(2),
      totalCharges: totalCharges.toFixed(2),
      resultatNet: resultatNet.toFixed(2),
    };
  }

  // ─── Bilan ────────────────────────────────────────────────────────────────────

  async getBalanceSheet(
    tenantId: string,
    asOfDate?: string,
    fiscalYearId?: string,
  ): Promise<IBalanceSheet> {
    const dateLimit = asOfDate ? new Date(asOfDate) : new Date();

    const journalWhere: any = { tenantId, entryDate: { lte: dateLimit } };
    if (fiscalYearId) journalWhere.fiscalYearId = fiscalYearId;

    const lines = await this.prisma.journalLine.findMany({
      where: { journalEntry: journalWhere },
      include: { account: true },
    });

    const balances = new Map<string, { code: string; name: string; type: string; net: number }>();

    for (const line of lines) {
      const acct = (line as any).account;
      const cur = balances.get(acct.id) ?? { code: acct.code, name: acct.name, type: acct.type, net: 0 };
      cur.net += toF((line as any).debit) - toF((line as any).credit);
      balances.set(acct.id, cur);
    }

    const filterItems = (codePrefix: string[], assetSide: boolean) =>
      Array.from(balances.values())
        .filter(({ code }) => codePrefix.some((p) => code.startsWith(p)))
        .filter(({ net }) => Math.abs(net) > 0.01)
        .map(({ code, name, net }) => ({
          accountNumber: code,
          label: name,
          montant: (assetSide ? net : -net).toFixed(2),
        }))
        .filter(({ montant }) => toF(montant) > 0)
        .sort((a, b) => a.accountNumber.localeCompare(b.accountNumber));

    const immobilisations = filterItems(['2'], true);
    const stocks = filterItems(['3'], true);
    const creances = filterItems(['4'], true);
    const tresorerie = filterItems(['5'], true);
    const capitaux = filterItems(['1'], false);
    const dettes = filterItems(['40', '41', '42', '44', '46', '47'], false);

    const sumItems = (items: Array<{ montant: string }>) =>
      items.reduce((s, i) => s + toF(i.montant), 0).toFixed(2);

    const totalActif = (
      toF(sumItems(immobilisations)) +
      toF(sumItems(stocks)) +
      toF(sumItems(creances)) +
      toF(sumItems(tresorerie))
    ).toFixed(2);

    const totalPassif = (
      toF(sumItems(capitaux)) + toF(sumItems(dettes))
    ).toFixed(2);

    const difference = subStr(totalActif, totalPassif);

    return {
      fiscalYearId: fiscalYearId ?? 'ALL',
      asOfDate: dateLimit,
      actif: { immobilisations, stocks, creances, tresorerie, totalActif },
      passif: { capitaux, dettes, totalPassif },
      isBalanced: Math.abs(toF(difference)) < 0.01,
      difference,
    };
  }

  // ─── Flux de trésorerie ───────────────────────────────────────────────────────

  async getCashFlow(
    tenantId: string,
    params: { fiscalYearId?: string; startDate?: string; endDate?: string },
  ): Promise<ICashFlow> {
    const { fiscalYearId, startDate, endDate } = params;

    let period = {
      startDate: new Date(new Date().getFullYear(), 0, 1),
      endDate: new Date(),
    };

    if (fiscalYearId) {
      const fy = await this.prisma.fiscalYear.findUnique({ where: { id: fiscalYearId } });
      if (fy) period = { startDate: (fy as any).startDate, endDate: (fy as any).endDate };
    } else {
      if (startDate) period.startDate = new Date(startDate);
      if (endDate) period.endDate = new Date(endDate);
    }

    const journalWhere: any = {
      tenantId,
      entryDate: { gte: period.startDate, lte: period.endDate },
    };
    if (fiscalYearId) journalWhere.fiscalYearId = fiscalYearId;

    const buildActivities = async (codePrefixes: string[], creditFirst = false) => {
      const lines = await this.prisma.journalLine.findMany({
        where: {
          journalEntry: journalWhere,
          OR: codePrefixes.map((p) => ({ account: { code: { startsWith: p } } })),
        },
        include: { account: true },
      });

      let totalDebit = 0;
      let totalCredit = 0;
      const activities: Array<{ label: string; montant: string }> = [];

      for (const line of lines) {
        const d = toF((line as any).debit);
        const c = toF((line as any).credit);
        totalDebit += d;
        totalCredit += c;
        const net = creditFirst ? c - d : d - c;
        if (Math.abs(net) > 0.01) {
          activities.push({ label: (line as any).description ?? '', montant: net.toFixed(2) });
        }
      }

      return { activities, debit: totalDebit, credit: totalCredit };
    };

    const ops = await buildActivities(['5']);
    const inv = await buildActivities(['2']);
    const fin = await buildActivities(['10', '16'], true);

    const netOps = (ops.debit - ops.credit).toFixed(2);
    const netInv = (inv.debit - inv.credit).toFixed(2);
    const netFin = (fin.credit - fin.debit).toFixed(2);
    const netVariation = (toF(netOps) + toF(netInv) + toF(netFin)).toFixed(2);

    return {
      fiscalYearId: fiscalYearId ?? 'ALL',
      period,
      operatingActivities: ops.activities,
      investingActivities: inv.activities,
      financingActivities: fin.activities,
      netCashFromOperations: netOps,
      netCashFromInvesting: netInv,
      netCashFromFinancing: netFin,
      netCashVariation: netVariation,
      openingCash: '0.00',
      closingCash: netVariation,
    };
  }

  // ─── Génération automatique d'écriture depuis une transaction ─────────────────

  async generateEntryFromTransaction(
    transaction: ITransaction,
    fiscalYearId: string,
    userId: string,
  ): Promise<IJournalEntry | null> {
    const tenantId = transaction.tenantId;

    // Vérifier si écriture déjà existante pour cette référence
    const autoRef = `AUTO-${transaction.reference}`;
    const existing = await this.prisma.journalEntry.findFirst({
      where: { tenantId, reference: autoRef },
    });
    if (existing) {
      this.logger.warn(`Écriture déjà générée pour ${transaction.reference}`);
      return this._mapJournalEntry(existing as any);
    }

    const floatCode = OPERATOR_FLOAT_ACCOUNT[transaction.operateur] ?? '589';
    const montant = toStr(transaction.montant);
    const frais = toStr(transaction.frais);
    const commission = toStr(transaction.commission);
    const date = (transaction.completedAt ?? transaction.createdAt)
      .toISOString()
      .slice(0, 10);

    let lines: Array<{ accountNumber: string; label: string; debit: string; credit: string }> = [];

    switch (transaction.type) {
      case 'DEPOT':
        // Agent reçoit cash du client → Débit Caisse / Crédit Float
        lines = [
          { accountNumber: '571', label: `Dépôt client ${transaction.clientPhone}`, debit: montant, credit: '0.00' },
          { accountNumber: floatCode, label: `Float ${transaction.operateur} — dépôt`, debit: '0.00', credit: montant },
        ];
        if (toF(commission) > 0) {
          lines.push(
            { accountNumber: floatCode, label: `Commission reçue ${transaction.operateur}`, debit: commission, credit: '0.00' },
            { accountNumber: '706', label: `Commission MM ${transaction.reference}`, debit: '0.00', credit: commission },
          );
          lines = this._aggregateLines(lines);
        }
        break;

      case 'RETRAIT':
        // Agent paie cash au client → Débit Float / Crédit Caisse
        lines = [
          { accountNumber: floatCode, label: `Float ${transaction.operateur} — retrait`, debit: montant, credit: '0.00' },
          { accountNumber: '571', label: `Caisse — retrait client ${transaction.clientPhone}`, debit: '0.00', credit: montant },
        ];
        if (toF(frais) > 0) {
          lines.push(
            { accountNumber: floatCode, label: `Frais retrait ${transaction.operateur}`, debit: frais, credit: '0.00' },
            { accountNumber: '706', label: `Commission retrait ${transaction.reference}`, debit: '0.00', credit: frais },
          );
          lines = this._aggregateLines(lines);
        }
        break;

      case 'CASH_IN':
        // Approvisionnement float depuis banque → Débit Float / Crédit Banque
        lines = [
          { accountNumber: floatCode, label: `Cash-In ${transaction.operateur} — banque`, debit: montant, credit: '0.00' },
          { accountNumber: '521', label: `Virement banque → float ${transaction.operateur}`, debit: '0.00', credit: montant },
        ];
        break;

      case 'CASH_OUT':
        // Retrait float vers banque → Débit Banque / Crédit Float
        lines = [
          { accountNumber: '521', label: `Cash-Out → banque`, debit: montant, credit: '0.00' },
          { accountNumber: floatCode, label: `Float ${transaction.operateur} — Cash-Out`, debit: '0.00', credit: montant },
        ];
        break;

      case 'PAIEMENT_MARCHAND':
        lines = [
          { accountNumber: floatCode, label: `Paiement marchand — reçu float`, debit: montant, credit: '0.00' },
          { accountNumber: '706', label: `Produit paiement marchand ${transaction.reference}`, debit: '0.00', credit: montant },
        ];
        break;

      case 'TRANSFERT':
        lines = [
          { accountNumber: '411', label: `Bénéficiaire transfert ${transaction.clientPhone}`, debit: montant, credit: '0.00' },
          { accountNumber: floatCode, label: `Float ${transaction.operateur} — transfert sortant`, debit: '0.00', credit: montant },
        ];
        break;

      default:
        this.logger.warn(`Type transaction non géré pour comptabilisation: ${transaction.type}`);
        return null;
    }

    const dto: CreateJournalEntryDto = {
      date,
      reference: autoRef,
      description: `[AUTO] ${transaction.type} — ${transaction.reference} — ${transaction.clientPhone}`,
      fiscalYearId,
      lines,
      transactionId: transaction.id,
      agentId: transaction.agentId,
    };

    return this.createJournalEntry(dto, tenantId, userId, true);
  }

  // ─── Validation partie double ──────────────────────────────────────────────────

  async validateDoubleEntry(
    lines: Array<{ debit: string; credit: string }>,
  ): Promise<void> {
    if (lines.length < 2) {
      throw new BadRequestException('Une écriture doit comporter au moins 2 lignes');
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      const d = toF(line.debit);
      const c = toF(line.credit);
      if (isNaN(d) || isNaN(c)) {
        throw new BadRequestException('Montants invalides (non numériques)');
      }
      if (d < 0 || c < 0) {
        throw new BadRequestException('Les montants ne peuvent pas être négatifs');
      }
      totalDebit += d;
      totalCredit += c;
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `Déséquilibre comptable: débit ${totalDebit.toFixed(2)} ≠ crédit ${totalCredit.toFixed(2)}`,
      );
    }
  }

  // ─── Rapprochement bancaire (stub — nécessite migration schéma) ──────────────

  async reconcile(
    dto: ReconcileDto,
    tenantId: string,
    userId: string,
  ): Promise<any> {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id: dto.journalEntryId, tenantId },
    });
    if (!entry) throw new NotFoundException(`Écriture ${dto.journalEntryId} introuvable`);

    // Marquer l'écriture comme rapprochée via les metadata (champ status = POSTED)
    const updated = await this.prisma.journalEntry.update({
      where: { id: dto.journalEntryId },
      data: { status: 'POSTED' },
    });

    await this._auditLog(tenantId, userId, 'UPDATE', 'JournalEntry', dto.journalEntryId);

    return {
      journalEntryId: dto.journalEntryId,
      bankReference: dto.bankReference,
      transactionId: dto.transactionId,
      status: 'RECONCILED',
      reconciledAt: new Date(),
      reconciledBy: userId,
      notes: dto.notes,
    };
  }

  async getPendingReconciliations(tenantId: string): Promise<any[]> {
    // Retourne les écritures en statut DRAFT (non rapprochées)
    return this.prisma.journalEntry.findMany({
      where: { tenantId, status: 'DRAFT' },
      include: { lines: { include: { account: true } } },
      orderBy: { entryDate: 'desc' },
      take: 100,
    });
  }

  // ─── Auto-entry depuis transactionId ─────────────────────────────────────────

  async generateEntryFromTransactionId(
    transactionId: string,
    fiscalYearId: string,
    tenantId: string,
    userId: string,
  ): Promise<IJournalEntry | null> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id: transactionId, tenantId, status: 'COMPLETED' },
    });
    if (!transaction) {
      throw new NotFoundException(
        `Transaction ${transactionId} introuvable ou non complétée`,
      );
    }

    // Mapper les champs du schéma Prisma réel vers ITransaction
    const mapped: ITransaction = {
      id: (transaction as any).id,
      tenantId: (transaction as any).tenantId,
      reference: (transaction as any).reference,
      type: this._mapTransactionType((transaction as any).type),
      status: (transaction as any).status as any,
      operateur: this._mapOperatorCode((transaction as any).operatorCode),
      montant: parseFloat((transaction as any).amount ?? '0'),
      frais: parseFloat((transaction as any).fee ?? '0'),
      commission: parseFloat((transaction as any).commission ?? '0'),
      agentId: (transaction as any).agentId,
      agenceId: (transaction as any).agencyId,
      clientPhone: (transaction as any).receiverPhone ?? (transaction as any).senderPhone ?? '',
      description: (transaction as any).description,
      metadata: (transaction as any).metadata,
      createdAt: (transaction as any).createdAt,
      updatedAt: (transaction as any).updatedAt,
      completedAt: (transaction as any).completedAt,
    };

    return this.generateEntryFromTransaction(mapped, fiscalYearId, userId);
  }

  private _mapTransactionType(prismaType: string): any {
    const map: Record<string, string> = {
      DEPOSIT: 'DEPOT',
      WITHDRAWAL: 'RETRAIT',
      FLOAT_REPLENISHMENT: 'CASH_IN',
      FLOAT_WITHDRAWAL: 'CASH_OUT',
      PAYMENT: 'PAIEMENT_MARCHAND',
      TRANSFER: 'TRANSFERT',
      REVERSAL: 'REVERSAL',
    };
    return map[prismaType] ?? prismaType;
  }

  private _mapOperatorCode(operatorCode: string): any {
    const map: Record<string, string> = {
      ORANGE: 'ORANGE_MONEY',
      MTN: 'MTN_MOMO',
      WAVE: 'WAVE',
      MOOV: 'MOOV_MONEY',
      AIRTEL: 'AIRTEL_MONEY',
      FREE: 'FREE_MONEY',
      TMONEY: 'TMONEY',
      MPESA: 'M_PESA',
    };
    return map[operatorCode] ?? operatorCode;
  }

  // ─── Centres de coûts (stub — modèle non présent dans le schéma actuel) ──────

  async getCostCenters(tenantId: string): Promise<any[]> {
    // Le modèle CostCenter n'est pas encore dans le schéma Prisma.
    // Cette méthode retourne une liste vide jusqu'à migration du schéma.
    this.logger.warn('getCostCenters: modèle CostCenter non migré — retour liste vide');
    return [];
  }

  // ─── Helpers privés ───────────────────────────────────────────────────────────

  private _aggregateLines(
    lines: Array<{ accountNumber: string; label: string; debit: string; credit: string }>,
  ): typeof lines {
    const map = new Map<string, { label: string; debit: number; credit: number }>();
    for (const l of lines) {
      const cur = map.get(l.accountNumber) ?? { label: l.label, debit: 0, credit: 0 };
      cur.debit += toF(l.debit);
      cur.credit += toF(l.credit);
      map.set(l.accountNumber, cur);
    }
    return Array.from(map.entries()).map(([accountNumber, { label, debit, credit }]) => ({
      accountNumber,
      label,
      debit: debit.toFixed(2),
      credit: credit.toFixed(2),
    }));
  }

  private _prismaTypeToSysco(prismaType: string): string {
    const map: Record<string, string> = {
      ASSET: 'ACTIF',
      LIABILITY: 'PASSIF',
      EQUITY: 'CAPITAL',
      REVENUE: 'PRODUIT',
      EXPENSE: 'CHARGE',
    };
    return map[prismaType] ?? prismaType;
  }

  private _mapFiscalYear(fy: any): IFiscalYear {
    return {
      id: fy.id,
      tenantId: fy.tenantId,
      label: fy.name,
      startDate: fy.startDate,
      endDate: fy.endDate,
      status: fy.isClosed ? 'CLOSED' : 'OPEN',
      closedAt: fy.closedAt,
      closedBy: fy.closedById,
      createdAt: fy.createdAt,
      updatedAt: fy.updatedAt,
    };
  }

  private _mapJournalEntry(entry: any): IJournalEntry {
    // Extraire le transactionId depuis la description si présent ([txn:xxx])
    const txnMatch = (entry.description ?? '').match(/\[txn:([^\]]+)\]/);
    const transactionId = txnMatch ? txnMatch[1] : undefined;
    const cleanDescription = (entry.description ?? '').replace(/\s*\[txn:[^\]]+\]/, '');

    return {
      id: entry.id,
      tenantId: entry.tenantId,
      fiscalYearId: entry.fiscalYearId,
      reference: entry.reference,
      date: entry.entryDate,
      description: cleanDescription,
      lines: (entry.lines ?? []).map((l: any) => ({
        id: l.id,
        journalEntryId: l.journalEntryId,
        accountNumber: l.account?.code ?? '',
        label: l.description ?? '',
        debit: toStr(l.debit),
        credit: toStr(l.credit),
        currency: l.currency ?? 'XOF',
        exchangeRate: 1,
        amountXof: toStr(toF(l.debit) !== 0 ? l.debit : l.credit),
      })),
      transactionId,
      agentId: undefined,
      costCenterId: undefined,
      isAutoGenerated: entry.reference?.startsWith('AUTO-') ?? false,
      isReconciled: entry.status === 'POSTED',
      reconciliationRef: undefined,
      createdBy: entry.createdById,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }

  private async _auditLog(
    tenantId: string,
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          userId: userId === 'SYSTEM' ? null : userId,
          action: action as any,
          resource,
          resourceId,
        },
      });
    } catch {
      // Non bloquant
    }
  }

  private async _getOrCreateSystemUser(tenantId: string): Promise<string> {
    // Pour les écritures automatiques on utilise le premier utilisateur admin du tenant
    const user = await this.prisma.user.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    return user?.id ?? 'SYSTEM';
  }
}
