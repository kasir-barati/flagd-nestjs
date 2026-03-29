import { registerAs } from '@nestjs/config';
import { IsIn, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { LogLevel, LogMode, validateEnvs } from 'nestjs-backend-common';

import { AppConfig, DatabaseEngine } from '../../shared';

declare global {
  namespace NodeJS {
    interface ProcessEnv extends AppConfig {}
  }
}

export const appConfigs = registerAs('appConfigs', () => {
  const validatedEnvs = validateEnvs(process.env, EnvironmentVariables);

  return validatedEnvs;
});

class EnvironmentVariables implements AppConfig {
  @IsNumber()
  PORT: number;

  /** @example /docs */
  @IsString()
  @IsNotEmpty()
  SWAGGER_PATH: string;

  @IsString()
  @IsNotEmpty()
  SERVICE_NAME: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_ENGINE: DatabaseEngine;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  FLAGD_HOST: string;

  /** @example 8013 */
  @IsNumber()
  @IsNotEmpty()
  FLAGD_PORT: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['PLAIN_TEXT', 'JSON'])
  LOG_MODE: LogMode;

  @IsString()
  @IsNotEmpty()
  @IsIn(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'])
  LOG_LEVEL: LogLevel;
}
