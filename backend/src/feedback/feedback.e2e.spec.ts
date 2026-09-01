import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { db, initializeTestDb } from '../db';
import { feedback } from './feedback.schema';
import { AuthService } from '../auth/auth.service';

describe('Feedback (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let suggestionId: string;

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

    await db.delete(feedback);

    const authService = moduleFixture.get(AuthService);
    await authService.registerAdmin('admin', 'admin123');
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' })
      .expect(201);
    adminToken = login.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('crea un reporte de error (público) y sanitiza HTML', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/feedback')
      .send({ kind: 'error', name: 'Carlos', phone: '5350011223', message: 'No carga la imagen <script>alert(1)</script><b>Hola</b>' })
      .expect(201);
    expect(res.body.name).toBe('Carlos');
    expect(res.body.phone).toBe('5350011223');
    expect(res.body.message).toBe('No carga la imagen  Hola');
    expect(res.body.kind).toBe('error');
  });

  it('rechaza nombre vacío', async () => {
    await request(app.getHttpServer())
      .post('/api/feedback')
      .send({ kind: 'error', name: '', message: 'algo' })
      .expect(400);
  });

  it('rechaza mensaje vacío', async () => {
    await request(app.getHttpServer())
      .post('/api/feedback')
      .send({ kind: 'error', name: 'Ana', message: '   ' })
      .expect(400);
  });

  it('rechaza tipo de feedback inválido', async () => {
    await request(app.getHttpServer())
      .post('/api/feedback')
      .send({ kind: 'otro', name: 'Ana', message: 'x' })
      .expect(400);
  });

  it('crea una sugerencia/valoración (público)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/feedback')
      .send({ kind: 'suggestion', name: 'Laura', phone: '5350000111', message: 'Me encanta la tienda, ¡excelente atención!' })
      .expect(201);
    suggestionId = res.body.id;
    expect(res.body.approved).toBe(false);
  });

  it('las sugerencias no aprobadas no son visibles públicamente', async () => {
    const res = await request(app.getHttpServer()).get('/api/feedback/suggestions').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('requiere token admin para la bandeja', async () => {
    await request(app.getHttpServer()).get('/api/feedback/admin/errors').expect(401);
  });

  it('la bandeja admin muestra los errores y sugerencias', async () => {
    const errors = await request(app.getHttpServer())
      .get('/api/feedback/admin/errors')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(errors.body.length).toBe(1);
    expect(errors.body[0].phone).toBe('5350011223');

    const sugg = await request(app.getHttpServer())
      .get('/api/feedback/admin/suggestions')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(sugg.body.length).toBe(1);
    expect(sugg.body[0].name).toBe('Laura');
  });

  it('el admin acepta una sugerencia y ahora es visible', async () => {
    await request(app.getHttpServer())
      .patch(`/api/feedback/${suggestionId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ approved: true })
      .expect(200);

    const res = await request(app.getHttpServer()).get('/api/feedback/suggestions').expect(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Laura');
    // No debe exponer el teléfono en la vista pública
    expect(res.body[0].phone).toBeUndefined();
  });

  it('no se puede aprobar un error (solo sugerencias)', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/feedback/admin/errors')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/feedback/${list.body[0].id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ approved: true })
      .expect(400);
  });

  it('el admin elimina un elemento de la bandeja', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/feedback/admin/errors')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/feedback/${list.body[0].id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const after = await request(app.getHttpServer())
      .get('/api/feedback/admin/errors')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(after.body.length).toBe(0);
  });
});
