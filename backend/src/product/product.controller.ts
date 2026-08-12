import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';
import { ProductType } from './product-type.enum';
import { CurrencyType } from './currency-type.enum';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';

const uploadPath = join(process.cwd(), 'uploads');
if (!existsSync(uploadPath)) {
  mkdirSync(uploadPath, { recursive: true });
}

function fileName(req: any, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) {
  const fileExtension = file.originalname.split('.').pop();
  const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  callback(null, `${safeName}.${fileExtension}`);
}

@Controller('api/products')
@ApiTags('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener lista de productos' })
  @ApiResponse({ status: 200, description: 'Lista de productos recuperada.', type: ProductResponseDto, isArray: true })
  getAll(@Query('type') type?: string): Promise<ProductResponseDto[]> {
    return this.productService.findAll(type);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: uploadPath,
        filename: fileName,
      }),
      fileFilter: (req, file, callback) => {
        const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowed.includes(file.mimetype)) {
          return callback(new BadRequestException('Solo se permiten imágenes PNG, JPG o WebP'), false);
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        whatsapp: { type: 'string' },
        type: { type: 'string', enum: Object.values(ProductType) },
        currency: { type: 'string', enum: Object.values(CurrencyType) },
        acceptsTransfer: { type: 'boolean' },
      },
      required: ['price'],
    },
  })
  @ApiOperation({ summary: 'Crear un producto nuevo' })
  @ApiResponse({ status: 201, description: 'Producto creado correctamente.', type: ProductResponseDto })
  create(@UploadedFiles() images: Express.Multer.File[], @Body() createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const imageUrls = (images || []).map((file) => `${backendUrl}/uploads/${file.filename}`);
    const imageUrl = imageUrls[0] || '';
    return this.productService.create({ ...createProductDto, imageUrl, imageUrls });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: uploadPath,
        filename: fileName,
      }),
      fileFilter: (req, file, callback) => {
        const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowed.includes(file.mimetype)) {
          return callback(new BadRequestException('Solo se permiten imágenes PNG, JPG o WebP'), false);
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        whatsapp: { type: 'string' },
        type: { type: 'string', enum: Object.values(ProductType) },
        currency: { type: 'string', enum: Object.values(CurrencyType) },
        acceptsTransfer: { type: 'boolean' },
      },
    },
  })
  @ApiOperation({ summary: 'Actualizar un producto existente' })
  @ApiResponse({ status: 200, description: 'Producto actualizado correctamente.', type: ProductResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFiles() images: Express.Multer.File[],
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const imageUrls = (images || []).map((file) => `${backendUrl}/uploads/${file.filename}`);
    const imageUrl = imageUrls[0];
    return this.productService.update(id, { ...updateProductDto, imageUrl, imageUrls });
  }

    @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por id' })
  @ApiResponse({ status: 200, description: 'Producto encontrado.', type: ProductResponseDto })
  async getOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<ProductResponseDto> {
    return this.productService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Eliminar un producto' })
  @ApiResponse({ status: 200, description: 'Producto eliminado correctamente.' })
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.productService.delete(id);
    return { message: 'Producto eliminado' };
  }

  @Get(':id/whatsapp')
  @ApiOperation({ summary: 'Obtener enlace de WhatsApp para producto' })
  @ApiResponse({ status: 200, description: 'Enlace de WhatsApp generado', schema: { example: 'https://wa.me/5359028922?text=Hola%2C%20me%20interesa%20el%20producto%20Aud%C3%ADfonos%20inal%C3%A1mbricos%20(%24%201299.99%20USD).%20%C2%BFEst%C3%A1%20disponible%3F' } })
  async getWhatsappLink(@Param('id', new ParseUUIDPipe()) id: string): Promise<{ url: string }> {
    const product = await this.productService.findOne(id);
    const phone = (product.whatsapp || '').trim() || '59028922';
    const text = encodeURIComponent(
      `Hola, me interesa el producto ${product.name} (${product.currency} ${product.price}). ¿Está disponible?`,
    );
    const url = `https://wa.me/${phone}?text=${text}`;
    return { url };
  }
}
