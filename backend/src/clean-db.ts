import { db } from './db';
import { products } from './product/product.schema';
import { users } from './users/user.schema';
import { about } from './about/about.schema';
import { initializeDatabase } from './db';

async function run() {
  // Asegurarse que la base de datos está inicializada
  await initializeDatabase();

  // Vaciar las tablas sin tocar su estructura
  await db.delete(products);
  await db.delete(users);
  await db.delete(about);

  console.log('Base de datos limpia. Estructura intacta.');
  console.log('- Productos: 0');
  console.log('- Usuarios: 0');
  console.log('- "Sobre mí": vacío');
}

run().catch((error) => {
  console.error('Error al limpiar la base de datos:', error);
  process.exit(1);
});
