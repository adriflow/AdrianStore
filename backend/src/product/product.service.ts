import { Injectable, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { randomBytes } from 'crypto';
import { basename, join } from 'path';
import { db } from '../db';
import { desc, eq } from 'drizzle-orm';
import { products } from './product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product.entity';
import { ProductResponseDto } from './dto/product-response.dto';
import { CurrencyType } from './currency-type.enum';
import { ProductType } from './product-type.enum';

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

  private transform(product: Product): ProductResponseDto {
    const imageUrls = this.parseImageUrls((product as any).imageUrls);
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
    };
  }

  async create(createProductDto: CreateProductDto & { imageUrl: string; imageUrls: string[] }): Promise<ProductResponseDto> {
    const newProduct = {
      id: generateUuidV7(),
      ...createProductDto,
      price: createProductDto.price.toString(),
      currency: createProductDto.currency || CurrencyType.CUP,
      acceptsTransfer: createProductDto.acceptsTransfer ?? true,
      imageUrls: JSON.stringify(createProductDto.imageUrls || (createProductDto.imageUrl ? [createProductDto.imageUrl] : [])),
    };

    const [product] = await db.insert(products).values(newProduct).returning();
    return this.transform(product);
  }

  async findAll(type?: string): Promise<ProductResponseDto[]> {
    const query = db.select().from(products);
    if (type && type !== 'all') {
      query.where(eq(products.type, type));
    }

    const productRows = await query.orderBy(desc(products.id));
    return productRows.map((product) => this.transform(product));
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto & { imageUrl?: string; imageUrls?: string[] },
  ): Promise<ProductResponseDto> {
    const existingProducts = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (existingProducts.length === 0) {
      throw new NotFoundException('Producto no encontrado');
    }

    const existingProduct = existingProducts[0];
    const updateData: Partial<Product> = {};

    if (updateProductDto.name !== undefined) {
      updateData.name = updateProductDto.name;
    }
    if (updateProductDto.description !== undefined) {
      updateData.description = updateProductDto.description;
    }
    if (updateProductDto.price !== undefined) {
      updateData.price = updateProductDto.price.toString();
    }
    if (updateProductDto.whatsapp !== undefined) {
      updateData.whatsapp = updateProductDto.whatsapp;
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
    for (const oldUrl of removed) {
      const oldFileName = basename(oldUrl);
      const oldFilePath = join(process.cwd(), 'uploads', oldFileName);
      await fs.unlink(oldFilePath).catch(() => null);
    }

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
  }

}
