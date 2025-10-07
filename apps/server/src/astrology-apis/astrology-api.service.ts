import { Injectable } from '@nestjs/common';
import { GetHoroscopeDto } from './dto/get-horoscope.dto';

@Injectable()
export class AstrologyApiService {
  constructor() {}

  getHoroscope(dto: GetHoroscopeDto) {
    console.log(dto);
  }
}
