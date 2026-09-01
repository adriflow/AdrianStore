import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { db } from '../db';
import { desc, eq } from 'drizzle-orm';
import { products } from './product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product.entity';
import { ProductResponseDto } from './dto/product-response.dto';
import { CurrencyType } from './currency-type.enum';
import { ProductType } from './product-type.enum';
import { ProvinceType } from './province.enum';
import { sanitizeText, sanitizePhone } from '../security/sanitize';
import { deleteImages } from '../security/uploads';
import { StoreService } from '../store/store.service';

function generateUuidV7(): string {
  const timestampMs = BigInt(Date.now());
  const bytes = new Uint8Array(16);
  const timestampBytes = Buffer.alloc(8);

  timestampBytes.writeBigUInt64BE(timestampMs, 0);
  bytes[0] = timestampBytes[2];
  bytes[1] = timestampBytes[3];
  bytes[2] = timestampBytes[4];
  bytes[3] = timestampBytes[5];
  bytes[4] = timestampBytes[6];
  bytes[5] = timestampBytes[7];

  const random = randomBytes(10);
  bytes.set(random, 6);

  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Buffer.from(bytes).toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

@Injectable()
export class ProductService {
  constructor(private readonly storeService: StoreService) {}

  private parseImageUrls(value: string[] | string | null | undefined): string[] {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string' && value) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch {
        return [value];
      }
    }
    return [];
  }

  private async transform(product: Product): Promise<ProductResponseDto> {
    const imageUrls = this.parseImageUrls((product as any).imageUrls);
    const storeId = (product as any).storeId || null;
    let storeName: string | undefined;
    if (storeId) {
      const store = await this.storeService.findById(storeId);
      if (store && !store.is_closed) {
        storeName = store.name;
      }
    }
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      imageUrl: product.imageUrl || imageUrls[0] || '',
      imageUrls: imageUrls.length ? imageUrls : product.imageUrl ? [product.imageUrl] : [],
      currency: (product as any).currency || CurrencyType.CUP,
      acceptsTransfer: (product as any).acceptsTransfer ?? true,
      whatsapp: product.whatsapp || '',
      type: (product.type || 'otros') as ProductType,
      province: ((product as any).province || ProvinceType.CAMAGUEY) as ProvinceType,
      storeId,
      storeName,
      isPublic: (product as any).isPublic ?? true,
    };
  }

  async create(createProductDto: CreateProductDto & { imageUrl: string; imageUrls: string[]; storeId?: string }): Promise<ProductResponseDto> {
    const storeId = createProductDto.storeId || null;
    const newProduct = {
      id: generateUuidV7(),
      name: sanitizeText(createProductDto.name, 120),
      description: sanitizeText(createProductDto.description || '', 2000),
      whatsapp: sanitizePhone(createProductDto.whatsapp || ''),
      price: createProductDto.price.toString(),
      currency: createProductDto.currency || CurrencyType.CUP,
      acceptsTransfer: createProductDto.acceptsTransfer ?? true,
      province: createProductDto.province || ProvinceType.CAMAGUEY,
      imageUrl: createProductDto.imageUrl || '',
      imageUrls: JSON.stringify(createProductDto.imageUrls || (createProductDto.imageUrl ? [createProductDto.imageUrl] : [])),
      storeId,
      isPublic: createProductDto.isPublic ?? true,
    };
    const [product] = await db.insert(products).values(newProduct as any).returning();
    return this.transform(product);
  }

  // Catálogo público: productos públicos de superadmin y de negocios abiertos, con orden por prioridad.
  async findAll(type?: string): Promise<ProductResponseDto[]> {
    const rows = await db.select().from(products);
    const filtered = rows.filter((p) => (p as any).isPublic !== false);

    // Mapear prioridad y fecha por tienda para ordenar
    const storeMap = new Map<string, { priority: number | null; created_at: string; is_closed: boolean }>();
    const allStores = await this.storeService.findAllAdmin();
    for (const s of allStores) {
      storeMap.set(s.id, { priority: s.priority, created_at: s.created_at, is_closed: s.is_closed });
    }

    const transformed = await Promise.all(filtered.map((p) => this.transform(p)));

    return transformed
      .filter((p) => {
        if (!p.storeId) return true;
        const info = storeMap.get(p.storeId);
        return info && !info.is_closed;
      })
      .sort((a, b) => {
        const aStore = a.storeId ? storeMap.get(a.storeId) : null;
        const bStore = b.storeId ? storeMap.get(b.storeId) : null;
        // prioridad null (negocio sin prioridad) => al final. superadmin (sin store) => 5.
        const aRank: number = aStore ? (aStore.priority == null ? 999 : aStore.priority) : 5;
        const bRank: number = bStore ? (bStore.priority == null ? 999 : bStore.priority) : 5;
        if (aRank !== bRank) return aRank - bRank;
        // mismo rango: por más reciente creado
        return b.id.localeCompare(a.id);
      });
  }

  // Productos de un negocio (usado en su sección/entorno): incluye todos sus productos (públicos y no).
  async findByStore(storeId: string): Promise<ProductResponseDto[]> {
    const rows = await db.select().from(products).where(eq(products.storeId, storeId));
    const transformed = await Promise.all(rows.map((p) => this.transform(p)));
    return transformed.sort((a, b) => b.id.localeCompare(a.id));
  }

  // Productos de un negocio visibles para invitado dentro de la sección Negocios
  // (productos públicos y no públicos, mientras el negocio esté abierto).
  async findByStorePublic(storeId: string): Promise<ProductResponseDto[]> {
    const store = await this.storeService.findById(storeId);
    if (!store || store.is_closed) {
      return [];
    }
    return this.findByStore(storeId);
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto & { imageUrl?: string; imageUrls?: string[]; storeId?: string; isPublic?: boolean },
  ): Promise<ProductResponseDto> {
    const existingProducts = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (existingProducts.length === 0) {
      throw new NotFoundException('Producto no encontrado');
    }

    const existingProduct = existingProducts[0];
    const updateData: Partial<Product> = {};

    if (updateProductDto.name !== undefined) {
      updateData.name = sanitizeText(updateProductDto.name, 120);
    }
    if (updateProductDto.description !== undefined) {
      updateData.description = sanitizeText(updateProductDto.description, 2000);
    }
    if (updateProductDto.price !== undefined) {
      updateData.price = updateProductDto.price.toString();
    }
    if (updateProductDto.whatsapp !== undefined) {
      updateData.whatsapp = sanitizePhone(updateProductDto.whatsapp);
    }
    if (updateProductDto.type !== undefined) {
      updateData.type = updateProductDto.type;
    }
    if (updateProductDto.currency !== undefined) {
      updateData.currency = updateProductDto.currency;
    }
    if (updateProductDto.acceptsTransfer !== undefined) {
      updateData.acceptsTransfer = updateProductDto.acceptsTransfer;
    }
    if (updateProductDto.province !== undefined) {
      updateData.province = updateProductDto.province;
    }
    if (updateProductDto.isPublic !== undefined) {
      (updateData as any).isPublic = updateProductDto.isPublic;
    }

    const nextImageUrl = updateProductDto.imageUrl ?? existingProduct.imageUrl;
    const nextImageUrls = updateProductDto.imageUrls
      ? JSON.stringify(updateProductDto.imageUrls)
      : ((existingProduct as any).imageUrls ?? JSON.stringify(nextImageUrl ? [nextImageUrl] : []));

    const [product] = await db
      .update(products)
      .set({
        ...updateData,
        imageUrl: nextImageUrl,
        imageUrls: nextImageUrls,
      })
      .where(eq(products.id, id))
      .returning();

    const oldImageUrls = this.parseImageUrls((existingProduct as any).imageUrls);
    const removed = updateProductDto.imageUrl
      ? oldImageUrls.filter((url) => !updateProductDto.imageUrls?.includes(url))
      : [];
    await deleteImages(removed);

    return this.transform(product);
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    const productRows = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (productRows.length === 0) {
      throw new NotFoundException('Producto no encontrado');
    }
    return this.transform(productRows[0]);
  }

  async delete(id: string): Promise<void> {
    const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (rows.length === 0) {
      throw new NotFoundException('Producto no encontrado');
    }
    await db.delete(products).where(eq(products.id, id));
    await deleteImages(this.parseImageUrls((rows[0] as any).imageUrls));
  }
}
