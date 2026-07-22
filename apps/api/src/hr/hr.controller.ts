import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('RH — Ressources Humaines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
    @CurrentUser() user: CurrentUserData,
    @Query('status') status?: string,
    @Query('agencyId') agencyId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.hrService.findAllEmployees(user.tenantId, {
      status,
      agencyId,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Post('employees')
  @ApiOperation({ summary: 'Créer un nouvel employé' })
  createEmployee(@Body() dto: CreateEmployeeDto, @CurrentUser() user: CurrentUserData) {
    return this.hrService.createEmployee(dto, user.tenantId, user.id);
  }

  @Get('employees/:id')
  @ApiOperation({ summary: 'Profil complet d\'un employé' })
  @ApiParam({ name: 'id', description: 'UUID de l\'employé' })
  findEmployee(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.hrService.findEmployeeById(id, user.tenantId);
  }

  @Patch('employees/:id')
  @ApiOperation({ summary: 'Modifier les informations d\'un employé' })
  @ApiParam({ name: 'id' })
  updateEmployee(
    @Param('id') id: string,
    @Body() dto: Partial<CreateEmployeeDto>,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.hrService.updateEmployee(id, dto, user.tenantId, user.id);
  }

  @Post('employees/:id/terminate')
  @ApiOperation({ summary: 'Procéder à la fin de contrat d\'un employé (audit loggé)' })
  @ApiParam({ name: 'id' })
  terminateEmployee(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.hrService.terminateEmployee(id, reason, user.tenantId, user.id);
  }

  // ─── Contracts ────────────────────────────────────────────────────────────

  @Get('contracts')
  @ApiOperation({ summary: 'Liste des contrats actifs' })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  findAllContracts(
    @CurrentUser() user: CurrentUserData,
    @Query('employeeId') employeeId?: string,
    @Query('active') active?: string,
  ) {
    return this.hrService.findAllContracts(user.tenantId, {
      employeeId,
      active: active !== undefined ? active === 'true' : undefined,
    });
  }

  @Post('contracts')
  @ApiOperation({ summary: 'Créer un nouveau contrat de travail' })
  createContract(@Body() dto: ContractDto, @CurrentUser() user: CurrentUserData) {
    return this.hrService.createContract(dto, user.tenantId, user.id);
  }

  // ─── Payroll ──────────────────────────────────────────────────────────────

  @Get('payroll')
  @ApiOperation({ summary: 'Fiches de paie mensuelles' })
  @ApiQuery({ name: 'year', type: Number })
  @ApiQuery({ name: 'month', type: Number })
  @ApiQuery({ name: 'employeeId', required: false })
  findPayroll(
    @CurrentUser() user: CurrentUserData,
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.hrService.findPayroll(
      user.tenantId,
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
  generatePayroll(@Body() dto: GeneratePayrollDto, @CurrentUser() user: CurrentUserData) {
    return this.hrService.generatePayroll(dto, user.tenantId, user.id);
  }

  @Post('payroll/:id/validate')
  @ApiOperation({ summary: 'Valider une fiche de paie (audit loggé)' })
  @ApiParam({ name: 'id', description: 'UUID de la fiche de paie' })
  validatePayroll(
    @Param('id') id: string,
    @Body() dto: ValidatePayrollDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.hrService.validatePayroll(id, dto, user.tenantId, user.id);
  }

  // ─── Leaves ───────────────────────────────────────────────────────────────

  @Get('leaves')
  @ApiOperation({ summary: 'Liste des demandes de congé' })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  findLeaves(
    @CurrentUser() user: CurrentUserData,
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
  ) {
    return this.hrService.findLeaves(user.tenantId, { employeeId, status });
  }

  @Post('leaves')
  @ApiOperation({ summary: 'Soumettre une demande de congé (vérifie solde OHADA 30j/an)' })
  createLeave(@Body() dto: LeaveRequestDto, @CurrentUser() user: CurrentUserData) {
    return this.hrService.createLeaveRequest(dto, user.tenantId, user.id);
  }

  @Patch('leaves/:id/approve')
  @ApiOperation({ summary: 'Approuver une demande de congé' })
  @ApiParam({ name: 'id' })
  approveLeave(
    @Param('id') id: string,
    @Body() dto: LeaveApprovalDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.hrService.approveLeave(id, dto, user.tenantId, user.id);
  }

  @Patch('leaves/:id/reject')
  @ApiOperation({ summary: 'Rejeter une demande de congé (raison obligatoire)' })
  @ApiParam({ name: 'id' })
  rejectLeave(
    @Param('id') id: string,
    @Body() dto: LeaveRejectionDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.hrService.rejectLeave(id, dto, user.tenantId, user.id);
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
  checkIn(@Body() dto: CheckInDto, @CurrentUser() user: CurrentUserData) {
    return this.hrService.checkIn(dto, user.id);
  }

  @Post('attendance/checkout')
  @ApiOperation({ summary: 'Pointer la sortie (calcule heures normales + supplémentaires)' })
  checkOut(@Body() dto: CheckOutDto, @CurrentUser() user: CurrentUserData) {
    return this.hrService.checkOut(dto, user.id);
  }
}
