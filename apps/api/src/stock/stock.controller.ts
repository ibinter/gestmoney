import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { StockService } from './stock.service';
import { CreateProductDto, ProductCategory } from './dto/create-product.dto';
import { StockMovementDto } from './dto/stock-movement.dto';
import { PurchaseOrderDto } from './dto/purchase-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('Stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  // ─── Produits ───────────────────────────────────────────────────────────────

  @Get('products')
  @ApiOperation({ summary: 'Catalogue produits (SIM, terminaux, accessoires)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, enum: ProductCategory })
  @ApiQuery({ name: 'search', required: false })
  findProducts(
    @CurrentUser() user: CurrentUserData,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('category') category?: ProductCategory,
    @Query('search') search?: string,
  ) {
    return this.stockService.findAllProducts(user.tenantId, page, limit, category, search);
  }

  @Post('products')
  @ApiOperation({ summary: 'Ajouter un produit au catalogue' })
  @ApiResponse({ status: 201 })
  @HttpCode(HttpStatus.CREATED)
  createProduct(@Body() dto: CreateProductDto, @CurrentUser() user: CurrentUserData) {
    return this.stockService.createProduct(dto, user.tenantId);
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Modifier un produit' })
  updateProduct(
    @Param('id') id: string,
    @Body() dto: Partial<CreateProductDto>,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.stockService.updateProduct(id, dto, user.tenantId);
  }

  // ─── Inventaire ─────────────────────────────────────────────────────────────

  @Get('inventory')
  @ApiOperation({ summary: 'État du stock par agence' })
  @ApiQuery({ name: 'agencyId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getInventory(
    @CurrentUser() user: CurrentUserData,
    @Query('agencyId') agencyId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.stockService.getInventory(user.tenantId, agencyId, page, limit);
  }

  // ─── Mouvements ─────────────────────────────────────────────────────────────

  @Post('movements/in')
  @ApiOperation({ summary: 'Entrée stock' })
  @HttpCode(HttpStatus.CREATED)
  stockIn(@Body() dto: StockMovementDto, @CurrentUser() user: CurrentUserData) {
    return this.stockService.stockIn(dto, user.tenantId, user.id);
  }

  @Post('movements/out')
  @ApiOperation({ summary: 'Sortie stock' })
  @HttpCode(HttpStatus.CREATED)
  stockOut(@Body() dto: StockMovementDto, @CurrentUser() user: CurrentUserData) {
    return this.stockService.stockOut(dto, user.tenantId, user.id);
  }

  @Get('movements')
  @ApiOperation({ summary: 'Historique des mouvements de stock' })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'agencyId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMovements(
    @CurrentUser() user: CurrentUserData,
    @Query('productId') productId?: string,
    @Query('agencyId') agencyId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.stockService.getMovements(user.tenantId, page, limit, productId, agencyId);
  }

  // ─── Alertes ────────────────────────────────────────────────────────────────

  @Get('alerts')
  @ApiOperation({ summary: 'Alertes stock bas (produits sous le seuil)' })
  getAlerts(@CurrentUser() user: CurrentUserData) {
    return this.stockService.getStockAlerts(user.tenantId);
  }

  // ─── Fournisseurs ────────────────────────────────────────────────────────────

  @Get('suppliers')
  @ApiOperation({ summary: 'Liste des fournisseurs' })
  getSuppliers(@CurrentUser() user: CurrentUserData) {
    return this.stockService.getSuppliers(user.tenantId);
  }

  // ─── Bons de commande ────────────────────────────────────────────────────────

  @Post('purchase-orders')
  @ApiOperation({ summary: 'Créer un bon de commande' })
  @HttpCode(HttpStatus.CREATED)
  createPurchaseOrder(@Body() dto: PurchaseOrderDto, @CurrentUser() user: CurrentUserData) {
    return this.stockService.createPurchaseOrder(dto, user.tenantId, user.id);
  }

  @Get('purchase-orders')
  @ApiOperation({ summary: 'Liste des bons de commande' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getPurchaseOrders(
    @CurrentUser() user: CurrentUserData,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.stockService.getPurchaseOrders(user.tenantId, page, limit);
  }

  @Get('valuation')
  @ApiOperation({ summary: 'Valorisation totale du stock' })
  getValuation(@CurrentUser() user: CurrentUserData) {
    return this.stockService.getStockValuation(user.tenantId);
  }
}
