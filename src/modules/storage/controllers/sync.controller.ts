import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

import { SyncService } from '../services';

/**
 * @private endpoint consumed by flagd.
 * flagd polls this to sync flag definitions from the database.
 * Excluded from Swagger since it's not meant for end users.
 */
@ApiExcludeController()
@Controller('flagd')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('flags.json')
  async getFlags(): Promise<Record<string, unknown>> {
    return this.syncService.buildFlagConfiguration();
  }
}
