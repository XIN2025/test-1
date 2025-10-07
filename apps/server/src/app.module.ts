import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module';
import { AstrologyApiModule } from './astrology-apis/astrology-api.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          targets: [
            {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: false,
                translateTime: 'yyyy-mm-dd HH:MM:ss.l',
                hideObject: true,
                ignore: 'pid,hostname',
                messageFormat: '[{req.id}] {req.method} {req.url} - {msg}  {res.statusCode} {responseTime}',
              },
            },
          ],
        },
        redact: ['req.headers', 'res.headers'],
        level: 'debug',
      },
    }),
    AuthModule,
    AstrologyApiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
