import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { stores } from './store.schema';
import { products } from '../product/product.schema';
import { about } from '../about/about.schema';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { deleteImages } from '../security/uploads';
import { sanitizeText, sanitizePhone } from '../security/sanitize';

export interface Store {
  id: string;
  name: string;
  slug: string;
  username: string;
  password_hash: string;
  color: string;
  whatsapp_default: string;
  is_closed: boolean;
  priority: number | null;
  created_at: string;
}

export interface StorePublic {
  id: string;
  name: string;
  slug: string;
  color: string;
  whatsapp_default: string;
  is_closed: boolean;
  priority: number | null;
  created_at: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function toPublic(store: Store): StorePublic {
  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    color: store.color || '',
    whatsapp_default: store.whatsapp_default || '',
    is_closed: !!store.is_closed,
    priority: store.priority ?? null,
    created_at: store.created_at || '',
  };
}

@Injectable()
export class StoreService {
  async findAllAdmin(): Promise<(StorePublic & { username: string })[]> {
    const rows = await db.select().from(stores).orderBy(stores.created_at);
    return rows.map((row) => ({ ...toPublic(row as Store), username: (row as Store).username }));
  }

  async findAllPublic(): Promise<StorePublic[]> {
    const rows = await db.select().from(stores).where(eq(stores.is_closed, false)).orderBy(stores.created_at);
    return rows.map((row) => toPublic(row as Store));
  }

  async findById(id: string): Promise<Store | null> {
    const rows = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
    return rows.length ? (rows[0] as Store) : null;
  }

  async findBySlug(slug: string): Promise<Store | null> {
    const rows = await db.select().from(stores).where(eq(stores.slug, slug)).limit(1);
    return rows.length ? (rows[0] as Store) : null;
  }

  async findByUsername(username: string): Promise<Store | null> {
    const rows = await db.select().from(stores).where(eq(stores.username, username)).limit(1);
    return rows.length ? (rows[0] as Store) : null;
  }

  async create(data: {
    name: string;
    username: string;
    password: string;
  }): Promise<(StorePublic & { username: string })> {
    if (typeof data.password !== 'string' || data.password.length < 8 || data.password.length > 72) {
      throw new BadRequestException('La contraseña debe tener entre 8 y 72 caracteres');
    }
    const cleanName = sanitizeText(data.name, 255);
    if (!cleanName.trim()) {
      throw new BadRequestException('El nombre del negocio es obligatorio');
    }
    const cleanUsername = sanitizeText(data.username.trim(), 64);
    if (!cleanUsername) {
      throw new BadRequestException('El usuario del negocio es obligatorio');
    }

    let slug = slugify(cleanName);
    if (!slug) {
      slug = 'tienda-' + uuidv4().slice(0, 8);
    }
    const existingSlug = await this.findBySlug(slug);
    if (existingSlug) {
      slug = slug + '-' + uuidv4().slice(0, 6);
    }

    const existingUser = await this.findByUsername(cleanUsername);
    if (existingUser) {
      throw new ConflictException('Ese usuario ya está en uso');
    }

    const password_hash = await bcrypt.hash(data.password, 10);
    const store: Store = {
      id: uuidv4(),
      name: cleanName,
      slug,
      username: cleanUsername,
      password_hash,
      color: '',
      whatsapp_default: '',
      is_closed: false,
      priority: null,
      created_at: new Date().toISOString(),
    };
    await db.insert(stores).values(store);
    return { ...toPublic(store), username: store.username };
  }

  async updateAdmin(
    id: string,
    data: { color?: string; whatsappDefault?: string; priority?: number | null },
  ): Promise<StorePublic> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException('Negocio no encontrado');

    const updateData: Partial<Store> = {};
    if (data.color !== undefined) updateData.color = sanitizeText(data.color, 20);
    if (data.whatsappDefault !== undefined) updateData.whatsapp_default = sanitizePhone(data.whatsappDefault || '');
    if (data.priority !== undefined) {
      if (data.priority === null) {
        updateData.priority = null;
      } else {
        const p = Number(data.priority);
        if (Number.isInteger(p) && p >= 1) {
          updateData.priority = p;
        }
      }
    }

    if (Object.keys(updateData).length > 0) {
      const [updated] = await db.update(stores).set(updateData).where(eq(stores.id, id)).returning();
      return toPublic(updated as Store);
    }
    return toPublic(existing);
  }

  async setClosed(id: string, isClosed: boolean): Promise<StorePublic> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException('Negocio no encontrado');
    const [updated] = await db.update(stores).set({ is_closed: isClosed }).where(eq(stores.id, id)).returning();
    return toPublic(updated as Store);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException('Negocio no encontrado');

    // Elimina imágenes de sus productos
    const storeProducts = await db.select().from(products).where(eq(products.storeId, id));
    for (const p of storeProducts) {
      const urls: string[] = [];
      try {
        const parsed = JSON.parse((p as any).imageUrls || '[]');
        if (Array.isArray(parsed)) urls.push(...parsed);
      } catch {
        /* ignore */
      }
      if (urls.length) await deleteImages(urls);
    }

    await db.delete(products).where(eq(products.storeId, id));
    await db.delete(about).where(eq(about.storeId, id));
    await db.delete(stores).where(eq(stores.id, id));
  }

  async changeCredentials(
    id: string,
    data: { username?: string; password?: string },
  ): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException('Negocio no encontrado');

    const updateData: Partial<Store> = {};
    if (data.username !== undefined) {
      const cleanUsername = sanitizeText(data.username.trim(), 64);
      if (!cleanUsername) throw new BadRequestException('El usuario es obligatorio');
      const conflict = await this.findByUsername(cleanUsername);
      if (conflict && conflict.id !== id) {
        throw new ConflictException('Ese usuario ya está en uso');
      }
      updateData.username = cleanUsername;
    }
    if (data.password !== undefined && data.password !== '') {
      if (typeof data.password !== 'string' || data.password.length < 8 || data.password.length > 72) {
        throw new BadRequestException('La contraseña debe tener entre 8 y 72 caracteres');
      }
      updateData.password_hash = await bcrypt.hash(data.password, 10);
    }

    if (Object.keys(updateData).length > 0) {
      await db.update(stores).set(updateData).where(eq(stores.id, id));
    }
  }
}
