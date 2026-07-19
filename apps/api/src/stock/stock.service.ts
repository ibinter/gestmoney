import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Prisma, StockMovementType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, ProductCategory } from './dto/create-product.dto';
import { MovementReason, MovementType, StockMovementDto } from './dto/stock-movement.dto';
import { PurchaseOrderDto } from './dto/purchase-order.dto';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IProduct {
  id: string;
  tenantId: string;
  name: string;
  sku: string;
  category: ProductCategory;
  description?: string;
  unitPrice: number;
  alertThreshold: number;
  supplierId?: string;
  unit: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInventoryItem {
  productId: string;
  agencyId: string;
  tenantId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  valorisation: number;
  product?: IProduct;
  lastMovementAt?: Date;
}

export interface IStockMovement {
  id: string;
  tenantId: string;
  productId: string;
  agencyId: string;
  type: MovementType;
  quantity: number;
  reason: MovementReason;
  notes?: string;
  reference?: string;
  performedBy?: string;
  createdAt: Date;
}

export interface ISupplier {
  id: string;
  tenantId: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface IPurchaseOrder {
  id: string;
  reference: string;
  tenantId: string;
  supplierId: string;
  agencyId: string;
  status: 'DRAFT' | 'SENT' | 'CONFIRMED' | 'RECEIVED' | 'CANCELLED';
  lines: Array<{ productId: string; quantity: number; unitPrice: number; totalPrice: number }>;
  totalAmount: number;
  expectedDeliveryDate?: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Normalise la pagination. Les valeurs par défaut d'un paramètre (`page = 1`)
 * ne s'appliquent qu'à `undefined` : un `null` les traverse et
 * `slice((null - 1) * null, null * null)` vaut `slice(0, 0)`, soit une liste
 * VIDE alors que `total` annonçait des éléments. C'est ce qui rendait
 * l'inventaire, les produits et les mouvements invisibles côté application.
 * On accepte donc aussi null, les chaînes et les valeurs hors bornes.
 */
function pagination(page: unknown, limit: unknown, limitParDefaut: number) {
  const p = Math.trunc(Number(page));
  const l = Math.trunc(Number(limit));
  return {
    page: Number.isFinite(p) && p > 0 ? p : 1,
    limit: Number.isFinite(l) && l > 0 ? Math.min(l, 500) : limitParDefaut,
  };
}

// ─── Stores en mémoire restants ───────────────────────────────────────────────
// ⚠️ Il n'existe AUCUN modèle Prisma pour les fournisseurs ni pour les bons de
// commande (voir packages/database/schema.prisma). Ces deux collections restent
// donc volatiles : elles sont perdues au redémarrage du conteneur. Elles
// devront être migrées le jour où les modèles `Supplier` / `PurchaseOrder`
// seront ajoutés au schéma. Produits, inventaire et mouvements, eux, sont
// désormais entièrement persistés en base.
const suppliers: ISupplier[] = [];
const purchaseOrders: IPurchaseOrder[] = [];

// ─── Helpers de conversion Prisma → contrat d'API ─────────────────────────────

/** Les `Decimal` Prisma doivent sortir en `number`, sinon le JSON renvoie des objets. */
function num(value: Prisma.Decimal | number | null | undefined): number {
  return value === null || value === undefined ? 0 : Number(value);
}

/**
 * `StockMovement` ne possède pas de colonne `reason` ni `notes`. On encode les
 * deux dans `description` sous la forme `MOTIF — notes` (le motif appartient à
 * un enum fermé, le décodage est donc sans ambiguïté). Évite une migration.
 */
const SEPARATEUR_NOTES = ' — ';

function encoderDescription(reason: MovementReason, notes?: string): string {
  return notes ? `${reason}${SEPARATEUR_NOTES}${notes}` : `${reason}`;
}

function decoderDescription(description: string | null): {
  reason: MovementReason;
  notes?: string;
} {
  const brut = description ?? '';
  const index = brut.indexOf(SEPARATEUR_NOTES);
  const motif = index === -1 ? brut : brut.slice(0, index);
  const notes = index === -1 ? undefined : brut.slice(index + SEPARATEUR_NOTES.length);
  const reason = (Object.values(MovementReason) as string[]).includes(motif)
    ? (motif as MovementReason)
    : MovementReason.INVENTORY;
  return { reason, notes: notes || undefined };
}

type ProductRow = {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  unit: string;
  unitPrice: Prisma.Decimal;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * `Product` n'a pas de colonne `alertThreshold` : le seuil vit dans
 * `Inventory.reorderLevel` (même sémantique). Le seuil « du produit » est celui
 * porté par la ligne d'inventaire par défaut (`agencyId = null`).
 * `supplierId` n'a pas non plus d'équivalent en base et reste donc absent.
 */
function toProduct(row: ProductRow, alertThreshold: number): IProduct {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    sku: row.code,
    category: row.category as ProductCategory,
    description: row.description ?? undefined,
    unitPrice: num(row.unitPrice),
    alertThreshold,
    unit: row.unit,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Seuils d'alerte (portés par Inventory.reorderLevel) ────────────────────

  /** Ligne d'inventaire « par défaut » d'un produit : porte le seuil du catalogue. */
  private async seuilDuProduit(tenantId: string, productId: string): Promise<number> {
    const defaut = await this.prisma.inventory.findFirst({
      where: { tenantId, productId, agencyId: null },
      select: { reorderLevel: true },
    });
    return num(defaut?.reorderLevel);
  }

  private async seuilsDesProduits(
    tenantId: string,
    productIds: string[],
  ): Promise<Map<string, number>> {
    if (productIds.length === 0) return new Map();
    const lignes = await this.prisma.inventory.findMany({
      where: { tenantId, agencyId: null, productId: { in: productIds } },
      select: { productId: true, reorderLevel: true },
    });
    return new Map(lignes.map((l) => [l.productId, num(l.reorderLevel)]));
  }

  // ─── Produits ───────────────────────────────────────────────────────────────

  async createProduct(dto: CreateProductDto, tenantId: string): Promise<IProduct> {
    const alertThreshold = dto.alertThreshold ?? 10;
    const row = await this.prisma.product.create({
      data: {
        tenantId,
        code: dto.sku ?? `SKU-${Date.now()}`,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        unit: dto.unit ?? 'unité',
        unitPrice: new Prisma.Decimal(dto.unitPrice),
        isActive: true,
      },
    });

    // Ligne d'inventaire par défaut : porte le seuil d'alerte du catalogue.
    await this.prisma.inventory.create({
      data: {
        tenantId,
        productId: row.id,
        agencyId: null,
        quantity: new Prisma.Decimal(0),
        reservedQty: new Prisma.Decimal(0),
        reorderLevel: new Prisma.Decimal(alertThreshold),
      },
    });

    this.logger.log(`Produit créé: ${row.name} (${row.code})`);
    return toProduct(row, alertThreshold);
  }

  async findAllProducts(
    tenantId: string,
    page?: number,
    limit?: number,
    category?: ProductCategory,
    search?: string,
  ) {
    const where: Prisma.ProductWhereInput = { tenantId, isActive: true };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const { page: p, limit: l } = pagination(page, limit, 20);
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    const seuils = await this.seuilsDesProduits(
      tenantId,
      rows.map((r) => r.id),
    );

    return {
      data: rows.map((r) => toProduct(r, seuils.get(r.id) ?? 0)),
      total,
      page: p,
      limit: l,
    };
  }

  async findProduct(id: string, tenantId: string): Promise<IProduct> {
    const row = await this.prisma.product.findFirst({ where: { id, tenantId } });
    if (!row) throw new NotFoundException(`Produit ${id} introuvable`);
    return toProduct(row, await this.seuilDuProduit(tenantId, id));
  }

  async updateProduct(
    id: string,
    dto: Partial<CreateProductDto>,
    tenantId: string,
  ): Promise<IProduct> {
    const existant = await this.prisma.product.findFirst({ where: { id, tenantId } });
    if (!existant) throw new NotFoundException(`Produit ${id} introuvable`);

    const data: Prisma.ProductUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.sku !== undefined) data.code = dto.sku;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.unitPrice !== undefined) data.unitPrice = new Prisma.Decimal(dto.unitPrice);
    if (dto.unit !== undefined) data.unit = dto.unit;

    const row = await this.prisma.product.update({ where: { id }, data });

    if (dto.alertThreshold !== undefined) {
      // Le seuil est propagé à toutes les lignes d'inventaire du produit (défaut
      // + agences) pour rester cohérent avec les alertes calculées par agence.
      await this.prisma.inventory.updateMany({
        where: { tenantId, productId: id },
        data: { reorderLevel: new Prisma.Decimal(dto.alertThreshold) },
      });
    }

    return toProduct(row, await this.seuilDuProduit(tenantId, id));
  }

  // ─── Inventaire ─────────────────────────────────────────────────────────────

  async getInventory(tenantId: string, agencyId?: string, page?: number, limit?: number) {
    // `agencyId: null` = ligne technique portant le seuil catalogue, jamais listée.
    const where: Prisma.InventoryWhereInput = { tenantId, agencyId: { not: null } };
    if (agencyId) where.agencyId = agencyId;

    const { page: p, limit: l } = pagination(page, limit, 50);
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.inventory.count({ where }),
      this.prisma.inventory.findMany({
        where,
        include: { product: true },
        orderBy: { lastUpdatedAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    const data: IInventoryItem[] = rows.map((row) => {
      const quantity = num(row.quantity);
      const reservedQuantity = num(row.reservedQty);
      const unitPrice = num(row.product.unitPrice);
      return {
        productId: row.productId,
        agencyId: row.agencyId ?? '',
        tenantId: row.tenantId,
        quantity,
        reservedQuantity,
        availableQuantity: quantity - reservedQuantity,
        valorisation: quantity * unitPrice,
        lastMovementAt: row.lastUpdatedAt,
        product: toProduct(row.product, num(row.reorderLevel)),
      };
    });

    return { data, total, page: p, limit: l };
  }

  /** Récupère (ou crée) la ligne d'inventaire d'un couple produit/agence. */
  private async getOrCreateInventory(tenantId: string, productId: string, agencyId: string) {
    const existante = await this.prisma.inventory.findFirst({
      where: { tenantId, productId, agencyId },
    });
    if (existante) return existante;

    return this.prisma.inventory.create({
      data: {
        tenantId,
        productId,
        agencyId,
        quantity: new Prisma.Decimal(0),
        reservedQty: new Prisma.Decimal(0),
        // Hérite du seuil défini sur le catalogue.
        reorderLevel: new Prisma.Decimal(await this.seuilDuProduit(tenantId, productId)),
      },
    });
  }

  // ─── Mouvements ─────────────────────────────────────────────────────────────

  async stockIn(dto: StockMovementDto, tenantId: string, userId: string): Promise<IStockMovement> {
    const product = await this.findProduct(dto.productId, tenantId);
    const inv = await this.getOrCreateInventory(tenantId, dto.productId, dto.agencyId);

    const [, mouvement] = await this.prisma.$transaction([
      this.prisma.inventory.update({
        where: { id: inv.id },
        data: {
          quantity: { increment: new Prisma.Decimal(dto.quantity) },
          lastUpdatedAt: new Date(),
        },
      }),
      this.prisma.stockMovement.create({
        data: {
          tenantId,
          productId: dto.productId,
          agencyId: dto.agencyId,
          type: StockMovementType.IN,
          quantity: new Prisma.Decimal(dto.quantity),
          unitPrice: new Prisma.Decimal(product.unitPrice),
          totalValue: new Prisma.Decimal(dto.quantity * product.unitPrice),
          reference: dto.reference,
          description: encoderDescription(dto.reason, dto.notes),
          performedById: userId,
        },
      }),
    ]);

    this.logger.log(`Entrée stock: +${dto.quantity} ${product.name} | Agence ${dto.agencyId}`);
    return this.toMovement(mouvement);
  }

  async stockOut(dto: StockMovementDto, tenantId: string, userId: string): Promise<IStockMovement> {
    const product = await this.findProduct(dto.productId, tenantId);
    const inv = await this.getOrCreateInventory(tenantId, dto.productId, dto.agencyId);

    const availableQuantity = num(inv.quantity) - num(inv.reservedQty);
    if (availableQuantity < dto.quantity) {
      throw new BadRequestException(
        `Stock insuffisant: ${availableQuantity} disponible(s), ${dto.quantity} demandé(s)`,
      );
    }

    const [, mouvement] = await this.prisma.$transaction([
      this.prisma.inventory.update({
        where: { id: inv.id },
        data: {
          quantity: { decrement: new Prisma.Decimal(dto.quantity) },
          lastUpdatedAt: new Date(),
        },
      }),
      this.prisma.stockMovement.create({
        data: {
          tenantId,
          productId: dto.productId,
          agencyId: dto.agencyId,
          type: StockMovementType.OUT,
          quantity: new Prisma.Decimal(dto.quantity),
          unitPrice: new Prisma.Decimal(product.unitPrice),
          totalValue: new Prisma.Decimal(dto.quantity * product.unitPrice),
          reference: dto.reference,
          description: encoderDescription(dto.reason, dto.notes),
          performedById: userId,
        },
      }),
    ]);

    this.logger.log(`Sortie stock: -${dto.quantity} ${product.name} | Agence ${dto.agencyId}`);
    return this.toMovement(mouvement);
  }

  private toMovement(row: {
    id: string;
    tenantId: string;
    productId: string;
    agencyId: string | null;
    type: StockMovementType;
    quantity: Prisma.Decimal;
    reference: string | null;
    description: string | null;
    performedById: string;
    createdAt: Date;
  }): IStockMovement {
    const { reason, notes } = decoderDescription(row.description);
    return {
      id: row.id,
      tenantId: row.tenantId,
      productId: row.productId,
      agencyId: row.agencyId ?? '',
      type: row.type as unknown as MovementType,
      quantity: num(row.quantity),
      reason,
      notes,
      reference: row.reference ?? undefined,
      performedBy: row.performedById,
      createdAt: row.createdAt,
    };
  }

  async getMovements(
    tenantId: string,
    page?: number,
    limit?: number,
    productId?: string,
    agencyId?: string,
  ) {
    const where: Prisma.StockMovementWhereInput = { tenantId };
    if (productId) where.productId = productId;
    if (agencyId) where.agencyId = agencyId;

    const { page: p, limit: l } = pagination(page, limit, 50);
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.stockMovement.count({ where }),
      this.prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    return { data: rows.map((r) => this.toMovement(r)), total, page: p, limit: l };
  }

  // ─── Alertes stock bas ───────────────────────────────────────────────────────

  async getStockAlerts(tenantId: string) {
    const rows = await this.prisma.inventory.findMany({
      where: { tenantId, agencyId: { not: null } },
      include: { product: true },
    });

    const alerts = rows
      .map((row) => {
        const availableQuantity = num(row.quantity) - num(row.reservedQty);
        return {
          productId: row.productId,
          productName: row.product.name,
          agencyId: row.agencyId ?? '',
          currentQuantity: availableQuantity,
          threshold: num(row.reorderLevel),
          severity: availableQuantity === 0 ? 'CRITICAL' : 'WARNING',
        };
      })
      .filter((a) => a.currentQuantity <= a.threshold);

    return alerts.sort((a, b) => a.currentQuantity - b.currentQuantity);
  }

  // ─── Fournisseurs ────────────────────────────────────────────────────────────
  // Non persistés : aucun modèle `Supplier` dans le schéma Prisma.

  getSuppliers(tenantId: string) {
    return suppliers.filter((s) => s.tenantId === tenantId && s.isActive);
  }

  // ─── Bons de commande ────────────────────────────────────────────────────────
  // Non persistés : aucun modèle `PurchaseOrder` dans le schéma Prisma.

  createPurchaseOrder(dto: PurchaseOrderDto, tenantId: string, userId: string): IPurchaseOrder {
    const lines = dto.lines.map((l) => ({
      ...l,
      totalPrice: l.quantity * l.unitPrice,
    }));
    const totalAmount = lines.reduce((sum, l) => sum + l.totalPrice, 0);

    const order: IPurchaseOrder = {
      id: uuidv4(),
      reference: `PO-${Date.now()}`,
      tenantId,
      supplierId: dto.supplierId,
      agencyId: dto.agencyId,
      status: 'DRAFT',
      lines,
      totalAmount,
      expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : undefined,
      notes: dto.notes,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    purchaseOrders.push(order);
    this.logger.log(`Bon de commande créé: ${order.reference} — ${totalAmount} XOF`);
    return order;
  }

  getPurchaseOrders(tenantId: string, page?: number, limit?: number) {
    const data = purchaseOrders
      .filter((o) => o.tenantId === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = data.length;
    const { page: p, limit: l } = pagination(page, limit, 20);
    return { data: data.slice((p - 1) * l, p * l), total, page: p, limit: l };
  }

  // ─── Valorisation ────────────────────────────────────────────────────────────

  async getStockValuation(tenantId: string) {
    const rows = await this.prisma.inventory.findMany({
      where: { tenantId, agencyId: { not: null } },
      include: { product: true },
    });

    let totalValue = 0;
    const byCategory: Record<string, number> = {};

    for (const row of rows) {
      const val = num(row.quantity) * num(row.product.unitPrice);
      totalValue += val;
      byCategory[row.product.category] = (byCategory[row.product.category] ?? 0) + val;
    }

    return { totalValue, byCategory };
  }
}
