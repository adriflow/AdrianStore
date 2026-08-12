import { config } from 'dotenv';
import { Pool } from 'pg';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleSqlite } from 'drizzle-orm/sql-js';
import initSqlJs from 'sql.js';

config();

const hasPostgresConfig = () =>
  !!process.env.DATABASE_URL ||
  !!process.env.DB_HOST ||
  !!process.env.DB_USER ||
  !!process.env.DB_PASSWORD ||
  !!process.env.DB_NAME;

const isTestEnvironment = () => process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;

let db: any = null;
let initialized = false;

async function initializeDatabase() {
  if (initialized && db) {
    return db;
  }

  if (isTestEnvironment() || !hasPostgresConfig()) {
    const SQL = await initSqlJs();
    const sqliteDb = new SQL.Database();
    db = drizzleSqlite(sqliteDb);

    await db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price REAL NOT NULL,
        image_url TEXT NOT NULL DEFAULT '',
        whatsapp TEXT NOT NULL DEFAULT '',
        type TEXT NOT NULL DEFAULT 'otros',
        currency TEXT NOT NULL DEFAULT 'CUP',
        accepts_transfer INTEGER NOT NULL DEFAULT 1,
        image_urls TEXT NOT NULL DEFAULT '[]'
      );
    `);
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin'
      );
    `);
    await db.run(`
      CREATE TABLE IF NOT EXISTS about (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL DEFAULT ''
      );
    `);

    initialized = true;
    return db;
  }

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'adrianstore',
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price NUMERIC NOT NULL,
      image_url TEXT NOT NULL DEFAULT '',
      whatsapp VARCHAR(50) DEFAULT '',
      type VARCHAR(50) DEFAULT 'otros',
      currency VARCHAR(10) NOT NULL DEFAULT 'CUP',
      accepts_transfer BOOLEAN NOT NULL DEFAULT TRUE,
      image_urls TEXT NOT NULL DEFAULT '[]'
    );
  `);
  await pool.query(`
    ALTER TABLE products ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'CUP';
  `);
  await pool.query(`
    ALTER TABLE products ADD COLUMN IF NOT EXISTS accepts_transfer BOOLEAN NOT NULL DEFAULT TRUE;
  `);
  await pool.query(`
    ALTER TABLE products ADD COLUMN IF NOT EXISTS image_urls TEXT NOT NULL DEFAULT '[]';
  `);
  await pool.query(`
    UPDATE products SET image_urls = '["' || image_url || '"]'
    WHERE image_url <> '' AND image_urls = '[]';
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR PRIMARY KEY,
      username VARCHAR(255) UNIQUE,
      password_hash TEXT,
      role VARCHAR(50) DEFAULT 'admin'
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS about (
      id VARCHAR PRIMARY KEY,
      content TEXT NOT NULL DEFAULT '',
      updated_at VARCHAR(50) NOT NULL DEFAULT ''
    );
  `);

  db = drizzlePg(pool);
  initialized = true;
  return db;
}

async function initializeTestDb() {
  if (isTestEnvironment()) {
    return initializeDatabase();
  }

  return db;
}

export { db, initializeDatabase, initializeTestDb };
