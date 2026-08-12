import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './src/app.module';
import { db, initializeTestDb } from './src/db';
import { products } from './src/product/product.schema';
import { AuthService } from './src/auth/auth.service';

async function main() {
  process.env.NODE_ENV = 'test';
  await initializeTestDb();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app: INestApplication = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.init();

  await db.delete(products);

  const authService = moduleFixture.get(AuthService);
  await authService.registerAdmin('admin', 'admin123');

  const loginRes = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });

  console.log('LOGIN STATUS', loginRes.statusCode);
  const adminToken = loginRes.body.token;
  console.log('LOGIN TOKEN', adminToken ? 'ok' : 'missing');

  const createRes = await request(app.getHttpServer())
    .post('/api/products')
    .set('Authorization', `Bearer ${adminToken}`)
    .field('name', 'Prueba')
    .field('description', 'Desc')
    .field('price', '199.99')
    .field('type', 'tecnologia')
    .attach('image', Buffer.from('test'), 'test.png');

  console.log('CREATE STATUS', createRes.statusCode);
  console.log('CREATE BODY', JSON.stringify(createRes.body));

  if (createRes.statusCode === 201) {
    const id = createRes.body.id;
    console.log('CREATED ID', id);

    const upd = await request(app.getHttpServer())
      .patch(`/api/products/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('name', 'Actualizado')
      .field('description', 'Nueva')
      .field('price', '249.99')
      .field('type', 'tecnologia');

    console.log('UPDATE STATUS', upd.statusCode);
    console.log('UPDATE BODY', JSON.stringify(upd.body));

    const del = await request(app.getHttpServer())
      .delete(`/api/products/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    console.log('DELETE STATUS', del.statusCode);
    console.log('DELETE BODY', JSON.stringify(del.body));
  }

  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
