import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { loadConfig } from '@vita-ayuda/config';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './shared/prisma-exception.filter';
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = loadConfig();
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.enableCors({ origin: config.frontendUrl, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.enableShutdownHooks();
  await app.listen(config.port, '127.0.0.1');
  console.log(`Vita Ayuda API: http://localhost:${config.port}/api/health`);
}
bootstrap().catch(() => { console.error('No fue posible iniciar el backend. Revisa la configuración local.'); process.exitCode = 1; });
