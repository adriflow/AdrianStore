import { pgTable, varchar, text as pgText, boolean as pgBoolean, integer as pgInteger } from 'drizzle-orm/pg-core';
import { sqliteTable, text as sqliteText, integer as sqliteInteger } from 'drizzle-orm/sqlite-core';

const hasPostgresConfig = () =>
  !!process.env.DATABASE_URL ||
  !!process.env.DB_HOST ||
  !!process.env.DB_USER ||
  !!process.env.DB_PASSWORD ||
  !!process.env.DB_NAME;

const useSqlite = process.env.NODE_ENV === 'test' || !hasPostgresConfig();

export const stores = useSqlite
  ? sqliteTable('stores', {
      id: sqliteText('id').primaryKey(),
      name: sqliteText('name').notNull(),
      slug: sqliteText('slug').unique().notNull(),
      username: sqliteText('username').unique().notNull(),
      password_hash: sqliteText('password_hash').notNull(),
      color: sqliteText('color').notNull().default(''),
      whatsapp_default: sqliteText('whatsapp_default').notNull().default(''),
      is_closed: sqliteInteger('is_closed', { mode: 'boolean' }).notNull().default(false),
      priority: sqliteInteger('priority'),
      created_at: sqliteText('created_at').notNull().default(''),
    })
  : pgTable('stores', {
      id: varchar('id').primaryKey(),
      name: varchar('name', { length: 255 }).notNull(),
      slug: varchar('slug', { length: 100 }).unique().notNull(),
      username: varchar('username', { length: 255 }).unique().notNull(),
      password_hash: pgText('password_hash').notNull(),
      color: varchar('color', { length: 20 }).notNull().default(''),
      whatsapp_default: varchar('whatsapp_default', { length: 20 }).notNull().default(''),
      is_closed: pgBoolean('is_closed').notNull().default(false),
      priority: pgInteger('priority'),
      created_at: varchar('created_at', { length: 50 }).notNull().default(''),
    });
