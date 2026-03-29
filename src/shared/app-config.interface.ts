import { LogLevel, LogMode } from 'nestjs-backend-common';

import { DatabaseEngine } from './database-engine.interface';

export interface AppConfig {
  PORT: number;
  SWAGGER_PATH: string;
  SERVICE_NAME: string;
  DATABASE_ENGINE: DatabaseEngine;
  DATABASE_URL: string;
  FLAGD_HOST: string;
  FLAGD_PORT: number;
  LOG_MODE: LogMode;
  LOG_LEVEL: LogLevel;
}
