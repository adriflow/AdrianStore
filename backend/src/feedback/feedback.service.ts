import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { feedback } from './feedback.schema';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeText, sanitizePhone } from '../security/sanitize';

export type FeedbackKind = 'error' | 'suggestion';

export interface FeedbackRecord {
  id: string;
  kind: FeedbackKind;
  name: string;
  phone: string;
  message: string;
  approved: boolean;
  created_at: string;
}

export interface FeedbackPublic {
  id: string;
  name: string;
  message: string;
  created_at: string;
}

@Injectable()
export class FeedbackService {
  private normalizeKind(kind: string): FeedbackKind {
    if (kind === 'error' || kind === 'suggestion') {
      return kind;
    }
    throw new BadRequestException('Tipo de feedback inválido');
  }

  async create(data: { kind: string; name: string; phone?: string; message: string }): Promise<FeedbackRecord> {
    const kind = this.normalizeKind(data.kind);
    const name = sanitizeText(data.name, 120);
    if (!name) {
      throw new BadRequestException('El nombre es obligatorio');
    }
    const message = sanitizeText(data.message, 5000);
    if (!message) {
      throw new BadRequestException('El mensaje es obligatorio');
    }
    const phone = sanitizePhone(data.phone);

    const record: FeedbackRecord = {
      id: uuidv4(),
      kind,
      name,
      phone,
      message,
      approved: false,
      created_at: new Date().toISOString(),
    };
    await db.insert(feedback).values(record);
    return record;
  }

  async findAllByKind(kind: FeedbackKind): Promise<FeedbackRecord[]> {
    const rows = await db
      .select()
      .from(feedback)
      .where(eq(feedback.kind, kind))
      .orderBy(feedback.created_at);
    return rows.map((row) => ({
      id: row.id,
      kind: row.kind as FeedbackKind,
      name: row.name,
      phone: row.phone,
      message: row.message,
      approved: !!row.approved,
      created_at: row.created_at,
    }));
  }

  async findApprovedSuggestions(): Promise<FeedbackPublic[]> {
    const rows = await db
      .select()
      .from(feedback)
      .where(eq(feedback.kind, 'suggestion'))
      .orderBy(feedback.created_at);
    return rows
      .filter((row) => !!row.approved)
      .map((row) => ({
        id: row.id,
        name: row.name,
        message: row.message,
        created_at: row.created_at,
      }));
  }

  private async get(id: string): Promise<FeedbackRecord> {
    const rows = await db.select().from(feedback).where(eq(feedback.id, id)).limit(1);
    if (!rows.length) {
      throw new NotFoundException('Elemento no encontrado');
    }
    const row = rows[0];
    return {
      id: row.id,
      kind: row.kind as FeedbackKind,
      name: row.name,
      phone: row.phone,
      message: row.message,
      approved: !!row.approved,
      created_at: row.created_at,
    };
  }

  async setApproved(id: string, approved: boolean): Promise<FeedbackRecord> {
    const existing = await this.get(id);
    if (existing.kind !== 'suggestion') {
      throw new BadRequestException('Solo las sugerencias/valoraciones pueden aprobarse');
    }
    await db.update(feedback).set({ approved }).where(eq(feedback.id, id));
    return { ...existing, approved };
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    await db.delete(feedback).where(eq(feedback.id, id));
  }
}
