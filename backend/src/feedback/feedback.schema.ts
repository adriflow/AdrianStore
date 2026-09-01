import { pgTable, text as pgText, varchar as pgVarchar, boolean as pgBoolean } from 'drizzle-orm/pg-core';
import { sqliteTable, text as sqliteText, integer as sqliteInteger } from 'drizzle-orm/sqlite-core';

const hasPostgresConfig = () =>
  !!process.env.DATABASE_URL ||
  !!process.env.DB_HOST ||
  !!process.env.DB_USER ||
  !!process.env.DB_PASSWORD ||
  !!process.env.DB_NAME;

const useSqlite = process.env.NODE_ENV === 'test' || !hasPostgresConfig();

export const feedback = useSqlite
  ? sqliteTable('feedback', {
      id: sqliteText('id').primaryKey(),
      kind: sqliteText('kind').notNull(),
      name: sqliteText('name').notNull(),
      phone: sqliteText('phone').notNull().default(''),
      message: sqliteText('message').notNull(),
      approved: sqliteInteger('approved', { mode: 'boolean' }).notNull().default(false),
      created_at: sqliteText('created_at').notNull().default(''),
    })
  : pgTable('feedback', {
      id: pgVarchar('id').primaryKey(),
      kind: pgVarchar('kind', { length: 20 }).notNull(),
      name: pgVarchar('name', { length: 120 }).notNull(),
      phone: pgVarchar('phone', { length: 30 }).notNull().default(''),
      message: pgText('message').notNull(),
      approved: pgBoolean('approved').notNull().default(false),
      created_at: pgVarchar('created_at', { length: 50 }).notNull().default(''),
    });
