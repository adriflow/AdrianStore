import {
  boolean as pgBoolean,
  pgTable,
  text as pgText,
  varchar as pgVarchar,
  numeric as pgNumeric,
} from 'drizzle-orm/pg-core';
import {
  integer as sqliteInteger,
  sqliteTable,
  text as sqliteText,
  real as sqliteReal,
} from 'drizzle-orm/sqlite-core';

const hasPostgresConfig = () =>
  !!process.env.DATABASE_URL ||
  !!process.env.DB_HOST ||
  !!process.env.DB_USER ||
  !!process.env.DB_PASSWORD ||
  !!process.env.DB_NAME;

const useSqlite = process.env.NODE_ENV === 'test' || !hasPostgresConfig();

export const products = useSqlite
  ? sqliteTable('products', {
      id: sqliteText('id').primaryKey(),
      name: sqliteText('name').notNull(),
      description: sqliteText('description').notNull(),
      price: sqliteReal('price').notNull(),
      imageUrl: sqliteText('image_url').notNull(),
      whatsapp: sqliteText('whatsapp').default('').notNull(),
      type: sqliteText('type').default('otros').notNull(),
      currency: sqliteText('currency').default('CUP').notNull(),
      acceptsTransfer: sqliteInteger('accepts_transfer', { mode: 'boolean' }).default(true).notNull(),
      imageUrls: sqliteText('image_urls').default('[]').notNull(),
      province: sqliteText('province').default('Camagüey').notNull(),
      storeId: sqliteText('store_id'),
      isPublic: sqliteInteger('is_public', { mode: 'boolean' }).default(true).notNull(),
    })
  : pgTable('products', {
      id: pgVarchar('id').primaryKey(),
      name: pgVarchar('name', { length: 255 }).notNull(),
      description: pgText('description').notNull(),
      price: pgNumeric('price').notNull(),
      imageUrl: pgText('image_url').notNull(),
      whatsapp: pgVarchar('whatsapp', { length: 50 }).default('').notNull(),
      type: pgVarchar('type', { length: 50 }).default('otros').notNull(),
      currency: pgVarchar('currency', { length: 10 }).default('CUP').notNull(),
      acceptsTransfer: pgBoolean('accepts_transfer').default(true).notNull(),
      imageUrls: pgText('image_urls').default('[]').notNull(),
      province: pgVarchar('province', { length: 50 }).default('Camagüey').notNull(),
      storeId: pgVarchar('store_id'),
      isPublic: pgBoolean('is_public').default(true).notNull(),
    });
