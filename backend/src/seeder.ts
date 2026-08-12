import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { products } from './product/product.schema';
import { ProductType } from './product/product-type.enum';
import { CurrencyType } from './product/currency-type.enum';
import { v4 as uuidv4 } from 'uuid';
import { users } from './users/user.schema';
import { about } from './about/about.schema';
import * as bcrypt from 'bcrypt';
import { initializeDatabase } from './db';

async function run() {
  const uploadDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
  // Asegurarse que la base de datos está inicializada
  await initializeDatabase();

  const sampleProducts = [
    {
      id: uuidv4(),
      name: 'Audífonos inalámbricos',
      description: 'Audio cristalino con cancelación de ruido.',
      price: '1299.99',
      imageUrl: 'https://picsum.photos/seed/audifonos/800/600',
      imageUrls: '["https://picsum.photos/seed/audifonos/800/600","https://picsum.photos/seed/audifonos2/800/600"]',
      whatsapp: '59028922',
      type: ProductType.TECNOLOGIA,
      currency: CurrencyType.USD,
      acceptsTransfer: true,
    },
    {
      id: uuidv4(),
      name: 'Cafetera espresso',
      description: 'Prepara café en minutos con diseño compacto.',
      price: '999.90',
      imageUrl: 'https://picsum.photos/seed/cafetera/800/600',
      imageUrls: '["https://picsum.photos/seed/cafetera/800/600","https://picsum.photos/seed/cafetera2/800/600","https://picsum.photos/seed/cafetera3/800/600"]',
      whatsapp: '59028922',
      type: ProductType.ALIMENTOS,
      currency: CurrencyType.CUP,
      acceptsTransfer: false,
    },
    {
      id: uuidv4(),
      name: 'Playera deportiva',
      description: 'Tela transpirable para el entrenamiento diario.',
      price: '349.50',
      imageUrl: 'https://picsum.photos/seed/playera/800/600',
      imageUrls: '["https://picsum.photos/seed/playera/800/600","https://picsum.photos/seed/playera2/800/600"]',
      whatsapp: '59028922',
      type: ProductType.ROPA,
      currency: CurrencyType.CUP,
      acceptsTransfer: true,
    },
    {
      id: uuidv4(),
      name: 'Lámpara de mesa',
      description: 'Iluminación cálida para tu escritorio o sala.',
      price: '450.00',
      imageUrl: 'https://picsum.photos/seed/lampara/800/600',
      imageUrls: '["https://picsum.photos/seed/lampara/800/600","https://picsum.photos/seed/lampara2/800/600","https://picsum.photos/seed/lampara3/800/600"]',
      whatsapp: '59028922',
      type: ProductType.OTROS,
      currency: CurrencyType.ZELLE,
      acceptsTransfer: true,
    },
  ];

  // Vaciar tabla productos
  await db.delete(products);
  // Insertar los productos de muestra uno a uno
  for (const p of sampleProducts) {
    await db.insert(products).values(p);
  }
  console.log('Seed completado con productos iniciales.');
  // Crear admin si no existe
  const existing = await db.select().from(users).where(eq(users.username, 'admin123')).limit(1);
  if (!existing || existing.length === 0) {
    const password_hash = await bcrypt.hash('admin123', 10);
    await db.insert(users).values({ id: uuidv4(), username: 'admin123', password_hash, role: 'admin' });
    console.log('Usuario admin creado.');
  }

  // Crear contenido "Sobre mí" si no existe
  const aboutRows = await db.select().from(about).where(eq(about.id, 'about')).limit(1);
  if (!aboutRows || aboutRows.length === 0) {
    await db
      .insert(about)
      .values({
        id: 'about',
        content: 'Hola, soy Adrián. Bienvenido a AdrianStore, mi tienda personal. Aquí podrás conocer un poco sobre mí y sobre los productos que ofrezco.',
        updatedAt: new Date().toISOString(),
      });
    console.log('Contenido "Sobre mí" creado.');
  }
}


run().catch((error) => {
  console.error('Error en seed:', error);
  process.exit(1);
});
