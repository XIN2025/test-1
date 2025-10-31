import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsISO8601, IsNumber } from 'class-validator';

export class BaseRequestDto {
  @ApiProperty({ example: 12.9716 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 77.5946 })
  @IsNumber()
  longitude: number;

  @ApiProperty({ example: 5.5 })
  @IsNumber()
  @Type(() => Number)
  timezoneOffset: number;
}

export class GetHoroscopeDto extends BaseRequestDto {
  @ApiProperty({ example: '1999-08-15T00:00:00.000Z', description: 'ISO date and time (YYYY-MM-DDTHH:MM:SS.SSSZ)' })
  @IsISO8601()
  dateAndTime: string;
}
