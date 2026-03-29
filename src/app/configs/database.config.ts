import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

import { FeatureFlagEntity } from '../../modules';
import { DatabaseEngine } from '../../shared';
import { appConfigs } from './app.config';

type TypeormDatabaseType = Exclude<DatabaseEngine, 'sqlite'> | 'better-sqlite3';

const DATABASE_TYPE_MAP: Record<DatabaseEngine, TypeormDatabaseType> = {
  postgres: 'postgres',
  mysql: 'mysql',
  mongodb: 'mongodb',
  mssql: 'mssql',
  sqlite: 'better-sqlite3',
};

@Injectable()
export class DatabaseModuleConfig implements TypeOrmOptionsFactory {
  constructor(
    @Inject(appConfigs.KEY)
    private readonly appConfig: ConfigType<typeof appConfigs>,
  ) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const type = DATABASE_TYPE_MAP[this.appConfig.DATABASE_ENGINE];
    const url =
      this.appConfig.DATABASE_ENGINE !== 'sqlite'
        ? this.appConfig.DATABASE_URL
        : undefined;
    const database =
      this.appConfig.DATABASE_ENGINE === 'sqlite'
        ? this.appConfig.DATABASE_URL
        : undefined;

    return {
      type,
      url,
      database,
      entities: [FeatureFlagEntity],
      synchronize: true,
    };
  }
}
