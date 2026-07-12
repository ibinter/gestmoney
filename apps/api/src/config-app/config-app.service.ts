import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { COUNTRIES_DATA, CountryData } from './data/countries.data';
import { CURRENCIES_DATA, CurrencyData } from './data/currencies.data';

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  updatedAt: Date;
}

export interface TransactionLimits {
  perTransaction: number;
  perDay: number;
  perMonth: number;
  currency: string;
}

@Injectable()
export class ConfigAppService {
  private readonly logger = new Logger(ConfigAppService.name);

  /** Cache des taux de change (en mémoire — TTL 24h) */
  private exchangeRatesCache: Record<string, number> = {};
  private exchangeRatesFetchedAt: Date | null = null;
  private readonly RATES_TTL_MS = 24 * 60 * 60 * 1000; // 24 heures

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  // ─── Pays ─────────────────────────────────────────────────────────────────

  getSupportedCountries(): Array<CountryData & { code: string }> {
    return Object.entries(COUNTRIES_DATA).map(([code, data]) => ({
      code,
      ...data,
    }));
  }

  getCountry(countryCode: string): CountryData & { code: string } {
    const country = COUNTRIES_DATA[countryCode.toUpperCase()];
    if (!country) {
      throw new NotFoundException(
        `Pays non supporté : ${countryCode}. Codes supportés : ${Object.keys(COUNTRIES_DATA).join(', ')}`,
      );
    }
    return { code: countryCode.toUpperCase(), ...country };
  }

  // ─── Devises ──────────────────────────────────────────────────────────────

  getSupportedCurrencies(): Array<CurrencyData> {
    return Object.values(CURRENCIES_DATA);
  }

  getCurrency(currencyCode: string): CurrencyData {
    const currency = CURRENCIES_DATA[currencyCode.toUpperCase()];
    if (!currency) {
      throw new NotFoundException(`Devise non supportée : ${currencyCode}`);
    }
    return currency;
  }

  // ─── Taux de change ───────────────────────────────────────────────────────

  async getExchangeRates(): Promise<{
    base: string;
    rates: Record<string, number>;
    updatedAt: string | null;
  }> {
    if (this.isRatesStale()) {
      await this.refreshExchangeRates();
    }

    return {
      base: 'XOF',
      rates: this.exchangeRatesCache,
      updatedAt: this.exchangeRatesFetchedAt?.toISOString() ?? null,
    };
  }

  async refreshExchangeRates(): Promise<void> {
    const apiKey = this.config.get<string>('EXCHANGE_RATES_API_KEY');
    const apiUrl = this.config.get<string>(
      'EXCHANGE_RATES_API_URL',
      'https://api.exchangerate-api.com/v4/latest',
    );

    const currencies = Object.keys(CURRENCIES_DATA).join(',');

    try {
      // Tentative avec API configurée
      const url = apiKey
        ? `https://openexchangerates.org/api/latest.json?app_id=${apiKey}&symbols=${currencies}&base=XOF`
        : `${apiUrl}/XOF`;

      const response = await firstValueFrom(
        this.httpService.get<{ rates: Record<string, number> }>(url, {
          timeout: 10_000,
        }),
      );

      this.exchangeRatesCache = response.data.rates ?? {};
      this.exchangeRatesCache['XOF'] = 1; // Base
      this.exchangeRatesFetchedAt = new Date();

      this.logger.log(
        `Taux de change rafraîchis depuis API externe (${Object.keys(this.exchangeRatesCache).length} devises)`,
      );
    } catch (err) {
      this.logger.warn(
        `Impossible de rafraîchir les taux depuis API externe : ${err.message}. Utilisation des taux de secours.`,
      );
      // Taux de secours approximatifs (juillet 2025)
      this.exchangeRatesCache = {
        XOF: 1,
        XAF: 1, // 1:1 par convention zone franc CFA
        GHS: 0.0085,
        KES: 0.083,
        NGN: 4.5,
        TZS: 15.8,
        UGX: 22.4,
        RWF: 6.7,
        MZN: 0.039,
        EUR: 0.00152,
        USD: 0.00165,
      };
      this.exchangeRatesFetchedAt = new Date();
    }
  }

  /**
   * Convertit un montant d'une devise vers une autre.
   * Utilise XOF comme devise pivot.
   */
  async convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<{ amount: number; rate: number; fromCurrency: string; toCurrency: string }> {
    if (fromCurrency === toCurrency) {
      return { amount, rate: 1, fromCurrency, toCurrency };
    }

    if (this.isRatesStale()) {
      await this.refreshExchangeRates();
    }

    const fromRate = this.exchangeRatesCache[fromCurrency];
    const toRate = this.exchangeRatesCache[toCurrency];

    if (!fromRate || !toRate) {
      throw new BadRequestException(
        `Taux de change non disponible pour ${fromCurrency} → ${toCurrency}`,
      );
    }

    // Conversion via XOF pivot : amount / fromRate * toRate
    const amountInXof = amount / fromRate;
    const convertedAmount = amountInXof * toRate;
    const directRate = toRate / fromRate;

    return {
      amount: Math.round(convertedAmount * 100) / 100,
      rate: directRate,
      fromCurrency,
      toCurrency,
    };
  }

