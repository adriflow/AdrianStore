import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { about } from './about.schema';

const ABOUT_ID = 'about';

export interface AboutInfo {
  content: string;
  updatedAt: string;
}

@Injectable()
export class AboutService {
  async getAbout(): Promise<AboutInfo> {
    const rows = await db.select().from(about).where(eq(about.id, ABOUT_ID)).limit(1);
    if (rows.length === 0) {
      return { content: '', updatedAt: '' };
    }
    return { content: rows[0].content || '', updatedAt: rows[0].updatedAt || '' };
  }

  async updateAbout(content: string): Promise<AboutInfo> {
    const updatedAt = new Date().toISOString();
    const existing = await db.select().from(about).where(eq(about.id, ABOUT_ID)).limit(1);
    if (existing.length === 0) {
      await db.insert(about).values({ id: ABOUT_ID, content, updatedAt });
    } else {
      await db.update(about).set({ content, updatedAt }).where(eq(about.id, ABOUT_ID));
    }
    return { content, updatedAt };
  }
}
