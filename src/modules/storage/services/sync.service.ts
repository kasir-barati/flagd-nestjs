import { Inject, Injectable } from '@nestjs/common';

import {
  FEATURE_FLAG_REPOSITORY,
  type IFeatureFlag,
  type IFeatureFlagRepository,
} from '../interfaces';

/**
 * @description builds the `flagd` flag configuration JSON from the database.
 * `flagd` polls the sync endpoint which delegates here.
 *
 * @see https://flagd.dev/reference/flag-definitions/
 */
@Injectable()
export class SyncService {
  constructor(
    @Inject(FEATURE_FLAG_REPOSITORY)
    private readonly featureFlagRepository: IFeatureFlagRepository,
  ) {}

  async buildFlagConfiguration(): Promise<Record<string, unknown>> {
    const flags = await this.featureFlagRepository.findAll();
    const flagsObject: Record<string, unknown> = {};

    for (const flag of flags) {
      flagsObject[flag.flagKey] = this.toFlagDefinition(flag);
    }

    return {
      $schema: 'https://flagd.dev/schema/v0/flags.json',
      flags: flagsObject,
    };
  }

  private toFlagDefinition(flag: IFeatureFlag): Record<string, unknown> {
    const definition: Record<string, unknown> = {
      state: flag.enabled ? 'ENABLED' : 'DISABLED',
      variants: flag.variants,
      defaultVariant: flag.defaultVariant,
    };

    if (flag.targeting && Object.keys(flag.targeting).length > 0) {
      definition.targeting = flag.targeting;
    }

    return definition;
  }
}
