import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { initializeDatabase } from './db';

async function bootstrap() {
  await initializeDatabase();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  });
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const uploadsPath = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsPath)) {
    mkdirSync(uploadsPath, { recursive: true });
  }
  app.useStaticAssets(uploadsPath, { prefix: '/uploads/' });

  const config = new DocumentBuilder()
    .setTitle('AdrianStore API')
    .setDescription('API para el catálogo de productos AdrianStore')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT || 3000);
  console.log('Backend AdrianStore escuchando en http://localhost:' + (process.env.PORT || 3000));
}
bootstrap();
