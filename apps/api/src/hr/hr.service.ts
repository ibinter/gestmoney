import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { ContractDto } from './dto/contract.dto';
import {
  GeneratePayrollDto,
  ValidatePayrollDto,
} from './dto/payroll.dto';
import {
  LeaveRequestDto,
  LeaveApprovalDto,
  LeaveRejectionDto,
} from './dto/leave-request.dto';
import { CheckInDto, CheckOutDto, AttendanceQueryDto } from './dto/attendance.dto';

// ─── Constantes OHADA / Droit ivoirien ────────────────────────────────────────
const CNSS_EMPLOYEE_RATE = 0.063;   // 6,3 % salarié
const CNSS_EMPLOYER_RATE = 0.152;   // 15,2 % patronal
const ANNUAL_LEAVE_DAYS = 30;       // OHADA — 2,5 jours / mois travaillé

/**
 * Calcul de l'IGR (Impôt Général sur le Revenu) mensuel
 * Barème progressif simplifié — Côte d'Ivoire
 */
function computeIGR(annualTaxableIncome: number): number {
  const slabs = [
    { limit: 600_000, rate: 0 },
    { limit: 1_800_000, rate: 0.05 },
    { limit: 3_000_000, rate: 0.10 },
    { limit: 6_000_000, rate: 0.15 },
    { limit: 12_000_000, rate: 0.20 },
    { limit: Infinity, rate: 0.25 },
  ];
  let tax = 0;
  let prev = 0;
  for (const slab of slabs) {
    if (annualTaxableIncome <= prev) break;
    const taxable = Math.min(annualTaxableIncome, slab.limit) - prev;
    tax += taxable * slab.rate;
    prev = slab.limit;
  }
  return Math.round(tax / 12); // montant mensuel
}

