import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StorageController, SyncController } from './controllers';
import { FeatureFlagEntity } from './entities';
import { FEATURE_FLAG_REPOSITORY } from './interfaces';
import { FeatureFlagRepository } from './repositories';
import { StorageService, SyncService } from './services';

@Module({
  imports: [TypeOrmModule.forFeature([FeatureFlagEntity])],
  controllers: [StorageController, SyncController],
  providers: [
    StorageService,
    SyncService,
    {
      provide: FEATURE_FLAG_REPOSITORY,
      useClass: FeatureFlagRepository,
    },
  ],
  exports: [StorageService, SyncService],
})
export class StorageModule {}
