import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { products } from './product/product.schema';
import { ProductType } from './product/product-type.enum';
import { CurrencyType } from './product/currency-type.enum';
import { ProvinceType } from './product/province.enum';
import { v4 as uuidv4 } from 'uuid';
import { about } from './about/about.schema';
import { stores } from './store/store.schema';
import * as bcrypt from 'bcrypt';
import { initializeDatabase } from './db';

type SeedProduct = {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  imageUrls: string;
  whatsapp: string;
  type: ProductType;
  province: ProvinceType;
  currency: CurrencyType;
  acceptsTransfer: boolean;
};

const sampleProducts: SeedProduct[] = [
  // Tecnología
  {
    name: 'Audífonos inalámbricos',
    description: 'Audio cristalino con cancelación de ruido.',
    price: '1299.99',
    imageUrl: 'https://picsum.photos/seed/audifonos/800/600',
    imageUrls: '["https://picsum.photos/seed/audifonos/800/600","https://picsum.photos/seed/audifonos2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.TECNOLOGIA,
    province: ProvinceType.CAMAGUEY,
    currency: CurrencyType.USD,
    acceptsTransfer: true,
  },
  {
    name: 'Smartwatch deportivo',
    description: 'Monitor de ritmo cardíaco, pasos y notificaciones en tu muñeca.',
    price: '1899.00',
    imageUrl: 'https://picsum.photos/seed/smartwatch/800/600',
    imageUrls: '["https://picsum.photos/seed/smartwatch/800/600","https://picsum.photos/seed/smartwatch2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.TECNOLOGIA,
    province: ProvinceType.LA_HABANA,
    currency: CurrencyType.USD,
    acceptsTransfer: true,
  },
  {
    name: 'Parlante Bluetooth portátil',
    description: 'Sonido potente y resistente al agua para llevar a cualquier parte.',
    price: '749.99',
    imageUrl: 'https://picsum.photos/seed/parlante/800/600',
    imageUrls: '["https://picsum.photos/seed/parlante/800/600","https://picsum.photos/seed/parlante2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.TECNOLOGIA,
    province: ProvinceType.SANTIAGO_DE_CUBA,
    currency: CurrencyType.EUR,
    acceptsTransfer: true,
  },
  {
    name: 'Teclado mecánico RGB',
    description: 'Teclado mecánico con retroiluminación RGB y switches red.',
    price: '2299.50',
    imageUrl: 'https://picsum.photos/seed/teclado/800/600',
    imageUrls: '["https://picsum.photos/seed/teclado/800/600","https://picsum.photos/seed/teclado2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.TECNOLOGIA,
    province: ProvinceType.VILLA_CLARA,
    currency: CurrencyType.USD,
    acceptsTransfer: false,
  },

  // Ropa
  {
    name: 'Playera deportiva',
    description: 'Tela transpirable para el entrenamiento diario.',
    price: '349.50',
    imageUrl: 'https://picsum.photos/seed/playera/800/600',
    imageUrls: '["https://picsum.photos/seed/playera/800/600","https://picsum.photos/seed/playera2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.ROPA,
    province: ProvinceType.SANTIAGO_DE_CUBA,
    currency: CurrencyType.CUP,
    acceptsTransfer: true,
  },
  {
    name: 'Chaqueta de jean clásica',
    description: 'Chaqueta de mezclilla atemporal, ideal para cualquier temporada.',
    price: '1899.00',
    imageUrl: 'https://picsum.photos/seed/chaqueta/800/600',
    imageUrls: '["https://picsum.photos/seed/chaqueta/800/600","https://picsum.photos/seed/chaqueta2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.ROPA,
    province: ProvinceType.HOLGUIN,
    currency: CurrencyType.CUP,
    acceptsTransfer: true,
  },
  {
    name: 'Zapatillas deportivas urbanas',
    description: 'Comodidad y estilo para el día a día, suela antideslizante.',
    price: '2499.00',
    imageUrl: 'https://picsum.photos/seed/zapatillas/800/600',
    imageUrls: '["https://picsum.photos/seed/zapatillas/800/600","https://picsum.photos/seed/zapatillas2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.ROPA,
    province: ProvinceType.CAMAGUEY,
    currency: CurrencyType.USD,
    acceptsTransfer: true,
  },
  {
    name: 'Vestido de verano floral',
    description: 'Ligero y fresco, perfecto para los días de sol.',
    price: '899.00',
    imageUrl: 'https://picsum.photos/seed/vestido/800/600',
    imageUrls: '["https://picsum.photos/seed/vestido/800/600","https://picsum.photos/seed/vestido2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.ROPA,
    province: ProvinceType.PINAR_DEL_RIO,
    currency: CurrencyType.CUP,
    acceptsTransfer: true,
  },

  // Alimentos
  {
    name: 'Cafetera espresso',
    description: 'Prepara café en minutos con diseño compacto.',
    price: '999.90',
    imageUrl: 'https://picsum.photos/seed/cafetera/800/600',
    imageUrls: '["https://picsum.photos/seed/cafetera/800/600","https://picsum.photos/seed/cafetera2/800/600","https://picsum.photos/seed/cafetera3/800/600"]',
    whatsapp: '59028922',
    type: ProductType.ALIMENTOS,
    province: ProvinceType.LA_HABANA,
    currency: CurrencyType.CUP,
    acceptsTransfer: false,
  },
  {
    name: 'Set de ollas antiadherentes',
    description: 'Juego completo de ollas y sartenes de alta calidad.',
    price: '3199.00',
    imageUrl: 'https://picsum.photos/seed/ollas/800/600',
    imageUrls: '["https://picsum.photos/seed/ollas/800/600","https://picsum.photos/seed/ollas2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.ALIMENTOS,
    province: ProvinceType.MATANZAS,
    currency: CurrencyType.USD,
    acceptsTransfer: true,
  },
  {
    name: 'Batidora de mano multifunción',
    description: 'Ideal para batidos, salsas y cremas en segundos.',
    price: '1299.00',
    imageUrl: 'https://picsum.photos/seed/batidora/800/600',
    imageUrls: '["https://picsum.photos/seed/batidora/800/600","https://picsum.photos/seed/batidora2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.ALIMENTOS,
    province: ProvinceType.CIENFUEGOS,
    currency: CurrencyType.CUP,
    acceptsTransfer: true,
  },
  {
    name: 'Tostadora eléctrica',
    description: 'Tostado perfecto con función de descongelado.',
    price: '749.00',
    imageUrl: 'https://picsum.photos/seed/tostadora/800/600',
    imageUrls: '["https://picsum.photos/seed/tostadora/800/600","https://picsum.photos/seed/tostadora2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.ALIMENTOS,
    province: ProvinceType.SANCTI_SPIRITUS,
    currency: CurrencyType.CUP,
    acceptsTransfer: false,
  },

  // Hogar
  {
    name: 'Lámpara de mesa',
    description: 'Iluminación cálida para tu escritorio o sala.',
    price: '450.00',
    imageUrl: 'https://picsum.photos/seed/lampara/800/600',
    imageUrls: '["https://picsum.photos/seed/lampara/800/600","https://picsum.photos/seed/lampara2/800/600","https://picsum.photos/seed/lampara3/800/600"]',
    whatsapp: '59028922',
    type: ProductType.HOGAR,
    province: ProvinceType.HOLGUIN,
    currency: CurrencyType.ZELLE,
    acceptsTransfer: true,
  },
  {
    name: 'Juego de sábanas premium',
    description: 'Sábanas suaves de algodón egipcio, 400 hilos.',
    price: '1599.00',
    imageUrl: 'https://picsum.photos/seed/sabanas/800/600',
    imageUrls: '["https://picsum.photos/seed/sabanas/800/600","https://picsum.photos/seed/sabanas2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.HOGAR,
    province: ProvinceType.CAMAGUEY,
    currency: CurrencyType.USD,
    acceptsTransfer: true,
  },
  {
    name: 'Cortinas blackout',
    description: 'Bloquea la luz del sol y aporta privacidad a tu hogar.',
    price: '999.00',
    imageUrl: 'https://picsum.photos/seed/cortinas/800/600',
    imageUrls: '["https://picsum.photos/seed/cortinas/800/600","https://picsum.photos/seed/cortinas2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.HOGAR,
    province: ProvinceType.LA_HABANA,
    currency: CurrencyType.CUP,
    acceptsTransfer: true,
  },

  // Electrodomésticos
  {
    name: 'Refrigerador no frost 11 pies',
    description: 'Gran capacidad y ahorro energético, sin necesidad de descongelar.',
    price: '8999.00',
    imageUrl: 'https://picsum.photos/seed/refrigerador/800/600',
    imageUrls: '["https://picsum.photos/seed/refrigerador/800/600","https://picsum.photos/seed/refrigerador2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.ELECTRODOMESTICOS,
    province: ProvinceType.LA_HABANA,
    currency: CurrencyType.USD,
    acceptsTransfer: true,
  },
  {
    name: 'Lavadora automática 8kg',
    description: 'Varios programas de lavado y bajo consumo de agua.',
    price: '7499.00',
    imageUrl: 'https://picsum.photos/seed/lavadora/800/600',
    imageUrls: '["https://picsum.photos/seed/lavadora/800/600","https://picsum.photos/seed/lavadora2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.ELECTRODOMESTICOS,
    province: ProvinceType.CAMAGUEY,
    currency: CurrencyType.USD,
    acceptsTransfer: true,
  },
  {
    name: 'Microondas digital 20L',
    description: 'Panel digital y múltiples funciones de cocción rápida.',
    price: '2499.00',
    imageUrl: 'https://picsum.photos/seed/microondas/800/600',
    imageUrls: '["https://picsum.photos/seed/microondas/800/600","https://picsum.photos/seed/microondas2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.ELECTRODOMESTICOS,
    province: ProvinceType.SANTIAGO_DE_CUBA,
    currency: CurrencyType.CUP,
    acceptsTransfer: false,
  },

  // Deportes
  {
    name: 'Bicicleta de montaña 21v',
    description: 'Cuadro de aluminio y cambios Shimano para todo terreno.',
    price: '5499.00',
    imageUrl: 'https://picsum.photos/seed/bicicleta/800/600',
    imageUrls: '["https://picsum.photos/seed/bicicleta/800/600","https://picsum.photos/seed/bicicleta2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.DEPORTES,
    province: ProvinceType.CIEGO_DE_AVILA,
    currency: CurrencyType.USD,
    acceptsTransfer: true,
  },
  {
    name: 'Mancuernas ajustables 20kg',
    description: 'Set de mancuernas ajustables para entrenar en casa.',
    price: '3799.00',
    imageUrl: 'https://picsum.photos/seed/mancuernas/800/600',
    imageUrls: '["https://picsum.photos/seed/mancuernas/800/600","https://picsum.photos/seed/mancuernas2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.DEPORTES,
    province: ProvinceType.GUANTANAMO,
    currency: CurrencyType.USD,
    acceptsTransfer: true,
  },
  {
    name: 'Colchoneta de yoga antideslizante',
    description: 'Superficie estable y cómoda para tus rutinas diarias.',
    price: '599.00',
    imageUrl: 'https://picsum.photos/seed/yoga/800/600',
    imageUrls: '["https://picsum.photos/seed/yoga/800/600","https://picsum.photos/seed/yoga2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.DEPORTES,
    province: ProvinceType.GRANMA,
    currency: CurrencyType.CUP,
    acceptsTransfer: true,
  },

  // Otros
  {
    name: 'Maleta de viaje 20 pulgadas',
    description: 'Rígida, ligera y con ruedas giratorias de 360 grados.',
    price: '2799.00',
    imageUrl: 'https://picsum.photos/seed/maleta/800/600',
    imageUrls: '["https://picsum.photos/seed/maleta/800/600","https://picsum.photos/seed/maleta2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.OTROS,
    province: ProvinceType.CAMAGUEY,
    currency: CurrencyType.USD,
    acceptsTransfer: true,
  },
  {
    name: 'Bolso de mano de cuero',
    description: 'Diseño elegante y resistente, ideal para el trabajo o paseo.',
    price: '1899.00',
    imageUrl: 'https://picsum.photos/seed/bolso/800/600',
    imageUrls: '["https://picsum.photos/seed/bolso/800/600","https://picsum.photos/seed/bolso2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.OTROS,
    province: ProvinceType.LAS_TUNAS,
    currency: CurrencyType.ZELLE,
    acceptsTransfer: true,
  },
  {
    name: 'Reloj clásico de pulsera',
    description: 'Elegante, con correa de acero y resistencia al agua.',
    price: '3499.00',
    imageUrl: 'https://picsum.photos/seed/reloj/800/600',
    imageUrls: '["https://picsum.photos/seed/reloj/800/600","https://picsum.photos/seed/reloj2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.OTROS,
    province: ProvinceType.ISLA_DE_LA_JUVENTUD,
    currency: CurrencyType.EUR,
    acceptsTransfer: true,
  },

  // Servicios
  {
    name: 'Reparación de celulares',
    description: 'Reparación de pantallas, baterías y fallas generales en el mismo día.',
    price: '1500.00',
    imageUrl: 'https://picsum.photos/seed/reparacion/800/600',
    imageUrls: '["https://picsum.photos/seed/reparacion/800/600","https://picsum.photos/seed/reparacion2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.SERVICIOS,
    province: ProvinceType.CAMAGUEY,
    currency: CurrencyType.CUP,
    acceptsTransfer: true,
  },
  {
    name: 'Instalación de aire acondicionado',
    description: 'Instalación profesional con garantía y materiales incluidos.',
    price: '4500.00',
    imageUrl: 'https://picsum.photos/seed/aire/800/600',
    imageUrls: '["https://picsum.photos/seed/aire/800/600","https://picsum.photos/seed/aire2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.SERVICIOS,
    province: ProvinceType.LA_HABANA,
    currency: CurrencyType.CUP,
    acceptsTransfer: true,
  },
  {
    name: 'Diseño gráfico y logos',
    description: 'Creación de logos, banners y material publicitario personalizado.',
    price: '80.00',
    imageUrl: 'https://picsum.photos/seed/diseno/800/600',
    imageUrls: '["https://picsum.photos/seed/diseno/800/600","https://picsum.photos/seed/diseno2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.SERVICIOS,
    province: ProvinceType.SANTIAGO_DE_CUBA,
    currency: CurrencyType.USD,
    acceptsTransfer: true,
  },

  // Prendas
  {
    name: 'Pantalón jean slim fit',
    description: 'Mezclilla elástica, corte moderno y máxima comodidad.',
    price: '1299.00',
    imageUrl: 'https://picsum.photos/seed/jean/800/600',
    imageUrls: '["https://picsum.photos/seed/jean/800/600","https://picsum.photos/seed/jean2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.PRENDAS,
    province: ProvinceType.HOLGUIN,
    currency: CurrencyType.CUP,
    acceptsTransfer: true,
  },
  {
    name: 'Camisa de vestir manga larga',
    description: 'Tela fresca y planchado fácil, ideal para oficina o eventos.',
    price: '999.00',
    imageUrl: 'https://picsum.photos/seed/camisa/800/600',
    imageUrls: '["https://picsum.photos/seed/camisa/800/600","https://picsum.photos/seed/camisa2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.PRENDAS,
    province: ProvinceType.VILLA_CLARA,
    currency: CurrencyType.CUP,
    acceptsTransfer: true,
  },
  {
    name: 'Suéter de lana térmico',
    description: 'Abrigado y suave para los días más fríos, talla única.',
    price: '1899.00',
    imageUrl: 'https://picsum.photos/seed/sueter/800/600',
    imageUrls: '["https://picsum.photos/seed/sueter/800/600","https://picsum.photos/seed/sueter2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.PRENDAS,
    province: ProvinceType.PINAR_DEL_RIO,
    currency: CurrencyType.USD,
    acceptsTransfer: true,
  },

  // Accesorios
  {
    name: 'Gafas de sol polarizadas',
    description: 'Protección UV400 y estilo clásico para cualquier ocasión.',
    price: '799.00',
    imageUrl: 'https://picsum.photos/seed/gafas/800/600',
    imageUrls: '["https://picsum.photos/seed/gafas/800/600","https://picsum.photos/seed/gafas2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.ACCESORIOS,
    province: ProvinceType.MATANZAS,
    currency: CurrencyType.CUP,
    acceptsTransfer: true,
  },
  {
    name: 'Cinturón de cuero grabado',
    description: 'Cuero genuino con hebilla metálica, varios colores disponibles.',
    price: '699.00',
    imageUrl: 'https://picsum.photos/seed/cinturon/800/600',
    imageUrls: '["https://picsum.photos/seed/cinturon/800/600","https://picsum.photos/seed/cinturon2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.ACCESORIOS,
    province: ProvinceType.CIENFUEGOS,
    currency: CurrencyType.CUP,
    acceptsTransfer: true,
  },
  {
    name: 'Mochila urbana anti-robo',
    description: 'Compartimentos ocultos, cable USB y tejido resistente al agua.',
    price: '1999.00',
    imageUrl: 'https://picsum.photos/seed/mochila/800/600',
    imageUrls: '["https://picsum.photos/seed/mochila/800/600","https://picsum.photos/seed/mochila2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.ACCESORIOS,
    province: ProvinceType.CAMAGUEY,
    currency: CurrencyType.USD,
    acceptsTransfer: true,
  },

  // Inmuebles
  {
    name: 'Apartamento céntrico en venta',
    description: '2 habitaciones, 1 baño, cocina equipada y balcón, listo para habitar.',
    price: '35000.00',
    imageUrl: 'https://picsum.photos/seed/apartamento/800/600',
    imageUrls: '["https://picsum.photos/seed/apartamento/800/600","https://picsum.photos/seed/apartamento2/800/600","https://picsum.photos/seed/apartamento3/800/600"]',
    whatsapp: '59028922',
    type: ProductType.INMUEBLES,
    province: ProvinceType.LA_HABANA,
    currency: CurrencyType.USD,
    acceptsTransfer: true,
  },
  {
    name: 'Casa de playa en alquiler',
    description: 'Frente al mar, 3 habitaciones con climatización, ideal en familia.',
    price: '120.00',
    imageUrl: 'https://picsum.photos/seed/casaplaya/800/600',
    imageUrls: '["https://picsum.photos/seed/casaplaya/800/600","https://picsum.photos/seed/casaplaya2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.INMUEBLES,
    province: ProvinceType.MATANZAS,
    currency: CurrencyType.USD,
    acceptsTransfer: true,
  },
  {
    name: 'Local comercial en arriendo',
    description: 'Ubicación céntrica con vitrina, ideal para negocio o emprendimiento.',
    price: '400.00',
    imageUrl: 'https://picsum.photos/seed/local/800/600',
    imageUrls: '["https://picsum.photos/seed/local/800/600","https://picsum.photos/seed/local2/800/600"]',
    whatsapp: '59028922',
    type: ProductType.INMUEBLES,
    province: ProvinceType.CAMAGUEY,
    currency: CurrencyType.USD,
    acceptsTransfer: true,
  },
];

