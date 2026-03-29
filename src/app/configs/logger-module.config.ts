import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { LoggerModuleOptionsFactory } from 'nestjs-backend-common';

import { appConfigs } from './app.config';

@Injectable()
export class LoggerModuleConfig implements LoggerModuleOptionsFactory {
  constructor(
    @Inject(appConfigs.KEY)
    private readonly appConfig: ConfigType<typeof appConfigs>,
  ) {}

  create() {
    return {
      logMode: this.appConfig.LOG_MODE,
      logLevel: this.appConfig.LOG_LEVEL,
    };
  }
}
