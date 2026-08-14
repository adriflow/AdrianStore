import { config as dotenvConfig } from 'dotenv';
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
import { requireEnv } from './security/env';
import { MulterExceptionFilter } from './security/multer.filter';
import { originGuard } from './security/origin.middleware';

const isProduction = process.env.NODE_ENV === 'production';

// Modo pruebas LAN: si existe .env.local, sobreescribe .env.
// Bórralo y el backend vuelve a la configuración normal.
dotenvConfig();
dotenvConfig({ path: join(process.cwd(), '.env.local'), override: true });

async function bootstrap() {
  requireEnv('JWT_SECRET');

  await initializeDatabase();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.disable('x-powered-by');
  app.use(cookieParser());

  const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:4200';
  const backendOrigin = process.env.BACKEND_URL || 'http://localhost:3000';

  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          fontSrc: ["'self'", 'https:', 'data:'],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          imgSrc: ["'self'", 'data:', backendOrigin],
          connectSrc: ["'self'", backendOrigin],
          objectSrc: ["'none'"],
          scriptSrc: isProduction ? ["'self'"] : ["'self'", "'unsafe-inline'"],
          scriptSrcAttr: ["'none'"],
          styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
          upgradeInsecureRequests: isProduction ? [] : null,
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use(originGuard);
  app.useGlobalFilters(new MulterExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: isProduction,
    }),
  );

  const uploadsPath = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsPath)) {
    mkdirSync(uploadsPath, { recursive: true });
  }
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
    index: false,
    dotfiles: 'deny',
    fallthrough: false,
  });

  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('AdrianStore API')
      .setDescription('API para el catálogo de productos AdrianStore')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(process.env.PORT || 3000);
  console.log('Backend AdrianStore escuchando en http://localhost:' + (process.env.PORT || 3000));
}
bootstrap();
