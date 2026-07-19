import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
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

// ─── In-memory stores ─────────────────────────────────────────────────────────

const products: IProduct[] = [];
const inventory: Map<string, IInventoryItem> = new Map(); // key: `${tenantId}-${productId}-${agencyId}`
const movements: IStockMovement[] = [];
const suppliers: ISupplier[] = [];
const purchaseOrders: IPurchaseOrder[] = [];

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  // ─── Produits ───────────────────────────────────────────────────────────────

  createProduct(dto: CreateProductDto, tenantId: string): IProduct {
    const product: IProduct = {
      id: uuidv4(),
      tenantId,
      name: dto.name,
      sku: dto.sku ?? `SKU-${Date.now()}`,
      category: dto.category,
      description: dto.description,
      unitPrice: dto.unitPrice,
      alertThreshold: dto.alertThreshold ?? 10,
      supplierId: dto.supplierId,
      unit: dto.unit ?? 'unité',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    products.push(product);
    this.logger.log(`Produit créé: ${product.name} (${product.sku})`);
    return product;
  }

  findAllProducts(
    tenantId: string,
    page?: number,
    limit?: number,
    category?: ProductCategory,
    search?: string,
  ) {
    let data = products.filter((p) => p.tenantId === tenantId && p.isActive);
    if (category) data = data.filter((p) => p.category === category);
    if (search) {
      const s = search.toLowerCase();
      data = data.filter((p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
    }
    const total = data.length;
    const { page: p, limit: l } = pagination(page, limit, 20);
    return { data: data.slice((p - 1) * l, p * l), total, page: p, limit: l };
  }

  findProduct(id: string, tenantId: string): IProduct {
    const p = products.find((p) => p.id === id && p.tenantId === tenantId);
    if (!p) throw new NotFoundException(`Produit ${id} introuvable`);
    return p;
  }

  updateProduct(id: string, dto: Partial<CreateProductDto>, tenantId: string): IProduct {
    const p = this.findProduct(id, tenantId);
    Object.assign(p, dto, { updatedAt: new Date() });
    return p;
  }

  // ─── Inventaire ─────────────────────────────────────────────────────────────

  getInventory(tenantId: string, agencyId?: string, page?: number, limit?: number) {
    let items = Array.from(inventory.values()).filter((i) => i.tenantId === tenantId);
    if (agencyId) items = items.filter((i) => i.agencyId === agencyId);

    const total = items.length;
    const { page: p, limit: l } = pagination(page, limit, 50);
    const paginated = items.slice((p - 1) * l, p * l);

    // Attacher produit
    const enriched = paginated.map((item) => ({
      ...item,
      product: products.find((prod) => prod.id === item.productId),
    }));

    return { data: enriched, total, page: p, limit: l };
  }

  private getOrCreateInventory(tenantId: string, productId: string, agencyId: string): IInventoryItem {
    const key = `${tenantId}-${productId}-${agencyId}`;
    if (!inventory.has(key)) {
      const product = this.findProduct(productId, tenantId);
      inventory.set(key, {
        productId,
        agencyId,
        tenantId,
        quantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        valorisation: 0,
        lastMovementAt: new Date(),
      });
    }
    return inventory.get(key)!;
  }

  // ─── Mouvements ─────────────────────────────────────────────────────────────

  stockIn(dto: StockMovementDto, tenantId: string, userId: string): IStockMovement {
    const product = this.findProduct(dto.productId, tenantId);
    const inv = this.getOrCreateInventory(tenantId, dto.productId, dto.agencyId);

    inv.quantity += dto.quantity;
    inv.availableQuantity = inv.quantity - inv.reservedQuantity;
    inv.valorisation = inv.quantity * product.unitPrice;
    inv.lastMovementAt = new Date();

    const movement: IStockMovement = {
      id: uuidv4(),
      tenantId,
      productId: dto.productId,
      agencyId: dto.agencyId,
      type: MovementType.IN,
      quantity: dto.quantity,
      reason: dto.reason,
      notes: dto.notes,
      reference: dto.reference,
      performedBy: userId,
      createdAt: new Date(),
    };
    movements.push(movement);
    this.logger.log(`Entrée stock: +${dto.quantity} ${product.name} | Agence ${dto.agencyId}`);
    return movement;
  }

  stockOut(dto: StockMovementDto, tenantId: string, userId: string): IStockMovement {
    const product = this.findProduct(dto.productId, tenantId);
    const inv = this.getOrCreateInventory(tenantId, dto.productId, dto.agencyId);

    if (inv.availableQuantity < dto.quantity) {
      throw new BadRequestException(
        `Stock insuffisant: ${inv.availableQuantity} disponible(s), ${dto.quantity} demandé(s)`,
      );
    }

    inv.quantity -= dto.quantity;
    inv.availableQuantity = inv.quantity - inv.reservedQuantity;
    inv.valorisation = inv.quantity * product.unitPrice;
    inv.lastMovementAt = new Date();

    const movement: IStockMovement = {
      id: uuidv4(),
      tenantId,
      productId: dto.productId,
      agencyId: dto.agencyId,
      type: MovementType.OUT,
      quantity: dto.quantity,
      reason: dto.reason,
      notes: dto.notes,
      reference: dto.reference,
      performedBy: userId,
      createdAt: new Date(),
    };
    movements.push(movement);
    this.logger.log(`Sortie stock: -${dto.quantity} ${product.name} | Agence ${dto.agencyId}`);
    return movement;
  }

  getMovements(
    tenantId: string,
    page?: number,
    limit?: number,
    productId?: string,
    agencyId?: string,
  ) {
    let data = movements.filter((m) => m.tenantId === tenantId);
    if (productId) data = data.filter((m) => m.productId === productId);
    if (agencyId) data = data.filter((m) => m.agencyId === agencyId);
    data = data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = data.length;
    const { page: p, limit: l } = pagination(page, limit, 50);
    return { data: data.slice((p - 1) * l, p * l), total, page: p, limit: l };
  }

  // ─── Alertes stock bas ───────────────────────────────────────────────────────

  getStockAlerts(tenantId: string) {
    const alerts: Array<{
      productId: string;
      productName: string;
      agencyId: string;
      currentQuantity: number;
      threshold: number;
      severity: string;
    }> = [];

    for (const inv of inventory.values()) {
      if (inv.tenantId !== tenantId) continue;
      const product = products.find((p) => p.id === inv.productId);
      if (!product) continue;

      if (inv.availableQuantity <= product.alertThreshold) {
        alerts.push({
          productId: inv.productId,
          productName: product.name,
          agencyId: inv.agencyId,
          currentQuantity: inv.availableQuantity,
          threshold: product.alertThreshold,
          severity: inv.availableQuantity === 0 ? 'CRITICAL' : 'WARNING',
        });
      }
    }

    return alerts.sort((a, b) => a.currentQuantity - b.currentQuantity);
  }

  // ─── Fournisseurs ────────────────────────────────────────────────────────────

  getSuppliers(tenantId: string) {
    return suppliers.filter((s) => s.tenantId === tenantId && s.isActive);
  }

  // ─── Bons de commande ────────────────────────────────────────────────────────

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

  getStockValuation(tenantId: string) {
    let totalValue = 0;
    const byCategory: Record<string, number> = {};

    for (const inv of inventory.values()) {
      if (inv.tenantId !== tenantId) continue;
      const product = products.find((p) => p.id === inv.productId);
      if (!product) continue;

      const val = inv.quantity * product.unitPrice;
      totalValue += val;
      byCategory[product.category] = (byCategory[product.category] ?? 0) + val;
    }

    return { totalValue, byCategory };
  }
}
