import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { LoginInput } from '@repo/shared-types/types';
export class LoginGoogleDto {
  @IsNotEmpty()
  @IsString()
  idToken: string;
}
export class LoginEmailDto implements LoginInput {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
