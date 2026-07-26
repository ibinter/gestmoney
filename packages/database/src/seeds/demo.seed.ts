/**
 * GESTMONEY — Seed de démonstration client
 *
 * Crée un tenant "Réseau DEMO Mobile Money" (slug: demo-client) avec des
 * données réalistes : 3 agences, 8 agents, 50 clients, 200 transactions
 * sur 30 jours, journal comptable, tickets support et une licence PRO.
 *
 * Usage direct :
 *   SEED_DEMO=true pnpm db:seed
 *
 * Usage via endpoint (SUPER_ADMIN uniquement) :
 *   POST /superadmin/ops/seed-demo
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// ─── Données statiques ──────────────────────────────────────────────────────

const DEMO_SLUG = 'demo-client';

const AGENCES = [
  {
    nom: 'Agence Cocody 2 Plateaux',
    code: 'DEMO-COC-01',
    adresse: 'Rue des Jardins, 2 Plateaux, Cocody, Abidjan',
    ville: 'Abidjan',
    phone: '+2250720100101',
    email: 'cocody@demo-reseau.ci',
    latitude: 5.3936,
    longitude: -3.9897,
  },
  {
    nom: 'Agence Yopougon Marché',
    code: 'DEMO-YOP-02',
    adresse: 'Marché de Yopougon, Yopougon, Abidjan',
    ville: 'Abidjan',
    phone: '+2250720100102',
    email: 'yopougon@demo-reseau.ci',
    latitude: 5.3544,
    longitude: -4.0628,
  },
  {
    nom: 'Agence Bouaké Terminus',
    code: 'DEMO-BKE-03',
    adresse: 'Quartier Commerce, Terminus, Bouaké',
    ville: 'Bouaké',
    phone: '+2250720100103',
    email: 'bouake@demo-reseau.ci',
    latitude: 7.6869,
    longitude: -5.0299,
  },
];

const AGENTS_DATA = [
  { prenom: 'Kouamé',    nom: 'Assoumou',   tel: '+22507001122', email: 'k.assoumou@agents.demo-reseau.ci',  agenceIdx: 0, code: 'DEMO-AGT-001' },
  { prenom: 'Fatou',     nom: 'Diallo',      tel: '+22505223344', email: 'f.diallo@agents.demo-reseau.ci',    agenceIdx: 0, code: 'DEMO-AGT-002' },
  { prenom: 'Konan',     nom: 'Yao',         tel: '+22507112233', email: 'k.yao@agents.demo-reseau.ci',       agenceIdx: 0, code: 'DEMO-AGT-003' },
  { prenom: 'Moussa',    nom: 'Traoré',      tel: '+22501334455', email: 'm.traore@agents.demo-reseau.ci',    agenceIdx: 1, code: 'DEMO-AGT-004' },
  { prenom: 'Aminata',   nom: 'Koné',        tel: '+22507556677', email: 'a.kone@agents.demo-reseau.ci',      agenceIdx: 1, code: 'DEMO-AGT-005' },
  { prenom: 'Mariam',    nom: 'Coulibaly',   tel: '+22505334455', email: 'm.coulibaly@agents.demo-reseau.ci', agenceIdx: 1, code: 'DEMO-AGT-006' },
  { prenom: 'Jean-Pierre', nom: 'Aké',       tel: '+22505778899', email: 'jp.ake@agents.demo-reseau.ci',      agenceIdx: 2, code: 'DEMO-AGT-007' },
  { prenom: 'Bintou',    nom: 'Keïta',       tel: '+22501990011', email: 'b.keita@agents.demo-reseau.ci',     agenceIdx: 2, code: 'DEMO-AGT-008' },
];

const CLIENTS_PRENOMS = [
  'Adama', 'Adjoua', 'Aimé', 'Aïssata', 'Awa', 'Brice', 'Cheick', 'Clarisse',
  'Daouda', 'Ernest', 'Fatoumata', 'Gnégnéri', 'Hawa', 'Ibrahim', 'Jacqueline',
  'Kadiatou', 'Lanciné', 'Maïmouna', 'Nathalie', 'Oumar', 'Patricia', 'Ramatou',
  'Sali', 'Thierry', 'Urbain', 'Victorine', 'Woyo', 'Youssouf', 'Zalika', 'Zoumana',
  'Abou', 'Bernadette', 'Cissé', 'Drissa', 'Elise', 'Fanta', 'Gomez', 'Houriya',
  'Issa', 'Juliette', 'Kader', 'Lamine', 'Mafing', 'Noure', 'Olivia', 'Pascal',
  'Rokhaya', 'Siaka', 'Toumani', 'Valérie',
];

const CLIENTS_NOMS = [
  'Bamba', 'Camara', 'Diabaté', 'Diomandé', 'Dosso', 'Fofana', 'Gbané',
  'Guéhi', 'Kanté', 'Konaté', 'Kouyaté', 'Lobé', 'Niamké', 'Ouédraogo',
  'Savané', 'Sidibé', 'Sylla', 'Touré', 'Wonré', 'Zongo', 'Abouo', 'Akré',
  'Assoumou', 'Brou', 'Ettien', 'Kofi', 'Kouassi', 'Kouakou', 'N\'Goran', 'Yobé',
];

const DOC_TYPES = ['CNI', 'PASSEPORT', 'PERMIS', 'CNI', 'CNI', 'CNI']; // CNI dominant

const OPERATEURS = ['ORANGE_MONEY', 'MTN_MOMO', 'WAVE', 'MOOV_MONEY'];
const POIDS_OPERATEURS = [0.4, 0.3, 0.2, 0.1]; // Orange dominant

// ─── Utilitaires ────────────────────────────────────────────────────────────

function rng(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickWeighted(items: string[], poids: number[]): string {
  const r = Math.random();
  let cumul = 0;
  for (let i = 0; i < items.length; i++) {
    cumul += poids[i];
    if (r < cumul) return items[i];
  }
  return items[items.length - 1];
}

/** Génère un montant réaliste en FCFA (multiple de 500) */
function genMontant(): number {
  const r = Math.random();
  if (r < 0.70) return rng(10, 200) * 500;    // 5 000 – 100 000 FCFA
  if (r < 0.95) return rng(200, 1000) * 500;  // 100 000 – 500 000 FCFA
  return rng(1000, 2000) * 500;                // 500 000 – 1 000 000 FCFA
}

