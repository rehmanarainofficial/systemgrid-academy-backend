import { types } from 'pg';
// Postgres `timestamp without time zone` columns (@CreateDateColumn etc.) hold
// UTC, but the pg driver otherwise parses them in the server's local zone,
// which shifted every returned ISO string by the local offset (e.g. -5h in
// Pakistan). Force them to be read as UTC so timestamps are globally correct.
types.setTypeParser(1114, (value: string) =>
  new Date(`${value.replace(' ', 'T')}Z`),
);

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { rateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { requestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { securityHeadersMiddleware } from './common/middleware/security-headers.middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const frontendUrls = (process.env.FRONTEND_URL ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const apiPrefix = process.env.API_PREFIX ?? 'api/v1';
  const expressApp = app.getHttpAdapter().getInstance();

  expressApp.disable('etag');

  if (process.env.TRUST_PROXY === 'true') {
    expressApp.set('trust proxy', 1);
  }

  app.setGlobalPrefix(apiPrefix);
  app.enableCors({
    origin: frontendUrls,
    credentials: true,
  });
  app.use(securityHeadersMiddleware());
  app.use(rateLimitMiddleware());
  app.use(requestLoggingMiddleware());
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
