import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  DiskHealthIndicator,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { SansLicence } from '../common/decorators/sans-licence.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Public')
@Controller('health')
@Public()
@SansLicence()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check global (DB + mémoire + disque)' })
  async check() {
    return this.health.check([
      () => this.prismaIndicator.pingCheck('database', this.prisma),
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),
      () =>
        this.disk.checkStorage('storage', {
          path: process.platform === 'win32' ? 'C:\\' : '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Métriques enrichies : latence DB, uptime, services' })
  async detailed() {
    const start = Date.now();

    let dbStatus = 'ok';
    let dbLatency = 0;
    try {
      const t0 = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - t0;
    } catch {
      dbStatus = 'error';
    }

    return {
      status: dbStatus === 'ok' ? 'operational' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
      uptime: process.uptime(),
      services: {
        api: { status: 'operational', latency: Date.now() - start },
        database: { status: dbStatus, latency: dbLatency },
        smtp: {
          status: process.env.SMTP_HOST ? 'configured' : 'not_configured',
        },
        backup: { status: 'operational', lastRun: null },
      },
      environment: process.env.NODE_ENV ?? 'development',
    };
  }
}
