import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsNumber } from 'class-validator';

export class GetHoroscopeDto {
  @ApiProperty({ example: '1999-08-15T00:00:00.000Z', description: 'ISO date (YYYY-MM-DDTHH:MM:SS.SSSZ)' })
  @IsISO8601()
  dateOfBirth: string;

  @ApiProperty({ example: 12.9716 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 77.5946 })
  @IsNumber()
  longitude: number;
}
