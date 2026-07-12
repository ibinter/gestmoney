import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  API_PORT: Joi.number().default(3001),
  API_HOST: Joi.string().default('0.0.0.0'),
  API_PREFIX: Joi.string().default('api/v1'),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),
  DEFAULT_TENANT_ID: Joi.string().default('default'),
});

export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  app: {
    port: parseInt(process.env.API_PORT || '3001', 10),
    host: process.env.API_HOST || '0.0.0.0',
    prefix: process.env.API_PREFIX || 'api/v1',
    name: process.env.APP_NAME || 'GESTMONEY',
    version: process.env.APP_VERSION || '1.0.0',
    corsOrigins: process.env.CORS_ORIGINS || 'http://localhost:3000',
  },
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    name: process.env.DATABASE_NAME || 'gestmoney_db',
    user: process.env.DATABASE_USER || 'gestmoney_user',
    password: process.env.DATABASE_PASSWORD || 'gestmoney_pass',
    ssl: process.env.DATABASE_SSL === 'true',
    poolMin: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DATABASE_POOL_MAX || '20', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
  tenant: {
    defaultTenantId: process.env.DEFAULT_TENANT_ID || 'default',
  },
  superAdmin: {
    email: process.env.SUPER_ADMIN_EMAIL || 'admin@gestmoney.com',
    password: process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456!',
  },
});
