import { BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { basename, join } from 'path';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_FILES = 8;
export const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
};

const localUploadPath = join(process.cwd(), 'uploads');

// R2 (o cualquier bucket S3-compatible) es el storage real de producción. Si no está
// configurado (dev local, tests), se usa disco local igual que antes — mismo patrón
// que db.ts con DATABASE_URL: la presencia de las variables decide el backend.
function hasR2Config(): boolean {
  return (
    !!process.env.R2_ACCOUNT_ID &&
    !!process.env.R2_ACCESS_KEY_ID &&
    !!process.env.R2_SECRET_ACCESS_KEY &&
    !!process.env.R2_BUCKET &&
    !!process.env.R2_PUBLIC_URL
  );
}

let s3Client: S3Client | null = null;
function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3Client;
}

function r2PublicUrl(filename: string): string {
  return `${(process.env.R2_PUBLIC_URL as string).replace(/\/$/, '')}/${filename}`;
}

// Detecta el tipo real de la imagen por sus bytes mágicos (no confía en el mimetype del cliente).
export function detectImageExtension(buffer: Buffer): string | null {
  const len = buffer.length;
  if (len >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'webp';
  }
  if (
    len >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }
  if (len >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpg';
  }
  return null;
}

// Valida cada imagen (tamaño, mimetype, bytes mágicos) y la sube a R2 (o disco local si R2
// no está configurado), con nombre aleatorio y extensión derivada del contenido real.
export async function saveImages(files: Express.Multer.File[], baseUrl: string): Promise<string[]> {
  const useR2 = hasR2Config();
  if (!useR2 && !existsSync(localUploadPath)) {
    await mkdir(localUploadPath, { recursive: true });
  }

  const urls: string[] = [];
  try {
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        throw new BadRequestException('Cada imagen no puede superar los 5 MB');
      }
      if (!ALLOWED_MIME.has(file.mimetype)) {
        throw new BadRequestException('Tipo de archivo no permitido');
      }
      const ext = detectImageExtension(file.buffer);
      if (!ext) {
        throw new BadRequestException('El archivo no es una imagen válida (PNG, JPG o WebP)');
      }
      const filename = `${Date.now()}-${randomBytes(8).toString('hex')}.${ext}`;

      if (useR2) {
        await getS3Client().send(
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: filename,
            Body: file.buffer,
            ContentType: CONTENT_TYPE_BY_EXT[ext],
          }),
        );
        urls.push(r2PublicUrl(filename));
      } else {
        await writeFile(join(localUploadPath, filename), file.buffer);
        urls.push(`${baseUrl}/uploads/${filename}`);
      }
    }
    return urls;
  } catch (error) {
    await deleteImages(urls);
    throw error;
  }
}

// Borra imágenes por URL, en R2 o disco local según dónde vivan. Nunca lanza: es limpieza
// best-effort (una imagen que ya no existe, o un fallo de red al borrar, no debe romper la
// operación que la disparó).
export async function deleteImages(urls: string[]): Promise<void> {
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');
  await Promise.all(
    urls.filter(Boolean).map(async (url) => {
      if (publicUrl && url.startsWith(publicUrl)) {
        await getS3Client()
          .send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: basename(url) }))
          .catch(() => undefined);
      } else {
        await unlink(join(localUploadPath, basename(url))).catch(() => undefined);
      }
    }),
  );
}
