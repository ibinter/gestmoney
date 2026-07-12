import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: "event", level: "query" },
        { emit: "stdout", level: "error" },
        { emit: "stdout", level: "warn" },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log("Base de donnees connectee");
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log("Connexion base de donnees fermee");
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV !== "test") {
      throw new Error("cleanDatabase() uniquement en test");
    }
    const tables = [
      "notificationLog",
      "commissionPayment",
      "commission",
      "floatMovement",
      "vaultMovement",
      "caisseMovement",
      "caisseSession",
      "replenishmentRequest",
      "floatAccount",
      "transaction",
      "auditLog",
    ];
    for (const table of tables) {
      await (this as any)[table].deleteMany();
    }
  }
}
