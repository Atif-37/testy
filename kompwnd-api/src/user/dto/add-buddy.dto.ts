import { IsNotEmpty, IsString } from 'class-validator';

export class AddBuddyDto {
  @IsNotEmpty()
  @IsString()
  buddy: string;
}
