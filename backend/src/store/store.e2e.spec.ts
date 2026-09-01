import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { db, initializeTestDb } from '../db';
import { stores } from './store.schema';
import { products } from '../product/product.schema';
import { about } from '../about/about.schema';
import { AuthService } from '../auth/auth.service';

describe('Store multitenant (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let createdStoreId: string;
  let storeSlug: string;
  let storeUsername: string;
  let ownerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await initializeTestDb();
    await app.init();

    await db.delete(about);
    await db.delete(products);
    await db.delete(stores);

    const authService = moduleFixture.get(AuthService);
    await authService.registerAdmin('admin', 'admin123');

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' })
      .expect(201);
    adminToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rechaza crear negocio sin token admin', async () => {
    await request(app.getHttpServer())
      .post('/api/stores')
      .send({ name: 'Tienda X', username: 'tienda_x', password: 'secreto123' })
      .expect(401);
  });

  it('crea un negocio como superadmin', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/stores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Tienda Mario', username: 'tienda_mario', password: 'secreto123' })
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.slug).toBe('tienda-mario');
    expect(response.body.is_closed).toBe(false);
    createdStoreId = response.body.id;
    storeSlug = response.body.slug;
    storeUsername = response.body.username;
  });

  it('rechaza contraseña corta', async () => {
    await request(app.getHttpServer())
      .post('/api/stores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Tienda Y', username: 'tienda_y', password: 'corta' })
      .expect(400);
  });

  it('lista negocios públicos (solo abiertos)', async () => {
    const response = await request(app.getHttpServer()).get('/api/stores').expect(200);
    expect(Array.isArray(response.body)).toBe(true);
    const store = response.body.find((s: any) => s.id === createdStoreId);
    expect(store?.name).toBe('Tienda Mario');
    // No debe exponer credenciales en la lista pública
    expect(store?.username).toBeUndefined();
    expect(store?.password_hash).toBeUndefined();
  });

  it('obtiene info pública por slug', async () => {
    const response = await request(app.getHttpServer()).get(`/api/stores/slug/${storeSlug}`).expect(200);
    expect(response.body.name).toBe('Tienda Mario');
    expect(response.body.username).toBeUndefined();
    expect(response.body.password_hash).toBeUndefined();
  });

  it('el dueño puede loguearse y recibe role owner + storeId', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: storeUsername, password: 'secreto123' })
      .expect(201);
    ownerToken = response.body.token;
    const me = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(me.body.user.role).toBe('owner');
    expect(me.body.user.storeId).toBe(createdStoreId);
    expect(me.body.user.storeName).toBe('Tienda Mario');
  });

  it('el dueño crea un producto público y uno privado en su negocio', async () => {
    const pub = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${ownerToken}`)
      .field('name', 'Producto Público')
      .field('description', 'Visible en catálogo')
      .field('price', '50')
      .field('type', 'tecnologia')
      .field('isPublic', 'true')
      .expect(201);
    expect(pub.body.storeId).toBe(createdStoreId);
    expect(pub.body.isPublic).toBe(true);
    expect(pub.body.storeName).toBe('Tienda Mario');

    const priv = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${ownerToken}`)
      .field('name', 'Producto Privado')
      .field('description', 'Solo en el negocio')
      .field('price', '30')
      .field('type', 'hogar')
      .field('isPublic', 'false')
      .expect(201);
    expect(priv.body.storeId).toBe(createdStoreId);
    expect(priv.body.isPublic).toBe(false);
  });

  it('los productos del negocio se listan en su sección', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/products/store/${createdStoreId}`)
      .expect(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
  });

  it('el catálogo público excluye productos privados', async () => {
    const response = await request(app.getHttpServer()).get('/api/products').expect(200);
    const privado = response.body.find((p: any) => p.name === 'Producto Privado');
    expect(privado).toBeUndefined();
  });

  it('el dueño actualiza color y whatsapp default', async () => {
    const response = await request(app.getHttpServer())
      .put(`/api/stores/${createdStoreId}/me`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ color: '#16a34a', whatsappDefault: '5350011122' })
      .expect(200);
    expect(response.body.color).toBe('#16a34a');
    expect(response.body.whatsapp_default).toBe('5350011122');
  });

  it('el dueño cambia sus credenciales', async () => {
    await request(app.getHttpServer())
      .patch(`/api/stores/${createdStoreId}/credentials`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ username: 'mario_nuevo', password: 'nuevopass123' })
      .expect(200);
  });

  it('el nuevo usuario sirve para loguearse', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'mario_nuevo', password: 'nuevopass123' })
      .expect(201);
    const me = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${response.body.token}`)
      .expect(200);
    expect(me.body.user.role).toBe('owner');
  });

  it('el dueño no puede operar productos de otro negocio (acceso limitado)', async () => {
    // Crear otro negocio y su dueño
    const otro = await request(app.getHttpServer())
      .post('/api/stores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Otra Tienda', username: 'otra_tienda', password: 'secreto123' })
      .expect(201);
    const otroToken = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'otra_tienda', password: 'secreto123' })
      .expect(201);

    // Mario intenta borrar un producto de Otra Tienda
    const producto = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${otroToken.body.token}`)
      .field('name', 'Ajeno')
      .field('price', '10')
      .expect(201);
    await request(app.getHttpServer())
      .delete(`/api/products/${producto.body.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(403);
    void otro;
  });

  it('el superadmin edita prioridad y cierra el negocio', async () => {
    await request(app.getHttpServer())
      .patch(`/api/stores/${createdStoreId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ priority: 1, color: '#1d4ed8' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/stores/${createdStoreId}/closed`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isClosed: true })
      .expect(200);
  });

  it('un negocio cerrado ya no aparece como público', async () => {
    const response = await request(app.getHttpServer()).get('/api/stores').expect(200);
    expect(response.body.find((s: any) => s.id === createdStoreId)).toBeUndefined();
  });

  it('el superadmin elimina un negocio y sus productos', async () => {
    let tempStoreId: string;
    let tempSlug: string;
    const temp = await request(app.getHttpServer())
      .post('/api/stores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Temporal', username: 'temporal_u', password: 'secreto123' })
      .expect(201);
    tempStoreId = temp.body.id;
    tempSlug = temp.body.slug;

    const tempOwner = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'temporal_u', password: 'secreto123' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${tempOwner.body.token}`)
      .field('name', 'De Temporal')
      .field('price', '5')
      .expect(201);

    await request(app.getHttpServer())
      .put(`/api/about/store/${tempSlug}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('content', 'Hola somos Temporal')
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/api/stores/${tempStoreId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const productsAfter = await request(app.getHttpServer())
      .get(`/api/products/store/${tempStoreId}`)
      .expect(200);
    expect(productsAfter.body.length).toBe(0);
  });
});
