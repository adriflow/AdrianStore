import { Body, Controller, Get, Param, Put, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { StoreOwnerGuard } from '../auth/store-owner.guard';
import { AboutService } from './about.service';
import { StoreService } from '../store/store.service';
import { saveImages, MAX_FILE_SIZE } from '../security/uploads';

class UpdateAboutDto {
  @IsString()
  @MaxLength(10000)
  content!: string;
}

@Controller('api/about')
@ApiTags('about')
export class AboutController {
  constructor(
    private readonly aboutService: AboutService,
    private readonly storeService: StoreService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener el contenido de "Sobre mí" (global o de un negocio si se pasa ?storeId=)' })
  @ApiResponse({ status: 200, description: 'Contenido de "Sobre mí"', schema: { example: { content: 'Hola, soy Adrián...', updatedAt: '2026-01-01T00:00:00.000Z', imageUrl: 'https://...' } } })
  getAbout(@Query('storeId') storeId?: string): Promise<{ content: string; updatedAt: string; imageUrl?: string }> {
    return this.aboutService.getAbout(storeId || null);
  }

  @Get('store/:slug')
  @ApiOperation({ summary: 'Obtener "Sobre mí" de un negocio por slug' })
  @ApiResponse({ status: 200, description: 'Contenido del "Sobre mí" del negocio' })
  async getByStoreSlug(@Param('slug') slug: string): Promise<{ content: string; updatedAt: string; imageUrl?: string }> {
    const store = await this.storeService.findBySlug(slug);
    if (!store) {
      return { content: '', updatedAt: '' };
    }
    return this.aboutService.getAbout(store.id);
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
  @ApiOperation({ summary: 'Actualizar "Sobre mí" global (solo superadmin)' })
  @ApiResponse({ status: 200, description: 'Contenido actualizado' })
  async updateAbout(
    @Body() dto: UpdateAboutDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<{ content: string; updatedAt: string; imageUrl?: string }> {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const imageUrl = image ? (await saveImages([image], backendUrl))[0] : undefined;
    return this.aboutService.updateAbout(dto.content, imageUrl, null);
  }

  @Put('store/:slug')
  @UseGuards(JwtAuthGuard, StoreOwnerGuard)
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
  @ApiOperation({ summary: 'Actualizar "Sobre mí" de un negocio (dueño o superadmin)' })
  @ApiResponse({ status: 200, description: 'Contenido actualizado' })
  async updateStoreAbout(
    @Param('slug') slug: string,
    @Req() req: any,
    @Body() dto: UpdateAboutDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<{ content: string; updatedAt: string; imageUrl?: string }> {
    const user = req.user;
    const store = await this.storeService.findBySlug(slug);
    if (!store) {
      return { content: '', updatedAt: '' };
    }
    // el dueño solo puede editar el about de su negocio
    if (user.role === 'owner' && user.storeId !== store.id) {
      return { content: '', updatedAt: '' };
    }
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const imageUrl = image ? (await saveImages([image], backendUrl))[0] : undefined;
    return this.aboutService.updateAbout(dto.content, imageUrl, store.id);
  }
}
