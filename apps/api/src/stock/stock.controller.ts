import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
import {
  AjustementStockDto,
  CreerArticleDto,
  EntreeStockDto,
  ModifierArticleDto,
  SortieStockDto,
} from './dto/article-stock.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleType } from '../common/enums/role.enum';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('Stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // ARTICLES STOCK (modèle ArticleStock simplifié)
  // Note : routes statiques (/stats, /products, /inventory…) AVANT /:id
  // ═══════════════════════════════════════════════════════════════════════════

  @Get()
  @ApiOperation({ summary: 'Liste des articles en stock' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'categorie', required: false })
  @ApiQuery({ name: 'alerteSeulement', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  listerArticles(
    @CurrentUser() user: CurrentUserData,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('categorie') categorie?: string,
    @Query('alerteSeulement') alerteSeulement?: string,
    @Query('search') search?: string,
  ) {
    return this.stockService.listerArticles(user.tenantId, {
      page,
      limit,
      categorie,
      alerteSeulement: alerteSeulement === 'true',
      search,
    });
  }

  @Post()
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Créer un article en stock' })
  @HttpCode(HttpStatus.CREATED)
  creerArticle(@Body() dto: CreerArticleDto, @CurrentUser() user: CurrentUserData) {
    return this.stockService.creerArticle(user.tenantId, dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques globales du stock' })
  statsStock(@CurrentUser() user: CurrentUserData) {
    return this.stockService.statsStock(user.tenantId);
  }

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
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Ajouter un produit au catalogue' })
  @ApiResponse({ status: 201 })
  @HttpCode(HttpStatus.CREATED)
  createProduct(@Body() dto: CreateProductDto, @CurrentUser() user: CurrentUserData) {
    return this.stockService.createProduct(dto, user.tenantId);
  }

  @Patch('products/:id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
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
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Entrée stock' })
  @HttpCode(HttpStatus.CREATED)
  stockIn(@Body() dto: StockMovementDto, @CurrentUser() user: CurrentUserData) {
    return this.stockService.stockIn(dto, user.tenantId, user.id);
  }

  @Post('movements/out')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
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
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
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

  // ─── Routes dynamiques /:id — APRÈS toutes les routes statiques ─────────────
  // Important : NestJS matche en ordre de déclaration. `:id` doit être déclaré
  // après toutes les routes avec un segment fixe pour éviter que `products`,
  // `inventory`, `movements`, etc. soient capturés par ce paramètre générique.

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un article' })
  getArticle(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.stockService.getArticle(id, user.tenantId);
  }

  @Put(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Modifier un article' })
  modifierArticle(
    @Param('id') id: string,
    @Body() dto: ModifierArticleDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.stockService.modifierArticle(id, user.tenantId, dto);
  }

  @Post(':id/entree')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Entrée de stock' })
  @HttpCode(HttpStatus.CREATED)
  entreeStock(
    @Param('id') id: string,
    @Body() dto: EntreeStockDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.stockService.entree(id, user.tenantId, dto, user.id);
  }

  @Post(':id/sortie')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Sortie de stock' })
  @HttpCode(HttpStatus.CREATED)
  sortieStock(
    @Param('id') id: string,
    @Body() dto: SortieStockDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.stockService.sortie(id, user.tenantId, dto, user.id);
  }

  @Post(':id/ajustement')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Ajustement d\'inventaire' })
  @HttpCode(HttpStatus.CREATED)
  ajustementStock(
    @Param('id') id: string,
    @Body() dto: AjustementStockDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.stockService.ajustement(id, user.tenantId, dto, user.id);
  }

  @Get(':id/mouvements')
  @ApiOperation({ summary: 'Historique des mouvements d\'un article' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  historiqueMouvements(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.stockService.historiqueMovements(id, user.tenantId, { page, limit });
  }
}
