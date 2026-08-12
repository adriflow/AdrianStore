import 'dotenv/config';
import { db } from './db';
import { initializeDatabase } from './db';
import { eq } from 'drizzle-orm';
import { users } from './users/user.schema';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

// Crea o actualiza el usuario administrador desde variables de entorno
// (ADMIN_USERNAME / ADMIN_PASSWORD) y elimina el admin por defecto "admin123".
async function run() {
  await initializeDatabase();

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.error('Falta ADMIN_USERNAME o ADMIN_PASSWORD en las variables de entorno.');
    console.error('Configúralas en el archivo .env y vuelve a intentarlo.');
    process.exit(1);
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    console.error('La contraseña debe tener entre 8 y 72 caracteres.');
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(password, 10);

  const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existing.length > 0) {
    await db.update(users).set({ password_hash, role: 'admin' }).where(eq(users.username, username));
    console.log(`Contraseña del administrador "${username}" actualizada.`);
  } else {
    await db.insert(users).values({ id: uuidv4(), username, password_hash, role: 'admin' });
    console.log(`Usuario administrador "${username}" creado.`);
  }

  await db.delete(users).where(eq(users.username, 'admin123'));
  console.log('Usuario legado "admin123" eliminado (si existía).');
}

run().catch((error) => {
  console.error('Error en setup-admin:', error);
  process.exit(1);
});
