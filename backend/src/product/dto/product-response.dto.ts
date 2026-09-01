import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType } from '../product-type.enum';
import { CurrencyType } from '../currency-type.enum';
import { ProvinceType } from '../province.enum';

export class ProductResponseDto {
  @ApiProperty({ example: '01H5J8KZ0A9B2C3D4E5F6G7H8I' })
  id!: string;

  @ApiProperty({ example: 'Audífonos inalámbricos' })
  name!: string;

  @ApiProperty({ example: 'Audífonos bluetooth con cancelación de ruido' })
  description!: string;

  @ApiProperty({ example: 1299.99 })
  price!: number;

  @ApiProperty({ example: 'http://localhost:3000/uploads/12345.jpg' })
  imageUrl!: string;

  @ApiProperty({ type: [String], example: ['http://localhost:3000/uploads/12345.jpg'], required: false })
  imageUrls?: string[];

  @ApiProperty({ enum: CurrencyType, example: CurrencyType.CUP })
  currency!: CurrencyType;

  @ApiProperty({ example: true })
  acceptsTransfer!: boolean;

  @ApiProperty({ example: '5211234567890', required: false })
  whatsapp?: string;

  @ApiProperty({ enum: ProductType, example: ProductType.TECNOLOGIA })
  type!: ProductType;

  @ApiProperty({ enum: ProvinceType, example: ProvinceType.CAMAGUEY })
  province!: ProvinceType;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Id del negocio al que pertenece (null = producto del superadmin)' })
  storeId?: string;

  @ApiPropertyOptional({ example: 'Tienda Mario', description: 'Nombre del negocio (etiqueta de origen)' })
  storeName?: string;

  @ApiProperty({ example: true, description: 'Si es público sale en el catálogo; si no, solo en su negocio' })
  isPublic!: boolean;
}
