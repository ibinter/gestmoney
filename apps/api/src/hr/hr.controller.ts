import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { HrService } from './hr.service';
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

// Placeholder guards — remplacer par vos guards d'authentification réels
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../roles/roles.guard';
// import { Roles } from '../roles/roles.decorator';

@ApiTags('RH — Ressources Humaines')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  // ─── Employees ────────────────────────────────────────────────────────────

  @Get('employees')
  @ApiOperation({ summary: 'Liste des employés avec filtres' })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'] })
  @ApiQuery({ name: 'agencyId', required: false })
  @ApiQuery({ name: 'search', required: false, description: 'Recherche par nom, email ou code agent' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAllEmployees(
    @Query('status') status?: string,
    @Query('agencyId') agencyId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.hrService.findAllEmployees({
      status,
      agencyId,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Post('employees')
  @ApiOperation({ summary: 'Créer un nouvel employé' })
  createEmployee(@Body() dto: CreateEmployeeDto, @Request() req: any) {
    return this.hrService.createEmployee(dto, req.user?.id ?? 'system');
  }

  @Get('employees/:id')
  @ApiOperation({ summary: 'Profil complet d\'un employé' })
  @ApiParam({ name: 'id', description: 'UUID de l\'employé' })
  findEmployee(@Param('id') id: string) {
    return this.hrService.findEmployeeById(id);
  }

  @Patch('employees/:id')
  @ApiOperation({ summary: 'Modifier les informations d\'un employé' })
  @ApiParam({ name: 'id' })
  updateEmployee(
    @Param('id') id: string,
    @Body() dto: Partial<CreateEmployeeDto>,
    @Request() req: any,
  ) {
    return this.hrService.updateEmployee(id, dto, req.user?.id ?? 'system');
  }

  @Post('employees/:id/terminate')
  @ApiOperation({ summary: 'Procéder à la fin de contrat d\'un employé (audit loggé)' })
  @ApiParam({ name: 'id' })
  // @Roles('HR_MANAGER', 'ADMIN')
  terminateEmployee(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    return this.hrService.terminateEmployee(id, reason, req.user?.id ?? 'system');
  }

  // ─── Contracts ────────────────────────────────────────────────────────────

  @Get('contracts')
  @ApiOperation({ summary: 'Liste des contrats actifs' })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  findAllContracts(
    @Query('employeeId') employeeId?: string,
    @Query('active') active?: string,
  ) {
    return this.hrService.findAllContracts({
      employeeId,
      active: active !== undefined ? active === 'true' : undefined,
    });
  }

  @Post('contracts')
  @ApiOperation({ summary: 'Créer un nouveau contrat de travail' })
  createContract(@Body() dto: ContractDto, @Request() req: any) {
    return this.hrService.createContract(dto, req.user?.id ?? 'system');
  }

  // ─── Payroll ──────────────────────────────────────────────────────────────

  @Get('payroll')
  @ApiOperation({ summary: 'Fiches de paie mensuelles' })
  @ApiQuery({ name: 'year', type: Number })
  @ApiQuery({ name: 'month', type: Number })
  @ApiQuery({ name: 'employeeId', required: false })
  findPayroll(
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.hrService.findPayroll(
      parseInt(year, 10),
      parseInt(month, 10),
      employeeId,
    );
  }

  @Post('payroll/generate')
  @ApiOperation({
    summary: 'Générer les fiches de paie du mois (calcul automatique CNSS + IGR)',
    description:
      'Calcule : salaire brut, CNSS salarié (6,3%), CNSS patronal (15,2%), IGR progressif, ' +
      'commissions du mois. Génère une écriture SYSCOHADA compte 421.',
  })
  // @Roles('HR_MANAGER', 'ADMIN')
  generatePayroll(@Body() dto: GeneratePayrollDto, @Request() req: any) {
    return this.hrService.generatePayroll(dto, req.user?.id ?? 'system');
  }

  @Post('payroll/:id/validate')
  @ApiOperation({ summary: 'Valider une fiche de paie (audit loggé)' })
  @ApiParam({ name: 'id', description: 'UUID de la fiche de paie' })
  // @Roles('HR_MANAGER', 'ADMIN')
  validatePayroll(
    @Param('id') id: string,
    @Body() dto: ValidatePayrollDto,
    @Request() req: any,
  ) {
    return this.hrService.validatePayroll(id, dto, req.user?.id ?? 'system');
  }

  // ─── Leaves ───────────────────────────────────────────────────────────────

  @Get('leaves')
  @ApiOperation({ summary: 'Liste des demandes de congé' })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  findLeaves(
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
  ) {
    return this.hrService.findLeaves({ employeeId, status });
  }

  @Post('leaves')
  @ApiOperation({ summary: 'Soumettre une demande de congé (vérifie solde OHADA 30j/an)' })
  createLeave(@Body() dto: LeaveRequestDto, @Request() req: any) {
    return this.hrService.createLeaveRequest(req.user?.id ?? 'system', dto);
  }

  @Patch('leaves/:id/approve')
  @ApiOperation({ summary: 'Approuver une demande de congé' })
  @ApiParam({ name: 'id' })
  approveLeave(
    @Param('id') id: string,
    @Body() dto: LeaveApprovalDto,
    @Request() req: any,
  ) {
    return this.hrService.approveLeave(id, dto, req.user?.id ?? 'system');
  }

  @Patch('leaves/:id/reject')
  @ApiOperation({ summary: 'Rejeter une demande de congé (raison obligatoire)' })
  @ApiParam({ name: 'id' })
  rejectLeave(
    @Param('id') id: string,
    @Body() dto: LeaveRejectionDto,
    @Request() req: any,
  ) {
    return this.hrService.rejectLeave(id, dto, req.user?.id ?? 'system');
  }

  // ─── Attendance ───────────────────────────────────────────────────────────

  @Get('attendance')
  @ApiOperation({ summary: 'Registre des présences / absences' })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'from', required: false, description: 'Date ISO 8601' })
  @ApiQuery({ name: 'to', required: false, description: 'Date ISO 8601' })
  findAttendance(@Query() query: AttendanceQueryDto) {
    return this.hrService.findAttendance(query);
  }

  @Post('attendance/checkin')
  @ApiOperation({ summary: 'Pointer l\'entrée (avec géolocalisation optionnelle)' })
  checkIn(@Body() dto: CheckInDto, @Request() req: any) {
    return this.hrService.checkIn(dto, req.user?.id ?? 'system');
  }

  @Post('attendance/checkout')
  @ApiOperation({ summary: 'Pointer la sortie (calcule heures normales + supplémentaires)' })
  checkOut(@Body() dto: CheckOutDto, @Request() req: any) {
    return this.hrService.checkOut(dto, req.user?.id ?? 'system');
  }
}
