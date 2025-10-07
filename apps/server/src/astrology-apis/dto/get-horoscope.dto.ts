import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber } from 'class-validator';

export class GetHoroscopeDto {
  @ApiProperty({ example: '1999-08-15', description: 'ISO date (YYYY-MM-DD)' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ example: 12.9716 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 77.5946 })
  @IsNumber()
  longitude: number;
}
