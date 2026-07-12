import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';
import { CommissionPlanDto } from './dto/commission-plan.dto';
import {
  CalculateCommissionsDto,
  QueryCommissionDto,
  ValidatePaymentDto,
} from './dto/query-commission.dto';

@ApiTags('Commissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les commissions (par agent, agence, période)' })
  findAll(@Query() query: QueryCommissionDto, @Req() req: any) {
    return this.commissionsService.findAll(query, req.user.tenantId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Résumé commissions (dues, payées, en attente)' })
  getSummary(@Req() req: any) {
    return this.commissionsService.getSummary(req.user.tenantId);
  }

  @Post('calculate')
  @ApiOperation({ summary: 'Recalculer les commissions sur une période' })
  @ApiResponse({ status: 200, description: 'Nombre de commissions recalculées' })
  recalculate(@Body() dto: CalculateCommissionsDto, @Req() req: any) {
    return this.commissionsService.recalculate(dto, req.user.tenantId);
  }

  @Post('plans')
  @ApiOperation({ summary: 'Créer une grille tarifaire de commission' })
  @ApiResponse({ status: 201, description: 'Grille créée' })
  createPlan(@Body() dto: CommissionPlanDto, @Req() req: any) {
    return this.commissionsService.createPlan(dto, req.user.tenantId);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Lister les grilles tarifaires' })
  getPlans(@Req() req: any) {
    return this.commissionsService.getPlans(req.user.tenantId);
  }

  @Patch('plans/:id')
  @ApiOperation({ summary: 'Modifier une grille tarifaire' })
  @ApiParam({ name: 'id', description: 'ID de la grille' })
  updatePlan(
    @Param('id') id: string,
    @Body() dto: Partial<CommissionPlanDto>,
    @Req() req: any,
  ) {
    return this.commissionsService.updatePlan(id, dto, req.user.tenantId);
  }

  @Post('payments')
  @ApiOperation({ summary: 'Valider le paiement de commissions' })
  @ApiResponse({ status: 201, description: 'Paiement validé et commissions marquées PAID' })
  validatePayment(@Body() dto: ValidatePaymentDto, @Req() req: any) {
    return this.commissionsService.validatePayment(dto, req.user.tenantId, req.user.id);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Historique des paiements de commissions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getPayments(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.commissionsService.getPayments(req.user.tenantId, +page, +limit);
  }

  @Get('agents/:agentId')
  @ApiOperation({ summary: "Commissions d'un agent" })
  @ApiParam({ name: 'agentId', description: "ID de l'agent" })
  getAgentCommissions(
    @Param('agentId') agentId: string,
    @Query() query: QueryCommissionDto,
    @Req() req: any,
  ) {
    return this.commissionsService.getAgentCommissions(agentId, req.user.tenantId, query);
  }
}
