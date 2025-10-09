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
    const [year, month, day] = dto.dateOfBirth.split('-').map(Number);
    const [hour, min] = dto.dateOfBirth.split('T')[1].split(':').map(Number);

    const data = JSON.stringify({
      day,
      month,
      year,
      hour,
      min,
      lat: dto.latitude,
      lon: dto.longitude,
      tzone: 5.5,
    });

    return fetch(url, {
      method: 'POST',
      headers: {
        authorization: auth,
        'Content-Type': 'application/json',
        'Accept-Language': language,
      },
      body: data,
    }).then((res) => {
      if (!res.ok) {
        return res.json().then((err) => {
          throw new HttpException(err?.msg || 'Failed to fetch horoscope chart', res.status);
        });
      }
      return res.json();
    });
  }
}
