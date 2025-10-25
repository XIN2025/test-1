import { Injectable, HttpException } from '@nestjs/common';
import { GetHoroscopeDto } from './dto/get-horoscope.dto';
import { config } from '../common/config';

@Injectable()
export class AstrologyApiService {
  private flattenDashaData(data: any) {
    const result: any[] = [];
    for (const maha in data) {
      if (Object.prototype.hasOwnProperty.call(data, maha)) {
        const antarDashas = data[maha];
        for (const antar in antarDashas) {
          if (Object.prototype.hasOwnProperty.call(antarDashas, antar)) {
            const { start_time, end_time } = antarDashas[antar];
            result.push({
              maha,
              antar,
              start: start_time,
              end: end_time,
            });
          }
        }
      }
    }
    return result;
  }

  async getHoroscopeChartImageUrl(dto: GetHoroscopeDto) {
    const { apiKey } = config.freeAstrology;

    if (!apiKey) {
      throw new HttpException('Missing Astrology API credentials', 500);
    }

    const [datePart, timePart] = dto.dateOfBirth.split('T');
    const [year, month, date] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    const data = JSON.stringify({
      date,
      month,
      year,
      hours,
      minutes,
      seconds: 0,
      latitude: dto.latitude,
      longitude: dto.longitude,
      timezone: dto.timezoneOffset,
      settings: {
        observation_point: 'topocentric',
        ayanamsha: 'lahiri',
        language: 'en',
      },
    });

    const url = `https://json.freeastrologyapi.com/horoscope-chart-url`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: data,
    });

    if (!response.ok) {
      const err = await response.json();
      console.log(response);
      throw new HttpException(err?.msg || 'Failed to fetch horoscope chart', response.status);
    }

    const responseData = (await response.json()).output;

    return {
      data: responseData,
    };
  }

  async getHoroscope(dto: GetHoroscopeDto) {
    const [planets, shadbalaSummary, shadbalaBreakUp, antarAndMahaDasas, horoscopeChartImageUrl] = await Promise.all([
      this.getPlanets(dto),
      this.getShadbalaSummary(dto),
      this.getShadbalaBreakUp(dto),
      this.getAntarAndMahaDasas(dto),
      this.getHoroscopeChartImageUrl(dto),
    ]);

    return {
      horoscopeChartImageUrl: horoscopeChartImageUrl?.data,
      planets: planets?.data,
      shadbalaSummary: shadbalaSummary?.data,
      shadbalaBreakUp: shadbalaBreakUp?.data,
      antarAndMahaDasas: antarAndMahaDasas?.data,
    };
  }

  async getPlanets(dto: GetHoroscopeDto) {
    const { apiKey } = config.freeAstrology;

    if (!apiKey) {
      throw new HttpException('Missing Astrology API credentials', 500);
    }

    const [datePart, timePart] = dto.dateOfBirth.split('T');
    const [year, month, date] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    const data = JSON.stringify({
      date,
      month,
      year,
      hours,
      minutes,
      seconds: 0,
      latitude: dto.latitude,
      longitude: dto.longitude,
      timezone: dto.timezoneOffset,
      settings: {
        observation_point: 'topocentric',
        ayanamsha: 'lahiri',
        language: 'en',
      },
    });

    const url = `https://json.apiastro.com/planets/extended`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: data,
    });

    if (!response.ok) {
      const err = await response.json();
      console.log(response);
      throw new HttpException(err?.msg || 'Failed to fetch horoscope chart', response.status);
    }

    const responseData = (await response.json()).output;

    return {
      data: responseData,
    };
  }

  async getShadbalaBreakUp(dto: GetHoroscopeDto) {
    const { apiKey } = config.freeAstrology;

    if (!apiKey) {
      throw new HttpException('Missing Astrology API credentials', 500);
    }

    const [datePart, timePart] = dto.dateOfBirth.split('T');
    const [year, month, date] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    const data = JSON.stringify({
      date,
      month,
      year,
      hours,
      minutes,
      seconds: 0,
      latitude: dto.latitude,
      longitude: dto.longitude,
      timezone: dto.timezoneOffset,
    });

    const url = `https://json.freeastrologyapi.com/shadbala/break-up`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: data,
    });

    if (!response.ok) {
      const err = await response.json();
      console.log(response);
      throw new HttpException(err?.msg || 'Failed to fetch shadbala break up', response.status);
    }

    const responseData = (await response.json()).output;
    return {
      data: responseData,
    };
  }

  async getShadbalaSummary(dto: GetHoroscopeDto) {
    const { apiKey } = config.freeAstrology;

    if (!apiKey) {
      throw new HttpException('Missing Astrology API credentials', 500);
    }

    const [datePart, timePart] = dto.dateOfBirth.split('T');
    const [year, month, date] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    const data = JSON.stringify({
      date,
      month,
      year,
      hours,
      minutes,
      seconds: 0,
      latitude: dto.latitude,
      longitude: dto.longitude,
      timezone: dto.timezoneOffset,
    });

    const url = `https://json.freeastrologyapi.com/shadbala/summary`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: data,
    });

    if (!response.ok) {
      const err = await response.json();
      console.log(response);
      throw new HttpException(err?.msg || 'Failed to fetch shadbala summary', response.status);
    }

    const responseData = (await response.json()).output;
    return {
      data: responseData,
    };
  }

  async getAntarAndMahaDasas(dto: GetHoroscopeDto) {
    const { apiKey } = config.freeAstrology;

    if (!apiKey) {
      throw new HttpException('Missing Astrology API credentials', 500);
    }

    const [datePart, timePart] = dto.dateOfBirth.split('T');
    const [year, month, date] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    const data = JSON.stringify({
      date,
      month,
      year,
      hours,
      minutes,
      seconds: 0,
      latitude: dto.latitude,
      longitude: dto.longitude,
      timezone: dto.timezoneOffset,
    });

    const url = `https://json.freeastrologyapi.com/vimsottari/maha-dasas-and-antar-dasas`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: data,
    });

    if (!response.ok) {
      const err = await response.json();
      console.log(response);
      throw new HttpException(err?.msg || 'Failed to fetch antar and maha dasas', response.status);
    }

    let responseData = (await response.json())?.output;

    if (typeof responseData === 'string') {
      try {
        responseData = JSON.parse(responseData);
      } catch (e) {
        console.error('Failed to parse stringified JSON:', e);
      }
    }

    const flatData = this.flattenDashaData(responseData);

    return {
      data: flatData,
    };
  }
}
