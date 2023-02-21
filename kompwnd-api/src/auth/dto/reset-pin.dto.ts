import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPinDto {
  @IsNotEmpty()
  @IsString()
  pin: string;

  @IsNotEmpty()
  @IsString()
  new_pin: string;
}
