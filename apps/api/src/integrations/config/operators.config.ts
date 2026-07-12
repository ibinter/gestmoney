export interface OperatorConfig {
  apiUrl: string;
  timeout: number;
  maxRetries: number;
  enabled: boolean;
  sandbox: boolean;
}

export interface OrangeMoneyConfig extends OperatorConfig {
  clientId: string;
  clientSecret: string;
  merchantKey: string;
  hmacSecret: string;
}

export interface MtnMomoConfig extends OperatorConfig {
  collectionApiKey: string;
  disbursementApiKey: string;
  collectionUserId: string;
  disbursementUserId: string;
  subscriptionKeyCollection: string;
  subscriptionKeyDisbursement: string;
  environment: 'sandbox' | 'production';
  targetEnvironment: string;
}

export interface WaveConfig extends OperatorConfig {
  apiKey: string;
  businessId: string;
}

export interface MoovMoneyConfig extends OperatorConfig {
  username: string;
  password: string;
  merchantCode: string;
  country: string;
}

export interface AirtelMoneyConfig extends OperatorConfig {
  clientId: string;
  clientSecret: string;
  country: string;
  currency: string;
}

export interface OperatorsConfig {
  orangeMoney: OrangeMoneyConfig;
  mtnMomo: MtnMomoConfig;
  wave: WaveConfig;
  moovMoney: MoovMoneyConfig;
  airtelMoney: AirtelMoneyConfig;
}

export function loadOperatorsConfig(): OperatorsConfig {
  return {
    orangeMoney: {
      apiUrl: process.env.ORANGE_MONEY_API_URL ?? 'https://api.orange.com/orange-money-webpay/ci/v1',
      clientId: process.env.ORANGE_MONEY_CLIENT_ID ?? '',
      clientSecret: process.env.ORANGE_MONEY_CLIENT_SECRET ?? '',
      merchantKey: process.env.ORANGE_MONEY_MERCHANT_KEY ?? '',
      hmacSecret: process.env.ORANGE_MONEY_HMAC_SECRET ?? '',
      timeout: parseInt(process.env.ORANGE_MONEY_TIMEOUT ?? '30000', 10),
      maxRetries: parseInt(process.env.ORANGE_MONEY_MAX_RETRIES ?? '3', 10),
      enabled: process.env.ORANGE_MONEY_ENABLED === 'true',
      sandbox: process.env.ORANGE_MONEY_SANDBOX !== 'false',
    },
    mtnMomo: {
      apiUrl: process.env.MTN_MOMO_API_URL ?? 'https://sandbox.momodeveloper.mtn.com',
      collectionApiKey: process.env.MTN_MOMO_COLLECTION_API_KEY ?? '',
      disbursementApiKey: process.env.MTN_MOMO_DISBURSEMENT_API_KEY ?? '',
      collectionUserId: process.env.MTN_MOMO_COLLECTION_USER_ID ?? '',
      disbursementUserId: process.env.MTN_MOMO_DISBURSEMENT_USER_ID ?? '',
      subscriptionKeyCollection: process.env.MTN_MOMO_SUBSCRIPTION_KEY_COLLECTION ?? '',
      subscriptionKeyDisbursement: process.env.MTN_MOMO_SUBSCRIPTION_KEY_DISBURSEMENT ?? '',
      environment: (process.env.MTN_ENVIRONMENT as 'sandbox' | 'production') ?? 'sandbox',
      targetEnvironment: process.env.MTN_TARGET_ENVIRONMENT ?? 'sandbox',
      timeout: parseInt(process.env.MTN_MOMO_TIMEOUT ?? '30000', 10),
      maxRetries: parseInt(process.env.MTN_MOMO_MAX_RETRIES ?? '3', 10),
      enabled: process.env.MTN_MOMO_ENABLED === 'true',
      sandbox: process.env.MTN_ENVIRONMENT !== 'production',
    },
    wave: {
      apiUrl: process.env.WAVE_API_URL ?? 'https://api.wave.com/v1',
      apiKey: process.env.WAVE_API_KEY ?? '',
      businessId: process.env.WAVE_BUSINESS_ID ?? '',
      timeout: parseInt(process.env.WAVE_TIMEOUT ?? '30000', 10),
      maxRetries: parseInt(process.env.WAVE_MAX_RETRIES ?? '3', 10),
      enabled: process.env.WAVE_ENABLED === 'true',
      sandbox: process.env.WAVE_SANDBOX !== 'false',
    },
    moovMoney: {
      apiUrl: process.env.MOOV_MONEY_API_URL ?? 'https://api.moov-africa.com/v1',
      username: process.env.MOOV_MONEY_USERNAME ?? '',
      password: process.env.MOOV_MONEY_PASSWORD ?? '',
      merchantCode: process.env.MOOV_MONEY_MERCHANT_CODE ?? '',
      country: process.env.MOOV_MONEY_COUNTRY ?? 'CI',
      timeout: parseInt(process.env.MOOV_MONEY_TIMEOUT ?? '30000', 10),
      maxRetries: parseInt(process.env.MOOV_MONEY_MAX_RETRIES ?? '3', 10),
      enabled: process.env.MOOV_MONEY_ENABLED === 'true',
      sandbox: process.env.MOOV_MONEY_SANDBOX !== 'false',
    },
    airtelMoney: {
      apiUrl: process.env.AIRTEL_MONEY_API_URL ?? 'https://openapi.airtel.africa',
      clientId: process.env.AIRTEL_MONEY_CLIENT_ID ?? '',
      clientSecret: process.env.AIRTEL_MONEY_CLIENT_SECRET ?? '',
      country: process.env.AIRTEL_MONEY_COUNTRY ?? 'CI',
      currency: process.env.AIRTEL_MONEY_CURRENCY ?? 'XOF',
      timeout: parseInt(process.env.AIRTEL_MONEY_TIMEOUT ?? '30000', 10),
      maxRetries: parseInt(process.env.AIRTEL_MONEY_MAX_RETRIES ?? '3', 10),
      enabled: process.env.AIRTEL_MONEY_ENABLED === 'true',
      sandbox: process.env.AIRTEL_MONEY_SANDBOX !== 'false',
    },
  };
}