/** Date aléatoire dans les N derniers jours, pondérée 8h-12h et 16h-19h */
function genDate(jours = 30): Date {
  const msBase = Date.now() - jours * 24 * 60 * 60 * 1000;
  const d = new Date(msBase + rng(0, jours) * 24 * 60 * 60 * 1000);
  const r = Math.random();
  const heure = r < 0.4 ? rng(8, 12) : r < 0.7 ? rng(16, 19) : rng(7, 20);
  d.setHours(heure, rng(0, 59), rng(0, 59), 0);
  return d;
}

function genPhone(i: number): string {
  const prefixes = ['07', '05', '01', '08'];
  return `+225${prefixes[i % 4]}${String(50000000 + i).padStart(8, '0')}`;
}

// ─── Seed principal ──────────────────────────────────────────────────────────

export async function seedDemoTenant(
  prisma: PrismaClient,
): Promise<Record<string, number>> {
  console.log('\n[DEMO] ▶ Création du tenant de démonstration...');
  const t0 = Date.now();

  // ── 1. TENANT ───────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: DEMO_SLUG },
    create: {
      name: 'Réseau DEMO Mobile Money',
      slug: DEMO_SLUG,
      status: 'ACTIVE',
      plan: 'PROFESSIONAL',
      country: 'CI',
      currency: 'XOF',
      timezone: 'Africa/Abidjan',
      locale: 'fr-CI',
      subscriptionEndsAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      settings: {
        demoMode: true,
        licence: {
          plan: 'PROFESSIONAL',
          statut: 'ACTIVE',
          dateDebut: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          dateFin: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    },
    update: {},
  });
  console.log(`[DEMO]   Tenant : ${tenant.name} (${tenant.id})`);

  // ── 2. RÔLES ────────────────────────────────────────────────────────────────
  const ROLES = [
    'SUPER_ADMIN', 'NETWORK_ADMIN', 'AGENCY_MANAGER', 'AGENT', 'ACCOUNTANT', 'AUDITOR',
  ];
  const roleMap: Record<string, any> = {};
  for (const rNom of ROLES) {
    const r = await prisma.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: rNom } },
      create: { tenantId: tenant.id, name: rNom, isSystem: true },
      update: {},
    });
    roleMap[rNom] = r;
  }

  // ── 3. ADMIN DÉMO ───────────────────────────────────────────────────────────
  const pwdHash = await bcrypt.hash('Demo@2026', 10);

  const adminUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'demo@gestmoney.ibigsoft.com' } },
    create: {
      tenantId: tenant.id,
      email: 'demo@gestmoney.ibigsoft.com',
      passwordHash: pwdHash,
      firstName: 'Admin',
      lastName: 'Démo',
      phone: '+22500000001',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
    update: {},
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: roleMap['NETWORK_ADMIN'].id } },
    create: { userId: adminUser.id, roleId: roleMap['NETWORK_ADMIN'].id },
    update: {},
  });
  console.log(`[DEMO]   Admin : demo@gestmoney.ibigsoft.com`);

  // ── 4. RÉSEAU ───────────────────────────────────────────────────────────────
  const network = await prisma.network.upsert({
    where: { tenantId_operatorCode: { tenantId: tenant.id, operatorCode: 'ORANGE_MONEY' } },
    create: {
      tenantId: tenant.id,
      name: 'Réseau DEMO CI',
      operatorCode: 'ORANGE_MONEY',
      country: 'CI',
      currency: 'XOF',
      status: 'ACTIVE',
    },
    update: {},
  });

  // ── 5. AGENCES ──────────────────────────────────────────────────────────────
  const agences: any[] = [];
  for (const ag of AGENCES) {
    const agence = await prisma.agency.upsert({
      where: { tenantId_networkId_code: { tenantId: tenant.id, networkId: network.id, code: ag.code } },
      create: {
        tenantId: tenant.id,
        networkId: network.id,
        name: ag.nom,
        code: ag.code,
        address: ag.adresse,
        city: ag.ville,
        country: 'CI',
        phone: ag.phone,
        email: ag.email,
        latitude: ag.latitude,
        longitude: ag.longitude,
        status: 'ACTIVE',
        managerId: adminUser.id,
        openingHours: '08:00-20:00',
      },
      update: {},
    });
    agences.push(agence);
  }
  console.log(`[DEMO]   ${agences.length} agences créées`);

  // ── 6. AGENTS ───────────────────────────────────────────────────────────────
  const agents: any[] = [];
  const agentPwd = await bcrypt.hash('Demo@2026', 10);
  for (const ad of AGENTS_DATA) {
    const agence = agences[ad.agenceIdx];
    const userAgent = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: ad.email } },
      create: {
        tenantId: tenant.id,
        email: ad.email,
        passwordHash: agentPwd,
        firstName: ad.prenom,
        lastName: ad.nom,
        phone: ad.tel,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
      update: {},
    });
    const agent = await prisma.agent.upsert({
      where: { userId: userAgent.id },
      create: {
        tenantId: tenant.id,
        userId: userAgent.id,
        agencyId: agence.id,
        agentCode: ad.code,
        phoneNumber: ad.tel,
        nationalId: `CI${ad.code.replace(/-/g, '')}`,
        address: agence.address,
        status: 'ACTIVE',
      },
      update: {},
    });
    agents.push(agent);
  }
  console.log(`[DEMO]   ${agents.length} agents créés`);

  // ── 7. CLIENTS (50) ─────────────────────────────────────────────────────────
  const clients: any[] = [];
  for (let i = 0; i < 50; i++) {
    const prenom = CLIENTS_PRENOMS[i % CLIENTS_PRENOMS.length];
    const nom = CLIENTS_NOMS[i % CLIENTS_NOMS.length];
    const phone = genPhone(i);
    const kycVerified = Math.random() > 0.25;
    const docType = DOC_TYPES[rng(0, DOC_TYPES.length - 1)];
    const client = await prisma.customer.upsert({
      where: { tenantId_phoneNumber: { tenantId: tenant.id, phoneNumber: phone } },
      create: {
        tenantId: tenant.id,
        phoneNumber: phone,
        firstName: prenom,
        lastName: nom,
        nationalId: `CI${String(1000000 + i).padStart(8, '0')}`,
        city: pick(['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro']),
        country: 'CI',
        status: 'ACTIVE',
        kycVerified,
        kycVerifiedAt: kycVerified ? new Date(Date.now() - rng(1, 90) * 86400000) : null,
        kycStatus: kycVerified ? 'VERIFIED' : 'PENDING',
        kycDocumentType: docType,
        totalTransactions: 0,
        totalVolume: 0,
        loyaltyPoints: rng(0, 500),
        lastTransactionAt: new Date(Date.now() - rng(0, 20) * 86400000),
      },
      update: {},
    });
    clients.push(client);
  }
  console.log(`[DEMO]   ${clients.length} clients créés`);

  // ── 8. COMPTES FLOAT ────────────────────────────────────────────────────────
  const floatAccounts: any[] = [];
  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    const balance = rng(50_000, 2_000_000);
    const accountNum = `DEMO-FA-${String(i + 1).padStart(4, '0')}`;
    const fa = await prisma.floatAccount.upsert({
      where: { tenantId_accountNumber: { tenantId: tenant.id, accountNumber: accountNum } },
      create: {
        tenantId: tenant.id,
        accountNumber: accountNum,
        agentId: agent.id,
        networkId: network.id,
        balance,
        maximumBalance: 5_000_000,
        minimumBalance: 50_000,
        currency: 'XOF',
        isActive: true,
        lastMovementAt: new Date(),
      },
      update: { balance },
    });
    floatAccounts.push(fa);
  }
  console.log(`[DEMO]   ${floatAccounts.length} comptes float créés`);

  // ── 9. TRANSACTIONS (200) ───────────────────────────────────────────────────
  const TYPES_TX = [
    ...Array(60).fill('DEPOSIT'),
    ...Array(30).fill('WITHDRAWAL'),
    ...Array(10).fill('TRANSFER'),
  ];
  const STATUTS_TX = [
    ...Array(93).fill('COMPLETED'),
    ...Array(5).fill('FAILED'),
    ...Array(2).fill('CANCELLED'),
  ];

  const txs: any[] = [];
  for (let i = 0; i < 200; i++) {
    const agent = pick(agents);
    const client = pick(clients);
    const type = pick(TYPES_TX) as any;
    const status = pick(STATUTS_TX) as any;
    const amount = genMontant();
    const fee = Math.round(amount * (type === 'WITHDRAWAL' ? 0.01 : 0.005) / 5) * 5;
    const commission = Math.round(fee * 0.3 / 5) * 5;
    const netAmount = amount - fee;
    const createdAt = genDate(30);
    const operatorCode = pickWeighted(OPERATEURS, POIDS_OPERATEURS);
    const reference = `DEMO-TXN-${Date.now()}-${String(i).padStart(4, '0')}`;

    const tx = await prisma.transaction.create({
      data: {
        tenantId: tenant.id,
        reference,
        type,
        status,
        amount,
        fee,
        commission,
        netAmount,
        currency: 'XOF',
        operatorCode,
        agentId: agent.id,
        agencyId: agent.agencyId,
        networkId: network.id,
        senderPhone: client.phoneNumber,
        senderName: `${client.firstName} ${client.lastName}`,
        description: type === 'DEPOSIT' ? 'Dépôt Mobile Money' :
                     type === 'WITHDRAWAL' ? 'Retrait espèces' : 'Transfert Mobile Money',
        metadata: { canal: pick(['USSD', 'APP', 'WEB']), demo: true },
        completedAt: status === 'COMPLETED' ? new Date(createdAt.getTime() + rng(5, 120) * 1000) : null,
        failureReason: status === 'FAILED' ? pick(['Solde insuffisant', 'Timeout opérateur', 'Numéro invalide']) : null,
        createdAt,
        updatedAt: createdAt,
      },
    });
    txs.push(tx);
  }
  console.log(`[DEMO]   ${txs.length} transactions créées`);

  // ── 10. ANNÉE FISCALE + JOURNAL COMPTABLE ────────────────────────────────────
  const annee = new Date().getFullYear();
  const fiscalYear = await prisma.fiscalYear.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: `Exercice ${annee}` } },
    create: {
      tenantId: tenant.id,
      name: `Exercice ${annee}`,
      startDate: new Date(`${annee}-01-01`),
      endDate: new Date(`${annee}-12-31`),
      isClosed: false,
    },
    update: {},
  });

  // Compte de trésorerie simplifié
  const comptesCash = await prisma.accountChart.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'DEMO-521' } },
    create: {
      tenantId: tenant.id,
      code: 'DEMO-521',
      name: 'Banque & Mobile Money',
      type: 'ASSET',
      normalBalance: 'DEBIT',
      level: 1,
      isActive: true,
    },
    update: {},
  });
  const comptesRevenu = await prisma.accountChart.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'DEMO-706' } },
    create: {
      tenantId: tenant.id,
      code: 'DEMO-706',
      name: 'Commissions perçues',
      type: 'REVENUE',
      normalBalance: 'CREDIT',
      level: 1,
      isActive: true,
    },
    update: {},
  });

  // 15 écritures comptables
  const ecritures: string[] = [];
  for (let i = 0; i < 15; i++) {
    const montant = rng(50, 5000) * 1000;
    const entryDate = genDate(30);
    const ref = `DEMO-JNL-${String(i + 1).padStart(3, '0')}`;
    const existingEntry = await prisma.journalEntry.findFirst({
      where: { tenantId: tenant.id, reference: ref },
    });
    if (!existingEntry) {
      await prisma.journalEntry.create({
        data: {
          tenantId: tenant.id,
          reference: ref,
          description: `Commission Mobile Money — période ${entryDate.toLocaleDateString('fr-CI')}`,
          status: 'POSTED',
          totalDebit: montant,
          totalCredit: montant,
          currency: 'XOF',
          entryDate,
          fiscalYearId: fiscalYear.id,
          createdById: adminUser.id,
          postedById: adminUser.id,
          postedAt: entryDate,
          lines: {
            create: [
              { accountId: comptesCash.id, debit: montant, credit: 0, currency: 'XOF', description: 'Encaissement' },
              { accountId: comptesRevenu.id, debit: 0, credit: montant, currency: 'XOF', description: 'Commission' },
            ],
          },
        },
      });
    }
    ecritures.push(ref);
  }
  console.log(`[DEMO]   ${ecritures.length} écritures comptables créées`);

  // ── 11. TICKETS SUPPORT (3) ──────────────────────────────────────────────────
  const ticketsData = [
    {
      numero: 'DEMO-TKT-001',
      objet: 'Impossible de valider une transaction WAVE',
      description: 'Depuis ce matin, toutes les transactions WAVE échouent avec le code ERR-502. Le client attend son retrait de 150 000 FCFA.',
      categorie: 'TECHNIQUE',
      priorite: 'HAUTE' as const,
      statut: 'OUVERT' as const,
    },
    {
      numero: 'DEMO-TKT-002',
      objet: 'Demande de rapport mensuel PDF — juin 2026',
      description: 'Nous avons besoin du rapport complet des transactions de juin 2026 pour notre audit interne.',
      categorie: 'RAPPORT',
      priorite: 'NORMALE' as const,
      statut: 'RESOLU' as const,
    },
    {
      numero: 'DEMO-TKT-003',
      objet: 'Ajout d\'un nouvel agent pour l\'agence Bouaké',
      description: 'Nous souhaitons ajouter 2 nouveaux agents pour l\'agence Bouaké Terminus suite à notre expansion.',
      categorie: 'GESTION',
      priorite: 'NORMALE' as const,
      statut: 'RESOLU' as const,
    },
  ];

  let nbTickets = 0;
  for (const tkData of ticketsData) {
    const existing = await prisma.ticket.findUnique({ where: { numero: tkData.numero } });
    if (!existing) {
      await prisma.ticket.create({
        data: {
          numero: tkData.numero,
          tenantId: tenant.id,
          userId: adminUser.id,
          objet: tkData.objet,
          description: tkData.description,
          categorie: tkData.categorie,
          priorite: tkData.priorite,
          statut: tkData.statut,
          logiciel: 'GESTMONEY',
          resolution: tkData.statut === 'RESOLU' ? 'Résolu par l\'équipe support GESTMONEY.' : null,
          satisfaction: tkData.statut === 'RESOLU' ? rng(4, 5) : null,
        },
      });
      nbTickets++;
    }
  }
  console.log(`[DEMO]   ${nbTickets} tickets support créés`);

  // ── 12. LICENCE PRO ACTIVE ───────────────────────────────────────────────────
  await prisma.licenceEvent.create({
    data: {
      tenantId: tenant.id,
      type: 'ABONNEMENT_ACTIVE',
      plan: 'PROFESSIONAL',
      montant: 75000,
      devise: 'XOF',
      dateDebut: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      dateFin: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      motif: 'Activation licence PROFESSIONAL — tenant de démonstration',
    },
  });
  console.log(`[DEMO]   Licence PRO activée (expire dans 25 jours)`);

  // ── 13. ONBOARDING COMPLET ──────────────────────────────────────────────────
  await prisma.onboardingStep.upsert({
    where: { tenantId: tenant.id },
    create: {
      tenantId: tenant.id,
      etape1: true,
      etape2: true,
      etape3: true,
      etape4: true,
      etape5: true,
      termine: true,
    },
    update: {
      etape1: true, etape2: true, etape3: true,
      etape4: true, etape5: true, termine: true,
    },
  });

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const rapport = {
    tenantId: tenant.id,
    slug: DEMO_SLUG,
    dureeSecondes: parseFloat(elapsed),
    agences: agences.length,
    agents: agents.length,
    clients: clients.length,
    floatAccounts: floatAccounts.length,
    transactions: txs.length,
    journalEntries: ecritures.length,
    tickets: nbTickets,
    licence: 'PROFESSIONAL (25 jours)',
  };

  console.log('[DEMO] ✓ Seed démo terminé en', elapsed, 's');
  console.log('[DEMO] Identifiants : demo@gestmoney.ibigsoft.com / Demo@2026');
  return rapport;
}
