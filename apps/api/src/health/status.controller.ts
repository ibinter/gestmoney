import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { SansLicence } from '../common/decorators/sans-licence.decorator';
import { PrismaService } from '../prisma/prisma.service';

export interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
}

export interface SystemStatus {
  status: 'operational' | 'degraded' | 'outage';
  incidents: string[];
  services: ServiceStatus[];
  lastUpdated: string;
}

@ApiTags('Public')
@Controller('status')
@Public()
@SansLicence()
export class StatusController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Statut public simplifié des services GESTMONEY' })
  async getStatus(): Promise<SystemStatus> {
    let dbStatus: 'operational' | 'degraded' | 'outage' = 'operational';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'outage';
    }

    const smtpStatus: 'operational' | 'degraded' =
      process.env.SMTP_HOST ? 'operational' : 'degraded';

    const services: ServiceStatus[] = [
      { name: 'API', status: 'operational' },
      { name: 'Base de données', status: dbStatus },
      { name: 'Emails', status: smtpStatus },
      { name: 'Sauvegardes', status: 'operational' },
    ];

    const anyDegraded = services.some((s) => s.status !== 'operational');

    return {
      status: anyDegraded ? 'degraded' : 'operational',
      incidents: [],
      services,
      lastUpdated: new Date().toISOString(),
    };
  }
}
