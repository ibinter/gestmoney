import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppGateway } from './app.gateway';
import { GatewayService } from './gateway.service';
import { DashboardStatsScheduler } from './dashboard-stats.scheduler';
import { GatewayListener } from './listeners/gateway.listener';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * GatewayModule — module global WebSocket pour les notifications temps réel.
 * Utilise Socket.io via @nestjs/platform-socket.io.
 * Les WebSockets partagent la même authentification JWT que l'API REST.
 *
 * Namespaces disponibles :
 *   /dashboard    — statistiques en temps réel
 *   /transactions — événements de transactions
 *   /float        — alertes et mises à jour de float
 *   /notifications — notifications utilisateur
 *
 * Note Swagger : les WebSockets ne sont pas documentés via OpenAPI/Swagger.
 * Consulter la documentation dans app.gateway.ts pour la liste complète
 * des événements émis et reçus.
 */
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '1h') },
      }),
    }),
    ScheduleModule,
    PrismaModule,
  ],
  providers: [AppGateway, GatewayService, DashboardStatsScheduler, GatewayListener],
  exports: [GatewayService],
})
export class GatewayModule {}