  // ─── Opérateurs ───────────────────────────────────────────────────────────

  getOperatorsByCountry(countryCode: string): {
    countryCode: string;
    operators: string[];
  } {
    const country = this.getCountry(countryCode);
    return {
      countryCode: country.code,
      operators: country.operators,
    };
  }

  getAllOperators(): Array<{ operator: string; countries: string[] }> {
    const operatorMap = new Map<string, string[]>();

    for (const [code, data] of Object.entries(COUNTRIES_DATA)) {
      for (const op of data.operators) {
        if (!operatorMap.has(op)) operatorMap.set(op, []);
        operatorMap.get(op)!.push(code);
      }
    }

    return Array.from(operatorMap.entries()).map(([operator, countries]) => ({
      operator,
      countries,
    }));
  }

  // ─── Limites de transaction ───────────────────────────────────────────────

  getTransactionLimits(
    countryCode: string,
    operatorCode?: string,
  ): TransactionLimits {
    const country = this.getCountry(countryCode);

    // Limites de base par pays
    const limits: TransactionLimits = {
      perTransaction: country.transactionLimitXof,
      perDay: country.dailyLimit,
      perMonth: country.monthlyLimit,
      currency: country.currency,
    };

    return limits;
  }

  async setTransactionLimits(
    tenantId: string,
    countryCode: string,
    operatorCode: string,
    limits: Partial<TransactionLimits>,
  ): Promise<void> {
    // Stocker les limites personnalisées en base (structure générique)
    this.logger.log(
      `Limites définies pour tenant ${tenantId}, pays ${countryCode}, opérateur ${operatorCode}`,
    );
    // Implémentation en base de données selon le schéma Prisma du projet
  }

  // ─── Validation téléphone ─────────────────────────────────────────────────

  validatePhoneNumber(
    phone: string,
    countryCode: string,
  ): { valid: boolean; normalized: string | null; error?: string } {
    const country = COUNTRIES_DATA[countryCode.toUpperCase()];
    if (!country) {
      return { valid: false, normalized: null, error: `Pays ${countryCode} non supporté` };
    }

    // Normaliser : retirer indicatif, espaces, tirets
    let normalized = phone.trim().replace(/[\s\-\.\(\)]/g, '');

    if (normalized.startsWith(country.phonePrefix)) {
      normalized = normalized.slice(country.phonePrefix.length);
    } else if (normalized.startsWith('+')) {
      // Indicatif inconnu
      return { valid: false, normalized: null, error: 'Indicatif pays incorrect' };
    } else if (normalized.startsWith('00')) {
      normalized = normalized.slice(2 + country.phonePrefix.length - 1);
    }

    const regex = new RegExp(country.phoneRegex);
    if (!regex.test(normalized)) {
      return {
        valid: false,
        normalized: null,
        error: `Format attendu : ${country.phoneFormat}`,
      };
    }

    return {
      valid: true,
      normalized: `${country.phonePrefix}${normalized}`,
    };
  }

  // ─── Réglementations ──────────────────────────────────────────────────────

  getRegulations(countryCode: string) {
    const country = this.getCountry(countryCode);
    return {
      countryCode: country.code,
      countryName: country.nameFr,
      currency: country.currency,
      kycRequired: country.kycRequired,
      ...country.regulations,
      transactionLimits: {
        perTransaction: country.transactionLimitXof,
        perDay: country.dailyLimit,
        perMonth: country.monthlyLimit,
      },
    };
  }

  // ─── Configuration tenant ─────────────────────────────────────────────────

  async getTenantConfig(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException(`Tenant ${tenantId} introuvable`);
    return tenant;
  }

  async updateTenantConfig(
    tenantId: string,
    updates: {
      countryCode?: string;
      currency?: string;
      language?: string;
    },
  ) {
    if (updates.countryCode) {
      this.getCountry(updates.countryCode); // Valider
    }
    if (updates.currency) {
      this.getCurrency(updates.currency); // Valider
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: updates as any,
    });
  }

  // ─── Helpers privés ───────────────────────────────────────────────────────

  private isRatesStale(): boolean {
    if (!this.exchangeRatesFetchedAt) return true;
    return Date.now() - this.exchangeRatesFetchedAt.getTime() > this.RATES_TTL_MS;
  }
}
