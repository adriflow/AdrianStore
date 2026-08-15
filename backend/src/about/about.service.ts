import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { about } from './about.schema';
import { sanitizeText } from '../security/sanitize';
import { deleteImages } from '../security/uploads';

const ABOUT_ID = 'about';

export interface AboutInfo {
  content: string;
  updatedAt: string;
  imageUrl?: string;
}

@Injectable()
export class AboutService {
  async getAbout(): Promise<AboutInfo> {
    const rows = await db.select().from(about).where(eq(about.id, ABOUT_ID)).limit(1);
    if (rows.length === 0) {
      return { content: '', updatedAt: '' };
    }
    return {
      content: rows[0].content || '',
      updatedAt: rows[0].updatedAt || '',
      imageUrl: (rows[0] as any).imageUrl || '',
    };
  }

  async updateAbout(content: string, imageUrl?: string): Promise<AboutInfo> {
    const cleanContent = sanitizeText(content, 10000);
    const updatedAt = new Date().toISOString();
    const existing = await db.select().from(about).where(eq(about.id, ABOUT_ID)).limit(1);

    const currentImageUrl = existing.length > 0 ? (existing[0] as any).imageUrl || '' : '';
    const nextImageUrl = imageUrl ?? currentImageUrl;

    if (existing.length === 0) {
      await db.insert(about).values({ id: ABOUT_ID, content: cleanContent, updatedAt, imageUrl: nextImageUrl });
    } else {
      await db.update(about).set({ content: cleanContent, updatedAt, imageUrl: nextImageUrl }).where(eq(about.id, ABOUT_ID));
    }

    // Elimina la foto anterior si se reemplazó
    if (imageUrl && currentImageUrl && imageUrl !== currentImageUrl) {
      await deleteImages([currentImageUrl]);
    }

    return { content: cleanContent, updatedAt, imageUrl: nextImageUrl };
  }
}
