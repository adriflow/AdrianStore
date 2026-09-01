import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { FeedbackService } from './feedback.service';

class CreateFeedbackDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['error', 'suggestion'])
  kind!: 'error' | 'suggestion';

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message!: string;
}

class SetApprovedDto {
  @IsIn([true, false])
  approved!: boolean;
}

@Controller('api/feedback')
@ApiTags('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un reporte de error o sugerencia/valoración (público)' })
  create(@Body() dto: CreateFeedbackDto) {
    return this.feedbackService.create(dto);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Sugerencias/valoraciones aprobadas y visibles (público)' })
  approvedSuggestions() {
    return this.feedbackService.findApprovedSuggestions();
  }

  @Get('admin/errors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Bandeja de errores reportados (solo superadmin)' })
  adminErrors() {
    return this.feedbackService.findAllByKind('error');
  }

  @Get('admin/suggestions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Bandeja de sugerencias/valoraciones (solo superadmin)' })
  adminSuggestions() {
    return this.feedbackService.findAllByKind('suggestion');
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Aceptar/rechazar visibilidad de una sugerencia (solo superadmin)' })
  approve(@Param('id') id: string, @Body() dto: SetApprovedDto) {
    return this.feedbackService.setApproved(id, dto.approved);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Eliminar un elemento de la bandeja (solo superadmin)' })
  remove(@Param('id') id: string) {
    return this.feedbackService.remove(id);
  }
}
