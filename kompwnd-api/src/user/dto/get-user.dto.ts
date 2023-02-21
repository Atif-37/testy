import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class GetUserDto {
  @IsOptional()
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  account_name: string;

  @IsOptional()
  @IsString()
  brand_id: string;

  @IsOptional()
  @IsString()
  q: string;

  @IsOptional()
  @IsString()
  offset: string;

  @IsOptional()
  @IsString()
  limit: string;
}
