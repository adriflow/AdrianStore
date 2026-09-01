import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { ProductType } from '../product-type.enum';
import { CurrencyType } from '../currency-type.enum';
import { ProvinceType } from '../province.enum';
import { sanitizeText, sanitizePhone } from '../../security/sanitize';

export class CreateProductDto {
  @ApiProperty({ example: 'Audífonos inalámbricos' })
  @Transform(({ value }) => (value === undefined ? value : sanitizeText(value, 120)))
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'Audífonos bluetooth con cancelación de ruido' })
  @Transform(({ value }) => (value === undefined ? value : sanitizeText(value, 2000)))
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 1299.99 })
  @Type(() => Number)
  @IsNumber()
  price!: number;

  @ApiPropertyOptional({ example: '5211234567890' })
  @Transform(({ value }) => (value === undefined ? value : sanitizePhone(value)))
  @IsOptional()
  @IsString()
  @MaxLength(20)
  whatsapp?: string;

  @ApiPropertyOptional({ enum: ProductType, example: ProductType.TECNOLOGIA })
  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;

  @ApiPropertyOptional({ enum: CurrencyType, example: CurrencyType.CUP })
  @IsEnum(CurrencyType)
  @IsOptional()
  currency?: CurrencyType;

  @ApiPropertyOptional({ example: true, description: 'Indica si el producto se puede pagar por transferencia' })
  @Transform(({ value }) => value === 'true' || value === true || value === '1')
  @IsBoolean()
  @IsOptional()
  acceptsTransfer?: boolean;

  @ApiPropertyOptional({ enum: ProvinceType, example: ProvinceType.CAMAGUEY, description: 'Provincia de venta del producto' })
  @IsEnum(ProvinceType)
  @IsOptional()
  province?: ProvinceType;

  @ApiPropertyOptional({ example: true, description: 'Si es público sale en el catálogo; si no, solo en su negocio (por defecto true)' })
  @Transform(({ value }) => value === 'true' || value === true || value === '1')
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
