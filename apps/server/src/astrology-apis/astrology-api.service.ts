import { Injectable, HttpException } from '@nestjs/common';
import { GetHoroscopeDto } from './dto/get-horoscope.dto';
import { config } from '../common/config';

@Injectable()
export class AstrologyApiService {
  async getHoroscope(dto: GetHoroscopeDto) {
    const { userId, apiKey, language } = config.astrology;
    const chart_id = 'D1';

    if (!userId || !apiKey) {
      throw new HttpException('Missing Astrology API credentials', 500);
    }

    const auth = 'Basic ' + Buffer.from(`${userId}:${apiKey}`).toString('base64');
    const url = `https://json.astrologyapi.com/v1/horo_chart/${chart_id}`;
    const [datePart, timePart] = dto.dateOfBirth.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, min] = timePart.split(':').map(Number);

    const data = JSON.stringify({
      day,
      month,
      year,
      hour,
      min,
      lat: dto.latitude,
      lon: dto.longitude,
      tzone: dto.timezoneOffset,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        authorization: auth,
        'Content-Type': 'application/json',
        'Accept-Language': language,
      },
      body: data,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new HttpException(err?.msg || 'Failed to fetch horoscope chart', response.status);
    }

    const responseData = await response.json();

    return {
      success: true,
      data: responseData,
    };
  }
}
