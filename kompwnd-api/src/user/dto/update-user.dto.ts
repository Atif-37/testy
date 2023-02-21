import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  account_name: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  created_at: Date;
}
