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
import { initializeDatabase, closeDatabase } from './db';
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
  // Detrás de Caddy/nginx/Cloudflare: confía en el primer proxy para IP real
  // (afecta al rate limiting por IP del ThrottlerGuard).
  app.set('trust proxy', 1);
  app.use(cookieParser());

  const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:4200';
  const backendOrigin = process.env.BACKEND_URL || 'http://localhost:3000';
  // Origen público de las imágenes en Supabase Storage (host, no la URL completa del objeto).
  const supabaseStorageOrigin = process.env.SUPABASE_PROJECT_REF
    ? `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co`
    : undefined;

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
          imgSrc: supabaseStorageOrigin
            ? ["'self'", 'data:', backendOrigin, supabaseStorageOrigin]
            : ["'self'", 'data:', backendOrigin],
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
    fallthrough: true,
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

  app.enableShutdownHooks();
  const shutdown = async (signal: string) => {
    console.log(`Señal ${signal} recibida, cerrando backend...`);
    await app.close();
    await closeDatabase();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  await app.listen(process.env.PORT || 3000);
  console.log('Backend AdrianStore escuchando en http://localhost:' + (process.env.PORT || 3000));
}
bootstrap();
