import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CorrelationIdModule, LoggerModule } from 'nestjs-backend-common';
import { ClsModule } from 'nestjs-cls';

import { StorageModule } from '../modules';
import {
  appConfigs,
  DatabaseModuleConfig,
  LoggerModuleConfig,
} from './configs';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfigs],
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    CorrelationIdModule.forRoot({
      global: true,
    }),
    LoggerModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useClass: LoggerModuleConfig,
    }),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseModuleConfig,
    }),
    StorageModule,
  ],
})
export class AppModule {}
