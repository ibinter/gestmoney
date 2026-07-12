import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { HrModule } from "./hr/hr.module";
import { ReportingModule } from "./reporting/reporting.module";
import { IntegrationsModule } from "./integrations/integrations.module";
import { CustomersModule } from "./customers/customers.module";
import { AuditModule } from "./audit/audit.module";
import { StockModule } from "./stock/stock.module";
import { AccountingModule } from "./accounting/accounting.module";
import { GatewayModule } from "./gateway/gateway.module";
import { ConfigAppModule } from "./config-app/config-app.module";
import { KycModule } from "./kyc/kyc.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { TenantsModule } from "./tenants/tenants.module";
import { AgenciesModule } from "./agencies/agencies.module";
import { AgentsModule } from "./agents/agents.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { FloatModule } from "./float/float.module";
import { CommissionsModule } from "./commissions/commissions.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>("THROTTLE_TTL", 60) * 1000,
          limit: config.get<number>("THROTTLE_LIMIT", 100),
        },
      ],
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    // ── Infrastructure ───────────────────────────────────────────
    PrismaModule,
    // ── Modules WebSocket et configuration (chargés en premier) ──
    GatewayModule,
    ConfigAppModule,
    KycModule,
    // ── Auth & Users ─────────────────────────────────────────────
    AuthModule,
    UsersModule,
    TenantsModule,
    // ── Modules métier ──────────────────────────────────────────
    AgenciesModule,
    AgentsModule,
    TransactionsModule,
    FloatModule,
    CommissionsModule,
    NotificationsModule,
    ReportingModule,
    CustomersModule,
    IntegrationsModule,
    AuditModule,
    StockModule,
    AccountingModule,
    HrModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
