import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class GetMatchDto {
  @IsOptional()
  @IsString()
  account_name: string;

  @IsOptional()
  @IsString()
  claimed: string;

  // @IsOptional()
  // @IsBoolean()
  // @Transform(({ value }) => value === 'true')
  // claimed: boolean;

  @IsOptional()
  @IsString()
  offset?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
