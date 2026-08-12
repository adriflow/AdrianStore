import { pgTable, text as pgText, varchar as pgVarchar } from 'drizzle-orm/pg-core';
import { sqliteTable, text as sqliteText } from 'drizzle-orm/sqlite-core';

const hasPostgresConfig = () =>
  !!process.env.DATABASE_URL ||
  !!process.env.DB_HOST ||
  !!process.env.DB_USER ||
  !!process.env.DB_PASSWORD ||
  !!process.env.DB_NAME;

const useSqlite = process.env.NODE_ENV === 'test' || !hasPostgresConfig();

export const about = useSqlite
  ? sqliteTable('about', {
      id: sqliteText('id').primaryKey(),
      content: sqliteText('content').notNull().default(''),
      updatedAt: sqliteText('updated_at').notNull().default(''),
    })
  : pgTable('about', {
      id: pgVarchar('id').primaryKey(),
      content: pgText('content').notNull().default(''),
      updatedAt: pgVarchar('updated_at', { length: 50 }).notNull().default(''),
    });
