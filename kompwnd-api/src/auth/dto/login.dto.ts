import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  account_name: string;

  @IsNotEmpty()
  @IsString()
  pin: string;
}
