import { Body, Controller, Get, Put, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AboutService } from './about.service';
import { saveImages, MAX_FILE_SIZE } from '../security/uploads';

class UpdateAboutDto {
  @IsString()
  @MaxLength(10000)
  content!: string;
}

@Controller('api/about')
@ApiTags('about')
export class AboutController {
  constructor(private readonly aboutService: AboutService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener el contenido de "Sobre mí"' })
  @ApiResponse({ status: 200, description: 'Contenido de "Sobre mí"', schema: { example: { content: 'Hola, soy Adrián...', updatedAt: '2026-01-01T00:00:00.000Z', imageUrl: 'https://...' } } })
  getAbout(): Promise<{ content: string; updatedAt: string; imageUrl?: string }> {
    return this.aboutService.getAbout();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Actualizar el contenido y la foto de "Sobre mí" (solo admin)' })
  @ApiResponse({ status: 200, description: 'Contenido actualizado' })
  async updateAbout(
    @Body() dto: UpdateAboutDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<{ content: string; updatedAt: string; imageUrl?: string }> {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const imageUrl = image ? (await saveImages([image], backendUrl))[0] : undefined;
    return this.aboutService.updateAbout(dto.content, imageUrl);
  }
}
