import { Controller, Post, Body } from '@nestjs/common';
import { AstrologyApiService } from './astrology-api.service';
import { GetHoroscopeDto } from './dto/get-horoscope.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Astrology API')
@Controller('astrology-api')
export class AstrologyApiController {
  constructor(private readonly astrologyApiService: AstrologyApiService) {}

  @Post('horoscope')
  @ApiOperation({ summary: 'Get horoscope using Astrology API' })
  @ApiResponse({ status: 200, description: 'Returns horoscope prediction.' })
  getHoroscope(@Body() dto: GetHoroscopeDto) {
    return this.astrologyApiService.getHoroscope(dto);
  }
}
