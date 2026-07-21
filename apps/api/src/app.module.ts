import { Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
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
import { AiModule } from "./ai/ai.module";
import { PaymentsModule } from "./payments/payments.module";
import { LicencesModule } from "./licences/licences.module";
import { LicenceGuard } from "./licences/licence.guard";
import { AuditInterceptor } from "./common/interceptors/audit.interceptor";

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
    AiModule,
    PaymentsModule,
    LicencesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // ── Application de la licence, à l'échelle de TOUTE l'application ────────
    // Enregistrée en global (« sécurisé par défaut ») : tout module ajouté
    // demain est couvert sans intervention. Les routes qui doivent rester
    // ouvertes quel que soit l'état de la licence — auth, paiements, licences,
    // lecture des tenants, health — le déclarent avec `@SansLicence()`.
    // Ses dépendances sont résolues dans ce contexte : `LicencesService` est
    // exporté par `LicencesModule`, `JwtService` par `AuthModule`.
    { provide: APP_GUARD, useClass: LicenceGuard },
    // ── Journalisation d'audit à l'échelle de TOUTE l'application ───────────
    // Enregistré en global : toute mutation métier réussie et authentifiée est
    // tracée (§27). `AuditService` est fourni par `AuditModule`, importé plus
    // haut et exportant ce service — il est donc injectable ici sans dépendance
    // circulaire (AuditModule ne dépend que de PrismaModule). L'écriture est en
    // fire-and-forget : elle ne bloque ni ne fait échouer la réponse HTTP.
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
