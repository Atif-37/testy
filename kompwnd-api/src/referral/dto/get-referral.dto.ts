import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class GetReferralDto {
  @IsOptional()
  @IsString()
  account_name: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  claimed: boolean;

  @IsOptional()
  @IsString()
  offset: string;

  @IsOptional()
  @IsString()
  limit: string;
}
