import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  name: process.env.DATABASE_NAME || 'gestmoney_db',
  user: process.env.DATABASE_USER || 'gestmoney_user',
  password: process.env.DATABASE_PASSWORD || 'gestmoney_pass',
  ssl: process.env.DATABASE_SSL === 'true',
  poolMin: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
  poolMax: parseInt(process.env.DATABASE_POOL_MAX || '20', 10),
}));
