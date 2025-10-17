import { Module } from '@nestjs/common';
import { AstrologyApiService } from './astrology-api.service';
import { AstrologyApiController } from './astrology-api.controller';

@Module({
  imports: [],
  controllers: [AstrologyApiController],
  providers: [AstrologyApiService],
  exports: [AstrologyApiService],
})
export class AstrologyApiModule {}
