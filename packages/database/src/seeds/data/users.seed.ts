import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

export interface SeedUsers {
  superAdmin: any;
  networkAdmin: any;
  agencyManager: any;
  agent: any;
  accountant: any;
  auditor: any;
}

const SALT_ROUNDS = 12;

const usersData = [
  {
    email: "admin@gestmoney.demo",
    password: "Admin2026!",
    firstName: "Super",
    lastName: "Admin",
    phone: "+2250700000001",
    roleName: "SUPER_ADMIN",
    roleKey: "superAdmin",
  },
  {
    email: "directeur@demo.ci",
    password: "Demo2026!",
    firstName: "Moussa",
    lastName: "Konaté",
    phone: "+2250700000002",
    roleName: "NETWORK_ADMIN",
    roleKey: "networkAdmin",
  },
  {
    email: "chef.agence@demo.ci",
    password: "Demo2026!",
    firstName: "Aminata",
    lastName: "Diallo",
    phone: "+2250700000003",
    roleName: "AGENCY_MANAGER",
    roleKey: "agencyManager",
  },
  {
    email: "agent1@demo.ci",
    password: "Demo2026!",
    firstName: "Kofi",
    lastName: "Asante",
    phone: "+2250700000004",
    roleName: "AGENT",
    roleKey: "agent",
  },
  {
    email: "comptable@demo.ci",
    password: "Demo2026!",
    firstName: "Fatou",
    lastName: "Ndiaye",
    phone: "+2250700000005",
    roleName: "ACCOUNTANT",
    roleKey: "accountant",
  },
  {
    email: "auditeur@demo.ci",
    password: "Demo2026!",
    firstName: "Ibrahim",
    lastName: "Traoré",
    phone: "+2250700000006",
    roleName: "AUDITOR",
    roleKey: "auditor",
  },
];

const roleDescriptions: Record<string, string> = {
  SUPER_ADMIN: "Administrateur global du système",
  NETWORK_ADMIN: "Administrateur du réseau Mobile Money",
  AGENCY_MANAGER: "Responsable d'agence",
  AGENT: "Agent Mobile Money",
  ACCOUNTANT: "Comptable",
  AUDITOR: "Auditeur",
};

export async function seedUsers(
  prisma: PrismaClient,
  tenantId: string
): Promise<SeedUsers> {
  console.log("  → Seed Roles système...");

  // Créer les rôles système
  const roleMap: Record<string, any> = {};
  for (const [roleName, description] of Object.entries(roleDescriptions)) {
    const role = await prisma.role.upsert({
      where: { tenantId_name: { tenantId, name: roleName } },
      update: {},
      create: { tenantId, name: roleName, description, isSystem: true },
    });
    roleMap[roleName] = role;
  }

  console.log("  → Seed Users...");
  const createdUsers: Record<string, any> = {};

  for (const userData of usersData) {
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

    const user = await prisma.user.upsert({
      where: { tenantId_email: { tenantId, email: userData.email } },
      update: {
        firstName: userData.firstName,
        lastName: userData.lastName,
      },
      create: {
        email: userData.email,
        passwordHash: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        tenantId,
      },
    });

    // Associer le rôle via UserRole
    const role = roleMap[userData.roleName];
    if (role) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: { userId: user.id, roleId: role.id },
      });
    }

    createdUsers[userData.roleKey] = user;
    console.log(`     User : ${user.email} [${userData.roleName}]`);
  }

  return {
    superAdmin: createdUsers["superAdmin"],
    networkAdmin: createdUsers["networkAdmin"],
    agencyManager: createdUsers["agencyManager"],
    agent: createdUsers["agent"],
    accountant: createdUsers["accountant"],
    auditor: createdUsers["auditor"],
  };
}
