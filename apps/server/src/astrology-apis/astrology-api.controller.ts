import { Controller, Post, Body } from '@nestjs/common';
import { AstrologyApiService } from './astrology-api.service';
import { BaseRequestDto, GetHoroscopeDto } from './dto/get-horoscope.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Astrology API')
@Controller('astrology-api')
export class AstrologyApiController {
  constructor(private readonly astrologyApiService: AstrologyApiService) {}

  @Post('horoscope')
  @ApiOperation({ summary: 'Get horoscope (planets, shadbala summary, shadbala break up, antar and maha dasas)' })
  @ApiResponse({ status: 200, description: 'Returns horoscope prediction.' })
  getHoroscope(@Body() dto: GetHoroscopeDto) {
    return this.astrologyApiService.getHoroscope(dto);
  }

  @Post('planets')
  @ApiOperation({ summary: 'Get planets' })
  @ApiResponse({ status: 200, description: 'Returns planets data.' })
  getPlanets(@Body() dto: GetHoroscopeDto) {
    return this.astrologyApiService.getPlanets(dto);
  }

  @Post('shadbala/summary')
  @ApiOperation({ summary: 'Get shadbala summary' })
  @ApiResponse({ status: 200, description: 'Returns shadbala summary data.' })
  getShadbalaSummary(@Body() dto: GetHoroscopeDto) {
    return this.astrologyApiService.getShadbalaSummary(dto);
  }

  @Post('shadbala/break-up')
  @ApiOperation({ summary: 'Get shadbala break up' })
  @ApiResponse({ status: 200, description: 'Returns shadbala break up data.' })
  getShadbalaBreakUp(@Body() dto: GetHoroscopeDto) {
    return this.astrologyApiService.getShadbalaBreakUp(dto);
  }

  @Post('vimsottari/maha-dasas-and-antar-dasas')
  @ApiOperation({ summary: 'Get vimsottari maha dasas and antar dasas' })
  @ApiResponse({ status: 200, description: 'Returns vimsottari maha dasas and antar dasas data.' })
  getAntarAndMahaDasas(@Body() dto: GetHoroscopeDto) {
    return this.astrologyApiService.getAntarAndMahaDasas(dto);
  }

  @Post('transit/current-planets')
  @ApiOperation({ summary: 'Get current transit planets' })
  @ApiResponse({ status: 200, description: 'Returns current transit planets data.' })
  getCurrentTransitPlanets(@Body() dto: BaseRequestDto) {
    return this.astrologyApiService.getCurrentTransitPlanets(dto);
  }

  @Post('chart/navamsa')
  @ApiOperation({ summary: 'Get navamsa chart (D9)' })
  @ApiResponse({ status: 200, description: 'Returns navamsa chart data.' })
  getNavamsaChart(@Body() dto: GetHoroscopeDto) {
    return this.astrologyApiService.getNavamsaChart(dto);
  }

  @Post('chart/d10')
  @ApiOperation({ summary: 'Get d10 chart (D10)' })
  @ApiResponse({ status: 200, description: 'Returns d10 chart data.' })
  getD10Chart(@Body() dto: GetHoroscopeDto) {
    return this.astrologyApiService.getD10Chart(dto);
  }
}
