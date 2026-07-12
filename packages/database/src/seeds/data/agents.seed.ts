import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const agentsData = [
  { firstName: "Kouadio", lastName: "Yao",        phone: "+2250701001001", email: "k.yao@agents.demo.ci",        agencyIndex: 0, code: "AGT-PLT-001" },
  { firstName: "Mariam",  lastName: "Coulibaly",  phone: "+2250701001002", email: "m.coulibaly@agents.demo.ci",  agencyIndex: 0, code: "AGT-PLT-002" },
  { firstName: "Jean-Baptiste", lastName: "Aka",  phone: "+2250701001003", email: "jb.aka@agents.demo.ci",       agencyIndex: 0, code: "AGT-PLT-003" },
  { firstName: "Awa",     lastName: "Bamba",      phone: "+2250701002001", email: "a.bamba@agents.demo.ci",      agencyIndex: 1, code: "AGT-COC-001" },
  { firstName: "Sékou",   lastName: "Diabaté",    phone: "+2250701002002", email: "s.diabate@agents.demo.ci",    agencyIndex: 1, code: "AGT-COC-002" },
  { firstName: "Adjoua",  lastName: "Koffi",      phone: "+2250701002003", email: "a.koffi@agents.demo.ci",      agencyIndex: 1, code: "AGT-COC-003" },
  { firstName: "Mamadou", lastName: "Sanogo",     phone: "+2250701003001", email: "m.sanogo@agents.demo.ci",     agencyIndex: 2, code: "AGT-BKE-001" },
  { firstName: "Fatoumata", lastName: "Traoré",  phone: "+2250701003002", email: "f.traore@agents.demo.ci",     agencyIndex: 2, code: "AGT-BKE-002" },
  { firstName: "Oumar",   lastName: "Kouyaté",   phone: "+2250701003003", email: "o.kouyate@agents.demo.ci",    agencyIndex: 2, code: "AGT-BKE-003" },
  { firstName: "N'golo",  lastName: "Dembélé",   phone: "+2250701004001", email: "n.dembele@agents.demo.ci",    agencyIndex: 3, code: "AGT-SPD-001" },
  { firstName: "Rokia",   lastName: "Sidibé",    phone: "+2250701004002", email: "r.sidibe@agents.demo.ci",     agencyIndex: 3, code: "AGT-SPD-002" },
  { firstName: "Brice",   lastName: "Guéhi",     phone: "+2250701004003", email: "b.guehi@agents.demo.ci",      agencyIndex: 3, code: "AGT-SPD-003" },
  { firstName: "Aïssata", lastName: "Koné",      phone: "+2250701005001", email: "a.kone@agents.demo.ci",       agencyIndex: 4, code: "AGT-YMK-001" },
  { firstName: "Salimata", lastName: "Dosso",    phone: "+2250701005002", email: "s.dosso@agents.demo.ci",      agencyIndex: 4, code: "AGT-YMK-002" },
  { firstName: "Ernest",  lastName: "Abouo",     phone: "+2250701005003", email: "e.abouo@agents.demo.ci",      agencyIndex: 4, code: "AGT-YMK-003" },
];

export async function seedAgents(
  prisma: PrismaClient,
  tenantId: string,
  networkId: string,
  agencies: any[]
) {
  console.log("  → Seed Agents (15 agents)...");

  const agents = [];
  const hashedPwd = await bcrypt.hash("Agent2026!", 10);

  for (const agentData of agentsData) {
    const agency = agencies[agentData.agencyIndex];

    const user = await prisma.user.upsert({
      where: { tenantId_email: { tenantId, email: agentData.email } },
      update: {},
      create: {
        email: agentData.email,
        passwordHash: hashedPwd,
        firstName: agentData.firstName,
        lastName: agentData.lastName,
        phone: agentData.phone,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        tenantId,
      },
    });

    const agent = await prisma.agent.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        agentCode: agentData.code,
        userId: user.id,
        agencyId: agency.id,
        tenantId,
        status: "ACTIVE",
        phoneNumber: agentData.phone,
        nationalId: `CI${agentData.code.replace(/-/g, "")}`,
        address: agency.address,
      },
    });

    agents.push(agent);
  }

  console.log(`     ${agents.length} agents créés`);
  return agents;
}
