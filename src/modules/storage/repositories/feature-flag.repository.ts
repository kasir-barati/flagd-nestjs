import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { transformToId } from '../../../shared';
import { FeatureFlagEntity } from '../entities';
import type {
  ICreateFeatureFlag,
  IFeatureFlag,
  IFeatureFlagRepository,
  IUpdateFeatureFlag,
} from '../interfaces';

@Injectable()
export class FeatureFlagRepository implements IFeatureFlagRepository {
  constructor(
    @InjectRepository(FeatureFlagEntity)
    private readonly repository: Repository<FeatureFlagEntity>,
  ) {}

  async findAll(): Promise<IFeatureFlag[]> {
    const entities = await this.repository.find();

    return entities.map((entity) => this.toFeatureFlag(entity));
  }

  async findById(id: string): Promise<IFeatureFlag | null> {
    const entity = await this.repository.findOneBy({ id });

    return entity ? this.toFeatureFlag(entity) : null;
  }

  async findByFlagKey(flagKey: string): Promise<IFeatureFlag | null> {
    const entity = await this.repository.findOneBy({ flagKey });

    return entity ? this.toFeatureFlag(entity) : null;
  }

  async create(data: ICreateFeatureFlag): Promise<IFeatureFlag> {
    const entity = this.repository.create(data);
    const saved = await this.repository.save(entity);

    return this.toFeatureFlag(saved);
  }

  async update(
    id: string,
    data: IUpdateFeatureFlag,
  ): Promise<IFeatureFlag | null> {
    const entity = await this.repository.findOneBy({ id });

    if (!entity) {
      return null;
    }

    Object.assign(entity, data);
    const saved = await this.repository.save(entity);

    return this.toFeatureFlag(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete({ id });

    return (result.affected ?? 0) > 0;
  }

  private toFeatureFlag(entity: FeatureFlagEntity): IFeatureFlag {
    return transformToId({
      ...entity,
      flagKey: entity.flagKey,
      enabled: entity.enabled,
      variants: entity.variants,
      defaultVariant: entity.defaultVariant,
      targeting: entity.targeting,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }) as IFeatureFlag;
  }
}
