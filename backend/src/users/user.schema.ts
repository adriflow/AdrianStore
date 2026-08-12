import { pgTable, varchar, text as pgText } from 'drizzle-orm/pg-core';
import { sqliteTable, text as sqliteText } from 'drizzle-orm/sqlite-core';

const hasPostgresConfig = () =>
  !!process.env.DATABASE_URL ||
  !!process.env.DB_HOST ||
  !!process.env.DB_USER ||
  !!process.env.DB_PASSWORD ||
  !!process.env.DB_NAME;

export const users = (() => {
  const useSqlite = process.env.NODE_ENV === 'test' || !hasPostgresConfig();
  return useSqlite
    ? sqliteTable('users', {
        id: sqliteText('id').primaryKey(),
        username: sqliteText('username').unique(),
        password_hash: sqliteText('password_hash'),
        role: sqliteText('role'),
      })
    : pgTable('users', {
        id: varchar('id').primaryKey(),
        username: varchar('username', { length: 255 }).unique(),
        password_hash: pgText('password_hash'),
        role: varchar('role', { length: 50 }),
      });
})();
