import { BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { basename, join } from 'path';
import { writeFile, unlink } from 'fs/promises';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_FILES = 8;
export const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

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

// Valida y guarda cada imagen en disco con nombre aleatorio y extensión derivada del contenido real.
export async function saveImages(files: Express.Multer.File[], uploadPath: string, baseUrl: string): Promise<string[]> {
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
      await writeFile(join(uploadPath, filename), file.buffer);
      urls.push(`${baseUrl}/uploads/${filename}`);
    }
    return urls;
  } catch (error) {
    await Promise.all(urls.map((url) => unlink(join(uploadPath, basename(url))).catch(() => undefined)));
    throw error;
  }
}
