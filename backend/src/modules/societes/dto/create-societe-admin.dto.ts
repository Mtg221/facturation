import { IsString, IsEmail, MinLength } from 'class-validator';

export class CreateSocieteAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  nom: string;

  @IsString()
  @MinLength(2)
  prenom: string;
}
