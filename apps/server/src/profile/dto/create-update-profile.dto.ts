import { PartialType } from '@nestjs/swagger';
import { Gender } from '@repo/db';
import { ProfileInput } from '@repo/shared-types/types';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProfileDto implements ProfileInput {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @IsString()
  @IsOptional()
  timeOfBirth?: string;

  @IsString()
  @IsNotEmpty()
  placeOfBirth: string;

  @IsEnum(Gender)
  @IsNotEmpty()
  gender: any;
}

export class UpdateProfileDto extends PartialType(CreateProfileDto) {}
