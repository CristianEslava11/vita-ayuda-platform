import { Injectable, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { loadConfig } from '@vita-ayuda/config';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  private instance?: PrismaClient;

  get client(): PrismaClient {
    const { databaseUrl } = loadConfig();
    if (!databaseUrl) {
      throw new ServiceUnavailableException('La base de datos esta pendiente de configuracion.');
    }
    this.instance ??= new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    return this.instance;
  }

  async onModuleDestroy(): Promise<void> {
    await this.instance?.$disconnect();
  }
}
