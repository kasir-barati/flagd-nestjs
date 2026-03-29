import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { CreateFeatureFlagDto, UpdateFeatureFlagDto } from '../dtos';
import {
  FEATURE_FLAG_REPOSITORY,
  type IFeatureFlag,
  type IFeatureFlagRepository,
} from '../interfaces';

@Injectable()
export class StorageService {
  constructor(
    @Inject(FEATURE_FLAG_REPOSITORY)
    private readonly featureFlagRepository: IFeatureFlagRepository,
  ) {}

  async findAll(): Promise<IFeatureFlag[]> {
    return this.featureFlagRepository.findAll();
  }

  async findById(id: string): Promise<IFeatureFlag> {
    const flag = await this.featureFlagRepository.findById(id);

    if (!flag) {
      throw new NotFoundException(`Feature flag with id "${id}" not found`);
    }

    return flag;
  }

  async create(dto: CreateFeatureFlagDto): Promise<IFeatureFlag> {
    const existing = await this.featureFlagRepository.findByFlagKey(
      dto.flagKey,
    );

    if (existing) {
      throw new ConflictException(
        `Feature flag with key "${dto.flagKey}" already exists`,
      );
    }

    return this.featureFlagRepository.create(dto);
  }

  async update(id: string, dto: UpdateFeatureFlagDto): Promise<IFeatureFlag> {
    if (dto.flagKey) {
      const existing = await this.featureFlagRepository.findByFlagKey(
        dto.flagKey,
      );

      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Feature flag with key "${dto.flagKey}" already exists`,
        );
      }
    }

    const updated = await this.featureFlagRepository.update(id, dto);

    if (!updated) {
      throw new NotFoundException(`Feature flag with id "${id}" not found`);
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.featureFlagRepository.delete(id);

    if (!deleted) {
      throw new NotFoundException(`Feature flag with id "${id}" not found`);
    }
  }
}