@Injectable()
export class HrService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Employees ────────────────────────────────────────────────────────────

  async findAllEmployees(filters: {
    status?: string;
    agencyId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, search, page = 1, limit = 20 } = filters;
    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { contracts: { where: { isActive: true }, take: 1 } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.employee.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createEmployee(dto: CreateEmployeeDto, actorId: string) {
    // employeeNumber auto-généré : année + random
    const employeeNumber = `EMP-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const employee = await this.prisma.employee.create({
      data: {
        employeeNumber,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        gender: dto.gender,
        dateOfBirth: new Date(dto.birthDate),
        hireDate: new Date(dto.hireDate),
        position: dto.position,
        department: dto.department ?? 'Mobile Money',
        nationalId: dto.nationalId,
        status: 'ACTIVE',
        // tenantId requis — à récupérer depuis le JWT en production
        tenantId: 'default',
      },
    });
    await this.auditLog('EMPLOYEE_CREATED', actorId, { employeeId: employee.id });
    return employee;
  }

  async findEmployeeById(id: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        contracts: { orderBy: { startDate: 'desc' } },
        leaves: { orderBy: { createdAt: 'desc' }, take: 5 },
        payrolls: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
    });
    if (!emp) throw new NotFoundException(`Employé ${id} introuvable`);
    return emp;
  }

  async updateEmployee(id: string, data: Partial<CreateEmployeeDto>, actorId: string) {
    await this.findEmployeeById(id);
    const updated = await this.prisma.employee.update({
      where: { id },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.email && { email: data.email }),
        ...(data.phone && { phone: data.phone }),
        ...(data.position && { position: data.position }),
        ...(data.department && { department: data.department }),
      },
    });
    await this.auditLog('EMPLOYEE_UPDATED', actorId, { employeeId: id });
    return updated;
  }

  async terminateEmployee(id: string, reason: string, actorId: string) {
    await this.findEmployeeById(id);
    const updated = await this.prisma.employee.update({
      where: { id },
      data: {
        status: 'TERMINATED',
        terminationDate: new Date(),
      },
    });
    await this.prisma.contract.updateMany({
      where: { employeeId: id, isActive: true },
      data: { isActive: false, endDate: new Date() },
    });
    await this.auditLog('EMPLOYEE_TERMINATED', actorId, { employeeId: id, reason });
    return updated;
  }

  // ─── Contracts ────────────────────────────────────────────────────────────

  async findAllContracts(filters: { employeeId?: string; active?: boolean }) {
    const where: any = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.active !== undefined) where.isActive = filters.active;
    return this.prisma.contract.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async createContract(dto: ContractDto, actorId: string) {
    await this.findEmployeeById(dto.employeeId);
    if (dto.type === 'CDI') {
      await this.prisma.contract.updateMany({
        where: { employeeId: dto.employeeId, isActive: true },
        data: { isActive: false },
      });
    }
    const contract = await this.prisma.contract.create({
      data: {
        employeeId: dto.employeeId,
        type: dto.type as any,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        salary: dto.baseSalary,
        position: 'Agent Mobile Money',
        department: 'Mobile Money',
        terms: dto.description,
        isActive: true,
        tenantId: 'default',
      },
    });
    await this.auditLog('CONTRACT_CREATED', actorId, { contractId: contract.id, employeeId: dto.employeeId });
    return contract;
  }

  // ─── Payroll ──────────────────────────────────────────────────────────────

  async findPayroll(year: number, month: number, employeeId?: string) {
    const where: any = { periodYear: year, periodMonth: month };
    if (employeeId) where.employeeId = employeeId;
    return this.prisma.payroll.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generatePayroll(dto: GeneratePayrollDto, actorId: string) {
    const where: any = { status: 'ACTIVE' };
    if (dto.employeeId) where.id = dto.employeeId;

    const employees = await this.prisma.employee.findMany({
      where,
      include: {
        contracts: { where: { isActive: true }, take: 1 },
      },
    });

    const payrolls = [];
    for (const emp of employees) {
      const existing = await this.prisma.payroll.findFirst({
        where: { employeeId: emp.id, periodYear: dto.year, periodMonth: dto.month },
      });
      if (existing) continue;

      const contract = emp.contracts[0];
      if (!contract) continue;

      const baseSalary = Number(contract.salary);

      // Cotisations CNSS
      const cnssEmployee = Math.round(baseSalary * CNSS_EMPLOYEE_RATE);
      const cnssEmployer = Math.round(baseSalary * CNSS_EMPLOYER_RATE);

      // IGR — abattement 20% puis barème progressif annualisé
      const taxableBase = baseSalary - cnssEmployee;
      const abattement = Math.round(taxableBase * 0.2);
      const igrMonthly = computeIGR((taxableBase - abattement) * 12);

      const totalDeductions = cnssEmployee + igrMonthly;
      const netSalary = baseSalary - totalDeductions;

      const payroll = await this.prisma.payroll.create({
        data: {
          employeeId: emp.id,
          periodYear: dto.year,
          periodMonth: dto.month,
          baseSalary,
          bonuses: 0,
          deductions: totalDeductions,
          taxes: igrMonthly,
          netSalary,
          status: 'DRAFT',
          tenantId: 'default',
        },
      });
      payrolls.push({
        ...payroll,
        breakdown: {
          baseSalary,
          cnssEmployee,
          cnssEmployer,
          igr: igrMonthly,
          netSalary,
          // Écriture SYSCOHADA — Compte 421 Personnel
          syscohada: {
            debit: { account: '421', label: 'Personnel — Rémunérations dues', amount: netSalary },
            credit: [
              { account: '641', label: 'Rémunérations du personnel', amount: baseSalary },
              { account: '431', label: 'CNSS patronale', amount: cnssEmployer },
            ],
          },
        },
      });
    }

    await this.auditLog('PAYROLL_GENERATED', actorId, {
      year: dto.year,
      month: dto.month,
      count: payrolls.length,
    });
    return { generated: payrolls.length, payrolls };
  }

  async validatePayroll(id: string, dto: ValidatePayrollDto, actorId: string) {
    const payroll = await this.prisma.payroll.findUnique({ where: { id } });
    if (!payroll) throw new NotFoundException(`Fiche de paie ${id} introuvable`);
    if (payroll.status !== 'DRAFT') {
      throw new BadRequestException('Cette fiche de paie est déjà validée ou annulée');
    }
    const updated = await this.prisma.payroll.update({
      where: { id },
      data: { status: 'VALIDATED' },
    });
    await this.auditLog('PAYROLL_VALIDATED', actorId, {
      payrollId: id,
      note: dto.note,
      syscohadaAccount: dto.syscohadaAccount ?? '421',
    });
    return updated;
  }

  // ─── Leaves ───────────────────────────────────────────────────────────────

  async findLeaves(filters: { employeeId?: string; status?: string }) {
    const where: any = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status;
    return this.prisma.leave.findMany({
      where,
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createLeaveRequest(employeeId: string, dto: LeaveRequestDto) {
    await this.findEmployeeById(employeeId);
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end <= start) throw new BadRequestException('La date de fin doit être postérieure à la date de début');
    const days = Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1;

    // Vérifier solde pour congés annuels
    if (dto.type === 'ANNUAL') {
      const takenThisYear = await this.prisma.leave.aggregate({
        where: {
          employeeId,
          type: 'ANNUAL',
          status: 'APPROVED',
          startDate: { gte: new Date(`${new Date().getFullYear()}-01-01`) },
        },
        _sum: { days: true },
      });
      const used = takenThisYear._sum.days ?? 0;
      if (used + days > ANNUAL_LEAVE_DAYS) {
        throw new BadRequestException(
          `Solde de congés insuffisant : ${ANNUAL_LEAVE_DAYS - used} jour(s) restant(s), ${days} demandé(s)`,
        );
      }
    }

    return this.prisma.leave.create({
      data: {
        employeeId,
        type: dto.type as any,
        startDate: start,
        endDate: end,
        days,
        reason: dto.reason,
        status: 'PENDING',
        tenantId: 'default',
      },
    });
  }

  async approveLeave(id: string, dto: LeaveApprovalDto, actorId: string) {
    const leave = await this.prisma.leave.findUnique({ where: { id } });
    if (!leave) throw new NotFoundException(`Demande de congé ${id} introuvable`);
    if (leave.status !== 'PENDING') throw new BadRequestException('Cette demande est déjà traitée');

    const updated = await this.prisma.leave.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: actorId,
        approvedAt: new Date(),
      },
    });
    await this.auditLog('LEAVE_APPROVED', actorId, { leaveId: id, employeeId: leave.employeeId });
    return updated;
  }

  async rejectLeave(id: string, dto: LeaveRejectionDto, actorId: string) {
    const leave = await this.prisma.leave.findUnique({ where: { id } });
    if (!leave) throw new NotFoundException(`Demande de congé ${id} introuvable`);
    if (leave.status !== 'PENDING') throw new BadRequestException('Cette demande est déjà traitée');

    const updated = await this.prisma.leave.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: dto.reason,
      },
    });
    await this.auditLog('LEAVE_REJECTED', actorId, { leaveId: id, reason: dto.reason });
    return updated;
  }

  // ─── Attendance ───────────────────────────────────────────────────────────
  // NOTE : Le modèle `Attendance` n'existe pas encore dans le schéma Prisma.
  // Ajouter la migration suivante dans schema.prisma :
  //
  // model Attendance {
  //   id           String    @id @default(cuid())
  //   employeeId   String
  //   checkIn      DateTime
  //   checkOut     DateTime?
  //   hoursWorked  Float?
  //   overtimeHours Float?
  //   location     String?
  //   note         String?
  //   createdAt    DateTime  @default(now())
  //   employee     Employee  @relation(fields: [employeeId], references: [id])
  //   @@map("attendances")
  // }

  async findAttendance(_query: AttendanceQueryDto) {
    // Retourne vide tant que le modèle Attendance n'est pas migré
    return { data: [], message: 'Migration Attendance requise dans schema.prisma' };
  }

  async checkIn(_dto: CheckInDto, _actorId: string) {
    return { message: 'Migration Attendance requise dans schema.prisma' };
  }

  async checkOut(_dto: CheckOutDto, _actorId: string) {
    return { message: 'Migration Attendance requise dans schema.prisma' };
  }

  // ─── Audit ────────────────────────────────────────────────────────────────
  // NOTE : Utilise le module AuditLog existant dans /audit si disponible,
  // sinon ajouter `model AuditLog` dans schema.prisma.
  private async auditLog(action: string, actorId: string, meta: Record<string, unknown>) {
    try {
      // Si le module Audit existe avec un service injectable, l'injecter ici.
      // Pour l'instant, on log en console en attendant la migration.
      console.log(`[HR AUDIT] ${action} by ${actorId}`, meta);
    } catch {
      // L'audit ne doit jamais bloquer l'opération principale
    }
  }
}
