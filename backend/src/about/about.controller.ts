import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AboutService } from './about.service';

class UpdateAboutDto {
  @IsString()
  content!: string;
}

@Controller('api/about')
@ApiTags('about')
export class AboutController {
  constructor(private readonly aboutService: AboutService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener el contenido de "Sobre mí"' })
  @ApiResponse({ status: 200, description: 'Contenido de "Sobre mí"', schema: { example: { content: 'Hola, soy Adrián...', updatedAt: '2026-01-01T00:00:00.000Z' } } })
  getAbout(): Promise<{ content: string; updatedAt: string }> {
    return this.aboutService.getAbout();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Actualizar el contenido de "Sobre mí" (solo admin)' })
  @ApiResponse({ status: 200, description: 'Contenido actualizado' })
  updateAbout(@Body() dto: UpdateAboutDto): Promise<{ content: string; updatedAt: string }> {
    return this.aboutService.updateAbout(dto.content);
  }
}