async function run() {
  const uploadDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
  // Asegurarse que la base de datos está inicializada
  await initializeDatabase();

  // Vaciar tablas (reproducible)
  await db.delete(products);
  await db.delete(stores);
  await db.delete(about);

  // Insertar los productos de muestra del superadmin (storeId null e isPublic true por defecto)
  for (const p of sampleProducts) {
    await db.insert(products).values({
      id: uuidv4(),
      ...p,
    });
  }
  console.log(`Seed completado con ${sampleProducts.length} productos del superadmin.`);
  console.log('El usuario administrador se gestiona con: npm run setup:admin');

  // Crear contenido "Sobre mí" global
  await db.insert(about).values({
    id: 'about',
    content: 'Hola, soy Adrián. Bienvenido a AdrianStore, mi tienda personal. Aquí podrás conocer un poco sobre mí y sobre los productos que ofrezco.',
    updatedAt: new Date().toISOString(),
    storeId: null,
  } as any);
  console.log('Contenido "Sobre mí" global creado.');

  // ── Negocios de ejemplo ─────────────────────────────
  const seedStores = [
    {
      name: 'Tienda Mario',
      username: 'mario_store',
      password: 'mario123456',
      color: '#16a34a',
      whatsapp_default: '5301234567',
      is_closed: false,
      priority: 1 as number | null,
    },
    {
      name: 'ElectroAdrian',
      username: 'electro_adrian',
      password: 'electro123456',
      color: '#2563eb',
      whatsapp_default: '5307654321',
      is_closed: false,
      priority: null as number | null,
    },
    {
      name: 'ModaCuba',
      username: 'modacuba',
      password: 'moda123456',
      color: '#db2777',
      whatsapp_default: '5303334444',
      is_closed: false,
      priority: null as number | null,
    },
  ];

  for (const s of seedStores) {
    const storeId = uuidv4();
    const password_hash = await bcrypt.hash(s.password, 10);
    await db.insert(stores).values({
      id: storeId,
      name: s.name,
      slug: s.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      username: s.username,
      password_hash,
      color: s.color,
      whatsapp_default: s.whatsapp_default,
      is_closed: s.is_closed,
      priority: s.priority,
      created_at: new Date().toISOString(),
    });

    // Sobre mí del negocio
    await db.insert(about).values({
      id: uuidv4(),
      content: `Bienvenido a ${s.name}. Este es nuestro espacio personal dentro de AdrianStore.`,
      updatedAt: new Date().toISOString(),
      storeId,
    } as any);
  }
  console.log(`Seed completado con ${seedStores.length} negocios de ejemplo.`);

  // Productos de ejemplo para los negocios
  const storeRefs: Record<string, string> = {};
  const seededStores = await db.select().from(stores);
  for (const st of seededStores as any[]) {
    storeRefs[st.name] = st.id;
  }

  const marioProducts = [
    { name: 'Samsung Galaxy A54', description: 'Smartphone gama media, 128GB, pantalla AMOLED.', price: '599.00', type: ProductType.TECNOLOGIA, province: ProvinceType.CAMAGUEY, currency: CurrencyType.USD, isPublic: true },
    { name: 'Cámara digital compacta', description: 'Cámara ligera ideal para fotos de viaje.', price: '249.00', type: ProductType.TECNOLOGIA, province: ProvinceType.CAMAGUEY, currency: CurrencyType.USD, isPublic: false },
    { name: 'Audífonos con cable premium', description: 'Sonido de alta fidelidad con micrófono.', price: '45.00', type: ProductType.ACCESORIOS, province: ProvinceType.CAMAGUEY, currency: CurrencyType.USD, isPublic: true },
  ];
  const electroProducts = [
    { name: 'Licuadora de 3 velocidades', description: 'Potente y duradera, ideal para jugos y batidos.', price: '89.00', type: ProductType.ELECTRODOMESTICOS, province: ProvinceType.LA_HABANA, currency: CurrencyType.CUP, isPublic: true },
    { name: 'Plancha de vapor', description: 'Plancha con depósito de agua y anti-goteo.', price: '39.00', type: ProductType.HOGAR, province: ProvinceType.LA_HABANA, currency: CurrencyType.CUP, isPublic: false },
    { name: 'Cafetera americana', description: 'Cafetera de 12 tazas con jarra de vidrio.', price: '55.00', type: ProductType.ALIMENTOS, province: ProvinceType.LA_HABANA, currency: CurrencyType.CUP, isPublic: true },
  ];
  const modaProducts = [
    { name: 'Camiseta algodón premium', description: 'Camiseta 100% algodón, varios colores.', price: '18.00', type: ProductType.PRENDAS, province: ProvinceType.HOLGUIN, currency: CurrencyType.USD, isPublic: true },
    { name: 'Chaleco de moda', description: 'Chaleco elegante ideal para temporada.', price: '35.00', type: ProductType.PRENDAS, province: ProvinceType.HOLGUIN, currency: CurrencyType.USD, isPublic: false },
    { name: 'Billetera de piel', description: 'Billetera fina de piel genuina.', price: '25.00', type: ProductType.ACCESORIOS, province: ProvinceType.HOLGUIN, currency: CurrencyType.USD, isPublic: true },
  ];

  const storeProductLists: { storeName: string; items: typeof marioProducts }[] = [
    { storeName: 'Tienda Mario', items: marioProducts },
    { storeName: 'ElectroAdrian', items: electroProducts },
    { storeName: 'ModaCuba', items: modaProducts },
  ];

  for (const list of storeProductLists) {
    const storeId = storeRefs[list.storeName];
    if (!storeId) continue;
    for (const item of list.items) {
      const seed = 'producto-' + item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const imageUrl = `https://picsum.photos/seed/${seed}/800/600`;
      await db.insert(products).values({
        id: uuidv4(),
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl,
        imageUrls: JSON.stringify([imageUrl]),
        whatsapp: '5301234567',
        type: item.type,
        currency: item.currency,
        acceptsTransfer: true,
        province: item.province,
        storeId,
        isPublic: item.isPublic,
      });
    }
  }
  console.log(`Productos de ejemplo insertados para los ${seedStores.length} negocios.`);
}

run().catch((error) => {
  console.error('Error en seed:', error);
  process.exit(1);
});
