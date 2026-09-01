import { Injectable } from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../db';
import { about } from './about.schema';
import { sanitizeText } from '../security/sanitize';
import { deleteImages } from '../security/uploads';
import { v4 as uuidv4 } from 'uuid';

const ABOUT_ID = 'about';

export interface AboutInfo {
  content: string;
  updatedAt: string;
  imageUrl?: string;
}

@Injectable()
export class AboutService {
  // storeId: null u omitido => about global (superadmin). storeId definido => about del negocio.
  async getAbout(storeId?: string | null): Promise<AboutInfo> {
    let rows;
    if (storeId) {
      rows = await db.select().from(about).where(eq(about.storeId, storeId)).limit(1);
    } else {
      rows = await db
        .select()
        .from(about)
        .where(and(eq(about.id, ABOUT_ID), isNull(about.storeId)))
        .limit(1);
    }
    if (rows.length === 0) {
      return { content: '', updatedAt: '' };
    }
    return {
      content: rows[0].content || '',
      updatedAt: rows[0].updatedAt || '',
      imageUrl: (rows[0] as any).imageUrl || '',
    };
  }

  async updateAbout(content: string, imageUrl?: string, storeId?: string | null): Promise<AboutInfo> {
    const cleanContent = sanitizeText(content, 10000);
    const updatedAt = new Date().toISOString();

    let existing;
    if (storeId) {
      existing = await db.select().from(about).where(eq(about.storeId, storeId)).limit(1);
    } else {
      existing = await db
        .select()
        .from(about)
        .where(and(eq(about.id, ABOUT_ID), isNull(about.storeId)))
        .limit(1);
    }

    const currentImageUrl = existing.length > 0 ? (existing[0] as any).imageUrl || '' : '';
    const nextImageUrl = imageUrl ?? currentImageUrl;

    if (existing.length === 0) {
      if (storeId) {
        await db.insert(about).values({
          id: uuidv4(),
          content: cleanContent,
          updatedAt,
          imageUrl: nextImageUrl,
          storeId,
        } as any);
      } else {
        await db.insert(about).values({
          id: ABOUT_ID,
          content: cleanContent,
          updatedAt,
          imageUrl: nextImageUrl,
          storeId: null,
        } as any);
      }
    } else {
      if (storeId) {
        await db.update(about).set({ content: cleanContent, updatedAt, imageUrl: nextImageUrl }).where(eq(about.storeId, storeId));
      } else {
        await db
          .update(about)
          .set({ content: cleanContent, updatedAt, imageUrl: nextImageUrl })
          .where(and(eq(about.id, ABOUT_ID), isNull(about.storeId)));
      }
    }

    // Elimina la foto anterior si se reemplazó
    if (imageUrl && currentImageUrl && imageUrl !== currentImageUrl) {
      await deleteImages([currentImageUrl]);
    }

    return { content: cleanContent, updatedAt, imageUrl: nextImageUrl };
  }
}
