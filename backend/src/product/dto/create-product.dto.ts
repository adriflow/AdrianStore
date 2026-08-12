import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ProductType } from '../product-type.enum';
import { CurrencyType } from '../currency-type.enum';

export class CreateProductDto {
  @ApiProperty({ example: 'Audífonos inalámbricos' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Audífonos bluetooth con cancelación de ruido' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1299.99 })
  @Type(() => Number)
  @IsNumber()
  price!: number;

  @ApiPropertyOptional({ example: '5211234567890' })
  @IsOptional()
  @IsString()
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
}
