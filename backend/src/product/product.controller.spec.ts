import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../app.module';
import { db, initializeTestDb } from '../db';
import { products } from './product.schema';
import { ProductType } from './product-type.enum';
import { AuthService } from '../auth/auth.service';

describe('ProductController (e2e)', () => {
  let app: INestApplication;
  let createdId: string;
  let adminToken: string;

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

    const uploadsPath = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsPath)) {
      mkdirSync(uploadsPath, { recursive: true });
    }

    await db.delete(products);

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

  it('debe rechazar operaciones sin token admin', async () => {
    await request(app.getHttpServer()).post('/api/products').expect(401);
  });

  it('debe crear un producto admin', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('name', 'Prueba Creación')
      .field('description', 'Descripción de prueba')
      .field('price', '199.99')
      .field('type', ProductType.TECNOLOGIA)
      .attach('image', Buffer.from('test'), 'test.png')
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.name).toBe('Prueba Creación');
    createdId = response.body.id;
  });

  it('debe listar productos', async () => {
    const response = await request(app.getHttpServer()).get('/api/products').expect(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
  });

  it('debe actualizar un producto admin', async () => {
    await request(app.getHttpServer())
      .patch(`/api/products/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('name', 'Prueba Actualizada')
      .field('description', 'Nueva descripción')
      .field('price', '249.99')
      .field('type', ProductType.TECNOLOGIA)
      .expect(200)
      .then((response) => {
        expect(response.body.name).toBe('Prueba Actualizada');
      });
  });

  it('debe borrar un producto admin', async () => {
    await request(app.getHttpServer())
      .delete(`/api/products/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});
