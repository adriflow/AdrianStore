import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { StoreOwnerGuard } from '../auth/store-owner.guard';
import { StoreService } from './store.service';

class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  username!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password!: string;
}

class UpdateStoreAdminDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  whatsappDefault?: string;

  @IsOptional()
  priority?: number | null;
}

class UpdateStoreOwnerDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  whatsappDefault?: string;
}

class ChangeCredentialsDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(72)
  password?: string;
}

class SetClosedDto {
  @IsBoolean()
  isClosed!: boolean;
}

@Controller('api/stores')
@ApiTags('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get()
  @ApiOperation({ summary: 'Lista de negocios abiertos (público)' })
  findAllPublic() {
    return this.storeService.findAllPublic();
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Info pública de un negocio por slug' })
  async getBySlug(@Param('slug') slug: string) {
    const store = await this.storeService.findBySlug(slug);
    if (!store || store.is_closed) {
      return null;
    }
    const { password_hash, username, ...publicInfo } = store as any;
    return publicInfo;
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Lista de todos los negocios con credenciales (solo superadmin)' })
  findAllAdmin() {
    return this.storeService.findAllAdmin();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Crear un negocio (solo superadmin)' })
  create(@Body() dto: CreateStoreDto) {
    return this.storeService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Editar color, whatsapp default y prioridad (solo superadmin)' })
  updateAdmin(@Param('id') id: string, @Body() dto: UpdateStoreAdminDto) {
    return this.storeService.updateAdmin(id, dto);
  }

  @Patch(':id/closed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Cerrar o reabrir un negocio (solo superadmin)' })
  setClosed(@Param('id') id: string, @Body() dto: SetClosedDto) {
    return this.storeService.setClosed(id, dto.isClosed);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Eliminar un negocio y todos sus productos (solo superadmin)' })
  async remove(@Param('id') id: string) {
    await this.storeService.remove(id);
    return { message: 'Negocio eliminado' };
  }

  @Put(':id/me')
  @UseGuards(JwtAuthGuard, StoreOwnerGuard)
  @ApiOperation({ summary: 'El dueño edita su color y whatsapp default' })
  updateOwner(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateStoreOwnerDto) {
    const user = req.user;
    if (user.role !== 'admin' && user.storeId !== id) {
      return this.storeService.updateAdmin(id, {
        color: dto.color,
        whatsappDefault: dto.whatsappDefault,
      });
    }
    return this.storeService.updateAdmin(id, {
      color: dto.color,
      whatsappDefault: dto.whatsappDefault,
    });
  }

  @Patch(':id/credentials')
  @UseGuards(JwtAuthGuard, StoreOwnerGuard)
  @ApiOperation({ summary: 'El dueño cambia su usuario y/o contraseña' })
  async changeCredentials(@Param('id') id: string, @Req() req: any, @Body() dto: ChangeCredentialsDto) {
    const user = req.user;
    if (user.role !== 'admin' && user.storeId !== id) {
      // owner no puede tocar credenciales de otro negocio
      return { message: 'Forbidden' };
    }
    await this.storeService.changeCredentials(id, dto);
    return { message: 'Credenciales actualizadas' };
  }
}
