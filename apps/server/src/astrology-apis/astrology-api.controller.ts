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

  @Post('planets')
  @ApiOperation({ summary: 'Get planets using Astrology API' })
  @ApiResponse({ status: 200, description: 'Returns planets data.' })
  getPlanets(@Body() dto: GetHoroscopeDto) {
    return this.astrologyApiService.getPlanets(dto);
  }

  @Post('shadbala/summary')
  @ApiOperation({ summary: 'Get shadbala summary using Astrology API' })
  @ApiResponse({ status: 200, description: 'Returns shadbala summary data.' })
  getShadbalaSummary(@Body() dto: GetHoroscopeDto) {
    return this.astrologyApiService.getShadbalaSummary(dto);
  }

  @Post('shadbala/break-up')
  @ApiOperation({ summary: 'Get shadbala break up using Astrology API' })
  @ApiResponse({ status: 200, description: 'Returns shadbala break up data.' })
  getShadbalaBreakUp(@Body() dto: GetHoroscopeDto) {
    return this.astrologyApiService.getShadbalaBreakUp(dto);
  }

  @Post('vimsottari/maha-dasas-and-antar-dasas')
  @ApiOperation({ summary: 'Get vimsottari maha dasas and antar dasas using Astrology API' })
  @ApiResponse({ status: 200, description: 'Returns vimsottari maha dasas and antar dasas data.' })
  getAntarAndMahaDasas(@Body() dto: GetHoroscopeDto) {
    return this.astrologyApiService.getAntarAndMahaDasas(dto);
  }
}
